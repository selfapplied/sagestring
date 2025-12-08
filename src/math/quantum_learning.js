/**
 * Quantum Learning: CE1 Learning Law in Quantum Mechanics
 * 
 * Mapping:
 *   γ (Euler-Mascheroni) → Berry Phase
 *   ZP (Learning Rate) → Lindblad Decoherence Rate
 *   K(n) (Knowledge Curvature) → Quantum State Evolution
 *   R_ij(n) (Curvature) → Density Matrix Evolution
 *   N_learn ≈ 411 → Quantum Learning Threshold
 * 
 * The quantum learning equation:
 *   dρ/dt = -i[H, ρ] + L(ρ)
 * 
 * Where:
 *   H = Hamiltonian (Berry phase generator)
 *   L(ρ) = Lindblad operator (decoherence)
 * 
 * Author: Joel
 */

import { GAMMA, ZP_RATE, N_LEARN } from './ce1_learning_law.js';

// Quantum constants
const H_BAR = 1.0; // Reduced Planck constant (set to 1)
const BERRY_PHASE = GAMMA; // Map γ to Berry phase
const DECOHERENCE_RATE = ZP_RATE; // Map ZP to Lindblad rate

/**
 * Complex number representation
 */
class Complex {
    constructor(real = 0, imag = 0) {
        this.real = real;
        this.imag = imag;
    }

    static fromPolar(r, theta) {
        return new Complex(r * Math.cos(theta), r * Math.sin(theta));
    }

    magnitude() {
        return Math.sqrt(this.real * this.real + this.imag * this.imag);
    }

    phase() {
        return Math.atan2(this.imag, this.real);
    }

    add(other) {
        return new Complex(this.real + other.real, this.imag + other.imag);
    }

    multiply(other) {
        return new Complex(
            this.real * other.real - this.imag * other.imag,
            this.real * other.imag + this.imag * other.real
        );
    }

    scale(s) {
        return new Complex(s * this.real, s * this.imag);
    }

    conjugate() {
        return new Complex(this.real, -this.imag);
    }
}

/**
 * Quantum State (Ket vector)
 */
class QuantumState {
    constructor(amplitudes) {
        // amplitudes is array of Complex numbers
        this.amplitudes = amplitudes;
        this.normalize();
    }

    normalize() {
        const norm = Math.sqrt(
            this.amplitudes.reduce((sum, amp) => sum + amp.magnitude() ** 2, 0)
        );
        if (norm > 0) {
            this.amplitudes = this.amplitudes.map(amp => amp.scale(1 / norm));
        }
    }

    /**
     * Compute probability of measuring state |i⟩
     */
    probability(i) {
        return this.amplitudes[i].magnitude() ** 2;
    }

    /**
     * Compute von Neumann entropy (measure of mixedness)
     */
    entropy() {
        let entropy = 0;
        for (const amp of this.amplitudes) {
            const p = amp.magnitude() ** 2;
            if (p > 0) {
                entropy -= p * Math.log2(p);
            }
        }
        return entropy;
    }

    /**
     * Compute purity: Tr(ρ²)
     */
    purity() {
        return this.amplitudes.reduce((sum, amp) => {
            const p = amp.magnitude() ** 2;
            return sum + p * p;
        }, 0);
    }
}

/**
 * Density Matrix
 */
class DensityMatrix {
    constructor(state) {
        // For pure state: ρ = |ψ⟩⟨ψ|
        this.state = state;
        this.size = state.amplitudes.length;
    }

    /**
     * Compute density matrix elements ρ_ij = ⟨i|ρ|j⟩
     */
    element(i, j) {
        const amp_i = this.state.amplitudes[i];
        const amp_j = this.state.amplitudes[j];
        return amp_i.multiply(amp_j.conjugate());
    }

    /**
     * Trace: Tr(ρ)
     */
    trace() {
        let trace = new Complex(0, 0);
        for (let i = 0; i < this.size; i++) {
            trace = trace.add(this.element(i, i));
        }
        return trace;
    }

    /**
     * Von Neumann entropy: S = -Tr(ρ log ρ)
     */
    vonNeumannEntropy() {
        return this.state.entropy();
    }
}

/**
 * Hamiltonian Operator
 * 
 * H = Berry phase generator
 * Maps to γ (Euler-Mascheroni constant)
 */
class Hamiltonian {
    constructor(energyLevels, berryPhase = BERRY_PHASE) {
        this.energyLevels = energyLevels; // Array of energy eigenvalues
        this.berryPhase = berryPhase;
    }

    /**
     * Apply Hamiltonian to state: H|ψ⟩
     */
    apply(state) {
        const newAmplitudes = state.amplitudes.map((amp, i) => {
            const energy = this.energyLevels[i] || 0;
            // H|i⟩ = E_i |i⟩ + Berry phase contribution
            const phase = this.berryPhase * energy;
            const phaseFactor = Complex.fromPolar(1, phase);
            return amp.multiply(phaseFactor).scale(energy);
        });
        return new QuantumState(newAmplitudes);
    }

    /**
     * Compute Berry phase for cyclic evolution
     */
    berryPhase(initialState, finalState) {
        // Berry phase = arg(⟨ψ_i|ψ_f⟩)
        let overlap = new Complex(0, 0);
        for (let i = 0; i < initialState.amplitudes.length; i++) {
            const conj = initialState.amplitudes[i].conjugate();
            overlap = overlap.add(conj.multiply(finalState.amplitudes[i]));
        }
        return overlap.phase();
    }
}

/**
 * Lindblad Operator (Decoherence)
 * 
 * Maps to ZP (learning rate)
 * L(ρ) = Σ_k (L_k ρ L_k† - ½{L_k†L_k, ρ})
 */
class LindbladOperator {
    constructor(decoherenceRate = DECOHERENCE_RATE) {
        this.gamma = decoherenceRate; // Decay rate
    }

    /**
     * Apply Lindblad operator to density matrix
     * Simplified: exponential decay of off-diagonal elements
     */
    apply(densityMatrix, dt) {
        const decay = Math.exp(-this.gamma * dt);
        const newAmplitudes = densityMatrix.state.amplitudes.map((amp, i) => {
            // Diagonal elements preserved, off-diagonal decay
            const phase = amp.phase();
            const magnitude = amp.magnitude();
            // Decay coherence (off-diagonal terms)
            const newMagnitude = magnitude * (1 - (1 - decay) * (1 - magnitude));
            return Complex.fromPolar(newMagnitude, phase);
        });
        return new DensityMatrix(new QuantumState(newAmplitudes));
    }

    /**
     * Decoherence time: τ = 1/γ
     */
    decoherenceTime() {
        return 1 / this.gamma;
    }
}

/**
 * Quantum Learning System
 * 
 * Implements quantum version of CE1 Learning Law
 */
class QuantumLearningSystem {
    constructor(options = {}) {
        // Initial quantum state (superposition of knowledge states)
        const numStates = options.numStates || 2;
        const initialAmplitudes = Array(numStates).fill(0).map(() => 
            Complex.fromPolar(1 / Math.sqrt(numStates), Math.random() * 2 * Math.PI)
        );
        this.state = new QuantumState(initialAmplitudes);
        this.densityMatrix = new DensityMatrix(this.state);
        
        // Hamiltonian (Berry phase generator)
        const energyLevels = options.energyLevels || 
            Array(numStates).fill(0).map((_, i) => i + 1);
        this.hamiltonian = new Hamiltonian(energyLevels, BERRY_PHASE);
        
        // Lindblad operator (decoherence)
        this.lindblad = new LindbladOperator(DECOHERENCE_RATE);
        
        // Learning state
        this.step = 0;
        this.berryPhaseAccumulated = 0;
        this.entropyHistory = [];
        this.purityHistory = [];
    }

    /**
     * Evolve quantum state (one learning step)
     * 
     * dρ/dt = -i[H, ρ] + L(ρ)
     */
    evolve(dt = 0.01) {
        // Unitary evolution: -i[H, ρ]
        const hState = this.hamiltonian.apply(this.state);
        
        // Compute commutator [H, ρ] ≈ H|ψ⟩ - |ψ⟩H
        // Simplified: rotate state by Berry phase
        const newAmplitudes = this.state.amplitudes.map((amp, i) => {
            const hAmp = hState.amplitudes[i];
            const phase = this.hamiltonian.berryPhase * dt;
            const rotation = Complex.fromPolar(1, phase);
            return amp.multiply(rotation);
        });
        this.state = new QuantumState(newAmplitudes);
        this.densityMatrix = new DensityMatrix(this.state);
        
        // Decoherence: L(ρ)
        this.densityMatrix = this.lindblad.apply(this.densityMatrix, dt);
        this.state = this.densityMatrix.state;
        
        // Accumulate Berry phase
        this.berryPhaseAccumulated += this.hamiltonian.berryPhase * dt;
        
        // Track entropy and purity
        this.entropyHistory.push(this.state.entropy());
        this.purityHistory.push(this.state.purity());
        
        this.step++;
        
        return {
            step: this.step,
            entropy: this.state.entropy(),
            purity: this.state.purity(),
            berryPhase: this.berryPhaseAccumulated,
            knowledge: this.computeKnowledge(),
            converged: this.isConverged()
        };
    }

    /**
     * Compute knowledge (quantum version of K(n))
     * Knowledge = 1 - normalized entropy
     */
    computeKnowledge() {
        const maxEntropy = Math.log2(this.state.amplitudes.length);
        const normalizedEntropy = this.state.entropy() / maxEntropy;
        return 1 - normalizedEntropy;
    }

    /**
     * Check if learning is complete
     * Converged when knowledge > 0.99 (quantum version of K(n) > 1 - ε)
     */
    isConverged(threshold = 0.99) {
        return this.computeKnowledge() > threshold;
    }

    /**
     * Measure quantum state (collapse to classical)
     */
    measure() {
        const probabilities = this.state.amplitudes.map((amp, i) => ({
            state: i,
            probability: amp.magnitude() ** 2
        }));
        
        // Sample according to probabilities
        const rand = Math.random();
        let cumulative = 0;
        for (const prob of probabilities) {
            cumulative += prob.probability;
            if (rand <= cumulative) {
                // Collapse to measured state
                const newAmplitudes = Array(this.state.amplitudes.length).fill(
                    new Complex(0, 0)
                );
                newAmplitudes[prob.state] = new Complex(1, 0);
                this.state = new QuantumState(newAmplitudes);
                this.densityMatrix = new DensityMatrix(this.state);
                return prob.state;
            }
        }
        return probabilities[0].state;
    }

    /**
     * Get statistics
     */
    getStats() {
        return {
            step: this.step,
            knowledge: this.computeKnowledge(),
            entropy: this.state.entropy(),
            purity: this.state.purity(),
            berryPhase: this.berryPhaseAccumulated,
            expectedSteps: N_LEARN,
            progress: this.step / N_LEARN,
            converged: this.isConverged(),
            probabilities: this.state.amplitudes.map((amp, i) => ({
                state: i,
                probability: amp.magnitude() ** 2,
                phase: amp.phase()
            }))
        };
    }
}

/**
 * Quantum-Classical Transition
 * 
 * Shows how quantum learning transitions to classical
 */
class QuantumClassicalTransition {
    constructor() {
        this.quantumSystem = new QuantumLearningSystem({ numStates: 4 });
        this.classicalKnowledge = 0;
        this.transitionPoint = N_LEARN;
    }

    /**
     * Evolve both quantum and classical
     */
    evolve(dt = 0.01) {
        // Quantum evolution
        const quantum = this.quantumSystem.evolve(dt);
        
        // Classical approximation (from CE1 Learning Law)
        const { knowledgeCurvature } = require('./ce1_learning_law.js');
        this.classicalKnowledge = knowledgeCurvature(this.quantumSystem.step);
        
        return {
            quantum: quantum,
            classical: {
                knowledge: this.classicalKnowledge,
                step: this.quantumSystem.step
            },
            quantumClassicalGap: Math.abs(quantum.knowledge - this.classicalKnowledge)
        };
    }

    /**
     * Check if transition occurred
     */
    isTransitioned() {
        const gap = Math.abs(
            this.quantumSystem.computeKnowledge() - this.classicalKnowledge
        );
        return gap < 0.01; // Quantum and classical agree
    }
}

/**
 * Quantum Learning Experiment
 * 
 * Verify quantum learning constant
 */
class QuantumLearningExperiment {
    constructor() {
        this.results = [];
    }

    /**
     * Run experiment with different initial states
     */
    runExperiment(initialState, maxSteps = 500) {
        const system = new QuantumLearningSystem({
            numStates: initialState.length,
            energyLevels: Array(initialState.length).fill(0).map((_, i) => i + 1)
        });
        
        // Set initial state
        system.state = new QuantumState(
            initialState.map(amp => Complex.fromPolar(amp.magnitude, amp.phase))
        );
        system.densityMatrix = new DensityMatrix(system.state);
        
        const learningCurve = [];
        
        for (let i = 0; i < maxSteps; i++) {
            const result = system.evolve();
            learningCurve.push({
                step: result.step,
                knowledge: result.knowledge,
                entropy: result.entropy,
                purity: result.purity,
                berryPhase: result.berryPhase
            });
            
            if (result.converged) {
                break;
            }
        }
        
        const finalStats = system.getStats();
        
        this.results.push({
            initialState: initialState,
            learningSteps: finalStats.step,
            expectedSteps: N_LEARN,
            deviation: Math.abs(finalStats.step - N_LEARN),
            learningCurve,
            finalStats
        });
        
        return this.results[this.results.length - 1];
    }

    /**
     * Verify quantum learning constant
     */
    verifyConstant() {
        const deviations = this.results.map(r => r.deviation);
        const meanDeviation = deviations.reduce((a, b) => a + b, 0) / deviations.length;
        const maxDeviation = Math.max(...deviations);
        
        return {
            constant: N_LEARN,
            meanDeviation,
            maxDeviation,
            verified: maxDeviation < 20,
            results: this.results
        };
    }
}

export {
    Complex,
    QuantumState,
    DensityMatrix,
    Hamiltonian,
    LindbladOperator,
    QuantumLearningSystem,
    QuantumClassicalTransition,
    QuantumLearningExperiment,
    BERRY_PHASE,
    DECOHERENCE_RATE
};

