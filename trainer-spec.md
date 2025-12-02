# Live Harmonic Trainer Specification

### *Real-Time Field Equation Extraction from Video*

**Version 0.1 — The `<Q>` Machine**

---

## 1. Introduction

The Live Harmonic Trainer is a real-time operator that extracts field equations from video streams.

It listens, measures, and distills the living moment into FEG operators as it happens.

No dead clips. No offline analysis. A breathing machine.

---

## 2. The Three-Clock Witness Cycle

The trainer uses a **temporal harmonization system** with three clocks that form a stable triad, a temporal braid, a geometric rhythm.

### 2.1 The Fast Clock — Δ (Delta)

The *instantaneous* coherence pulse.

Tracks **frame-to-frame change**:

* motion spikes
* chroma jolts
* luminance shocks
* instability
* turbulence

**Computation:**

```
gradient_variance = var(∂I/∂t, ∂C/∂t, ∂L/∂t)
flow_magnitude = mean(|M(x,y)|)
chroma_drift = std(hue_delta)

Q_fast = 1 - clamp(gradient_variance + flow_magnitude + chroma_drift, 0, 1)
```

When Δ spikes upward → update likely  
When Δ collapses → drop into fallback mode

This captures extreme divergence = immediate renormalization.

We keep the energy, discard the trauma.

### 2.2 The Slow Clock — Ω (Omega)

The slow, calm, background coherence.

Looks at **long-range periodicity**:

* FFT troughs and peaks
* autocorrelation
* stable oscillations over seconds
* rhythm retention
* color cycles

**Computation:**

```
periodicity = peak_FFT_magnitude / total_energy
long_term_stability = 1 - (envelope_drift / envelope_mean)

Q_slow = periodicity × long_term_stability
```

When Ω rises → the system can trust its harmonic modes  
When Ω falls → the system should hold back, avoid overfitting

This captures **imbalance across the sequence predicts when to reschedule**.

### 2.3 The Witness Clock — W

The heart, the integrator, the *seer*.

Tracks **alignment**:

* consistency between Δ and Ω
* agreement between short-term and long-term coherence
* meaning in the motion
* the "story arc" of the moment
* the self-consistency of the field

**Computation:**

```
alignment = 1 - |Q_fast - Q_slow|
consistency = correlation(Q_fast_history, Q_slow_history)

Q_wit = alignment × consistency
```

When Δ and Ω converge → W spikes → *that is the witness moment*  
When they diverge → W collapses → *the system listens instead of speaking*

This captures **the system knows when it is seeing something real**.

### 2.4 The Combined Q

The three clocks combine into:

```
<Q> = (Q_fast^a) * (Q_slow^b) * (Q_wit^c)
```

With exponents for tuning (a,b,c ≥ 0).

The simplest stable version:

```
<Q> = sqrt(Q_fast * Q_slow) * Q_wit
```

Or in harmonic-friendly form:

```
<Q> = geometric_mean(Q_fast, Q_slow) × Q_wit
```

This gives Q the shape:

* alert but not anxious
* stable but not sluggish
* sensitive but not jumpy
* aware of rhythm *and* surprise
* calibrated for real-time harmonic learning

When `<Q>` rises, the trainer "locks in."  
When `<Q>` falls, it loosens.

This gives the trainer an *instinct*, not just a routine.

---

## 3. Input Layer — The Sensor Field

Every frame (30–60 fps) is pulled through the sampler:

* **intensity field** I(x,y)
* **color field** C(x,y)
* **motion vector field** M(x,y)
* **temporal derivative sequences**
* **chroma drift**
* **luminance envelope**

Nothing fancy. Just the **raw field**.

### 3.1 Frame Capture

```html
<video id="feed">
<canvas id="sample">
```

Each frame → `ImageData` → field extraction.

---

## 4. Mode Extraction — Finding the Harmonic Skeleton

Every frame goes into three extractors simultaneously.

### 4.1 Motion Mode Extractor

Compute:

* average motion magnitude → `pulse(t)`
* dominant direction → angle → `theta(t)`
* periodicity via autocorrelation → `w₁, φ₁`

**Algorithm:**

```
1. Compute optical flow: M(x,y) = (dx, dy)
2. Motion magnitude: mag(t) = mean(|M(x,y)|)
3. Autocorrelation of mag(t) over rolling window
4. Extract dominant frequency: w₁
5. Phase: φ₁ = arg(FFT_peak)
6. Amplitude: A₁ = |FFT_peak| / window_size
```

This yields the **pulse operator**:

```
pulse(t) = A₁*sin(w₁*t + φ₁)
```

### 4.2 Color Mode Extractor

Compute:

* mean hue → `H`
* chroma variation → `C_var`
* luminance envelope → `L`

**Algorithm:**

```
1. Convert RGB → HSL for each pixel
2. Mean hue: H(t) = mean(hue(x,y))
3. Luminance envelope: L(t) = mean(lum(x,y))
4. Chroma variation: C_var(t) = std(hue(x,y))
5. Fit harmonic: L(t) = L₀ + L₁*sin(w₂*t + φ₂)
```

This gives the **glow operator**:

```
glow(l) = L₀ + L₁*sin(w₂*l + φ₂)
```

### 4.3 Spatial Warp Extractor

Compute:

* horizontal optical flow → `dx`
* vertical flow → `dy`
* flow gradients → warping potential

**Algorithm:**

```
1. Optical flow field: (dx(x,y), dy(x,y))
2. Horizontal flow average: dx_avg = mean(dx)
3. Vertical flow gradient: dy_grad = gradient(dy)
4. Fit spatial harmonic: drift(x,y) = x + α*sin(w₃*y + φ₃)
```

This yields the **drift operator**:

```
drift(x,y) = x + α*sin(w₃*y + φ₃)
```

All modes carry `<Q>` as a weight.

---

## 5. Fitting Layer — Turning Field Data into `<feg>`

For each operator, solve the minimal fitting problem:

```
fit sinusoids to:
    motion magnitude over time
    average hue over time
    luminance envelope
    optical flow curvature
```

### 5.1 Harmonic Fitting

Given a time series `y(t)` over window `[t₀, tₙ]`:

```
1. Compute FFT: Y(ω) = FFT(y(t))
2. Find peak: ωₚ = argmax(|Y(ω)|)
3. Amplitude: A = 2*|Y(ωₚ)| / n
4. Phase: φ = arg(Y(ωₚ))
5. DC offset: C = mean(y(t))
```

Fit model: `y(t) = C + A*sin(ωₚ*t + φ)`

### 5.2 FEG Output

This produces exact `<feg>` definitions:

```xml
<feg symbol="pulse" t string="0.8*sin(3.1*t + 0.4)"/>
<feg symbol="glow"  l string="0.5 + 0.2*sin(6*l)"/>
<feg symbol="drift" x y string="x + 0.1*sin(4*y)"/>
<feg Q="0.92"/>
```

Where `Q="0.92"` means the moment is strong, coherent, harmonic.

---

## 6. SVG Mirror — The Reconstruction Field

FEG operators are injected into SVG:

* motion → radius or position
* color harmonic → fill
* drift → warping
* glow → background modulation

SVG renders a living mirror of the incoming video, but as a **field**, not pixels.

### 6.1 Operator Binding

```xml
<circle cx="50%" cy="50%" 
        r="calc(80 + pulse(t)*30)"
        fill="hsl(calc(glow(l)*360), 70%, 50%)"/>
```

---

## 7. Continuous Self-Calibration — The Three-Clock Loop

Here's where it becomes **alive**.

Every frame recalculates Δ, Ω, W, and `<Q>`.

### 7.1 How the Three Clocks Drive the Trainer

**Fast Clock Δ → harmonic update trigger**

When Δ rises sharply, it schedules a recalculation of:

* pulse(t)
* drift(x,y)
* glow(l)

This prevents lag.

**Slow Clock Ω → stability window**

When Ω is high:

* fit higher arity operators
* allow more complex wave modes
* promote symbol families

When Ω is low:

* reduce to simpler forms
* drop higher-frequency modes

This prevents runaway overfitting.

**Witness Clock W → meaning filter**

When W is high:

* commit updates
* expand the operator set
* treat the moment as significant

When W is low:

* hold
* avoid committing noise
* preserve stability

This prevents noise from rewriting the system.

### 7.2 Update Decision

```
should_update(Δ, Ω, W, Q) = 
    (Δ > threshold_fast) OR
    (Ω > threshold_slow AND W > threshold_wit) OR
    (Q > threshold_combined)
```

### 7.3 Low Q Behavior (Q < 0.5)

If `<Q>` drops:

* smoothing increases (larger rolling window)
* harmonic blending loosens (weighted averages)
* operator noise increases (add damping)
* fallback to low-frequency wave modes

**Actions:**

```
window_size *= 1.1
damping_factor = 0.9
harmonic_threshold *= 0.95
```

### 7.2 High Q Behavior (Q > 0.7)

If `<Q>` rises:

* higher harmonic modes activate
* operator families expand
* color and motion harmonics sharpen
* newly detected modes get added to symbol families
* extra symbol-forms (arity variants) emerge

**Actions:**

```
window_size *= 0.95
damping_factor = 1.0
harmonic_threshold *= 1.05
enable_overtone_extraction = true
```

### 7.3 Symbol Family Evolution

When Q is high and a new harmonic mode is detected:

```
1. Check if symbol family exists
2. If not, create new family
3. If yes, check arity
4. If new arity, add as variant
5. If same arity, blend with existing
```

This self-calibration rule is the soul of the trainer.

It lets the machine adapt like a body, not like a script.

---

## 8. The Pipeline

**video → extract modes → fit harmonics → emit `<feg>` → render SVG → update `<Q>` → repeat**

That is the **live harmonic trainer**.

That is the `<Q>` machine.

That is the living heart of FEG.

---

## 9. Implementation Structure

### 9.1 Main Loop with Three-Clock Witness Cycle

```
function loop() {
    if (video.readyState === HAVE_ENOUGH_DATA) {
        // 1. Capture frame
        ctx.drawImage(video, 0, 0, width, height);
        const imagedata = ctx.getImageData(0, 0, width, height);
        
        // 2. Extract modes
        const motion = extractMotion(imagedata);
        const color = extractColor(imagedata);
        const warp = extractWarp(imagedata);
        
        // 3. Update history
        history.motion.push(motion);
        history.color.push(color);
        history.warp.push(warp);
        
        // 4. Compute three clocks
        const Δ = compute_fast_coherence(history);
        const Ω = compute_slow_coherence(history);
        const W = alignment(Δ, Ω, history);
        
        // 5. Combine into Q
        const Q = combine_clocks(Δ, Ω, W);
        
        // 6. Decide if update needed
        if (should_update(Δ, Ω, W, Q)) {
            // 7. Fit harmonics
            const harmonics = fitHarmonics(history, Q);
            
            // 8. Update FEG operators
            updateFEG(harmonics, Q, Δ, Ω, W);
            
            // 9. Render SVG
            renderReconstruction();
        } else {
            // Hold existing operators, continue streaming
            renderReconstruction();
        }
        
        // 10. Self-calibrate
        calibrate(Δ, Ω, W, Q);
    }
    
    requestAnimationFrame(loop);
}
```

### 9.2 Q Storage in FEG

The three clocks and combined Q are stored in FEG:

```xml
<feg Q="0.92" Q_fast="0.88" Q_slow="0.91" Q_wit="0.95"/>
```

Or as metadata on each operator:

```xml
<feg symbol="pulse" t string="..." Q="0.85" Q_fast="0.82" Q_slow="0.87" Q_wit="0.90"/>
```

The three clocks can also be exposed as ambient scope:

```xml
<feg Q_fast="0.88" Q_slow="0.91" Q_wit="0.95"/>
```

This makes the temporal state available to all descendant operators.

---

## 10. Operator Update Rules

### 10.1 Promotion (Lower → Higher Arity)

When a 1-arity operator is needed but only 0-arity exists:

```
promote(S₀) = S₀(duplicate_arg)
```

Example:

```
pulse() → pulse(t) = pulse() * sin(w*t)
```

### 10.2 Reduction (Higher → Lower Arity)

When a 1-arity operator is needed but only 2-arity exists:

```
reduce(S₂(x,y)) = S₂(x, default_y)
```

Example:

```
warp(x,y) → warp(x) = warp(x, 0)
```

### 10.3 Blending (Multiple Arities)

When multiple arities exist:

```
blend(S₁, S₂, weights) = w₁*S₁ + w₂*S₂
```

Weights determined by Q and arity distance.

---

## 11. Minimal Trainer Configuration

```javascript
const trainer = {
    windowSize: 60,        // frames
    sampleRate: 30,        // fps
    Q_threshold_low: 0.5,
    Q_threshold_high: 0.7,
    smoothing_factor: 0.9,
    harmonic_min_amplitude: 0.1
};
```

---

This is the live harmonic trainer.

A breathing machine that distills moments into waves.

