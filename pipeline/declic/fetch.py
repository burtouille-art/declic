"""Téléchargement des flux, avec délai, taille maximale et identification du robot."""
from __future__ import annotations

import json
import urllib.error
import urllib.request
from dataclasses import dataclass, field

import feedparser

USER_AGENT = "Mozilla/5.0 (compatible; DeclicBot/1.0; agregateur de titres RSS; +https://github.com/burtouille-art/declic)"
MAX_BYTES = 5 * 1024 * 1024
TIMEOUT = 20


@dataclass
class FetchResult:
    ok: bool
    entries: list[dict] = field(default_factory=list)
    http_status: int | None = None
    error: str | None = None
    feed_title: str | None = None


def _download(url: str) -> tuple[int, bytes]:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "application/rss+xml, application/atom+xml, application/xml, text/xml, application/json;q=0.9, */*;q=0.5"})
    with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:  # noqa: S310 (URL issue de sources.json)
        data = resp.read(MAX_BYTES + 1)
        if len(data) > MAX_BYTES:
            raise ValueError("réponse trop volumineuse (> 5 Mo)")
        return resp.status, data


def fetch_feed(url: str) -> FetchResult:
    try:
        status, body = _download(url)
    except urllib.error.HTTPError as exc:
        return FetchResult(ok=False, http_status=exc.code, error=f"HTTP {exc.code}")
    except Exception as exc:  # réseau, délai, TLS…
        return FetchResult(ok=False, error=f"{type(exc).__name__}: {exc}"[:200])
    return parse_feed_bytes(body, status)


def parse_feed_bytes(body: bytes, status: int | None = 200) -> FetchResult:
    parsed = feedparser.parse(body)
    entries = [dict(e) for e in parsed.entries]
    if not entries:
        reason = str(getattr(parsed, "bozo_exception", "") or "aucun article dans le flux")
        return FetchResult(ok=False, http_status=status, error=reason[:200])
    # bozo = XML imparfait mais exploitable (ex. JPL) : on garde, sans erreur bloquante.
    return FetchResult(ok=True, entries=entries, http_status=status, feed_title=parsed.feed.get("title"))


def fetch_json(url: str) -> tuple[dict | None, str | None]:
    try:
        _, body = _download(url)
        return json.loads(body.decode("utf-8")), None
    except Exception as exc:
        return None, f"{type(exc).__name__}: {exc}"[:200]


def fetch_bytes(url: str) -> tuple[bytes | None, str | None]:
    """Téléchargement brut (photos d'illustration)."""
    try:
        _, body = _download(url)
        return body, None
    except Exception as exc:
        return None, f"{type(exc).__name__}: {exc}"[:200]
