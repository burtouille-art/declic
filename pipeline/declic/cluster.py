"""Rapprochement prudent d'articles traitant du même événement.

Critères (tous requis) :
- sources (médias) différentes ;
- même langue (aucun rapprochement inter-langues : trop peu fiable sans traduction) ;
- publiés à moins de 36 heures d'écart ;
- au moins 3 « racines » de mots significatifs en commun ;
- coefficient de recouvrement >= 0,5 (part des mots du titre le plus court présents dans l'autre).

Les seuils sont volontairement stricts : mieux vaut rater un rapprochement que d'en
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

_TOKEN = re.compile(r"[a-z0-9]+")


def stems(title: str) -> set[str]:
    words = _TOKEN.findall(fold(title))
    return {w[:6] for w in words if len(w) >= 3 and w not in STOPWORDS}


def _close_in_time(a: str, b: str, hours: float = 36) -> bool:
    try:
        da = datetime.fromisoformat(a)
        db = datetime.fromisoformat(b)
    except ValueError:
        return False
    return abs((da - db).total_seconds()) <= hours * 3600


def similar(a: dict, b: dict) -> bool:
    if a["sourceName"] == b["sourceName"] or a["lang"] != b["lang"]:
        return False
    if not _close_in_time(a["publishedAt"], b["publishedAt"]):
        return False
    sa, sb = a["_stems"], b["_stems"]
    if not sa or not sb:
        return False
    shared = len(sa & sb)
    if shared < 3:
        return False
    return shared / min(len(sa), len(sb)) >= 0.5


def build_clusters(articles: list[dict]) -> list[dict]:
    """Union-find sur les paires similaires. Modifie articles[i]['clusterId']."""
    for art in articles:
        art["_stems"] = stems(art["title"])
    parent = list(range(len(articles)))

    def find(i: int) -> int:
        while parent[i] != i:
            parent[i] = parent[parent[i]]
            i = parent[i]
        return i

    for i in range(len(articles)):
        for j in range(i + 1, len(articles)):
            if similar(articles[i], articles[j]):
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
        # au plus un article par média dans la vue comparative (le plus récent)
        by_source: dict[str, dict] = {}
        for i in sorted(members, key=lambda k: articles[k]["publishedAt"], reverse=True):
            by_source.setdefault(articles[i]["sourceName"], articles[i])
        ids = [a["id"] for a in by_source.values()]
        cid = "c-" + hashlib.sha1("|".join(sorted(ids)).encode()).hexdigest()[:10]
        for i in members:
            articles[i]["clusterId"] = cid
        clusters.append({"id": cid, "articleIds": ids, "sourceCount": len(by_source)})

    for art in articles:
        art.pop("_stems", None)
        art.setdefault("clusterId", None)
    clusters.sort(key=lambda c: -c["sourceCount"])
    return clusters
