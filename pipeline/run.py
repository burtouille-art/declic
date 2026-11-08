#!/usr/bin/env python3
"""Point d'entrée du pipeline DÉCLIC.

Exemples :
  python pipeline/run.py --out public/data                       # collecte réelle
  python pipeline/run.py --out public/data --previous prev/      # avec données précédentes (CI)
  python pipeline/run.py --out public/data --seed pipeline/seed/snapshot.json   # hors ligne
"""
from __future__ import annotations

import argparse
import json
import os
import sys
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from declic.build import run  # noqa: E402


def main() -> int:
    parser = argparse.ArgumentParser(description="Collecte RSS DÉCLIC")
    parser.add_argument("--out", default="public/data", type=Path)
    parser.add_argument("--sources", default=Path(__file__).resolve().parent / "sources.json", type=Path)
    parser.add_argument("--previous", type=Path, help="dossier contenant les derniers news.json/status.json publiés")
    parser.add_argument("--seed", type=Path, help="instantané JSON à utiliser à la place du réseau")
    parser.add_argument("--now", help="date ISO forcée (tests, instantanés)")
    parser.add_argument("--site-url", default=os.environ.get("SITE_URL", ""), help="adresse publique du site (liens du flux RSS)")
    args = parser.parse_args()

    config = json.loads(args.sources.read_text(encoding="utf-8"))
    seed = json.loads(args.seed.read_text(encoding="utf-8")) if args.seed else None
    now = datetime.fromisoformat(args.now) if args.now else None
    status = run(config, args.out, previous_dir=args.previous, seed=seed, now=now, site_url=args.site_url)

    print(f"Articles : {status['articleCount']} — rapprochements : {status['clusterCount']}")
    print(f"Flux « À la une » : {status.get('uneCount', 0)} titres")
    print(f"Sources OK : {status['sourcesOk']}/{status['sourcesTotal']}" + (" (données précédentes conservées)" if status["keptPreviousData"] else ""))
    for s in status["sources"]:
        flag = "OK " if s["ok"] else "ERR"
        extra = f" — {s['error']}" if s["error"] else (f" — {s['warning']}" if s.get("warning") else "")
        print(f"  [{flag}] {s['id']:<26} {s['kept']:>3} articles{' (secours)' if s['usedFallback'] else ''}{extra}")
    # Le pipeline ne fait jamais échouer le déploiement : les données précédentes restent publiées.
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
