"""Rapprochement prudent d'articles traitant du même événement (« points de vue »).

Deux articles de médias DIFFÉRENTS, publiés à moins de 36 h d'écart, sont rapprochés si :

A. même langue, au moins 3 « racines » de mots significatifs en commun et recouvrement
   >= 0,5 (part des mots du titre le plus court présents dans l'autre) ; OU
B. ils partagent au moins 2 ENTITÉS rares (noms propres : « Gadi Eisenkot », « Cracovie »…).
   Ce critère fonctionne aussi entre le français et l'anglais, car les noms propres
   se traduisent peu ; OU
C. même langue, 1 entité rare + au moins 2 AUTRES racines communes (hors du nom) ; OU
D. langues différentes, 1 nom complet rare (au moins deux mots), publiés à moins de 24 h.

Une entité est « rare » si elle apparaît dans peu d'articles du jour : « Trump » ou
« Israël », cités partout, ne suffisent jamais à rapprocher deux articles.
Les seuils restent volontairement stricts : mieux vaut rater un rapprochement que d'en
proposer un faux.
"""
from __future__ import annotations

import hashlib
import re
from datetime import datetime

from .sanitize import fold

STOPWORDS = set(
    """
    a au aux avec ce ces cet cette dans de des du elle elles en est et etre eux il ils je la le les leur leurs
    lui mais me meme mes moi mon ne nos notre nous on ou par pas pour qu que qui sa se ses son sur ta te tes
    toi ton tu un une vos votre vous apres avant contre depuis entre sans sous vers selon plus moins tres
    tout tous toute toutes fait faire font ete sont ont avoir cela comme quand dont deja encore aussi alors
    ainsi lors d l c s n j m t y the an of to in on for at by with from as is are was were be been it its
    this that these those after over into about than but not new says say said will would can could has
    have had more most what who why how when where which their they them his her he she we our you your
    direct live video videos ce qu on sait annonce affirme selon apres jour jours dimanche lundi mardi
    mercredi jeudi vendredi samedi sunday monday tuesday wednesday thursday friday saturday
    """.split()
)

# Mots capitalisés qui ne sont pas des entités (débuts de phrase fréquents, titres de rubriques…)
ENTITY_STOP = {
    "le", "la", "les", "un", "une", "des", "en", "au", "aux", "ce", "cette", "ces", "pour", "dans", "sur",
    "the", "a", "an", "in", "on", "of", "for", "and", "how", "why", "what", "who", "when", "after",
    "direct", "video", "vidéo", "live", "info", "infos", "exclusif", "analyse", "entretien", "tribune",
    "reportage", "enquete", "enquête", "edito", "éditorial", "decryptage", "décryptage", "portrait", "chronique",
    "europe", "monde", "france", "president", "président", "presidente", "présidente", "ministre", "premier",
    "nord", "sud", "est", "ouest", "etat", "état", "etats", "états", "gouvernement", "assemblee", "assemblée",
    "senat", "sénat", "union", "nations", "unies", "ligue", "coupe", "grand", "prix", "jeux",
}

_TOKEN = re.compile(r"[a-z0-9]+")
_WORD = re.compile(r"[A-Za-zÀ-ÖØ-öø-ÿ][\w'’\-]*", re.UNICODE)


def stems(title: str) -> set[str]:
    words = _TOKEN.findall(fold(title))
    return {w[:6] for w in words if len(w) >= 3 and w not in STOPWORDS}


def entities(title: str) -> set[str]:
    """Suites de mots capitalisés (hors premier mot de la phrase), repliées sans accents.
    « En Israël, Gadi Eisenkot affirme… » -> {"israel", "gadi eisenkot"}."""
    matches = list(_WORD.finditer(title))
    words = [(m.group(0), m.start()) for m in matches]
    # Titre « Title Case » (chaque mot en majuscule, style anglo-saxon) : les majuscules ne disent rien.
    caps = sum(1 for w, _ in words if w[:1].isupper())
    if len(words) >= 6 and caps / len(words) >= 0.75:
        return {fold(w) for w, _ in words if w.isupper() and 2 <= len(w) <= 6 and len(w) >= 4}
    out: set[str] = set()
    current: list[str] = []
    start = [0]

    def flush():
        if current:
            ent = " ".join(current)
            # Un mot seul en tête de titre (« Tennis : … ») n'est pas fiable comme entité.
            if len(ent) >= 4 and not (start[0] == 0 and len(current) == 1):
                out.add(ent)
            current.clear()

    for i, (w, pos) in enumerate(words):
        # Une ponctuation entre deux mots (virgule, deux-points…) coupe l'entité.
        if i > 0 and title[matches[i - 1].end():pos].strip():
            flush()
        clean = w.strip("'’-")
        possessive = clean.endswith(("'s", "’s"))
        if possessive:
            clean = clean[:-2]
        # mot en tête de titre ou après « : » : la majuscule n'est pas significative
        sentence_start = i == 0 or title[max(0, pos - 2):pos].strip() in (":", ".", "!", "?", "«", '"', "—", "–")
        is_cap = clean[:1].isupper() and not clean.isupper() or (clean.isupper() and len(clean) >= 2 and len(clean) <= 6)
        f = fold(clean)
        # élision « l'Ukraine », « d'Israël »
        if len(f) > 2 and f[1] in "'’" and f[0] in "ldjn":
            f = f[2:]
            is_cap = clean[2:3].isupper()
        if is_cap and f not in ENTITY_STOP and not (sentence_start and f in STOPWORDS):
            if sentence_start and not current and len(f) < 4:
                flush()
                continue
            if not current:
                start[0] = i
            current.append(f)
            if possessive:  # « Israel's Gadi Eisenkot » : le possessif clôt l'entité
                flush()
        else:
            flush()
    flush()
    return out


def _close_in_time(a: str, b: str, hours: float = 36) -> bool:
    try:
        da = datetime.fromisoformat(a)
        db = datetime.fromisoformat(b)
    except ValueError:
        return False
    return abs((da - db).total_seconds()) <= hours * 3600


def _entity_doc_freq(articles: list[dict]) -> dict[str, int]:
    df: dict[str, int] = {}
    for a in articles:
        for e in a["_ents"]:
            df[e] = df.get(e, 0) + 1
    return df


def similar(a: dict, b: dict, rare: set[str] | None = None) -> bool:
    if a["sourceName"] == b["sourceName"]:
        return False
    if not _close_in_time(a["publishedAt"], b["publishedAt"]):
        return False
    same_lang = a["lang"] == b["lang"]
    sa, sb = a["_stems"], b["_stems"]
    shared = len(sa & sb)
    overlap = shared / min(len(sa), len(sb)) if sa and sb else 0.0
    # A. même langue, vocabulaire très proche
    if same_lang and shared >= 3 and overlap >= 0.5:
        return True
    ents = (a["_ents"] & b["_ents"]) & (rare if rare is not None else (a["_ents"] | b["_ents"]))
    # B. au moins deux entités rares communes (y compris entre langues)
    if len(ents) >= 2:
        return True
    if len(ents) == 1:
        ent = next(iter(ents))
        # Vocabulaire commun HORS du nom propre lui-même (sinon « Donald Trump » suffirait).
        ent_stems = stems(ent)
        shared_other = len((sa & sb) - ent_stems)
        rest = min(len(sa - ent_stems), len(sb - ent_stems)) or 1
        # C. même langue : le nom + au moins 2 autres mots communs
        if same_lang and shared_other >= 2 and shared_other / rest >= 0.34:
            return True
        # D. langues différentes : un nom complet (au moins deux mots) rare, publié le même jour
        if not same_lang and " " in ent and _close_in_time(a["publishedAt"], b["publishedAt"], 24):
            return True
    return False


def build_clusters(articles: list[dict]) -> list[dict]:
    """Union-find sur les paires similaires. Modifie articles[i]['clusterId']."""
    # Les analyses ne sont pas des comptes rendus d'un même événement : elles sont reliées
    # aux sujets à part (related_analyses), pas fusionnées dans les « points de vue ».
    for art in articles:
        art["_stems"] = stems(art["title"]) if art.get("kind") not in STEP_BACK else set()
        art["_ents"] = entities(art["title"]) if art.get("kind") not in STEP_BACK else set()
    df = _entity_doc_freq(articles)
    # « rare » : cité dans au plus 3 % des articles (et au plus 12), sinon c'est un sujet trop large
    limit = max(4, min(12, int(len(articles) * 0.03)))
    rare = {e for e, n in df.items() if n <= limit}
    parent = list(range(len(articles)))

    def find(i: int) -> int:
        while parent[i] != i:
            parent[i] = parent[parent[i]]
            i = parent[i]
        return i

    for i in range(len(articles)):
        for j in range(i + 1, len(articles)):
            if similar(articles[i], articles[j], rare):
                ri, rj = find(i), find(j)
                if ri != rj:
                    parent[rj] = ri

    groups: dict[int, list[int]] = {}
    for i in range(len(articles)):
        groups.setdefault(find(i), []).append(i)

    clusters: list[dict] = []
    for members in groups.values():
        names = {articles[i]["sourceName"] for i in members}
        if len(names) < 2:
            continue
        # Garde-fou contre les chaînes de rapprochements : au-delà de 12 médias, on renonce.
        if len(names) > 12:
            continue
        by_source: dict[str, dict] = {}
        for i in sorted(members, key=lambda k: articles[k]["publishedAt"], reverse=True):
            by_source.setdefault(articles[i]["sourceName"], articles[i])
        ids = [a["id"] for a in by_source.values()]
        cid = "c-" + hashlib.sha1("|".join(sorted(ids)).encode()).hexdigest()[:10]
        for i in members:
            articles[i]["clusterId"] = cid
        # Entités partagées par au moins deux médias : l'« étiquette » factuelle du sujet
        counts: dict[str, int] = {}
        for a in by_source.values():
            for e in a["_ents"]:
                counts[e] = counts.get(e, 0) + 1
        shared_ents = sorted((e for e, n in counts.items() if n >= 2), key=lambda e: (-counts[e], -len(e)))
        langs = sorted({a["lang"] for a in by_source.values()})
        countries = sorted({a.get("sourceCountry") or "" for a in by_source.values()} - {""})
        clusters.append({
            "id": cid,
            "articleIds": ids,
            "sourceCount": len(by_source),
            "entities": shared_ents[:4],
            "langs": langs,
            "countries": countries,
        })

    for art in articles:
        art.pop("_stems", None)
        art.pop("_ents", None)
        art.setdefault("clusterId", None)
    clusters.sort(key=lambda c: (-c["sourceCount"], -len(c["countries"])))
    return clusters


# Articles « pour prendre du recul » : analyses/décryptages et tribunes/débats.
STEP_BACK = {"analysis", "opinion"}


def related_analyses(clusters: list[dict], articles: list[dict], max_per: int = 2) -> None:
    """Associe à chaque sujet des articles d'ANALYSE (kind = analysis) qui partagent
    une entité du sujet ou au moins 3 racines de mots avec l'un de ses titres."""
    by_id = {a["id"]: a for a in articles}
    analyses = [a for a in articles if a.get("kind") in STEP_BACK]
    for a in analyses:
        a["_stems"] = stems(a["title"] + " " + (a.get("summary") or ""))
        a["_ents"] = entities(a["title"])
    for c in clusters:
        members = [by_id[i] for i in c["articleIds"] if i in by_id]
        member_ids = set(c["articleIds"])
        topic_stems = set().union(*(stems(m["title"]) for m in members)) if members else set()
        topic_ents = set(c.get("entities") or [])
        scored = []
        for a in analyses:
            if a["id"] in member_ids:
                continue
            score = 3 * len(a["_ents"] & topic_ents) + len(a["_stems"] & topic_stems)
            if (a["_ents"] & topic_ents) or len(a["_stems"] & topic_stems) >= 3:
                scored.append((score, a["publishedAt"], a["id"]))
        scored.sort(reverse=True)
        c["analysisIds"] = [s[2] for s in scored[:max_per]]
    for a in analyses:
        a.pop("_stems", None)
        a.pop("_ents", None)
