/**
 * Sobel Edge Detection
 * 
 * Single responsibility: Compute Sobel gradients (magnitude and direction) from lattices
 * 
 * Can use θ⋆-based fractal kernel for scale-coherent edge detection
 */

class Sobel {
  constructor(options = {}) {
    this.useThetaStar = options.useThetaStar || false;
    this.thetaStar = options.thetaStar || null;
    this.wavelet = options.wavelet || null; // Fractal Sobel wavelet
    this.lastPhaseMaps = null; // Store phase maps for gain scheduler
  }
  /**
   * Compute Sobel gradients on lattice
   */
  compute(lattice, size) {
    if (!lattice || !size || size <= 0) {
      return { magnitude: new Float32Array(0), direction: new Float32Array(0) };
    }
    
    const magnitude = new Float32Array(size * size);
    const direction = new Float32Array(size * size);
    
    // Sobel kernels
    const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
    const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];
    
    for (let y = 1; y < size - 1; y++) {
      for (let x = 1; x < size - 1; x++) {
        const idx = y * size + x;
        
        let gx = 0;
        let gy = 0;
        
        // Convolve with Sobel kernels
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const kidx = (ky + 1) * 3 + (kx + 1);
            const lidx = (y + ky) * size + (x + kx);
            if (lidx >= 0 && lidx < lattice.length) {
              gx += lattice[lidx] * sobelX[kidx];
              gy += lattice[lidx] * sobelY[kidx];
            }
          }
        }
        
        // Normalize
        gx /= 8;
        gy /= 8;
        
        magnitude[idx] = Math.sqrt(gx * gx + gy * gy);
        direction[idx] = Math.atan2(gy, gx);
      }
    }
    
    // Normalize magnitude to [0, 1]
    let maxMag = 0;
    for (let i = 0; i < magnitude.length; i++) {
      if (magnitude[i] > maxMag) maxMag = magnitude[i];
    }
    if (maxMag > 0) {
      for (let i = 0; i < magnitude.length; i++) {
        magnitude[i] /= maxMag;
      }
    }
    
    return { magnitude, direction };
  }

  /**
   * Multi-scale Sobel (fractal tower)
   * Uses θ⋆-parameterized fractal Sobel wavelet if available
   */
  computeMultiScale(lattice, size, scales) {
    const results = new Map();
    const phaseMaps = [];
    
    // Use fractal Sobel wavelet if available
    if (this.useThetaStar && this.thetaStar && this.wavelet) {
      // Generate scale ladder with phase-matched wavelets
      const ladder = this.wavelet.generateScaleLadder(size, scales);
      
      for (let k = 0; k < scales.length; k++) {
        const sigma = scales[k];
        const wavelet = ladder.wavelets.get(sigma);
        
        // Convolve lattice with wavelet
        const response = this.wavelet.convolve(lattice, size, sigma);
        
        // Extract edges from complex response
        const edges = {
          magnitude: response.magnitude,
          direction: response.phase
        };
        
        results.set(sigma, edges);
        phaseMaps.push(response.phase);
      }
      
      // Store phase maps for gain scheduler
      this.lastPhaseMaps = phaseMaps;
      
      return results;
    } else if (this.useThetaStar && this.thetaStar) {
      // Fallback: use θ⋆ kernel (legacy)
      for (const sigma of scales) {
        const kernel = this.thetaStar.generateKernel(size, sigma);
        const edges = this.convolveWithKernel(lattice, size, kernel);
        results.set(sigma, edges);
      }
      return results;
    } else {
      // Standard multi-scale Sobel
      for (const sigma of scales) {
        const scaledLattice = this.scaleLattice(lattice, size, sigma);
        const scaledSize = Math.floor(size / sigma);
        const scaledEdges = this.compute(scaledLattice, scaledSize);
        const edges = this.upsample(scaledEdges, scaledSize, size);
        results.set(sigma, edges);
      }
      return results;
    }
  }

  /**
   * Convolve lattice with θ⋆ kernel
   */
  convolveWithKernel(lattice, size, kernel) {
    const magnitude = new Float32Array(size * size);
    const direction = new Float32Array(size * size);
    
    const center = size / 2;
    
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        let realSum = 0;
        let imagSum = 0;
        
        // Convolve with kernel
        for (let ky = 0; ky < size; ky++) {
          for (let kx = 0; kx < size; kx++) {
            const dx = kx - center;
            const dy = ky - center;
            const sx = x - dx;
            const sy = y - dy;
            
            if (sx >= 0 && sx < size && sy >= 0 && sy < size) {
              const latticeVal = lattice[sy * size + sx];
              const kernelReal = kernel.real[ky * size + kx];
              const kernelImag = kernel.imag[ky * size + kx];
              
              realSum += latticeVal * kernelReal;
              imagSum += latticeVal * kernelImag;
            }
          }
        }
        
        magnitude[y * size + x] = Math.sqrt(realSum * realSum + imagSum * imagSum);
        direction[y * size + x] = Math.atan2(imagSum, realSum);
      }
    }
    
    // Normalize
    let maxMag = 0;
    for (let i = 0; i < magnitude.length; i++) {
      if (magnitude[i] > maxMag) maxMag = magnitude[i];
    }
    if (maxMag > 0) {
      for (let i = 0; i < magnitude.length; i++) {
        magnitude[i] /= maxMag;
      }
    }
    
    return { magnitude, direction };
  }

  /**
   * Scale lattice (simple downsampling)
   */
  scaleLattice(lattice, size, scale) {
    const newSize = Math.floor(size / scale);
    const scaled = new Float32Array(newSize * newSize);
    
    for (let y = 0; y < newSize; y++) {
      for (let x = 0; x < newSize; x++) {
        const srcX = Math.floor(x * scale);
        const srcY = Math.floor(y * scale);
        const srcIdx = srcY * size + srcX;
        const dstIdx = y * newSize + x;
        scaled[dstIdx] = lattice[srcIdx];
      }
    }
    
    return scaled;
  }

  /**
   * Upsample edges back to original size
   */
  upsample(edges, fromSize, toSize) {
    const magnitude = new Float32Array(toSize * toSize);
    const direction = new Float32Array(toSize * toSize);
    const scale = toSize / fromSize;
    
    for (let y = 0; y < toSize; y++) {
      for (let x = 0; x < toSize; x++) {
        const srcX = Math.floor(x / scale);
        const srcY = Math.floor(y / scale);
        const srcIdx = srcY * fromSize + srcX;
        const dstIdx = y * toSize + x;
        magnitude[dstIdx] = edges.magnitude[srcIdx] || 0;
        direction[dstIdx] = edges.direction[srcIdx] || 0;
      }
    }
    
    return { magnitude, direction };
  }
}

export { Sobel };

