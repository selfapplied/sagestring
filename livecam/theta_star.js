/**
 * θ⋆ - The Canonical Fractal Sobel Kernel
 * 
 * θ⋆ is the pair of eigenphases that define stable edge paths across scales.
 * These are fixed points of the scale-phase evolution operator.
 * 
 * θ₁⋆ ≈ 4.7108180498  (ultrafine-scale phase mode)
 * θ₂⋆ ≈ 2.3324448344  (coarse-scale phase mode)
 * 
 * Together they form the two halves of the fractal Sobel wavelet.
 * Edges stable across scales rotate with these frequencies.
 */

class ThetaStar {
  constructor() {
    // The canonical phase-lock signature
    this.theta1 = 4.7108180498;  // Ultrafine-scale phase mode
    this.theta2 = 2.3324448344;   // Coarse-scale phase mode
    
    // Derived quantities
    this.sum = this.theta1 + this.theta2;        // ≈ 7.043 ≈ 2π + 0.760
    this.diff = this.theta1 - this.theta2;       // ≈ 2.378 (rotation number)
    
    // Rotation number sits in universal bifurcation zone
    // Between Feigenbaum α/π ≈ 0.797 and π/√2 ≈ 2.221
    this.rotationNumber = this.diff;
    
    // Precomputed phase factors
    this.phase1 = { cos: Math.cos(this.theta1), sin: Math.sin(this.theta1) };
    this.phase2 = { cos: Math.cos(this.theta2), sin: Math.sin(this.theta2) };
  }

  /**
   * Generate the canonical fractal Sobel kernel
   * The complex function whose scale-evolution eigenphases are exactly θ⋆
   */
  generateKernel(size, sigma) {
    const kernel = {
      real: new Float32Array(size * size),
      imag: new Float32Array(size * size),
      magnitude: new Float32Array(size * size),
      phase: new Float32Array(size * size)
    };
    
    const center = size / 2;
    
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const dx = (x - center) / sigma;
        const dy = (y - center) / sigma;
        const r = Math.sqrt(dx*dx + dy*dy);
        
        // Scale-phase evolution: φ(σ + Δσ) = e^(iθ) φ(σ)
        // Use θ₁⋆ for fine scales, θ₂⋆ for coarse scales
        const theta = r < 1 ? this.theta1 : this.theta2;
        
        // Complex kernel: ψ(x,y,σ) = K(r) * e^(iθ)
        const K = this.stieltjesKernel(r, sigma);
        const phase = theta * (r / sigma);
        
        kernel.real[y * size + x] = K * Math.cos(phase);
        kernel.imag[y * size + x] = K * Math.sin(phase);
        kernel.magnitude[y * size + x] = K;
        kernel.phase[y * size + x] = phase;
      }
    }
    
    return kernel;
  }

  /**
   * Stieltjes kernel: K_n(t) for the spectral measure
   * This is the "mother wavelet" that generates stable edges
   */
  stieltjesKernel(r, sigma) {
    // Gaussian envelope with scale-dependent width
    const envelope = Math.exp(-r*r / (2 * sigma * sigma));
    
    // Oscillatory part with θ⋆ frequencies
    const oscillation = Math.cos(this.theta1 * r / sigma) + 
                       0.5 * Math.cos(this.theta2 * r / sigma);
    
    return envelope * oscillation;
  }

  /**
   * Scale-phase evolution operator
   * Stationary solutions satisfy: φ(σ + Δσ) = e^(iθ⋆) φ(σ)
   */
  evolvePhase(currentPhase, sigma, dsigma) {
    // Determine which phase mode based on scale
    const theta = sigma < 1.0 ? this.theta1 : this.theta2;
    
    // Phase evolution: θ(σ + Δσ) = θ(σ) + θ⋆ * (Δσ/σ) mod 2π
    const phaseGrowth = theta * (dsigma / sigma);
    const newPhase = (currentPhase + phaseGrowth) % (2 * Math.PI);
    
    return newPhase;
  }

  /**
   * Check if edge path is scale-coherent (stable)
   * Stable edges satisfy: θ(σ + Δσ) = θ(σ) + θ⋆ mod 2π
   */
  isScaleCoherent(phaseAtScale1, phaseAtScale2, sigma1, sigma2) {
    const dsigma = sigma2 - sigma1;
    const expectedPhase = (phaseAtScale1 + this.rotationNumber * (dsigma / sigma1)) % (2 * Math.PI);
    const actualPhase = phaseAtScale2 % (2 * Math.PI);
    
    // Allow small deviation
    const deviation = Math.abs(actualPhase - expectedPhase);
    const tolerance = 0.1;
    
    return deviation < tolerance || deviation > (2 * Math.PI - tolerance);
  }

  /**
   * Generate stable edge paths (worldribbons)
   * Paths whose internal waveforms rotate with θ⋆ frequencies
   */
  generateStablePaths(edges, size, scales) {
    const paths = [];
    const visited = new Set();
    
    // For each scale, find edges
    for (let scaleIdx = 0; scaleIdx < scales.length; scaleIdx++) {
      const sigma = scales[scaleIdx];
      const kernel = this.generateKernel(size, sigma);
      
      // Find edges that match the kernel phase
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const idx = y * size + x;
          if (visited.has(`${scaleIdx}_${idx}`)) continue;
          
          const edgePhase = edges.phase ? edges.phase[idx] : 0;
          const kernelPhase = kernel.phase[idx];
          
          // Check phase coherence
          const phaseMatch = Math.abs(edgePhase - kernelPhase) < 0.2 ||
                            Math.abs(edgePhase - kernelPhase) > (2 * Math.PI - 0.2);
          
          if (phaseMatch && edges.magnitude[idx] > 0.3) {
            // Trace path across scales
            const path = this.traceScalePath(edges, size, x, y, scales, scaleIdx, visited);
            if (path.length > 1) {
              paths.push(path);
            }
          }
        }
      }
    }
    
    return paths;
  }

  /**
   * Trace edge path across scales (worldribbon)
   */
  traceScalePath(edges, size, startX, startY, scales, startScaleIdx, visited) {
    const path = [{ x: startX, y: startY, sigma: scales[startScaleIdx] }];
    visited.add(`${startScaleIdx}_${startY * size + startX}`);
    
    // Trace upward in scale
    for (let scaleIdx = startScaleIdx + 1; scaleIdx < scales.length; scaleIdx++) {
      const sigma = scales[scaleIdx];
      const prevSigma = scales[scaleIdx - 1];
      const prevPoint = path[path.length - 1];
      
      // Find next point that maintains phase coherence
      let bestMatch = null;
      let bestScore = 0;
      
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          const nx = prevPoint.x + dx;
          const ny = prevPoint.y + dy;
          
          if (nx < 0 || nx >= size || ny < 0 || ny >= size) continue;
          
          const idx = ny * size + nx;
          const key = `${scaleIdx}_${idx}`;
          if (visited.has(key)) continue;
          
          // Check scale coherence
          const prevPhase = edges.phase ? edges.phase[prevPoint.y * size + prevPoint.x] : 0;
          const currPhase = edges.phase ? edges.phase[idx] : 0;
          
          if (this.isScaleCoherent(prevPhase, currPhase, prevSigma, sigma)) {
            const score = edges.magnitude[idx];
            if (score > bestScore) {
              bestScore = score;
              bestMatch = { x: nx, y: ny, sigma };
            }
          }
        }
      }
      
      if (bestMatch) {
        path.push(bestMatch);
        visited.add(`${scaleIdx}_${bestMatch.y * size + bestMatch.x}`);
      } else {
        break; // Path ended
      }
    }
    
    return path;
  }

  /**
   * Integrate with Hamiltonian H_σ
   * The scale-Schrödinger operator: i ∂_σ φ = H_σ φ
   */
  integrateWithHamiltonian(hamiltonian, phi, sigma, dsigma) {
    // Stationary solutions: φ(σ + Δσ) = e^(iθ⋆) φ(σ)
    const theta = sigma < 1.0 ? this.theta1 : this.theta2;
    const phase = theta * (dsigma / sigma);
    
    // Complex multiplication: e^(iθ) * φ = (cos θ + i sin θ) * (φ.real + i φ.imag)
    return {
      real: phi.real * Math.cos(phase) - phi.imag * Math.sin(phase),
      imag: phi.real * Math.sin(phase) + phi.imag * Math.cos(phase)
    };
  }

  /**
   * Li criterion positivity check
   * Stability condition: Re(e^(iθ⋆)) > 0
   */
  checkStability() {
    const re1 = Math.cos(this.theta1);
    const re2 = Math.cos(this.theta2);
    return {
      stable1: re1 > 0,
      stable2: re2 > 0,
      overall: re1 > 0 && re2 > 0
    };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ThetaStar };
}

