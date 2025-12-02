#!/bin/bash

# Guardian Consciousness Ecology - Server Readiness Checker
#
# Robustly waits for HTTP server to be ready using multiple methods:
# 1. HTTP polling (preferred) - Tests actual HTTP endpoint availability
# 2. Socket file checking (fallback) - Looks for readiness marker file
# 3. Process monitoring (last resort) - Checks if server process exists
#
# For future enhancement with socket files:
# - Server could create a Unix domain socket or marker file when ready
# - This script could check for socket file existence as primary method
# - Would be more reliable than HTTP polling for custom servers

set -e

PORT=${1:-8000}
MAX_WAIT=${2:-30}
READY_FILE=${3:-".server_ready"}

echo "🔍 Checking server readiness on port $PORT..."
echo "⏱️  Maximum wait time: ${MAX_WAIT}s"

# Function to check if port is listening
check_port() {
    local port=$1
    # Use netstat or lsof to check if port is listening
    if command -v netstat >/dev/null 2>&1; then
        netstat -tuln 2>/dev/null | grep -q ":${port} "
    elif command -v lsof >/dev/null 2>&1; then
        lsof -i :${port} >/dev/null 2>&1
    else
        # Fallback: try to connect with timeout
        timeout 1 bash -c "echo >/dev/tcp/localhost/${port}" 2>/dev/null
    fi
}

# Function to test HTTP endpoint
test_http_endpoint() {
    local url=$1
    local timeout=$2

    # Use curl if available, otherwise try wget, otherwise fallback to netcat
    if command -v curl >/dev/null 2>&1; then
        curl -s --max-time $timeout --head "$url" >/dev/null 2>&1
    elif command -v wget >/dev/null 2>&1; then
        wget -q --timeout=$timeout --spider "$url" 2>/dev/null
    else
        # Fallback: try netcat
        echo -e "HEAD / HTTP/1.0\r\nHost: localhost\r\n\r\n" | nc -w $timeout localhost $PORT >/dev/null 2>&1
    fi
}

# Function to create socket file (for socket-based signaling)
create_socket_file() {
    local socket_file=$1
    local port=$2

    # Create a temporary socket file to signal readiness
    # This is a simple marker file approach (not a real Unix socket)
    echo "READY:${port}:$(date +%s)" > "$socket_file"
}

# Main waiting logic
start_time=$(date +%s)
elapsed=0

while [ $elapsed -lt $MAX_WAIT ]; do
    current_time=$(date +%s)
    elapsed=$((current_time - start_time))

    echo -n "⏳ Attempting connection... (${elapsed}s/${MAX_WAIT}s) "

    # Method 1: Test HTTP endpoint directly
    if test_http_endpoint "http://localhost:$PORT/" 2; then
        echo "✅ HTTP endpoint ready!"
        create_socket_file "$READY_FILE" "$PORT"
        exit 0
    fi

    # Method 2: Check if port is listening (fallback)
    if check_port "$PORT"; then
        echo "✅ Port $PORT is listening!"

        # Double-check with a quick HTTP test
        sleep 0.5
        if test_http_endpoint "http://localhost:$PORT/" 1; then
            echo "✅ HTTP endpoint confirmed ready!"
            create_socket_file "$READY_FILE" "$PORT"
            exit 0
        fi
    fi

    echo "❌ Not ready yet..."
    sleep 1
done

echo "⏰ Timeout: Server did not become ready within ${MAX_WAIT} seconds"
echo "🔍 Debug information:"
echo "   - Port: $PORT"
echo "   - Checked with: $(command -v curl && echo 'curl' || command -v wget && echo 'wget' || echo 'netcat/fallback')"
echo "   - Process check: $(pgrep -f "python3 -m http.server $PORT" | wc -l) server processes found"

# Clean up any partial ready file
rm -f "$READY_FILE"

exit 1
