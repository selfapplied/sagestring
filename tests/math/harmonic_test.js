/**
 * Test harmonic operator CE1 integration
 * Run with: node tests/math/harmonic_test.js
 */

import { HarmonicOperator } from '../../src/math/harmonic.js';

function testHarmonicOperator() {
  console.log('Testing HarmonicOperator CE1 integration...\n');

  const H = new HarmonicOperator();

  // Test 1: CE1 bracket decomposition
  console.log('Test 1: CE1 bracket decomposition at x=2.0');
  const decomp = H.decompose(2.0);
  console.log('  Domain {ln x}:', decomp.domain);
  console.log('  Memory [ζ x]:', decomp.memory);
  console.log('  Morphism (tan πx/2):', decomp.morphism);
  console.log('  Witness <sin πx>:', decomp.witnessSin);
  console.log('  Witness <i cos πx>:', decomp.witnessCos);
  console.log('  Full ℋ(x):', decomp.harmonic);
  console.log('  Magnitude:', decomp.harmonic ? 
    Math.sqrt(decomp.harmonic.real**2 + decomp.harmonic.imag**2) : 'null');
  console.log('');

  // Test 2: Fixed-point resolution <H(c)>
  console.log('Test 2: Fixed-point resolution <H(1.5)>');
  const fp = H.fixedPoint(1.5);
  if (fp) {
    console.log('  Root:', fp.root);
    console.log('  Value:', fp.value);
    console.log('  Magnitude:', fp.magnitude);
    console.log('  Iterations:', fp.iterations);
    console.log('  Converged:', fp.converged);
  } else {
    console.log('  Failed to find fixed point');
  }
  console.log('');

  // Test 3: CE1 expression evaluation
  console.log('Test 3: CE1 expression evaluation');
  const result = H.evaluateCE1('<H(2.0)>');
  if (result) {
    console.log('  Expression: <H(2.0)>');
    console.log('  Result:', result);
  }
  console.log('');

  // Test 4: Multiple fixed-point searches (looking for zeros)
  console.log('Test 4: Searching for harmonic zeros near known values');
  const testPoints = [0.5, 1.0, 1.5, 2.0, 2.5, 3.0];
  for (const c of testPoints) {
    const fp = H.fixedPoint(c, { tolerance: 1e-6, maxIterations: 100 });
    if (fp && fp.converged) {
      console.log(`  Near ${c}: found root at ${fp.root.toFixed(6)} (magnitude: ${fp.magnitude.toExponential(2)})`);
    }
  }

  console.log('\n✓ Harmonic operator tests completed');
}

testHarmonicOperator();

