/**
 * SageString - Main Library Entry Point
 * 
 * Minimal library for fractal Sobel edge detection with spacetime-scale action functional
 * 
 * This file loads all modules in the correct order for browser usage.
 * Include this single file in your HTML instead of loading modules individually.
 */

// Load order matters - dependencies first
(function() {
  'use strict';
  
  // This is a loader script - in browser, modules are loaded via script tags
  // This file just ensures proper namespace setup
  
  // Modules will be available as global classes after script tags load them
  // This file provides a convenient namespace wrapper
  
  if (typeof window !== 'undefined') {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
    
    function init() {
      window.SageString = {
        // Core
        WaveScheduler: typeof WaveScheduler !== 'undefined' ? WaveScheduler : null,
        
        // Livecam
        SVGParser: typeof SVGParser !== 'undefined' ? SVGParser : null,
        LatticeOps: typeof LatticeOps !== 'undefined' ? LatticeOps : null,
        Convolution: typeof Convolution !== 'undefined' ? Convolution : null,
        Sobel: typeof Sobel !== 'undefined' ? Sobel : null,
        LatticeRenderer: typeof LatticeRenderer !== 'undefined' ? LatticeRenderer : null,
        VideoCapture: typeof VideoCapture !== 'undefined' ? VideoCapture : null,
        SVGKernelSystem: typeof SVGKernelSystem !== 'undefined' ? SVGKernelSystem : null,
        Vision: typeof Vision !== 'undefined' ? Vision : null,
        EdgeTracker: typeof EdgeTracker !== 'undefined' ? EdgeTracker : null,
        ThetaStar: typeof ThetaStar !== 'undefined' ? ThetaStar : null,
        FractalSobelWavelet: typeof FractalSobelWavelet !== 'undefined' ? FractalSobelWavelet : null,
        GainScheduler: typeof GainScheduler !== 'undefined' ? GainScheduler : null,
        SpacetimeScale: typeof SpacetimeScale !== 'undefined' ? SpacetimeScale : null
      };
    }
  }
})();
