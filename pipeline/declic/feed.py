"""Flux RSS « À la une » de DÉCLIC (public/data/une.xml).

Pensé pour les widgets d'écran d'accueil (applis de lecture RSS) : une dizaine de titres
importants, en français, variés (médias et rubriques), chacun renvoyant vers l'article
ORIGINAL du média. Rien n'est réécrit : titre et chapô sont ceux publiés par le média.

La sélection reprend les critères de `importance()` / `topStories()` côté site
(src/lib/news.ts) : couverture par plusieurs médias > fraîcheur > chapô > langue.
"""
from __future__ import annotations

from datetime import datetime, timezone
from email.utils import format_datetime
from xml.etree import ElementTree as ET

CATEGORY_LABELS = {
    "monde": "Monde", "france": "France", "societe": "Société", "sciences": "Sciences",
    "technologie": "Technologie", "ia": "IA", "espace": "Espace", "histoire": "Histoire",
    "economie": "Économie", "environnement": "Environnement", "sante": "Santé",
    "culture": "Culture", "sport": "Sport", "insolite": "Insolite",
}


def _importance(art: dict, coverage: dict[str, int], now: datetime) -> float:
    hours = (now - datetime.fromisoformat(art["publishedAt"])).total_seconds() / 3600
    cov = coverage.get(art.get("clusterId") or "", 1)
    return (cov - 1) * 3 + max(0.0, 24 - hours) / 8 + (1 if art.get("summary") else 0) + (0.5 if art.get("kind") == "news" else 0)


def select_une(articles: list[dict], clusters: list[dict], now: datetime, n: int = 10) -> list[dict]:
    """Les n titres principaux en français, sans doublon d'événement, médias et rubriques variés."""
    coverage = {c["id"]: c.get("sourceCount", 1) for c in clusters}
    pool = [a for a in articles if a.get("lang") == "fr" and a["categories"][0] != "insolite" and a.get("kind") != "opinion"]
    ranked = sorted(pool, key=lambda a: _importance(a, coverage, now), reverse=True)
    out: list[dict] = []
    used_clusters: set[str] = set()
    per_source: dict[str, int] = {}
    per_cat: dict[str, int] = {}
    # 1er passage : au plus 2 titres par média et par rubrique ; 2e passage : on complète.
    for strict in (True, False):
        for a in ranked:
            if len(out) >= n:
                break
            if a in out or (a.get("clusterId") and a["clusterId"] in used_clusters):
                continue
            src, cat = a["sourceName"], a["categories"][0]
            if strict and (per_source.get(src, 0) >= 2 or per_cat.get(cat, 0) >= 2):
                continue
            out.append(a)
            if a.get("clusterId"):
                used_clusters.add(a["clusterId"])
            per_source[src] = per_source.get(src, 0) + 1
            per_cat[cat] = per_cat.get(cat, 0) + 1
    return out


def build_rss(items: list[dict], site_url: str, now: datetime) -> bytes:
    site = site_url.rstrip("/") + "/" if site_url else ""
    rss = ET.Element("rss", {"version": "2.0", "xmlns:atom": "http://www.w3.org/2005/Atom"})
    ch = ET.SubElement(rss, "channel")
    ET.SubElement(ch, "title").text = "DÉCLIC — À la une"
    ET.SubElement(ch, "link").text = site or "https://github.com/burtouille-art/declic"
    ET.SubElement(ch, "description").text = (
        "Les titres principaux du moment, sélectionnés parmi des médias francophones. "
        "Chaque lien ouvre l'article original chez le média."
    )
    ET.SubElement(ch, "language").text = "fr"
    ET.SubElement(ch, "lastBuildDate").text = format_datetime(now.astimezone(timezone.utc))
    ET.SubElement(ch, "ttl").text = "360"
    if site:
        ET.SubElement(ch, "atom:link", {"href": site + "data/une.xml", "rel": "self", "type": "application/rss+xml"})
        img = ET.SubElement(ch, "image")
        ET.SubElement(img, "url").text = site + "icons/icon-192.png"
        ET.SubElement(img, "title").text = "DÉCLIC — À la une"
        ET.SubElement(img, "link").text = site
    for a in items:
        it = ET.SubElement(ch, "item")
        label = CATEGORY_LABELS.get(a["categories"][0], "")
        # Le nom du média en tête du titre : il reste visible dans les widgets qui n'affichent que le titre.
        ET.SubElement(it, "title").text = f"{a['sourceName']} · {a['title']}"
        ET.SubElement(it, "link").text = a["url"]
        ET.SubElement(it, "guid", {"isPermaLink": "false"}).text = f"declic-{a['id']}"
        ET.SubElement(it, "pubDate").text = format_datetime(datetime.fromisoformat(a["publishedAt"]).astimezone(timezone.utc))
        ET.SubElement(it, "source", {"url": a.get("sourceHome") or a["url"]}).text = a["sourceName"]
        if label:
            ET.SubElement(it, "category").text = label
        desc = f"{label} · {a['sourceName']}"
        if a.get("summary"):
            desc += f" — {a['summary']}"
        ET.SubElement(it, "description").text = desc
    ET.indent(rss)
    return b'<?xml version="1.0" encoding="UTF-8"?>\n' + ET.tostring(rss, encoding="utf-8")
