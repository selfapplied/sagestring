# HashBloom: File to Fractal

A generative art system that transforms any file's SHA-1 hash into animated SVG fractals using Bateman-Reiss characteristic curves.

## 🌱 How It Works

1. **File → Hash**: Any file is digested with SHA-1 (160 bits)
2. **Hash → Genes**: 40 hex chars map to Gaussian field parameters
3. **Field → Dynamics**: Scalar field u(x,y) with analytical gradients
4. **Dynamics → Curves**: Bateman-Reiss integrates characteristic ODEs
5. **Curves → SVG**: Smooth cubic Bézier paths with glow effects

## 🧠 The Math

**Scalar Field**: `u(x,y) = Σᵢ Aᵢ · exp(-((x-xᵢ)² + (y-yᵢ)²)/(2σᵢ²))`

**Characteristic ODEs**: `dx/dt = ∂u/∂x`, `dy/dt = ∂u/∂y`

**Integration**: 4th-order Runge-Kutta with adaptive step sizing

**Paths**: Catmull-Rom splines converted to SVG cubic Béziers

## 🎨 Features

- **Deterministic**: Same file always produces same fractal
- **Animated**: CSS-driven hue rotation and opacity pulsing
- **Responsive**: Works on desktop and mobile
- **Pure Client**: No server, no data sent anywhere
- **Smooth**: Sub-pixel curves with Gaussian glow filters

## 🚀 Usage

1. Open `hashbloom.html` in a modern browser
2. Drag & drop any file (or click to browse)
3. Watch the characteristic curves bloom
4. Download the SVG for further use

## 🏗️ Architecture

```
bloom/
├── hashbloom.html    # UI with WebCrypto hashing
├── hashbloom.js      # Core engine & SVG generator
├── hash_to_genes.js  # Hash → field parameters
├── bateman_reiss.js  # RK4 characteristic integrator
└── README.md         # This file
```

## 🔬 Technical Details

- **Hash Processing**: SHA-1 → 8-12 Gaussians with parameters
- **Field Resolution**: Analytical gradients (no grid sampling)
- **Curve Integration**: RK4 with adaptive time steps
- **Path Smoothing**: Catmull-Rom → cubic Bézier conversion
- **Animation**: Pure CSS keyframes for performance

## 🎭 Design Philosophy

This system embodies **emergent geometry**: the fractal emerges from the field's natural flow, not from declared rules. Each hash produces a unique dynamical system whose behavior is governed by gradient descent along the potential landscape.

The Bateman-Reiss operator extracts **the shape the field wants to become** - a living, breathing representation of the file's mathematical essence.

## 🌟 Inspiration

- **Bateman-Reiss**: Non-linear PDE characteristic extraction
- **CE1**: Emergent morphism from field structure
- **Fractal Sobel**: Scale-invariant edge detection
- **Flow Fields**: Natural pattern formation

## 🎨 Example Output

Each file produces a unique animated fractal with:
- Flow lines following gradient descent
- Color-coded by Gaussian influence
- Smooth cubic curves with glow effects
- Living animation via CSS transforms

## 🔧 Browser Support

Requires modern browser with:
- WebCrypto API (`crypto.subtle.digest`)
- ES6 modules
- SVG filters and animations

Tested in Chrome, Firefox, Safari, Edge.

---

*Built with love for the mathematics of emergence.*









