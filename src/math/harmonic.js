/**
 * Harmonic Operator ℋ(x) = 0 - CE1-encoded zeta zero conditions
 * 
 * Structure: ℋ(x) = ln(x) · ζ(x) · i·tan(πx/2) · sin(πx) · i·cos(πx)
 * 
 * CE1 Mapping:
 *   {ln c}  - domain/collapse (boundary behavior)
 *   [ζ c]   - memory/accumulation (LR series)
 *   (tan c) - morphism/phase (rotational singularities)
 *   <sin c> - witness/oscillation (fixed-point anchor)
 *   <i cos c> - witness/oscillation (complex phase)
 * 
 * Fixed-point: <H(c)> → ℋ(x) = 0
 */

// Utility functions
function magnitude(c) {
  return Math.sqrt(c.real ** 2 + c.imag ** 2);
}

function computeDerivative(harmonic, x, dx = 1e-8) {
  const hx = harmonic.H(x);
  if (hx === null) return null;
  const hxPlus = harmonic.H(x + dx);
  if (hxPlus === null) return null;
  return {
    real: (hxPlus.real - hx.real) / dx,
    imag: (hxPlus.imag - hx.imag) / dx
  };
}

function newtonStep(hx, derivative) {
  const det = derivative.real ** 2 + derivative.imag ** 2;
  if (Math.abs(det) < 1e-15) return null;
  const invDeriv = {
    real: derivative.real / det,
    imag: -derivative.imag / det
  };
  return {
    real: hx.real * invDeriv.real - hx.imag * invDeriv.imag,
    imag: hx.real * invDeriv.imag + hx.imag * invDeriv.real
  };
}

function parseExpression(expression) {
  if (typeof expression === 'string') {
    const match = expression.match(/<H\(([^)]+)\)>/);
    if (match) return { type: 'fixedPoint', value: parseFloat(match[1]) };
    const match2 = expression.match(/H\(([^)]+)\)/);
    if (match2) return { type: 'evaluate', value: parseFloat(match2[1]) };
  }
  if (typeof expression === 'number') {
    return { type: 'fixedPoint', value: expression };
  }
  return null;
}

class HarmonicOperator {
  constructor(options = {}) {
    this.tolerance = options.tolerance || 1e-10;
    this.maxIterations = options.maxIterations || 1000;
    this.ce1 = {
      domain: {},
      memory: [],
      morphism: null,
      witness: null
    };
    this.zetaCache = new Map();
  }

  domainBracket(x) {
    if (x <= 0) return null;
    return Math.log(x);
  }

  memoryBracket(x) {
    return this.zetaApprox(x);
  }

  zetaApprox(s) {
    if (s > 1) {
      if (this.zetaCache.has(s)) {
        return this.zetaCache.get(s);
      }
      let product = 1;
      const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29];
      for (const p of primes) {
        product *= 1 / (1 - Math.pow(p, -s));
      }
      this.zetaCache.set(s, product);
      return product;
    }
    if (s < 0.5) {
      const reflection = Math.pow(2, s) * Math.pow(Math.PI, s - 1) *
                         Math.sin(Math.PI * s / 2);
      const oneMinusS = 1 - s;
      if (oneMinusS > 1) {
        let product = 1;
        const primes = [2, 3, 5, 7, 11, 13];
        for (const p of primes) {
          product *= 1 / (1 - Math.pow(p, -oneMinusS));
        }
        const gammaApprox = this.gammaApprox(1 - s);
        return reflection * gammaApprox * product;
      }
    }
    return 0.5 + 0.1 * Math.sin(Math.PI * s);
  }

  gammaApprox(z) {
    if (z < 0.5) {
      return Math.PI / (Math.sin(Math.PI * z) * this.gammaApprox(1 - z));
    }
    const n = Math.floor(z);
    const frac = z - n;
    let result = 1;
    for (let i = 1; i < n; i++) {
      result *= i;
    }
    return result * Math.pow(n, frac);
  }

  morphismBracket(x) {
    return Math.tan(Math.PI * x / 2);
  }

  witnessSin(x) {
    return Math.sin(Math.PI * x);
  }

  witnessCos(x) {
    return { real: 0, imag: Math.cos(Math.PI * x) };
  }

  H(x) {
    const domain = this.domainBracket(x);
    if (domain === null) return null;
    const memory = this.memoryBracket(x);
    if (memory === null || !isFinite(memory)) return null;
    const morphism = this.morphismBracket(x);
    if (!isFinite(morphism)) return null;
    const witnessSin = this.witnessSin(x);
    const witnessCos = this.witnessCos(x);

    const step1 = domain * memory;
    const step2 = { real: -step1 * morphism, imag: step1 * morphism };
    const step3 = { real: step2.real * witnessSin, imag: step2.imag * witnessSin };
    const step4 = {
      real: -step3.imag * witnessCos.imag,
      imag: step3.real * witnessCos.imag
    };
    return step4;
  }

  fixedPoint(c, options = {}) {
    const tolerance = options.tolerance || this.tolerance;
    const maxIter = options.maxIterations || this.maxIterations;
    let x = c;
    let iterations = 0;

    while (iterations < maxIter) {
      const hx = this.H(x);
      if (hx === null) return null;
      const mag = magnitude(hx);
      if (mag < tolerance) {
        return { root: x, value: hx, magnitude: mag, iterations, converged: true };
      }

      const derivative = computeDerivative(this, x);
      if (derivative === null) {
        x += 0.01 * (Math.random() - 0.5);
        iterations++;
        continue;
      }

      const step = newtonStep(hx, derivative);
      if (step === null) {
        x += 0.01 * (Math.random() - 0.5);
        iterations++;
        continue;
      }

      x = x - step.real;
      iterations++;
    }

    const finalHx = this.H(x);
    return {
      root: x,
      value: finalHx,
      magnitude: finalHx ? magnitude(finalHx) : Infinity,
      iterations,
      converged: false
    };
  }

  evaluateCE1(expression) {
    const parsed = parseExpression(expression);
    if (!parsed) return null;
    if (parsed.type === 'fixedPoint') {
      return this.fixedPoint(parsed.value);
    }
    if (parsed.type === 'evaluate') {
      return this.H(parsed.value);
    }
    return null;
  }

  decompose(x) {
    return {
      domain: this.domainBracket(x),
      memory: this.memoryBracket(x),
      morphism: this.morphismBracket(x),
      witnessSin: this.witnessSin(x),
      witnessCos: this.witnessCos(x),
      harmonic: this.H(x)
    };
  }
}

class CEEvaluator {
  constructor(options = {}) {
    this.tolerance = options.tolerance || 1e-10;
    this.maxIterations = options.maxIterations || 1000;
    this.stepSize = options.stepSize || 0.1;
    this.harmonic = new HarmonicOperator({
      tolerance: this.tolerance,
      maxIterations: this.maxIterations
    });
  }

  evaluate(expression, initialGuess = null) {
    const parsed = parseExpression(expression);
    if (!parsed || parsed.type !== 'fixedPoint') return null;
    return this.fixedPoint(parsed.value, initialGuess);
  }

  fixedPoint(c, initialGuess = null) {
    let x = initialGuess !== null ? initialGuess : c;
    let iterations = 0;
    const history = [];

    while (iterations < this.maxIterations) {
      const hx = this.harmonic.H(x);
      if (hx === null) break;
      const mag = magnitude(hx);
      history.push({ x, magnitude: mag, iteration: iterations });

      if (mag < this.tolerance) {
        return { root: x, value: hx, magnitude: mag, iterations, converged: true, history };
      }

      const step = this.computeStep(x, hx);
      x = x - step;
      iterations++;
    }

    const finalHx = this.harmonic.H(x);
    return {
      root: x,
      value: finalHx,
      magnitude: finalHx ? magnitude(finalHx) : Infinity,
      iterations,
      converged: false,
      history
    };
  }

  computeStep(x, hx) {
    const decomp = this.harmonic.decompose(x);
    const witnessMag = Math.abs(decomp.witnessSin) + Math.abs(decomp.witnessCos.imag);
    const domainMag = Math.abs(decomp.domain);
    const memoryMag = Math.abs(decomp.memory);
    
    let damping = 1.0;
    if (witnessMag > domainMag + memoryMag) {
      damping = 0.5;
    } else if (domainMag > memoryMag) {
      damping = 0.8;
    }

    const derivative = computeDerivative(this.harmonic, x);
    if (derivative === null) return this.stepSize * damping;

    const step = newtonStep(hx, derivative);
    if (step === null) return this.stepSize * damping;

    return step.real * damping;
  }

  evaluateBatch(expressions) {
    return expressions.map(expr => this.evaluate(expr));
  }
}

class CEHeight {
  constructor() {
    this.levels = new Map();
  }

  assignHeight(component, parentHeight = 0) {
    if (typeof component === 'number') return 0;
    if (typeof component === 'string') {
      if (component.startsWith('{') && component.endsWith('}')) return parentHeight + 1;
      if (component.startsWith('[') && component.endsWith(']')) return parentHeight + 1;
      if (component.startsWith('(') && component.endsWith(')')) return parentHeight + 1;
      if (component.startsWith('<') && component.endsWith('>')) return parentHeight + 2;
    }
    return parentHeight;
  }

  getHarmonicHeights() {
    return {
      domain: 1,
      memory: 1,
      morphism: 1,
      witnessSin: 2,
      witnessCos: 2,
      harmonic: 3
    };
  }

  computeHeight(expression) {
    if (typeof expression === 'string') {
      let maxDepth = 0;
      let depth = 0;
      for (const char of expression) {
        if (char === '{' || char === '[' || char === '(') {
          depth++;
          maxDepth = Math.max(maxDepth, depth);
        } else if (char === '}' || char === ']' || char === ')') {
          depth--;
        } else if (char === '<') {
          depth += 2;
          maxDepth = Math.max(maxDepth, depth);
        } else if (char === '>') {
          depth -= 2;
        }
      }
      return maxDepth;
    }
    return 0;
  }

  isWellFormed(expression) {
    if (typeof expression !== 'string') return false;
    const stack = [];
    const pairs = { '{': '}', '[': ']', '(': ')', '<': '>' };
    for (const char of expression) {
      if (pairs[char]) {
        stack.push(char);
      } else if (Object.values(pairs).includes(char)) {
        if (stack.length === 0) return false;
        const last = stack.pop();
        if (pairs[last] !== char) return false;
      }
    }
    return stack.length === 0;
  }
}

class CEFunctional {
  constructor() {
    this.harmonic = new HarmonicOperator();
  }

  reflect(s) {
    const oneMinusS = 1 - s;
    const hs = this.harmonic.H(s);
    const h1s = this.harmonic.H(oneMinusS);
    if (hs === null || h1s === null) return null;

    const reflectionFactor = this.computeReflectionFactor(s);
    return {
      original: hs,
      reflected: h1s,
      factor: reflectionFactor,
      transformed: {
        real: h1s.real * reflectionFactor.real - h1s.imag * reflectionFactor.imag,
        imag: h1s.real * reflectionFactor.imag + h1s.imag * reflectionFactor.real
      }
    };
  }

  computeReflectionFactor(s) {
    const twoToS = Math.pow(2, s);
    const piToSMinus1 = Math.pow(Math.PI, s - 1);
    const sinFactor = Math.sin(Math.PI * s / 2);
    return { real: twoToS * piToSMinus1 * sinFactor, imag: 0 };
  }

  verify(s, tolerance = 1e-6) {
    const reflection = this.reflect(s);
    if (reflection === null) return false;
    const hs = reflection.original;
    const transformed = reflection.transformed;
    const diff = {
      real: hs.real - transformed.real,
      imag: hs.imag - transformed.imag
    };
    return magnitude(diff) < tolerance;
  }

  findCriticalZeros(count = 10, tolerance = 1e-6) {
    const zeros = [];
    const step = 0.1;
    for (let t = 0; t < count * 2; t += step) {
      const realS = 0.5 + t * 0.01;
      const hx = this.harmonic.H(realS);
      if (hx === null) continue;
      const mag = magnitude(hx);
      if (mag < tolerance) {
        zeros.push({ s: realS, value: hx, magnitude: mag });
        if (zeros.length >= count) break;
      }
    }
    return zeros;
  }
}

class CERoots {
  constructor(options = {}) {
    this.harmonic = new HarmonicOperator(options);
    this.evaluator = new CEEvaluator(options);
    this.tolerance = options.tolerance || 1e-8;
  }

  findRoots(min, max, step = 0.01) {
    const roots = [];
    const checked = new Set();

    for (let x = min; x <= max; x += step) {
      const rounded = Math.round(x / step) * step;
      if (checked.has(rounded)) continue;
      checked.add(rounded);

      const result = this.evaluator.fixedPoint(x);
      if (result && result.converged && result.magnitude < this.tolerance) {
        const isNew = roots.every(r => Math.abs(r.root - result.root) > step * 2);
        if (isNew) {
          roots.push({
            root: result.root,
            value: result.value,
            magnitude: result.magnitude,
            iterations: result.iterations
          });
        }
      }
    }

    roots.sort((a, b) => a.root - b.root);
    return roots;
  }

  findBracketGuided(min, max, count = 10) {
    const candidates = [];
    const step = (max - min) / (count * 10);

    for (let x = min; x <= max; x += step) {
      const decomp = this.harmonic.decompose(x);
      const witnessMag = Math.abs(decomp.witnessSin) + Math.abs(decomp.witnessCos.imag);
      const domainMag = Math.abs(decomp.domain);
      const memoryMag = Math.abs(decomp.memory);
      const total = witnessMag + domainMag + memoryMag;
      if (total < 1e-10) continue;
      const balance = Math.min(witnessMag, domainMag, memoryMag) / 
                      Math.max(witnessMag, domainMag, memoryMag);
      if (balance > 0.1) {
        candidates.push(x);
      }
    }

    const roots = [];
    for (const candidate of candidates) {
      const result = this.evaluator.fixedPoint(candidate);
      if (result && result.converged && result.magnitude < this.tolerance) {
        roots.push({
          root: result.root,
          value: result.value,
          magnitude: result.magnitude,
          iterations: result.iterations
        });
      }
    }
    return roots;
  }

  countRoots(min, max) {
    return this.findRoots(min, max).length;
  }

  rootSpacing(roots) {
    if (roots.length < 2) return null;
    const spacings = [];
    for (let i = 1; i < roots.length; i++) {
      spacings.push(Math.abs(roots[i].root - roots[i - 1].root));
    }
    return {
      min: Math.min(...spacings),
      max: Math.max(...spacings),
      mean: spacings.reduce((a, b) => a + b, 0) / spacings.length,
      spacings
    };
  }
}

class CE2Lift {
  constructor(options = {}) {
    this.harmonic = new HarmonicOperator(options);
    this.antclock = 0;
    this.guardians = {
      phi: options.phi || 0.85,
      partial: options.partial || 0.92,
      scriptr: options.scriptr || 0.88
    };
    this.history = [];
    this.phaseHistory = [];
  }

  evolve(x, dt = 1) {
    const current = this.harmonic.H(x);
    if (current === null) return null;
    const modulated = this.applyGuardians(current, x);
    this.antclock += dt;
    this.history.push({ t: this.antclock, x, value: current, modulated });
    if (this.history.length > 100) {
      this.history.shift();
    }
    return modulated;
  }

  applyGuardians(hx, x) {
    const phase = Math.atan2(hx.imag, hx.real);
    const phiMod = Math.cos(phase * this.guardians.phi);
    const decomp = this.harmonic.decompose(x);
    const structural = (Math.abs(decomp.domain) + 
                       Math.abs(decomp.memory) + 
                       Math.abs(decomp.morphism)) / 3;
    const partialMod = 1.0 + (this.guardians.partial - 1.0) * structural;
    const mag = magnitude(hx);
    const scriptrMod = 1.0 + (this.guardians.scriptr - 1.0) * (1.0 / (1.0 + mag));
    const combinedMod = phiMod * partialMod * scriptrMod;
    return {
      real: hx.real * combinedMod,
      imag: hx.imag * combinedMod
    };
  }

  phaseCoherence(window = 10) {
    if (this.history.length < 2) return 0;
    const recent = this.history.slice(-window);
    const phases = recent.map(h => Math.atan2(h.value.imag, h.value.real));
    let coherence = 0;
    for (let i = 1; i < phases.length; i++) {
      const diff = Math.abs(phases[i] - phases[i - 1]);
      const wrapped = Math.min(diff, 2 * Math.PI - diff);
      coherence += 1.0 - wrapped / Math.PI;
    }
    return coherence / (phases.length - 1);
  }

  findStableRoots(x, duration = 100, tolerance = 1e-6) {
    const initial = this.harmonic.H(x);
    if (initial === null) return null;
    const initialMag = magnitude(initial);
    if (initialMag > tolerance) return null;

    let stable = true;
    for (let t = 0; t < duration; t++) {
      const evolved = this.evolve(x, 1);
      if (evolved === null) {
        stable = false;
        break;
      }
      const mag = magnitude(evolved);
      if (mag > tolerance) {
        stable = false;
        break;
      }
    }

    const lastModulated = this.history.length > 0 ? this.history[this.history.length - 1].modulated : null;
    return {
      root: x,
      stable,
      duration,
      finalMagnitude: lastModulated ? magnitude(lastModulated) : null,
      phaseCoherence: this.phaseCoherence()
    };
  }

  reset() {
    this.antclock = 0;
    this.history = [];
    this.phaseHistory = [];
  }
}

export { HarmonicOperator, CEEvaluator, CEHeight, CEFunctional, CERoots, CE2Lift };
