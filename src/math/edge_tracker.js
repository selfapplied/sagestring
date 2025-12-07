/**
 * Edge Tracker - Continuity-regularized edge tracking
 * 
 * Uses spacetime-scale action functional to enforce continuity:
 * - Temporal: edges persist across frames (no flicker)
 * - Spatial: edges form smooth curves (not salt-and-pepper)
 * - Scale: edges persist across zoom levels
 * 
 * Takes fractal Sobel evidence E(t,x,y,σ) and regularizes it into φ(t,x,y,σ)
 */

class EdgeTracker {
  constructor(options = {}) {
    // Continuity parameters
    this.c = options.c || 1.0; // spatial coupling strength
    this.alpha = options.alpha || 1.0; // scale coupling strength
    this.beta = options.beta || 0.5; // data fidelity (how much to trust Sobel)
    
    // Field storage: φ(t, x, y, σ)
    // Key: `${t}_${x}_${y}_${sigma}`
    this.phi = new Map();
    this.history = []; // previous frames for temporal continuity
    
    // Scale spacing (fractal/Feigenbaum)
    this.scales = this.generateScales(
      options.scaleMin || 0.5,
      options.scaleMax || 4.0,
      options.scaleCount || 5,
      options.fractalType || 'dyadic' // 'dyadic', 'feigenbaum', 'golden'
    );
    
    // Scale weights for aggregation
    this.scaleWeights = this.scales.map(sigma => 
      Math.pow(sigma, -1 - (options.zeta || 0))
    );
    
    this.frameCount = 0;
  }

  /**
   * Generate scale spacing (fractal tower)
   */
  generateScales(min, max, count, type) {
    const scales = [];
    
    if (type === 'dyadic') {
      // σ_k = 2^k * min
      for (let k = 0; k < count; k++) {
        scales.push(min * Math.pow(2, k));
      }
    } else if (type === 'feigenbaum') {
      // Feigenbaum spacing: σ_{k+1} = δ * σ_k where δ ≈ 4.669
      const delta = 4.669201609;
      let sigma = min;
      for (let k = 0; k < count && sigma <= max; k++) {
        scales.push(sigma);
        sigma *= delta;
      }
    } else if (type === 'golden') {
      // Golden ratio spacing
      const phi = 1.618033988;
      let sigma = min;
      for (let k = 0; k < count && sigma <= max; k++) {
        scales.push(sigma);
        sigma *= phi;
      }
    }
    
    return scales;
  }

  /**
   * Get field value: φ(t, x, y, σ)
   */
  getPhi(t, x, y, sigma) {
    const key = `${t}_${x}_${y}_${sigma}`;
    return this.phi.get(key) || 0;
  }

  /**
   * Set field value
   */
  setPhi(t, x, y, sigma, value) {
    const key = `${t}_${x}_${y}_${sigma}`;
    this.phi.set(key, value);
  }

  /**
   * Temporal derivative: ∂_t φ (penalizes flicker)
   */
  timeDerivative(t, x, y, sigma, dt = 1) {
    const current = this.getPhi(t, x, y, sigma);
    const previous = this.getPhi(t - dt, x, y, sigma);
    return (current - previous) / dt;
  }

  /**
   * Spatial gradient: ∇_{x,y} φ (penalizes spatial jitter)
   */
  spatialGradient(t, x, y, sigma, size) {
    const phi = this.getPhi(t, x, y, sigma);
    const phiLeft = x > 0 ? this.getPhi(t, x - 1, y, sigma) : phi;
    const phiRight = x < size - 1 ? this.getPhi(t, x + 1, y, sigma) : phi;
    const phiUp = y > 0 ? this.getPhi(t, x, y - 1, sigma) : phi;
    const phiDown = y < size - 1 ? this.getPhi(t, x, y + 1, sigma) : phi;
    
    const dx = (phiRight - phiLeft) / 2;
    const dy = (phiDown - phiUp) / 2;
    
    return Math.sqrt(dx*dx + dy*dy);
  }

  /**
   * Scale derivative: D_σ φ (penalizes scale inconsistency)
   */
  scaleDerivative(t, x, y, sigma) {
    const current = this.getPhi(t, x, y, sigma);
    const sigmaIdx = this.scales.indexOf(sigma);
    
    if (sigmaIdx < 0) return 0;
    
    const up = sigmaIdx < this.scales.length - 1 
      ? this.getPhi(t, x, y, this.scales[sigmaIdx + 1]) 
      : current;
    const down = sigmaIdx > 0 
      ? this.getPhi(t, x, y, this.scales[sigmaIdx - 1]) 
      : current;
    
    const dsigma = sigmaIdx < this.scales.length - 1 
      ? this.scales[sigmaIdx + 1] - sigma 
      : sigma - this.scales[sigmaIdx - 1];
    
    return (up - down) / (2 * dsigma);
  }

  /**
   * Data potential: V_data(φ; E) = β * (φ - E)^2
   * Ties φ to Sobel evidence E
   */
  dataPotential(phi, evidence) {
    return this.beta * (phi - evidence) * (phi - evidence);
  }

  /**
   * Action functional: S[φ] = sum of continuity terms + data term
   */
  action(t, x, y, sigma, evidence) {
    const phi = this.getPhi(t, x, y, sigma);
    
    // Temporal continuity: penalize flicker
    const dtPhi = this.timeDerivative(t, x, y, sigma);
    const temporalCost = 0.5 * dtPhi * dtPhi;
    
    // Spatial continuity: penalize jitter
    const gradPhi = this.spatialGradient(t, x, y, sigma, 256); // TODO: get size
    const spatialCost = 0.5 * this.c * this.c * gradPhi * gradPhi;
    
    // Scale continuity: penalize scale inconsistency
    const dsigmaPhi = this.scaleDerivative(t, x, y, sigma);
    const scaleCost = 0.5 * this.alpha * this.alpha * dsigmaPhi * dsigmaPhi;
    
    // Data fidelity: tie to Sobel evidence
    const dataCost = this.dataPotential(phi, evidence);
    
    return temporalCost + spatialCost + scaleCost + dataCost;
  }

  /**
   * Update field using gradient descent on action
   * Minimizes S[φ] to enforce continuity
   * 
   * Now accepts complex responses from fractal Sobel wavelet as φ_init
   */
  update(t, sobelEvidence, size, learningRate = 0.1) {
    // sobelEvidence: Map<sigma, {magnitude, direction, real?, imag?}> 
    // If complex responses available, use as initial φ
    
    const newPhi = new Map();
    
    // Initialize from previous frame for temporal continuity
    if (this.history.length > 0) {
      const prevFrame = this.history[this.history.length - 1];
      for (const [key, value] of prevFrame) {
        const [prevT, x, y, sigma] = key.split('_').map(parseFloat);
        const newKey = `${t}_${x}_${y}_${sigma}`;
        newPhi.set(newKey, value); // Propagate forward
      }
    }
    
    // Update each (x, y, σ) using gradient descent
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        for (const sigma of this.scales) {
          // Get Sobel evidence at this scale
          const evidence = this.getEvidence(sobelEvidence, x, y, sigma, size);
          
          // Initialize from complex wavelet response if available (φ_init)
          let initialPhi = this.getPhi(t, x, y, sigma);
          if (sobelEvidence instanceof Map) {
            const scaleData = sobelEvidence.get(sigma);
            if (scaleData && scaleData.real !== undefined && scaleData.imag !== undefined) {
              // Use magnitude of complex response as initial φ
              const idx = y * size + x;
              initialPhi = Math.sqrt(scaleData.real[idx]*scaleData.real[idx] + 
                                    scaleData.imag[idx]*scaleData.imag[idx]);
            }
          }
          
          // Current phi value (or use initial from wavelet)
          const currentPhi = initialPhi || this.getPhi(t, x, y, sigma);
          
          // Compute gradient of action w.r.t. phi
          const grad = this.actionGradient(t, x, y, sigma, evidence, size);
          
          // Gradient descent step
          const newValue = currentPhi - learningRate * grad;
          
          // Clamp to [0, 1]
          newPhi.set(`${t}_${x}_${y}_${sigma}`, Math.max(0, Math.min(1, newValue)));
        }
      }
    }
    
    // Store in history
    this.phi = newPhi;
    this.history.push(new Map(newPhi));
    if (this.history.length > 10) {
      this.history.shift(); // Keep last 10 frames
    }
    
    this.frameCount = t;
  }

  /**
   * Gradient of action w.r.t. φ
   */
  actionGradient(t, x, y, sigma, evidence, size) {
    const phi = this.getPhi(t, x, y, sigma);
    
    // Temporal term: ∂/∂φ [0.5 * (∂_t φ)^2] = ∂_t φ * ∂(∂_t φ)/∂φ
    const dtPhi = this.timeDerivative(t, x, y, sigma);
    const temporalGrad = dtPhi; // Simplified
    
    // Spatial term: ∂/∂φ [0.5 * c^2 * |∇φ|^2]
    const gradPhi = this.spatialGradient(t, x, y, sigma, size);
    const spatialGrad = this.c * this.c * gradPhi; // Simplified
    
    // Scale term: ∂/∂φ [0.5 * α^2 * |D_σ φ|^2]
    const dsigmaPhi = this.scaleDerivative(t, x, y, sigma);
    const scaleGrad = this.alpha * this.alpha * dsigmaPhi; // Simplified
    
    // Data term: ∂/∂φ [β * (φ - E)^2] = 2β(φ - E)
    const dataGrad = 2 * this.beta * (phi - evidence);
    
    return temporalGrad + spatialGrad + scaleGrad + dataGrad;
  }

  /**
   * Extract Sobel evidence at position and scale
   */
  getEvidence(sobelEvidence, x, y, sigma, size) {
    // sobelEvidence can be:
    // - Map with scale keys: {magnitude: Float32Array, direction: Float32Array}
    // - Array of edge maps per scale
    // - Single edge map (use for all scales)
    
    if (sobelEvidence instanceof Map) {
      const scaleData = sobelEvidence.get(sigma);
      if (scaleData && scaleData.magnitude) {
        const idx = y * size + x;
        return scaleData.magnitude[idx] || 0;
      }
    } else if (Array.isArray(sobelEvidence)) {
      const sigmaIdx = this.scales.indexOf(sigma);
      if (sigmaIdx >= 0 && sigmaIdx < sobelEvidence.length) {
        const edgeMap = sobelEvidence[sigmaIdx];
        if (edgeMap && edgeMap.magnitude) {
          const idx = y * size + x;
          return edgeMap.magnitude[idx] || 0;
        }
      }
    } else if (sobelEvidence && sobelEvidence.magnitude) {
      // Single edge map, use for all scales
      const idx = y * size + x;
      return sobelEvidence.magnitude[idx] || 0;
    }
    
    return 0;
  }

  /**
   * Extract edge map from regularized field
   * edge_mask_t(x,y) = threshold(∑_σ w(σ) * φ(t,x,y,σ))
   */
  extractEdges(t, size, threshold = 0.3) {
    const edgeMap = new Float32Array(size * size);
    
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        let sum = 0;
        let weightSum = 0;
        
        // Aggregate over scales
        for (let i = 0; i < this.scales.length; i++) {
          const sigma = this.scales[i];
          const w = this.scaleWeights[i];
          const phi = this.getPhi(t, x, y, sigma);
          sum += w * phi;
          weightSum += w;
        }
        
        const avg = weightSum > 0 ? sum / weightSum : 0;
        edgeMap[y * size + x] = avg > threshold ? avg : 0;
      }
    }
    
    return edgeMap;
  }

  /**
   * Get edge trajectories (worldlines)
   * Returns paths of edges across time
   */
  getTrajectories(t, size, threshold = 0.3) {
    const trajectories = [];
    const visited = new Set();
    
    const edgeMap = this.extractEdges(t, size, threshold);
    
    // Find edge seeds
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const idx = y * size + x;
        if (edgeMap[idx] > threshold && !visited.has(idx)) {
          // Trace trajectory forward and backward in time
          const trajectory = this.traceTrajectory(t, x, y, size, threshold, visited);
          if (trajectory.length > 2) {
            trajectories.push(trajectory);
          }
        }
      }
    }
    
    return trajectories;
  }

  /**
   * Trace edge trajectory through time
   */
  traceTrajectory(t, startX, startY, size, threshold, visited) {
    const trajectory = [{t, x: startX, y: startY}];
    visited.add(startY * size + startX);
    
    // Trace forward in time
    let currentX = startX;
    let currentY = startY;
    let currentT = t;
    
    for (let step = 0; step < 10; step++) {
      currentT += 1;
      const nextEdge = this.findNextEdge(currentT, currentX, currentY, size, threshold);
      
      if (nextEdge) {
        trajectory.push(nextEdge);
        currentX = nextEdge.x;
        currentY = nextEdge.y;
        visited.add(currentY * size + currentX);
      } else {
        break; // Edge ended
      }
    }
    
    return trajectory;
  }

  /**
   * Find next edge position in next frame
   */
  findNextEdge(t, x, y, size, threshold) {
    const searchRadius = 3;
    let bestMatch = null;
    let bestScore = 0;
    
    for (let dy = -searchRadius; dy <= searchRadius; dy++) {
      for (let dx = -searchRadius; dx <= searchRadius; dx++) {
        const nx = x + dx;
        const ny = y + dy;
        
        if (nx >= 0 && nx < size && ny >= 0 && ny < size) {
          // Check if edge exists at this position in next frame
          const edgeMap = this.extractEdges(t, size, threshold);
          const idx = ny * size + nx;
          const score = edgeMap[idx];
          
          if (score > threshold && score > bestScore) {
            const distance = Math.sqrt(dx*dx + dy*dy);
            const distancePenalty = 1 / (1 + distance);
            const totalScore = score * distancePenalty;
            
            if (totalScore > bestScore) {
              bestScore = totalScore;
              bestMatch = {t, x: nx, y: ny};
            }
          }
        }
      }
    }
    
    return bestMatch;
  }
}

export { EdgeTracker };

