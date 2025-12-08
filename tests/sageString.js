/**
 * Tests for sageString.js (main library entry point)
 * 
 * Integration tests that verify all modules are properly exported
 */

function testSageStringExports() {
  console.log('Testing SageString exports...');
  
  // Verify all expected classes are available
  const expected = [
    'WaveScheduler',
    'SVGParser',
    'LatticeOps',
    'Convolution',
    'Sobel',
    'LatticeRenderer',
    'VideoCapture',
    'SpacetimeScale',
    'EdgeTracker',
    'ThetaStar',
    'FractalSobelWavelet',
    'GainScheduler',
    'SVGKernelSystem',
    'Vision'
  ];
  
  let allPresent = true;
  for (const name of expected) {
    if (typeof window !== 'undefined' && window.SageString && window.SageString[name]) {
      console.log(`✓ ${name} exported`);
    } else if (typeof window !== 'undefined' && window[name]) {
      console.log(`✓ ${name} available as global`);
    } else {
      console.error(`✗ ${name} not found`);
      allPresent = false;
    }
  }
  
  return allPresent;
}

// Run tests if in browser
if (typeof window !== 'undefined') {
  window.testSageString = testSageStringExports;
  
  // Auto-run when library is ready
  window.addEventListener('sagestring:ready', () => {
    testSageStringExports();
  });
}

// Run tests if in Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testSageStringExports };
}




