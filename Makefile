# Guardian Consciousness Ecology - Development Makefile

.PHONY: server demo clean help open

# Configuration
PORT := 10000
URL := http://localhost:$(PORT)/spatiotemporal_continuity.html
READY_FILE := .server_ready
MAX_WAIT := 30
MPLCONFIGDIR := $(PWD)/.matplotlib_cache
PYTHON := .venv/bin/python

# Default target
all: demo

# Start server and open guardian demo with proper readiness checking
demo: scripts/wait_for_server.sh scripts/check_server_status.sh scripts/self_managing_server.py
	@echo "🌟 Starting Guardian Consciousness Ecology..."
	@if [ -f $(READY_FILE) ]; then \
		echo "📁 Ready file exists - checking if server is already running..."; \
		READY_CONTENT=$$(cat $(READY_FILE) 2>/dev/null); \
		if [[ $$READY_CONTENT =~ READY:$(PORT):[0-9]+:([0-9]+) ]]; then \
			SERVER_PID="$${BASH_REMATCH[1]}"; \
			if kill -0 "$$SERVER_PID" 2>/dev/null; then \
				./scripts/check_server_status.sh $(PORT) $(READY_FILE); \
				if [ $$? -eq 0 ]; then \
					echo "✅ Server is already running - opening demo..."; \
					open $(URL); \
					echo "💡 Server was already running"; \
					exit 0; \
				fi; \
			else \
				echo "📁 Server process not found - cleaning up stale ready file..."; \
				rm -f $(READY_FILE); \
			fi; \
		else \
			echo "📁 Invalid ready file format - cleaning up..."; \
			rm -f $(READY_FILE); \
		fi; \
	fi
	@echo "📡 Launching self-managing HTTP server on port $(PORT)..."
	@MPLCONFIGDIR=$(MPLCONFIGDIR) $(PYTHON) scripts/self_managing_server.py $(PORT) $(READY_FILE) 300 &
	@echo "⏳ Waiting for server to be ready..."
	@./scripts/wait_for_server.sh $(PORT) $(MAX_WAIT) $(READY_FILE)
	@if [ -f $(READY_FILE) ]; then \
		echo "🌐 Opening spatiotemporal continuity demo..."; \
		open $(URL); \
		echo "✅ Guardian ecology is now running!"; \
		echo "💡 Press Ctrl+C to stop the server (ready file: $(READY_FILE))"; \
	else \
		echo "❌ Server failed to start within $(MAX_WAIT) seconds"; \
		exit 1; \
	fi

# Start server only
server: scripts/self_managing_server.py
	@echo "📡 Starting self-managing HTTP server on port $(PORT)..."
	@MPLCONFIGDIR=$(MPLCONFIGDIR) $(PYTHON) scripts/self_managing_server.py $(PORT) $(READY_FILE) 300

# Open demo page (checks server status first)
open: scripts/check_server_status.sh
	@if [ -f $(READY_FILE) ]; then \
		READY_CONTENT=$$(cat $(READY_FILE) 2>/dev/null); \
		if [[ $$READY_CONTENT =~ READY:$(PORT):[0-9]+:([0-9]+) ]]; then \
			SERVER_PID="$${BASH_REMATCH[1]}"; \
			if kill -0 "$$SERVER_PID" 2>/dev/null; then \
				./scripts/check_server_status.sh $(PORT) $(READY_FILE); \
				if [ $$? -eq 0 ]; then \
					echo "✅ Server is running - opening demo..."; \
					open $(URL); \
				else \
					echo "❌ Server not responding despite ready file - cleaning up..."; \
					rm -f $(READY_FILE); \
					exit 1; \
				fi; \
			else \
				echo "❌ Server process not found - cleaning up stale ready file..."; \
				rm -f $(READY_FILE); \
				exit 1; \
			fi; \
		else \
			echo "❌ Invalid ready file - cleaning up..."; \
			rm -f $(READY_FILE); \
			exit 1; \
		fi; \
	else \
		echo "❓ No ready file found - attempting to open anyway..."; \
		echo "⚠️  Note: Server may not be running"; \
		open $(URL); \
	fi

# Clean up any background processes and files
clean:
	@echo "🧹 Cleaning up background processes and files..."
	@if [ -f $(READY_FILE) ]; then \
		READY_CONTENT=$$(cat $(READY_FILE) 2>/dev/null); \
		if [[ $$READY_CONTENT =~ READY:$(PORT):[0-9]+:([0-9]+) ]]; then \
			SERVER_PID="$${BASH_REMATCH[1]}"; \
			echo "🛑 Stopping server process (PID: $$SERVER_PID)..."; \
			kill "$$SERVER_PID" 2>/dev/null || true; \
			wait "$$SERVER_PID" 2>/dev/null || true; \
		fi; \
	fi
	@-pkill -f "server_wrapper.sh" 2>/dev/null || true
	@-pkill -f "python3 -m http.server $(PORT)" 2>/dev/null || true
	@rm -f $(READY_FILE)
	@echo "✅ Cleanup complete"

# Show available commands
help:
	@echo "🤖 Guardian Consciousness Ecology Makefile"
	@echo ""
	@echo "Available targets:"
	@echo "  demo    - Start server and open guardian demo (default)"
	@echo "  server  - Start HTTP server only"
	@echo "  open    - Open demo page (verifies server is running)"
	@echo "  clean   - Stop background server processes and clean files"
	@echo "  help    - Show this help message"
	@echo ""
	@echo "Usage:"
	@echo "  make          # Start everything"
	@echo "  make demo     # Same as default"
	@echo "  make server   # Start server only"
	@echo "  make open     # Open browser to demo"
	@echo "  make clean    # Stop server and clean files"
