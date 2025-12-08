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
    
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: options.width || 640 },
          height: { ideal: options.height || 480 },
          facingMode: options.facingMode || 'user'
        }
      });

      videoElement.srcObject = this.stream;
      
      // Wait for video to be ready
      await new Promise((resolve, reject) => {
        videoElement.onloadedmetadata = () => {
          videoElement.play().then(resolve).catch(reject);
        };
        videoElement.onerror = reject;
        
        // Timeout after 5 seconds
        setTimeout(() => reject(new Error('Video load timeout')), 5000);
      });
    } catch (error) {
      console.error('Error starting video capture:', error);
      throw error;
    }
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
    
    // Check if video is ready
    if (this.videoElement.readyState < 2) return null;
    
    const width = this.videoElement.videoWidth;
    const height = this.videoElement.videoHeight;
    
    if (!width || !height || width === 0 || height === 0) return null;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
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

export { VideoCapture };

