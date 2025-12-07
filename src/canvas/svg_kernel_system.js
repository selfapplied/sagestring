/**
 * SVG Kernel System - Main orchestrator
 * 
 * Single responsibility: Coordinate parsing, rasterization, matching, and rendering
 */

import { SVGParser } from '../dom/svg_parser.js';
import { LatticeOps } from './lattice.js';
import { Convolution } from '../math/convolution.js';
import { LatticeRenderer } from '../math/renderer.js';

class SVGKernelSystem {
  constructor(options = {}) {
    this.kernels = new Map();
    this.lattices = new Map();
    
    this.parser = new SVGParser();
    this.latticeOps = new LatticeOps();
    this.convolution = new Convolution();
    this.renderer = new LatticeRenderer();

    this.defaults = {
      latticeSize: 256,
      boundary: 'wrap',
      scaleInvariance: true,
      power: 2.0,
      tolerance: 0.1,
      energy: 1.0
    };
  }

  /**
   * Parse and register kernel from SVG
   */
  parseKernel(svgText) {
    const kernels = this.parser.parseKernel(svgText);
    for (const kernel of kernels) {
      this.kernels.set(kernel.id, kernel);
      this.discretizeKernel(kernel);
    }
    return kernels;
  }

  /**
   * Discretize kernel shape to lattice
   */
  discretizeKernel(kernel) {
    if (!kernel.shape || !kernel.discrete) return null;

    const latticeSize = kernel.discrete.lattice.size;
    const lattice = new Float32Array(latticeSize * latticeSize);

    for (const path of kernel.shape.paths) {
      const pathLattice = this.latticeOps.rasterizePath(path, latticeSize);
      for (let i = 0; i < lattice.length; i++) {
        lattice[i] = Math.max(lattice[i], pathLattice[i]);
      }
    }

    this.applyInvariants(lattice, kernel.invariants, latticeSize);
    kernel.lattice = lattice;
    this.lattices.set(kernel.id, lattice);
    return lattice;
  }

  /**
   * Apply invariant transformations
   */
  applyInvariants(lattice, invariants, size) {
    for (const inv of invariants) {
      if (!inv.enabled) continue;

      switch (inv.type) {
        case 'scale':
          const scales = inv.params.scales ? inv.params.scales.split(',').map(parseFloat) : [0.5, 0.707, 1.0, 1.414, 2.0];
          for (const scale of scales) {
            const scaled = this.latticeOps.scaleLattice(lattice, size, scale);
            for (let i = 0; i < lattice.length; i++) {
              lattice[i] = Math.max(lattice[i], scaled[i]);
            }
          }
          break;
        case 'rotation':
          const angles = inv.params.angles ? inv.params.angles.split(',').map(parseFloat) : [0, Math.PI/4, Math.PI/2];
          for (const angle of angles) {
            const rotated = this.latticeOps.rotateLattice(lattice, size, angle);
            for (let i = 0; i < lattice.length; i++) {
              lattice[i] = Math.max(lattice[i], rotated[i]);
            }
          }
          break;
        case 'mirror':
          const axis = inv.params.axis || 'x';
          const mirrored = this.latticeOps.mirrorLattice(lattice, size, axis);
          for (let i = 0; i < lattice.length; i++) {
            lattice[i] = Math.max(lattice[i], mirrored[i]);
          }
          break;
      }
    }
  }

  /**
   * Evolve lattice using kernel
   */
  evolveLattice(kernelId, inputLattice = null) {
    const kernel = this.kernels.get(kernelId);
    if (!kernel) return null;

    const size = kernel.discrete.lattice.size;
    const currentLattice = inputLattice || kernel.lattice;
    const newLattice = this.convolution.evolve(kernel, currentLattice, size);

    kernel.lattice = newLattice;
    this.lattices.set(kernelId, newLattice);
    return newLattice;
  }

  /**
   * Compute kernel match (delegates to convolution)
   */
  computeKernelMatch(kernel, lattice, x, y, size) {
    return this.convolution.convolve(kernel, lattice, x, y, size);
  }

  /**
   * Compute coupling sum (delegates to convolution)
   */
  computeCouplingSum(kernel, lattice, x, y, size) {
    return this.convolution.coupling(lattice, x, y, size);
  }

  /**
   * Extract paths from lattice (delegates to renderer)
   */
  extractPathsFromLattice(lattice, size, threshold) {
    return this.renderer.extractPaths(lattice, size, threshold);
  }

  /**
   * Render kernel to SVG (with Sobel edge paths)
   */
  renderKernelToSVG(kernel) {
    if (!kernel || !kernel.lattice) return '<svg></svg>';
    
    const size = Math.sqrt(kernel.lattice.length);
    if (!size || size !== size || size <= 0) return '<svg></svg>';
    
    // Use renderer to extract paths from edges and generate SVG
    return this.renderer.render(kernel.lattice, size, {
      threshold: 0.2, // Lower threshold to catch more edges
      edges: kernel.edges // Sobel edges with magnitude and direction
    });
  }

  /**
   * Lattice to SVG (legacy method)
   */
  latticeToSVG(kernelId) {
    const kernel = this.kernels.get(kernelId);
    if (!kernel || !kernel.lattice) return null;

    const size = kernel.discrete.lattice.size;
    return this.renderer.render(kernel.lattice, size, { threshold: 0.5 });
  }
}

// FEG Runtime (minimal stub)
class FEGRuntime {
  constructor() {
    this.operators = new Map();
  }

  registerOperator(def) {
    this.operators.set(def.symbol, def);
    return def;
  }

  evaluate(symbol, context) {
    const op = this.operators.get(symbol);
    if (!op) return 0;
    return op.energy || 1.0;
  }
}

// Export for ES modules
export { SVGKernelSystem, FEGRuntime };

