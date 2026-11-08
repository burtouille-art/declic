"""Nettoyage défensif du contenu RSS.

Tout ce qui sort de ce module est du TEXTE BRUT : aucune balise HTML n'est
conservée. Le front-end n'injecte jamais de HTML venu des flux
(pas de dangerouslySetInnerHTML), cette étape est une seconde barrière.
"""
from __future__ import annotations

import html
import re
import unicodedata
from html.parser import HTMLParser
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

_BLOCK_TAGS = {"p", "br", "div", "li", "h1", "h2", "h3", "h4", "h5", "h6", "tr", "blockquote"}
_DROP_CONTENT_TAGS = {"script", "style", "iframe", "noscript", "svg", "object", "embed", "template"}


class _TextExtractor(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.parts: list[str] = []
        self._skip_depth = 0

    def handle_starttag(self, tag: str, attrs) -> None:  # noqa: ANN001
        if tag in _DROP_CONTENT_TAGS:
            self._skip_depth += 1
        elif tag in _BLOCK_TAGS:
            self.parts.append(" ")

    def handle_endtag(self, tag: str) -> None:
        if tag in _DROP_CONTENT_TAGS and self._skip_depth:
            self._skip_depth -= 1
        elif tag in _BLOCK_TAGS:
            self.parts.append(" ")

    def handle_data(self, data: str) -> None:
        if not self._skip_depth:
            self.parts.append(data)


_CONTROL_CHARS = re.compile(r"[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f​-‏‪-‮⁦-⁩]")
_WS = re.compile(r"\s+")


def strip_html(value: str | None) -> str:
    """Retire toutes les balises et renvoie un texte propre sur une ligne."""
    if not value:
        return ""
    parser = _TextExtractor()
    try:
        parser.feed(value)
        parser.close()
        text = "".join(parser.parts)
    except Exception:  # HTML très cassé : on retombe sur une regex brutale
        text = re.sub(r"<[^>]*>", " ", value)
    text = html.unescape(text)
    text = unicodedata.normalize("NFC", text)
    text = _CONTROL_CHARS.sub("", text)
    # Un "<" résiduel ne doit jamais ressembler à une balise.
    text = text.replace("<", "‹").replace(">", "›")
    return _WS.sub(" ", text).strip()


def truncate(text: str, limit: int) -> str:
    """Coupe proprement sur un mot, avec une ellipse."""
    if len(text) <= limit:
        return text
    cut = text[: limit + 1]
    space = cut.rfind(" ")
    if space > limit * 0.6:
        cut = cut[:space]
    else:
        cut = cut[:limit]
    return cut.rstrip(" ,;:.-–—") + "…"


_TRACKING_PARAMS = re.compile(r"^(utm_|at_|xtor|xts|fbclid|gclid|mc_|ns_|ref$|cmp$|ito$|amp$)", re.I)


def safe_url(value: str | None) -> str | None:
    """Accepte uniquement http(s) avec un hôte ; refuse javascript:, data:, etc."""
    if not value or not isinstance(value, str):
        return None
    value = value.strip()
    try:
        parts = urlsplit(value)
    except ValueError:
        return None
    if parts.scheme not in ("http", "https") or not parts.netloc:
        return None
    if any(c in value for c in ('"', "'", "<", ">", " ", "\n", "\r", "\t")):
        return None
    return urlunsplit(("https" if parts.scheme == "https" else "http", parts.netloc, parts.path, parts.query, ""))


def canonical_url(value: str) -> str:
    """URL sans paramètres de suivi ni fragment, pour la déduplication."""
    parts = urlsplit(value)
    query = [(k, v) for k, v in parse_qsl(parts.query, keep_blank_values=True) if not _TRACKING_PARAMS.match(k)]
    host = parts.netloc.lower()
    if host.startswith("www."):
        host = host[4:]
    path = parts.path.rstrip("/") or "/"
    return urlunsplit(("https", host, path, urlencode(query), ""))


def fold(text: str) -> str:
    """Minuscules sans accents, pour comparer des titres."""
    text = unicodedata.normalize("NFKD", text.lower())
    return "".join(c for c in text if not unicodedata.combining(c))
