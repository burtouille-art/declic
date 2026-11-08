"""Classification thématique.

Ordre de priorité, du plus fiable au moins fiable :
1. la rubrique du flux (déclarée dans sources.json) ;
2. la rubrique lisible dans le chemin de l'URL de l'article (franceinfo, France 24, Le Monde) ;
3. des mots-clés explicites, qui ne font qu'AJOUTER des rubriques secondaires
   (IA, Espace, Santé, Histoire…). Ils ne retirent jamais la rubrique d'origine.

Aucun jugement politique ou éditorial n'est attribué aux médias.
"""
from __future__ import annotations

import re
from urllib.parse import unquote, urlsplit

from .sanitize import fold

CATEGORIES = [
    "monde", "france", "societe", "sciences", "technologie", "ia", "espace", "histoire",
    "economie", "environnement", "sante", "culture", "sport", "insolite",
]

# Segment d'URL (sans accents, minuscules) -> rubrique
URL_SEGMENTS: dict[str, str] = {
    # franceinfo
    "monde": "monde", "europe": "monde", "afrique": "monde", "asie": "monde", "usa": "monde",
    "politique": "france", "france": "france", "faits-divers": "societe", "societe": "societe",
    "economie": "economie", "eco-conso": "economie", "sciences": "sciences", "sante": "sante",
    "environnement": "environnement", "meteo": "environnement", "internet": "technologie",
    "culture": "culture", "sports": "sport", "sport": "sport", "insolite": "insolite",
    "replay-radio": None,  # type: ignore[dict-item]
    # France 24
    "moyen-orient": "monde", "asie-pacifique": "monde", "ameriques": "monde", "eco-tech": "economie",
    "planete": "environnement",
    # Le Monde
    "international": "monde", "planete": "environnement", "pixels": "technologie", "sciences": "sciences",
    "idees": "societe", "education": "societe", "histoire": "histoire", "intelligence-artificielle": "ia",
}

# Mots-clés (comparés sans accents, sur des frontières de mots).
KEYWORDS: dict[str, list[str]] = {
    "ia": [
        "intelligence artificielle", "ia generative", "chatgpt", "openai", "anthropic", "mistral ai",
        "deepmind", "large language model", "llm", "artificial intelligence", "machine learning",
        "apprentissage automatique", "chatbot", "agent ia", "gemini", "copilot",
    ],
    "espace": [
        "nasa", "esa", "cnes", "spacex", "fusee", "rocket", "satellite", "astronaute", "astronaut",
        "lune", "moon", "planete mars", "sur mars", "martien", "mars rover", "jupiter", "saturne", "saturn", "galaxie", "galaxy", "telescope",
        "hubble", "james webb", "exoplanete", "exoplanet", "asteroide", "asteroid", "comete", "comet",
        "station spatiale", "space station", "artemis", "orbit", "orbite", "nebula", "nebuleuse",
    ],
    "sante": [
        "vaccin", "vaccine", "cancer", "hopital", "hospital", "maladie", "disease", "epidemie",
        "epidemic", "pandemie", "virus", "medecin", "medicament", "sante publique", "public health",
        "alzheimer", "diabete", "diabetes", "nhs", "oms", "inserm",
    ],
    "environnement": [
        "climat", "climate", "rechauffement", "global warming", "biodiversite", "biodiversity",
        "pollution", "secheresse", "drought", "canicule", "heatwave", "cop30", "cop31", "emissions",
        "carbone", "carbon", "glacier", "deforestation", "ocean", "coraux", "coral",
    ],
    "histoire": [
        "historien", "historian", "archeolog", "archaeolog", "fouilles", "excavation", "antiquite",
        "moyen age", "medieval", "seconde guerre mondiale", "world war", "premiere guerre mondiale",
        "patrimoine", "heritage", "commemoration", "centenaire", "bicentenaire",
    ],
    "sciences": [
        "chercheurs", "researchers", "scientifiques", "scientists", "etude publiee", "study",
        "physique", "physics", "neutrino", "biolog", "chimie", "chemistry", "fossile", "fossil",
        "genome", "cerveau", "brain",
    ],
    "technologie": [
        "smartphone", "iphone", "android", "cybersecurite", "cyberattaque", "cyberattack", "hacker",
        "data center", "semi-conducteur", "semiconductor", "puce", "logiciel", "software",
    ],
    "sport": [
        "ligue 1", "champions league", "ligue des champions", "grand prix", "tennis", "rugby",
        "football", "basket", "jeux olympiques", "olympic", "tour de france", "coupe du monde",
        "route du rhum", "vendee globe", "masters 1000", "roland-garros", "formule 1", "skipper",
    ],
    "culture": [
        "cinema", "film", "festival", "musee", "museum", "exposition", "roman", "novel", "album",
        "concert", "theatre", "prix goncourt", "oscar", "cesar", "serie tele",
    ],
}

# Mots ambigus courts : exigent la casse d'origine (sigle) dans le titre.
CASE_SENSITIVE = {"ia": [r"\bIA\b", r"\bAI\b"], "espace": [r"\bISS\b"]}

_compiled = {
    cat: [re.compile(r"(?<![a-z0-9])" + re.escape(k) + r"(?![a-z0-9])") for k in words]
    for cat, words in KEYWORDS.items()
}
# préfixes (archeolog, biolog) : pas de frontière de fin
for cat, words in KEYWORDS.items():
    for i, k in enumerate(words):
        if k.endswith(("olog", "archeolog")):
            _compiled[cat][i] = re.compile(r"(?<![a-z0-9])" + re.escape(k))

_case_compiled = {cat: [re.compile(p) for p in pats] for cat, pats in CASE_SENSITIVE.items()}


def category_from_url(url: str) -> str | None:
    try:
        path = unquote(urlsplit(url).path)
    except ValueError:
        return None
    segments = [fold(s) for s in path.split("/") if s][:-1]  # le dernier segment est le slug
    for seg in segments:
        if seg in ("fr", "en", "video", "news", "articles", "live"):
            continue
        cat = URL_SEGMENTS.get(seg)
        if cat:
            return cat
    return None


def keyword_categories(title: str, summary: str) -> list[str]:
    folded = fold(f"{title} {summary}")
    found: list[str] = []
    for cat, patterns in _compiled.items():
        if any(p.search(folded) for p in patterns):
            found.append(cat)
    for cat, patterns in _case_compiled.items():
        if cat not in found and any(p.search(title) for p in patterns):
            found.append(cat)
    return found


def classify(title: str, summary: str, url: str, source_category: str | None) -> list[str]:
    """Renvoie la liste ordonnée des rubriques ; la première est la rubrique principale."""
    primary = source_category or category_from_url(url)
    secondary = keyword_categories(title, summary)
    cats: list[str] = []
    if primary:
        cats.append(primary)
    # Les mots-clés « sciences/technologie/sport/culture » sont trop génériques pour
    # créer à eux seuls une rubrique principale quand le flux en déclare déjà une.
    weak = {"sciences", "technologie", "sport", "culture"}
    for c in secondary:
        if c in cats:
            continue
        if primary and c in weak:
            continue
        cats.append(c)
    if not cats:
        cats.append("monde")
    return [c for c in cats if c in CATEGORIES]
