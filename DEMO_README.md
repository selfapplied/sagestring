# Self-Referential Sobel System - Working Demo

**File**: `working_sobel_demo.html`

## 🎯 What It Does

This is a **working demonstration** of a self-referential visual system where objects detect their own Sobel boundaries and generate wireframe representations through recursive identity retention.

## 🚀 How to Use

1. **Open** `working_sobel_demo.html` in any modern web browser
2. **Click "▶️ Start"** to begin the simulation
3. **Watch** objects evolve, detect boundaries, and generate wireframes
4. **Experiment** with controls to inject phases and ballast

## 🎮 System Features

### Objects
- **Self-detection**: Objects use Sobel operators to detect their own boundaries
- **Wireframe generation**: Boundary detection creates SVG wireframe representations
- **Phase dynamics**: Three temporal phases (Fixed, Osc28, Osc37) with Feigenbaum bifurcation
- **Recursive retention**: Objects maintain identity through shape memory

### Ballast System
- **Stability conservation**: Objects accumulate "stability mass" over time
- **Energy redistribution**: Unstable objects redistribute ballast to survivors
- **Hierarchical tiers**: Objects achieve different stability levels (T1, T2, T3)
- **Memory footprints**: Stable configurations influence future generations

### Controls
- **▶️ Start/Pause**: Run or pause the simulation
- **🔄 Reset**: Restart with new random objects
- **🌱 Add Objects**: Seed additional objects into the system
- **Phase Injection**: Add Fixed/Osc28/Osc37 phases to regions
- **Ballast Injection**: Inject stability mass (Light/Medium/Heavy)
- **Parameters**: Adjust grid size, stability thresholds, Sobel sensitivity, conservation

## 🔬 Technical Details

- **Grid size**: 64×64 cells (adjustable 32-128)
- **Real-time processing**: 60 FPS cellular automata
- **Sobel detection**: Edge detection for boundary identification
- **SVG rendering**: Vector wireframes overlaid on canvas
- **Ballast conservation**: Energy redistribution system
- **Memory system**: 20-slot configuration recall

## 🎨 Visual Elements

- **Green grid**: Base cellular representation
- **Colored cells**: Phase-coded object regions (Green=Fixed, Blue=Osc28, Red=Osc37)
- **White outlines**: Sobel-detected boundaries
- **Wireframe overlays**: Self-generated SVG representations
- **Glow effects**: Stability and ballast tier indicators
- **Ballast fields**: Gradient regions showing stability influence

## 📊 Live Statistics

- **Frame counter**: Simulation time
- **Object count**: Active entities
- **Average stability**: Population health
- **Total ballast mass**: Accumulated system stability
- **Resonance**: Global stability coherence
- **Object details**: Individual entity tracking

## 🌟 Key Behaviors

1. **Boundary Detection**: Objects continuously detect their own edges
2. **Shape Generation**: Detected boundaries create wireframe glyphs
3. **Stability Accumulation**: Successful objects gain ballast mass
4. **Phase Evolution**: Temporal dynamics drive bifurcation cascades
5. **Population Dynamics**: Objects birth, evolve, and die based on stability
6. **Memory Influence**: Past stable forms guide current evolution

## 🎭 Emergent Phenomena

- **Self-sustaining populations** with ballast conservation
- **Phase-locked clusters** of similar objects
- **Resonance waves** propagating through stable regions
- **Memory-guided rebirth** using past successful configurations
- **Hierarchical stability** with tier-based advantages

## 🚀 Getting Started

```bash
# Simply open in browser
open working_sobel_demo.html

# Or serve locally
python3 -m http.server 8000
# Then visit http://localhost:8000/working_sobel_demo.html
```

## 🔧 Browser Compatibility

- **Chrome/Edge**: Full support
- **Firefox**: Full support
- **Safari**: Full support
- **Mobile browsers**: Limited (performance constraints)

---

**Status**: ✅ Working | **Complexity**: Medium | **Performance**: Real-time

*"A system where pattern recognition and pattern generation become the same process"* ✨


