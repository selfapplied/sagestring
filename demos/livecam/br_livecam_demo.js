/**
 * Bateman-Reiss Livecam Demo
 * 
 * Initializes and manages the self-boundary extraction system
 */

import {
    VideoCapture,
    Convolution,
    BRVision
} from '../../src/sageString.js';

let vision;
let videoCapture;
let frameCount = 0;

function initializeBR() {
    videoCapture = new VideoCapture();
    
    vision = new BRVision(
        new Convolution(),
        videoCapture,
        null, // edgeTracker
        null, // sobel
        null, // gainScheduler
        {
            br: {
                sigma: 2.0,           // Gaussian blur radius
                seedCount: 200,        // Number of seed points
                maxSteps: 1000,        // Max integration steps
                stepSize: 0.1,        // RK4 step size
                closureThreshold: 5.0, // Distance to consider closed
                minLoopLength: 10      // Minimum points for valid loop
            },
            renderer: {
                strokeColor: '#4ecdc4',
                strokeWidth: 1.5,
                opacity: 0.8,
                glow: true
            },
            enableBR: true
        }
    );
}

async function startVideoCapture() {
    if (!vision) {
        console.error('Vision not initialized yet');
        return;
    }
    
    const videoElement = document.getElementById('video-element');
    const overlayCanvas = document.getElementById('video-overlay');
    
    if (!videoElement) {
        console.error('Video element not found');
        return;
    }
    
    try {
        await vision.start(videoElement, overlayCanvas, (kernel) => {
            frameCount++;
            
            // Update SVG overlay every few frames (for performance)
            if (frameCount % 3 === 0 && kernel.boundaries) {
                updateSVGOverlay(kernel);
            }
        });
        
        document.getElementById('start-video-btn').disabled = true;
        document.getElementById('stop-video-btn').disabled = false;
        document.getElementById('video-container').style.display = 'block';
    } catch (error) {
        console.error('Failed to start video capture:', error);
        alert('Failed to start camera. Please check permissions and try again.');
    }
}

function stopVideoCapture() {
    if (!vision) return;
    vision.stop();
    document.getElementById('start-video-btn').disabled = false;
    document.getElementById('stop-video-btn').disabled = true;
    document.getElementById('video-container').style.display = 'none';
}

function updateSVGOverlay(kernel) {
    const container = document.getElementById('svg-overlay');
    if (!container || !kernel.boundaries) return;
    
    const size = Math.sqrt(kernel.lattice.length);
    const svg = vision.getSVGOverlay(size);
    container.innerHTML = svg;
}

// Make functions globally available immediately
window.startVideoCapture = startVideoCapture;
window.stopVideoCapture = stopVideoCapture;

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initializeBR();
    
    // Attach event listeners
    const startBtn = document.getElementById('start-video-btn');
    const stopBtn = document.getElementById('stop-video-btn');
    if (startBtn) startBtn.addEventListener('click', startVideoCapture);
    if (stopBtn) stopBtn.addEventListener('click', stopVideoCapture);
});

