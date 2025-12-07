/**
 * Wave Scheduler - A First-Class Primitive
 * 
 * Not a loop. Not a timer. Not a queue.
 * 
 * A dynamical operator that produces event times by evolving a phase.
 * 
 * state[n+1] = E(state[n])
 * event_time[n] = f(state[n])
 * 
 * Where:
 *   E : State -> State  (operator)
 *   p : State           (phase/initial state)
 *   f : State -> Time   (sampling function)
 */

class WaveScheduler {
    /**
     * Create a wave scheduler
     * 
     * @param {Object} config
     * @param {Function|Array|Object} config.operator - Evolution operator E
     * @param {Array|Object} config.phase - Initial state/phase p
     * @param {Function} config.sample - Sampling function f(state) -> time
     * @param {String} config.name - Optional name for debugging
     */
    constructor(config) {
        this.operator = this.normalizeOperator(config.operator);
        this.phase = this.normalizePhase(config.phase);
        this.sample = config.sample || ((state) => state[0]);
        this.name = config.name || 'wave';
        
        // Current state
        this.state = this.phase.slice ? [...this.phase] : {...this.phase};
        this.n = 0;
        
        // Event history
        this.events = [];
        this.maxEvents = config.maxEvents || 1000;
    }
    
    /**
     * Normalize operator to a function
     * Accepts: function, matrix (2D array), or operator object
     */
    normalizeOperator(op) {
        if (typeof op === 'function') {
            return op;
        }
        
        if (Array.isArray(op) && Array.isArray(op[0])) {
            // Matrix form: v' = M * v
            return (state) => {
                const result = new Array(op.length).fill(0);
                for (let i = 0; i < op.length; i++) {
                    for (let j = 0; j < op[i].length; j++) {
                        result[i] += op[i][j] * state[j];
                    }
                }
                return result;
            };
        }
        
        if (op && typeof op.apply === 'function') {
            // Operator object with apply method
            return (state) => op.apply(state);
        }
        
        throw new Error('Invalid operator format');
    }
    
    /**
     * Normalize phase to array or object
     */
    normalizePhase(phase) {
        if (Array.isArray(phase)) {
            return phase;
        }
        if (typeof phase === 'object' && phase !== null) {
            return phase;
        }
        throw new Error('Phase must be array or object');
    }
    
    /**
     * Evolve state one step
     * state[n+1] = E(state[n])
     */
    evolve() {
        this.state = this.operator(this.state);
        this.n++;
        return this.state;
    }
    
    /**
     * Get next event time
     * event_time = f(state)
     */
    next() {
        const time = this.sample(this.state);
        this.events.push({
            n: this.n,
            time: time,
            state: this.state.slice ? [...this.state] : {...this.state}
        });
        
        // Trim history
        if (this.events.length > this.maxEvents) {
            this.events.shift();
        }
        
        return time;
    }
    
    /**
     * Evolve and get next event
     */
    step() {
        this.evolve();
        return this.next();
    }
    
    /**
     * Reset to initial phase
     */
    reset() {
        this.state = this.phase.slice ? [...this.phase] : {...this.phase};
        this.n = 0;
        this.events = [];
    }
    
    /**
     * Get current state
     */
    getState() {
        return this.state.slice ? [...this.state] : {...this.state};
    }
    
    /**
     * Get phase (eigenbasis decomposition)
     * For linear operators, returns amplitude + phase for each mode
     */
    getPhase() {
        // For now, return raw state
        // TODO: eigenbasis decomposition for linear operators
        return {
            state: this.getState(),
            n: this.n,
            events: this.events.length
        };
    }
    
    /**
     * Compose with another scheduler (superposition)
     * Returns a new scheduler that samples from both
     */
    compose(other, combine = (a, b) => a + b) {
        return new WaveScheduler({
            operator: (state) => {
                const s1 = this.operator(state.self);
                const s2 = other.operator(state.other);
                return { self: s1, other: s2 };
            },
            phase: {
                self: this.getState(),
                other: other.getState()
            },
            sample: (state) => {
                const t1 = this.sample(state.self);
                const t2 = other.sample(state.other);
                return combine(t1, t2);
            },
            name: `${this.name}+${other.name}`
        });
    }
}

/**
 * Canonical Wave Schedulers
 */

// Fibonacci scheduler
// E = [[1,1],[1,0]], p = [1,1], f(state) = state[0]
WaveScheduler.fibonacci = (y0 = 1, y1 = 1) => {
    return new WaveScheduler({
        operator: [[1, 1], [1, 0]],
        phase: [y0, y1],
        sample: (state) => state[0],
        name: 'fibonacci'
    });
};

// Harmonic oscillator scheduler
// Rotates 2D vector by angle θ
WaveScheduler.harmonic = (frequency = 1.0, amplitude = 1.0, phase0 = 0) => {
    const dt = 0.01; // time step
    const omega = 2 * Math.PI * frequency;
    
    return new WaveScheduler({
        operator: (state) => {
            // [x, v] -> [x + v*dt, v - omega^2*x*dt]
            const [x, v] = state;
            return [
                x + v * dt,
                v - omega * omega * x * dt
            ];
        },
        phase: [amplitude * Math.cos(phase0), -amplitude * omega * Math.sin(phase0)],
        sample: (state) => state[0], // sample x coordinate
        name: 'harmonic'
    });
};

// Exponential backoff scheduler
// y[n+1] = α * y[n], with phase lock
WaveScheduler.exponential = (base = 2.0, initial = 1.0) => {
    return new WaveScheduler({
        operator: (state) => [state[0] * base],
        phase: [initial],
        sample: (state) => state[0],
        name: 'exponential'
    });
};

// Linear scheduler
// y[n+1] = y[n] + Δ
WaveScheduler.linear = (delta = 1.0, initial = 0.0) => {
    return new WaveScheduler({
        operator: (state) => [state[0] + delta],
        phase: [initial],
        sample: (state) => state[0],
        name: 'linear'
    });
};

// CE bracket scheduler
// Uses [] {} () <> as basis directions
WaveScheduler.ce = (witness = 0.5, memory = 0.5, morphism = 0.5, domain = 0.5) => {
    // Simple CE evolution: each bracket influences others
    return new WaveScheduler({
        operator: (state) => {
            const [mem, wit, mor, dom] = state;
            return [
                mem * 0.9 + wit * 0.1,  // [] memory influenced by <> witness
                wit * 0.9 + mor * 0.1,   // <> witness influenced by () morphism
                mor * 0.9 + dom * 0.1,  // () morphism influenced by {} domain
                dom * 0.9 + mem * 0.1   // {} domain influenced by [] memory
            ];
        },
        phase: [memory, witness, morphism, domain],
        sample: (state) => {
            // Sample as weighted sum of brackets
            return state[0] + state[1] + state[2] + state[3];
        },
        name: 'ce'
    });
};

// Feigenbaum cascade scheduler
// Logistic map near period-doubling
WaveScheduler.feigenbaum = (r = 3.56995, x0 = 0.5) => {
    return new WaveScheduler({
        operator: (state) => {
            const [x] = state;
            return [r * x * (1 - x)];
        },
        phase: [x0],
        sample: (state) => state[0],
        name: 'feigenbaum'
    });
};

/**
 * Superposition: combine multiple schedulers
 */
WaveScheduler.superpose = (schedulers, combine = (times) => Math.min(...times)) => {
    const states = schedulers.map(s => s.getState());
    
    return new WaveScheduler({
        operator: (combinedState) => {
            return schedulers.map((s, i) => {
                s.state = combinedState[i];
                return s.evolve();
            });
        },
        phase: states,
        sample: (combinedState) => {
            const times = schedulers.map((s, i) => {
                s.state = combinedState[i];
                return s.sample(combinedState[i]);
            });
            return combine(times);
        },
        name: `superpose(${schedulers.map(s => s.name).join(',')})`
    });
};

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { WaveScheduler };
}

window.WaveScheduler = WaveScheduler;

