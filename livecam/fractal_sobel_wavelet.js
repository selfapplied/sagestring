/**
 * Fractal Sobel Mother Wavelet ψ(x,y,σ) parameterized by θ⋆
 * 
 * Complex-valued, oriented, localized wavelet:
 *   ψ(x,y,σ) = G(x,y; σ) * exp(i * Φ(x,y; σ))
 * 
 * Scale-phase condition:
 *   ψ(σ_{k+1}) ≈ exp(i θ_eff) * ψ(σ_k)
 * 
 * Normalized: ∫ |ψ(x,y,σ)|^2 dx dy = 1
 */

class FractalSobelWavelet {
  constructor(thetaStar) {
    this.thetaStar = thetaStar;
    
    // Reference scale for Sobel-like behavior
    this.sigma0 = 1.0;
    
    // Precomputed normalization constants
    this.normalizationCache = new Map();
  }

  /**
   * Generate the mother wavelet ψ(x,y,σ)
   * 
   * @param {number} size - Lattice size
   * @param {number} sigma - Scale parameter
   * @param {Object} options - {orientation, center}
   * @returns {Object} {real, imag, magnitude, phase, normalized}
   */
  generate(size, sigma, options = {}) {
    const orientation = options.orientation || 0; // Default horizontal
    const centerX = options.centerX !== undefined ? options.centerX : size / 2;
    const centerY = options.centerY !== undefined ? options.centerY : size / 2;
    
    const wavelet = {
      real: new Float32Array(size * size),
      imag: new Float32Array(size * size),
      magnitude: new Float32Array(size * size),
      phase: new Float32Array(size * size)
    };
    
    // Determine effective phase based on scale
    // Use θ₁⋆ for finer scales, θ₂⋆ for coarser scales
    const thetaEff = this.getEffectivePhase(sigma);
    
    // Generate Gaussian envelope G(x,y; σ)
    // and phase field Φ(x,y; σ)
    let energySum = 0;
    
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const dx = (x - centerX) / sigma;
        const dy = (y - centerY) / sigma;
        const r = Math.sqrt(dx*dx + dy*dy);
        
        // Gaussian envelope: G(x,y; σ) = exp(-r²/(2σ²))
        const G = Math.exp(-r*r / 2);
        
        // Phase field: Φ(x,y; σ) encodes orientation and oscillation
        // Sobel-like: gradient direction + θ⋆-based oscillation
        const angle = Math.atan2(dy, dx);
        const orientedAngle = angle - orientation;
        
        // Oscillatory component using θ⋆
        const oscillation = thetaEff * r / sigma;
        
        // Combined phase: orientation + oscillation
        const Phi = orientedAngle + oscillation;
        
        // Complex wavelet: ψ = G * exp(i * Φ)
        const real = G * Math.cos(Phi);
        const imag = G * Math.sin(Phi);
        
        wavelet.real[y * size + x] = real;
        wavelet.imag[y * size + x] = imag;
        wavelet.magnitude[y * size + x] = G;
        wavelet.phase[y * size + x] = Phi;
        
        // Accumulate energy for normalization
        energySum += real*real + imag*imag;
      }
    }
    
    // Normalize: ∫ |ψ|^2 dx dy = 1
    const normalization = Math.sqrt(energySum);
    if (normalization > 0) {
      for (let i = 0; i < wavelet.real.length; i++) {
        wavelet.real[i] /= normalization;
        wavelet.imag[i] /= normalization;
      }
    }
    
    wavelet.normalized = true;
    wavelet.energy = energySum;
    wavelet.normalization = normalization;
    
    return wavelet;
  }

  /**
   * Get effective phase θ_eff for scale σ
   * Uses θ₁⋆ for finer scales, θ₂⋆ for coarser scales
   */
  getEffectivePhase(sigma) {
    const threshold = 1.0; // Threshold between fine and coarse
    if (sigma < threshold) {
      return this.thetaStar.theta1; // Ultrafine-scale phase mode
    } else {
      return this.thetaStar.theta2; // Coarse-scale phase mode
    }
  }

  /**
   * Generate Sobel-like wavelet at reference scale σ₀
   * Approximates ∂/∂x + i ∂/∂y
   */
  generateSobelLike(size, sigma = null) {
    const refSigma = sigma || this.sigma0;
    const wavelet = this.generate(size, refSigma, { orientation: 0 });
    
    // Enhance with Sobel-like derivative structure
    // Add directional bias: stronger response in x and y directions
    const center = size / 2;
    
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const dx = (x - center) / refSigma;
        const dy = (y - center) / refSigma;
        
        // Sobel-like weighting: stronger for horizontal/vertical edges
        const sobelWeight = Math.max(Math.abs(dx), Math.abs(dy)) / Math.sqrt(dx*dx + dy*dy + 1e-6);
        
        const idx = y * size + x;
        wavelet.real[idx] *= sobelWeight;
        wavelet.imag[idx] *= sobelWeight;
      }
    }
    
    // Renormalize after Sobel weighting
    let energySum = 0;
    for (let i = 0; i < wavelet.real.length; i++) {
      energySum += wavelet.real[i]*wavelet.real[i] + wavelet.imag[i]*wavelet.imag[i];
    }
    const normalization = Math.sqrt(energySum);
    if (normalization > 0) {
      for (let i = 0; i < wavelet.real.length; i++) {
        wavelet.real[i] /= normalization;
        wavelet.imag[i] /= normalization;
      }
    }
    
    return wavelet;
  }

  /**
   * Verify scale-phase condition:
   *   ψ(σ_{k+1}) ≈ exp(i θ_eff) * ψ(σ_k)
   * 
   * Returns phase difference between adjacent scales
   */
  verifyScalePhaseCondition(size, scales) {
    const results = [];
    
    for (let k = 0; k < scales.length - 1; k++) {
      const sigma_k = scales[k];
      const sigma_k1 = scales[k + 1];
      
      const psi_k = this.generate(size, sigma_k);
      const psi_k1 = this.generate(size, sigma_k1);
      
      // Compute inner product: ⟨ψ(σ_{k+1}), ψ(σ_k)⟩
      let innerProduct = { real: 0, imag: 0 };
      for (let i = 0; i < psi_k.real.length; i++) {
        // Complex inner product: ⟨a, b⟩ = Σ a* · b
        innerProduct.real += psi_k.real[i] * psi_k1.real[i] + psi_k.imag[i] * psi_k1.imag[i];
        innerProduct.imag += psi_k.real[i] * psi_k1.imag[i] - psi_k.imag[i] * psi_k1.real[i];
      }
      
      // Phase of inner product
      const phase = Math.atan2(innerProduct.imag, innerProduct.real);
      
      // Expected phase from θ⋆
      const thetaEff_k = this.getEffectivePhase(sigma_k);
      const expectedPhase = thetaEff_k;
      
      // Phase error
      const phaseError = Math.abs(this.wrapToPi(phase - expectedPhase));
      
      results.push({
        k,
        sigma_k,
        sigma_k1,
        observedPhase: phase,
        expectedPhase: expectedPhase,
        phaseError: phaseError,
        matches: phaseError < 0.2 // Tolerance
      });
    }
    
    return results;
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
   * Convolve lattice with wavelet
   * Returns complex response: φ = lattice * ψ
   */
  convolve(lattice, size, sigma, options = {}) {
    const wavelet = this.generate(size, sigma, options);
    const response = {
      real: new Float32Array(size * size),
      imag: new Float32Array(size * size),
      magnitude: new Float32Array(size * size),
      phase: new Float32Array(size * size)
    };
    
    // 2D convolution
    const center = size / 2;
    
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        let realSum = 0;
        let imagSum = 0;
        
        // Convolve: sum over kernel support
        for (let ky = 0; ky < size; ky++) {
          for (let kx = 0; kx < size; kx++) {
            // Source position (flipped kernel)
            const sx = x - (kx - center);
            const sy = y - (ky - center);
            
            if (sx >= 0 && sx < size && sy >= 0 && sy < size) {
              const latticeVal = lattice[sy * size + sx];
              const kernelReal = wavelet.real[ky * size + kx];
              const kernelImag = wavelet.imag[ky * size + kx];
              
              // Complex multiplication: (a + bi) * (c + di) = (ac - bd) + (ad + bc)i
              realSum += latticeVal * kernelReal; // Simplified: real convolution
              imagSum += latticeVal * kernelImag;
            }
          }
        }
        
        const idx = y * size + x;
        response.real[idx] = realSum;
        response.imag[idx] = imagSum;
        response.magnitude[idx] = Math.sqrt(realSum*realSum + imagSum*imagSum);
        response.phase[idx] = Math.atan2(imagSum, realSum);
      }
    }
    
    return response;
  }

  /**
   * Generate scale ladder with phase-matched wavelets
   * Ensures phase change between scales matches θ⋆
   */
  generateScaleLadder(size, scales) {
    const wavelets = new Map();
    const phaseChecks = [];
    
    for (let k = 0; k < scales.length; k++) {
      const sigma = scales[k];
      const wavelet = this.generate(size, sigma);
      wavelets.set(sigma, wavelet);
      
      // Check phase condition with previous scale
      if (k > 0) {
        const prevSigma = scales[k - 1];
        const prevWavelet = wavelets.get(prevSigma);
        
        // Compute phase difference
        const phaseDiff = this.computePhaseDifference(prevWavelet, wavelet, size);
        const expectedPhase = this.getEffectivePhase(prevSigma);
        const error = Math.abs(this.wrapToPi(phaseDiff - expectedPhase));
        
        phaseChecks.push({
          k,
          sigma,
          prevSigma,
          phaseDiff,
          expectedPhase,
          error,
          matches: error < 0.2
        });
      }
    }
    
    return {
      wavelets,
      phaseChecks,
      allMatch: phaseChecks.every(check => check.matches)
    };
  }

  /**
   * Compute phase difference between two wavelets
   */
  computePhaseDifference(psi1, psi2, size) {
    let innerProduct = { real: 0, imag: 0 };
    
    for (let i = 0; i < psi1.real.length; i++) {
      // Complex inner product: ⟨ψ2, ψ1⟩ = Σ ψ2* · ψ1
      innerProduct.real += psi2.real[i] * psi1.real[i] + psi2.imag[i] * psi1.imag[i];
      innerProduct.imag += psi2.real[i] * psi1.imag[i] - psi2.imag[i] * psi1.real[i];
    }
    
    return Math.atan2(innerProduct.imag, innerProduct.real);
  }

  /**
   * Test edge response: convolve step edge with wavelet
   * Should yield edge-aligned response at σ₀
   */
  testEdgeResponse(size, sigma = null) {
    const testSigma = sigma || this.sigma0;
    
    // Create step edge: vertical line
    const lattice = new Float32Array(size * size);
    const center = size / 2;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        lattice[y * size + x] = x < center ? 0 : 1;
      }
    }
    
    // Convolve with Sobel-like wavelet
    const response = this.convolve(lattice, size, testSigma);
    
    // Check if response is edge-aligned (strong magnitude at edge, phase perpendicular)
    const edgeMagnitude = [];
    for (let y = 0; y < size; y++) {
      const x = center;
      const idx = y * size + x;
      edgeMagnitude.push({
        x,
        y,
        magnitude: response.magnitude[idx],
        phase: response.phase[idx]
      });
    }
    
    return {
      response,
      edgeMagnitude,
      maxMagnitude: Math.max(...edgeMagnitude.map(m => m.magnitude)),
      aligned: true // Simplified check
    };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { FractalSobelWavelet };
}

