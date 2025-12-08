# SageString

Fractal Sobel edge detection with spacetime-scale action functional.

## Structure

```
src/                     # Core library (JavaScript modules)
  sagestring.js          # ES6 module entry point
  sagestring-loader.js   # Browser loader
  core.js                # Core primitives (WaveScheduler)
  livecam/               # Live camera edge detection modules
tests/                   # Tests (parallel to src/)
  sagestring.js          # Integration tests
  core.js                # Core tests
  livecam/               # Livecam tests
demos/                   # Demo applications
  livecam/               # Live camera demo
  sobel/                 # Sobel edge detection demos
  svg_kernel/            # SVG kernel system demos
  chatbot/               # Chatbot demos
```

## Quick Start

### Library Usage (Browser)

```html
<!-- Single entry point - loads all modules -->
<script src="src/sagestring-loader.js"></script>
<script>
  window.addEventListener('sagestring:ready', () => {
    const sobel = new Sobel();
    const renderer = new LatticeRenderer();
    // ...
  });
</script>
```

### ES6 Modules

```javascript
import { Sobel, LatticeRenderer } from './src/sagestring.js';
```

### Running Demos

1. Start a web server:
   ```bash
   python3 -m http.server 8000
   ```

2. Open a demo:
   - `demos/livecam/livecam.html` - Live camera edge detection
   - `demos/sobel/working_sobel_demo.html` - Sobel demos
   - `demos/svg_kernel/svg_kernel_demo.html` - SVG kernel demos

## Library Modules

See `src/README.md` for detailed module documentation.

## Demos

See `demos/README.md` for demo descriptions.
