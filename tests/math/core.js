/**
 * Tests for core.js (WaveScheduler)
 */

// Basic wave scheduler tests
function testWaveScheduler() {
  console.log('Testing WaveScheduler...');
  
  // Test basic initialization
  const scheduler = new WaveScheduler({
    frequency: 1.0,
    phase: 0.0
  });
  
  // Test phase evolution
  const t1 = scheduler.next();
  const t2 = scheduler.next();
  
  console.log('✓ WaveScheduler initialized');
  console.log(`  t1=${t1}, t2=${t2}`);
  
  return true;
}

// Run tests if in browser
if (typeof window !== 'undefined') {
  window.testCore = testWaveScheduler;
}

// Run tests if in Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testWaveScheduler };
}

