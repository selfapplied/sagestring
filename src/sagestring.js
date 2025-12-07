/**
 * SageString - Main Library Entry Point
 * 
 * Minimal library for fractal Sobel edge detection with spacetime-scale action functional
 * 
 * ES6 Module Entry Point
 */

// Core modules (math)
export { WaveScheduler } from './math/core.js';

// Math utilities
export { Convolution } from './math/convolution.js';
export { Sobel } from './math/sobel.js';
export { LatticeRenderer } from './math/renderer.js';

// Theoretical components (math)
export { SpacetimeScale } from './math/spacetime_scale.js';
export { EdgeTracker } from './math/edge_tracker.js';
export { ThetaStar } from './math/theta_star.js';
export { FractalSobelWavelet } from './math/fractal_sobel_wavelet.js';
export { GainScheduler } from './math/gain_scheduler.js';

// DOM utilities
export { SVGParser } from './dom/svg_parser.js';

// Canvas utilities
export { LatticeOps } from './canvas/lattice.js';
export { SVGKernelSystem } from './canvas/svg_kernel_system.js';

// WebRTC-specific
export { VideoCapture } from './webrtc/video.js';
export { Vision } from './webrtc/vision.js';

// Harmonic operator (CE1-encoded)
export { HarmonicOperator, CEEvaluator, CEHeight, CEFunctional, CERoots, CE2Lift } from './math/harmonic.js';

