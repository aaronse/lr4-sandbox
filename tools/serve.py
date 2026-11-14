# Serve one of the pages on localhost and open it in the browser (Ctrl+C stops the server):
#   python tools/serve.py sandbox [WxH]        the repo on http://127.0.0.1:8767, opening web/index.html?parts=/parts/
#                                              (e.g. 48x96 = a 48 x 96 in cutting area): the public page and data,
#                                              with your part files fetched from parts/
#   (--no-open: serve only, e.g. for tools/record_demo.js; --port=N: another port)
#   (--lan: also to other computers on the network; private/ and dotfiles are refused. Plain http from another
#    machine is not a secure context, so FluidNC in the browser needs that origin allowed in the browser's flags.
#    Windows Firewall may ask once)
# Both send COOP / COEP (credentialless, so the CDN scripts still load): the page is cross-origin isolated, which
# FluidNC in the browser needs (SharedArrayBuffer). A plain static host gets the same from web/coi-serviceworker.js.
# Range requests (seek in a video or audio file; iOS Safari won't play a video without them), capped at 8 MB a
# response, HTTP/1.1 keep-alive, a 128-deep listen backlog and quiet disconnects: ported from media-gen
# scripts/server.py (which took them from media-browser's NAS server, where each one was found the hard way).
import functools
import http.server
import os
import re
import socket
import sys
import threading
import webbrowser

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RANGE_CHUNK_CAP = 8 * 1024 * 1024    # browsers send open-ended bytes=X- on each seek and abort once buffered


class LimitedReader:
    """At most n bytes of f: copyfile() streams a Range's slice and no more."""
    def __init__(self, f, n):
        self.f, self.n = f, n

    def read(self, size=-1):
        if self.n <= 0:
            return b""
        b = self.f.read(self.n if size < 0 else min(size, self.n))
        self.n -= len(b)
        return b

    def close(self):
        self.f.close()


class Isolated(http.server.SimpleHTTPRequestHandler):
    protocol_version = "HTTP/1.1"      # keep-alive between Range chunks (every response carries Content-Length)
    timeout = 30                       # an idle keep-alive socket holds a thread: give it a deadline
    disable_nagle_algorithm = True     # Nagle vs delayed ACK: ~40 ms a request

    def end_headers(self):
        self.send_header("Cross-Origin-Opener-Policy", "same-origin")
        self.send_header("Cross-Origin-Embedder-Policy", "credentialless")
        self.send_header("Cache-Control", "no-cache")   # always check for a newer file (edited scripts show on reload)
        self.send_header("Accept-Ranges", "bytes")
        super().end_headers()

    def send_head(self):                       # --lan: never hand private/ or .git to the network
        path = self.translate_path(self.path)
        rel = os.path.relpath(os.path.realpath(path), os.path.realpath(self.directory))
        top = rel.replace("\\", "/").split("/", 1)[0].lower()
        if LAN and (top == "private" or top.startswith(".")):
            self.send_error(404)
            return None
        m = re.fullmatch(r"\s*bytes=(\d*)-(\d*)\s*", self.headers.get("Range") or "")
        if m and (m.group(1) or m.group(2)) and os.path.isfile(path):
            return self.send_range(path, m)
        return super().send_head()

    def send_range(self, path, m):
        size = os.path.getsize(path)
        if m.group(1):
            start = int(m.group(1))
            end = min(int(m.group(2)) if m.group(2) else size - 1, size - 1)
        else:                                  # bytes=-N: the last N bytes
            start, end = max(0, size - int(m.group(2))), size - 1
        if start >= size or start > end:
            self.send_response(416)
            self.send_header("Content-Range", f"bytes */{size}")
            self.send_header("Content-Length", "0")
            self.end_headers()
            return None
        end = min(end, start + RANGE_CHUNK_CAP - 1)    # capped: the client asks for the next part itself
        f = open(path, "rb")
        f.seek(start)
        self.send_response(206)
        self.send_header("Content-Type", self.guess_type(path))
        self.send_header("Content-Range", f"bytes {start}-{end}/{size}")
        self.send_header("Content-Length", str(end - start + 1))
        self.end_headers()
        return LimitedReader(f, end - start + 1)


class Server(http.server.ThreadingHTTPServer):
    request_queue_size = 128           # the stdlib's 5 drops a video's reconnect burst silently
    allow_reuse_address = sys.platform != "win32"   # Windows' SO_REUSEADDR lets a second server share a port in use, and the old one answers
    daemon_threads = True

    def handle_error(self, request, client_address):
        if isinstance(sys.exc_info()[1], (ConnectionResetError, ConnectionAbortedError, BrokenPipeError)):
            return                             # a paused video or a closed tab: not a server fault
        super().handle_error(request, client_address)


LAN = "--lan" in sys.argv


PAGES = {"sandbox": (ROOT, 8767, "web/index.html")}


if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if a not in ("--no-open", "--lan") and not a.startswith("--port=")]
    no_open = "--no-open" in sys.argv          # headless: tools/record_demo.js, the page tests
    which = args[0] if args else ""
    which = {"configurator": "sandbox"}.get(which, which)   # the page's old name
    if which not in PAGES:
        sys.exit("usage: python tools/serve.py sandbox [WxH]")
    folder, port, page = PAGES[which]
    port = next((int(a[7:]) for a in sys.argv if a.startswith("--port=")), port)
    if not os.path.exists(os.path.join(folder, page)):
        sys.exit(f"{os.path.join(folder, page)} not found")
    url = f"http://127.0.0.1:{port}/{page}" + ("?parts=/parts/" if which == "sandbox" else "") + (f"#{args[1]}" if len(args) > 1 else "")
    handler = functools.partial(Isolated, directory=folder)
    server = Server(("0.0.0.0" if LAN else "127.0.0.1", port), handler)
    print(f"serving {folder} at {url} - Ctrl+C to stop", flush=True)
    if LAN:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("192.0.2.1", 9))           # no packet sent: just picks the interface the default route uses
        ip = s.getsockname()[0]
        s.close()
        print(f"  on the network: {url.replace('127.0.0.1', ip)}", flush=True)
    if not no_open:
        threading.Timer(0.5, webbrowser.open, (url,)).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
