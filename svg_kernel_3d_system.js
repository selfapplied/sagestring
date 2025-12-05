/**
 * SVG Kernel 3D System: Volumetric Pattern Recognition
 *
 * Extends the 2D SVG kernel system with 3D lattice extrusion,
 * enabling volumetric pattern recognition in three-dimensional space.
 * 2D SVG shapes become extruded volumes that evolve through 3D cellular automata.
 */

class SVGKernel3DSystem {
  /**
   * 3D extension of the SVG kernel system
   */
  constructor(svgKernelSystem, options = {}) {
    this.kernelSystem = svgKernelSystem;
    this.lattices3D = new Map();
    this.extrusionMethods = new Map();

    // 3D lattice parameters
    this.defaults = {
      latticeSize: { x: 64, y: 64, z: 32 },
      boundary: 'wrap',
      extrusionDepth: 16,
      extrusionMethod: 'linear',
      volumetricInvariants: ['scale-3d', 'rotation-3d']
    };

    // Initialize extrusion methods
    this.initializeExtrusionMethods();

    console.log('🌐 SVG Kernel 3D System initialized');
  }

  /**
   * Initialize available extrusion methods
   */
  initializeExtrusionMethods() {
    // Linear extrusion (constant cross-section)
    this.extrusionMethods.set('linear', {
      extrude: (shapeLattice, depth, options = {}) => this.extrudeLinear(shapeLattice, depth, options),
      description: 'Constant cross-section extrusion'
    });

    // Tapered extrusion (changing cross-section)
    this.extrusionMethods.set('tapered', {
      extrude: (shapeLattice, depth, options = {}) => this.extrudeTapered(shapeLattice, depth, options),
      description: 'Linearly tapered extrusion'
    });

    // Radial extrusion (revolution around axis)
    this.extrusionMethods.set('radial', {
      extrude: (shapeLattice, depth, options = {}) => this.extrudeRadial(shapeLattice, depth, options),
      description: 'Revolution around central axis'
    });

    // Spiral extrusion (helical pattern)
    this.extrusionMethods.set('spiral', {
      extrude: (shapeLattice, depth, options = {}) => this.extrudeSpiral(shapeLattice, depth, options),
      description: 'Helical extrusion pattern'
    });

    // Fractal extrusion (self-similar depth)
    this.extrusionMethods.set('fractal', {
      extrude: (shapeLattice, depth, options = {}) => this.extrudeFractal(shapeLattice, depth, options),
      description: 'Self-similar fractal extrusion'
    });

    // Wave extrusion (sinusoidal modulation)
    this.extrusionMethods.set('wave', {
      extrude: (shapeLattice, depth, options = {}) => this.extrudeWave(shapeLattice, depth, options),
      description: 'Sinusoidal wave modulation'
    });
  }

  /**
   * Create 3D kernel from 2D SVG kernel
   */
  create3DKernel(kernelId, options = {}) {
    const kernel2D = this.kernelSystem.kernels.get(kernelId);
    if (!kernel2D) {
      throw new Error(`2D kernel ${kernelId} not found`);
    }

    const kernel3D = {
      id: `${kernelId}_3d`,
      baseKernelId: kernelId,
      lattice3D: null,
      extrusionMethod: options.extrusionMethod || this.defaults.extrusionMethod,
      extrusionDepth: options.extrusionDepth || this.defaults.extrusionDepth,
      latticeSize: options.latticeSize || this.defaults.latticeSize,
      invariants: options.invariants || this.defaults.volumetricInvariants,
      energy: kernel2D.energy,
      power: kernel2D.power
    };

    // Ensure 2D kernel is discretized
    if (!kernel2D.lattice) {
      this.kernelSystem.discretizeKernel(kernel2D);
    }

    // Extrude to 3D
    kernel3D.lattice3D = this.extrudeKernel(kernel2D, kernel3D);

    // Apply 3D invariants
    this.apply3DInvariants(kernel3D);

    // Store the 3D kernel
    this.lattices3D.set(kernel3D.id, kernel3D);

    console.log(`📦 Created 3D kernel: ${kernel3D.id} (${kernel3D.extrusionMethod} extrusion)`);
    return kernel3D;
  }

  /**
   * Extrude 2D kernel to 3D volume
   */
  extrudeKernel(kernel2D, kernel3D) {
    const method = this.extrusionMethods.get(kernel3D.extrusionMethod);
    if (!method) {
      throw new Error(`Unknown extrusion method: ${kernel3D.extrusionMethod}`);
    }

    return method.extrude(
      kernel2D.lattice,
      kernel3D.extrusionDepth,
      {
        latticeSize: kernel3D.latticeSize,
        kernel: kernel2D
      }
    );
  }

  /**
   * Linear extrusion (constant cross-section)
   */
  extrudeLinear(shapeLattice, depth, options) {
    const { latticeSize } = options;
    const size2D = Math.sqrt(shapeLattice.length);
    const volume = new Float32Array(latticeSize.x * latticeSize.y * latticeSize.z);

    // Scale 2D lattice to match 3D xy dimensions
    const scaleX = latticeSize.x / size2D;
    const scaleY = latticeSize.y / size2D;

    for (let z = 0; z < latticeSize.z; z++) {
      for (let y = 0; y < latticeSize.y; y++) {
        for (let x = 0; x < latticeSize.x; x++) {
          // Sample from 2D shape with scaling
          const sx = Math.floor(x / scaleX);
          const sy = Math.floor(y / scaleY);

          if (sx < size2D && sy < size2D) {
            const shapeValue = shapeLattice[sy * size2D + sx];
            const idx = z * latticeSize.x * latticeSize.y + y * latticeSize.x + x;

            // Linear falloff with depth
            const depthFactor = 1.0 - Math.abs(z - latticeSize.z / 2) / (latticeSize.z / 2);
            volume[idx] = shapeValue * depthFactor;
          }
        }
      }
    }

    return volume;
  }

  /**
   * Tapered extrusion (linearly changing cross-section)
   */
  extrudeTapered(shapeLattice, depth, options) {
    const { latticeSize } = options;
    const size2D = Math.sqrt(shapeLattice.length);
    const volume = new Float32Array(latticeSize.x * latticeSize.y * latticeSize.z);

    const scaleX = latticeSize.x / size2D;
    const scaleY = latticeSize.y / size2D;

    for (let z = 0; z < latticeSize.z; z++) {
      // Taper factor changes with depth
      const taperFactor = 0.3 + 0.7 * (z / latticeSize.z);
      const currentScaleX = scaleX * taperFactor;
      const currentScaleY = scaleY * taperFactor;

      for (let y = 0; y < latticeSize.y; y++) {
        for (let x = 0; x < latticeSize.x; x++) {
          const sx = Math.floor(x / currentScaleX);
          const sy = Math.floor(y / currentScaleY);

          if (sx < size2D && sy < size2D) {
            const shapeValue = shapeLattice[sy * size2D + sx];
            const idx = z * latticeSize.x * latticeSize.y + y * latticeSize.x + x;

            // Additional depth modulation
            const depthMod = Math.sin(z * Math.PI / latticeSize.z) * 0.2 + 0.8;
            volume[idx] = shapeValue * depthMod;
          }
        }
      }
    }

    return volume;
  }

  /**
   * Radial extrusion (revolution around axis)
   */
  extrudeRadial(shapeLattice, depth, options) {
    const { latticeSize } = options;
    const size2D = Math.sqrt(shapeLattice.length);
    const volume = new Float32Array(latticeSize.x * latticeSize.y * latticeSize.z);

    const centerX = latticeSize.x / 2;
    const centerY = latticeSize.y / 2;

    for (let z = 0; z < latticeSize.z; z++) {
      for (let y = 0; y < latticeSize.y; y++) {
        for (let x = 0; x < latticeSize.x; x++) {
          // Distance from center axis (x-axis)
          const dx = x - centerX;
          const dy = y - centerY;
          const distance = Math.sqrt(dx * dx + dy * dy);

          // Angle around the axis
          const angle = Math.atan2(dy, dx);

          // Map to 2D shape coordinates
          const radius = distance / (latticeSize.x / size2D);
          const theta = angle;

          // Sample from 2D shape using polar coordinates
          const sx = Math.floor(radius * Math.cos(theta) + size2D / 2);
          const sy = Math.floor(radius * Math.sin(theta) + size2D / 2);

          if (sx >= 0 && sx < size2D && sy >= 0 && sy < size2D) {
            const shapeValue = shapeLattice[sy * size2D + sx];
            const idx = z * latticeSize.x * latticeSize.y + y * latticeSize.x + x;

            // Radial falloff
            const radialFalloff = Math.max(0, 1 - distance / (latticeSize.x / 2));
            volume[idx] = shapeValue * radialFalloff;
          }
        }
      }
    }

    return volume;
  }

  /**
   * Spiral extrusion (helical pattern)
   */
  extrudeSpiral(shapeLattice, depth, options) {
    const { latticeSize } = options;
    const size2D = Math.sqrt(shapeLattice.length);
    const volume = new Float32Array(latticeSize.x * latticeSize.y * latticeSize.z);

    for (let z = 0; z < latticeSize.z; z++) {
      // Spiral rotation with depth
      const spiralAngle = (z / latticeSize.z) * 4 * Math.PI;
      const cosA = Math.cos(spiralAngle);
      const sinA = Math.sin(spiralAngle);

      for (let y = 0; y < latticeSize.y; y++) {
        for (let x = 0; x < latticeSize.x; x++) {
          // Rotate coordinates
          const rx = (x - latticeSize.x / 2) * cosA - (y - latticeSize.y / 2) * sinA;
          const ry = (x - latticeSize.x / 2) * sinA + (y - latticeSize.y / 2) * cosA;

          // Map to 2D shape
          const sx = Math.floor(rx + size2D / 2);
          const sy = Math.floor(ry + size2D / 2);

          if (sx >= 0 && sx < size2D && sy >= 0 && sy < size2D) {
            const shapeValue = shapeLattice[sy * size2D + sx];
            const idx = z * latticeSize.x * latticeSize.y + y * latticeSize.x + x;

            // Spiral intensity modulation
            const spiralMod = 0.5 + 0.5 * Math.sin(spiralAngle + Math.sqrt(rx*rx + ry*ry) * 0.1);
            volume[idx] = shapeValue * spiralMod;
          }
        }
      }
    }

    return volume;
  }

  /**
   * Fractal extrusion (self-similar depth structure)
   */
  extrudeFractal(shapeLattice, depth, options) {
    const { latticeSize } = options;
    const size2D = Math.sqrt(shapeLattice.length);
    const volume = new Float32Array(latticeSize.x * latticeSize.y * latticeSize.z);

    // Fractal parameters
    const octaves = 3;
    const persistence = 0.5;

    for (let z = 0; z < latticeSize.z; z++) {
      for (let y = 0; y < latticeSize.y; y++) {
        for (let x = 0; x < latticeSize.x; x++) {
          // Fractal noise in depth dimension
          let fractalValue = 0;
          let amplitude = 1;
          let frequency = 0.01;

          for (let octave = 0; octave < octaves; octave++) {
            const noise = Math.sin(x * frequency) * Math.cos(y * frequency) * Math.sin(z * frequency * 2);
            fractalValue += noise * amplitude;
            amplitude *= persistence;
            frequency *= 2;
          }

          // Map to 2D shape coordinates with fractal displacement
          const fx = x + fractalValue * 5;
          const fy = y + fractalValue * 3;

          const sx = Math.floor(fx * size2D / latticeSize.x);
          const sy = Math.floor(fy * size2D / latticeSize.y);

          if (sx >= 0 && sx < size2D && sy >= 0 && sy < size2D) {
            const shapeValue = shapeLattice[sy * size2D + sx];
            const idx = z * latticeSize.x * latticeSize.y + y * latticeSize.x + x;

            // Fractal modulation
            const fractalMod = 0.5 + 0.5 * fractalValue;
            volume[idx] = shapeValue * Math.max(0, fractalMod);
          }
        }
      }
    }

    return volume;
  }

  /**
   * Wave extrusion (sinusoidal modulation)
   */
  extrudeWave(shapeLattice, depth, options) {
    const { latticeSize } = options;
    const size2D = Math.sqrt(shapeLattice.length);
    const volume = new Float32Array(latticeSize.x * latticeSize.y * latticeSize.z);

    const scaleX = latticeSize.x / size2D;
    const scaleY = latticeSize.y / size2D;

    for (let z = 0; z < latticeSize.z; z++) {
      // Multiple wave frequencies
      const wave1 = Math.sin(z * 0.2) * 0.3;
      const wave2 = Math.sin(z * 0.5) * 0.2;
      const waveMod = wave1 + wave2 + 0.5;

      for (let y = 0; y < latticeSize.y; y++) {
        for (let x = 0; x < latticeSize.x; x++) {
          // Wave-modulated sampling
          const waveOffsetX = waveMod * 5;
          const waveOffsetY = waveMod * 3;

          const sx = Math.floor((x + waveOffsetX) / scaleX);
          const sy = Math.floor((y + waveOffsetY) / scaleY);

          if (sx >= 0 && sx < size2D && sy >= 0 && sy < size2D) {
            const shapeValue = shapeLattice[sy * size2D + sx];
            const idx = z * latticeSize.x * latticeSize.y + y * latticeSize.x + x;

            volume[idx] = shapeValue * waveMod;
          }
        }
      }
    }

    return volume;
  }

  /**
   * Apply 3D volumetric invariants
   */
  apply3DInvariants(kernel3D) {
    const { invariants, lattice3D, latticeSize } = kernel3D;

    for (const invariant of invariants) {
      switch (invariant) {
        case 'scale-3d':
          this.apply3DScaleInvariance(lattice3D, latticeSize);
          break;
        case 'rotation-3d':
          this.apply3DRotationInvariance(lattice3D, latticeSize);
          break;
        case 'mirror-3d':
          this.apply3DMirrorInvariance(lattice3D, latticeSize);
          break;
        case 'shear-3d':
          this.apply3DShearInvariance(lattice3D, latticeSize);
          break;
      }
    }
  }

  /**
   * Apply 3D scale invariance
   */
  apply3DScaleInvariance(lattice, size) {
    const scales = [0.5, 0.707, 1.0, 1.414, 2.0];

    for (const scale of scales) {
      const scaled = this.scale3DLattice(lattice, size, scale);
      for (let i = 0; i < lattice.length; i++) {
        lattice[i] = Math.max(lattice[i], scaled[i]);
      }
    }
  }

  /**
   * Scale 3D lattice
   */
  scale3DLattice(lattice, size, scale) {
    const scaled = new Float32Array(size.x * size.y * size.z);

    for (let z = 0; z < size.z; z++) {
      for (let y = 0; y < size.y; y++) {
        for (let x = 0; x < size.x; x++) {
          const sx = Math.floor(x / scale);
          const sy = Math.floor(y / scale);
          const sz = Math.floor(z / scale);

          if (sx < size.x && sy < size.y && sz < size.z) {
            const sidx = sz * size.x * size.y + sy * size.x + sx;
            const idx = z * size.x * size.y + y * size.x + x;
            scaled[idx] = lattice[sidx];
          }
        }
      }
    }

    return scaled;
  }

  /**
   * Apply 3D rotation invariance (simplified - full 3D rotations are complex)
   */
  apply3DRotationInvariance(lattice, size) {
    // For now, apply rotations in XY, XZ, and YZ planes
    const rotations = [
      { plane: 'xy', angle: Math.PI/2 },
      { plane: 'xy', angle: Math.PI },
      { plane: 'xy', angle: 3*Math.PI/2 },
      { plane: 'xz', angle: Math.PI/2 },
      { plane: 'yz', angle: Math.PI/2 }
    ];

    for (const rotation of rotations) {
      const rotated = this.rotate3DLattice(lattice, size, rotation.plane, rotation.angle);
      for (let i = 0; i < lattice.length; i++) {
        lattice[i] = Math.max(lattice[i], rotated[i]);
      }
    }
  }

  /**
   * Rotate 3D lattice in specified plane
   */
  rotate3DLattice(lattice, size, plane, angle) {
    const rotated = new Float32Array(size.x * size.y * size.z);
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);

    for (let z = 0; z < size.z; z++) {
      for (let y = 0; y < size.y; y++) {
        for (let x = 0; x < size.x; x++) {
          let rx = x, ry = y, rz = z;

          // Apply rotation in specified plane
          switch (plane) {
            case 'xy':
              rx = x * cosA - y * sinA;
              ry = x * sinA + y * cosA;
              break;
            case 'xz':
              rx = x * cosA - z * sinA;
              rz = x * sinA + z * cosA;
              break;
            case 'yz':
              ry = y * cosA - z * sinA;
              rz = y * sinA + z * cosA;
              break;
          }

          // Nearest neighbor sampling
          const ix = Math.round(rx);
          const iy = Math.round(ry);
          const iz = Math.round(rz);

          if (ix >= 0 && ix < size.x && iy >= 0 && iy < size.y && iz >= 0 && iz < size.z) {
            const sidx = iz * size.x * size.y + iy * size.x + ix;
            const idx = z * size.x * size.y + y * size.x + x;
            rotated[idx] = lattice[sidx];
          }
        }
      }
    }

    return rotated;
  }

  /**
   * Apply 3D mirror invariance
   */
  apply3DMirrorInvariance(lattice, size) {
    // Mirror across XY, XZ, and YZ planes
    const mirrors = ['xy', 'xz', 'yz'];

    for (const mirror of mirrors) {
      const mirrored = this.mirror3DLattice(lattice, size, mirror);
      for (let i = 0; i < lattice.length; i++) {
        lattice[i] = Math.max(lattice[i], mirrored[i]);
      }
    }
  }

  /**
   * Mirror 3D lattice across plane
   */
  mirror3DLattice(lattice, size, plane) {
    const mirrored = new Float32Array(size.x * size.y * size.z);

    for (let z = 0; z < size.z; z++) {
      for (let y = 0; y < size.y; y++) {
        for (let x = 0; x < size.x; x++) {
          let mx = x, my = y, mz = z;

          // Mirror coordinates
          switch (plane) {
            case 'xy':
              mz = size.z - 1 - z;
              break;
            case 'xz':
              my = size.y - 1 - y;
              break;
            case 'yz':
              mx = size.x - 1 - x;
              break;
          }

          const sidx = mz * size.x * size.y + my * size.x + mx;
          const idx = z * size.x * size.y + y * size.x + x;
          mirrored[idx] = lattice[sidx];
        }
      }
    }

    return mirrored;
  }

  /**
   * Apply 3D shear invariance (experimental)
   */
  apply3DShearInvariance(lattice, size) {
    // Apply various shear transformations
    const shears = [
      { axis: 'x', shear: 0.2 },
      { axis: 'y', shear: 0.2 },
      { axis: 'z', shear: 0.2 }
    ];

    for (const shear of shears) {
      const sheared = this.shear3DLattice(lattice, size, shear.axis, shear.shear);
      for (let i = 0; i < lattice.length; i++) {
        lattice[i] = Math.max(lattice[i], sheared[i]);
      }
    }
  }

  /**
   * Shear 3D lattice along axis
   */
  shear3DLattice(lattice, size, axis, shearFactor) {
    const sheared = new Float32Array(size.x * size.y * size.z);

    for (let z = 0; z < size.z; z++) {
      for (let y = 0; y < size.y; y++) {
        for (let x = 0; x < size.x; x++) {
          let sx = x, sy = y, sz = z;

          // Apply shear
          switch (axis) {
            case 'x':
              sx = x + shearFactor * y;
              break;
            case 'y':
              sy = y + shearFactor * x;
              break;
            case 'z':
              sz = z + shearFactor * x;
              break;
          }

          const ix = Math.round(Math.max(0, Math.min(size.x - 1, sx)));
          const iy = Math.round(Math.max(0, Math.min(size.y - 1, sy)));
          const iz = Math.round(Math.max(0, Math.min(size.z - 1, sz)));

          const sidx = iz * size.x * size.y + iy * size.x + ix;
          const idx = z * size.x * size.y + y * size.x + x;
          sheared[idx] = lattice[sidx];
        }
      }
    }

    return sheared;
  }

  /**
   * Evolve 3D lattice using volumetric CA rules
   */
  evolve3DLattice(kernelId, steps = 1) {
    const kernel3D = this.lattices3D.get(kernelId);
    if (!kernel3D) return null;

    const { lattice3D, latticeSize, energy, power } = kernel3D;
    const size = latticeSize;

    for (let step = 0; step < steps; step++) {
      const newLattice = new Float32Array(size.x * size.y * size.z);

      for (let z = 0; z < size.z; z++) {
        for (let y = 0; y < size.y; y++) {
          for (let x = 0; x < size.x; x++) {
            const idx = z * size.x * size.y + y * size.x + x;

            // Compute 3D kernel matching
            const match = this.compute3DKernelMatch(kernel3D, lattice3D, x, y, z, size);

            // Compute 3D coupling sum (26-neighbor 3D Moore neighborhood)
            const coupling = this.compute3DCouplingSum(lattice3D, x, y, z, size);

            // Power-law evolution
            const evolved = energy * Math.pow(match + coupling, power);

            newLattice[idx] = Math.max(0, Math.min(1, evolved));
          }
        }
      }

      // Update lattice
      newLattice.forEach((val, i) => lattice3D[i] = val);
    }

    return lattice3D;
  }

  /**
   * Compute 3D kernel matching at position
   */
  compute3DKernelMatch(kernel3D, lattice, x, y, z, size) {
    const kernelLattice = kernel3D.lattice3D;
    let match = 0;
    let weight = 0;

    // 3x3x3 kernel convolution
    const kernelSize = 3;
    const halfKernel = 1;

    for (let kz = -halfKernel; kz <= halfKernel; kz++) {
      for (let ky = -halfKernel; ky <= halfKernel; ky++) {
        for (let kx = -halfKernel; kx <= halfKernel; kx++) {
          const lx = x + kx;
          const ly = y + ky;
          const lz = z + kz;

          if (lx >= 0 && lx < size.x && ly >= 0 && ly < size.y && lz >= 0 && lz < size.z) {
            const lidx = lz * size.x * size.y + ly * size.x + lx;
            const kidx = (kz + halfKernel) * kernelSize * kernelSize +
                        (ky + halfKernel) * kernelSize + (kx + halfKernel);

            if (kidx < kernelLattice.length) {
              const similarity = 1 - Math.abs(lattice[lidx] - kernelLattice[kidx]);
              match += similarity * kernelLattice[kidx];
              weight += kernelLattice[kidx];
            }
          }
        }
      }
    }

    return weight > 0 ? match / weight : 0;
  }

  /**
   * Compute 3D coupling sum (26-neighbor Moore neighborhood)
   */
  compute3DCouplingSum(lattice, x, y, z, size) {
    let coupling = 0;
    let count = 0;

    // 3x3x3 neighborhood (26 neighbors)
    for (let dz = -1; dz <= 1; dz++) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0 && dz === 0) continue;

          const nx = x + dx;
          const ny = y + dy;
          const nz = z + dz;

          // Wrap around boundaries (toroidal)
          const wx = (nx + size.x) % size.x;
          const wy = (ny + size.y) % size.y;
          const wz = (nz + size.z) % size.z;

          const idx = wz * size.x * size.y + wy * size.x + wx;
          const distance = Math.sqrt(dx*dx + dy*dy + dz*dz);
          const weight = 1 / (1 + distance);

          coupling += lattice[idx] * weight;
          count++;
        }
      }
    }

    return coupling / count * 0.1; // Scale coupling strength
  }

  /**
   * Create 3D visualization data
   */
  createVisualizationData(kernelId, options = {}) {
    const kernel3D = this.lattices3D.get(kernelId);
    if (!kernel3D) return null;

    const { lattice3D, latticeSize } = kernel3D;
    const { threshold = 0.3, maxPoints = 10000 } = options;

    const points = [];
    const colors = [];

    for (let z = 0; z < latticeSize.z; z++) {
      for (let y = 0; y < latticeSize.y; y++) {
        for (let x = 0; x < latticeSize.x; x++) {
          const idx = z * latticeSize.x * latticeSize.y + y * latticeSize.x + x;
          const value = lattice3D[idx];

          if (value >= threshold) {
            points.push(x, y, z);
            // Color based on value intensity
            const intensity = Math.floor(value * 255);
            colors.push(intensity, intensity, 255, 255); // Blue gradient
          }
        }
      }
    }

    // Limit points for performance
    if (points.length > maxPoints * 3) {
      const step = Math.floor(points.length / (maxPoints * 3));
      const limitedPoints = [];
      const limitedColors = [];

      for (let i = 0; i < points.length; i += step * 3) {
        limitedPoints.push(points[i], points[i+1], points[i+2]);
        limitedColors.push(colors[i], colors[i+1], colors[i+2], colors[i+3]);
      }

      return { points: limitedPoints, colors: limitedColors, size: latticeSize };
    }

    return { points, colors, size: latticeSize };
  }

  /**
   * Extract 2D slices from 3D volume
   */
  extractSlice(kernelId, axis = 'z', sliceIndex = 0) {
    const kernel3D = this.lattices3D.get(kernelId);
    if (!kernel3D) return null;

    const { lattice3D, latticeSize } = kernel3D;
    const { x: width, y: height, z: depth } = latticeSize;

    let slice;
    switch (axis) {
      case 'x':
        slice = new Float32Array(height * depth);
        for (let z = 0; z < depth; z++) {
          for (let y = 0; y < height; y++) {
            const idx3D = z * width * height + y * width + sliceIndex;
            const idx2D = z * height + y;
            slice[idx2D] = lattice3D[idx3D];
          }
        }
        return { data: slice, width: height, height: depth };

      case 'y':
        slice = new Float32Array(width * depth);
        for (let z = 0; z < depth; z++) {
          for (let x = 0; x < width; x++) {
            const idx3D = z * width * height + sliceIndex * width + x;
            const idx2D = z * width + x;
            slice[idx2D] = lattice3D[idx3D];
          }
        }
        return { data: slice, width: width, height: depth };

      case 'z':
      default:
        slice = new Float32Array(width * height);
        const zOffset = sliceIndex * width * height;
        for (let i = 0; i < width * height; i++) {
          slice[i] = lattice3D[zOffset + i];
        }
        return { data: slice, width: width, height: height };
    }
  }

  /**
   * Get available extrusion methods
   */
  getExtrusionMethods() {
    return Array.from(this.extrusionMethods.entries()).map(([name, method]) => ({
      name,
      description: method.description
    }));
  }

  /**
   * Get 3D kernel statistics
   */
  getKernelStats(kernelId) {
    const kernel3D = this.lattices3D.get(kernelId);
    if (!kernel3D) return null;

    const { lattice3D, latticeSize } = kernel3D;
    const totalVoxels = latticeSize.x * latticeSize.y * latticeSize.z;

    let occupiedVoxels = 0;
    let totalIntensity = 0;
    let maxIntensity = 0;

    for (const value of lattice3D) {
      if (value > 0.01) occupiedVoxels++;
      totalIntensity += value;
      maxIntensity = Math.max(maxIntensity, value);
    }

    const volume = latticeSize.x * latticeSize.y * latticeSize.z;
    const density = occupiedVoxels / volume;
    const avgIntensity = totalIntensity / totalVoxels;

    return {
      kernelId,
      latticeSize,
      totalVoxels,
      occupiedVoxels,
      density,
      avgIntensity,
      maxIntensity,
      volume,
      extrusionMethod: kernel3D.extrusionMethod
    };
  }

  /**
   * List all 3D kernels
   */
  list3DKernels() {
    return Array.from(this.lattices3D.keys()).map(kernelId => ({
      id: kernelId,
      stats: this.getKernelStats(kernelId)
    }));
  }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SVGKernel3DSystem };
}

