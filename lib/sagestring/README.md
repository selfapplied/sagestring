# SageString Library

Minimal library for fractal Sobel edge detection with spacetime-scale action functional.

## Structure

- `core/` - Core primitives (wave scheduler, etc.)
- `livecam/` - Live camera edge detection system

## Modules

### Core
- `wave_scheduler.js` - Wave-based scheduling primitive

### Livecam
- `svg_parser.js` - Parse SVG kernel definitions
- `lattice.js` - Lattice operations (rasterize, transform)
- `convolution.js` - Generalized kernel convolution
- `sobel.js` - Sobel edge detection
- `renderer.js` - Lattice to SVG rendering
- `video.js` - Video capture
- `liveCam.js` - Main orchestrator
- `vision.js` - Vision pipeline
- `edge_tracker.js` - Continuity-regularized edge tracking
- `theta_star.js` - θ⋆ phase-lock signature
- `fractal_sobel_wavelet.js` - θ⋆-parameterized mother wavelet
- `gain_scheduler.js` - Phase-aware gain scheduling
- `spacetime_scale.js` - Spacetime-scale action functional

## Usage

```html
<script src="lib/sagestring/livecam/sobel.js"></script>
<script src="lib/sagestring/livecam/renderer.js"></script>
<script>
  const sobel = new Sobel();
  const renderer = new LatticeRenderer();
  // ...
</script>
```

Or use the main entry point:
```html
<script src="lib/sagestring/sageString.js"></script>
<script>
  const sobel = new SageString.Sobel();
  // ...
</script>
```

