/**
 * SVG Kernel Computer Vision System: Real-Time Pattern Recognition
 *
 * Extends the SVG kernel system with real-time video processing,
 * enabling live pattern detection and self-evolving recognition
 * on streaming visual data.
 */

class SVGKernelCVSystem {
  /**
   * Real-time computer vision integration
   */
  constructor(svgKernelSystem, options = {}) {
    this.kernelSystem = svgKernelSystem;
    this.videoElement = null;
    this.canvasElement = null;
    this.stream = null;
    this.isRunning = false;
    this.frameRate = options.frameRate || 30;
    this.resolution = options.resolution || { width: 640, height: 480 };

    // Processing state
    this.currentFrame = null;
    this.processedFrames = 0;
    this.detectionHistory = [];
    this.temporalBuffer = [];
    this.bufferSize = options.bufferSize || 10;

    // Performance tracking
    this.frameTimes = [];
    this.detectionStats = {
      totalFrames: 0,
      detections: 0,
      avgConfidence: 0,
      avgProcessingTime: 0
    };

    console.log('📹 SVG Kernel CV System initialized');
  }

  /**
   * Initialize video capture
   */
  async initializeVideo(options = {}) {
    try {
      // Get user media
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: this.resolution.width,
          height: this.resolution.height,
          frameRate: this.frameRate,
          facingMode: options.facingMode || 'user'
        }
      });

      // Create video element
      this.videoElement = document.createElement('video');
      this.videoElement.srcObject = this.stream;
      this.videoElement.autoplay = true;
      this.videoElement.muted = true;

      // Create processing canvas
      this.canvasElement = document.createElement('canvas');
      this.canvasElement.width = this.resolution.width;
      this.canvasElement.height = this.resolution.height;

      console.log('🎥 Video capture initialized');
      return { video: this.videoElement, canvas: this.canvasElement };

    } catch (error) {
      console.error('Failed to initialize video:', error);
      throw error;
    }
  }

  /**
   * Start real-time pattern detection
   */
  async startDetection(options = {}) {
    if (!this.videoElement || !this.canvasElement) {
      throw new Error('Video not initialized. Call initializeVideo() first.');
    }

    this.isRunning = true;
    const ctx = this.canvasElement.getContext('2d');

    const processFrame = async () => {
      if (!this.isRunning) return;

      const startTime = performance.now();

      try {
        // Capture frame
        ctx.drawImage(this.videoElement, 0, 0,
                     this.canvasElement.width, this.canvasElement.height);

        // Get image data
        const imageData = ctx.getImageData(0, 0,
                                          this.canvasElement.width,
                                          this.canvasElement.height);

        // Process frame
        const detections = await this.processFrame(imageData, options);

        // Update statistics
        const processingTime = performance.now() - startTime;
        this.updateStats(detections, processingTime);

        // Store in temporal buffer
        this.temporalBuffer.push({
          timestamp: startTime,
          frame: imageData,
          detections: detections,
          processingTime: processingTime
        });

        if (this.temporalBuffer.length > this.bufferSize) {
          this.temporalBuffer.shift();
        }

        // Emit results
        if (options.onFrameProcessed) {
          options.onFrameProcessed({
            detections,
            processingTime,
            stats: this.detectionStats,
            frameNumber: this.processedFrames
          });
        }

        this.processedFrames++;

      } catch (error) {
        console.error('Frame processing error:', error);
      }

      // Schedule next frame
      if (this.isRunning) {
        requestAnimationFrame(processFrame);
      }
    };

    // Start processing loop
    requestAnimationFrame(processFrame);
    console.log('🚀 Real-time detection started');
  }

  /**
   * Stop detection
   */
  stopDetection() {
    this.isRunning = false;

    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    console.log('⏹️ Detection stopped');
  }

  /**
   * Process single frame
   */
  async processFrame(imageData, options = {}) {
    const detections = [];

    // Convert frame to lattice format
    const frameLattice = this.frameToLattice(imageData);

    // Apply temporal filtering if enabled
    const filteredLattice = options.temporalFilter ?
      this.applyTemporalFilter(frameLattice) : frameLattice;

    // Run detection with all kernels
    for (const [kernelId, kernel] of this.kernelSystem.kernels) {
      const kernelDetections = await this.detectWithKernel(
        kernelId, filteredLattice, options
      );

      detections.push(...kernelDetections);
    }

    // Apply non-maximum suppression
    const suppressedDetections = this.nonMaximumSuppression(detections, options.nmsThreshold || 0.3);

    // Filter by confidence
    const confidentDetections = suppressedDetections.filter(
      d => d.confidence > (options.confidenceThreshold || 0.5)
    );

    // Store detection history
    this.detectionHistory.push({
      timestamp: performance.now(),
      detections: confidentDetections,
      frameLattice: filteredLattice
    });

    // Limit history size
    if (this.detectionHistory.length > 100) {
      this.detectionHistory.shift();
    }

    return confidentDetections;
  }

  /**
   * Start livecam processing (simplified interface for liveCam.html)
   */
  async startLivecam(options = {}) {
    const { videoElement, overlayCanvas, onFrame } = options;
    
    if (!videoElement) {
      throw new Error('videoElement required');
    }
    
    // Get or create stream
    if (!this.stream) {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      });
      videoElement.srcObject = this.stream;
      videoElement.play();
    }
    
    // Setup overlay canvas
    if (overlayCanvas) {
      overlayCanvas.width = 640;
      overlayCanvas.height = 480;
    }
    
    this.isRunning = true;
    
    const processFrame = () => {
      if (!this.isRunning) return;
      
      try {
        // Capture frame
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = 640;
        tempCanvas.height = 480;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.drawImage(videoElement, 0, 0);
        
        // Convert to lattice
        const imageData = tempCtx.getImageData(0, 0, 640, 480);
        const lattice = this.frameToLattice(imageData);
        
        // Create or update kernel
        const kernel = {
          id: 'video',
          lattice: lattice,
          edges: null
        };
        
        // Call callback
        if (onFrame) {
          onFrame(kernel);
        }
        
        // Draw overlay
        if (overlayCanvas && kernel.edges) {
          this.drawOverlay(kernel, overlayCanvas);
        }
        
      } catch (error) {
        console.error('Frame processing error:', error);
      }
      
      if (this.isRunning) {
        requestAnimationFrame(processFrame);
      }
    };
    
    requestAnimationFrame(processFrame);
  }
  
  /**
   * Draw overlay on canvas
   */
  drawOverlay(kernel, canvas) {
    if (!kernel || !kernel.edges) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const size = Math.sqrt(kernel.lattice.length);
    const scale = canvas.width / size;
    const edges = kernel.edges;
    
    // Draw edges
    ctx.fillStyle = '#ff0000';
    for (let y = 0; y < size; y += 2) {
      for (let x = 0; x < size; x += 2) {
        const idx = y * size + x;
        const mag = edges.magnitude[idx];
        if (mag > 0.2) {
          ctx.globalAlpha = Math.min(1.0, mag) * 0.8;
          ctx.fillRect(x * scale, y * scale, scale * 2, scale * 2);
        }
      }
    }
    ctx.globalAlpha = 1.0;
  }

  /**
   * Convert frame to lattice
   */
  frameToLattice(imageData) {
    const { width, height, data } = imageData;
    const latticeSize = 256; // Match kernel lattice size
    const lattice = new Float32Array(latticeSize * latticeSize);

    // Downsample and convert to grayscale
    const scaleX = width / latticeSize;
    const scaleY = height / latticeSize;

    for (let y = 0; y < latticeSize; y++) {
      for (let x = 0; x < latticeSize; x++) {
        const srcX = Math.floor(x * scaleX);
        const srcY = Math.floor(y * scaleY);
        const idx = (srcY * width + srcX) * 4;

        const r = data[idx] / 255;
        const g = data[idx + 1] / 255;
        const b = data[idx + 2] / 255;

        // Convert to luminance
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        lattice[y * latticeSize + x] = lum;
      }
    }

    return lattice;
  }

  /**
   * Apply temporal filtering for stability
   */
  applyTemporalFilter(currentLattice) {
    if (this.temporalBuffer.length < 3) return currentLattice;

    const filtered = new Float32Array(currentLattice.length);

    // Exponential moving average with recent frames
    const alpha = 0.3; // Smoothing factor
    let accumulator = new Float32Array(currentLattice.length);

    // Average recent frames
    for (const frame of this.temporalBuffer.slice(-3)) {
      for (let i = 0; i < accumulator.length; i++) {
        accumulator[i] += frame.frameLattice ? frame.frameLattice[i] : 0;
      }
    }

    for (let i = 0; i < accumulator.length; i++) {
      accumulator[i] /= Math.min(3, this.temporalBuffer.length);
    }

    // Apply exponential smoothing
    for (let i = 0; i < filtered.length; i++) {
      filtered[i] = alpha * currentLattice[i] + (1 - alpha) * accumulator[i];
    }

    return filtered;
  }

  /**
   * Detect patterns with specific kernel
   */
  async detectWithKernel(kernelId, frameLattice, options = {}) {
    const kernel = this.kernelSystem.kernels.get(kernelId);
    if (!kernel) return [];

    const detections = [];

    // Evolve kernel with frame input
    const evolvedLattice = this.kernelSystem.evolveLattice(kernelId, frameLattice);

    // Apply kernel-specific invariants
    const invariantLattice = this.applyDetectionInvariants(evolvedLattice, kernel.invariants);

    // Find local maxima above threshold
    const threshold = options.detectionThreshold || 0.7;
    const peaks = this.findLocalMaxima(invariantLattice, threshold);

    // Convert peaks to detections
    for (const peak of peaks) {
      const confidence = peak.value;

      // Compute scale and rotation if invariants allow
      const scale = this.estimateScale(kernel, frameLattice, peak.x, peak.y);
      const rotation = this.estimateRotation(kernel, frameLattice, peak.x, peak.y);

      detections.push({
        kernelId,
        position: { x: peak.x, y: peak.y },
        confidence,
        scale,
        rotation,
        boundingBox: this.computeBoundingBox(kernel, peak.x, peak.y, scale),
        timestamp: performance.now(),
        frameNumber: this.processedFrames
      });
    }

    return detections;
  }

  /**
   * Apply detection-specific invariants
   */
  applyDetectionInvariants(lattice, invariants) {
    const size = Math.sqrt(lattice.length);
    let processed = new Float32Array(lattice);

    for (const invariant of invariants) {
      if (!invariant.enabled) continue;

      switch (invariant.type) {
        case 'scale-invariance':
          processed = this.applyScaleInvarianceDetection(processed, size);
          break;
        case 'rotation-invariance':
          processed = this.applyRotationInvarianceDetection(processed, size);
          break;
        case 'mirror-symmetry':
          processed = this.applyMirrorSymmetryDetection(processed, size);
          break;
      }
    }

    return processed;
  }

  /**
   * Scale-invariant detection
   */
  applyScaleInvarianceDetection(lattice, size) {
    const scales = [0.5, 0.707, 1.0, 1.414, 2.0];
    const maxResponse = new Float32Array(lattice.length);

    for (const scale of scales) {
      const scaled = this.scaleLattice(lattice, size, scale);
      for (let i = 0; i < maxResponse.length; i++) {
        maxResponse[i] = Math.max(maxResponse[i], scaled[i]);
      }
    }

    return maxResponse;
  }

  /**
   * Find local maxima in lattice
   */
  findLocalMaxima(lattice, threshold) {
    const size = Math.sqrt(lattice.length);
    const peaks = [];
    const visited = new Set();

    for (let y = 1; y < size - 1; y++) {
      for (let x = 1; x < size - 1; x++) {
        const idx = y * size + x;
        const value = lattice[idx];

        if (value < threshold) continue;

        // Check if local maximum
        let isLocalMax = true;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;

            const nx = x + dx;
            const ny = y + dy;
            const nidx = ny * size + nx;

            if (lattice[nidx] > value) {
              isLocalMax = false;
              break;
            }
          }
          if (!isLocalMax) break;
        }

        if (isLocalMax && !visited.has(idx)) {
          peaks.push({ x, y, value });
          visited.add(idx);
        }
      }
    }

    return peaks;
  }

  /**
   * Non-maximum suppression
   */
  nonMaximumSuppression(detections, threshold) {
    // Sort by confidence
    detections.sort((a, b) => b.confidence - a.confidence);

    const suppressed = [];

    for (const detection of detections) {
      let keep = true;

      for (const kept of suppressed) {
        const distance = Math.sqrt(
          Math.pow(detection.position.x - kept.position.x, 2) +
          Math.pow(detection.position.y - kept.position.y, 2)
        );

        // If detections are too close and current has lower confidence
        if (distance < threshold && detection.confidence < kept.confidence) {
          keep = false;
          break;
        }
      }

      if (keep) {
        suppressed.push(detection);
      }
    }

    return suppressed;
  }

  /**
   * Estimate scale at detection point
   */
  estimateScale(kernel, frameLattice, x, y) {
    // Simplified scale estimation based on local variance
    const size = Math.sqrt(frameLattice.length);
    const radius = 8;
    let localVariance = 0;
    let count = 0;

    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const nx = x + dx;
        const ny = y + dy;

        if (nx >= 0 && nx < size && ny >= 0 && ny < size) {
          const distance = Math.sqrt(dx*dx + dy*dy);
          if (distance <= radius) {
            const idx = ny * size + nx;
            localVariance += Math.pow(frameLattice[idx] - 0.5, 2);
            count++;
          }
        }
      }
    }

    localVariance = count > 0 ? localVariance / count : 0;

    // Map variance to scale estimate
    return 1.0 + (localVariance - 0.1) * 2.0; // Rough heuristic
  }

  /**
   * Estimate rotation at detection point
   */
  estimateRotation(kernel, frameLattice, x, y) {
    // Simplified rotation estimation using gradient direction
    const size = Math.sqrt(frameLattice.length);

    if (x <= 0 || x >= size - 1 || y <= 0 || y >= size - 1) {
      return 0;
    }

    const idx = y * size + x;
    const dx = frameLattice[y * size + (x + 1)] - frameLattice[y * size + (x - 1)];
    const dy = frameLattice[(y + 1) * size + x] - frameLattice[(y - 1) * size + x];

    return Math.atan2(dy, dx);
  }

  /**
   * Compute bounding box for detection
   */
  computeBoundingBox(kernel, x, y, scale) {
    const baseSize = 32; // Base kernel size
    const scaledSize = baseSize * scale;

    return {
      x: Math.max(0, x - scaledSize / 2),
      y: Math.max(0, y - scaledSize / 2),
      width: scaledSize,
      height: scaledSize
    };
  }

  /**
   * Update detection statistics
   */
  updateStats(detections, processingTime) {
    this.detectionStats.totalFrames++;

    if (detections.length > 0) {
      this.detectionStats.detections += detections.length;
      const avgConf = detections.reduce((sum, d) => sum + d.confidence, 0) / detections.length;
      this.detectionStats.avgConfidence = 0.9 * this.detectionStats.avgConfidence + 0.1 * avgConf;
    }

    this.frameTimes.push(processingTime);
    if (this.frameTimes.length > 100) {
      this.frameTimes.shift();
    }

    this.detectionStats.avgProcessingTime =
      this.frameTimes.reduce((sum, t) => sum + t, 0) / this.frameTimes.length;
  }

  /**
   * Get detection statistics
   */
  getStats() {
    return {
      ...this.detectionStats,
      fps: this.frameTimes.length > 0 ? 1000 / this.detectionStats.avgProcessingTime : 0,
      isRunning: this.isRunning,
      bufferSize: this.temporalBuffer.length,
      historySize: this.detectionHistory.length
    };
  }

  /**
   * Visualize detections on canvas
   */
  visualizeDetections(canvas, detections, options = {}) {
    const ctx = canvas.getContext('2d');
    const { width, height } = canvas;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw detections
    for (const detection of detections) {
      const { position, confidence, boundingBox, kernelId } = detection;

      // Scale coordinates to canvas
      const scaleX = width / 256; // Assuming 256x256 lattice
      const scaleY = height / 256;

      const canvasX = position.x * scaleX;
      const canvasY = position.y * scaleY;
      const boxWidth = boundingBox.width * scaleX;
      const boxHeight = boundingBox.height * scaleY;

      // Color based on kernel
      const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24'];
      const kernelIndex = Array.from(this.kernelSystem.kernels.keys()).indexOf(kernelId);
      const color = colors[kernelIndex % colors.length];

      // Draw bounding box
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.strokeRect(
        canvasX - boxWidth / 2,
        canvasY - boxHeight / 2,
        boxWidth,
        boxHeight
      );

      // Draw confidence text
      ctx.fillStyle = color;
      ctx.font = '12px monospace';
      ctx.fillText(
        `${kernelId}: ${(confidence * 100).toFixed(1)}%`,
        canvasX - boxWidth / 2,
        canvasY - boxHeight / 2 - 5
      );

      // Draw center point
      ctx.beginPath();
      ctx.arc(canvasX, canvasY, 3, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();
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
   * Export detection data
   */
  exportDetectionData() {
    return {
      history: this.detectionHistory,
      stats: this.detectionStats,
      temporalBuffer: this.temporalBuffer,
      config: {
        frameRate: this.frameRate,
        resolution: this.resolution,
        bufferSize: this.bufferSize
      }
    };
  }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SVGKernelCVSystem };
}

