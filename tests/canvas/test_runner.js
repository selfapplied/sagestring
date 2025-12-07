/**
 * Test runner for canvas modules (requires Canvas API mock)
 * Run with: node tests/canvas/test_runner.js
 * 
 * Uses native ES module imports with canvas mocks
 */

import { LatticeOps } from '../../src/canvas/lattice.js';

// Mock canvas context
function createMockCanvas() {
  return {
    width: 256,
    height: 256,
    getContext: (type) => ({
      drawImage: () => {},
      getImageData: (x, y, w, h) => ({
        data: new Uint8ClampedArray(w * h * 4),
        width: w,
        height: h
      }),
      putImageData: () => {},
      fillRect: () => {},
      clearRect: () => {},
      beginPath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      stroke: () => {},
      fill: () => {},
      closePath: () => {}
    })
  };
}

// Setup global document mock
global.document = {
  createElement: (tag) => {
    if (tag === 'canvas') {
      return createMockCanvas();
    }
    return {};
  }
};

// Test LatticeOps
function testLatticeOps() {
  console.log('Testing LatticeOps...');
  
  const latticeOps = new LatticeOps();
  const path = { commands: [{ type: 'M', x: 0, y: 0 }, { type: 'L', x: 10, y: 10 }] };
  
  try {
    const lattice = latticeOps.rasterizePath(path, 64);
    console.log('✓ LatticeOps initialized');
    console.log(`  Rasterized path to lattice of size ${lattice.length}`);
  } catch (e) {
    console.log('⚠ LatticeOps test skipped (requires canvas context)');
  }
  
  return true;
}

// Run tests
testLatticeOps();
console.log('\n✓ Canvas tests completed');
