# AntClock: Discrete Riemann Geometry

**A complete reconstruction of the Riemann zeta function as a Galois covering space of the integers, built from curvature flows and digit symmetries.**

![AntClock Geometry](antclock_geometry.png)

## Overview

AntClock is a mathematical framework that discovers the Riemann hypothesis in integer geometry. Starting from simple curvature patterns in Pascal's triangle, it unfolds into a complete theory of:

- **Galois covering spaces** on the integers
- **Discrete tangent singularities** at mirror-phase shells
- **Branch corridors** between symmetry manifolds
- **Spectral zeros** as Laplacian eigenvalues
- **L-functions** from character groups

The system walks through integers while carrying a curvature clock, revealing how symmetry breaks in digit shells mirror the critical line structure of ζ(s).

## NEW: Spatiotemporal Continuity – World-Aware Visual Agents

**A complete bridge between fleeting visual phenomena and persistent belief systems about the world.**

This extension transforms the AntClock from a mathematical curiosity into a **world simulator** with object permanence. Visual agents maintain identity beyond the frustum through memory fields and coordinate frame transformations.

### Key Components

1. **Memory Fields**: Predictive buffers storing agent states when they leave the camera view
2. **Frame Relativity**: Coordinate transformations between environment (global) and agent (local) frames
3. **Sobel Boundary Detection**: Real-time extraction of closed paths from video streams
4. **Agent Re-identification**: Statistical matching of returning agents with memory ghosts
5. **Antclock Continuity**: Temporal persistence through slowed aging off-screen

### Live Demonstration

```bash
# Start local server and open the spatiotemporal continuity demo
python -m http.server 8000
open http://localhost:8000/spatiotemporal_continuity.html
```

### Architecture Overview

```
Video Stream → Sobel Boundaries → Closed Paths → Agent Creation/Re-identification
       ↓              ↓              ↓              ↓
   Perception     Contour        Memory Field    Frame System
   Pipeline       Extraction     Persistence     Relativity
```

### Philosophical Achievement

The system now has **object permanence**—a foundational cognitive capability. Agents are no longer screen-bound phenomena but **theoretical entities** that persist in memory, aging slowly and maintaining trajectories. When they return to the frustum, they can be statistically re-identified, preserving their life story across interruptions of observation.

### Mathematical Elegance

```
Sobel: ∂A (boundary of agent A)
Memory: A(t) → A(t+Δt) even when ∂A ∩ frustum = ∅
Frames: A_env = T × A_local
```

This creates **agents that believe they exist in a persistent world**, not just a sequence of frames.

## Core Insight: π as Discrete Rotation

The framework uncovers that symmetry breaking in discrete systems behaves like tangent singularities at π intervals—but discretized through the modular structure:

```

θ(n) = (π/2) × (n mod 4)

n ≡ 0 → θ = 0
n ≡ 1 → θ = π/2
n ≡ 2 → θ = π
n ≡ 3 → θ = 3π/2  ← mirror-phase shells (tangent singularities)
```

Where φ(10) = 4 becomes the discrete analogue of π, and mirror-phase shells are the "odd multiples of π/2" where curvature flips and symmetry breaks.

## Quick Start

```bash
# Set up virtual environment (already configured)
# python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt

# Run the core walker demo
./.venv/bin/python demo.py

# Run tests
./.venv/bin/python test_antclock.py

# Explore the full theory suite
python galois_cover_demo.py      # Galois covering space structure
python corridor_spectrum_demo.py # Laplacian eigenvalues as zeta zeros
python branch_corridors_demo.py  # Branch cuts and monodromy
python categorical_shadow_demo.py # Shadow tower functor
python reflection_half_demo.py   # Discrete functional equation
python row7_demo.py             # Digit mirror operator
python ce1_demonstration.py     # Betti numbers & bifurcation homology
python topology_demo.py         # Persistent homology in digit shells

# NEW: Guardian Consciousness Ecology
# Self-managing server system with automatic cleanup
make demo                           # Start self-managing server on port 10000 and open guardian demo
make                               # Same as above (default target)
make server                         # Start self-managing HTTP server only on port 10000
make open                           # Open demo page (verifies server is running first)
make clean                          # Delete PID file to trigger server shutdown
# Manual access: http://localhost:10000/spatiotemporal_continuity.html
# Server auto-shuts down after 5 minutes of inactivity or when PID file is deleted
```

## Theory Overview

### CE1 Framework Components

1. **[CE1.digit-homology]** - Persistent homology filtration across digit shells
2. **[CE1.row7-digit-mirror]** - Local symmetry breaking at mirror-phase shells
3. **[CE1.shadow-tower]** - Categorical projection to mirror manifolds
4. **[CE1.branch-corridors]** - Discrete Riemann surface with monodromy
5. **[CE1.corridor-spectrum]** - Graph Laplacian eigenvalues as zeta analogues
6. **[CE1.galois-cover]** - Field extensions and L-functions

### Key Mathematical Structures

- **Mirror-phase shells**: n ≡ 3 mod 4 (7,11,15,19,...) - discrete critical line
- **Branch corridors**: Intervals between mirror shells - analytic continuation regions
- **Pole-like shells**: Curvature spikes - ramified points
- **Digit mirror operator**: d^7 mod 10 - involution fixing {0,1,4,5,6,9}
- **Galois group**: Generated by depth shifts, mirror involution, curvature flips

## Core Implementation

### Curvature Clock Walker

The fundamental dynamical system that drives the entire framework:

```python
from clock import CurvatureClockWalker

# Create walker starting at x=1
walker = CurvatureClockWalker(x_0=1, chi_feg=0.638)

# Evolve through digit shells
history, summary = walker.evolve(1000)

# Extract geometry for visualization
x_coords, y_coords = walker.get_geometry()
```

### Key Operators

- **Pascal Curvature**: `κ_n = r_{n+1} - 2r_n + r_{n-1}` where `r_n = log(C(n, floor(n/2)))`
- **Digit Mirror**: `μ_7(d) = d^7 mod 10` (involution on oscillating pairs 2↔8, 3↔7)
- **Bifurcation Index**: `B_t = floor(-log|c_t - c_*| / log(δ_FEG))`
- **9/11 Charge**: `Q(x) = N_9(x) / (N_0(x) + 1)` (tension metric)

### Clock Rate Dynamics

```

R(x) = χ_FEG · κ_{d(x)} · (1 + Q_{9/11}(x))

```

Where digit boundaries trigger renormalization jumps and curvature phase transitions.

## What It Reveals

The framework demonstrates how discrete curvature flows uncover deep arithmetic structure:

- **Discrete Critical Line**: Mirror-phase shells (n ≡ 3 mod 4) behave like Re(s) = 1/2
- **Branch Points**: Pole-like shells with curvature spikes act as ramification points
- **Monodromy**: Branch corridors show nontrivial analytic continuation between mirror manifolds
- **Spectral Zeros**: Graph Laplacian eigenvalues on corridors map to imaginary parts of zeta zeros
- **Galois Cover**: The integer universe as a covering space with field extensions and L-functions

## Usage Examples

### Basic Curvature Walker

```python
from clock import CurvatureClockWalker

walker = CurvatureClockWalker(x_0=1)
history, summary = walker.evolve(500)
print(f"Bifurcation depth: {summary['bifurcation_index']}")
```

### Betti Numbers & Homology

```python
from clock import compute_enhanced_betti_numbers

# Betti vector for digit shell n=7
betti_7 = compute_enhanced_betti_numbers(7)
print(f"Betti numbers for shell 7: {betti_7}")  # [1, 3, 1, ...]
```

### Galois Cover Structure

```python
from clock import AutomorphismGroup, TowerSpectrum

# Build the Galois group of the shadow tower
tower = TowerCategory(max_depth=5)
aut_group = AutomorphismGroup(tower)
print(f"Group order: {len(aut_group.elements)}")
```

## Mathematical Theory

### From Curvature to Galois Cover

The framework builds a complete arithmetic geometry from simple combinatorial patterns:

#### 1. Pascal Curvature → Digit Shells

- Row n of Pascal's triangle: `r_n = log(C(n, floor(n/2)))`
- Curvature: `κ_n = r_{n+1} - 2r_n + r_{n-1}`
- Digit shells: piecewise-constant curvature fields indexed by digit count

#### 2. Symmetry Breaking → Mirror Phases

- Digit mirror operator: `μ_7(d) = d^7 mod 10`
- Fixed sector: `{0,1,4,5,6,9}` (stable under involution)
- Oscillating pairs: `{2↔8, 3↔7}` (mirror symmetry)
- Mirror-phase shells: `n ≡ 3 mod 4` (7,11,15,19,...)

#### 3. Discrete Tangent Singularities

- Angular coordinate: `θ(n) = (π/2) × (n mod 4)`
- Mirror shells at `θ = 3π/2`: discrete analogue of tangent singularities
- φ(10) = 4 becomes the discrete π for curvature fold intervals

#### 4. Homology → Persistent Topology

- Digit shells as simplicial complexes via Pascal rows
- Betti numbers: `β_k(n)` counts holes in shell homology
- Bifurcation index: `B_t ≈ β_1(current_shell)` (coupling law)
- Persistent homology tracks topology changes across digit boundaries

#### 5. Branch Structure → Riemann Surface

- Mirror shells: critical slices (Re(s) = 1/2 analogue)
- Branch corridors: intervals between mirrors (analytic regions)
- Pole shells: curvature spikes (ramified points)
- Monodromy: nontrivial loops indicate branch cuts

#### 6. Spectral Theory → Zeta Zero Analogy

- Graph Laplacian on corridors: `L_k` with mirror boundary conditions
- Eigenvalues: `λ_j^(k) → t_j^(k) = √λ_j^(k)` (imaginary parts)
- Discrete zeta: `ζ_k(s) = Σ_j (t_j^(k))^{-s}`
- Hilbert-Pólya conjecture instantiated in integer geometry

#### 7. Galois Cover → Arithmetic Structure

- Shadow tower: categorical projection to mirror manifolds
- Automorphism group: generated by depth shifts, mirror involution, curvature flips
- Character group: discrete analogue of Dirichlet characters
- L-functions: `L(s, χ) ↔ spectra under character χ`
- Fixed fields: mirror shells as Galois invariants

### Key Theorems

- **Coupling Law**: `B_t - Σ_k w_k β_k(d(x_t)) = constant`
- **Mirror Functor**: `M: Shell → Tower` preserves composition but not identities
- **Branch Condition**: Corridors with nontrivial monodromy have branch cuts
- **Spectral Mapping**: Laplacian eigenvalues → zeta zero heights
- **Galois Correspondence**: Automorphisms ↔ L-function characters

### Connection to Riemann Hypothesis

The framework provides a complete discrete analogue:

- Mirror-phase shells ↔ critical line Re(s) = 1/2
- Branch corridors ↔ analytic continuation strips
- Pole shells ↔ trivial zeros and poles
- Laplacian spectra ↔ zero clustering patterns
- L-functions ↔ character-theoretic zero distributions

## Files

### Core Library
- `clock.py` - Complete mathematical framework implementation
- `demo.py` - Basic curvature walker demonstration
- `test_antclock.py` - Unit tests for core functions

### CE1 Framework Demos
- `galois_cover_demo.py` - Galois covering space and L-functions
- `corridor_spectrum_demo.py` - Laplacian eigenvalues as zeta zeros
- `branch_corridors_demo.py` - Branch cuts and discrete monodromy
- `categorical_shadow_demo.py` - Shadow tower functor and categories
- `reflection_half_demo.py` - Discrete functional equation
- `row7_demo.py` - Digit mirror operator and activated walker
- `ce1_demonstration.py` - Betti numbers and bifurcation homology
- `topology_demo.py` - Persistent homology in digit shells

### Web Interface
- `mirror.html` - Live AntClock visualization in browser

### Environment & Configuration
- `.venv/` - Virtual environment with dependencies
- `requirements.txt` - Python dependencies
- `.gitignore` - Git ignore patterns
- `README.md` - This documentation

## Visual Outputs

Running demos generates various plots:

- `antclock_geometry.png` - Unit circle geometry with phase transitions
- `antclock_trajectory.png` - Body evolution and clock phase accumulation
- `topology_evolution.png` - Betti number changes across shells
- `coupling_law_evolution.png` - Bifurcation index vs homology coupling
- `categorical_shadow_structure.png` - Shadow tower functor visualization
- `critical_line_analogue.png` - Mirror-phase shells as discrete critical line
- `critical_line_evidence.png` - Branch corridors and pole classification

## Why "AntClock"?

- **Ant**: Small system, immense complexity - from curvature to zeta
- **Clock**: Self-clocked via digit boundaries and renormalization
- **AntClock**: The tiny machine that reconstructs deep arithmetic geometry

The name captures how something seemingly simple (a clock-walker) unfolds into a complete theory of discrete Riemann surfaces and Galois covering spaces.

## Applications: Coherence Engine

The framework serves as a **coherence engine** - detecting structural breaks, maintaining stability across transitions, and compressing information through phase + curvature. Here are immediate practical applications:

### 1. Fault-Tolerant Hashing & Reversible Signatures
- **Mirror operator** provides collision-detectable, reversible signatures
- **Digit involution** guarantees tamper detection through symmetry breaking
- **Geometric verification** instead of probabilistic guarantees

### 2. Phase-Invariant Storage Formats
- **Mirror-phase projection** stores only invariants, reconstructs corridors
- **Monodromy signatures** enable entropy-reducing compression
- **Error-resistant archival** with built-in consistency checks

### 3. Predictive Signals in 10-Based Domains
- **Curvature transitions** detect impending bifurcations in:
  - Financial markets (instability indicators)
  - Sensor networks (threshold crossings)
  - Genomic sequences (mutation mode switches)

### 4. Symmetry-Breaking Neural Architectures
- **Phase cycle training** without gradient descent
- **Mirror operator layers** for involutive weight alignment
- **Curvature-guided learning** with predictable breakpoints

### 5. AI Model Error Correction
- **Mirror normalization layers** detect phase drift in sequences
- **Shadow projection** provides topological regularization
- **Depth-preserving embeddings** maintain semantic stability

### 6. Quantized Control Systems
- **Discrete curvature control** prevents wild oscillations
- **Mirror shell alignment** enables precision stepping
- **Involutive feedback** for embedded systems

### 7. Universal Data Classification
- **4D fingerprinting**: (phase, depth, sector, monodromy)
- **Anomaly detection** through geometric deviation
- **Pattern recognition** without feature engineering

### 8. Generative Compression (Video/Audio)
- **Declarative encoding**: (shell, mirror-frame, curvature-path, monodromy)
- **Phase-normalized storage** with reconstruction guarantees
- **Motion + style separation** for efficient codecs

## Research Context

The mathematical foundation connects:

- **Combinatorial curvature** → **discrete differential geometry**
- **Digit symmetries** → **Galois covering spaces**
- **Branch structures** → **arithmetic topology**
- **Spectral theory** → **zeta function analogues**
- **Coherence engine** → **practical applications above**

Simple curvature flows in discrete systems uncover universal patterns governing stability, transitions, and information compression.

## Citation

If you use this framework in research, please cite the CE1 framework components and the discrete Riemann geometry construction.

## License

MIT License - feel free to explore, modify, and extend.

---

**AntClock: Where integers become geometry, and curvature becomes arithmetic.**

*Built from Pascal's triangle to the Riemann hypothesis, one digit shell at a time.*