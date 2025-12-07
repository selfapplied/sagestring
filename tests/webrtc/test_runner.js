/**
 * Test runner for webrtc modules (requires WebRTC and Canvas mocks)
 * Run with: node tests/webrtc/test_runner.js
 * 
 * Uses native ES module imports with WebRTC and Canvas mocks
 */

import { Sobel } from '../../src/math/sobel.js';
import { LatticeRenderer } from '../../src/math/renderer.js';
import { SVGKernelSystem } from '../../src/canvas/svg_kernel_system.js';

// Mock WebRTC
const mockStream = {
  getTracks: () => []
};

// Mock requestAnimationFrame
let rafId = 0;
const mockRAF = (cb) => {
  rafId++;
  setTimeout(cb, 16);
  return rafId;
};

// Setup global mocks
global.navigator = {
  mediaDevices: {
    getUserMedia: async () => mockStream
  }
};
global.requestAnimationFrame = mockRAF;
global.document = {
  createElement: (tag) => {
    if (tag === 'canvas') {
      return {
        width: 640,
        height: 480,
        getContext: () => ({
          drawImage: () => {},
          getImageData: () => ({ 
            data: new Uint8ClampedArray(640*480*4), 
            width: 640, 
            height: 480 
          }),
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
    if (tag === 'video') {
      return {
        width: 640,
        height: 480,
        videoWidth: 640,
        videoHeight: 480,
        srcObject: null,
        play: () => Promise.resolve(),
        addEventListener: () => {}
      };
    }
    return {};
  }
};

console.log('Running tests...\n');

// Test 1: Sobel computation
try {
  const sobel = new Sobel();
  const size = 64;
  const lattice = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      lattice[y * size + x] = x < size/2 ? 0 : 1;
    }
  }
  const edges = sobel.compute(lattice, size);
  console.log('✓ Sobel computation:', edges.magnitude.length === size * size);
} catch (e) {
  console.error('✗ Sobel test failed:', e.message);
  console.error(e.stack);
}

// Test 2: Path extraction
try {
  const renderer = new LatticeRenderer();
  const size = 64;
  const lattice = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - size/2;
      const dy = y - size/2;
      lattice[y * size + x] = (dx*dx + dy*dy < 100) ? 1 : 0;
    }
  }
  const paths = renderer.extractPaths(lattice, size, 0.5);
  console.log('✓ Path extraction:', paths.length > 0, `(${paths.length} paths)`);
} catch (e) {
  console.error('✗ Path extraction failed:', e.message);
  console.error(e.stack);
}

// Test 3: Full pipeline
try {
  const sobel = new Sobel();
  const renderer = new LatticeRenderer();
  const size = 64;
  const lattice = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      lattice[y * size + x] = x < size/2 ? 0 : 1;
    }
  }
  const edges = sobel.compute(lattice, size);
  const paths = renderer.extractEdgePaths(edges, size, 0.3);
  const svg = renderer.render(lattice, size, { edges });
  console.log('✓ Full pipeline:', svg.includes('<svg') && svg.includes('<path'));
  console.log('  SVG length:', svg.length, 'chars');
  console.log('  Paths found:', paths.length);
} catch (e) {
  console.error('✗ Full pipeline failed:', e.message);
  console.error(e.stack);
}

// Test 4: SVGKernelSystem
try {
  const system = new SVGKernelSystem();
  const sobel = new Sobel();
  const size = 64;
  const lattice = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      lattice[y * size + x] = (x + y) % 2;
    }
  }
  const edges = sobel.compute(lattice, size);
  const kernel = { id: 'test', lattice, edges };
  const svg = system.renderKernelToSVG(kernel);
  console.log('✓ SVGKernelSystem render:', svg.includes('<svg'));
} catch (e) {
  console.error('✗ SVGKernelSystem test failed:', e.message);
  console.error(e.stack);
}

console.log('\n✓ Tests complete.');
