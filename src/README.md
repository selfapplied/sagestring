# SageString Library

Minimal library for fractal Sobel edge detection with spacetime-scale action functional.

## Structure

```
src/
  sageString.js        # ES6 module entry point
  
  math/                # Pure computation (Node.js compatible)
    core.js            # Core primitives (WaveScheduler)
    convolution.js     # Generalized convolution
    sobel.js           # Sobel edge detection
    renderer.js        # Lattice to SVG rendering
    spacetime_scale.js # Spacetime-scale action functional
    edge_tracker.js    # Continuity-regularized edge tracking
    theta_star.js      # θ⋆ phase-lock signature
    fractal_sobel_wavelet.js # θ⋆-parameterized mother wavelet
    gain_scheduler.js  # Phase-aware gain scheduling
  
  dom/                 # DOM dependencies
    svg_parser.js      # SVG parsing (requires DOMParser)
  
  canvas/              # Canvas API dependencies
    lattice.js         # Lattice operations
    svg_kernel_system.js # SVG kernel system orchestrator
  
  webrtc/              # WebRTC dependencies
    video.js           # Video capture
    vision.js          # Vision processing pipeline
```

## Usage

### ES6 Modules (Recommended)

Modern browsers support ES6 modules natively:

```html
<script type="module">
  import { Sobel, LatticeRenderer, SVGKernelSystem } from './src/sageString.js';
  
  const sobel = new Sobel();
  const renderer = new LatticeRenderer();
  // ...
</script>
```

Or in a separate JavaScript file:

```javascript
import { Sobel, LatticeRenderer } from './src/sageString.js';
```

### Individual Modules

You can also import specific modules directly:

```javascript
import { Sobel } from './src/math/sobel.js';
import { LatticeRenderer } from './src/math/renderer.js';
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

