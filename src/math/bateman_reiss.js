/**
 * Bateman-Reiss Characteristic Flow
 * 
 * Single responsibility: Extract self-boundary curves via characteristic ODE integration
 * 
 * The Bateman-Reiss flow traces curves along gradient fields:
 *   dx/dt = u_x(x,y,t)
 *   dy/dt = u_y(x,y,t)
 * 
 * Self-boundaries are closed characteristic curves that maintain coherence.
 */

class BatemanReiss {
  constructor(options = {}) {
    this.sigma = options.sigma || 2.0; // Gaussian blur radius
    this.seedCount = options.seedCount || 200; // Number of seed points
    this.maxSteps = options.maxSteps || 1000; // Max integration steps
    this.stepSize = options.stepSize || 0.1; // RK4 step size
    this.closureThreshold = options.closureThreshold || 5.0; // Distance to consider closed
    this.minLoopLength = options.minLoopLength || 10; // Minimum points for valid loop
  }

  /**
   * Apply Gaussian blur to smooth field
   * u(x,y) = G_σ * I(x,y)
   */
  gaussianBlur(lattice, size, sigma) {
    if (sigma <= 0) return lattice;
    
    const result = new Float32Array(lattice.length);
    const kernelSize = Math.ceil(3 * sigma);
    const kernel = this.createGaussianKernel(sigma, kernelSize);
    
    // Horizontal pass
    const temp = new Float32Array(lattice.length);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        let sum = 0;
        let weight = 0;
        for (let k = -kernelSize; k <= kernelSize; k++) {
          const nx = Math.max(0, Math.min(size - 1, x + k));
          const w = kernel[Math.abs(k)];
          sum += lattice[y * size + nx] * w;
          weight += w;
        }
        temp[y * size + x] = weight > 0 ? sum / weight : lattice[y * size + x];
      }
    }
    
    // Vertical pass
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        let sum = 0;
        let weight = 0;
        for (let k = -kernelSize; k <= kernelSize; k++) {
          const ny = Math.max(0, Math.min(size - 1, y + k));
          const w = kernel[Math.abs(k)];
          sum += temp[ny * size + x] * w;
          weight += w;
        }
        result[y * size + x] = weight > 0 ? sum / weight : temp[y * size + x];
      }
    }
    
    return result;
  }

  /**
   * Create 1D Gaussian kernel
   */
  createGaussianKernel(sigma, size) {
    const kernel = new Float32Array(size + 1);
    const twoSigmaSq = 2 * sigma * sigma;
    let sum = 0;
    
    for (let i = 0; i <= size; i++) {
      kernel[i] = Math.exp(-(i * i) / twoSigmaSq);
      sum += kernel[i];
    }
    
    // Normalize
    for (let i = 0; i <= size; i++) {
      kernel[i] /= sum;
    }
    
    return kernel;
  }

  /**
   * Compute gradient field (u_x, u_y) from smoothed field
   */
  computeGradient(field, size) {
    const ux = new Float32Array(size * size);
    const uy = new Float32Array(size * size);
    
    // Central differences for interior
    for (let y = 1; y < size - 1; y++) {
      for (let x = 1; x < size - 1; x++) {
        const idx = y * size + x;
        ux[idx] = (field[y * size + (x + 1)] - field[y * size + (x - 1)]) / 2;
        uy[idx] = (field[(y + 1) * size + x] - field[(y - 1) * size + x]) / 2;
      }
    }
    
    // Boundary: use forward/backward differences
    // Top and bottom edges
    for (let x = 0; x < size; x++) {
      const top = x;
      const bottom = (size - 1) * size + x;
      if (size > 1) {
        uy[top] = field[size + x] - field[top];
        uy[bottom] = field[bottom] - field[(size - 2) * size + x];
      } else {
        uy[top] = 0;
        uy[bottom] = 0;
      }
      // Also compute ux for boundary points
      if (x > 0 && x < size - 1) {
        ux[top] = (field[x + 1] - field[x - 1]) / 2;
        ux[bottom] = (field[(size - 1) * size + x + 1] - field[(size - 1) * size + x - 1]) / 2;
      } else {
        ux[top] = x < size - 1 ? field[x + 1] - field[x] : field[x] - field[x - 1];
        ux[bottom] = x < size - 1 ? field[(size - 1) * size + x + 1] - field[(size - 1) * size + x] : 
                                    field[(size - 1) * size + x] - field[(size - 1) * size + x - 1];
      }
    }
    
    // Left and right edges
    for (let y = 0; y < size; y++) {
      const left = y * size;
      const right = y * size + (size - 1);
      if (size > 1) {
        ux[left] = field[y * size + 1] - field[left];
        ux[right] = field[right] - field[y * size + (size - 2)];
      } else {
        ux[left] = 0;
        ux[right] = 0;
      }
      // Also compute uy for boundary points (if not already set)
      if (y > 0 && y < size - 1) {
        if (uy[left] === 0) uy[left] = (field[(y + 1) * size] - field[(y - 1) * size]) / 2;
        if (uy[right] === 0) uy[right] = (field[(y + 1) * size + size - 1] - field[(y - 1) * size + size - 1]) / 2;
      } else {
        if (uy[left] === 0) uy[left] = y < size - 1 ? field[(y + 1) * size] - field[left] : field[left] - field[(y - 1) * size];
        if (uy[right] === 0) uy[right] = y < size - 1 ? field[(y + 1) * size + size - 1] - field[right] : 
                                                          field[right] - field[(y - 1) * size + size - 1];
      }
    }
    
    return { ux, uy };
  }

  /**
   * Interpolate gradient at continuous position
   */
  interpolateGradient(ux, uy, size, x, y) {
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const x1 = Math.min(size - 1, x0 + 1);
    const y1 = Math.min(size - 1, y0 + 1);
    
    const fx = x - x0;
    const fy = y - y0;
    
    // Bilinear interpolation
    const gx00 = ux[y0 * size + x0] || 0;
    const gx01 = ux[y0 * size + x1] || 0;
    const gx10 = ux[y1 * size + x0] || 0;
    const gx11 = ux[y1 * size + x1] || 0;
    
    const gy00 = uy[y0 * size + x0] || 0;
    const gy01 = uy[y0 * size + x1] || 0;
    const gy10 = uy[y1 * size + x0] || 0;
    const gy11 = uy[y1 * size + x1] || 0;
    
    const gx = (1 - fx) * (1 - fy) * gx00 + fx * (1 - fy) * gx01 +
               (1 - fx) * fy * gx10 + fx * fy * gx11;
    
    const gy = (1 - fx) * (1 - fy) * gy00 + fx * (1 - fy) * gy01 +
               (1 - fx) * fy * gy10 + fx * fy * gy11;
    
    return { gx, gy };
  }

  /**
   * RK4 integration step
   * dx/dt = u_x(x,y), dy/dt = u_y(x,y)
   */
  rk4Step(ux, uy, size, x, y, dt) {
    const k1 = this.interpolateGradient(ux, uy, size, x, y);
    const k2 = this.interpolateGradient(ux, uy, size, x + dt * k1.gx / 2, y + dt * k1.gy / 2);
    const k3 = this.interpolateGradient(ux, uy, size, x + dt * k2.gx / 2, y + dt * k2.gy / 2);
    const k4 = this.interpolateGradient(ux, uy, size, x + dt * k3.gx, y + dt * k3.gy);
    
    return {
      x: x + (dt / 6) * (k1.gx + 2 * k2.gx + 2 * k3.gx + k4.gx),
      y: y + (dt / 6) * (k1.gy + 2 * k2.gy + 2 * k3.gy + k4.gy)
    };
  }

  /**
   * Integrate characteristic curve from seed point
   */
  integrateCurve(ux, uy, size, seedX, seedY) {
    const curve = [{ x: seedX, y: seedY }];
    let x = seedX;
    let y = seedY;
    
    for (let step = 0; step < this.maxSteps; step++) {
      const next = this.rk4Step(ux, uy, size, x, y, this.stepSize);
      
      // Check bounds
      if (next.x < 0 || next.x >= size || next.y < 0 || next.y >= size) {
        break;
      }
      
      // Check for closure (return to start)
      const dx = next.x - seedX;
      const dy = next.y - seedY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (step > this.minLoopLength && dist < this.closureThreshold) {
        curve.push({ x: seedX, y: seedY });
        return { curve, closed: true };
      }
      
      // Check for stagnation
      const dxStep = next.x - x;
      const dyStep = next.y - y;
      const stepDist = Math.sqrt(dxStep * dxStep + dyStep * dyStep);
      if (stepDist < 0.001) {
        break;
      }
      
      curve.push({ x: next.x, y: next.y });
      x = next.x;
      y = next.y;
    }
    
    return { curve, closed: false };
  }

  /**
   * Generate seed points (distributed across field)
   */
  generateSeeds(size) {
    const seeds = [];
    const grid = Math.ceil(Math.sqrt(this.seedCount));
    const spacing = size / (grid + 1);
    
    for (let i = 1; i <= grid; i++) {
      for (let j = 1; j <= grid; j++) {
        const x = i * spacing;
        const y = j * spacing;
        seeds.push({ x, y });
      }
    }
    
    return seeds;
  }

  /**
   * Extract self-boundaries from lattice
   * Main entry point: converts intensity to field, computes gradients, integrates curves
   */
  extractBoundaries(lattice, size) {
    // Step 1: Smooth field with Gaussian blur
    const field = this.gaussianBlur(lattice, size, this.sigma);
    
    // Step 2: Compute gradient field
    const { ux, uy } = this.computeGradient(field, size);
    
    // Step 3: Generate seed points
    const seeds = this.generateSeeds(size);
    
    // Step 4: Integrate characteristic curves
    const boundaries = [];
    for (const seed of seeds) {
      const { curve, closed } = this.integrateCurve(ux, uy, size, seed.x, seed.y);
      if (closed && curve.length >= this.minLoopLength) {
        boundaries.push(curve);
      }
    }
    
    return {
      boundaries,
      field,
      gradient: { ux, uy }
    };
  }
}

export { BatemanReiss };

