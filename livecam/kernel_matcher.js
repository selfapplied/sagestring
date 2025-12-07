/**
 * Kernel Matcher - Pattern matching and evolution
 * 
 * Single responsibility: Match kernels against lattices and evolve them
 */

class KernelMatcher {
  /**
   * Compute kernel match at position
   */
  match(kernel, lattice, x, y, size) {
    const kernelLattice = kernel.lattice;
    let match = 0;
    let weight = 0;
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
            const similarity = 1 - Math.abs(lattice[lidx] - kernelLattice[kidx]);
            match += similarity * kernelLattice[kidx];
            weight += kernelLattice[kidx];
          }
        }
      }
    }

    return weight > 0 ? match / weight : 0;
  }

  /**
   * Compute coupling sum for evolution
   */
  coupling(lattice, x, y, size, radius = 3) {
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
   * Evolve lattice using kernel
   */
  evolve(kernel, inputLattice, size) {
    const newLattice = new Float32Array(size * size);

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const idx = y * size + x;
        const match = this.match(kernel, inputLattice, x, y, size);
        const coupling = this.coupling(inputLattice, x, y, size);
        const evolved = kernel.energy * Math.pow(match + coupling, kernel.power);
        newLattice[idx] = Math.max(0, Math.min(1, evolved));
      }
    }

    return newLattice;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { KernelMatcher };
}

