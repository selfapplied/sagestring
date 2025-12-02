# SPEC: Animated Strings (Sᵢ) — Harmonic Memory Primitives

Machine grammar for Animated Strings as foundational operators.

## 1. Definition: A String Is an Oscillatory Field with State

An Animated String, **Sᵢ**, is defined as:

```
Sᵢ(t) = Aᵢ(t) * fᵢ(ωᵢ t + φᵢ(t))
```

Where:
- **Aᵢ(t)**  = amplitude envelope (dynamic)
- **ωᵢ**      = angular frequency
- **φᵢ(t)**  = phase (dynamic; may include drift + coupling)
- **fᵢ()**     = waveform family (sin, saw, custom spline, operator-defined)

This gives us:
- harmonic identity
- memory (Aᵢ, φᵢ drift)
- coupling potential
- topological identity (when used as parametric coordinates)

Animated Strings are **both time functions and operators**.

## 2. Memory Kernel: Strings Carry Their Past

A string evolves by:

```
Aᵢ(t) = α Aᵢ(t−Δt) + β Inputᵢ(t)
φᵢ(t) = φᵢ(t−Δt) + γ Couplingᵢ(t)
```

This gives:
- hysteresis
- long-range correlation
- continuity
- implicit history encoding

A string **remembers**.

## 3. Coupling Between Strings (Volte Field)

Strings form networks via coupling functions:

```
Couplingᵢ(t) = Σⱼ  Cᵢⱼ  *  Sⱼ(t − τᵢⱼ)
```

Where:
- **Cᵢⱼ** = coupling weight (fixed or adaptive)
- **τᵢⱼ** = delay (encodes causal distance)
- summation runs over connected strings

This is the "volte" layer — strings influence each other with:
- resonance
- interference
- coherence waves
- echo
- delay-based memory

This is a living attention mechanism. Not a dot product — a **propagated wave**.

## 4. Operator Space: Strings Drive Geometry

The string value may represent:
- position on a path
- intensity in a gradient
- mask threshold
- color channel modulator
- filter kernel strength
- attention gate
- hidden-state activation

A general operator form:

```
Op(x, t) = g( x , S₀(t)...Sₙ(t) )
```

So the entire rendering or reasoning is *field-driven*.

## 5. Modes: Fundamental, Overtone, Composite

### Fundamental string
Stable identity carrier.

```
S₀(t)
```

### Overtone strings
Harmonic multiples.

```
Sₖ(t) = Aₖ(t) * f( k·ω₀ t + φₖ )
```

### Composite strings
Superpositions:

```
S*(t) = Σᵢ wᵢ Sᵢ(t)
```

These create higher meaning structures. GPTs can use them as latent basis vectors that *vibrate* rather than sit still.

## 6. Topological Phase: Strings as Genus Encoders

Each string carries a **topological signature**:

```
Genus(Sᵢ) = number_of_zero_crossings_per_period
```

This means:
- Γ=0 → sphere-like smoothness
- Γ=1 → toroidal wrap
- Γ>1 → higher genus loops

It gives Tellah a way to encode shape, not just value.

## 7. Hysteresis Operators

Define:

```
Hystᵢ(t) = θ( Sᵢ(t) − thresholdᵢ )
```

Where θ is a smoothed Heaviside step.

This gives us:
- edge detection
- cycle-breaking
- decision thresholds
- multi-stable attractor states

Useful for gating GPT algorithms where discrete choices must emerge organically.

## 8. The Full Animated String Spec (Minimal Form)

```
String Sᵢ {
    freq: ωᵢ
    waveform: fᵢ(u)
    amplitude: Aᵢ(t) = α Aᵢ(t−Δt) + β Inputᵢ(t)
    phase:     φᵢ(t) = φᵢ(t−Δt) + γ Couplingᵢ(t)
    value:     Sᵢ(t) = Aᵢ(t) * fᵢ(ωᵢ t + φᵢ(t))

    coupling:
        Couplingᵢ(t) = Σⱼ Cᵢⱼ * Sⱼ(t − τᵢⱼ)

    topology:
        genus = zero_crossings_per_period(fᵢ)
        hysteresis = θ( Sᵢ(t) − thresholdᵢ )

    modes:
        fundamental, overtone(k), composite(Σ wᵢ Sᵢ)
}
```

This is the **complete spec** for an animated string that:
- carries memory
- supports coupling
- can drive geometry
- can encode topology
- can evolve over time
- can be packed into SVG, CE1, FEG, or a new GPT algorithm

## 9. Named Strings: The Harmonic Type System

A string is not just an oscillator — it's a **typed harmonic** with identity.

### Form

```
string name:Type {
    amp   = A
    freq  = ω
    phase = φ
}
```

This makes a string feel like a typed variable, but with breath and motion.

### Semantic Knobs

**Amplitude (A)** = intensity knob
- strength
- saturation
- thickness
- opacity
- influence
- attention weight over time

Functionally: `amp controls "how much of me exists right now."`

**Frequency (ω)** = detail knob
- geometric detail
- vibrational resolution
- speed of change
- curvature
- roughness
- semantic granularity

Functionally: `freq controls "how fine-grained I am."`

**Phase (φ)** = relational type
- not a number; a **type category**
- expresses relational compatibility
- the many-to-many connector
- how a string aligns with other strings
- the typeclass of harmonic geometry

Functionally: `phase expresses relational compatibility.`

### Example

```
string Red:Color     { amp=0.8 freq=1.0 }
string ClipPulse:Clip { amp=1.2 freq=2.0 }
string Radius:Shape   { amp=0.6 freq=0.5 }
string Drift:Phase    { amp=0.4 freq=0.1 }
```

Now they're coordinates in a new reasoning space.

## 10. Harmonic Namespaces: Same Name, Multiple Patterns

When two strings **share the same name**, you don't get overwriting — you get **pattern matching**, **type unification**, **multimethod dispatch via resonance**, and **Tellah-style many-to-many inference**.

### The Principle

Same name = same phase identity, different arities = different harmonic forms.

```
string Hue(x) : Color
string Hue(x,y) : Color
string Hue(a,b,c) : Color
```

These are all members of the **Hue** harmonic family. They don't conflict — they **resonate**.

A renderer or Tellah-engine sees them as:
- same semantic category (Color)
- different arities (different harmonic complexity)
- same phase identity
- different pattern signatures

### Harmonic Polymorphism

Traditional polymorphism: same name, different argument types.

Harmonic polymorphism: same name, different *arity* (thus different harmonic structure), same semantic phase.

```
Hue(x)         → 1-beat color cycle
Hue(x,y)       → 2-beat interference color
Hue(a,b,c)     → 3-phase palette evolution
Hue(a,b,c,d)   → 4-channel spectral morph
```

All of these are "Hue" because they are:
- in the Color phase
- share the same naming root
- but have different oscillatory signatures

This mirrors:
- how languages handle synonyms and nuance (what a GPT learns implicitly)
- how physics handles harmonics (fundamental + overtones)
- how OPIC handles operator families (one name, many shapes)

### Name Resolution Algorithm

When you request a string by name, the engine uses:

1. **Exact arity match**
2. **Nearest arity (up or down)**
3. **Composite superposition**
4. **Weighted harmonic blend** based on context
5. **Phase constraint pruning**

This gives you a **resonance-based dispatch system**.

### Harmonic Transformation

If a shape operator wants a 2-arity Color but only finds:
- `Hue(x)`
- `Hue(a,b,c)`

It can blend:

```
Hue₂(t) = mix( Hue(x).promote() , Hue(a,b,c).reduce() )
```

Where:
- **promote** = lift a 1-arity to 2-arity by duplication or modulation
- **reduce** = project a 3-arity to 2-arity by harmonic reduction

This is the *harmonic equivalent* of:
- currying
- partial application
- type projection
- dimension reduction
- embedding space alignment

All native to the wave-type system.

### Names as Hubs in Harmonic Space

> **A name acts like a gravitational center for all its harmonic variants.**

"Hue" isn't one string — it's a *galaxy* of color oscillations. "Hue" becomes a *field* over the space of arities.

This lets Tellah:
- learn dense families of harmonic operators
- autocomplete by resonance
- generalize by interpolation
- self-correct by projection
- recognize similarity by harmonic alignment

**Semantics = name**  
**Continuity = arity**  
**Magnitude = amplitude**  
**Context = phase**

This is the beginnings of an entirely new model architecture.

### Registry Extension

The registry now maintains harmonic families:

```
Registry {
    strings: Map<name, Set<String>>  // name → family of arities
    families: Map<name, HarmonicFamily>
    types: Set<Type>
    couplings: Map<(name₁, name₂), Cᵢⱼ>
    phase_lattice: Lattice<PhaseCategory>
    
    resolve(name, arity) → String | Composite
    promote(String, target_arity) → String
    reduce(String, target_arity) → String
    blend(Set<String>, weights) → Composite
}
```

## 11. Fundamental Types

Four fundamental "types of strings" align with SVG and FEG operations:

### Color Strings

```
string Hue:Color
string Sat:Color
string Lum:Color
```

Each drives a continuous channel.

### Clip Strings

```
string Gate:Clip
string Mask:Clip
```

These cut, reveal, or threshold.

### Position Strings

```
string X:Position
string Y:Position
string Z:Position (optional)
string T:Position (time-shift master)
```

These reshape geometry.

### Shape Strings

```
string Radius:Shape
string Curl:Shape
string Warp:Shape
```

These define topology.

## 12. Composite Strings: Emergent Types

Strings combine to form new types:

```
string Glow:Color = mix(Hue, Lum)
string Ripple:Shape = mix(Radius, Warp)
string Portal:Clip = mix(Gate, Warp)
string DriftField:Position = mix(X, T)
```

This is the equivalent of higher-kinded types, but organic and dynamic.

## 13. Phase Categories: The Type Lattice

Phase is not a number; it's a **relational type category**:

- A `Color` string uses phase to align with other colors in a palette.
- A `Shape` string uses phase to align with clip paths or position fields.
- A `Clip` string uses phase to align with shape harmonics.
- A `Position` string uses phase to align with multiple coordinates (x,y,z,time).

Phase categories form a lattice where strings can couple based on compatibility:

```
phase:Color → palette:cool | palette:warm | palette:neutral
phase:Clip  → edge:soft | edge:hard | threshold:adaptive
phase:Shape → loop:genus0 | loop:genus1 | surface:closed
phase:Position → axis:x | axis:y | axis:z | time:master
```

This enables many-to-many coupling: strings of compatible phase categories can influence each other through the volte field.

## 14. String Registry

A registry maintains the active set of named strings and their harmonic families:

```
Registry {
    strings: Map<name, Set<String>>  // name → family of arities
    families: Map<name, HarmonicFamily>
    types: Set<Type>
    couplings: Map<(name₁, name₂), Cᵢⱼ>
    phase_lattice: Lattice<PhaseCategory>
    
    resolve(name, arity) → String | Composite
    promote(String, target_arity) → String
    reduce(String, target_arity) → String
    blend(Set<String>, weights) → Composite
}
```

The registry enables:
- type checking (can string `A:Color` couple with `B:Shape`?)
- automatic coupling discovery (strings with compatible phases)
- composite string construction
- operator binding (which strings drive which geometry)
- harmonic family resolution (same name, different arities)
- arity transformation (promote/reduce/blend)

## 15. The Tellah Layer: GPT as Wave-Typed Operator Network

A GPT embeds everything in high-dimensional continuous spaces, but those spaces have no *organizational physics*.

The string system provides:
- **typed coordinates** (not anonymous dimensions)
- **harmonic identity** (not just position)
- **coupling rules** (not just dot products)
- **semantic motion** (not just static embeddings)
- **wave-based reasoning** (not just matrix multiplies)
- **memory-through-phase** (not just hidden states)

Strings aren't variables. They are **oscillatory types that shape the flow of inference**.

Tellah becomes:
> "a GPT that reasons by aligning, modulating, and composing typed harmonic strings."

This is the Volte-Sage architecture: memory as phase, reasoning as coupling, identity as wave.

## 16. Concrete Example: FEG/SVG-Style

Fundamental types manifest in declarative form:

```
<string id="Hue"    type="Color"    amp="0.8" freq="1.0" phase="palette:cool"/>
<string id="Mask"   type="Clip"     amp="1.2" freq="2.5" phase="edge:soft"/>
<string id="X"      type="Position" amp="0.6" freq="0.5" phase="axis:x"/>
<string id="Radius" type="Shape"    amp="1.0" freq="0.8" phase="loop:genus1"/>
```

Then geometry is driven by strings:

```
circle
    cx = 960  + 200 * X(t)
    cy = 540
    r  = 150  + 40  * Radius(t)
    fill = hsl(Hue(t), 80%, 50%)
    clip-path = url(#Mask)
```

This video is literally geometry-as-harmonics.


