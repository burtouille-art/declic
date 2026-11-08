"""Éphéméride de Wikipédia (API Wikimedia « onthisday », contenu CC BY-SA).

Ces données sont structurées (année + phrase + lien), ce qui permet de produire
des questions fiables : « En quelle année… ? » avec l'année fournie par la source.
"""
from __future__ import annotations

import hashlib
from datetime import datetime

from .sanitize import safe_url, strip_html, truncate


def normalize_onthisday(payload: dict | None, month: int, day: int) -> list[dict]:
    if not isinstance(payload, dict):
        return []
    events = []
    for raw in payload.get("selected") or []:
        if not isinstance(raw, dict):
            continue
        text = strip_html(raw.get("text"))
        year = raw.get("year")
        if not text or not isinstance(year, int) or not (-3000 < year <= datetime.now().year):
            continue
        link = None
        page_title = None
        for page in raw.get("pages") or []:
            url = safe_url(((page.get("content_urls") or {}).get("desktop") or {}).get("page"))
            if url and "wikipedia.org/" in url:
                link = url
                page_title = strip_html((page.get("titles") or {}).get("normalized") or page.get("title"))
                break
        if not link:
            continue
        events.append({
            "id": "otd-" + hashlib.sha1(f"{month}-{day}-{year}-{text}".encode()).hexdigest()[:10],
            "year": year,
            "text": truncate(text, 300),
            "url": link,
            "pageTitle": page_title,
        })
    events.sort(key=lambda e: e["year"])
    return events


def _distractors(year: int, current_year: int) -> list[int]:
    offsets = [-37, -12, 9, 26, -61, 44, -5, 17]
    out: list[int] = []
    for off in offsets:
        cand = year + off
        if cand != year and cand <= current_year and cand not in out:
            out.append(cand)
        if len(out) == 3:
            break
    return out


def questions_from_events(events: list[dict], current_year: int) -> list[dict]:
    """Questions « En quelle année ? » dont la réponse vient de la donnée structurée."""
    questions = []
    for ev in events:
        if str(ev["year"]) in ev["text"] or ev["year"] < 1000:
            continue  # année déjà donnée dans la phrase, ou date antique ambiguë
        options = sorted([ev["year"], *_distractors(ev["year"], current_year)])
        if len(options) != 4:
            continue
        questions.append({
            "id": "q-" + ev["id"],
            "prompt": f"En quelle année : {ev['text'].rstrip('.')} ?",
            "options": [str(o) for o in options],
            "answer": options.index(ev["year"]),
            "explanation": f"C'était en {ev['year']}. Pour en savoir plus : l'article Wikipédia « {ev['pageTitle'] or 'source'} ».",
            "source": {"label": "Wikipédia — Éphéméride (CC BY-SA)", "url": ev["url"]},
        })
    return questions
