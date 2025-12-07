/**
 * Test runner for livecam system
 * Run with: node test_runner.js
 */

const fs = require('fs');
const vm = require('vm');

// Load all JS files
const files = [
  '../svg_parser.js',
  '../lattice.js',
  '../convolution.js',
  '../sobel.js',
  '../renderer.js',
  '../video.js',
  '../liveCam.js',
  '../vision.js'
];

const context = {
  console: console,
  module: { exports: {} },
  require: () => ({}),
  window: {},
  document: {
    createElement: (tag) => ({
      width: 0,
      height: 0,
      getContext: () => ({
        drawImage: () => {},
        getImageData: () => ({ data: new Uint8Array(640*480*4), width: 640, height: 480 }),
        fillRect: () => {},
        clearRect: () => {},
        beginPath: () => {},
        moveTo: () => {},
        lineTo: () => {},
        stroke: () => {},
        fill: () => {},
        closePath: () => {}
      })
    })
  },
  Float32Array: Float32Array,
  Uint8Array: Uint8Array,
  Math: Math,
  Array: Array,
  Map: Map,
  Set: Set,
  parseFloat: parseFloat,
  parseInt: parseInt
};

console.log('Loading modules...');
for (const file of files) {
  try {
    const code = fs.readFileSync(file, 'utf8');
    vm.createContext(context);
    vm.runInContext(code, context);
    console.log(`✓ Loaded ${file}`);
  } catch (e) {
    console.error(`✗ Failed to load ${file}:`, e.message);
    process.exit(1);
  }
}

console.log('\nRunning tests...\n');

// Test 1: Sobel computation
try {
  const sobel = new context.Sobel();
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
  const renderer = new context.LatticeRenderer();
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
  const sobel = new context.Sobel();
  const renderer = new context.LatticeRenderer();
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
  const system = new context.SVGKernelSystem();
  const sobel = new context.Sobel();
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

console.log('\nTests complete.');

