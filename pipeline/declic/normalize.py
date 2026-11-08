"""Transformation d'une entrée de flux (feedparser ou instantané JSON) en article DÉCLIC.

Règles éditoriales appliquées ici :
- le titre est conservé tel que publié par le média (titre original) ;
- le résumé est UNIQUEMENT le chapô/description fourni par le flux, nettoyé et tronqué.
  Rien n'est généré. Si la description est vide ou ne fait que répéter le titre, résumé = None ;
- une image n'est retenue que si la source a un droit de réutilisation identifié
  (champ "images.allowed" dans sources.json) ET que l'hôte de l'image est attendu.
"""
from __future__ import annotations

import hashlib
import re
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from time import struct_time
from urllib.parse import urlsplit

from .classify import classify
from .sanitize import canonical_url, fold, safe_url, strip_html, truncate

TITLE_MAX = 220
SUMMARY_MAX = 320
_LIVE_PREFIX = re.compile(r"^[\W_]*(?:en direct|direct|live)\s*[:\-–—]\s*", re.I)


def parse_date(entry: dict) -> datetime | None:
    for key in ("published_parsed", "updated_parsed"):
        value = entry.get(key)
        if isinstance(value, struct_time):
            try:
                return datetime(*value[:6], tzinfo=timezone.utc)
            except (TypeError, ValueError):
                pass
    for key in ("published", "updated", "pubDate"):
        raw = entry.get(key)
        if not raw:
            continue
        try:
            dt = parsedate_to_datetime(raw)
        except (TypeError, ValueError, IndexError):
            try:
                dt = datetime.fromisoformat(str(raw).replace("Z", "+00:00"))
            except ValueError:
                continue
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.astimezone(timezone.utc)
    return None


def _summary(entry: dict, title: str) -> str | None:
    raw = entry.get("summary") or entry.get("description") or ""
    text = strip_html(raw)
    if not text:
        return None
    ft, fs = fold(title).strip(" .!?"), fold(text)
    # Certains flux préfixent la description par le titre : on l'enlève.
    if ft and fs.startswith(ft):
        text = text[len(title):].lstrip(" .:–—-")
        fs = fold(text)
    if len(text) < 40 or fs.strip(" .!?") == ft:
        return None
    return truncate(text, SUMMARY_MAX)


def _image(entry: dict, source: dict) -> dict | None:
    rights = source.get("images") or {}
    if not rights.get("allowed"):
        return None
    candidates: list[str] = []
    for media in entry.get("media_content") or []:
        if isinstance(media, dict) and media.get("url"):
            if (media.get("medium") in (None, "image")) or str(media.get("type", "")).startswith("image"):
                candidates.append(media["url"])
    for media in entry.get("media_thumbnail") or []:
        if isinstance(media, dict) and media.get("url"):
            candidates.append(media["url"])
    for link in entry.get("enclosures") or entry.get("links") or []:
        if isinstance(link, dict) and str(link.get("type", "")).startswith("image") and link.get("href"):
            candidates.append(link["href"])
    if entry.get("image"):
        candidates.append(entry["image"])
    # Image inline du contenu (NASA place l'illustration dans content:encoded)
    for content in entry.get("content") or []:
        value = content.get("value", "") if isinstance(content, dict) else ""
        m = re.search(r"<img[^>]+src=[\"']([^\"']+)[\"']", value)
        if m:
            candidates.append(m.group(1))
    hosts = set(rights.get("hosts") or [])
    for url in candidates:
        url = safe_url(url)
        if not url or not url.startswith("https://"):
            continue
        if hosts and urlsplit(url).netloc not in hosts:
            continue
        if not re.search(r"\.(jpe?g|png|webp)(\?|$)", url, re.I):
            continue
        return {"url": url, "credit": rights.get("credit", source["name"]), "license": rights.get("license", "")}
    return None


def normalize_entry(entry: dict, source: dict, now: datetime) -> dict | None:
    """Renvoie un article validé, ou None si l'entrée est inexploitable."""
    url = safe_url(entry.get("link"))
    title = strip_html(entry.get("title"))
    title = _LIVE_PREFIX.sub("", title).strip()
    if not url or len(title) < 8:
        return None
    published = parse_date(entry)
    if published is None:
        return None
    if published > now:
        # Date dans le futur (fuseau mal déclaré) : on borne à "maintenant".
        published = now
    title = truncate(title, TITLE_MAX)
    summary = _summary(entry, title)
    canon = canonical_url(url)
    return {
        "id": hashlib.sha1(canon.encode()).hexdigest()[:16],
        "title": title,
        "url": url,
        "canonicalUrl": canon,
        "sourceId": source["id"],
        "sourceName": source["name"],
        "sourceHome": source.get("homepage"),
        "lang": source.get("lang", "fr"),
        "kind": source.get("kind", "news"),
        "publishedAt": published.isoformat(timespec="seconds"),
        "summary": summary,
        "categories": classify(title, summary or "", url, source.get("category")),
        "image": _image(entry, source),
    }
