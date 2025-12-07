# Browser vs Node.js Compatibility

## Node.js Compatible (Pure Computation)

These modules can be tested in Node.js with minimal mocking:

### Core
- **`core.js`** (WaveScheduler) - Pure computation, only exports to `window` at end
  - ✅ Can test: operator evolution, phase management, event generation
  - ⚠️ Minor: Has `window.WaveScheduler = WaveScheduler` at end (harmless in Node)

### Image Processing (Pure Math)
- **`sobel.js`** - Pure Float32Array computation
  - ✅ Can test: gradient computation, multi-scale Sobel, complex kernel convolution
  - No browser dependencies

- **`convolution.js`** - Pure lattice operations
  - ✅ Can test: kernel matching, similarity functions, evolution functions
  - No browser dependencies

### Theoretical Components (Pure Math)
- **`spacetime_scale.js`** - Pure mathematical operations
  - ✅ Can test: action functional, path integrals, fractal convolution
  - No browser dependencies

- **`edge_tracker.js`** - Pure computation on Float32Array
  - ✅ Can test: continuity regularization, scale generation, field updates
  - No browser dependencies

- **`theta_star.js`** - Pure math (phase calculations)
  - ✅ Can test: eigenphase computation, stability checks, kernel generation
  - No browser dependencies

- **`fractal_sobel_wavelet.js`** - Pure math (wavelet generation)
  - ✅ Can test: kernel generation, phase evolution, scale coherence
  - No browser dependencies

- **`gain_scheduler.js`** - Pure computation
  - ✅ Can test: metric computation, gain scheduling, phase coherence
  - No browser dependencies

### Output Generation (String-based)
- **`renderer.js`** - Generates SVG strings (no DOM manipulation)
  - ✅ Can test: path extraction, SVG generation, edge path following
  - ⚠️ Minor: Uses `console.warn` (works in Node)

---

## Browser-Specific (Requires DOM/Canvas/WebRTC)

These modules require browser APIs and need mocking for Node.js testing:

### SVG Parsing
- **`svg_parser.js`** - Requires `DOMParser`
  - ❌ Browser: `new DOMParser()`, `parseFromString()`, `querySelectorAll()`
  - 🔧 Mock: Use `jsdom` or `xmldom` for Node.js

### Canvas Operations
- **`lattice.js`** - Requires Canvas API
  - ❌ Browser: `document.createElement('canvas')`, `getContext('2d')`, `getImageData()`
  - 🔧 Mock: Use `canvas` npm package or mock canvas context

### Video Capture
- **`livecam/video.js`** - Requires WebRTC and Canvas
  - ❌ Browser: `navigator.mediaDevices.getUserMedia()`, `document.createElement('canvas')`
  - 🔧 Mock: Mock `navigator.mediaDevices` and canvas APIs

- **`livecam/vision.js`** - Requires `requestAnimationFrame` and Canvas
  - ❌ Browser: `requestAnimationFrame()`, canvas drawing
  - 🔧 Mock: Mock `requestAnimationFrame` (use `setTimeout` or polyfill)

### System Integration
- **`svg_kernel_system.js`** - Depends on SVGParser and LatticeOps
  - ⚠️ Partial: Core logic is testable, but depends on browser modules
  - 🔧 Mock: Mock SVGParser and LatticeOps for full testing

### Loader
- ~~**`sagestring-loader.js`**~~ - Removed: Modern browsers use native ES6 modules

---

## Testing Strategy

### Node.js Tests (No Mocking Needed)
```javascript
// These can be tested directly:
- core.js (WaveScheduler)
- sobel.js
- convolution.js
- spacetime_scale.js
- edge_tracker.js
- theta_star.js
- fractal_sobel_wavelet.js
- gain_scheduler.js
- renderer.js (SVG string generation)
```

### Node.js Tests (With Mocking)
```javascript
// Mock DOMParser:
const { JSDOM } = require('jsdom');
const dom = new JSDOM();
global.DOMParser = dom.window.DOMParser;

// Mock Canvas:
const { createCanvas } = require('canvas');
// Or mock getContext, getImageData manually

// Mock WebRTC:
global.navigator = {
  mediaDevices: {
    getUserMedia: async () => ({ getTracks: () => [] })
  }
};

// Mock requestAnimationFrame:
global.requestAnimationFrame = (cb) => setTimeout(cb, 16);
```

### Browser Tests
```javascript
// All modules can be tested in browser:
- Use browser test runner (e.g., Karma, Playwright)
- Or use browser-based test HTML files
```

---

## Summary

**Node.js Compatible (9 modules):**
- core.js
- sobel.js
- convolution.js
- spacetime_scale.js
- edge_tracker.js
- theta_star.js
- fractal_sobel_wavelet.js
- gain_scheduler.js
- renderer.js

**Browser-Specific (4 modules):**
- svg_parser.js (needs DOMParser mock)
- lattice.js (needs Canvas mock)
- webrtc/video.js (needs WebRTC + Canvas mock)
- webrtc/vision.js (needs requestAnimationFrame + Canvas mock)

**Partial (1 module):**
- canvas/svg_kernel_system.js (testable with mocks, depends on DOM and Canvas)

