/**
 * SVG Kernel ↔ Computer Vision Integration
 *
 * Bridges the SVG kernel system with the existing computer vision pipeline,
 * enabling pattern recognition through declarative geometric kernels.
 */

class SVGKernelCVBridge {
  /**
   * Bridge between SVG kernels and CV system
   */
  constructor(svgKernelSystem, cvSystem) {
    this.kernelSystem = svgKernelSystem;
    this.cvSystem = cvSystem;

    // Integration state
    this.activeKernels = new Map();
    this.detectionHistory = [];
    this.frameBuffer = [];
  }

  /**
   * Register kernel for CV pattern detection
   */
  registerKernelForDetection(kernelId, options = {}) {
    const kernel = this.kernelSystem.kernels.get(kernelId);
    if (!kernel) return false;

    this.activeKernels.set(kernelId, {
      kernel: kernel,
      sensitivity: options.sensitivity || 0.7,
      scaleRange: options.scaleRange || [0.5, 2.0],
      rotationSteps: options.rotationSteps || 8,
      lastDetections: [],
      confidence: 0
    });

    console.log(`🔗 Registered kernel '${kernelId}' for CV pattern detection`);
    return true;
  }

  /**
   * Process video frame through kernel system
   */
  processFrame(frameData, options = {}) {
    if (!frameData || !frameData.data) return [];

    const timestamp = performance.now();
    const allDetections = [];

    // Process each registered kernel
    for (const [kernelId, kernelState] of this.activeKernels) {
      const detections = this.detectWithKernel(kernelId, frameData, kernelState, options);
      allDetections.push(...detections);
    }

    // Store detection history
    this.detectionHistory.push({
      timestamp: timestamp,
      detections: allDetections,
      frameIndex: this.frameBuffer.length
    });

    // Maintain history buffer
    if (this.detectionHistory.length > 100) {
      this.detectionHistory.shift();
    }

    return allDetections;
  }

  /**
   * Detect patterns using specific kernel
   */
  detectWithKernel(kernelId, frameData, kernelState, options) {
    const detections = [];

    // Convert frame to lattice format
    const frameLattice = this.kernelSystem.frameToLattice(frameData);

    // Multi-scale detection
    const scales = this.generateScaleRange(kernelState.scaleRange);

    for (const scale of scales) {
      // Scale the frame lattice
      const scaledFrame = this.scaleLattice(frameLattice,
        Math.sqrt(frameLattice.length), scale);

      // Multi-orientation detection
      for (let rot = 0; rot < kernelState.rotationSteps; rot++) {
        const angle = (rot / kernelState.rotationSteps) * 360;
        const rotatedFrame = this.rotateLattice(scaledFrame,
          Math.sqrt(scaledFrame.length), angle);

        // Evolve kernel with frame input
        const evolvedLattice = this.kernelSystem.evolveLattice(kernelId, rotatedFrame);

        // Extract detections
        const kernelDetections = this.kernelSystem.extractDetections(
          evolvedLattice,
          this.kernelSystem.kernels.get(kernelId)
        );

        // Filter and transform detections
        for (const det of kernelDetections) {
          if (det.confidence >= kernelState.sensitivity) {
            // Transform back to original coordinate system
            const transformedDet = this.transformDetection(det, scale, angle, frameData);
            detections.push({
              ...transformedDet,
              kernelId: kernelId,
              scale: scale,
              rotation: angle,
              method: 'svg_kernel'
            });
          }
        }
      }
    }

    // Update kernel state
    kernelState.lastDetections = detections;
    kernelState.confidence = detections.length > 0 ?
      Math.max(...detections.map(d => d.confidence)) : 0;

    return detections;
  }

  /**
   * Generate scale range for multi-scale detection
   */
  generateScaleRange(range) {
    const [minScale, maxScale] = range;
    const steps = 5;
    const scales = [];

    for (let i = 0; i < steps; i++) {
      const scale = minScale + (maxScale - minScale) * (i / (steps - 1));
      scales.push(scale);
    }

    return scales;
  }

  /**
   * Scale lattice by factor
   */
  scaleLattice(lattice, size, scale) {
    const newSize = Math.floor(size * scale);
    const scaled = new Float32Array(newSize * newSize);

    for (let y = 0; y < newSize; y++) {
      for (let x = 0; x < newSize; x++) {
        const srcX = Math.floor(x / scale);
        const srcY = Math.floor(y / scale);

        if (srcX < size && srcY < size) {
          scaled[y * newSize + x] = lattice[srcY * size + srcX];
        }
      }
    }

    return scaled;
  }

  /**
   * Rotate lattice by angle
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
   * Transform detection back to frame coordinates
   */
  transformDetection(detection, scale, angle, frameData) {
    const latticeSize = Math.sqrt(this.kernelSystem.kernels.get(detection.kernelId).lattice.length);

    // Transform position back to frame coordinates
    let x = detection.position.x / latticeSize * frameData.width;
    let y = detection.position.y / latticeSize * frameData.height;

    // Apply inverse scale
    x /= scale;
    y /= scale;

    // Apply inverse rotation (simplified - would need proper inverse transform)
    const radians = -(angle * Math.PI) / 180;
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);
    const centerX = frameData.width / 2;
    const centerY = frameData.height / 2;

    const dx = x - centerX;
    const dy = y - centerY;
    const rx = dx * cos - dy * sin + centerX;
    const ry = dx * sin + dy * cos + centerY;

    return {
      ...detection,
      position: { x: rx, y: ry },
      bounds: this.calculateDetectionBounds(rx, ry, scale, frameData)
    };
  }

  /**
   * Calculate detection bounding box
   */
  calculateDetectionBounds(x, y, scale, frameData) {
    const size = 50 / scale; // Base size adjusted by scale

    return {
      left: Math.max(0, x - size/2),
      top: Math.max(0, y - size/2),
      right: Math.min(frameData.width, x + size/2),
      bottom: Math.min(frameData.height, y + size/2),
      width: size,
      height: size
    };
  }

  /**
   * Integrate with existing CV pipeline
   */
  integrateWithCVPipeline(frameData) {
    // First run traditional CV detection
    const traditionalDetections = this.cvSystem ?
      this.cvSystem.detectBoundaries(frameData) : { boundaries: [], magnitude: [], direction: [] };

    // Then run kernel-based detection
    const kernelDetections = this.processFrame(frameData);

    // Fuse detections
    const fusedDetections = this.fuseDetections(traditionalDetections, kernelDetections, frameData);

    return {
      traditional: traditionalDetections,
      kernel: kernelDetections,
      fused: fusedDetections
    };
  }

  /**
   * Fuse traditional CV and kernel detections
   */
  fuseDetections(traditional, kernel, frameData) {
    const fused = [...kernel]; // Start with kernel detections

    // Add traditional detections that don't conflict with kernel ones
    if (traditional.boundaries) {
      // Convert traditional boundaries to detection format
      const traditionalDets = this.convertBoundariesToDetections(
        traditional.boundaries,
        traditional.magnitude,
        frameData.width,
        frameData.height
      );

      // Filter out detections that overlap with kernel detections
      for (const tradDet of traditionalDets) {
        const conflicts = fused.some(kernelDet =>
          this.detectionsOverlap(tradDet, kernelDet)
        );

        if (!conflicts) {
          fused.push({
            ...tradDet,
            method: 'traditional_cv'
          });
        }
      }
    }

    return fused;
  }

  /**
   * Convert boundary data to detection format
   */
  convertBoundariesToDetections(boundaries, magnitude, width, height) {
    const detections = [];
    const threshold = 100; // Magnitude threshold

    for (let i = 0; i < boundaries.length; i++) {
      if (magnitude[i] > threshold) {
        const x = i % width;
        const y = Math.floor(i / width);

        detections.push({
          position: { x, y },
          confidence: magnitude[i] / 255,
          method: 'boundary',
          bounds: {
            left: x - 2, top: y - 2,
            right: x + 2, bottom: y + 2,
            width: 4, height: 4
          }
        });
      }
    }

    return detections;
  }

  /**
   * Check if two detections overlap
   */
  detectionsOverlap(det1, det2) {
    const b1 = det1.bounds;
    const b2 = det2.bounds;

    return !(b1.right < b2.left ||
             b1.left > b2.right ||
             b1.bottom < b2.top ||
             b1.top > b2.bottom);
  }

  /**
   * Adapt kernels based on detection performance
   */
  adaptKernels() {
    for (const [kernelId, state] of this.activeKernels) {
      const recentDetections = this.detectionHistory
        .slice(-10) // Last 10 frames
        .flatMap(h => h.detections.filter(d => d.kernelId === kernelId));

      if (recentDetections.length > 0) {
        // Adjust sensitivity based on detection frequency
        const avgConfidence = recentDetections.reduce((sum, d) => sum + d.confidence, 0) / recentDetections.length;

        if (avgConfidence > 0.8) {
          state.sensitivity = Math.min(0.9, state.sensitivity + 0.05);
        } else if (avgConfidence < 0.3) {
          state.sensitivity = Math.max(0.3, state.sensitivity - 0.05);
        }

        // Adjust scale range based on detection scales
        const scales = recentDetections.map(d => d.scale).filter(s => s);
        if (scales.length > 0) {
          const avgScale = scales.reduce((sum, s) => sum + s, 0) / scales.length;
          state.scaleRange = [
            Math.max(0.3, avgScale - 0.3),
            Math.min(3.0, avgScale + 0.3)
          ];
        }
      }
    }
  }

  /**
   * Generate new kernels from successful detections
   */
  generateKernelsFromDetections(minConfidence = 0.8) {
    const successfulDetections = this.detectionHistory
      .flatMap(h => h.detections)
      .filter(d => d.confidence >= minConfidence);

    // Group detections by position clusters
    const clusters = this.clusterDetections(successfulDetections);

    const newKernels = [];

    for (const cluster of clusters) {
      if (cluster.detections.length >= 3) { // Need multiple examples
        const kernel = this.synthesizeKernelFromCluster(cluster);
        if (kernel) {
          newKernels.push(kernel);
        }
      }
    }

    return newKernels;
  }

  /**
   * Cluster detections by spatial proximity
   */
  clusterDetections(detections, maxDistance = 50) {
    const clusters = [];
    const used = new Set();

    for (let i = 0; i < detections.length; i++) {
      if (used.has(i)) continue;

      const cluster = {
        center: { ...detections[i].position },
        detections: [detections[i]],
        bounds: { ...detections[i].bounds }
      };

      used.add(i);

      // Find nearby detections
      for (let j = i + 1; j < detections.length; j++) {
        if (used.has(j)) continue;

        const distance = Math.sqrt(
          Math.pow(detections[i].position.x - detections[j].position.x, 2) +
          Math.pow(detections[i].position.y - detections[j].position.y, 2)
        );

        if (distance <= maxDistance) {
          cluster.detections.push(detections[j]);
          used.add(j);

          // Update cluster bounds
          cluster.bounds.left = Math.min(cluster.bounds.left, detections[j].bounds.left);
          cluster.bounds.top = Math.min(cluster.bounds.top, detections[j].bounds.top);
          cluster.bounds.right = Math.max(cluster.bounds.right, detections[j].bounds.right);
          cluster.bounds.bottom = Math.max(cluster.bounds.bottom, detections[j].bounds.bottom);
        }
      }

      clusters.push(cluster);
    }

    return clusters;
  }

  /**
   * Synthesize SVG kernel from detection cluster
   */
  synthesizeKernelFromCluster(cluster) {
    // Extract common geometric features
    const centerX = (cluster.bounds.left + cluster.bounds.right) / 2;
    const centerY = (cluster.bounds.top + cluster.bounds.bottom) / 2;
    const width = cluster.bounds.right - cluster.bounds.left;
    const height = cluster.bounds.bottom - cluster.bounds.top;

    // Generate SVG based on shape characteristics
    let shapeSVG = '';

    if (width / height > 1.5) {
      // Elongated - likely a line or curve
      shapeSVG = `<path d="M${cluster.bounds.left} ${centerY} L${cluster.bounds.right} ${centerY}" stroke="#ff6600" stroke-width="3" fill="none"/>`;
    } else if (Math.abs(width - height) / Math.max(width, height) < 0.2) {
      // Roughly square/circular
      const radius = Math.min(width, height) / 2;
      shapeSVG = `<circle cx="${centerX}" cy="${centerY}" r="${radius}" stroke="#0066ff" stroke-width="3" fill="none"/>`;
    } else {
      // Irregular - use a simple rectangle approximation
      shapeSVG = `<rect x="${cluster.bounds.left}" y="${cluster.bounds.top}" width="${width}" height="${height}" stroke="#66ff00" stroke-width="2" fill="none"/>`;
    }

    // Create kernel definition
    const kernelXML = `<kernel id="learned_${Date.now()}" energy="1.0" power="2.0">
  <shape>
    ${shapeSVG}
  </shape>
  <discrete>
    <lattice size="256" boundary="wrap"/>
  </discrete>
  <invariants>
    <scale-invariance enabled="true"/>
  </invariants>
</kernel>`;

    // Parse and register the new kernel
    const kernels = this.kernelSystem.parseKernel(kernelXML);
    if (kernels.length > 0) {
      console.log(`🧠 Synthesized new kernel from ${cluster.detections.length} detections`);
      return kernels[0];
    }

    return null;
  }

  /**
   * Get system statistics
   */
  getStatistics() {
    const stats = {
      activeKernels: this.activeKernels.size,
      totalDetections: this.detectionHistory.reduce((sum, h) => sum + h.detections.length, 0),
      averageConfidence: 0,
      detectionRate: 0
    };

    if (this.detectionHistory.length > 0) {
      const recentHistory = this.detectionHistory.slice(-10);
      const totalDetections = recentHistory.reduce((sum, h) => sum + h.detections.length, 0);

      stats.detectionRate = totalDetections / recentHistory.length;

      const confidences = recentHistory
        .flatMap(h => h.detections)
        .map(d => d.confidence);

      if (confidences.length > 0) {
        stats.averageConfidence = confidences.reduce((sum, c) => sum + c, 0) / confidences.length;
      }
    }

    return stats;
  }
}

// Export for integration
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SVGKernelCVBridge };
}


