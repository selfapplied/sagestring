# Guardian Consciousness Ecology - Development Makefile

.PHONY: server demo clean help open quantum ecology diatom kernel sketch test test-e2e

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
demo: scripts/self_managing_server.py
	@echo "🌟 Starting Guardian Consciousness Ecology..."
	@echo "📡 Launching self-managing HTTP server on port $(PORT)..."
	@MPLCONFIGDIR=$(MPLCONFIGDIR) scripts/self_managing_server.py $(PORT) $(READY_FILE) 300 &
	@echo "⏳ Waiting for server to be ready..."
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

# Open quantum learning demo
quantum:
	@echo "⚛️  Opening Quantum Learning demo..."
	@if command -v python3 >/dev/null 2>&1; then \
		if ! curl -s http://localhost:$(PORT) >/dev/null 2>&1; then \
			echo "📡 Starting HTTP server on port $(PORT)..."; \
			python3 server.py $(PORT) >/dev/null 2>&1 & \
			SERVER_PID=$$!; \
			echo $$SERVER_PID > .server_pid; \
			sleep 1; \
		fi; \
		echo "🌐 Opening quantum learning demo..."; \
		open http://localhost:$(PORT)/demo/quantum.html; \
		echo "✅ Quantum learning demo opened!"; \
		echo "💡 Press Ctrl+C in the terminal to stop the server"; \
	else \
		echo "❌ Python3 not found. Please install Python 3."; \
		exit 1; \
	fi

# Open ecological energy landscape
ecology:
	@echo "🌊 Opening Ecological Energy Landscape..."
	@if command -v python3 >/dev/null 2>&1; then \
		if ! curl -s http://localhost:$(PORT) >/dev/null 2>&1; then \
			echo "📡 Starting HTTP server on port $(PORT)..."; \
			python3 server.py $(PORT) >/dev/null 2>&1 & \
			SERVER_PID=$$!; \
			echo $$SERVER_PID > .server_pid; \
			sleep 1; \
		fi; \
		echo "🌐 Opening ecological energy landscape..."; \
		open http://localhost:$(PORT)/demo/ecology.html; \
		echo "✅ Ecological energy landscape opened!"; \
		echo "💡 Press Ctrl+C in the terminal to stop the server"; \
	else \
		echo "❌ Python3 not found. Please install Python 3."; \
		exit 1; \
	fi

# Open diatom computing demo
diatom:
	@echo "🌊 Opening Diatom Computing demo..."
	@if command -v python3 >/dev/null 2>&1; then \
		if ! curl -s http://localhost:$(PORT) >/dev/null 2>&1; then \
			echo "📡 Starting HTTP server on port $(PORT)..."; \
			python3 server.py $(PORT) >/dev/null 2>&1 & \
			SERVER_PID=$$!; \
			echo $$SERVER_PID > .server_pid; \
			sleep 1; \
		fi; \
		echo "🌐 Opening diatom computing demo..."; \
		open http://localhost:$(PORT)/demo/diatom.html; \
		echo "✅ Diatom computing demo opened!"; \
		echo "💡 Press Ctrl+C in the terminal to stop the server"; \
	else \
		echo "❌ Python3 not found. Please install Python 3."; \
		exit 1; \
	fi

# Open CE1 kernel binding demo
kernel:
	@echo "🔗 Opening CE1 Kernel Binding demo..."
	@if command -v python3 >/dev/null 2>&1; then \
		if ! curl -s http://localhost:$(PORT) >/dev/null 2>&1; then \
			echo "📡 Starting HTTP server on port $(PORT)..."; \
			python3 server.py $(PORT) >/dev/null 2>&1 & \
			SERVER_PID=$$!; \
			echo $$SERVER_PID > .server_pid; \
			sleep 1; \
		fi; \
		echo "🌐 Opening CE1 kernel binding demo..."; \
		open http://localhost:$(PORT)/demo/kernel.html; \
		echo "✅ CE1 kernel binding demo opened!"; \
		echo "💡 Press Ctrl+C in the terminal to stop the server"; \
	else \
		echo "❌ Python3 not found. Please install Python 3."; \
		exit 1; \
	fi

# Open sketch DSL demo
sketch:
	@echo "📝 Opening Sketch DSL demo..."
	@if command -v python3 >/dev/null 2>&1; then \
		if ! curl -s http://localhost:$(PORT) >/dev/null 2>&1; then \
			echo "📡 Starting HTTP server on port $(PORT)..."; \
			python3 server.py $(PORT) >/dev/null 2>&1 & \
			SERVER_PID=$$!; \
			echo $$SERVER_PID > .server_pid; \
			sleep 1; \
		fi; \
		echo "🌐 Opening sketch DSL demo..."; \
		open http://localhost:$(PORT)/demo/sketch.html; \
		echo "✅ Sketch DSL demo opened!"; \
		echo "💡 Press Ctrl+C in the terminal to stop the server"; \
	else \
		echo "❌ Python3 not found. Please install Python 3."; \
		exit 1; \
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

# Run tests (E2E)
test: test-e2e

# Run E2E tests
test-e2e:
	@npm run test:e2e

# Show available commands
help:
	@echo "🤖 Guardian Consciousness Ecology Makefile"
	@echo ""
	@echo "Available targets:"
	@echo "  demo            - Start server and open guardian demo (default)"
	@echo "  server          - Start HTTP server only"
	@echo "  open            - Open demo page (verifies server is running)"
	@echo "  quantum         - Open quantum learning demo"
	@echo "  ecology         - Open ecological energy landscape"
	@echo "  diatom          - Open diatom computing demo"
	@echo "  kernel          - Open CE1 kernel binding demo"
	@echo "  sketch          - Open sketch DSL demo"
	@echo "  test            - Run E2E tests"
	@echo "  test-e2e        - Run E2E tests (alias)"
	@echo "  clean           - Stop background server processes and clean files"
	@echo "  help            - Show this help message"
	@echo ""
	@echo "Usage:"
	@echo "  make              # Start everything"
	@echo "  make demo         # Same as default"
	@echo "  make server       # Start server only"
	@echo "  make open         # Open browser to demo"
	@echo "  make quantum      # Open quantum learning demo"
	@echo "  make ecology      # Open ecological energy landscape"
	@echo "  make diatom       # Open diatom computing demo"
	@echo "  make kernel       # Open CE1 kernel binding demo"
	@echo "  make sketch       # Open sketch DSL demo"
	@echo "  make test         # Run E2E tests"
	@echo "  make clean        # Stop server and clean files"
