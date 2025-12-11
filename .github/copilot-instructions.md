# SageString - GitHub Copilot Instructions

## Project Overview

SageString is a minimal library for fractal Sobel edge detection with spacetime-scale action functional. It provides real-time video edge detection and processing capabilities using WebRTC, Canvas API, and mathematical convolution operations.

## Architecture

The project is organized into modular components:

```
src/                         # Core library (ES6 modules)
  sagestring.js              # Main entry point
  math/                      # Pure computation (Node.js compatible)
    - core.js                # WaveScheduler primitive
    - convolution.js         # Generalized kernel convolution
    - sobel.js               # Sobel edge detection
    - renderer.js            # Lattice to SVG rendering
    - spacetime_scale.js     # Spacetime-scale action functional
    - edge_tracker.js        # Continuity-regularized edge tracking
    - theta_star.js          # θ⋆ phase-lock signature
    - fractal_sobel_wavelet.js
    - gain_scheduler.js      # Phase-aware gain scheduling
  dom/                       # DOM dependencies
    - svg_parser.js          # SVG parsing
  canvas/                    # Canvas API dependencies
    - lattice.js             # Lattice operations
    - svg_kernel_system.js   # SVG kernel system orchestrator
  webrtc/                    # WebRTC dependencies
    - video.js               # Video capture
    - vision.js              # Vision processing pipeline
  
tests/                       # Test structure mirrors src/
  math/                      # Math module tests
  dom/                       # DOM module tests
  canvas/                    # Canvas module tests
  webrtc/                    # WebRTC module tests
  e2e/                       # End-to-end Playwright tests

demos/                       # Demo applications
  livecam/                   # Live camera edge detection
  sobel/                     # Sobel edge detection demos
  svg_kernel/                # SVG kernel system demos
  chatbot/                   # Chatbot demos
```

## Development Environment

### Prerequisites
- Node.js (for running tests)
- Python 3 (for local development server)
- Modern web browser with WebRTC support

### Setup
```bash
npm install                  # Install dependencies (Playwright for E2E tests)
python3 server.py 8000      # Start development server
```

## Build, Test, and Lint

### Testing
The project uses custom test runners and Playwright for E2E testing:

```bash
# Run specific test suites
npm run test:math           # Math module tests
npm run test:dom            # DOM module tests
npm run test:canvas         # Canvas module tests
npm run test:webrtc         # WebRTC module tests
npm run test:e2e            # Playwright E2E tests

# Makefile shortcuts
make test                   # Run E2E tests
make test-e2e               # Run E2E tests (alias)
```

### Running Demos
```bash
# Start server and open demos
make demo                   # Default guardian demo
make quantum                # Quantum learning demo
make ecology                # Ecological energy landscape
make diatom                 # Diatom computing demo
make kernel                 # CE1 kernel binding demo
make sketch                 # Sketch DSL demo

# Or manually
npm run serve               # Start server on port 8000
npm run dev                 # Same as serve
```

### Cleanup
```bash
make clean                  # Stop servers and clean temporary files
```

## Coding Standards

### Module System
- Use ES6 modules (`import`/`export`) throughout
- All modules in `src/` are ES6 modules
- Main entry point: `src/sagestring.js`

### Code Organization
- **Pure computation** goes in `src/math/` (Node.js compatible, no browser APIs)
- **DOM-dependent code** goes in `src/dom/` (requires DOMParser, etc.)
- **Canvas-dependent code** goes in `src/canvas/` (requires Canvas API)
- **WebRTC-dependent code** goes in `src/webrtc/` (requires WebRTC APIs)

### Test Organization
- Tests mirror the `src/` directory structure
- Place tests in corresponding directories (e.g., `tests/math/` for `src/math/`)
- Use custom test runners for unit tests
- Use Playwright for E2E tests in `tests/e2e/`

### Naming Conventions
- Use camelCase for variables and functions
- Use PascalCase for classes
- Use descriptive names that reflect the mathematical/physical concepts
- File names use snake_case or lowercase (e.g., `theta_star.js`, `sobel.js`)

### Comments and Documentation
- Document complex mathematical operations and algorithms
- Include references to papers or theoretical foundations where applicable
- Keep comments concise and focused on "why" rather than "what"

## Dependencies

### Runtime Dependencies
- Playwright (for E2E testing)

### Development Dependencies
- @playwright/test (E2E testing framework)
- Python 3 (development server)

### Browser APIs Used
- WebRTC (getUserMedia for camera access)
- Canvas API (image processing)
- DOM API (SVG parsing)

## Common Tasks

### Adding a New Module
1. Determine the correct category (math, dom, canvas, webrtc)
2. Create the module file in the appropriate `src/` subdirectory
3. Export the module from `src/sagestring.js` if it's a public API
4. Create corresponding tests in `tests/` subdirectory
5. Update `src/README.md` if adding a new public module

### Adding a New Demo
1. Create a new directory under `demos/`
2. Create an HTML file that imports from `src/sagestring.js`
3. Test with the development server
4. Add a Makefile target if it's a major demo

### Fixing Tests
- Run the specific test suite that's failing (e.g., `npm run test:math`)
- Ensure browser vs. Node.js environment is correctly handled
- Check `tests/BROWSER_VS_NODE.md` for environment-specific guidance

## Performance Considerations
- Edge detection operations are computationally intensive
- Use requestAnimationFrame for smooth animations
- Consider using Web Workers for heavy computation (future enhancement)
- Optimize kernel convolution operations for real-time performance

## Security
- Camera access requires HTTPS in production
- Validate user inputs in interactive demos
- Be cautious with dynamic SVG content (XSS risk)

## Known Limitations
- WebRTC requires browser permissions for camera access
- Some demos require a secure context (HTTPS or localhost)
- Performance depends on device capabilities

## When Making Changes
1. Ensure tests pass before committing: run relevant test suites
2. Keep the separation between math/, dom/, canvas/, and webrtc/ modules clear
3. Update documentation if changing public APIs
4. Test demos affected by your changes
5. Run `make clean` before committing to avoid including server artifacts
