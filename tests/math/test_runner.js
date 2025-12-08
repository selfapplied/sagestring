/**
 * Test runner for math modules (pure computation, Node.js compatible)
 * Run with: node tests/math/test_runner.js
 * 
 * Uses native ES module imports - no CommonJS needed
 */

import { WaveScheduler } from '../../src/math/core.js';

// Basic wave scheduler tests
function testWaveScheduler() {
  console.log('Testing WaveScheduler...');
  
  // Test basic initialization
  const scheduler = new WaveScheduler({
    operator: 1.0,
    phase: 0.0
  });
  
  // Test phase evolution
  const t1 = scheduler.next();
  const t2 = scheduler.next();
  
  console.log('✓ WaveScheduler initialized');
  console.log(`  t1=${t1}, t2=${t2}`);
  
  return true;
}

// Run tests
testWaveScheduler();
console.log('\n✓ Math tests completed');




