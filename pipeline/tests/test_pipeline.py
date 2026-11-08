import json
import sys
from datetime import datetime, timezone
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from declic.build import MIN_ARTICLES, merge_duplicates, run, validate_article  # noqa: E402
from declic.classify import category_from_url, classify  # noqa: E402
from declic.cluster import build_clusters, stems  # noqa: E402
from declic.fetch import FetchResult, parse_feed_bytes  # noqa: E402
from declic.normalize import normalize_entry  # noqa: E402
from declic.onthisday import normalize_onthisday, questions_from_events  # noqa: E402
from declic.sanitize import canonical_url, safe_url, strip_html, truncate  # noqa: E402

NOW = datetime(2026, 11, 8, 20, 0, tzinfo=timezone.utc)
SRC = {"id": "test", "name": "Média test", "lang": "fr", "category": None, "kind": "news", "homepage": "https://example.org"}

RSS = b"""<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel><title>Flux test</title>
<item><title>Un premier titre &amp; son esperluette</title><link>https://example.org/monde/article-1?utm_source=rss#xtor=1</link>
<pubDate>Sun, 08 Nov 2026 18:00:00 +0100</pubDate>
<description><![CDATA[<p>Une description <b>riche</b> avec <script>alert(1)</script> un script et assez de texte pour etre gardee.</p>]]></description></item>
<item><title>Deuxieme article tres ancien</title><link>https://example.org/sports/vieux</link>
<pubDate>Mon, 01 Jan 2024 10:00:00 +0000</pubDate></item>
<item><title>Lien dangereux</title><link>javascript:alert(1)</link><pubDate>Sun, 08 Nov 2026 10:00:00 +0000</pubDate></item>
</channel></rss>"""


# --- sanitize -----------------------------------------------------------------

def test_strip_html_removes_tags_and_scripts():
    out = strip_html('<p>Bonjour <a href="x">monde</a></p><script>evil()</script><img src=x onerror=alert(1)>')
    assert out == "Bonjour monde"
    assert "<" not in strip_html("a &lt;script&gt; b")


def test_safe_url_rejects_non_http():
    assert safe_url("javascript:alert(1)") is None
    assert safe_url("data:text/html,hi") is None
    assert safe_url("https://ok.fr/a b") is None
    assert safe_url("https://ok.fr/a#frag") == "https://ok.fr/a"


def test_canonical_url_drops_tracking():
    a = canonical_url("https://www.Example.org/a/?utm_source=x&id=3&at_medium=RSS")
    assert a == "https://example.org/a?id=3"


def test_truncate_on_word():
    assert truncate("un deux trois quatre", 12).endswith("…")
    assert len(truncate("x" * 500, 100)) <= 101


# --- parsing & normalisation -------------------------------------------------

def test_parse_and_normalize_entries():
    res = parse_feed_bytes(RSS)
    assert res.ok and len(res.entries) == 3
    arts = [normalize_entry(e, SRC, NOW) for e in res.entries]
    first = arts[0]
    assert first["title"] == "Un premier titre & son esperluette"
    assert "<" not in first["summary"] and "alert" not in first["summary"]
    assert first["categories"][0] == "monde"  # déduit du chemin /monde/
    assert first["publishedAt"] == "2026-11-08T17:00:00+00:00"
    assert arts[2] is None  # javascript: refusé
    assert validate_article(first)


def test_empty_feed_is_error():
    res = parse_feed_bytes(b"<html><body>Pas un flux</body></html>")
    assert not res.ok and res.error


def test_summary_equal_to_title_is_dropped():
    entry = {"title": "Un titre identique", "link": "https://e.org/x", "published": "Sun, 08 Nov 2026 10:00:00 GMT", "summary": "Un titre identique"}
    assert normalize_entry(entry, SRC, NOW)["summary"] is None


def test_future_date_is_clamped():
    entry = {"title": "Article du futur proche", "link": "https://e.org/f", "published": "Sun, 08 Nov 2026 23:00:00 GMT"}
    assert normalize_entry(entry, SRC, NOW)["publishedAt"] == NOW.isoformat(timespec="seconds")


def test_images_only_when_rights_identified():
    entry = {"title": "Photo spatiale du jour", "link": "https://e.org/p", "published": "Sun, 08 Nov 2026 10:00:00 GMT", "image": "https://www.nasa.gov/a.jpg"}
    assert normalize_entry(entry, SRC, NOW)["image"] is None
    nasa = dict(SRC, images={"allowed": True, "credit": "NASA", "hosts": ["www.nasa.gov"]})
    assert normalize_entry(entry, nasa, NOW)["image"]["credit"] == "NASA"
    other = dict(entry, image="https://tracker.example/a.jpg")
    assert normalize_entry(other, nasa, NOW)["image"] is None


# --- classification ----------------------------------------------------------

def test_category_from_url_paths():
    assert category_from_url("https://www.franceinfo.fr/sports/foot/match_1.html") == "sport"
    assert category_from_url("https://www.france24.com/fr/afrique/20261108-x") == "monde"
    assert category_from_url("https://www.france24.com/fr/%C3%A9co-tech/2026-x") == "economie"
    assert category_from_url("https://example.org/slug-only") is None


def test_keywords_add_secondary_categories():
    cats = classify("OpenAI dévoile un nouveau modèle d'intelligence artificielle", "", "https://e.org/x", "technologie")
    assert cats[0] == "technologie" and "ia" in cats
    assert "espace" in classify("La NASA prépare une mission vers la Lune", "", "https://e.org/x", None)


def test_month_mars_is_not_space():
    assert "espace" not in classify("Grève prévue le 3 mars dans les transports", "", "https://e.org/x", "france")


def test_ia_acronym_requires_uppercase():
    assert "ia" in classify("L'IA bouleverse les métiers", "", "https://e.org/x", "societe")
    assert "ia" not in classify("Via Ferrata : les plus belles voies", "", "https://e.org/x", "sport")


# --- déduplication & rapprochements ------------------------------------------

def _art(i, title, source, url=None, when="2026-11-08T10:00:00+00:00", lang="fr"):
    return {"id": f"a{i}", "title": title, "url": url or f"https://e{i}.org/x", "canonicalUrl": url or f"https://e{i}.org/x",
            "sourceId": source, "sourceName": source, "lang": lang, "kind": "news", "publishedAt": when,
            "summary": None, "categories": ["monde"], "image": None}


def test_merge_duplicates_by_url_keeps_specific_category():
    a = _art(1, "Titre", "franceinfo", url="https://f.fr/a")
    b = dict(_art(2, "Titre", "franceinfo", url="https://f.fr/a"), categories=["sport"], _specific=True)
    merged = merge_duplicates([a, b])
    assert len(merged) == 1 and merged[0]["categories"] == ["sport", "monde"]


def test_clusters_same_event_across_media():
    arts = [
        _art(1, "En Israël, Gadi Eisenkot chargé de former une coalition gouvernementale", "franceinfo"),
        _art(2, "Gadi Eisenkot officiellement chargé de former le prochain gouvernement en Israël", "France 24"),
        _art(3, "Le prix du café atteint un record historique", "Le Monde"),
    ]
    clusters = build_clusters(arts)
    assert len(clusters) == 1 and set(clusters[0]["articleIds"]) == {"a1", "a2"}
    assert arts[2]["clusterId"] is None


def test_no_cluster_across_languages_or_same_source():
    arts = [
        _art(1, "Diwali : bougies et lanternes illuminent l'Inde", "France 24"),
        _art(2, "Diwali bougies lanternes illuminent Inde ce soir", "France 24"),
        _art(3, "Diwali lanterns and candles illuminate India", "BBC", lang="en"),
    ]
    assert build_clusters(arts) == []


def test_stems_ignore_stopwords():
    assert "dans" not in stems("Un incendie dans la forêt")


# --- éphéméride ----------------------------------------------------------------

def test_onthisday_questions_use_structured_year():
    payload = {"selected": [
        {"text": "chute du mur de Berlin.", "year": 1989, "pages": [{"titles": {"normalized": "Chute du mur de Berlin"}, "content_urls": {"desktop": {"page": "https://fr.wikipedia.org/wiki/Chute_du_mur_de_Berlin"}}}]},
        {"text": "événement de 1800 cité dans la phrase.", "year": 1800, "pages": [{"titles": {"normalized": "X"}, "content_urls": {"desktop": {"page": "https://fr.wikipedia.org/wiki/X"}}}]},
        {"text": "sans lien", "year": 1700, "pages": []},
    ]}
    events = normalize_onthisday(payload, 11, 9)
    assert len(events) == 2
    qs = questions_from_events(events, 2026)
    assert len(qs) == 1
    q = qs[0]
    assert q["options"][q["answer"]] == "1989" and len(set(q["options"])) == 4


# --- exécution complète --------------------------------------------------------

def _config(n):
    return {"sources": [dict(SRC, id=f"s{i}", name=f"Média {i}", url=f"https://feed{i}.example/rss") for i in range(n)]}


def _good_feed(i):
    items = "".join(
        f"<item><title>Article numéro {k} du média {i} sur un sujet distinct {k * 7 + i}</title><link>https://m{i}.example/a{k}</link>"
        f"<pubDate>Sun, 08 Nov 2026 1{k % 10}:00:00 GMT</pubDate></item>" for k in range(8)
    )
    return parse_feed_bytes(f"<rss version='2.0'><channel><title>t</title>{items}</channel></rss>".encode())


def test_run_writes_files_and_status(tmp_path):
    status = run(_config(3), tmp_path, fetcher=lambda url: _good_feed(int(url[12])), json_fetcher=lambda u: (None, "hors ligne"), now=NOW)
    news = json.loads((tmp_path / "news.json").read_text())
    assert status["sourcesOk"] == 3 and len(news["articles"]) == 24
    assert all(validate_article(a) for a in news["articles"])
    assert "canonicalUrl" not in news["articles"][0]
    assert news["generatedAt"] == NOW.isoformat(timespec="seconds")


def test_failed_source_falls_back_to_previous(tmp_path):
    run(_config(3), tmp_path, fetcher=lambda url: _good_feed(int(url[12])), json_fetcher=lambda u: (None, None), now=NOW)

    def flaky(url):
        return FetchResult(ok=False, error="HTTP 503", http_status=503) if "feed1" in url else _good_feed(int(url[12]))

    status = run(_config(3), tmp_path, fetcher=flaky, json_fetcher=lambda u: (None, None), now=NOW)
    s1 = next(s for s in status["sources"] if s["id"] == "s1")
    assert not s1["ok"] and s1["usedFallback"] and s1["kept"] == 8
    assert s1["lastSuccessAt"] == NOW.isoformat(timespec="seconds")
    assert status["articleCount"] == 24


def test_total_outage_keeps_previous_data(tmp_path):
    run(_config(3), tmp_path, fetcher=lambda url: _good_feed(int(url[12])), json_fetcher=lambda u: (None, None), now=NOW)
    before = json.loads((tmp_path / "news.json").read_text())
    # Plus aucune donnée précédente disponible par source (simule un historique trop vieux)
    later = datetime(2026, 11, 30, tzinfo=timezone.utc)
    status = run(_config(3), tmp_path, fetcher=lambda url: FetchResult(ok=False, error="down"), json_fetcher=lambda u: (None, None), now=later)
    after = json.loads((tmp_path / "news.json").read_text())
    assert status["keptPreviousData"] is True
    assert after == before
    assert len(before["articles"]) >= MIN_ARTICLES


def test_stale_articles_are_filtered(tmp_path):
    res = parse_feed_bytes(RSS)
    status = run({"sources": [dict(SRC, url="https://x")]}, tmp_path, fetcher=lambda u: res, json_fetcher=lambda u: (None, None), now=NOW)
    news = json.loads((tmp_path / "news.json").read_text())
    titles = [a["title"] for a in news["articles"]]
    assert "Deuxieme article tres ancien" not in titles
    assert status["sources"][0]["kept"] == 1


def test_sources_file_is_valid():
    cfg = json.loads((Path(__file__).resolve().parents[1] / "sources.json").read_text())
    ids = [s["id"] for s in cfg["sources"]]
    assert len(ids) == len(set(ids))
    for s in cfg["sources"]:
        assert s["url"].startswith("https://") and s["lang"] in ("fr", "en")
        assert s["kind"] in ("news", "analysis", "institution")
