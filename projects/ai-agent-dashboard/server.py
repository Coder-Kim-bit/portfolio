import http.server
import socketserver
import os
import sys

DEFAULT_PORT = 8000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class CustomHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        super().end_headers()

    def guess_type(self, path):
        if path.endswith('.js'):
            return 'application/javascript'
        if path.endswith('.css'):
            return 'text/css'
        if path.endswith('.json'):
            return 'application/json'
        return super().guess_type(path)

def start_server():
    socketserver.TCPServer.allow_reuse_address = True
    port = DEFAULT_PORT
    for p in range(DEFAULT_PORT, DEFAULT_PORT + 10):
        try:
            with socketserver.TCPServer(("", p), CustomHTTPRequestHandler) as httpd:
                print(f"\n[AI Agent Dashboard Server] Serving on http://localhost:{p}")
                print(f"[Info] Press Ctrl+C to stop the server.\n")
                sys.stdout.flush()
                httpd.serve_forever()
                break
        except OSError:
            print(f"[Note] Port {p} is currently in use, trying port {p+1}...")

if __name__ == '__main__':
    try:
        start_server()
    except KeyboardInterrupt:
        print("\n[Server stopped]")
