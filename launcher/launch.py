#!/usr/bin/env python3
"""Open MathAnimation, reusing a matching local server when possible."""

import argparse
import functools
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import subprocess
import sys
import time
from urllib.error import URLError
from urllib.request import ProxyHandler, build_opener

ROOT = Path(__file__).resolve().parent.parent
PORTS = range(8100, 8111)
OPENER = build_opener(ProxyHandler({}))


def serves_project(port):
    try:
        with OPENER.open(f"http://127.0.0.1:{port}/index.html", timeout=0.4) as response:
            return response.read() == (ROOT / "index.html").read_bytes()
    except (OSError, URLError):
        return False


def serve(port):
    handler = functools.partial(SimpleHTTPRequestHandler, directory=str(ROOT))
    with ThreadingHTTPServer(("127.0.0.1", port), handler) as server:
        server.serve_forever()


def launch(open_browser=True):
    for port in PORTS:
        if serves_project(port):
            break
    else:
        for port in PORTS:
            process = subprocess.Popen(
                [sys.executable, str(Path(__file__).resolve()), "--serve", str(port)],
                stdin=subprocess.DEVNULL,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                start_new_session=True,
            )
            for _ in range(30):
                if serves_project(port):
                    break
                if process.poll() is not None:
                    break
                time.sleep(0.1)
            if serves_project(port):
                break
            if process.poll() is None:
                process.terminate()
        else:
            raise RuntimeError("ポート8100〜8110でサーバを起動できませんでした。")
    url = f"http://127.0.0.1:{port}/"
    if open_browser:
        subprocess.run(["/usr/bin/open", url], check=True)
    return url


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--serve", type=int)
    parser.add_argument("--no-open", action="store_true")
    args = parser.parse_args()
    if args.serve is not None:
        serve(args.serve)
    else:
        print(launch(not args.no_open))
