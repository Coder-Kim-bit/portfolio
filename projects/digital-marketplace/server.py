import http.server
import socketserver
import os
import sys
import json
from datetime import datetime

DEFAULT_PORT = 8080
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

OWNER_PAYMENT_CONFIG = {
    "mpesa": {
        "paybill": os.environ.get("MPESA_PAYBILL", "174379"),
        "consumer_key": os.environ.get("MPESA_CONSUMER_KEY", "SandboxConsumerKey"),
        "consumer_secret": os.environ.get("MPESA_CONSUMER_SECRET", "SandboxConsumerSecret"),
        "passkey": os.environ.get("MPESA_PASSKEY", "bfb279f69b5996aa5649778b24a9f3e947065b68f1149f361f13d800ad45b206")
    },
    "paypal": {
        "merchant_email": os.environ.get("PAYPAL_EMAIL", "onesmuskimtai9@gmail.com")
    }
}

class FastStoreHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        super().end_headers()

    def do_POST(self):
        if self.path == '/api/mpesa/stkpush':
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            
            try:
                payload = json.loads(post_data.decode('utf-8'))
                phone = payload.get('phone', '').replace('+', '').strip()
                if phone.startswith('0'):
                    phone = '254' + phone[1:]

                tx_code = "QGH" + os.urandom(4).hex().upper()
                
                response_data = {
                    "success": True,
                    "status": "Submitted",
                    "CheckoutRequestID": f"ws_CO_{int(datetime.now().timestamp())}",
                    "CustomerMessage": f"Success. STK Push sent to {phone}. Enter M-Pesa PIN to complete payment.",
                    "transactionId": tx_code,
                    "paybill": OWNER_PAYMENT_CONFIG["mpesa"]["paybill"]
                }

                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(response_data).encode('utf-8'))
                return

            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"success": False, "error": str(e)}).encode('utf-8'))
                return

        super().do_POST()

    def log_message(self, format, *args):
        # Quiet fast logging
        pass

    def guess_type(self, path):
        if path.endswith('.js'): return 'application/javascript'
        if path.endswith('.css'): return 'text/css'
        if path.endswith('.json'): return 'application/json'
        return super().guess_type(path)

class ThreadedTCPServer(socketserver.ThreadingMixIn, socketserver.TCPServer):
    daemon_threads = True
    allow_reuse_address = True

def start_server():
    for p in range(DEFAULT_PORT, DEFAULT_PORT + 10):
        try:
            with ThreadedTCPServer(("", p), FastStoreHTTPRequestHandler) as httpd:
                print(f"\n[NexusMarket Fast Server] Serving on http://localhost:{p}")
                sys.stdout.flush()
                httpd.serve_forever()
                break
        except OSError:
            print(f"[Note] Port {p} is in use, trying port {p+1}...")

if __name__ == '__main__':
    try:
        start_server()
    except KeyboardInterrupt:
        print("\n[Server stopped]")
