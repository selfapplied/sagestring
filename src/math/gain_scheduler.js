/**
 * Gain Scheduler - Phase-aware adaptation using scale-Schrödinger model
 * 
 * Schedules gains (c, alpha, beta) for EdgeTracker based on:
 * - Edge density (operating condition)
 * - Motion level (scheduling variable)
 * - Video quality (exogenous signal)
 * - Phase coherence (NEW: θ⋆-based scale-phase alignment)
 * 
 * Decomposes nonlinear edge tracking into simpler linear controllers
 * that adapt to current conditions, with phase-aware modulation.
 */

class GainScheduler {
  constructor(options = {}) {
    // θ⋆ reference for phase coherence
    this.thetaStar = options.thetaStar || null;
    
    // Note: With ES modules, ThetaStar should be imported and passed via options
    
    // Operating regions (equilibrium points)
    this.regions = options.regions || [
      {
        name: 'static',
        condition: (metrics) => metrics.motion < 0.1,
        baseGains: { c: 2.0, alpha: 1.5, beta: 0.7 }, // High spatial coupling, trust data
        phaseModulation: { c: 0.5, alpha: 0.3, beta: 0.2 } // Range for phase-based adjustment
      },
      {
        name: 'slow',
        condition: (metrics) => metrics.motion >= 0.1 && metrics.motion < 0.3,
        baseGains: { c: 1.5, alpha: 1.2, beta: 0.6 },
        phaseModulation: { c: 0.4, alpha: 0.25, beta: 0.15 }
      },
      {
        name: 'moderate',
        condition: (metrics) => metrics.motion >= 0.3 && metrics.motion < 0.6,
        baseGains: { c: 1.0, alpha: 1.0, beta: 0.5 }, // Default
        phaseModulation: { c: 0.3, alpha: 0.2, beta: 0.1 }
      },
      {
        name: 'fast',
        condition: (metrics) => metrics.motion >= 0.6,
        baseGains: { c: 0.5, alpha: 0.8, beta: 0.4 }, // Lower coupling, less trust data
        phaseModulation: { c: 0.2, alpha: 0.15, beta: 0.1 }
      }
    ];
    
    // Smoothing for gain transitions
    this.smoothing = options.smoothing || 0.1;
    this.currentGains = { c: 1.0, alpha: 1.0, beta: 0.5 };
    
    // Metrics history
    this.metricsHistory = [];
    this.historySize = 10;
    
    // Phase coherence tracking
    this.phaseCoherenceHistory = [];
    this.phaseErrorRange = { min: Infinity, max: -Infinity }; // For normalization
  }

  /**
   * Wrap angle to [-π, π]
   */
  wrapToPi(angle) {
    while (angle > Math.PI) angle -= 2 * Math.PI;
    while (angle < -Math.PI) angle += 2 * Math.PI;
    return angle;
  }

  /**
   * Compute phase coherence metric using θ⋆
   * For each pixel and adjacent scale pair, compute phase error
   */
  computePhaseCoherence(edgeTracker, frameData, size) {
    if (!this.thetaStar || !edgeTracker.scales || edgeTracker.scales.length < 2) {
      return 0.5; // Default if no phase data
    }
    
    // Get target phase increments from θ⋆
    // Use alternating pattern: θ₁⋆ for fine→coarse, θ₂⋆ for coarse→fine
    const scales = edgeTracker.scales;
    const targetIncrements = [];
    for (let k = 0; k < scales.length - 1; k++) {
      // Alternate between θ₁⋆ and θ₂⋆, or use rotation number
      const dthetaStar = k % 2 === 0 ? 
        this.thetaStar.rotationNumber : 
        -this.thetaStar.rotationNumber;
      targetIncrements.push(dthetaStar);
    }
    
    // Compute phase differences for each pixel across scales
    const phaseErrors = new Float32Array(size * size);
    
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        let totalError = 0;
        let weightSum = 0;
        
        // For each adjacent scale pair
        for (let k = 0; k < scales.length - 1; k++) {
          const sigma_k = scales[k];
          const sigma_k1 = scales[k + 1];
          
          // Get phases at this pixel for both scales
          const key_k = `${edgeTracker.frameCount}_${x}_${y}_${sigma_k}`;
          const key_k1 = `${edgeTracker.frameCount}_${x}_${y}_${sigma_k1}`;
          
          // Try to get phase from edge tracker or frame data
          let phase_k = 0;
          let phase_k1 = 0;
          
          // If we have phase data in frameData (from θ⋆ kernel)
          if (frameData && frameData.phaseMaps && frameData.phaseMaps[k]) {
            const idx = y * size + x;
            phase_k = frameData.phaseMaps[k][idx] || 0;
          }
          
          if (frameData && frameData.phaseMaps && frameData.phaseMaps[k + 1]) {
            const idx = y * size + x;
            phase_k1 = frameData.phaseMaps[k + 1][idx] || 0;
          }
          
          // Compute phase difference
          const dtheta_k = this.wrapToPi(phase_k1 - phase_k);
          const dthetaStar_k = targetIncrements[k];
          
          // Phase error
          const error = Math.abs(this.wrapToPi(dtheta_k - dthetaStar_k));
          
          // Weight by edge strength (only consider strong edges)
          const mag_k = frameData && frameData.edges && frameData.edges.magnitude ?
            frameData.edges.magnitude[y * size + x] : 0;
          const weight = mag_k > 0.2 ? mag_k : 0;
          
          totalError += error * weight;
          weightSum += weight;
        }
        
        // Average error for this pixel
        phaseErrors[y * size + x] = weightSum > 0 ? totalError / weightSum : 0;
      }
    }
    
    // Aggregate over frame: mean phase error
    let meanError = 0;
    let count = 0;
    for (let i = 0; i < phaseErrors.length; i++) {
      if (phaseErrors[i] > 0) {
        meanError += phaseErrors[i];
        count++;
      }
    }
    meanError = count > 0 ? meanError / count : Math.PI; // Default to max error
    
    // Update error range for normalization
    this.phaseErrorRange.min = Math.min(this.phaseErrorRange.min, meanError);
    this.phaseErrorRange.max = Math.max(this.phaseErrorRange.max, meanError);
    
    // Normalize to [0, 1] and invert (high error = low coherence)
    const range = this.phaseErrorRange.max - this.phaseErrorRange.min;
    const normalized = range > 0 ? 
      (meanError - this.phaseErrorRange.min) / range : 
      0.5;
    
    // Phase coherence: 1 - normalized error
    const phaseCoherence = 1 - Math.min(1, normalized);
    
    return phaseCoherence;
  }

  /**
   * Compute operating metrics from edge tracker state
   */
  computeMetrics(edgeTracker, frameData, size) {
    const metrics = {
      motion: 0,
      edgeDensity: 0,
      quality: 1.0,
      scaleCoherence: 0,
      phaseCoherence: 0 // NEW: θ⋆-based phase alignment
    };
    
    // Motion: temporal variation in edge field
    if (edgeTracker.history.length > 1) {
      const current = edgeTracker.history[edgeTracker.history.length - 1];
      const previous = edgeTracker.history[edgeTracker.history.length - 2];
      
      let motionSum = 0;
      let count = 0;
      for (const [key, value] of current) {
        const prevValue = previous.get(key) || 0;
        motionSum += Math.abs(value - prevValue);
        count++;
      }
      metrics.motion = count > 0 ? motionSum / count : 0;
    }
    
    // Edge density: fraction of strong edges
    if (frameData && frameData.edges && frameData.edges.magnitude) {
      const mag = frameData.edges.magnitude;
      let strongEdges = 0;
      for (let i = 0; i < mag.length; i++) {
        if (mag[i] > 0.3) strongEdges++;
      }
      metrics.edgeDensity = strongEdges / mag.length;
    }
    
    // Quality: variance in edge magnitudes (low variance = high quality)
    if (frameData && frameData.edges && frameData.edges.magnitude) {
      const mag = frameData.edges.magnitude;
      const mean = mag.reduce((a, b) => a + b, 0) / mag.length;
      const variance = mag.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / mag.length;
      metrics.quality = 1 / (1 + variance); // Inverse variance as quality
    }
    
    // Scale coherence: how consistent edges are across scales
    if (edgeTracker.scales && edgeTracker.scales.length > 1) {
      // Simplified: check if edges persist across scales
      metrics.scaleCoherence = 0.7; // TODO: compute actual coherence
    }
    
    // Phase coherence: θ⋆-based phase alignment (NEW)
    metrics.phaseCoherence = this.computePhaseCoherence(edgeTracker, frameData, size);
    
    return metrics;
  }

  /**
   * Schedule gains based on current operating conditions
   * Now phase-aware: modulates gains within each region based on phase_coherence
   */
  schedule(edgeTracker, frameData, size) {
    const metrics = this.computeMetrics(edgeTracker, frameData, size);
    
    // Store metrics
    this.metricsHistory.push(metrics);
    this.phaseCoherenceHistory.push(metrics.phaseCoherence);
    if (this.metricsHistory.length > this.historySize) {
      this.metricsHistory.shift();
      this.phaseCoherenceHistory.shift();
    }
    
    // Find matching region
    let selectedRegion = null;
    for (const region of this.regions) {
      if (region.condition(metrics)) {
        selectedRegion = region;
        break;
      }
    }
    
    // Default to moderate if no match
    if (!selectedRegion) {
      selectedRegion = this.regions.find(r => r.name === 'moderate') || {
        baseGains: { c: 1.0, alpha: 1.0, beta: 0.5 },
        phaseModulation: { c: 0.3, alpha: 0.2, beta: 0.1 }
      };
    }
    
    // Phase-aware modulation within region
    const phaseCoherence = metrics.phaseCoherence;
    const phaseMod = selectedRegion.phaseModulation;
    
    // High phase coherence (> 0.8): increase coupling and data trust
    // Low phase coherence (< 0.4): decrease coupling and data trust
    const phaseFactor = phaseCoherence > 0.8 ? 
      (phaseCoherence - 0.8) / 0.2 : // Map [0.8, 1.0] -> [0, 1]
      phaseCoherence < 0.4 ?
        -(0.4 - phaseCoherence) / 0.4 : // Map [0, 0.4] -> [-1, 0]
        0; // Neutral in [0.4, 0.8]
    
    // Clamp phaseFactor to [-1, 1]
    const clampedPhaseFactor = Math.max(-1, Math.min(1, phaseFactor));
    
    // Compute target gains: base + phase modulation
    const targetGains = {
      c: selectedRegion.baseGains.c + clampedPhaseFactor * phaseMod.c,
      alpha: selectedRegion.baseGains.alpha + clampedPhaseFactor * phaseMod.alpha,
      beta: selectedRegion.baseGains.beta + clampedPhaseFactor * phaseMod.beta
    };
    
    // Clamp to reasonable bounds
    targetGains.c = Math.max(0.1, Math.min(3.0, targetGains.c));
    targetGains.alpha = Math.max(0.1, Math.min(2.0, targetGains.alpha));
    targetGains.beta = Math.max(0.1, Math.min(1.0, targetGains.beta));
    
    // Smooth transition to target gains (EMA)
    this.currentGains = {
      c: this.currentGains.c + this.smoothing * (targetGains.c - this.currentGains.c),
      alpha: this.currentGains.alpha + this.smoothing * (targetGains.alpha - this.currentGains.alpha),
      beta: this.currentGains.beta + this.smoothing * (targetGains.beta - this.currentGains.beta)
    };
    
    // Update edge tracker gains
    edgeTracker.c = this.currentGains.c;
    edgeTracker.alpha = this.currentGains.alpha;
    edgeTracker.beta = this.currentGains.beta;
    
    return {
      gains: { ...this.currentGains },
      targetGains: { ...targetGains },
      region: selectedRegion.name,
      metrics,
      phaseFactor: clampedPhaseFactor
    };
  }

  /**
   * Linearize around operating point
   * Returns Jacobian for stability analysis
   */
  linearize(edgeTracker, metrics) {
    // Simplified linearization: sensitivity of gains to metrics
    const jacobian = {
      dc_dmotion: -1.0,      // c decreases with motion
      dalpha_dmotion: -0.5,  // alpha decreases with motion
      dbeta_dmotion: -0.3,   // beta decreases with motion
      dc_dquality: 0.5,      // c increases with quality
      dalpha_dquality: 0.3,
      dbeta_dquality: 0.2,
      dc_dphaseCoherence: 0.5,  // NEW: c increases with phase coherence
      dalpha_dphaseCoherence: 0.3,
      dbeta_dphaseCoherence: 0.2
    };
    
    return jacobian;
  }

  /**
   * Get current metrics for debugging/visualization
   */
  getMetrics() {
    if (this.metricsHistory.length === 0) return null;
    
    const latest = this.metricsHistory[this.metricsHistory.length - 1];
    return {
      motion: latest.motion,
      edgeDensity: latest.edgeDensity,
      quality: latest.quality,
      scaleCoherence: latest.scaleCoherence,
      phaseCoherence: latest.phaseCoherence,
      gains: { ...this.currentGains },
      phaseCoherenceHistory: [...this.phaseCoherenceHistory]
    };
  }
}

export { GainScheduler };

