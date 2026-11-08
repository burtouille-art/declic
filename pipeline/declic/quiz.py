"""Quiz de l'actu (public/data/quiz.json).

Toutes les questions sont construites à partir des TITRES RÉELS du jour : la bonne réponse
est toujours un élément présent mot pour mot dans le titre publié par le média.
Rien n'est inventé, aucune IA n'est utilisée.

Types de questions :
- « pays »   : texte à trous, le pays cité dans le titre est masqué ;
- « qui »    : texte à trous, la personne ou l'organisation citée est masquée ;
- « nombre » : texte à trous, le chiffre clé (morts, %, millions…) est masqué ;
- « angle »  : même événement couvert par plusieurs médias : retrouver le titre d'un média donné
               (apprendre à repérer les différences de traitement).

Chaque question renvoie vers l'article original et, quand ils existent, vers les titres
des autres médias qui couvrent le même événement.
"""
from __future__ import annotations

import hashlib
import json
import random
import re
from datetime import datetime, timedelta
from pathlib import Path

from .sanitize import fold

MASK = "……"
_COUNTRIES = json.loads((Path(__file__).resolve().parents[1] / "data" / "countries.json").read_text(encoding="utf-8"))["countries"]

# Noms français uniquement (+ quelques variantes françaises) : le quiz porte sur des titres en français.
_FRENCH_ALIASES = {"Etats-Unis", "RDC", "République tchèque", "Viet Nam"}
_COUNTRY_FORMS: list[tuple[str, dict]] = []
for c in _COUNTRIES:
    for f in [c["name"], *[a for a in c["aliases"] if a in _FRENCH_ALIASES]]:
        _COUNTRY_FORMS.append((f, c))
_COUNTRY_FORMS.sort(key=lambda x: -len(x[0]))

_NUMBER = re.compile(
    r"(?<![\w.,])(\d{1,3}(?:[   ]\d{3})+|\d+)(?:,(\d+))?"
    r"(\s*(?:%|pour cent|personnes|morts|blessés|victimes|migrants|habitants|enfants|élèves|salariés|emplois|"
    r"millions|milliards|euros|dollars|km|kilomètres|degrés|mètres|tonnes|ans|jours|heures|signatures|logements))\b",
    re.I,
)
_ENTITY = re.compile(r"(?<![\w’'-])([A-ZÉÈÀÂÎÔÛÇ][\w’'-]+(?:[  ](?:de |d’|d'|van |von |al-|el-)?[A-ZÉÈÀÂÎÔÛÇ][\w’'-]+){1,2})")
_ENTITY_STOP_FIRST = {
    "le", "la", "les", "un", "une", "des", "en", "au", "aux", "ce", "cette", "pour", "dans", "sur", "selon",
    "apres", "avant", "comment", "pourquoi", "quand", "qui", "que", "quel", "quelle", "faut", "il", "elle",
    "on", "nous", "vous", "ils", "elles", "france", "europe", "monde", "direct", "video", "info", "jeux", "grand",
    "coupe", "ligue", "premier", "president", "presidente", "ministre", "etats", "union", "nations", "assemblee",
}


def _qid(*parts: str) -> str:
    return "qa-" + hashlib.sha1("|".join(parts).encode()).hexdigest()[:12]


def _shuffle(options: list[str], answer: str, seed: str) -> tuple[list[str], int]:
    rng = random.Random(seed)
    opts = options[:]
    rng.shuffle(opts)
    return opts, opts.index(answer)


def _find_country(title: str) -> tuple[str, dict] | None:
    folded = fold(title)
    hits = []
    for form, c in _COUNTRY_FORMS:
        pattern = r"(?<![\w-])" + re.escape(fold(form)) + r"(?![\w-])"
        found = list(re.finditer(pattern, folded))
        if found:
            hits.append((form, c, found))
    distinct = {c["id"] for _, c, _ in hits}
    if len(distinct) != 1:  # aucun pays, ou plusieurs : question ambiguë, on s'abstient
        return None
    form, c, found = hits[0]
    if len(found) != 1:
        return None
    m = found[0]
    # Le repliage (fold) conserve les longueurs pour les lettres accentuées usuelles.
    surface = title[m.start():m.end()]
    if fold(surface) != fold(form):
        return None
    return surface, c


def _country_question(art: dict) -> dict | None:
    hit = _find_country(art["title"])
    if not hit:
        return None
    surface, c = hit
    same = [x for x in _COUNTRIES if x["continent"] == c["continent"] and x["id"] != c["id"]]
    rng = random.Random(art["id"])
    if len(same) < 3:
        return None
    distract = [x["name"] for x in rng.sample(same, 3)]
    masked = art["title"].replace(surface, MASK, 1)
    opts, ans = _shuffle([c["name"], *distract], c["name"], art["id"] + "pays")
    return {"type": "pays", "prompt": "Quel pays manque dans ce titre ?", "text": masked, "options": opts, "answer": ans, "solution": c["name"]}


def _format_int(n: int) -> str:
    return f"{n:,}".replace(",", " ")


def _number_question(art: dict) -> dict | None:
    matches = list(_NUMBER.finditer(art["title"]))
    if len(matches) != 1:
        return None
    m = matches[0]
    raw = re.sub(r"[   ]", "", m.group(1))
    if m.group(2):  # décimales : trop fragile à décliner proprement
        return None
    n = int(raw)
    unit = m.group(3).strip().lower()
    if n < 2 or (unit == "ans" and 1800 <= n <= 2100):
        return None
    candidates = []
    for factor in (0.5, 2, 1.5, 0.7, 3, 0.3):
        v = int(round(n * factor))
        if n >= 20:
            v = int(round(v, -1)) if v >= 100 else v
        if v > 0 and v != n and v not in candidates:
            candidates.append(v)
    if unit in ("%", "pour cent"):
        candidates = [v for v in candidates if v <= 100]
    if len(candidates) < 3:
        return None
    distract = candidates[:3]
    fmt = lambda v: f"{_format_int(v)} {m.group(3).strip()}"  # noqa: E731
    masked = art["title"][: m.start()] + MASK + " " + m.group(3).strip() + art["title"][m.end():]
    opts, ans = _shuffle([fmt(n), *map(fmt, distract)], fmt(n), art["id"] + "nombre")
    return {"type": "nombre", "prompt": "Quel chiffre manque dans ce titre ?", "text": masked, "options": opts, "answer": ans, "solution": fmt(n)}


def candidate_entities(title: str, known: set[str] | None = None) -> list[str]:
    """Noms propres de 2 à 3 mots. En tête de titre, la majuscule ne prouve rien
    (« Débâcle de Trump… ») : on n'y accepte que des noms vus ailleurs en milieu de phrase."""
    out = []
    for m in _ENTITY.finditer(title):
        ent = m.group(1).strip()
        if m.start() == 0 and (known is None or fold(ent) not in known):
            continue
        first = fold(ent.split()[0]).strip("'’")
        if first in _ENTITY_STOP_FIRST or len(ent) < 6:
            continue
        if _find_country(ent):
            continue
        out.append(ent)
    return out


def _entity_question(art: dict, others: list[str]) -> dict | None:
    ents = candidate_entities(art["title"], {fold(o) for o in others})
    if not ents:
        return None
    ent = ents[0]  # le premier nom propre est en général le sujet du titre
    if art["title"].count(ent) != 1:
        return None
    pool = sorted({o for o in others if fold(o) != fold(ent) and fold(o) not in fold(art["title"]) and fold(ent) not in fold(o)})
    if len(pool) < 3:
        return None
    rng = random.Random(art["id"] + "qui")
    distract = rng.sample(pool, 3)
    masked = art["title"].replace(ent, MASK, 1)
    opts, ans = _shuffle([ent, *distract], ent, art["id"] + "qui")
    return {"type": "qui", "prompt": "Qui ou quoi manque dans ce titre ?", "text": masked, "options": opts, "answer": ans, "solution": ent}


def _angle_question(cluster: dict, by_id: dict[str, dict]) -> dict | None:
    arts = [by_id[i] for i in cluster["articleIds"] if i in by_id and by_id[i]["lang"] == "fr"]
    titles = {fold(a["title"]) for a in arts}
    if len(arts) < 2 or len(titles) < len(arts):
        return None
    arts = arts[:4]
    target = sorted(arts, key=lambda a: a["id"])[0]
    opts, ans = _shuffle([a["title"] for a in arts], target["title"], cluster["id"])
    return {
        "type": "angle",
        "prompt": f"Ces médias ont couvert le même événement. Quel titre a été publié par {target['sourceName']} ?",
        "text": None,
        "options": opts,
        "answer": ans,
        "solution": target["title"],
        "_article": target,
    }


def _coverage(art: dict, clusters_by_id: dict[str, dict], by_id: dict[str, dict]) -> list[dict]:
    c = clusters_by_id.get(art.get("clusterId") or "")
    if not c:
        return []
    out = []
    for i in c["articleIds"]:
        a = by_id.get(i)
        if a and a["id"] != art["id"]:
            out.append({"sourceName": a["sourceName"], "sourceCountry": a.get("sourceCountry"), "title": a["title"], "url": a["url"], "lang": a["lang"]})
    return out


def _finalize(q: dict, art: dict, clusters_by_id: dict, by_id: dict) -> dict:
    q = dict(q)
    q.pop("_article", None)
    q["id"] = _qid(q["type"], art["id"])
    q["articleId"] = art["id"]
    q["article"] = {
        "title": art["title"],
        "url": art["url"],
        "sourceName": art["sourceName"],
        "sourceCountry": art.get("sourceCountry"),
        "publishedAt": art["publishedAt"],
        "summary": art.get("summary"),
        "category": art["categories"][0],
    }
    q["coverage"] = _coverage(art, clusters_by_id, by_id)
    return q


def build_quiz(articles: list[dict], clusters: list[dict], now: datetime, n: int = 10, importance=None) -> dict:
    """Renvoie {"questions": [n questions équilibrées], "pool": [toutes les questions possibles]}."""
    # Seuls les titres d'information servent au quiz (pas les tribunes ni les analyses).
    recent = [a for a in articles if a["lang"] == "fr" and a.get("kind", "news") in ("news", "institution") and datetime.fromisoformat(a["publishedAt"]) >= now - timedelta(hours=48)]
    coverage = {c["id"]: c.get("sourceCount", 1) for c in clusters}
    score = importance or (lambda a: (coverage.get(a.get("clusterId") or "", 1), a["publishedAt"]))
    ranked = sorted(recent, key=score, reverse=True)
    by_id = {a["id"]: a for a in articles}
    clusters_by_id = {c["id"]: c for c in clusters}

    # Réservoir de noms propres du jour (vus en milieu de titre) pour les distracteurs des questions « qui ».
    entity_pool = [e for a in ranked[:120] for e in candidate_entities(a["title"])]

    pool: list[dict] = []
    seen_clusters: set[str] = set()
    for c in clusters:
        q = _angle_question(c, by_id)
        if q:
            pool.append(_finalize(q, q["_article"], clusters_by_id, by_id))
    makers = [_country_question, lambda x: _entity_question(x, entity_pool), _number_question]
    for k, a in enumerate(ranked[:150]):
        # On fait tourner le type préféré pour ne pas obtenir dix questions « pays ».
        for maker in makers[k % 3:] + makers[: k % 3]:
            q = maker(a)
            if q:
                pool.append(_finalize(q, a, clusters_by_id, by_id))
                break

    # Sélection : variée par type, un seul sujet par question, les plus importants d'abord.
    caps = {"angle": 3, "pays": 3, "qui": 3, "nombre": 2}
    order = {a["id"]: k for k, a in enumerate(ranked)}
    pool.sort(key=lambda q: (0 if q["type"] == "angle" else 1, order.get(q["articleId"], 999)))
    chosen: list[dict] = []
    counts: dict[str, int] = {}
    seen_solutions: set[str] = set()
    for strict in (True, False):
        for q in pool:
            if len(chosen) >= n:
                break
            if q in chosen:
                continue
            art = by_id[q["articleId"]]
            key = art.get("clusterId") or art["id"]
            if key in seen_clusters or fold(q["solution"]) in seen_solutions:
                continue
            if strict and counts.get(q["type"], 0) >= caps[q["type"]]:
                continue
            chosen.append(q)
            seen_clusters.add(key)
            seen_solutions.add(fold(q["solution"]))
            counts[q["type"]] = counts.get(q["type"], 0) + 1
    # Ordre de jeu : on alterne les types pour garder du rythme.
    rng = random.Random(now.strftime("%Y-%m-%d"))
    rng.shuffle(chosen)
    # On ouvre sur un titre à trous : plus engageant qu'une question de comparaison.
    first_cloze = next((i for i, q in enumerate(chosen) if q["text"]), 0)
    if chosen:
        chosen.insert(0, chosen.pop(first_cloze))
    return {"questions": chosen, "pool": pool}
