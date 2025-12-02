#!/usr/bin/env python3

"""
Self-Managing HTTP Server for Guardian Consciousness Ecology

This server monitors its own PID file and shuts down gracefully when:
1. The PID file is deleted (indicating external shutdown request)
2. Inactivity timeout is reached
3. Server process receives termination signal

Usage: python3 self_managing_server.py <port> <pid_file> <timeout_seconds>
"""

import sys
import os
import time
import signal
import threading
from http.server import HTTPServer, SimpleHTTPRequestHandler
import socket

class SelfManagingHTTPRequestHandler(SimpleHTTPRequestHandler):
    """HTTP request handler that tracks activity."""

    def log_message(self, format, *args):
        # Update activity timestamp on any request
        self.server.last_activity = time.time()
        super().log_message(format, *args)

    def end_headers(self):
        # Add CORS headers for web app
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

class SelfManagingHTTPServer(HTTPServer):
    """HTTP server that monitors its own PID file and activity."""

    def __init__(self, server_address, RequestHandlerClass, pid_file, timeout_seconds):
        super().__init__(server_address, RequestHandlerClass)
        self.pid_file = pid_file
        self.timeout_seconds = timeout_seconds
        self.last_activity = time.time()
        self.start_time = time.time()
        self.should_shutdown = False

        # Write PID file
        with open(pid_file, 'w') as f:
            f.write(f"READY:{server_address[1]}:{int(time.time())}:{os.getpid()}\n")
            f.flush()
            os.fsync(f.fileno())  # Ensure it's written to disk

        print(f"📁 PID file created: {pid_file}")
        print(f"🌐 Server ready on port {server_address[1]}")
        print(f"⏰ Inactivity timeout: {timeout_seconds}s")

        # Set up signal handlers
        signal.signal(signal.SIGTERM, self.signal_handler)
        signal.signal(signal.SIGINT, self.signal_handler)

        # Start monitoring thread
        self.monitor_thread = threading.Thread(target=self.monitor_activity, daemon=True)
        self.monitor_thread.start()

    def signal_handler(self, signum, frame):
        """Handle termination signals."""
        print(f"\n🛑 Received signal {signum} - initiating shutdown...")
        self.should_shutdown = True
        self.shutdown()

    def monitor_activity(self):
        """Monitor activity and PID file existence."""
        check_interval = 30  # Check every 30 seconds

        while not self.should_shutdown:
            try:
                time.sleep(check_interval)
                current_time = time.time()

                # Check if PID file still exists
                if not os.path.exists(self.pid_file):
                    print("📁 PID file deleted - external shutdown requested")
                    self.should_shutdown = True
                    self.shutdown()
                    break

                # Check for inactivity timeout
                inactive_time = current_time - self.last_activity
                if inactive_time > self.timeout_seconds:
                    uptime = current_time - self.start_time
                    print(f"💤 Inactivity timeout reached ({self.timeout_seconds}s)")
                    print(f"📊 Server uptime: {uptime:.1f}s")
                    self.should_shutdown = True
                    self.shutdown()
                    break

                # Progress indicator
                uptime = current_time - self.start_time
                inactive_display = int(inactive_time)
                print(f"✅ Server healthy (uptime: {uptime:.0f}s, inactive: {inactive_display}s)")

            except Exception as e:
                print(f"❌ Monitor error: {e}")
                break

    def cleanup(self):
        """Clean up resources on shutdown."""
        try:
            if os.path.exists(self.pid_file):
                os.remove(self.pid_file)
                print("🗑️ PID file removed")
        except Exception as e:
            print(f"⚠️ Cleanup warning: {e}")

def main():
    if len(sys.argv) != 4:
        print("Usage: python3 self_managing_server.py <port> <pid_file> <timeout_seconds>")
        sys.exit(1)

    try:
        port = int(sys.argv[1])
        pid_file = sys.argv[2]
        timeout_seconds = int(sys.argv[3])
    except ValueError as e:
        print(f"Error parsing arguments: {e}")
        sys.exit(1)

    # Check if port is available
    try:
        test_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        test_socket.bind(('localhost', port))
        test_socket.close()
    except OSError:
        print(f"❌ Port {port} is already in use")
        sys.exit(1)

    print("🌟 Starting Guardian Consciousness Ecology Server")
    print(f"📡 Port: {port}")
    print(f"📁 PID file: {pid_file}")

    try:
        server = SelfManagingHTTPServer(
            ('localhost', port),
            SelfManagingHTTPRequestHandler,
            pid_file,
            timeout_seconds
        )

        print("🚀 Server starting...")
        server.serve_forever()

    except KeyboardInterrupt:
        print("\n🛑 Keyboard interrupt received")
    except Exception as e:
        print(f"❌ Server error: {e}")
    finally:
        if 'server' in locals():
            server.cleanup()
        print("✅ Server shutdown complete")

if __name__ == '__main__':
    main()
