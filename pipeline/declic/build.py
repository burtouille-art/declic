"""Orchestration : collecte -> normalisation -> fraîcheur -> déduplication ->
classification -> rapprochements -> JSON. Conserve les dernières données valides.
"""
from __future__ import annotations

import json
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Callable

from .cluster import build_clusters
from .fetch import FetchResult, fetch_feed, fetch_json
from .normalize import normalize_entry
from .onthisday import normalize_onthisday, questions_from_events
from .sanitize import fold

SCHEMA_VERSION = 1
MAX_AGE_DAYS = 7          # fraîcheur : au-delà, un article n'est plus affiché
PER_SOURCE_MAX = 30       # nombre maximal d'articles retenus par flux
TOTAL_MAX = 600
MIN_ARTICLES = 15         # en dessous, la collecte est jugée défaillante

ARTICLE_KEYS = {
    "id": str, "title": str, "url": str, "sourceId": str, "sourceName": str, "lang": str,
    "kind": str, "publishedAt": str, "categories": list,
}


def validate_article(art: dict) -> bool:
    for key, typ in ARTICLE_KEYS.items():
        if not isinstance(art.get(key), typ):
            return False
    if not art["url"].startswith(("https://", "http://")) or not art["categories"]:
        return False
    if art.get("summary") is not None and not isinstance(art["summary"], str):
        return False
    try:
        datetime.fromisoformat(art["publishedAt"])
    except ValueError:
        return False
    return True


def _load_json(path: Path | None) -> dict | None:
    if not path or not path.exists():
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return None


def _write_json(path: Path, data: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(".tmp")
    tmp.write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")
    tmp.replace(path)  # écriture atomique


def _fresh(art: dict, now: datetime) -> bool:
    try:
        return datetime.fromisoformat(art["publishedAt"]) >= now - timedelta(days=MAX_AGE_DAYS)
    except (KeyError, ValueError):
        return False


def merge_duplicates(articles: list[dict]) -> list[dict]:
    """Déduplication par URL canonique puis par titre identique chez un même média."""
    by_url: dict[str, dict] = {}
    for art in articles:
        key = art.get("canonicalUrl") or art["url"]
        existing = by_url.get(key)
        if existing is None:
            by_url[key] = art
            continue
        # Fusion des rubriques : la rubrique d'un flux thématique passe devant.
        first, second = (art, existing) if art.get("_specific") and not existing.get("_specific") else (existing, art)
        cats = list(dict.fromkeys(first["categories"] + second["categories"]))
        keep = dict(first)
        keep["categories"] = cats
        keep["summary"] = first.get("summary") or second.get("summary")
        keep["image"] = first.get("image") or second.get("image")
        keep["_specific"] = first.get("_specific") or second.get("_specific")
        by_url[key] = keep
    seen_titles: dict[tuple[str, str], dict] = {}
    for art in by_url.values():
        tkey = (art["sourceName"], fold(art["title"]).strip())
        if tkey not in seen_titles or art["publishedAt"] > seen_titles[tkey]["publishedAt"]:
            seen_titles[tkey] = art
    return list(seen_titles.values())


def run(
    config: dict,
    out_dir: Path,
    previous_dir: Path | None = None,
    seed: dict | None = None,
    now: datetime | None = None,
    fetcher: Callable[[str], FetchResult] = fetch_feed,
    json_fetcher: Callable[[str], tuple[dict | None, str | None]] = fetch_json,
) -> dict:
    started = time.monotonic()
    now = now or datetime.now(timezone.utc)
    prev_news = _load_json(previous_dir / "news.json" if previous_dir else None) or _load_json(out_dir / "news.json")
    prev_status = _load_json(previous_dir / "status.json" if previous_dir else None) or _load_json(out_dir / "status.json")
    prev_sources = {s["id"]: s for s in (prev_status or {}).get("sources", [])}
    prev_by_source: dict[str, list[dict]] = {}
    for art in (prev_news or {}).get("articles", []):
        if validate_article(art):
            prev_by_source.setdefault(art["sourceId"], []).append(art)

    collected: list[dict] = []
    statuses: list[dict] = []
    for src in config["sources"]:
        if seed is not None:
            items = seed.get(src["id"])
            result = FetchResult(ok=True, entries=items, http_status=None) if items else FetchResult(ok=False, error="absent de l'instantané")
        else:
            result = fetcher(src["url"])
        kept: list[dict] = []
        if result.ok:
            for entry in result.entries:
                art = normalize_entry(entry, src, now)
                if art and validate_article(art) and _fresh(art, now):
                    art["_specific"] = src.get("category") is not None
                    kept.append(art)
            kept.sort(key=lambda a: a["publishedAt"], reverse=True)
            kept = kept[:PER_SOURCE_MAX]
        used_fallback = False
        if not result.ok:
            fallback = [a for a in prev_by_source.get(src["id"], []) if _fresh(a, now)]
            for a in fallback:
                a = dict(a)
                a["_specific"] = src.get("category") is not None
                kept.append(a)
            used_fallback = bool(fallback)
        collected.extend(kept)
        prev = prev_sources.get(src["id"], {})
        statuses.append({
            "id": src["id"],
            "name": src["name"],
            "url": src["url"],
            "lang": src.get("lang"),
            "category": src.get("category"),
            "ok": result.ok,
            "httpStatus": result.http_status,
            "error": result.error,
            "entries": len(result.entries),
            "kept": len(kept),
            "usedFallback": used_fallback,
            "newestItemAt": max((a["publishedAt"] for a in kept), default=None),
            "lastSuccessAt": now.isoformat(timespec="seconds") if result.ok else prev.get("lastSuccessAt"),
            "warning": ("aucun article de moins de %d jours" % MAX_AGE_DAYS) if result.ok and not kept else None,
        })

    articles = merge_duplicates(collected)
    articles.sort(key=lambda a: a["publishedAt"], reverse=True)
    articles = articles[:TOTAL_MAX]
    clusters = build_clusters(articles)
    for art in articles:
        art.pop("_specific", None)
        art.pop("canonicalUrl", None)

    kept_previous = False
    if len(articles) < MIN_ARTICLES and prev_news and len(prev_news.get("articles", [])) >= MIN_ARTICLES:
        # Collecte défaillante : on republie les dernières données valides.
        news = prev_news
        kept_previous = True
    else:
        sources_meta = {}
        for src in config["sources"]:
            sources_meta.setdefault(src["name"], {"name": src["name"], "homepage": src.get("homepage"), "lang": src.get("lang"), "kind": src.get("kind", "news")})
        news = {
            "version": SCHEMA_VERSION,
            "generatedAt": now.isoformat(timespec="seconds"),
            "maxAgeDays": MAX_AGE_DAYS,
            "snapshot": seed is not None,
            "articles": articles,
            "clusters": clusters,
            "sources": list(sources_meta.values()),
        }

    # Éphéméride : aujourd'hui et demain (le site choisit selon la date locale du lecteur).
    otd_cfg = config.get("onThisDay")
    prev_otd = _load_json(previous_dir / "onthisday.json" if previous_dir else None) or _load_json(out_dir / "onthisday.json") or {}
    otd_days: dict[str, dict] = {}
    otd_status = None
    if otd_cfg and seed is None:
        errors = []
        for delta in (0, 1):
            d = now + timedelta(days=delta)
            key = f"{d.month:02d}-{d.day:02d}"
            payload, err = json_fetcher(otd_cfg["urlTemplate"].format(mm=f"{d.month:02d}", dd=f"{d.day:02d}"))
            events = normalize_onthisday(payload, d.month, d.day)
            if events:
                otd_days[key] = {"events": events, "questions": questions_from_events(events, now.year)}
            elif key in (prev_otd.get("days") or {}):
                otd_days[key] = prev_otd["days"][key]
            if err:
                errors.append(err)
        otd_status = {"id": otd_cfg["id"], "name": otd_cfg["name"], "ok": not errors, "error": "; ".join(errors) or None, "days": sorted(otd_days)}
    elif seed is not None and seed.get("_onthisday"):
        for key, payload in seed["_onthisday"].items():
            m, d = (int(x) for x in key.split("-"))
            events = normalize_onthisday(payload, m, d)
            if events:
                otd_days[key] = {"events": events, "questions": questions_from_events(events, now.year)}
    onthisday = {
        "generatedAt": now.isoformat(timespec="seconds"),
        "license": (otd_cfg or {}).get("license"),
        "days": otd_days or prev_otd.get("days", {}),
    }

    status = {
        "generatedAt": now.isoformat(timespec="seconds"),
        "durationMs": int((time.monotonic() - started) * 1000),
        "mode": "snapshot" if seed is not None else "live",
        "keptPreviousData": kept_previous,
        "articleCount": len(news.get("articles", [])),
        "clusterCount": len(news.get("clusters", [])),
        "sourcesOk": sum(1 for s in statuses if s["ok"]),
        "sourcesTotal": len(statuses),
        "maxAgeDays": MAX_AGE_DAYS,
        "sources": statuses,
        "onThisDay": otd_status,
    }

    out_dir.mkdir(parents=True, exist_ok=True)
    _write_json(out_dir / "news.json", news)
    _write_json(out_dir / "status.json", status)
    _write_json(out_dir / "onthisday.json", onthisday)
    return status
