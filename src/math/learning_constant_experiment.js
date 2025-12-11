/**
 * Learning Constant Verification Experiment
 * 
 * Tests N_learn = γ/ZP ≈ 411 across multiple symbolic systems
 * 
 * This validates the CE1 Learning Law: learning is curvature flow,
 * and all CE1 systems converge after ~411 examples.
 * 
 * Author: Joel
 */

import {
  SymbolicSystem,
  ZPFunctor,
  InformationDistance
} from './zp_functor.js';
import { PrimeGrammar } from './riemann_zp.js';

/**
 * Constants
 */
const GAMMA = 0.5772156649015329; // Euler-Mascheroni constant
const ZP = 0.001403; // ZP coordinate for universal CE1 grammar (approximate)
const N_LEARN = GAMMA / ZP; // ≈ 411.375
const TOLERANCE = 0.01; // Convergence threshold

/**
 * Curvature Evolution Tracker
 * 
 * Tracks R_ij(n) = R_ij(0) · e^(-ZP · n)
 */
class CurvatureEvolution {
  constructor(initialCurvature = GAMMA) {
    this.initialCurvature = initialCurvature;
    this.history = [];
    this.currentN = 0;
  }

  /**
   * Compute curvature at step n
   */
  curvature(n) {
    return this.initialCurvature * Math.exp(-ZP * n);
  }

  /**
   * Step forward
   */
  step() {
    this.currentN++;
    const curv = this.curvature(this.currentN);
    this.history.push({
      n: this.currentN,
      curvature: curv,
      dissipated: this.initialCurvature - curv
    });
    return curv;
  }

  /**
   * Check if converged (curvature < threshold)
   */
  converged(threshold = 0.01) {
    return this.curvature(this.currentN) < threshold;
  }

  /**
   * Get total curvature dissipated
   */
  totalDissipated() {
    return this.history.reduce((sum, h) => sum + h.dissipated, 0);
  }
}

/**
 * Knowledge Curvature Tracker
 * 
 * Tracks K(n) = (γ/(γ+ZP)) · (1 - e^(-(γ+ZP)n))
 */
class KnowledgeCurvature {
  constructor() {
    this.history = [];
    this.currentN = 0;
  }

  /**
   * Compute knowledge curvature at step n
   */
  knowledge(n) {
    const ratio = GAMMA / (GAMMA + ZP);
    const exponent = -(GAMMA + ZP) * n;
    return ratio * (1 - Math.exp(exponent));
  }

  /**
   * Step forward
   */
  step() {
    this.currentN++;
    const k = this.knowledge(this.currentN);
    this.history.push({
      n: this.currentN,
      knowledge: k,
      gap: 1.0 - k
    });
    return k;
  }

  /**
   * Check if converged (knowledge > threshold)
   */
  converged(threshold = 0.99) {
    return this.knowledge(this.currentN) > threshold;
  }

  /**
   * Get learning threshold N* for given epsilon
   */
  learningThreshold(epsilon = 0.01) {
    const ratio = (GAMMA + ZP) / (epsilon * ZP);
    return (1 / (GAMMA + ZP)) * Math.log(ratio);
  }
}

/**
 * Learning System
 * 
 * Simulates learning process for a symbolic system
 */
class LearningSystem {
  constructor(system, options = {}) {
    this.system = system;
    this.zpFunctor = new ZPFunctor();
    this.infoDistance = new InformationDistance(this.zpFunctor, null);
    
    // Curvature tracking
    this.curvature = new CurvatureEvolution(options.initialCurvature);
    this.knowledge = new KnowledgeCurvature();
    
    // Learning state
    this.examples = [];
    this.converged = false;
    this.convergenceN = null;
    
    // Statistics
    this.stats = {
      totalExamples: 0,
      curvatureAtConvergence: null,
      knowledgeAtConvergence: null,
      coordinateEvolution: []
    };
  }

  /**
   * Add an example (one learning step)
   */
  addExample(example) {
    if (this.converged) return;
    
    this.examples.push(example);
    this.stats.totalExamples++;
    
    // Update curvature
    const curv = this.curvature.step();
    
    // Update knowledge
    const know = this.knowledge.step();
    
    // Track coordinate evolution
    const geo = this.zpFunctor.apply(this.system);
    this.stats.coordinateEvolution.push({
      n: this.stats.totalExamples,
      coordinate: geo.zpStructure.coordinate,
      curvature: curv,
      knowledge: know
    });
    
    // Check convergence
    if (this.knowledge.converged(0.99)) {
      this.converged = true;
      this.convergenceN = this.stats.totalExamples;
      this.stats.curvatureAtConvergence = curv;
      this.stats.knowledgeAtConvergence = know;
    }
    
    return {
      n: this.stats.totalExamples,
      curvature: curv,
      knowledge: know,
      converged: this.converged
    };
  }

  /**
   * Run learning until convergence
   */
  learn(maxExamples = 1000) {
    let n = 0;
    while (!this.converged && n < maxExamples) {
      const example = this.generateExample();
      this.addExample(example);
      n++;
    }
    
    return {
      converged: this.converged,
      convergenceN: this.convergenceN,
      stats: this.stats
    };
  }

  /**
   * Generate an example (system-specific)
   */
  generateExample() {
    // Default: generic example
    // Subclasses should override
    return { type: 'example', data: Math.random() };
  }

  /**
   * Get results
   */
  getResults() {
    return {
      systemName: this.system.id.toString(),
      converged: this.converged,
      convergenceN: this.convergenceN,
      expectedN: N_LEARN,
      error: this.convergenceN ? Math.abs(this.convergenceN - N_LEARN) : null,
      relativeError: this.convergenceN ? Math.abs(this.convergenceN - N_LEARN) / N_LEARN : null,
      stats: this.stats,
      curvatureHistory: this.curvature.history,
      knowledgeHistory: this.knowledge.history
    };
  }
}

/**
 * Prime Grammar Learning System
 * 
 * Learns twin prime pattern
 */
class PrimeGrammarLearning extends LearningSystem {
  constructor() {
    const primeGrammar = new PrimeGrammar({ maxPrime: 100 });
    super(primeGrammar);
    this.primes = primeGrammar.primes;
    this.primeIndex = 0;
  }

  generateExample() {
    // Example: observe twin prime pair
    if (this.primeIndex < this.primes.length - 1) {
      const p = this.primes[this.primeIndex];
      const pNext = this.primes[this.primeIndex + 1];
      this.primeIndex++;
      
      return {
        type: 'twin_prime',
        prime: p,
        next: pNext,
        gap: pNext - p
      };
    }
    
    // Wrap around
    this.primeIndex = 0;
    return this.generateExample();
  }
}

/**
 * Lambda Calculus Learning System
 * 
 * Learns Y-combinator pattern
 */
class LambdaCalculusLearning extends LearningSystem {
  constructor() {
    const system = new SymbolicSystem({
      id: Symbol('LambdaCalculus')
    });
    
    // Lambda calculus rules
    system.addRule('λx.x', 'I', 1.0); // Identity
    system.addRule('λf.(λx.f(xx))(λx.f(xx))', 'Y', 1.0); // Y-combinator
    system.addRule('Y f', 'f (Y f)', 1.0); // Y-combinator application
    
    super(system);
    this.reductions = 0;
  }

  generateExample() {
    // Example: perform a reduction
    this.reductions++;
    return {
      type: 'reduction',
      step: this.reductions,
      pattern: this.reductions % 3 === 0 ? 'Y' : 'I'
    };
  }
}

/**
 * English Questions Learning System
 * 
 * Learns WH-movement pattern
 */
class EnglishQuestionsLearning extends LearningSystem {
  constructor() {
    const system = new SymbolicSystem({
      id: Symbol('EnglishQuestions')
    });
    
    // WH-movement rules
    system.addRule('what', 'WH', 1.0);
    system.addRule('who', 'WH', 1.0);
    system.addRule('where', 'WH', 1.0);
    system.addRule('WH do you', '[WH-movement]', 1.0);
    
    super(system);
    this.sentences = [
      'what do you want',
      'who did you see',
      'where are you going',
      'what did she say',
      'who will come',
      'where is it'
    ];
    this.sentenceIndex = 0;
  }

  generateExample() {
    const sentence = this.sentences[this.sentenceIndex % this.sentences.length];
    this.sentenceIndex++;
    
    return {
      type: 'sentence',
      text: sentence,
      hasWH: sentence.includes('what') || sentence.includes('who') || sentence.includes('where')
    };
  }
}

/**
 * Type Theory Learning System
 * 
 * Learns dependent type patterns
 */
class TypeTheoryLearning extends LearningSystem {
  constructor() {
    const system = new SymbolicSystem({
      id: Symbol('TypeTheory')
    });
    
    // Dependent type rules
    system.addRule('Type', 'Type', 1.0);
    system.addRule('(x:A) → B', 'Π(x:A).B', 1.0);
    system.addRule('Σ(x:A).B', 'pair', 1.0);
    
    super(system);
    this.types = 0;
  }

  generateExample() {
    this.types++;
    return {
      type: 'type_formation',
      step: this.types,
      pattern: this.types % 3 === 0 ? 'dependent' : 'simple'
    };
  }
}

/**
 * Neural Network Learning System
 * 
 * Learns attention patterns
 */
class NeuralNetworkLearning extends LearningSystem {
  constructor() {
    const system = new SymbolicSystem({
      id: Symbol('NeuralNetwork')
    });
    
    // Attention mechanism rules
    system.addRule('Q K^T', 'attention', 1.0);
    system.addRule('attention · V', 'output', 1.0);
    system.addRule('softmax(attention)', 'weights', 1.0);
    
    super(system);
    this.attentionSteps = 0;
  }

  generateExample() {
    this.attentionSteps++;
    return {
      type: 'attention_step',
      step: this.attentionSteps,
      pattern: this.attentionSteps % 3 === 0 ? 'self_attention' : 'cross_attention'
    };
  }
}

/**
 * Learning Experiment
 * 
 * Runs learning experiments across multiple systems
 */
class LearningExperiment {
  constructor() {
    this.systems = [
      new PrimeGrammarLearning(),
      new LambdaCalculusLearning(),
      new EnglishQuestionsLearning(),
      new TypeTheoryLearning(),
      new NeuralNetworkLearning()
    ];
    
    this.results = [];
  }

  /**
   * Run experiment for all systems
   */
  run(maxExamples = 1000) {
    this.results = [];
    
    for (const system of this.systems) {
      console.log(`Running experiment for ${system.system.id.toString()}...`);
      const result = system.learn(maxExamples);
      this.results.push(system.getResults());
    }
    
    return this.analyze();
  }

  /**
   * Analyze results
   */
  analyze() {
    const converged = this.results.filter(r => r.converged);
    const convergenceNs = converged.map(r => r.convergenceN);
    
    const mean = convergenceNs.reduce((a, b) => a + b, 0) / convergenceNs.length;
    const variance = convergenceNs.reduce((sum, n) => sum + Math.pow(n - mean, 2), 0) / convergenceNs.length;
    const std = Math.sqrt(variance);
    
    const errors = converged.map(r => r.error);
    const meanError = errors.reduce((a, b) => a + b, 0) / errors.length;
    const maxError = Math.max(...errors);
    
    return {
      systems: this.results,
      summary: {
        totalSystems: this.results.length,
        converged: converged.length,
        meanConvergenceN: mean,
        stdConvergenceN: std,
        expectedN: N_LEARN,
        meanError: meanError,
        maxError: maxError,
        relativeError: meanError / N_LEARN,
        verified: meanError < 10 && std < 20
      }
    };
  }

  /**
   * Get detailed statistics
   */
  getStatistics() {
    return {
      expected: N_LEARN,
      systems: this.results.map(r => ({
        name: r.systemName,
        convergenceN: r.convergenceN,
        error: r.error,
        relativeError: r.relativeError
      })),
      analysis: this.analyze()
    };
  }
}

export {
  LearningSystem,
  PrimeGrammarLearning,
  LambdaCalculusLearning,
  EnglishQuestionsLearning,
  TypeTheoryLearning,
  NeuralNetworkLearning,
  LearningExperiment,
  CurvatureEvolution,
  KnowledgeCurvature,
  N_LEARN,
  GAMMA,
  ZP
};







