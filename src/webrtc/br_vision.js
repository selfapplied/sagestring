/**
 * BR Vision - Bateman-Reiss self-boundary processing
 * 
 * Extends Vision with Bateman-Reiss characteristic flow for self-boundary extraction
 */

import { Vision } from './vision.js';
import { BatemanReiss } from '../math/bateman_reiss.js';
import { BRRenderer } from '../math/br_renderer.js';

class BRVision extends Vision {
  constructor(convolution, videoCapture, edgeTracker = null, sobel = null, gainScheduler = null, options = {}) {
    super(convolution, videoCapture, edgeTracker, sobel, gainScheduler);
    
    this.br = new BatemanReiss(options.br || {});
    this.brRenderer = new BRRenderer(options.renderer || {});
    this.enableBR = options.enableBR !== false; // Enabled by default
    this.lastBoundaries = [];
  }

  /**
   * Process frame with Bateman-Reiss self-boundary extraction
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
    
    // Extract self-boundaries via Bateman-Reiss flow
    let boundaries = [];
    if (this.enableBR) {
      try {
        const result = this.br.extractBoundaries(lattice, size);
        boundaries = result.boundaries;
        this.lastBoundaries = boundaries;
      } catch (e) {
        console.error('BR extraction error:', e);
      }
    }
    
    // Also compute Sobel edges (for compatibility)
    let edges = null;
    try {
      edges = this.sobel.compute(lattice, size);
    } catch (e) {
      console.error('Sobel computation error:', e);
    }
    
    const kernel = {
      id: 'video',
      lattice: lattice,
      edges: edges,
      boundaries: boundaries
    };

    if (onFrame) {
      onFrame(kernel);
    }

    if (overlayCanvas) {
      this.drawBROverlay(kernel, overlayCanvas, size);
    }

    requestAnimationFrame(() => this.processLoop(videoElement, overlayCanvas, onFrame));
  }

  /**
   * Draw Bateman-Reiss boundaries as overlay
   */
  drawBROverlay(kernel, canvas, size) {
    if (!kernel || !kernel.boundaries) return;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const scaleX = canvas.width / size;
    const scaleY = canvas.height / size;
    const scale = Math.min(scaleX, scaleY);
    
    this.brRenderer.renderToCanvas(ctx, kernel.boundaries, scale);
  }

  /**
   * Get SVG overlay for boundaries
   */
  getSVGOverlay(size) {
    if (!this.lastBoundaries || this.lastBoundaries.length === 0) {
      return '<svg></svg>';
    }
    return this.brRenderer.renderBoundaries(this.lastBoundaries, size);
  }
}

export { BRVision };

