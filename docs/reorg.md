# Repository Reorganization

## File Naming Convention

- **3-12 characters** per filename
- **No dashes** (-) or underscores (_)
- **No word smashing** (use natural breaks)
- **~7-10 files per folder** (refine when 3-4 levels deep)

## Directory Structure

```
sagestring/
├── demo/          # All demonstrations (promoted from demos/)
├── docs/          # All documentation
├── src/           # Source code
├── tests/         # Test files
└── Makefile       # Build targets match file names
```

## Demo Files (demo/)

- `kernel.html` - CE1 kernel binding
- `learn.html` - CE1 learning law
- `diatom.html` - Diatom computing
- `ecology.html` - Ecological energy landscape
- `quantum.html` - Quantum learning
- `kaleid.html` - Mathematical kaleidoscope
- `renorm.html` - Symbolic renormalization flow
- `verify.html` - Learning constant verification
- `zp.html` - ZP functor demo

## Documentation (docs/)

- `apps.md` - Applications
- `learn.md` - CE1 Learning Law
- `quantum.md` - Quantum Learning
- `renorm.md` - Symbolic Renormalization
- `svgkern.md` - SVG Kernel System
- `visual.md` - Visual Systems
- `demo.md` - Demo README

## Source Files (src/math/)

Renamed to match convention:
- `kernel.js` - CE1 kernel binding (was ce1_kernel_binding.js)
- `learn.js` - CE1 learning law (was ce1_learning_law.js)
- `diatom.js` - Diatom computing (was diatom_computing.js)
- `quantum.js` - Quantum learning (was quantum_learning.js)

## Makefile Targets

Targets match file names:
- `make quantum` → `demo/quantum.html`
- `make ecology` → `demo/ecology.html`
- `make diatom` → `demo/diatom.html`
- `make kernel` → `demo/kernel.html`

## Promotion Path

Demos in `demo/` can be promoted to **zeta cards** (self-hosted VMs in zetawave) when ready.

