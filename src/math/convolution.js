/**
 * Convolution - Generalized kernel operations
 * 
 * Single responsibility: Apply kernels to lattices with configurable expressions
 */

class Convolution {
  constructor(options = {}) {
    // Similarity function: (latticeValue, kernelValue) -> similarity
    this.similarity = options.similarity || ((a, b) => 1 - Math.abs(a - b));
    
    // Aggregation function: (similarities, weights) -> match score
    this.aggregate = options.aggregate || ((sim, w) => w > 0 ? sim / w : 0);
    
    // Coupling function: (lattice, x, y, size, radius) -> coupling value
    this.couplingFn = options.coupling || this.defaultCoupling;
    
    // Evolution function: (match, coupling, kernel) -> evolved value
    this.evolveFn = options.evolve || this.defaultEvolve;
  }

  /**
   * Default coupling: distance-weighted neighborhood average
   */
  defaultCoupling(lattice, x, y, size, radius = 3) {
    let coupling = 0;

    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        if (dx === 0 && dy === 0) continue;

        const nx = x + dx;
        const ny = y + dy;

        if (nx >= 0 && nx < size && ny >= 0 && ny < size) {
          const distance = Math.sqrt(dx*dx + dy*dy);
          const weight = 1 / (1 + distance);
          coupling += lattice[ny * size + nx] * weight;
        }
      }
    }

    return coupling * 0.1;
  }

  /**
   * Default evolution: power-law with energy
   */
  defaultEvolve(match, coupling, kernel) {
    const energy = kernel.energy || 1.0;
    const power = kernel.power || 2.0;
    return energy * Math.pow(match + coupling, power);
  }

  /**
   * Convolve kernel over lattice at position
   */
  convolve(kernel, lattice, x, y, size) {
    const kernelLattice = kernel.lattice;
    let similaritySum = 0;
    let weightSum = 0;
    const kernelSize = Math.min(size, 32);
    const halfKernel = kernelSize / 2;

    for (let ky = -halfKernel; ky <= halfKernel; ky++) {
      for (let kx = -halfKernel; kx <= halfKernel; kx++) {
        const lx = x + kx;
        const ly = y + ky;

        if (lx >= 0 && lx < size && ly >= 0 && ly < size) {
          const lidx = ly * size + lx;
          const kidx = (ky + halfKernel) * kernelSize + (kx + halfKernel);

          if (kidx < kernelLattice.length) {
            const latticeValue = lattice[lidx];
            const kernelValue = kernelLattice[kidx];
            const sim = this.similarity(latticeValue, kernelValue);
            similaritySum += sim * kernelValue;
            weightSum += kernelValue;
          }
        }
      }
    }

    return this.aggregate(similaritySum, weightSum);
  }

  /**
   * Compute coupling at position
   */
  coupling(lattice, x, y, size, radius = 3) {
    return this.couplingFn(lattice, x, y, size, radius);
  }

  /**
   * Evolve lattice using kernel
   */
  evolve(kernel, inputLattice, size) {
    const newLattice = new Float32Array(size * size);

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const idx = y * size + x;
        const match = this.convolve(kernel, inputLattice, x, y, size);
        const coupling = this.coupling(inputLattice, x, y, size);
        const evolved = this.evolveFn(match, coupling, kernel);
        newLattice[idx] = Math.max(0, Math.min(1, evolved));
      }
    }

    return newLattice;
  }

  /**
   * Fractal convolution over scales
   * Integrates over scale dimension: ∫ dμ(σ) f * g_σ
   */
  fractalConvolve(f, gFamily, sigmaMin, sigmaMax, zeta = 0) {
    const result = new Float32Array(f.length);
    const dsigma = 0.1;
    
    for (let sigma = sigmaMin; sigma < sigmaMax; sigma += dsigma) {
      const g_sigma = gFamily(sigma); // Scale-indexed kernel family
      const dmu = Math.pow(sigma, -1 - zeta) * dsigma; // Scale measure
      
      // Convolve at this scale
      const convolved = this.convolve1D(f, g_sigma);
      
      // Accumulate with scale measure
      for (let i = 0; i < result.length; i++) {
        result[i] += convolved[i] * dmu;
      }
    }
    
    return result;
  }

  /**
   * 1D convolution helper
   */
  convolve1D(signal, kernel) {
    const result = new Float32Array(signal.length);
    const halfK = Math.floor(kernel.length / 2);
    
    for (let i = 0; i < signal.length; i++) {
      let sum = 0;
      for (let k = 0; k < kernel.length; k++) {
        const idx = i + k - halfK;
        if (idx >= 0 && idx < signal.length) {
          sum += signal[idx] * kernel[k];
        }
      }
      result[i] = sum;
    }
    
    return result;
  }

  /**
   * Apply custom expression: f(lattice, kernel, x, y, size) -> value
   */
  apply(lattice, kernel, x, y, size, expression) {
    const match = this.convolve(kernel, lattice, x, y, size);
    const coupling = this.coupling(lattice, x, y, size);
    const neighbors = this.getNeighbors(lattice, x, y, size);
    
    return expression({
      match,
      coupling,
      neighbors,
      kernel,
      x,
      y,
      size,
      lattice
    });
  }

  /**
   * Get neighbor values around position
   */
  getNeighbors(lattice, x, y, size, radius = 1) {
    const neighbors = [];
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        if (dx === 0 && dy === 0) continue;
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < size && ny >= 0 && ny < size) {
          neighbors.push({
            x: nx,
            y: ny,
            value: lattice[ny * size + nx],
            distance: Math.sqrt(dx*dx + dy*dy)
          });
        }
      }
    }
    return neighbors;
  }
}

/**
 * Predefined similarity functions
 */
Convolution.similarities = {
  // Default: inverse distance
  inverse: (a, b) => 1 - Math.abs(a - b),
  
  // Dot product style
  dot: (a, b) => a * b,
  
  // Cosine similarity
  cosine: (a, b) => (a * b) / (Math.sqrt(a*a) * Math.sqrt(b*b) + 1e-6),
  
  // Gaussian similarity
  gaussian: (a, b, sigma = 0.1) => Math.exp(-Math.pow(a - b, 2) / (2 * sigma * sigma)),
  
  // Exact match
  exact: (a, b) => a === b ? 1 : 0
};

/**
 * Predefined evolution functions
 */
Convolution.evolutions = {
  // Default: power-law
  power: (match, coupling, kernel) => {
    const energy = kernel.energy || 1.0;
    const power = kernel.power || 2.0;
    return energy * Math.pow(match + coupling, power);
  },
  
  // Linear
  linear: (match, coupling, kernel) => {
    const energy = kernel.energy || 1.0;
    return energy * (match + coupling);
  },
  
  // Exponential
  exponential: (match, coupling, kernel) => {
    const energy = kernel.energy || 1.0;
    return energy * Math.exp(match + coupling);
  },
  
  // Threshold
  threshold: (match, coupling, kernel) => {
    const threshold = kernel.threshold || 0.5;
    return (match + coupling) > threshold ? 1 : 0;
  },
  
  // Sigmoid
  sigmoid: (match, coupling, kernel) => {
    const energy = kernel.energy || 1.0;
    const k = kernel.k || 1.0;
    return energy / (1 + Math.exp(-k * (match + coupling)));
  }
};

export { Convolution };

