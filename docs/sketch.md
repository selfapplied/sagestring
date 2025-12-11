# Sketch DSL

A gentle language for diagrams. Quiet verbs, lowercase keywords, gentle shapes, readable flow.

## Philosophy

Feels like a sketchbook, not a contract. Cursor will still understand it, but it won't shout at you.

## Syntax

### Diagram Declaration

```
diagram "your diagram title"
size 1600x900
```

### Panels

Panels are like rooms, not boxes:

```
panel left "the tangled world"
  note "morphotaxonomy as time-domain sampling"
  caption "structural enumeration, limited by the eye"
  
  element waves type wavefield
    color "blue, orange"
    complexity high
  end
end
```

### Elements

Elements feel like gestures, not widgets:

- `wavefield` - Scribbled overlapping waves
- `potential_well` - Curved potential energy basins
- `bar_spectrum` - Stacked spectral bars
- `decay_curve` - Exponential or power-law decay
- `ribbon_flow` - Flowing ribbons with gradients
- `text_block` - Text or equations

### Laws

Mathematical laws at the bottom:

```
law zeta_cheeger
  equation "λ₂ ↔ zeta decay   ;   h(G) ↔ environmental filtering"
  note "niche differentiation as the ecological sparsest cut"
  caption "assembly curvature emerges from spectral recurrence"
end
```

## Example

See `demo/sketch.html` for the full ecological energy landscape example.

## Usage

```bash
make sketch
```

Or open `demo/sketch.html` directly.

## Design Principles

- Lowercase everywhere
- Short words, simple breaths
- No braces, no strict syntax, no caps
- Verbs instead of commands
- Panels feel like rooms
- Elements feel like gestures







