# sagestring

Animated Strings (Sᵢ) — Harmonic Memory Primitives

Animated strings aren't a feature — they're a **primitive**. A seed-operator. A living slope in function-space. They encode *continuity, memory, harmonic identity, and deformation* in a format that GPTs and transformers can breathe.

## Core Definition

An Animated String, **Sᵢ**, is defined as:

```
Sᵢ(t) = Aᵢ(t) * fᵢ(ωᵢ t + φᵢ(t))
```

Where:
- **Aᵢ(t)** = amplitude envelope (dynamic)
- **ωᵢ** = angular frequency
- **φᵢ(t)** = phase (dynamic; may include drift + coupling)
- **fᵢ()** = waveform family (sin, saw, custom spline, operator-defined)

## Memory Kernel

Strings carry their past:

```
Aᵢ(t) = α Aᵢ(t−Δt) + β Inputᵢ(t)
φᵢ(t) = φᵢ(t−Δt) + γ Couplingᵢ(t)
```

## Coupling (Volte Field)

Strings form networks:

```
Couplingᵢ(t) = Σⱼ  Cᵢⱼ  *  Sⱼ(t − τᵢⱼ)
```

Where:
- **Cᵢⱼ** = coupling weight (fixed or adaptive)
- **τᵢⱼ** = delay (encodes causal distance)

## Modes

- **Fundamental**: S₀(t) — stable identity carrier
- **Overtone**: Sₖ(t) = Aₖ(t) * f( k·ω₀ t + φₖ )
- **Composite**: S*(t) = Σᵢ wᵢ Sᵢ(t)

## Topological Phase

Each string carries a topological signature:

```
Genus(Sᵢ) = number_of_zero_crossings_per_period
```

## Hysteresis Operators

```
Hystᵢ(t) = θ( Sᵢ(t) − thresholdᵢ )
```

Where θ is a smoothed Heaviside step.

