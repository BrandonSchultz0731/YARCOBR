#!/usr/bin/env python3
"""
Local preview server that serves this site the way GitHub Pages does.

The site's links are extensionless (/about rather than /about.html), because
that is how GitHub Pages serves them. Plain `python3 -m http.server` does not
do that — it returns 404 for /about, since the file on disk is about.html — so
clicking around locally would look broken even though the live site is fine.

This server adds that one behaviour and nothing else.

    python3 scripts/serve.py          # http://localhost:8000
    python3 scripts/serve.py 8080     # pick another port

Stop it with Ctrl+C.
"""

import http.server
import os
import socketserver
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8000


class GitHubPagesHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def translate_path(self, path):
        local = super().translate_path(path)
        # /about -> about.html, matching GitHub Pages. Directories and paths
        # that already exist are left alone.
        if not os.path.exists(local) and os.path.isfile(local + ".html"):
            return local + ".html"
        return local

    def send_error(self, code, message=None, explain=None):
        # Serve /404.html for missing pages, as GitHub Pages does, so the
        # custom error page can be previewed locally.
        page = os.path.join(ROOT, "404.html")
        if code == 404 and os.path.isfile(page):
            with open(page, "rb") as fh:
                body = fh.read()
            self.send_response(404)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            if self.command != "HEAD":
                self.wfile.write(body)
            return
        super().send_error(code, message, explain)

    def log_message(self, fmt, *args):
        sys.stderr.write("  %s\n" % (fmt % args))


class ReusableServer(socketserver.TCPServer):
    allow_reuse_address = True


if __name__ == "__main__":
    with ReusableServer(("", PORT), GitHubPagesHandler) as httpd:
        # flush so the banner appears immediately even when output is piped
        print("Serving %s" % ROOT, flush=True)
        print("Open http://localhost:%d  (Ctrl+C to stop)" % PORT, flush=True)
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nStopped.")
