/**
 * Test runner for DOM modules (requires DOMParser mock)
 * Run with: node tests/dom/test_runner.js
 * 
 * Uses native ES module imports with jsdom for DOMParser
 */

import { JSDOM } from 'jsdom';
import { SVGParser } from '../../src/dom/svg_parser.js';

// Setup DOM environment
const dom = new JSDOM();
global.DOMParser = dom.window.DOMParser;
global.document = dom.window.document;
global.window = dom.window;

// Test SVGParser
function testSVGParser() {
  console.log('Testing SVGParser...');
  
  const parser = new SVGParser();
  const svgText = '<svg><path d="M0,0 L10,10"/></svg>';
  const kernels = parser.parseKernel(svgText);
  
  console.log('✓ SVGParser initialized');
  console.log(`  Parsed ${kernels.length} kernel(s)`);
  
  return true;
}

// Run tests
testSVGParser();
console.log('\n✓ DOM tests completed');
