# SageString Library

Minimal library for fractal Sobel edge detection with spacetime-scale action functional.

## Structure

```
src/sagestring/
  core/              # Core primitives
    wave_scheduler.js
  livecam/           # Live camera edge detection modules
    svg_parser.js
    lattice.js
    convolution.js
    sobel.js
    renderer.js
    video.js
    spacetime_scale.js
    edge_tracker.js
    theta_star.js
    fractal_sobel_wavelet.js
    gain_scheduler.js
    livecam.js
    vision.js
  index.js           # ES6 module entry point
```

## Usage

### ES6 Modules (Recommended)

Modern browsers support ES6 modules natively:

```html
<script type="module">
  import { Sobel, LatticeRenderer } from './src/sagestring.js';
  
  const sobel = new Sobel();
  // ...
</script>
```

Or in a separate JavaScript file:

```javascript
import { Sobel, LatticeRenderer } from './src/sagestring.js';
```

## Modules

### Core
- **WaveScheduler** - Wave-based scheduling primitive

### Livecam
- **SVGParser** - Parse SVG kernel definitions
- **LatticeOps** - Lattice operations (rasterize, transform)
- **Convolution** - Generalized kernel convolution
- **Sobel** - Sobel edge detection
- **LatticeRenderer** - Lattice to SVG rendering
- **VideoCapture** - Video capture
- **SVGKernelSystem** - Main orchestrator
- **Vision** - Vision pipeline
- **EdgeTracker** - Continuity-regularized edge tracking
- **ThetaStar** - θ⋆ phase-lock signature
- **FractalSobelWavelet** - θ⋆-parameterized mother wavelet
- **GainScheduler** - Phase-aware gain scheduling
- **SpacetimeScale** - Spacetime-scale action functional

