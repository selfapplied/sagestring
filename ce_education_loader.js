/**
 * CE Education Loader: Transform Curricula into Learnable Manifolds
 *
 * A CE-powered ingestion pipeline that structures educational content
 * as phase, witness, memory, and morphism - enabling genuine learning
 * rather than mere memorization.
 *
 * Architecture:
 *   [] - Memory as history (progression of ideas, not static storage)
 *   {} - Domains as manifolds (nested semantic spaces with curvature)
 *   () - Morphisms as thinking (conceptual transformations)
 *   <> - Witness as self-awareness (metacognition, insight pressure)
 *
 * Author: Joel
 */

class CEEducationLoader {
  constructor(options = {}) {
    // CE1 structures
    this.ce1 = {
      memory: [],        // [] - progression of understanding
      region: {},        // {} - semantic domains as manifolds
      morphisms: {},     // () - conceptual transformations
      witness: {         // <> - self-awareness and invariants
        invariants: [],
        coherence: 0,
        stability: 0,
        insightPressure: 0
      }
    };

    // CE2 integration (guardian-modulated attention)
    this.ce2 = {
      antclock: 0,       // Experiential time, not positional
      guardians: {
        phi: 0.85,      // Phase resonance
        partial: 0.92,  // Structural coherence
        scriptr: 0.88   // Semantic alignment
      },
      phaseCoherence: 0
    };

    // Learning state
    this.learningState = {
      currentDomain: null,
      understandingPath: [],
      confusionPoints: [],
      clarityMoments: [],
      crossDomainMappings: []
    };

    // Content structure
    this.course = {
      title: null,
      domains: new Map(),
      lectures: [],
      concepts: new Map(),
      morphisms: new Map()
    };

    // Sobel edge detection for conceptual boundaries
    this.conceptualEdges = {
      gradients: new Map(),
      boundaries: new Map(),
      transitions: []
    };

    console.log('📚 CE Education Loader initialized');
  }

  /**
   * Load course content and structure as CE manifold
   */
  async loadCourse(courseData) {
    this.course.title = courseData.title || 'Untitled Course';

    // Structure content into CE domains
    await this.structureDomains(courseData);

    // Extract conceptual morphisms
    await this.extractMorphisms(courseData);

    // Initialize witness invariants
    this.initializeWitness();

    // Build learning path
    this.buildLearningPath();

    console.log(`📖 Course "${this.course.title}" loaded as CE manifold`);
    return this;
  }

  /**
   * Structure content into nested semantic domains ({} - manifolds)
   */
  async structureDomains(courseData) {
    const domains = courseData.domains || courseData.modules || [];

    for (const domainData of domains) {
      const domain = {
        id: domainData.id || `domain_${this.course.domains.size}`,
        name: domainData.name || 'Unnamed Domain',
        concepts: new Map(),
        curvature: 0,  // Semantic curvature of the domain
        connections: [],
        antclock: 0
      };

      // Process concepts within domain
      const concepts = domainData.concepts || domainData.topics || [];
      for (const conceptData of concepts) {
        const concept = this.createConcept(conceptData, domain.id);
        domain.concepts.set(concept.id, concept);

        // Store globally
        this.course.concepts.set(concept.id, concept);
      }

      // Compute domain curvature (how concepts relate)
      domain.curvature = this.computeDomainCurvature(domain);

      this.course.domains.set(domain.id, domain);
      this.ce1.region[domain.id] = domain;
    }
  }

  /**
   * Create concept with CE structure
   */
  createConcept(conceptData, domainId) {
    const concept = {
      id: conceptData.id || `concept_${Date.now()}_${Math.random()}`,
      name: conceptData.name || conceptData.title || 'Unnamed Concept',
      content: conceptData.content || conceptData.text || '',
      domain: domainId,
      
      // Memory structure ([] - history of understanding)
      memory: {
        initialState: null,
        transitions: [],
        refinements: [],
        currentState: null
      },

      // Witness structure (<> - self-awareness)
      witness: {
        invariants: this.extractInvariants(conceptData),
        coherence: 0,
        confusion: 0,
        clarity: 0
      },

      // Morphism connections (() - transformations)
      morphisms: {
        from: [],
        to: [],
        operations: []
      },

      // Sobel edges (conceptual boundaries)
      edges: {
        gradient: 0,
        boundary: null,
        neighbors: []
      }
    };

    // Initialize memory with initial confusion
    concept.memory.initialState = {
      understanding: 0,
      confusion: 1.0,
      timestamp: this.ce2.antclock
    };
    concept.memory.currentState = { ...concept.memory.initialState };

    return concept;
  }

  /**
   * Extract invariants from concept (what does this teach?)
   */
  extractInvariants(conceptData) {
    const invariants = conceptData.invariants || [];

    // Auto-detect invariants from content
    if (conceptData.content) {
      const content = conceptData.content.toLowerCase();
      
      // Pattern detection for invariants
      if (content.includes('always') || content.includes('never')) {
        invariants.push('universal_principle');
      }
      if (content.includes('transform') || content.includes('map')) {
        invariants.push('morphism_structure');
      }
      if (content.includes('relation') || content.includes('connect')) {
        invariants.push('domain_connection');
      }
      if (content.includes('proof') || content.includes('demonstrate')) {
        invariants.push('witness_verification');
      }
    }

    return invariants.length > 0 ? invariants : ['core_principle'];
  }

  /**
   * Compute domain curvature (semantic geometry)
   */
  computeDomainCurvature(domain) {
    const concepts = Array.from(domain.concepts.values());
    if (concepts.length < 2) return 0;

    let totalCurvature = 0;
    let connections = 0;

    // Measure how concepts relate (curvature = deviation from flat)
    for (let i = 0; i < concepts.length; i++) {
      for (let j = i + 1; j < concepts.length; j++) {
        const similarity = this.computeConceptSimilarity(concepts[i], concepts[j]);
        const curvature = Math.abs(similarity - 0.5); // Deviation from neutral
        totalCurvature += curvature;
        connections++;
      }
    }

    return connections > 0 ? totalCurvature / connections : 0;
  }

  /**
   * Compute similarity between concepts
   */
  computeConceptSimilarity(concept1, concept2) {
    // Simple content-based similarity
    const content1 = (concept1.content || '').toLowerCase();
    const content2 = (concept2.content || '').toLowerCase();

    if (!content1 || !content2) return 0.5;

    // Shared words
    const words1 = new Set(content1.split(/\s+/));
    const words2 = new Set(content2.split(/\s+/));
    
    const intersection = new Set([...words1].filter(w => words2.has(w)));
    const union = new Set([...words1, ...words2]);

    return union.size > 0 ? intersection.size / union.size : 0;
  }

  /**
   * Extract morphisms between concepts (() - transformations)
   */
  async extractMorphisms(courseData) {
    const allConcepts = Array.from(this.course.concepts.values());

    for (const concept of allConcepts) {
      // Find related concepts
      const related = this.findRelatedConcepts(concept, allConcepts);

      for (const target of related) {
        const morphismId = `${concept.id}→${target.id}`;
        
        if (!this.course.morphisms.has(morphismId)) {
          const morphism = {
            id: morphismId,
            source: concept.id,
            target: target.id,
            operation: this.inferMorphismOperation(concept, target),
            strength: this.computeMorphismStrength(concept, target),
            antclock: this.ce2.antclock
          };

          this.course.morphisms.set(morphismId, morphism);
          concept.morphisms.to.push(morphismId);
          target.morphisms.from.push(morphismId);

          // Store in CE1
          this.ce1.morphisms[morphismId] = morphism;
        }
      }
    }
  }

  /**
   * Find related concepts
   */
  findRelatedConcepts(concept, allConcepts, threshold = 0.2) {
    return allConcepts
      .filter(c => c.id !== concept.id)
      .map(c => ({
        concept: c,
        similarity: this.computeConceptSimilarity(concept, c)
      }))
      .filter(pair => pair.similarity > threshold)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 5)
      .map(pair => pair.concept);
  }

  /**
   * Infer morphism operation type
   */
  inferMorphismOperation(source, target) {
    const sourceContent = (source.content || '').toLowerCase();
    const targetContent = (target.content || '').toLowerCase();

    // Pattern detection for operation types
    if (sourceContent.includes('general') && targetContent.includes('specific')) {
      return 'specialization';
    }
    if (sourceContent.includes('specific') && targetContent.includes('general')) {
      return 'generalization';
    }
    if (sourceContent.includes('example') || targetContent.includes('example')) {
      return 'instantiation';
    }
    if (sourceContent.includes('analog') || targetContent.includes('analog')) {
      return 'analogy';
    }
    if (sourceContent.includes('proof') || targetContent.includes('derive')) {
      return 'derivation';
    }

    return 'transformation';
  }

  /**
   * Compute morphism strength
   */
  computeMorphismStrength(source, target) {
    const similarity = this.computeConceptSimilarity(source, target);
    const domainMatch = source.domain === target.domain ? 1.0 : 0.5;
    
    return similarity * domainMatch;
  }

  /**
   * Initialize witness structure
   */
  initializeWitness() {
    const allConcepts = Array.from(this.course.concepts.values());
    const allInvariants = new Set();

    // Collect all invariants
    for (const concept of allConcepts) {
      for (const invariant of concept.witness.invariants) {
        allInvariants.add(invariant);
      }
    }

    this.ce1.witness.invariants = Array.from(allInvariants);
    this.ce1.witness.coherence = this.computeGlobalCoherence();
    this.ce1.witness.stability = 0.5; // Initial stability
    this.ce1.witness.insightPressure = 0.0; // Will grow with learning
  }

  /**
   * Compute global coherence
   */
  computeGlobalCoherence() {
    const domains = Array.from(this.course.domains.values());
    if (domains.length === 0) return 0;

    let totalCoherence = 0;
    for (const domain of domains) {
      const concepts = Array.from(domain.concepts.values());
      if (concepts.length === 0) continue;

      let domainCoherence = 0;
      for (const concept of concepts) {
        // Coherence = how well concept fits in domain
        const domainFit = this.computeDomainFit(concept, domain);
        domainCoherence += domainFit;
      }
      totalCoherence += domainCoherence / concepts.length;
    }

    return totalCoherence / domains.length;
  }

  /**
   * Compute how well concept fits in domain
   */
  computeDomainFit(concept, domain) {
    const domainConcepts = Array.from(domain.concepts.values());
    if (domainConcepts.length < 2) return 0.5;

    let totalSimilarity = 0;
    let count = 0;

    for (const other of domainConcepts) {
      if (other.id !== concept.id) {
        totalSimilarity += this.computeConceptSimilarity(concept, other);
        count++;
      }
    }

    return count > 0 ? totalSimilarity / count : 0.5;
  }

  /**
   * Build learning path ([] - memory as history)
   */
  buildLearningPath() {
    const domains = Array.from(this.course.domains.values());
    
    // Sort domains by complexity/curvature
    const sortedDomains = [...domains].sort((a, b) => a.curvature - b.curvature);

    const path = [];
    for (const domain of sortedDomains) {
      const concepts = Array.from(domain.concepts.values());
      
      // Sort concepts within domain
      const sortedConcepts = [...concepts].sort((a, b) => {
        // Prioritize concepts with many incoming morphisms (dependencies)
        return a.morphisms.from.length - b.morphisms.from.length;
      });

      for (const concept of sortedConcepts) {
        path.push({
          type: 'concept',
          conceptId: concept.id,
          domainId: domain.id,
          antclock: this.ce2.antclock
        });
      }
    }

    this.learningState.understandingPath = path;
    this.ce1.memory = path.map(step => ({
      type: 'learning_step',
      step: step,
      timestamp: step.antclock,
      state: 'pending'
    }));
  }

  /**
   * Learn a concept (simulate learning process)
   */
  async learnConcept(conceptId, options = {}) {
    const concept = this.course.concepts.get(conceptId);
    if (!concept) {
      throw new Error(`Concept ${conceptId} not found`);
    }

    // Advance antclock (experiential time)
    this.ce2.antclock++;

    // Record initial confusion
    const initialConfusion = concept.memory.currentState.confusion;
    concept.witness.confusion = initialConfusion;

    // Learning process: confusion → clarity
    const learningSteps = options.steps || 5;
    const transitions = [];

    for (let step = 0; step < learningSteps; step++) {
      // Update understanding through morphisms
      const understanding = await this.updateUnderstanding(concept, step, learningSteps);
      
      // Record transition
      const transition = {
        from: { ...concept.memory.currentState },
        to: {
          understanding: understanding,
          confusion: Math.max(0, initialConfusion - understanding),
          timestamp: this.ce2.antclock
        },
        morphism: this.selectActiveMorphism(concept)
      };

      transitions.push(transition);
      concept.memory.currentState = transition.to;
      concept.memory.transitions.push(transition);

      // Update witness
      concept.witness.confusion = transition.to.confusion;
      concept.witness.clarity = transition.to.understanding;
      concept.witness.coherence = this.computeConceptCoherence(concept);

      // Update guardians (CE2)
      this.updateGuardians(concept);

      // Advance antclock
      this.ce2.antclock++;
    }

    // Record clarity moment
    if (concept.memory.currentState.understanding > 0.7) {
      this.learningState.clarityMoments.push({
        conceptId: conceptId,
        understanding: concept.memory.currentState.understanding,
        antclock: this.ce2.antclock
      });
    }

    // Update global witness
    this.updateGlobalWitness();

    return {
      concept: concept,
      transitions: transitions,
      finalState: concept.memory.currentState
    };
  }

  /**
   * Update understanding through morphisms
   */
  async updateUnderstanding(concept, step, totalSteps) {
    const baseUnderstanding = concept.memory.currentState.understanding || 0;
    
    // Learning curve (sigmoid-like)
    const progress = step / totalSteps;
    const naturalGrowth = 1 / (1 + Math.exp(-5 * (progress - 0.5)));

    // Morphism contribution
    const morphismBoost = this.computeMorphismBoost(concept);
    
    // Guardian modulation (CE2)
    const guardianModulation = this.computeGuardianModulation();

    const newUnderstanding = Math.min(1.0, 
      baseUnderstanding + 
      (naturalGrowth - baseUnderstanding) * 0.3 +
      morphismBoost * 0.2 +
      guardianModulation * 0.1
    );

    return newUnderstanding;
  }

  /**
   * Compute boost from morphisms
   */
  computeMorphismBoost(concept) {
    const incomingMorphisms = concept.morphisms.from.map(id => 
      this.course.morphisms.get(id)
    ).filter(m => m);

    if (incomingMorphisms.length === 0) return 0;

    // Strength of incoming understanding
    let totalBoost = 0;
    for (const morphism of incomingMorphisms) {
      const source = this.course.concepts.get(morphism.source);
      if (source && source.memory.currentState) {
        const sourceUnderstanding = source.memory.currentState.understanding || 0;
        totalBoost += sourceUnderstanding * morphism.strength;
      }
    }

    return totalBoost / incomingMorphisms.length;
  }

  /**
   * Select active morphism for learning
   */
  selectActiveMorphism(concept) {
    const available = concept.morphisms.from.map(id => 
      this.course.morphisms.get(id)
    ).filter(m => m);

    if (available.length === 0) return null;

    // Select strongest morphism
    return available.reduce((best, current) => 
      current.strength > best.strength ? current : best
    );
  }

  /**
   * Compute concept coherence
   */
  computeConceptCoherence(concept) {
    const understanding = concept.memory.currentState.understanding || 0;
    const confusion = concept.witness.confusion || 0;
    
    // Coherence = understanding / (understanding + confusion)
    return understanding + confusion > 0 
      ? understanding / (understanding + confusion)
      : 0;
  }

  /**
   * Update guardians (CE2 - ϕ, ∂, ℛ)
   */
  updateGuardians(concept) {
    const understanding = concept.memory.currentState.understanding || 0;
    const confusion = concept.witness.confusion || 0;

    // ϕ (Phase): Semantic direction
    this.ce2.guardians.phi = Math.max(0.3, Math.min(0.98, 
      0.85 + (understanding - confusion) * 0.1
    ));

    // ∂ (Structure): How well concept fits domain
    const domain = this.course.domains.get(concept.domain);
    const domainFit = domain ? this.computeDomainFit(concept, domain) : 0.5;
    this.ce2.guardians.partial = Math.max(0.3, Math.min(0.98,
      0.92 * domainFit
    ));

    // ℛ (Coherence): Alignment between understanding and structure
    this.ce2.guardians.scriptr = Math.max(0.3, Math.min(0.98,
      (this.ce2.guardians.phi + this.ce2.guardians.partial) / 2
    ));
  }

  /**
   * Compute guardian modulation
   */
  computeGuardianModulation() {
    const avgGuardian = (
      this.ce2.guardians.phi +
      this.ce2.guardians.partial +
      this.ce2.guardians.scriptr
    ) / 3;

    return (avgGuardian - 0.85) / 0.15; // Normalize around baseline
  }

  /**
   * Update global witness
   */
  updateGlobalWitness() {
    const allConcepts = Array.from(this.course.concepts.values());
    
    let totalCoherence = 0;
    let totalConfusion = 0;
    let totalClarity = 0;

    for (const concept of allConcepts) {
      totalCoherence += concept.witness.coherence || 0;
      totalConfusion += concept.witness.confusion || 0;
      totalClarity += concept.witness.clarity || 0;
    }

    const count = allConcepts.length;
    if (count > 0) {
      this.ce1.witness.coherence = totalCoherence / count;
      this.ce1.witness.insightPressure = totalConfusion / count; // Tension drives learning
      this.ce1.witness.stability = totalClarity / count;
    }
  }

  /**
   * Detect conceptual edges using Sobel-like gradient
   */
  detectConceptualEdges(domainId) {
    const domain = this.course.domains.get(domainId);
    if (!domain) return;

    const concepts = Array.from(domain.concepts.values());
    const edges = [];

    for (let i = 0; i < concepts.length; i++) {
      const concept = concepts[i];
      const neighbors = this.findConceptNeighbors(concept, concepts);
      
      // Compute gradient (change in understanding/coherence)
      const gradient = this.computeConceptGradient(concept, neighbors);
      
      concept.edges.gradient = gradient;
      concept.edges.neighbors = neighbors.map(n => n.id);

      if (gradient > 0.3) {
        edges.push({
          conceptId: concept.id,
          gradient: gradient,
          boundary: true
        });
      }
    }

    this.conceptualEdges.boundaries.set(domainId, edges);
    return edges;
  }

  /**
   * Find concept neighbors in domain
   */
  findConceptNeighbors(concept, allConcepts) {
    return allConcepts
      .filter(c => c.id !== concept.id)
      .map(c => ({
        concept: c,
        similarity: this.computeConceptSimilarity(concept, c)
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 3)
      .map(pair => pair.concept);
  }

  /**
   * Compute concept gradient (Sobel-like)
   */
  computeConceptGradient(concept, neighbors) {
    if (neighbors.length === 0) return 0;

    const conceptCoherence = concept.witness.coherence || 0;
    
    let gradientX = 0;
    let gradientY = 0;

    for (const neighbor of neighbors) {
      const neighborCoherence = neighbor.witness.coherence || 0;
      const diff = neighborCoherence - conceptCoherence;
      
      // Simplified gradient computation
      gradientX += diff;
      gradientY += Math.abs(diff);
    }

    const gradient = Math.sqrt(gradientX * gradientX + gradientY * gradientY) / neighbors.length;
    return gradient;
  }

  /**
   * Get learning status
   */
  getStatus() {
    return {
      course: this.course.title,
      domains: this.course.domains.size,
      concepts: this.course.concepts.size,
      morphisms: this.course.morphisms.size,
      antclock: this.ce2.antclock,
      witness: this.ce1.witness,
      guardians: this.ce2.guardians,
      learningPath: this.learningState.understandingPath.length,
      clarityMoments: this.learningState.clarityMoments.length
    };
  }

  /**
   * Export course as CE manifold structure
   */
  exportManifold() {
    return {
      ce1: {
        memory: this.ce1.memory,
        region: Object.fromEntries(
          Array.from(this.course.domains.entries()).map(([id, domain]) => [
            id,
            {
              id: domain.id,
              name: domain.name,
              curvature: domain.curvature,
              conceptCount: domain.concepts.size
            }
          ])
        ),
        morphisms: this.ce1.morphisms,
        witness: this.ce1.witness
      },
      ce2: {
        antclock: this.ce2.antclock,
        guardians: this.ce2.guardians,
        phaseCoherence: this.ce2.phaseCoherence
      },
      course: {
        title: this.course.title,
        domains: Array.from(this.course.domains.keys()),
        concepts: Array.from(this.course.concepts.keys()),
        morphisms: Array.from(this.course.morphisms.keys())
      }
    };
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CEEducationLoader };
}

