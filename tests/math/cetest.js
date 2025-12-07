/**
 * Test CE1 harmonic system components
 * Run with: node tests/math/cetest.js
 */

import { HarmonicOperator, CEEvaluator, CEHeight, CEFunctional, CERoots, CE2Lift } from '../../src/math/harmonic.js';

function testCESystem() {
  console.log('Testing CE1 Harmonic System...\n');

  // Test 1: CE Evaluator
  console.log('Test 1: CE Evaluator <H(1.5)>');
  const evaluator = new CEEvaluator();
  const result = evaluator.evaluate('<H(1.5)>');
  if (result) {
    console.log('  Root:', result.root);
    console.log('  Converged:', result.converged);
    console.log('  Iterations:', result.iterations);
  }
  console.log('');

  // Test 2: CE Height System
  console.log('Test 2: CE Height System');
  const height = new CEHeight();
  const heights = height.getHarmonicHeights();
  console.log('  Harmonic component heights:', heights);
  console.log('  <H(2.0)> height:', height.computeHeight('<H(2.0)>'));
  console.log('  Well-formed check:', height.isWellFormed('<H(2.0)>'));
  console.log('');

  // Test 3: CE Functional Equation
  console.log('Test 3: CE Functional Equation');
  const func = new CEFunctional();
  const reflection = func.reflect(0.5);
  if (reflection) {
    console.log('  Reflection at s=0.5:');
    console.log('    Original magnitude:', 
      Math.sqrt(reflection.original.real**2 + reflection.original.imag**2));
    console.log('    Reflected magnitude:', 
      Math.sqrt(reflection.reflected.real**2 + reflection.reflected.imag**2));
    console.log('    Verified:', func.verify(0.5, 1e-4));
  }
  console.log('');

  // Test 4: CE Roots
  console.log('Test 4: CE Spectral Roots');
  const roots = new CERoots();
  const foundRoots = roots.findRoots(0.5, 3.0, 0.1);
  console.log(`  Found ${foundRoots.length} roots in [0.5, 3.0]`);
  if (foundRoots.length > 0) {
    console.log('  First few roots:');
    foundRoots.slice(0, 5).forEach((r, i) => {
      console.log(`    ${i+1}. x = ${r.root.toFixed(4)}, magnitude = ${r.magnitude.toExponential(2)}`);
    });
    
    if (foundRoots.length > 1) {
      const spacing = roots.rootSpacing(foundRoots);
      console.log('  Root spacing:', spacing ? 
        `mean = ${spacing.mean.toFixed(4)}` : 'N/A');
    }
  }
  console.log('');

  // Test 5: CE2 Lift
  console.log('Test 5: CE2 Time Evolution');
  const ce2 = new CE2Lift();
  const evolved = ce2.evolve(1.0);
  if (evolved) {
    console.log('  Evolved ℋ(1.0, t=1):', 
      `magnitude = ${Math.sqrt(evolved.real**2 + evolved.imag**2).toExponential(2)}`);
    
    // Evolve a few more steps
    for (let i = 0; i < 5; i++) {
      ce2.evolve(1.0);
    }
    console.log('  Phase coherence:', ce2.phaseCoherence().toFixed(4));
    
    const stable = ce2.findStableRoots(1.0, 10);
    if (stable) {
      console.log('  Stable root at x=1.0:', stable.stable);
    }
  }
  console.log('');

  console.log('✓ CE1 Harmonic System tests completed');
}

testCESystem();

