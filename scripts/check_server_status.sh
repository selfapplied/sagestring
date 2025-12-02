#!/bin/bash

# Guardian Consciousness Ecology - Server Status Checker
#
# Verifies that the ready file corresponds to an actually running server
# Returns:
#   0 - Server is running and matches ready file
#   1 - Server not running or doesn't match ready file
#   2 - Ready file invalid/corrupted

set -e

PORT=${1:-8000}
READY_FILE=${2:-".server_ready"}

# Function to test HTTP endpoint
test_http_endpoint() {
    local url=$1
    local timeout=${2:-5}

    if command -v curl >/dev/null 2>&1; then
        curl -s --max-time $timeout --head "$url" >/dev/null 2>&1
    elif command -v wget >/dev/null 2>&1; then
        wget -q --timeout=$timeout --spider "$url" 2>/dev/null
    else
        echo -e "HEAD / HTTP/1.0\r\nHost: localhost\r\n\r\n" | nc -w $timeout localhost $PORT >/dev/null 2>&1
    fi
}

# Check if ready file exists
if [ ! -f "$READY_FILE" ]; then
    echo "❌ Ready file '$READY_FILE' does not exist"
    exit 1
fi

# Read and validate ready file contents
if ! ready_content=$(cat "$READY_FILE" 2>/dev/null); then
    echo "❌ Cannot read ready file '$READY_FILE'"
    exit 2
fi

# Parse ready file format: "READY:port:timestamp:pid"
if [[ $ready_content =~ ^READY:([0-9]+):([0-9]+):([0-9]+)$ ]]; then
    ready_port="${BASH_REMATCH[1]}"
    ready_timestamp="${BASH_REMATCH[2]}"
    ready_pid="${BASH_REMATCH[3]}"

    # Check if port matches expected port
    if [ "$ready_port" != "$PORT" ]; then
        echo "❌ Ready file port ($ready_port) doesn't match expected port ($PORT)"
        exit 2
    fi

    # Check if PID is still running
    if ! kill -0 "$ready_pid" 2>/dev/null; then
        echo "❌ Server process (PID: $ready_pid) is not running"
        exit 1
    fi

    # Check if timestamp is reasonable (not too old, not in future)
    current_time=$(date +%s)
    age=$((current_time - ready_timestamp))

    if [ $age -gt 3600 ]; then  # 1 hour
        echo "❌ Ready file is too old (${age}s) - server likely crashed"
        exit 1
    fi

    if [ $age -lt -60 ]; then  # 1 minute in future (clock skew)
        echo "❌ Ready file timestamp is in the future - possible corruption"
        exit 2
    fi

else
    echo "❌ Ready file has invalid format: '$ready_content'"
    echo "   Expected format: 'READY:port:timestamp'"
    exit 2
fi

# Test actual server connectivity
echo "🔍 Testing server connectivity on port $PORT..."
if test_http_endpoint "http://localhost:$PORT/" 3; then
    echo "✅ Server is responding on port $PORT"
    exit 0
else
    echo "❌ Server not responding despite valid ready file"
    exit 1
fi
