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

