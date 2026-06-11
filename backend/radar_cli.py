# InternRadar CLI.
#
#   python3 radar_cli.py seed              seed companies + sources
#   python3 radar_cli.py scan [--all]      check due sources (--all forces every source)
#   python3 radar_cli.py discover          verify candidate sources from public lists
#   python3 radar_cli.py loop [minutes]    run scan+discover forever (default every 30 min)

from __future__ import annotations

import sys
import time

from dotenv import load_dotenv

load_dotenv()

from services.radar.scanner import scan, verify_discoveries  # noqa: E402
from services.radar.seeds import seed  # noqa: E402


def _print_scan(results: list) -> None:
    for r in results:
        flag = "ok " if r["ok"] else "ERR"
        line = f"  [{flag}] {r['source']:<45} found={r['found']:<4} new={r['new']}"
        if r.get("error"):
            line += f"  ({r['error'][:60]})"
        print(line)
    print(f"checked={len(results)} new={sum(r['new'] for r in results)}")


def main() -> None:
    cmd = sys.argv[1] if len(sys.argv) > 1 else "scan"

    if cmd == "seed":
        print(seed())
    elif cmd == "scan":
        _print_scan(scan(force_all="--all" in sys.argv))
    elif cmd == "discover":
        for r in verify_discoveries(limit=20):
            print(" ", r)
    elif cmd == "loop":
        minutes = int(sys.argv[2]) if len(sys.argv) > 2 else 30
        print(f"InternRadar loop: scanning every {minutes} min. Ctrl-C to stop.")
        while True:
            _print_scan(scan())
            verify_discoveries(limit=10)
            time.sleep(minutes * 60)
    else:
        print(__doc__)
        sys.exit(1)


if __name__ == "__main__":
    main()
