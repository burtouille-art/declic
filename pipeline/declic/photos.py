"""Photos d'illustration à licence libre (Wikimedia Commons), sans IA ni photo de presse.

Pour chaque titre d'information récent, on cherche le sujet cité (une personne ou un lieu),
puis sa photo de référence sur Wikidata (propriété P18), et on ne la garde que si :
- le titre Wikipédia correspond exactement au nom cité (pas de page d'homonymie) ;
- Wikidata confirme que c'est un être humain (P31 = Q5) ou un lieu (coordonnées P625), pas un pays ;
- Commons déclare une licence libre réutilisable (domaine public, CC0, CC BY, CC BY-SA) avec un auteur.

La photo est téléchargée en miniature et servie par le site (./data/img/), avec auteur, licence,
lien vers la licence et vers la page Commons. Elle illustre le sujet cité, pas l'événement :
le site l'indique (« illustration »).
"""
from __future__ import annotations

import hashlib
import html
import json
import re
import urllib.parse
from datetime import datetime, timedelta
from pathlib import Path
from typing import Callable

from .quiz import _find_country, candidate_entities, places_in
from .sanitize import fold

WIDTH = 800
CACHE_VERSION = 3          # à incrémenter quand les critères de choix changent (le cache est alors ignoré)
MAX_SUBJECTS = 90          # requêtes raisonnables à chaque collecte
CACHE_DAYS = 14
RECENT_HOURS = 72
WIKI_API = "https://fr.wikipedia.org/w/api.php"
COMMONS_API = "https://commons.wikimedia.org/w/api.php"
SPARQL = "https://query.wikidata.org/sparql"

# Licences acceptées (valeur « License » de Commons, normalisée) : domaine public, CC0, CC BY, CC BY-SA.
_FREE = re.compile(r"^(pd|public domain|cc0|cc-zero|cc-by-(sa-)?\d(\.\d)?([-a-z]*)?)$")
_BAD_FILE = re.compile(r"(logo|flag|drapeau|coat[_ ]of[_ ]arms|blason|armoiries|map|carte|locator|signature|\.svg$|\.gif$|\.tif)", re.I)
# Pour une personne : pas une œuvre, une tombe, une plaque… ; pour un lieu : pas de scène de guerre ou de drame.
_NOT_PORTRAIT = re.compile(r"(museum|musee|collection|untitled|statue|sculpture|painting|tableau|grave|tomb|tombe|plaque|memorial|signature|book|livre|poster|affiche)", re.I)
_HARSH_PLACE = re.compile(r"(war|guerre|bomb|destr|ruin|attack|attaque|explosion|victim|dead|mort|funeral|refugee|missile|strike|fire|incendie|flood|inondation|earthquake|seisme)", re.I)
_SINGLE_PLACE = re.compile(r"(?:^|[\s(])(?:à|au|aux|en)\s+([A-ZÉÈÀÂÎÔÛÇ][\w’'-]{3,})(?=[\s,.:;!?»)]|$)")


def subjects_for(title: str, known: set[str], places: set[str]) -> list[str]:
    """Personnes et lieux cités dans un titre, dans l'ordre d'apparition (le premier est en général le sujet)."""
    found: list[tuple[int, str]] = []
    for ent in candidate_entities(title, known):
        found.append((title.find(ent), ent))
    for m in _SINGLE_PLACE.finditer(title):
        name = m.group(1)
        if not _find_country(name) and fold(name) not in {"france", "europe"}:
            found.append((m.start(1), name))
    seen, out = set(), []
    for _, s in sorted(found):
        if fold(s) not in seen:
            seen.add(fold(s))
            out.append(s)
    return out


def _chunks(items: list[str], n: int):
    for i in range(0, len(items), n):
        yield items[i:i + n]


def _strip_html(value: str) -> str:
    text = html.unescape(re.sub(r"<[^>]+>", " ", value or ""))
    return re.sub(r"\s+", " ", text).strip()


def _qids(names: list[str], fetch_json) -> dict[str, tuple[str, str]]:
    """Nom cité -> (titre Wikipédia, QID), sans homonymie ni page absente."""
    out: dict[str, tuple[str, str]] = {}
    for chunk in _chunks(names, 50):
        params = {"action": "query", "titles": "|".join(chunk), "prop": "pageprops", "ppprop": "disambiguation|wikibase_item",
                  "redirects": "1", "format": "json", "formatversion": "2"}
        data, _ = fetch_json(f"{WIKI_API}?{urllib.parse.urlencode(params)}")
        q = (data or {}).get("query") or {}
        alias: dict[str, str] = {}
        for step in (q.get("normalized") or []) + (q.get("redirects") or []):
            alias[step["from"]] = step["to"]
        pages = {p.get("title"): p for p in q.get("pages") or []}
        for name in chunk:
            t = name
            for _ in range(3):
                t = alias.get(t, t)
            page = pages.get(t)
            props = (page or {}).get("pageprops") or {}
            if page and not page.get("missing") and "disambiguation" not in props and props.get("wikibase_item"):
                out[name] = (t, props["wikibase_item"])
    return out


def _wikidata(qids: list[str], fetch_json) -> dict[str, dict]:
    """QID -> {"file": nom du fichier P18, "human": bool, "place": bool, "country": bool}."""
    out: dict[str, dict] = {}
    for chunk in _chunks(qids, 60):
        values = " ".join(f"wd:{q}" for q in chunk)
        query = (
            "SELECT ?item (SAMPLE(?img) AS ?image) (MAX(?h) AS ?human) (MAX(?p) AS ?place) (MAX(?c) AS ?country) WHERE {"
            f" VALUES ?item {{ {values} }}"
            " OPTIONAL { ?item wdt:P18 ?img }"
            " BIND(EXISTS { ?item wdt:P31 wd:Q5 } AS ?h)"
            " BIND(EXISTS { ?item wdt:P625 ?coord } AS ?p)"
            " BIND(EXISTS { VALUES ?ct { wd:Q6256 wd:Q3624078 } ?item wdt:P31 ?ct } AS ?c)"
            " } GROUP BY ?item"
        )
        data, _ = fetch_json(f"{SPARQL}?{urllib.parse.urlencode({'query': query, 'format': 'json'})}")
        for row in ((data or {}).get("results") or {}).get("bindings") or []:
            qid = row["item"]["value"].rsplit("/", 1)[-1]
            img = (row.get("image") or {}).get("value")
            truthy = lambda k: (row.get(k) or {}).get("value") in ("true", "1")  # noqa: E731
            out[qid] = {
                "file": urllib.parse.unquote(img.rsplit("/", 1)[-1]).replace("_", " ") if img else None,
                "human": truthy("human"), "place": truthy("place"), "country": truthy("country"),
            }
    return out


def _commons(files: list[str], fetch_json) -> dict[str, dict]:
    """Nom de fichier -> métadonnées de licence et miniature, seulement si la licence est libre."""
    out: dict[str, dict] = {}
    for chunk in _chunks(files, 40):
        params = {
            "action": "query", "titles": "|".join(f"File:{f}" for f in chunk), "prop": "imageinfo",
            "iiprop": "url|extmetadata|mime|size", "iiurlwidth": str(WIDTH),
            "iiextmetadatafilter": "LicenseShortName|License|Artist|LicenseUrl|AttributionRequired|NonFree|Restrictions",
            "format": "json", "formatversion": "2",
        }
        data, _ = fetch_json(f"{COMMONS_API}?{urllib.parse.urlencode(params)}")
        for page in ((data or {}).get("query") or {}).get("pages") or []:
            info = (page.get("imageinfo") or [None])[0]
            if not info:
                continue
            name = page["title"].split(":", 1)[-1]
            meta = {k: _strip_html(str(v.get("value", ""))) for k, v in (info.get("extmetadata") or {}).items()}
            license_code = meta.get("License", "").lower()
            artist = meta.get("Artist", "")[:90]
            ok = (
                bool(_FREE.match(license_code))
                and meta.get("NonFree", "").lower() not in ("true", "1")
                and info.get("mime") in ("image/jpeg", "image/png", "image/webp")
                and (info.get("width") or 0) >= 400
                and info.get("thumburl", "").startswith("https://")
                and (artist or license_code.startswith(("pd", "public", "cc0")))
                and not _BAD_FILE.search(name)
            )
            if ok:
                out[name] = {
                    "thumb": info["thumburl"],
                    "width": info.get("thumbwidth"),
                    "height": info.get("thumbheight"),
                    "credit": artist or "Domaine public",
                    "license": meta.get("LicenseShortName") or license_code.upper(),
                    "licenseUrl": meta.get("LicenseUrl") or None,
                    "sourceUrl": info.get("descriptionurl"),
                }
    return out


def _image_ext(body: bytes | None) -> str | None:
    """Type réel du fichier (on ne se fie pas à l'URL)."""
    if not body:
        return None
    if body[:3] == b"\xff\xd8\xff":
        return "jpg"
    if body[:8] == b"\x89PNG\r\n\x1a\n":
        return "png"
    if body[:4] == b"RIFF" and body[8:12] == b"WEBP":
        return "webp"
    return None


def _portrait_of(subject: str, file: str) -> bool:
    """La photo de référence d'une personne doit la nommer (évite œuvres, photos de groupe mal cadrées).
    Exception : nom de fichier dans un autre alphabet (cyrillique, hébreu…), impossible à comparer."""
    if _NOT_PORTRAIT.search(file):
        return False
    latin = sum(ch.isascii() and ch.isalpha() for ch in fold(file))
    letters = sum(ch.isalpha() for ch in file)
    if letters and latin / letters < 0.5:
        return True
    tokens = [w for w in re.findall(r"[a-z]+", fold(subject)) if len(w) >= 3]
    return any(t in fold(file) for t in tokens)


def _resolve(names: list[str], fetch_json) -> dict[str, dict | None]:
    """Nom cité -> photo vérifiée (ou None)."""
    result: dict[str, dict | None] = {n: None for n in names}
    titles = _qids(names, fetch_json)
    facts = _wikidata(sorted({q for _, q in titles.values()}), fetch_json)
    candidates: dict[str, tuple[str, str, str]] = {}
    for name, (title, qid) in titles.items():
        f = facts.get(qid) or {}
        file = f.get("file")
        if not file or f.get("country") or not (f.get("human") or f.get("place")):
            continue
        if f.get("human") and not _portrait_of(title, file):
            continue
        if not f.get("human") and _HARSH_PLACE.search(file):
            continue
        candidates[name] = (title, file, "person" if f.get("human") else "place")
    licensed = _commons(sorted({file for _, file, _ in candidates.values()}), fetch_json)
    for name, (title, file, kind) in candidates.items():
        meta = licensed.get(file)
        if meta:
            result[name] = {**meta, "subject": title, "subjectKind": kind, "file": file}
    return result


def attach_photos(
    articles: list[dict],
    now: datetime,
    out_dir: Path,
    fetch_json: Callable,
    fetch_bytes: Callable,
    cache: dict | None = None,
    importance: Callable | None = None,
) -> dict:
    """Ajoute une photo d'illustration aux titres récents qui n'en ont pas. Renvoie le cache mis à jour et des statistiques."""
    valid = (cache or {}).get("version") == CACHE_VERSION
    cache_entries: dict[str, dict] = dict((cache or {}).get("entries") or {}) if valid else {}
    fresh_limit = (now - timedelta(days=CACHE_DAYS)).isoformat()
    recent_limit = (now - timedelta(hours=RECENT_HOURS)).isoformat()
    eligible = [a for a in articles if not a.get("image") and a.get("lang") == "fr" and a.get("kind", "news") in ("news", "institution")
                and a["publishedAt"] >= recent_limit]
    if importance:
        eligible.sort(key=importance, reverse=True)
    titles = [a["title"] for a in articles if a.get("lang") == "fr"]
    known = {fold(e) for t in titles for e in candidate_entities(t)}
    places = places_in(titles)

    per_article: dict[str, list[str]] = {}
    wanted: list[str] = []
    for art in eligible:
        subs = subjects_for(art["title"], known, places)
        per_article[art["id"]] = subs
        for s in subs:
            if s not in wanted:
                wanted.append(s)
    wanted = wanted[:MAX_SUBJECTS]
    to_query = [s for s in wanted if not (fold(s) in cache_entries and cache_entries[fold(s)].get("checkedAt", "") >= fresh_limit)]
    if to_query:
        for name, photo in _resolve(to_query, fetch_json).items():
            cache_entries[fold(name)] = {"checkedAt": now.isoformat(timespec="seconds"), "photo": photo}

    img_dir = out_dir / "img"
    img_dir.mkdir(parents=True, exist_ok=True)
    downloaded: dict[str, str | None] = {}
    attached = 0
    for art in eligible:
        for s in per_article.get(art["id"], []):
            photo = (cache_entries.get(fold(s)) or {}).get("photo")
            if not photo:
                continue
            key = hashlib.sha1(photo["file"].encode("utf-8")).hexdigest()[:16]
            if photo["file"] not in downloaded:
                existing = next(img_dir.glob(key + ".*"), None)
                if existing:
                    downloaded[photo["file"]] = existing.name
                else:
                    body, _ = fetch_bytes(photo["thumb"])
                    ext = _image_ext(body)
                    if not body or not ext or len(body) > 1_500_000:
                        downloaded[photo["file"]] = None
                        continue
                    (img_dir / f"{key}.{ext}").write_bytes(body)
                    downloaded[photo["file"]] = f"{key}.{ext}"
            if not downloaded[photo["file"]]:
                continue
            art["image"] = {
                "url": f"./data/img/{downloaded[photo['file']]}",
                "credit": photo["credit"],
                "license": photo["license"],
                "licenseUrl": photo.get("licenseUrl"),
                "sourceUrl": photo.get("sourceUrl"),
                "width": photo.get("width"),
                "height": photo.get("height"),
                "illustration": True,
                "subject": photo["subject"],
                "subjectKind": photo.get("subjectKind"),
            }
            attached += 1
            break
    # Le cache ne garde que les sujets récents.
    keep = {k: v for k, v in cache_entries.items() if v.get("checkedAt", "") >= fresh_limit}
    used = set(downloaded.values())
    for f in img_dir.iterdir():
        if f.name not in used:
            f.unlink()
    return {"cache": {"version": CACHE_VERSION, "entries": keep}, "attached": attached, "queried": len(to_query), "images": len(used - {None})}
