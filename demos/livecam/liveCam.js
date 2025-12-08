/**
 * Livecam Demo - Initialization script
 * 
 * Uses ES6 modules from src/
 */

import {
    SVGKernelSystem,
    VideoCapture,
    EdgeTracker,
    ThetaStar,
    GainScheduler,
    FractalSobelWavelet,
    Sobel,
    Convolution,
    Vision
} from '../../src/sageString.js';

let kernelSystem;
let vision;
let videoCapture;
let edgeTracker;
let videoKernel = null;

function initializeCETower() {
    kernelSystem = new SVGKernelSystem();
    videoCapture = new VideoCapture();
    
    // Create edge tracker with continuity regularization
    edgeTracker = new EdgeTracker({
        c: 1.0,        // spatial coupling (will be scheduled)
        alpha: 1.0,    // scale coupling (will be scheduled)
        beta: 0.5,     // data fidelity (will be scheduled)
        fractalType: 'dyadic' // or 'feigenbaum', 'golden'
    });
    
    // Create θ⋆ kernel system
    const thetaStar = new ThetaStar();
    
    // Create gain scheduler to adapt parameters (phase-aware)
    const gainScheduler = new GainScheduler({
        smoothing: 0.1, // Smooth gain transitions
        thetaStar: thetaStar // Pass θ⋆ for phase coherence computation
    });
    const stability = thetaStar.checkStability();
    console.log('θ⋆ stability:', stability);
    
    // Create fractal Sobel mother wavelet parameterized by θ⋆
    const wavelet = new FractalSobelWavelet(thetaStar);
    
    // Verify scale-phase condition
    const testScales = edgeTracker.scales;
    const phaseCheck = wavelet.verifyScalePhaseCondition(256, testScales);
    console.log('Wavelet phase condition:', phaseCheck);
    
    // Test edge response at reference scale
    const edgeTest = wavelet.testEdgeResponse(256);
    console.log('Edge response test:', {
        maxMagnitude: edgeTest.maxMagnitude,
        aligned: edgeTest.aligned
    });
    
    // Use θ⋆-parameterized fractal Sobel wavelet
    const sobel = new Sobel({
        useThetaStar: true,
        thetaStar: thetaStar,
        wavelet: wavelet
    });
    
    vision = new Vision(new Convolution(), videoCapture, edgeTracker, sobel, gainScheduler);
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
            videoKernel = kernel;
            updateRealTimeSVG(kernel);
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

function updateRealTimeSVG(kernel) {
    if (!kernel || !kernel.lattice) return;
    const container = document.getElementById('ce1-svg-display');
    if (!container) return;
    try {
        const svg = kernelSystem.renderKernelToSVG(kernel);
        if (svg) {
            container.innerHTML = svg;
        }
    } catch (e) {
        console.error('SVG rendering error:', e);
    }
}

// Make functions globally available immediately
window.startVideoCapture = startVideoCapture;
window.stopVideoCapture = stopVideoCapture;

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initializeCETower();
    
    // Attach event listeners
    const startBtn = document.getElementById('start-video-btn');
    const stopBtn = document.getElementById('stop-video-btn');
    if (startBtn) startBtn.addEventListener('click', startVideoCapture);
    if (stopBtn) stopBtn.addEventListener('click', stopVideoCapture);
});

