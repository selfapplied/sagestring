#!/usr/bin/env python3
"""
Simple HTTP server with CORS headers for local development
"""
import http.server
import socketserver
import sys
import os

# Change to script directory (project root)
os.chdir(os.path.dirname(os.path.abspath(__file__)))

class CORSRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8000

with socketserver.TCPServer(("", PORT), CORSRequestHandler) as httpd:
    print(f"Server running at http://localhost:{PORT}/")
    print(f"Open: http://localhost:{PORT}/demos/livecam/liveCam.html")
    print("Press Ctrl+C to stop")
    httpd.serve_forever()

