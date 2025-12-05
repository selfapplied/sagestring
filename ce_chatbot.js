/**
 * CE Tower Chatbot: Query Course Data Through CE Architecture
 *
 * A chatbot that uses CE Tower (CE1/CE2/CE3) to reason through course data.
 * Uses witness, guardians, morphisms, and memory to answer questions.
 *
 * Architecture:
 *   CE1: Memory search, domain navigation, morphism traversal
 *   CE2: Guardian-modulated attention (phi, partial, scriptr)
 *   CE3: Error-lift for learning and adaptation
 *
 * Author: Joel
 */

class CEChatbot {
  constructor(educationLoader, options = {}) {
    this.loader = educationLoader;
    this.conversationHistory = [];
    this.antclock = 0;

    // CE Tower integration
    this.ce1 = {
      memory: [],
      activeDomains: new Set(),
      activeMorphisms: new Map(),
      witness: {
        coherence: 0,
        confidence: 0
      }
    };

    this.ce2 = {
      guardians: {
        phi: 0.85,      // Phase resonance (semantic alignment)
        partial: 0.92,  // Structural coherence
        scriptr: 0.88   // Overall coherence
      },
      attention: new Map()  // Concept attention weights
    };

    this.ce3 = {
      errorLiftCount: 0,
      expressivity: 1.0,
      learning: true
    };

    // Query processing
    this.queryCache = new Map();
    this.maxResults = options.maxResults || 5;
    this.confidenceThreshold = options.confidenceThreshold || 0.3;

    console.log('🤖 CE Chatbot initialized');
  }

  /**
   * Process user query using CE Tower
   */
  async query(userMessage) {
    this.antclock++;
    
    // Store in conversation history
    this.conversationHistory.push({
      type: 'user',
      message: userMessage,
      antclock: this.antclock
    });

    // CE1: Parse query and identify relevant domains
    const queryAnalysis = this.analyzeQuery(userMessage);
    
    // CE2: Use guardians to modulate attention
    this.updateGuardiansForQuery(queryAnalysis);
    
    // CE1: Search through memory and domains
    const searchResults = await this.searchCourseData(queryAnalysis);
    
    // CE1: Traverse morphisms to find related concepts
    const relatedConcepts = this.traverseMorphisms(searchResults);
    
    // CE2: Rank results by guardian-modulated attention
    const rankedResults = this.rankByAttention(searchResults.concat(relatedConcepts));
    
    // CE1: Generate response using witness coherence
    const response = await this.generateResponse(userMessage, rankedResults, queryAnalysis);
    
    // CE3: Check for error-lift (low confidence = need to learn)
    if (response.confidence < this.confidenceThreshold) {
      this.triggerErrorLift(queryAnalysis, response);
    }

    // Store response
    this.conversationHistory.push({
      type: 'bot',
      message: response.text,
      confidence: response.confidence,
      sources: response.sources,
      antclock: this.antclock
    });

    // Update CE1 memory
    this.updateMemory(queryAnalysis, response);

    return response;
  }

  /**
   * Analyze query to extract intent and keywords
   */
  analyzeQuery(query) {
    const text = query.toLowerCase();
    
    // Extract keywords
    const keywords = text
      .split(/\s+/)
      .filter(word => word.length > 3)
      .filter(word => !['what', 'how', 'why', 'when', 'where', 'explain', 'tell', 'about'].includes(word));

    // Detect query type
    let queryType = 'general';
    if (text.includes('what is') || text.includes('define')) {
      queryType = 'definition';
    } else if (text.includes('how') || text.includes('explain')) {
      queryType = 'explanation';
    } else if (text.includes('example') || text.includes('instance')) {
      queryType = 'example';
    } else if (text.includes('relate') || text.includes('connect') || text.includes('similar')) {
      queryType = 'relation';
    } else if (text.includes('practice') || text.includes('apply')) {
      queryType = 'application';
    }

    // Identify target domains
    const targetDomains = this.identifyTargetDomains(text);

    return {
      original: query,
      keywords: keywords,
      type: queryType,
      domains: targetDomains,
      antclock: this.antclock
    };
  }

  /**
   * Identify target domains from query
   */
  identifyTargetDomains(queryText) {
    const domains = [];
    const allDomains = Array.from(this.loader.course.domains.values());

    for (const domain of allDomains) {
      const domainText = (domain.name + ' ' + domain.description || '').toLowerCase();
      const queryWords = queryText.split(/\s+/);
      
      const matches = queryWords.filter(word => 
        word.length > 3 && domainText.includes(word)
      ).length;

      if (matches > 0) {
        domains.push({
          domain: domain,
          relevance: matches / queryWords.length
        });
      }
    }

    return domains.sort((a, b) => b.relevance - a.relevance).slice(0, 3);
  }

  /**
   * Update guardians based on query
   */
  updateGuardiansForQuery(queryAnalysis) {
    // ϕ (Phase): Semantic alignment with query
    const keywordCoverage = this.computeKeywordCoverage(queryAnalysis.keywords);
    this.ce2.guardians.phi = Math.max(0.3, Math.min(0.98, 0.85 + keywordCoverage * 0.1));

    // ∂ (Structure): Domain coherence
    const domainCoherence = queryAnalysis.domains.length > 0 
      ? queryAnalysis.domains[0].relevance 
      : 0.5;
    this.ce2.guardians.partial = Math.max(0.3, Math.min(0.98, 0.92 * domainCoherence));

    // ℛ (Coherence): Overall alignment
    this.ce2.guardians.scriptr = (
      this.ce2.guardians.phi + this.ce2.guardians.partial
    ) / 2;
  }

  /**
   * Compute keyword coverage in course
   */
  computeKeywordCoverage(keywords) {
    if (keywords.length === 0) return 0;

    let totalMatches = 0;
    const allConcepts = Array.from(this.loader.course.concepts.values());

    for (const keyword of keywords) {
      for (const concept of allConcepts) {
        const content = (concept.name + ' ' + concept.content).toLowerCase();
        if (content.includes(keyword)) {
          totalMatches++;
          break;
        }
      }
    }

    return totalMatches / keywords.length;
  }

  /**
   * Search course data using CE structures
   */
  async searchCourseData(queryAnalysis) {
    const results = [];
    const allConcepts = Array.from(this.loader.course.concepts.values());

    // Search concepts
    for (const concept of allConcepts) {
      const relevance = this.computeRelevance(concept, queryAnalysis);
      
      if (relevance > this.confidenceThreshold) {
        results.push({
          type: 'concept',
          concept: concept,
          relevance: relevance,
          source: 'direct_match'
        });
      }
    }

    // Search domains
    for (const domainInfo of queryAnalysis.domains) {
      const domain = domainInfo.domain;
      const concepts = Array.from(domain.concepts.values());
      
      for (const concept of concepts) {
        const relevance = this.computeRelevance(concept, queryAnalysis) * domainInfo.relevance;
        
        if (relevance > this.confidenceThreshold) {
          results.push({
            type: 'concept',
            concept: concept,
            relevance: relevance,
            source: 'domain_match',
            domain: domain
          });
        }
      }
    }

    return results;
  }

  /**
   * Compute relevance of concept to query
   */
  computeRelevance(concept, queryAnalysis) {
    const conceptText = (concept.name + ' ' + concept.content).toLowerCase();
    let score = 0;

    // Keyword matching
    for (const keyword of queryAnalysis.keywords) {
      if (conceptText.includes(keyword)) {
        score += 0.3;
      }
    }

    // Name matching (higher weight)
    const nameLower = concept.name.toLowerCase();
    for (const keyword of queryAnalysis.keywords) {
      if (nameLower.includes(keyword) || keyword.includes(nameLower)) {
        score += 0.5;
      }
    }

    // Witness coherence (concepts with high coherence are more reliable)
    const witnessBoost = concept.witness?.coherence || 0;
    score += witnessBoost * 0.2;

    // Normalize
    return Math.min(1.0, score);
  }

  /**
   * Traverse morphisms to find related concepts
   */
  traverseMorphisms(initialResults) {
    const related = [];
    const visited = new Set();

    for (const result of initialResults) {
      if (result.type !== 'concept') continue;
      
      const concept = result.concept;
      if (visited.has(concept.id)) continue;
      visited.add(concept.id);

      // Follow outgoing morphisms
      for (const morphismId of concept.morphisms.to || []) {
        const morphism = this.loader.course.morphisms.get(morphismId);
        if (!morphism) continue;

        const target = this.loader.course.concepts.get(morphism.target);
        if (target && !visited.has(target.id)) {
          related.push({
            type: 'concept',
            concept: target,
            relevance: result.relevance * morphism.strength * 0.7, // Decay through morphism
            source: 'morphism',
            morphism: morphism
          });
          visited.add(target.id);
        }
      }

      // Follow incoming morphisms
      for (const morphismId of concept.morphisms.from || []) {
        const morphism = this.loader.course.morphisms.get(morphismId);
        if (!morphism) continue;

        const source = this.loader.course.concepts.get(morphism.source);
        if (source && !visited.has(source.id)) {
          related.push({
            type: 'concept',
            concept: source,
            relevance: result.relevance * morphism.strength * 0.7,
            source: 'morphism',
            morphism: morphism
          });
          visited.add(source.id);
        }
      }
    }

    return related;
  }

  /**
   * Rank results by guardian-modulated attention
   */
  rankByAttention(results) {
    // Compute attention weights
    for (const result of results) {
      if (result.type !== 'concept') continue;

      const concept = result.concept;
      
      // Base attention from relevance
      let attention = result.relevance;

      // Guardian modulation
      const guardianModulation = (
        this.ce2.guardians.phi * 0.4 +
        this.ce2.guardians.partial * 0.3 +
        this.ce2.guardians.scriptr * 0.3
      );

      // Witness coherence boost
      const witnessBoost = concept.witness?.coherence || 0;

      // Final attention score
      attention = attention * guardianModulation + witnessBoost * 0.2;

      result.attention = attention;
      this.ce2.attention.set(concept.id, attention);
    }

    // Sort by attention
    return results
      .sort((a, b) => (b.attention || b.relevance) - (a.attention || a.relevance))
      .slice(0, this.maxResults);
  }

  /**
   * Generate response using CE structures
   */
  async generateResponse(userMessage, rankedResults, queryAnalysis) {
    if (rankedResults.length === 0) {
      return {
        text: "I don't have enough information to answer that question. Could you rephrase or ask about a different topic?",
        confidence: 0.0,
        sources: []
      };
    }

    // Build response from top results
    const topResult = rankedResults[0];
    const concept = topResult.concept;

    let responseText = '';
    let confidence = topResult.attention || topResult.relevance;

    // Generate response based on query type
    switch (queryAnalysis.type) {
      case 'definition':
        responseText = this.generateDefinition(concept, queryAnalysis);
        break;
      case 'explanation':
        responseText = this.generateExplanation(concept, rankedResults, queryAnalysis);
        break;
      case 'example':
        responseText = this.generateExample(concept, queryAnalysis);
        break;
      case 'relation':
        responseText = this.generateRelation(concept, rankedResults, queryAnalysis);
        break;
      case 'application':
        responseText = this.generateApplication(concept, queryAnalysis);
        break;
      default:
        responseText = this.generateGeneral(concept, rankedResults, queryAnalysis);
    }

    // Add context from related concepts
    if (rankedResults.length > 1) {
      const related = rankedResults.slice(1, 3);
      if (related.length > 0) {
        responseText += '\n\nRelated concepts: ';
        responseText += related.map(r => r.concept.name).join(', ');
      }
    }

    // Compute final confidence using witness
    const witnessCoherence = this.loader.ce1.witness.coherence || 0;
    confidence = confidence * 0.7 + witnessCoherence * 0.3;

    return {
      text: responseText,
      confidence: Math.min(1.0, confidence),
      sources: rankedResults.map(r => ({
        concept: r.concept.name,
        domain: r.domain?.name || r.concept.domain,
        relevance: r.relevance
      }))
    };
  }

  /**
   * Generate definition response
   */
  generateDefinition(concept, queryAnalysis) {
    const content = concept.content || '';
    const name = concept.name;
    
    if (content.length > 200) {
      return `${name} is ${content.substring(0, 200)}...`;
    }
    return `${name} is ${content}`;
  }

  /**
   * Generate explanation response
   */
  generateExplanation(concept, rankedResults, queryAnalysis) {
    let explanation = `${concept.name}: ${concept.content || 'No explanation available.'}`;
    
    // Add morphism context
    if (concept.morphisms.from && concept.morphisms.from.length > 0) {
      const morphismId = concept.morphisms.from[0];
      const morphism = this.loader.course.morphisms.get(morphismId);
      if (morphism) {
        const source = this.loader.course.concepts.get(morphism.source);
        if (source) {
          explanation += `\n\nThis builds on ${source.name} through ${morphism.operation || 'transformation'}.`;
        }
      }
    }

    return explanation;
  }

  /**
   * Generate example response
   */
  generateExample(concept, queryAnalysis) {
    const content = concept.content || '';
    
    // Look for example patterns
    if (content.includes('example') || content.includes('instance')) {
      return content;
    }

    return `${concept.name}: ${content}\n\nFor a practical example, consider how this concept applies in practice.`;
  }

  /**
   * Generate relation response
   */
  generateRelation(concept, rankedResults, queryAnalysis) {
    let relation = `${concept.name} relates to: `;
    const related = rankedResults.slice(1, 4);
    
    if (related.length > 0) {
      relation += related.map(r => r.concept.name).join(', ');
    } else {
      // Use morphisms
      const morphisms = concept.morphisms.to || concept.morphisms.from || [];
      if (morphisms.length > 0) {
        const morphismId = morphisms[0];
        const morphism = this.loader.course.morphisms.get(morphismId);
        if (morphism) {
          const otherId = morphism.source === concept.id ? morphism.target : morphism.source;
          const other = this.loader.course.concepts.get(otherId);
          if (other) {
            relation += `${other.name} (via ${morphism.operation || 'transformation'})`;
          }
        }
      }
    }

    return relation;
  }

  /**
   * Generate application response
   */
  generateApplication(concept, queryAnalysis) {
    const content = concept.content || '';
    
    // Look for practice/application patterns
    if (content.includes('practice') || content.includes('apply')) {
      return content;
    }

    return `${concept.name}: ${content}\n\nTo apply this, consider the practical steps and how they relate to your situation.`;
  }

  /**
   * Generate general response
   */
  generateGeneral(concept, rankedResults, queryAnalysis) {
    return `${concept.name}: ${concept.content || 'Information about this concept.'}`;
  }

  /**
   * Trigger error-lift when confidence is low
   */
  triggerErrorLift(queryAnalysis, response) {
    this.ce3.errorLiftCount++;
    this.ce3.expressivity += 0.05; // Learn from error

    // Update guardians to reflect uncertainty
    this.ce2.guardians.phi = Math.max(0.3, this.ce2.guardians.phi - 0.1);
    this.ce2.guardians.scriptr = Math.max(0.3, this.ce2.guardians.scriptr - 0.1);

    console.log(`CE3: Error-lift triggered (confidence: ${response.confidence.toFixed(2)})`);
  }

  /**
   * Update memory with query and response
   */
  updateMemory(queryAnalysis, response) {
    this.ce1.memory.push({
      query: queryAnalysis,
      response: response,
      antclock: this.antclock
    });

    // Update witness coherence
    this.ce1.witness.coherence = response.confidence;
    this.ce1.witness.confidence = response.confidence;

    // Keep memory bounded
    if (this.ce1.memory.length > 50) {
      this.ce1.memory.shift();
    }
  }

  /**
   * Get conversation history
   */
  getHistory() {
    return this.conversationHistory;
  }

  /**
   * Get CE Tower status
   */
  getStatus() {
    return {
      antclock: this.antclock,
      ce1: {
        memorySize: this.ce1.memory.length,
        witness: this.ce1.witness
      },
      ce2: {
        guardians: this.ce2.guardians,
        attentionSize: this.ce2.attention.size
      },
      ce3: {
        errorLiftCount: this.ce3.errorLiftCount,
        expressivity: this.ce3.expressivity
      }
    };
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CEChatbot };
}

