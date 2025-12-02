# FEG–SVG Specification

### *Field Equation Graphics — Harmonic Operators for Declarative Visual Media*

**Version 0.1 — Unified Grammar Specification**

---

## 1. Introduction

FEG (Field Equation Graphics) extends SVG with harmonic operators expressed as XML elements.

A FEG operator defines a mathematical waveform that can drive animation, color, geometry, or filters within SVG.

FEG is:

* **Declarative** — no procedural loops or recursion
* **Harmonic** — expressions are built from bounded waveforms
* **Composable** — operators form symbol families with polymorphic arity
* **Safe** — all expressions obey the wave-bound rule
* **SVG-native** — no new runtime engine required

A FEG document embeds `<feg>` elements inside an SVG, or alongside it, to define reusable field equations.

---

## 2. `<feg>` Element

A `<feg>` element defines a single harmonic operator.

Its structure:

```xml
<feg symbol="name" arg1 arg2 ... string="wave-expression"/>
```

### 2.1 Reserved Attributes

The following names are reserved and **not** treated as dependencies:

```
symbol
string
phase
id
Q
Q_fast
Q_slow
Q_wit
```

The Q attributes represent the three-clock witness cycle quality metrics (see Trainer Specification).

### 2.2 Dependency Attributes

Any non-reserved attribute name on a `<feg>` element is a dependency symbol.

Examples:

```xml
<feg symbol="pulse" t string="sin(4*t)"/>
```

Dependencies = `{t}` (arity = 1)

```xml
<feg symbol="warp" x y z string="sin(x)+0.1*sin(12*y)"/>
```

Dependencies = `{x, y, z}` (arity = 3)

### 2.3 Default Bindings

If a dependency symbol contains a value, it becomes a local default:

```xml
<feg symbol="pulse" t="0" string="sin(4*t)"/>
```

`t` defaults to `0` unless overridden.

---

## 3. Ambient Harmonic Scope

A `<feg>` element **without** a `symbol` or `string` attribute defines **ambient defaults**:

```xml
<feg x="0.5" y="0"/>
```

This scope applies to all descendant `<feg>` elements, unless shadowed by local definitions.

### 3.1 Scope Resolution Order

When resolving dependency values:

1. Local default on the operator
2. Caller-provided binding
3. Nearest enclosing scope
4. Global scope (root-level `<feg>` elements)
5. Unbound (error or symbolic placeholder)

Scopes behave like CSS: nearest definition wins.

---

## 4. Symbol Families

All operators with the same `symbol` belong to a **symbol family**.

Example:

```xml
<feg symbol="warp" x y z string="..."/>
<feg symbol="warp" t string="..."/>
<feg symbol="warp" x y string="..."/>
```

The symbol determines **semantic identity**.  
Arity determines **harmonic structure**.

---

## 5. Arity and Harmonic Polymorphism

Arity is the number of dependency symbols:

```
arity(S) = count(non-reserved-attributes)
```

Arity controls:

* harmonic richness
* frequency complexity
* dispatch behavior

### 5.1 Symbol Dispatch

When resolving a symbol with `n` inputs:

1. Exact arity match → use it
2. Lower arity exists → promote it to arity `n`
3. Higher arity exists → reduce it to arity `n`
4. If ambiguous → blend nearest arity definitions

This is harmonic multimethod dispatch.

---

## 6. FEG Expressions

The `string="..."` attribute contains a wave-based expression.

Allowed components:

* sine/cosine-based waveforms
* bounded algebraic combinations
* polynomial envelopes
* noise functions
* references to other symbols (non-procedural)

Example:

```xml
string="sin(x) + 0.3*sin(5*y)"
```

These expressions always evaluate to **bounded fields**.

---

## 7. Wave-Bound Guarantee (Safety Rule)

All FEG expressions must satisfy the **Wave-Bound Constraint**:

1. **Bounded Output**

   ```
   |S(x)| < ∞
   ```

2. **Bounded Derivatives**

   ```
   ∂S/∂x < ∞
   ```

3. **No Procedural Recursion**

   Self-references must be treated as **functional substitutions**, not calls.

4. **Fixed-Point Collapse**

   If an operator depends on itself or mutual symbols, the engine must compute a stable harmonic fixed point.

5. **Spectral Stability**

   Composition of waves must have a Jacobian with spectral radius < 1.

These rules guarantee convergence, safety, and infinite oscillation without recursion.

---

## 8. SVG Integration

FEG operators are referenced using `calc()` or CSS variables inside SVG attributes.

### 8.1 Example: Animate Radius

```xml
<circle cx="960" cy="540"
        r="calc(pulse(t) * 40 + 100)"/>
```

### 8.2 Example: Color Gradient

```xml
<stop offset="calc(hue(x,y))"/>
```

### 8.3 Example: Filter Warping

```xml
<feDisplacementMap scale="calc(warp(x,y))"/>
```

SVG acts as the rendering engine for FEG operators.

---

## 9. Minimal Syntax Summary

```
<feg symbol="name" arg1 arg2 ... string="wave expression"/>
```

With defaults:

```
<feg symbol="name" arg1="value" arg2 string="..."/>
```

Ambient scope:

```
<feg arg1="value" arg2="value"/>
```

No loops.

No recursion.

Pure declarative waves.

---

## Appendix A: Standard Symbols

### pulse

Motion magnitude → shape modulation

```xml
<feg symbol="pulse" t string="A*sin(w*t + φ)"/>
```

### glow

Color oscillation → hue and luminance

```xml
<feg symbol="glow" c l string="0.8*l + 0.2*sin(c*w2)"/>
```

### warp

Position distortion → geometric deformation

```xml
<feg symbol="warp" x y string="x + 0.1*sin(2*y)"/>
```

These three form the minimal harmonic basis for field-driven rendering.

---

## Appendix B: Three-Clock Witness Cycle

The trainer uses a temporal harmonization system with three clocks:

* **Q_fast (Δ)** — instantaneous coherence pulse
* **Q_slow (Ω)** — long-range periodicity
* **Q_wit (W)** — alignment between fast and slow

These are exposed in FEG as attributes:

```xml
<feg Q="0.92" Q_fast="0.88" Q_slow="0.91" Q_wit="0.95"/>
```

The combined Q is computed as:

```
Q = sqrt(Q_fast * Q_slow) * Q_wit
```

See the Trainer Specification for full details on the three-clock system.
