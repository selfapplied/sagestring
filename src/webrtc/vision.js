/**
 * Vision - Frame processing pipeline
 * 
 * Single responsibility: Process video frames through kernel matching
 */

class Vision {
  constructor(convolution, videoCapture, edgeTracker = null, sobel = null, gainScheduler = null) {
    this.convolution = convolution;
    this.video = videoCapture;
    this.tracker = edgeTracker; // Optional: continuity-regularized edge tracking
    this.sobel = sobel || new Sobel(); // Sobel edge detector
    this.gainScheduler = gainScheduler; // Optional: gain scheduling
    this.isRunning = false;
  }

  /**
   * Start processing frames
   */
  async start(videoElement, overlayCanvas, onFrame) {
    await this.video.start(videoElement);
    
    if (overlayCanvas) {
      overlayCanvas.width = 640;
      overlayCanvas.height = 480;
    }

    this.isRunning = true;
    this.processLoop(videoElement, overlayCanvas, onFrame);
  }

  /**
   * Stop processing
   */
  stop() {
    this.isRunning = false;
    this.video.stop();
  }

  /**
   * Main processing loop
   */
  processLoop(videoElement, overlayCanvas, onFrame) {
    if (!this.isRunning) return;

    const imageData = this.video.captureFrame();
    if (!imageData) {
      requestAnimationFrame(() => this.processLoop(videoElement, overlayCanvas, onFrame));
      return;
    }

    const lattice = this.video.imageDataToLattice(imageData);
    const size = Math.sqrt(lattice.length);
    
    if (!size || size !== size || size <= 0 || !lattice || lattice.length === 0) {
      requestAnimationFrame(() => this.processLoop(videoElement, overlayCanvas, onFrame));
      return;
    }
    
    // Compute Sobel edges
    let edges = null;
    try {
      edges = this.sobel.compute(lattice, size);
      
      // If edge tracker is available, regularize edges for continuity
      if (this.tracker && edges) {
        try {
          // Schedule gains based on operating conditions (now phase-aware)
          if (this.gainScheduler) {
            // Collect phase maps from fractal Sobel wavelet
            const phaseMaps = this.sobel && this.sobel.lastPhaseMaps ? 
              this.sobel.lastPhaseMaps : null;
            
            const frameData = { 
              edges, 
              lattice, 
              size,
              phaseMaps: phaseMaps // From wavelet convolutions
            };
            
            const scheduleResult = this.gainScheduler.schedule(this.tracker, frameData, size);
            
            // Log metrics for debugging (every 30 frames)
            if (this.tracker.frameCount % 30 === 0) {
              const metrics = this.gainScheduler.getMetrics();
              if (metrics) {
                console.log('Gain Scheduler:', {
                  region: scheduleResult.region,
                  phaseCoherence: metrics.phaseCoherence.toFixed(3),
                  motion: metrics.motion.toFixed(3),
                  gains: {
                    c: metrics.gains.c.toFixed(2),
                    alpha: metrics.gains.alpha.toFixed(2),
                    beta: metrics.gains.beta.toFixed(2)
                  }
                });
              }
            }
          }
          
          // Compute multi-scale edges using fractal Sobel wavelet
          const sobelEvidence = this.sobel.computeMultiScale(lattice, size, this.tracker.scales);
          
          // If wavelet provides complex responses, pass them to tracker as φ_init
          const complexEvidence = new Map();
          if (this.sobel.wavelet) {
            for (const sigma of this.tracker.scales) {
              const response = this.sobel.wavelet.convolve(lattice, size, sigma);
              complexEvidence.set(sigma, {
                magnitude: response.magnitude,
                direction: response.phase,
                real: response.real,
                imag: response.imag
              });
            }
          }
          
          // Use complex evidence if available, otherwise use standard
          const evidenceToUse = complexEvidence.size > 0 ? complexEvidence : sobelEvidence;
          this.tracker.update(this.tracker.frameCount + 1, evidenceToUse, size);
          const edgeMap = this.tracker.extractEdges(this.tracker.frameCount, size);
          edges = {
            magnitude: edgeMap,
            direction: edges.direction
          };
        } catch (e) {
          console.error('Edge tracker error:', e);
        }
      }
    } catch (e) {
      console.error('Sobel computation error:', e);
      edges = null;
    }
    
    const kernel = {
      id: 'video',
      lattice: lattice,
      edges: edges
    };

    if (onFrame) {
      onFrame(kernel);
    }

    if (overlayCanvas && kernel.edges) {
      this.drawOverlay(kernel, overlayCanvas);
    }

    requestAnimationFrame(() => this.processLoop(videoElement, overlayCanvas, onFrame));
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
}

export { Vision };
