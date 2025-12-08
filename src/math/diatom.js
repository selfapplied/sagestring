/**
 * Diatom Computing: Computation Through Biological Growth
 * 
 * Diatoms compute using glass (silica), not silicon semiconductors.
 * The frustule (silica shell) is both program and result.
 * 
 * Key Theorems:
 * 1. Fixed-Point: < {D} + [L] + (M) + F > has unique fixed point if (M) is contraction
 * 2. Colony Synchronization: N diatoms achieve consensus in O(√N) steps
 * 
 * Author: Joel
 */

/**
 * Diatom Frustule (Silica Shell)
 * 
 * Structure encoded in CE1 brackets:
 *   {D} = domain (boundary conditions)
 *   [L] = lattice (discrete structure)
 *   (M) = morphism (growth operator)
 *   F = frustule (result)
 */
class DiatomFrustule {
    constructor(options = {}) {
        // Boundary domain {D}
        this.domain = {
            radius: options.radius || 10,
            symmetry: options.symmetry || 'radial', // 'radial' or 'bilateral'
            pores: options.pores || [],
            ridges: options.ridges || []
        };
        
        // Lattice structure [L]
        this.lattice = {
            nodes: options.nodes || this.generateInitialNodes(),
            edges: [],
            connectivity: 0
        };
        
        // Morphism (growth operator) (M)
        this.morphism = {
            growthRate: options.growthRate || 0.1,
            contractionFactor: options.contractionFactor || 0.9,
            isContraction: true
        };
        
        // Frustule result F
        this.frustule = {
            structure: null,
            optical: null,
            fixedPoint: null
        };
        
        this.generation = 0;
        this.ce1Expression = null;
    }

    /**
     * Generate initial node structure
     */
    generateInitialNodes() {
        const nodes = [];
        const numNodes = 12; // Typical diatom structure
        
        for (let i = 0; i < numNodes; i++) {
            const angle = (2 * Math.PI * i) / numNodes;
            nodes.push({
                x: this.domain.radius * Math.cos(angle),
                y: this.domain.radius * Math.sin(angle),
                id: i,
                silica: 1.0
            });
        }
        
        return nodes;
    }

    /**
     * CE1 Expression: < {D} + [L] + (M) + F >
     */
    toCE1Expression() {
        const domainStr = `{radius:${this.domain.radius},symmetry:${this.domain.symmetry}}`;
        const latticeStr = `[nodes:${this.lattice.nodes.length},edges:${this.lattice.edges.length}]`;
        const morphismStr = `(growth:${this.morphism.growthRate},contract:${this.morphism.contractionFactor})`;
        const frustuleStr = this.frustule.structure ? 'F' : 'null';
        
        this.ce1Expression = `<${domainStr}+${latticeStr}+${morphismStr}+${frustuleStr}>`;
        return this.ce1Expression;
    }

    /**
     * Growth iteration: Apply morphism (M)
     * 
     * Fixed-Point Theorem: If (M) is contraction, this converges
     */
    grow() {
        this.generation++;
        
        // Apply growth operator
        const growthFactor = 1 + this.morphism.growthRate;
        const contractionFactor = this.morphism.contractionFactor;
        
        // Update nodes (silica deposition)
        this.lattice.nodes = this.lattice.nodes.map(node => ({
            ...node,
            x: node.x * growthFactor * contractionFactor,
            y: node.y * growthFactor * contractionFactor,
            silica: Math.min(1.0, node.silica * growthFactor)
        }));
        
        // Update domain radius
        this.domain.radius *= growthFactor * contractionFactor;
        
        // Check for fixed point
        const distance = this.computeDistance();
        if (distance < 0.001) {
            this.frustule.fixedPoint = {
                generation: this.generation,
                structure: this.lattice.nodes,
                converged: true
            };
        }
        
        return this;
    }

    /**
     * Compute distance metric for fixed-point convergence
     */
    computeDistance() {
        if (this.generation === 0) return Infinity;
        
        // Simplified: measure change in structure
        const currentSize = this.domain.radius;
        const previousSize = currentSize / (1 + this.morphism.growthRate);
        return Math.abs(currentSize - previousSize);
    }

    /**
     * Build frustule structure
     */
    buildFrustule() {
        // Connect nodes to form frustule
        this.lattice.edges = [];
        for (let i = 0; i < this.lattice.nodes.length; i++) {
            const next = (i + 1) % this.lattice.nodes.length;
            this.lattice.edges.push({
                from: i,
                to: next,
                strength: this.lattice.nodes[i].silica
            });
        }
        
        this.frustule.structure = {
            nodes: this.lattice.nodes,
            edges: this.lattice.edges,
            symmetry: this.domain.symmetry
        };
        
        return this;
    }

    /**
     * Optical waveguiding properties
     */
    computeOptical() {
        // Frustule acts as optical waveguide
        const refractiveIndex = 1.5; // Silica
        const wavelength = 500; // nm
        
        this.frustule.optical = {
            waveguide: true,
            refractiveIndex,
            wavelength,
            modes: this.computeOpticalModes()
        };
        
        return this;
    }

    /**
     * Compute optical modes
     */
    computeOpticalModes() {
        // Simplified: number of modes based on structure
        const perimeter = 2 * Math.PI * this.domain.radius;
        const modeCount = Math.floor(perimeter / 100); // Approximate
        return modeCount;
    }
}

/**
 * Diatom Colony
 * 
 * Colony Synchronization Theorem:
 * N diatoms achieve consensus in O(√N) steps
 */
class DiatomColony {
    constructor(options = {}) {
        this.diatoms = [];
        this.size = options.size || 10;
        this.consensusSteps = 0;
        this.consensusReached = false;
        
        // Initialize colony
        for (let i = 0; i < this.size; i++) {
            this.diatoms.push(new DiatomFrustule({
                radius: 10 + Math.random() * 5,
                growthRate: 0.1 + Math.random() * 0.05
            }));
        }
    }

    /**
     * Colony growth: all diatoms grow simultaneously
     */
    grow() {
        this.diatoms.forEach(diatom => diatom.grow());
        this.consensusSteps++;
        
        // Check for consensus (synchronization)
        if (this.checkConsensus()) {
            this.consensusReached = true;
        }
        
        return this;
    }

    /**
     * Check if colony has reached consensus
     * 
     * Consensus = all diatoms have similar structure
     */
    checkConsensus(tolerance = 0.1) {
        if (this.diatoms.length === 0) return false;
        
        const radii = this.diatoms.map(d => d.domain.radius);
        const mean = radii.reduce((a, b) => a + b, 0) / radii.length;
        const variance = radii.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / radii.length;
        const stdDev = Math.sqrt(variance);
        
        // Consensus: low variance relative to mean
        return stdDev / mean < tolerance;
    }

    /**
     * Expected consensus steps: O(√N)
     */
    expectedConsensusSteps() {
        return Math.ceil(Math.sqrt(this.size));
    }

    /**
     * Optical network: connect diatoms via light
     */
    createOpticalNetwork() {
        const network = {
            nodes: this.diatoms.map((d, i) => ({
                id: i,
                diatom: d,
                position: { x: 0, y: 0 } // Simplified
            })),
            edges: []
        };
        
        // Connect nearby diatoms (simplified)
        for (let i = 0; i < network.nodes.length; i++) {
            for (let j = i + 1; j < network.nodes.length; j++) {
                const distance = Math.random(); // Simplified
                if (distance < 0.3) {
                    network.edges.push({
                        from: i,
                        to: j,
                        type: 'optical',
                        strength: 1.0 / (1 + distance)
                    });
                }
            }
        }
        
        return network;
    }
}

/**
 * Fixed-Point Solver for Diatom Growth
 * 
 * Theorem: < {D} + [L] + (M) + F > has unique fixed point if (M) is contraction
 */
class DiatomFixedPoint {
    constructor(diatom) {
        this.diatom = diatom;
        this.maxIterations = 100;
        this.tolerance = 0.001;
    }

    /**
     * Compute fixed point
     */
    compute() {
        const history = [];
        
        for (let i = 0; i < this.maxIterations; i++) {
            const before = this.diatom.domain.radius;
            this.diatom.grow();
            const after = this.diatom.domain.radius;
            
            const distance = Math.abs(after - before);
            history.push({
                iteration: i,
                radius: after,
                distance
            });
            
            if (distance < this.tolerance) {
                return {
                    fixedPoint: this.diatom,
                    iterations: i + 1,
                    converged: true,
                    history
                };
            }
        }
        
        return {
            fixedPoint: this.diatom,
            iterations: this.maxIterations,
            converged: false,
            history
        };
    }
}

/**
 * Diatom Computing System
 * 
 * Integrates diatom growth with CE1/ZP systems
 */
class DiatomComputingSystem {
    constructor() {
        this.colony = new DiatomColony({ size: 20 });
        this.opticalNetwork = null;
    }

    /**
     * Run full computing cycle
     */
    compute() {
        // 1. Grow colony
        for (let i = 0; i < 10; i++) {
            this.colony.grow();
        }
        
        // 2. Build frustules
        this.colony.diatoms.forEach(d => d.buildFrustule());
        
        // 3. Compute optical properties
        this.colony.diatoms.forEach(d => d.computeOptical());
        
        // 4. Create optical network
        this.opticalNetwork = this.colony.createOpticalNetwork();
        
        // 5. Check consensus
        const consensus = this.colony.checkConsensus();
        
        return {
            colony: this.colony,
            network: this.opticalNetwork,
            consensus,
            consensusSteps: this.colony.consensusSteps,
            expectedSteps: this.colony.expectedConsensusSteps()
        };
    }

    /**
     * Map to CE1 expression
     */
    toCE1() {
        return this.colony.diatoms.map(d => d.toCE1Expression());
    }
}

export {
    DiatomFrustule,
    DiatomColony,
    DiatomFixedPoint,
    DiatomComputingSystem
};

