/**
 * Video Capture - Get frames from camera
 * 
 * Single responsibility: Capture video frames and convert to image data
 */

class VideoCapture {
  constructor() {
    this.stream = null;
    this.videoElement = null;
  }

  /**
   * Start video capture
   */
  async start(videoElement, options = {}) {
    this.videoElement = videoElement;
    
    this.stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: options.width || 640 },
        height: { ideal: options.height || 480 },
        facingMode: options.facingMode || 'user'
      }
    });

    videoElement.srcObject = this.stream;
    videoElement.play();
  }

  /**
   * Stop video capture
   */
  stop() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
  }

  /**
   * Capture current frame as image data
   */
  captureFrame() {
    if (!this.videoElement) return null;

    const canvas = document.createElement('canvas');
    canvas.width = this.videoElement.videoWidth || 640;
    canvas.height = this.videoElement.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(this.videoElement, 0, 0);
    
    return ctx.getImageData(0, 0, canvas.width, canvas.height);
  }

  /**
   * Convert image data to lattice
   */
  imageDataToLattice(imageData, latticeSize = 256) {
    const { width, height, data } = imageData;
    const lattice = new Float32Array(latticeSize * latticeSize);
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
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        lattice[y * latticeSize + x] = lum;
      }
    }

    return lattice;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { VideoCapture };
}

