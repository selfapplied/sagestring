/**
 * SVG Kernel System: Pattern Recognition via Declarative Geometry
 *
 * Extends FEG with kernel operators that turn SVG shapes into self-evolving
 * pattern recognition systems. SVG defines the kernel, lattice discretizes it,
 * and FEG powers the dynamical evolution.
 */

class SVGKernelSystem {
  /**
   * SVG Kernel DSL Parser and Runtime
   */
  constructor(options = {}) {
    this.kernels = new Map();
    this.lattices = new Map();
    this.fegEngine = options.fegEngine || new FEGRuntime();
    this.cvSystem = options.cvSystem || null;

    // Default lattice parameters
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
   * Parse SVG kernel definition
   */
  parseKernel(svgText) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgText, 'text/xml');

    const kernelElements = doc.querySelectorAll('kernel');
    const kernels = [];

    for (const kernelEl of kernelElements) {
      const kernel = this.parseKernelElement(kernelEl);
      this.kernels.set(kernel.id, kernel);
      kernels.push(kernel);
    }

    return kernels;
  }

  /**
   * Parse individual kernel element
   */
  parseKernelElement(element) {
    const id = element.getAttribute('id');
    const energy = parseFloat(element.getAttribute('energy') || this.defaults.energy);

    const kernel = {
      id: id,
      energy: energy,
      shape: null,
      discrete: null,
      invariants: [],
      fegOperator: null,
      lattice: null,
      power: parseFloat(element.getAttribute('power') || this.defaults.power)
    };

    // Parse shape definition
    const shapeEl = element.querySelector('shape');
    if (shapeEl) {
      kernel.shape = this.parseShapeElement(shapeEl);
    }

    // Parse discrete lattice specification
    const discreteEl = element.querySelector('discrete');
    if (discreteEl) {
      kernel.discrete = this.parseDiscreteElement(discreteEl);
    }

    // Parse invariants
    const invariantEls = element.querySelectorAll('invariants > *');
    for (const invEl of invariantEls) {
      kernel.invariants.push(this.parseInvariantElement(invEl));
    }

    // Create FEG operator for this kernel
    kernel.fegOperator = this.createKernelFEGOperator(kernel);

    return kernel;
  }

  /**
   * Parse shape element (contains SVG paths)
   */
  parseShapeElement(element) {
    const shape = {
      type: 'svg',
      paths: [],
      transforms: [],
      attributes: {}
    };

    // Parse all path elements
    const paths = element.querySelectorAll('path');
    for (const pathEl of paths) {
      shape.paths.push({
        d: pathEl.getAttribute('d'),
        stroke: pathEl.getAttribute('stroke'),
        strokeWidth: parseFloat(pathEl.getAttribute('stroke-width') || '2'),
        fill: pathEl.getAttribute('fill'),
        transform: pathEl.getAttribute('transform')
      });
    }

    // Parse transforms
    const transforms = element.querySelectorAll('transform');
    for (const transformEl of transforms) {
      shape.transforms.push({
        type: transformEl.getAttribute('type'),
        params: transformEl.getAttribute('params')
      });
    }

    return shape;
  }

  /**
   * Parse discrete lattice specification
   */
  parseDiscreteElement(element) {
    const discrete = {
      lattice: {
        size: parseInt(element.querySelector('lattice')?.getAttribute('size') || this.defaults.latticeSize),
        boundary: element.querySelector('lattice')?.getAttribute('boundary') || this.defaults.boundary,
        dimensions: parseInt(element.querySelector('lattice')?.getAttribute('dimensions') || '2')
      }
    };

    return discrete;
  }

  /**
   * Parse invariant specifications
   */
  parseInvariantElement(element) {
    const type = element.tagName;
    const invariant = {
      type: type,
      enabled: true,
      params: {}
    };

    // Parse attributes as parameters
    for (const attr of element.attributes) {
      if (attr.name === 'enabled') {
        invariant.enabled = attr.value === 'true';
      } else {
        invariant.params[attr.name] = attr.value;
      }
    }

    return invariant;
  }

  /**
   * Create FEG operator for kernel evolution
   */
  createKernelFEGOperator(kernel) {
    const fegDef = {
      symbol: `kernel_${kernel.id}`,
      string: this.generateKernelFEGExpression(kernel),
      energy: kernel.energy,
      power: kernel.power
    };

    return this.fegEngine.registerOperator(fegDef);
  }

  /**
   * Generate FEG expression for kernel evolution
   */
  generateKernelFEGExpression(kernel) {
    // Create power-law evolution with kernel matching
    const power = kernel.power;
    const energy = kernel.energy;

    // Expression for self-power evolution with kernel convolution
    return `energy * pow(kernel_match(x,y,t) + coupling_sum, ${power})`;
  }

  /**
   * Discretize SVG shape into lattice
   */
  discretizeKernel(kernel) {
    const latticeSize = kernel.discrete.lattice.size;
    const lattice = new Float32Array(latticeSize * latticeSize);

    // For each path in the kernel shape
    for (const path of kernel.shape.paths) {
      this.rasterizePathToLattice(path, lattice, latticeSize);
    }

    // Apply invariants (scale, rotation, etc.)
    this.applyInvariants(lattice, kernel.invariants, latticeSize);

    kernel.lattice = lattice;
    this.lattices.set(kernel.id, lattice);

    return lattice;
  }

  /**
   * Rasterize SVG path to lattice grid
   */
  rasterizePathToLattice(path, lattice, size) {
    // Parse SVG path commands
    const commands = this.parseSVGPath(path.d);

    // Create high-resolution canvas for path rendering
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size * 4; // 4x supersampling
    const ctx = canvas.getContext('2d');

    // Set path style
    ctx.strokeStyle = path.stroke || '#000000';
    ctx.lineWidth = (path.strokeWidth || 2) * 4; // Scale for supersampling
    ctx.fillStyle = path.fill || 'transparent';

    // Render path to canvas
    ctx.beginPath();
    this.renderPathCommands(ctx, commands, 4); // Scale factor
    ctx.stroke();
    if (path.fill && path.fill !== 'none') {
      ctx.fill();
    }

    // Downsample to lattice resolution
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    this.downsampleToLattice(imageData, lattice, size, 4);
  }

  /**
   * Parse SVG path d attribute into commands
   */
  parseSVGPath(d) {
    const commands = [];
    const tokens = d.match(/[a-zA-Z][^a-zA-Z]*/g) || [];

    for (const token of tokens) {
      const cmd = token[0];
      const params = token.slice(1).trim().split(/[\s,]+/).map(parseFloat);
      commands.push({cmd: cmd.toUpperCase(), params});
    }

    return commands;
  }

  /**
   * Render path commands to canvas context
   */
  renderPathCommands(ctx, commands, scale = 1) {
    let currentX = 0, currentY = 0;
    let startX = 0, startY = 0;

    for (const command of commands) {
      const {cmd, params} = command;

      switch (cmd) {
        case 'M': // Move to
          currentX = params[0] * scale;
          currentY = params[1] * scale;
          startX = currentX;
          startY = currentY;
          ctx.moveTo(currentX, currentY);
          break;
        case 'L': // Line to
          currentX = params[0] * scale;
          currentY = params[1] * scale;
          ctx.lineTo(currentX, currentY);
          break;
        case 'C': // Cubic bezier
          ctx.bezierCurveTo(
            params[0] * scale, params[1] * scale,
            params[2] * scale, params[3] * scale,
            params[4] * scale, params[5] * scale
          );
          currentX = params[4] * scale;
          currentY = params[5] * scale;
          break;
        case 'Q': // Quadratic bezier
          ctx.quadraticCurveTo(
            params[0] * scale, params[1] * scale,
            params[2] * scale, params[3] * scale
          );
          currentX = params[2] * scale;
          currentY = params[3] * scale;
          break;
        case 'A': // Arc (simplified to line for now)
          currentX = params[5] * scale;
          currentY = params[6] * scale;
          ctx.lineTo(currentX, currentY);
          break;
        case 'Z': // Close path
          ctx.closePath();
          break;
      }
    }
  }

  /**
   * Downsample high-res image data to lattice
   */
  downsampleToLattice(imageData, lattice, size, supersample) {
    const data = imageData.data;
    const blockSize = supersample;

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        let sum = 0;
        let count = 0;

        // Average supersampled block
        for (let sy = 0; sy < blockSize; sy++) {
          for (let sx = 0; sx < blockSize; sx++) {
            const px = x * blockSize + sx;
            const py = y * blockSize + sy;
            const idx = (py * imageData.width + px) * 4;

            if (px < imageData.width && py < imageData.height) {
              // Use luminance as presence value
              const r = data[idx] / 255;
              const g = data[idx + 1] / 255;
              const b = data[idx + 2] / 255;
              const lum = 0.299 * r + 0.587 * g + 0.114 * b;
              sum += lum;
              count++;
            }
          }
        }

        const avgPresence = count > 0 ? sum / count : 0;
        lattice[y * size + x] = Math.max(lattice[y * size + x], avgPresence);
      }
    }
  }

  /**
   * Apply scale/rotation invariants to lattice
   */
  applyInvariants(lattice, invariants, size) {
    for (const invariant of invariants) {
      if (!invariant.enabled) continue;

      switch (invariant.type) {
        case 'scale-invariance':
          this.applyScaleInvariance(lattice, size);
          break;
        case 'mirror-symmetry':
          this.applyMirrorSymmetry(lattice, size);
          break;
        case 'rotation-invariance':
          this.applyRotationInvariance(lattice, size);
          break;
      }
    }
  }

  /**
   * Apply scale invariance by creating multi-scale representation
   */
  applyScaleInvariance(lattice, size) {
    // Create scale pyramid and max-pool
    const scales = [0.5, 0.707, 1.0, 1.414, 2.0];

    for (const scale of scales) {
      const scaledLattice = this.scaleLattice(lattice, size, scale);
      // Max operation for scale invariance
      for (let i = 0; i < lattice.length; i++) {
        lattice[i] = Math.max(lattice[i], scaledLattice[i]);
      }
    }
  }

  /**
   * Scale lattice by factor
   */
  scaleLattice(lattice, size, scale) {
    const scaled = new Float32Array(size * size);

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const sx = Math.floor(x / scale);
        const sy = Math.floor(y / scale);

        if (sx < size && sy < size) {
          scaled[y * size + x] = lattice[sy * size + sx];
        }
      }
    }

    return scaled;
  }

  /**
   * Apply mirror symmetry
   */
  applyMirrorSymmetry(lattice, size) {
    const mirrored = new Float32Array(lattice);

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const mx = size - 1 - x;
        const my = size - 1 - y;

        // Horizontal mirror
        mirrored[y * size + x] = Math.max(mirrored[y * size + x], lattice[y * size + mx]);
        // Vertical mirror
        mirrored[y * size + x] = Math.max(mirrored[y * size + x], lattice[my * size + x]);
      }
    }

    // Copy back
    mirrored.forEach((val, i) => lattice[i] = val);
  }

  /**
   * Apply rotation invariance (simplified)
   */
  applyRotationInvariance(lattice, size) {
    const rotations = [90, 180, 270];

    for (const angle of rotations) {
      const rotated = this.rotateLattice(lattice, size, angle);
      for (let i = 0; i < lattice.length; i++) {
        lattice[i] = Math.max(lattice[i], rotated[i]);
      }
    }
  }

  /**
   * Rotate lattice by angle (degrees)
   */
  rotateLattice(lattice, size, angle) {
    const rotated = new Float32Array(size * size);
    const radians = (angle * Math.PI) / 180;
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);
    const center = size / 2;

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        // Rotate coordinates around center
        const dx = x - center;
        const dy = y - center;
        const rx = dx * cos - dy * sin + center;
        const ry = dx * sin + dy * cos + center;

        const rxInt = Math.round(rx);
        const ryInt = Math.round(ry);

        if (rxInt >= 0 && rxInt < size && ryInt >= 0 && ryInt < size) {
          rotated[y * size + x] = lattice[ryInt * size + rxInt];
        }
      }
    }

    return rotated;
  }

  /**
   * Evolve lattice using FEG power operator
   */
  evolveLattice(kernelId, inputLattice = null) {
    const kernel = this.kernels.get(kernelId);
    if (!kernel) return null;

    const size = kernel.discrete.lattice.size;
    const currentLattice = inputLattice || kernel.lattice;
    const newLattice = new Float32Array(size * size);

    // Apply FEG-powered convolution with self-power
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const idx = y * size + x;

        // Compute kernel matching at this position
        const match = this.computeKernelMatch(kernel, currentLattice, x, y, size);

        // Apply FEG evolution (simplified)
        const coupling = this.computeCouplingSum(kernel, currentLattice, x, y, size);

        // Power-law evolution
        const energy = kernel.energy;
        const power = kernel.power;
        const evolved = energy * Math.pow(match + coupling, power);

        newLattice[idx] = Math.max(0, Math.min(1, evolved));
      }
    }

    // Update kernel lattice
    kernel.lattice = newLattice;
    this.lattices.set(kernelId, newLattice);

    return newLattice;
  }

  /**
   * Compute kernel matching at position
   */
  computeKernelMatch(kernel, lattice, x, y, size) {
    const kernelLattice = kernel.lattice;
    let match = 0;
    let weight = 0;

    // Convolution with kernel pattern
    const kernelSize = Math.min(size, 32); // Limit kernel size
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
  computeCouplingSum(kernel, lattice, x, y, size) {
    let coupling = 0;
    const radius = 3; // Coupling neighborhood

    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        if (dx === 0 && dy === 0) continue;

        const nx = x + dx;
        const ny = y + dy;

        if (nx >= 0 && nx < size && ny >= 0 && ny < size) {
          const distance = Math.sqrt(dx*dx + dy*dy);
          const weight = 1 / (1 + distance); // Distance-weighted coupling
          coupling += lattice[ny * size + nx] * weight;
        }
      }
    }

    return coupling * 0.1; // Scale coupling strength
  }

  /**
   * Vectorize evolved lattice back to SVG
   */
  latticeToSVG(kernelId) {
    const kernel = this.kernels.get(kernelId);
    if (!kernel || !kernel.lattice) return null;

    const size = kernel.discrete.lattice.size;
    const lattice = kernel.lattice;

    // Create SVG representation
    let svg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">`;

    // Convert high-value regions to paths (simplified marching squares)
    const threshold = 0.5;
    const paths = this.extractPathsFromLattice(lattice, size, threshold);

    for (const path of paths) {
      svg += `<path d="${path.d}" fill="rgba(100,150,255,0.7)" stroke="blue" stroke-width="1"/>`;
    }

    svg += '</svg>';
    return svg;
  }

  /**
   * Extract SVG paths from lattice using marching squares
   */
  extractPathsFromLattice(lattice, size, threshold) {
    const paths = [];
    const visited = new Set();

    for (let y = 0; y < size - 1; y++) {
      for (let x = 0; x < size - 1; x++) {
        const idx = y * size + x;
        if (visited.has(idx)) continue;

        if (lattice[idx] >= threshold) {
          const path = this.traceContour(lattice, size, x, y, threshold, visited);
          if (path.length > 0) {
            paths.push({d: this.contourToSVGPath(path)});
          }
        }
      }
    }

    return paths;
  }

  /**
   * Trace contour using marching squares (simplified)
   */
  traceContour(lattice, size, startX, startY, threshold, visited) {
    const contour = [];
    let x = startX;
    let y = startY;
    let dir = 0; // 0=right, 1=down, 2=left, 3=up

    do {
      const idx = y * size + x;
      visited.add(idx);
      contour.push({x, y});

      // Find next direction
      const right = (x + 1 < size) ? lattice[y * size + (x + 1)] >= threshold : false;
      const down = (y + 1 < size) ? lattice[(y + 1) * size + x] >= threshold : false;
      const left = (x - 1 >= 0) ? lattice[y * size + (x - 1)] >= threshold : false;
      const up = (y - 1 >= 0) ? lattice[(y - 1) * size + x] >= threshold : false;

      // Simple right-hand rule
      if (dir === 0 && right) { x++; }
      else if (dir === 1 && down) { y++; }
      else if (dir === 2 && left) { x--; }
      else if (dir === 3 && up) { y--; }
      else {
        // Turn right
        dir = (dir + 1) % 4;
      }

      // Prevent infinite loops
      if (contour.length > size * 4) break;

    } while (x !== startX || y !== startY || contour.length === 1);

    return contour;
  }

  /**
   * Convert contour points to SVG path
   */
  contourToSVGPath(contour) {
    if (contour.length === 0) return '';

    let path = `M${contour[0].x} ${contour[0].y}`;
    for (let i = 1; i < contour.length; i++) {
      path += ` L${contour[i].x} ${contour[i].y}`;
    }
    path += ' Z';
    return path;
  }

  /**
   * Integrate with computer vision system
   */
  detectPatterns(frameData, kernelIds) {
    const detections = [];

    for (const kernelId of kernelIds) {
      const kernel = this.kernels.get(kernelId);
      if (!kernel) continue;

      // Convert frame to lattice
      const frameLattice = this.frameToLattice(frameData);

      // Evolve kernel with frame input
      const evolved = this.evolveLattice(kernelId, frameLattice);

      // Extract detections
      const kernelDetections = this.extractDetections(evolved, kernel);
      detections.push(...kernelDetections);
    }

    return detections;
  }

  /**
   * Convert frame data to lattice format
   */
  frameToLattice(frameData) {
    // Assume frameData is ImageData-like
    const size = Math.min(frameData.width, frameData.height, 256);
    const lattice = new Float32Array(size * size);

    // Simple downsampling (could be more sophisticated)
    const scaleX = frameData.width / size;
    const scaleY = frameData.height / size;

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const fx = Math.floor(x * scaleX);
        const fy = Math.floor(y * scaleY);
        const idx = (fy * frameData.width + fx) * 4;

        const r = frameData.data[idx] / 255;
        const g = frameData.data[idx + 1] / 255;
        const b = frameData.data[idx + 2] / 255;
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;

        lattice[y * size + x] = lum;
      }
    }

    return lattice;
  }

  /**
   * Extract pattern detections from evolved lattice
   */
  extractDetections(lattice, kernel) {
    const size = kernel.discrete.lattice.size;
    const detections = [];
    const threshold = 0.7;

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const val = lattice[y * size + x];
        if (val >= threshold) {
          detections.push({
            kernelId: kernel.id,
            position: {x, y},
            confidence: val,
            scale: 1.0,
            rotation: 0
          });
        }
      }
    }

    return detections;
  }
}

// Minimal FEG Runtime for kernel operations
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

    // Simplified evaluation (would integrate with full FEG engine)
    return op.energy || 1.0;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SVGKernelSystem, FEGRuntime };
}


