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
        assert s["kind"] in ("news", "analysis", "opinion", "institution")


# --- flux RSS « À la une » ------------------------------------------------------

def test_une_feed_is_valid_rss_with_original_links(tmp_path):
    from xml.etree import ElementTree as ET

    from declic.feed import build_rss, select_une

    arts = [
        dict(_art(i, f"Titre numéro {i} avec <balise> & esperluette", f"Média {i % 4}"), categories=[["monde", "france", "sciences", "sport"][i % 4]], url=f"https://m{i}.example/a")
        for i in range(14)
    ]
    arts.append(dict(_art(99, "Article en anglais très important", "BBC", lang="en"), url="https://bbc.example/x"))
    arts.append(dict(_art(98, "Une histoire insolite", "20 Minutes"), categories=["insolite"], url="https://20.example/x"))
    une = select_une(arts, [], NOW)
    assert len(une) == 10
    assert all(a["lang"] == "fr" and a["categories"][0] != "insolite" for a in une)
    xml = build_rss(une, "https://exemple.github.io/declic", NOW)
    root = ET.fromstring(xml)
    items = root.findall("channel/item")
    assert len(items) == 10
    first = items[0]
    assert first.findtext("link").startswith("https://m")  # lien vers l'article original
    assert "<balise>" in first.findtext("title")  # échappé correctement, relu tel quel
    assert root.find("channel/language").text == "fr"


def test_run_writes_une_feed(tmp_path):
    status = run(_config(3), tmp_path, fetcher=lambda url: _good_feed(int(url[12])), json_fetcher=lambda u: (None, None), now=NOW, site_url="https://x.github.io/declic/")
    assert (tmp_path / "une.xml").exists()
    assert status["uneCount"] > 0
    assert b"https://x.github.io/declic/data/une.xml" in (tmp_path / "une.xml").read_bytes()


# --- points de vue : entités et rapprochements élargis ------------------------------

def test_entities_skip_title_start_and_punctuation():
    from declic.cluster import entities

    assert entities("Tennis : Carlos Alcaraz remporte le Masters de Paris") >= {"carlos alcaraz", "paris"}
    assert "tennis" not in entities("Tennis : Carlos Alcaraz remporte le Masters de Paris")
    assert "gadi eisenkot" in entities("En Israël, Gadi Eisenkot affirme que le Likoud est bienvenu")


def test_cross_language_cluster_needs_two_rare_entities():
    arts = [
        _art(1, "En Israël, Gadi Eisenkot chargé de former une coalition avec le Likoud", "franceinfo"),
        _art(2, "Israel's Gadi Eisenkot asked to form a coalition, Likud welcome", "BBC", lang="en"),
        _art(3, "Donald Trump s'exprime sur la Chine", "Le Figaro"),
        _art(4, "Donald Trump et le budget américain", "Libération"),
    ]
    clusters = build_clusters(arts)
    ids = [set(c["articleIds"]) for c in clusters]
    assert {"a1", "a2"} in ids
    assert not any({"a3", "a4"} <= s for s in ids)  # une seule entité commune : pas de rapprochement
    c = next(c for c in clusters if "a1" in c["articleIds"])
    assert "gadi eisenkot" in c["entities"] and c["langs"] == ["en", "fr"]


def test_related_analyses_are_linked_by_entity():
    from declic.cluster import related_analyses

    arts = [
        _art(1, "Ukraine : les Européens invités aux négociations d'Abu Dhabi", "franceinfo"),
        _art(2, "Les Européens à la table des négociations sur l'Ukraine à Abu Dhabi", "Le Monde"),
        dict(_art(3, "Pourquoi les négociations d'Abu Dhabi divisent les Européens", "The Conversation"), kind="analysis"),
        dict(_art(4, "Comment les abeilles communiquent", "The Conversation"), kind="analysis"),
    ]
    clusters = build_clusters(arts)
    related_analyses(clusters, arts)
    c = next(c for c in clusters if "a1" in c["articleIds"])
    assert c["analysisIds"] == ["a3"]


# --- quiz de l'actu --------------------------------------------------------------------

def test_quiz_questions_come_verbatim_from_titles():
    from declic.quiz import MASK, build_quiz

    titles = [
        ("Au large du Sénégal, au moins 34 personnes sont mortes dans un naufrage", "France 24"),
        ("Tennis : Carlos Alcaraz remporte pour la première fois le Masters de Paris", "France 24"),
        ("Présidentielle : Raphaël Glucksmann affirme qu'il retournera manifester", "franceinfo"),
        ("Négociations : Gadi Eisenkot reçoit le mandat de former un gouvernement", "Le Monde"),
        ("Formule 1 : Lando Norris gagne sous la pluie au Brésil", "franceinfo"),
        ("La Pologne en deuil après l'attaque de Cracovie", "Le Soir"),
    ]
    arts = [dict(_art(i, t, s), publishedAt="2026-11-08T18:00:00+00:00") for i, (t, s) in enumerate(titles)]
    quiz = build_quiz(arts, [], NOW)
    assert quiz["questions"]
    by_id = {a["id"]: a for a in arts}
    for q in quiz["questions"]:
        art = by_id[q["articleId"]]
        assert q["article"]["url"] == art["url"]
        assert 0 <= q["answer"] < len(q["options"]) and len(set(q["options"])) == len(q["options"])
        if q["text"]:
            assert MASK in q["text"]
            # remettre la solution à la place du masque redonne exactement le titre publié
            restored = q["text"].replace(MASK, q["solution"].split(" ")[0] if q["type"] == "nombre" else q["solution"], 1)
            if q["type"] == "nombre":
                assert q["solution"].split(" ")[0].replace(" ", "") in art["title"].replace(" ", "")
            else:
                assert restored == art["title"]


def test_quiz_angle_question_uses_cluster_titles():
    from declic.quiz import build_quiz

    arts = [
        dict(_art(1, "En Israël, Gadi Eisenkot chargé de former une coalition gouvernementale", "franceinfo"), publishedAt="2026-11-08T18:00:00+00:00"),
        dict(_art(2, "Gadi Eisenkot officiellement chargé de former le prochain gouvernement en Israël", "France 24"), publishedAt="2026-11-08T17:00:00+00:00"),
    ]
    clusters = build_clusters(arts)
    quiz = build_quiz(arts, clusters, NOW)
    angle = [q for q in quiz["questions"] if q["type"] == "angle"]
    assert len(angle) == 1
    q = angle[0]
    assert set(q["options"]) == {a["title"] for a in arts}
    assert q["coverage"] and q["coverage"][0]["title"] in q["options"]


def test_opinion_excluded_from_quiz_and_une_but_linked_to_topics():
    from declic.cluster import build_clusters, related_analyses
    from declic.feed import select_une
    from declic.quiz import build_quiz
    now = datetime(2026, 11, 8, 19, tzinfo=timezone.utc)
    arts = [
        _art(1, "Gadi Eisenkot chargé de former le gouvernement en Israël", "Média A"),
        _art(2, "Israël : Gadi Eisenkot reçoit la mission de former une coalition", "Média B"),
        dict(_art(3, "Gadi Eisenkot peut-il réconcilier Israël ?", "Tribunes"), kind="opinion"),
    ]
    clusters = build_clusters(arts)
    related_analyses(clusters, arts)
    assert clusters and arts[2]["id"] in clusters[0]["analysisIds"]
    assert arts[2]["id"] not in clusters[0]["articleIds"]
    assert all(a["kind"] != "opinion" for a in select_une(arts, clusters, now))
    quiz = build_quiz(arts, clusters, now)
    assert all(q["articleId"] != arts[2]["id"] for q in quiz["questions"] + quiz["pool"])


def test_quiz_distractors_are_unambiguous_and_same_shape():
    from declic.quiz import _entity_question, _shape, _too_close
    assert _too_close("Gadi Eisenkot", "Gadi Eizenkot")
    assert _too_close("Louis Burton", "Luis Burto")
    assert not _too_close("Gadi Eisenkot", "Donald Trump")
    assert _shape("Donald Trump") == "personne"
    assert _shape("RC Lens") == "autre" and _shape("Jean de La Fontaine") == "autre"
    assert _shape("Rolex Paris Masters") == "autre" and _shape("Maison Blanche") == "autre"
    art = _art(1, "Israël : Gadi Eisenkot appelle à l'unité", "Média A")
    others = ["Gadi Eizenkot", "Donald Trump", "Fabien Roussel", "RC Lens", "Tom Laperche", "Raphaël Glucksmann"]
    q = _entity_question(art, others)
    assert q and q["solution"] == "Gadi Eisenkot"
    assert "Gadi Eizenkot" not in q["options"] and "RC Lens" not in q["options"]


def _fake_wikimedia(licence="cc-by-sa-4.0", human=True, country=False, file="Gadi Eisenkot 2 (cropped).jpg"):
    import urllib.parse as up
    calls = []

    def fetch_json(url):
        calls.append(url)
        q = dict(up.parse_qsl(up.urlsplit(url).query))
        if url.startswith("https://fr.wikipedia.org"):
            pages = [{"title": t, "pageprops": {"wikibase_item": "Q796885"}} if t == "Gadi Eisenkot" else {"title": t, "missing": True}
                     for t in q["titles"].split("|")]
            return {"query": {"pages": pages}}, None
        if url.startswith("https://query.wikidata.org"):
            return {"results": {"bindings": [{
                "item": {"value": "http://www.wikidata.org/entity/Q796885"},
                "image": {"value": "http://commons.wikimedia.org/wiki/Special:FilePath/" + up.quote(file.replace(" ", "_"))},
                "human": {"value": "true" if human else "false"}, "place": {"value": "false"},
                "country": {"value": "true" if country else "false"}}]}}, None
        if url.startswith("https://commons.wikimedia.org"):
            return {"query": {"pages": [{"title": "File:" + file, "imageinfo": [{
                "mime": "image/jpeg", "width": 1200, "height": 1500,
                "thumburl": "https://upload.wikimedia.org/x/800px-g.jpg", "thumbwidth": 800, "thumbheight": 1000,
                "descriptionurl": "https://commons.wikimedia.org/wiki/File:G.jpg",
                "extmetadata": {"License": {"value": licence}, "LicenseShortName": {"value": "CC BY-SA 4.0"},
                                "Artist": {"value": "<a href='x'>IDF Spokesperson</a>"},
                                "LicenseUrl": {"value": "https://creativecommons.org/licenses/by-sa/4.0"}}}]}]}}, None
        raise AssertionError(url)

    def fetch_bytes(url):
        return b"\xff\xd8\xff\xe0" + b"0" * 2000, None

    return fetch_json, fetch_bytes, calls


def test_photos_free_licence_attached_with_credit(tmp_path):
    from declic.photos import attach_photos
    now = datetime(2026, 11, 8, 19, tzinfo=timezone.utc)
    arts = [dict(_art(1, "Israël : Gadi Eisenkot appelle à l'unité", "Média A"), publishedAt="2026-11-08T18:00:00+00:00")]
    fj, fb, calls = _fake_wikimedia()
    stats = attach_photos(arts, now, tmp_path, fj, fb)
    img = arts[0]["image"]
    assert img and img["illustration"] and img["subject"] == "Gadi Eisenkot"
    assert img["credit"] == "IDF Spokesperson" and img["license"] == "CC BY-SA 4.0"
    assert img["url"].startswith("./data/img/") and (tmp_path / "img" / img["url"].rsplit("/", 1)[-1]).exists()
    assert stats["attached"] == 1
    # Deuxième passage : le cache évite de réinterroger Wikimedia.
    arts[0]["image"] = None
    fj2, fb2, calls2 = _fake_wikimedia()
    attach_photos(arts, now, tmp_path, fj2, fb2, cache=stats["cache"])
    assert not calls2 and arts[0]["image"]


def test_photos_rejects_non_free_country_and_logos(tmp_path):
    from declic.photos import attach_photos
    now = datetime(2026, 11, 8, 19, tzinfo=timezone.utc)
    for kwargs in ({"licence": "fair use"}, {"country": True}, {"human": False}, {"file": "Logo Eisenkot.jpg"}):
        arts = [dict(_art(1, "Israël : Gadi Eisenkot appelle à l'unité", "Média A"), publishedAt="2026-11-08T18:00:00+00:00")]
        fj, fb, _ = _fake_wikimedia(**kwargs)
        attach_photos(arts, now, tmp_path, fj, fb)
        assert arts[0]["image"] is None, kwargs


def test_photo_subjects():
    from declic.photos import subjects_for
    assert subjects_for("Attentat à Cracovie : Donald Tusk en deuil", set(), set()) == ["Cracovie", "Donald Tusk"]
    assert subjects_for("Inondations en Espagne", set(), set()) == []
