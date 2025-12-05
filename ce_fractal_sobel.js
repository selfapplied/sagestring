/**
 * CE Fractal Sobel: Semantic Edge Detection for Text Generation
 *
 * Detects semantic boundaries in sentences using fractal word fields.
 * Extends visual Sobel operators to linguistic domains.
 *
 * Architecture:
 *   - Words as fractal composites (letters → syllables → words)
 *   - Semantic gradients computed via field operators
 *   - Edge detection flags witness fragmentation points
 *   - Supports coherence rules (κ ≤ 0.35)
 *
 * Author: Joel
 */

class CEFractalSobel {
  constructor(options = {}) {
    this.kappa = options.kappa || 0.35;  // Coherence bound
    this.antclock = 0;
    
    // Field operators
    this.memory = [];           // [] memory-gradient
    this.domains = new Map();   // {} domain-curvature
    this.morphisms = new Map(); // () morphism-transform
    this.witness = {            // <> witness-invariant
      coherence: 1.0,
      stability: 1.0,
      edges: []
    };
    
    // Fractal word structures
    this.words = new Map();     // word → fractal decomposition
    this.syllables = new Map(); // syllable → energy
    this.letters = new Map();   // letter → shape energy
    
    // Semantic field grid
    this.fieldGrid = [];
    this.gradients = [];
    
    // Transformer mapping
    this.q = [];  // Q → [] gradient of intent
    this.k = [];  // K → {} curvature anchors
    this.v = [];  // V → () morphism action
    this.attention = []; // Attention → <> witness pressure
    
    console.log('🔍 CE Fractal Sobel initialized');
  }
  
  /**
   * Process sentence and detect semantic edges
   */
  processSentence(sentence, antclock = null) {
    if (antclock !== null) this.antclock = antclock;
    else this.antclock++;
    
    const tokens = this.tokenize(sentence);
    const words = tokens.map(t => this.decomposeWord(t));
    
    // Build field grid from words
    this.buildFieldGrid(words);
    
    // Compute semantic gradients (Sobel-like)
    this.computeSemanticGradients();
    
    // Detect edges (high gradient = semantic boundary)
    const edges = this.detectEdges();
    
    // Check coherence
    const coherence = this.computeCoherence(edges);
    
    // Update witness
    this.updateWitness(coherence, edges);
    
    return {
      words,
      edges,
      coherence,
      witness: this.witness,
      antclock: this.antclock
    };
  }
  
  /**
   * Tokenize sentence into words
   */
  tokenize(sentence) {
    return sentence
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 0);
  }
  
  /**
   * Decompose word into fractal structure
   * W = {} (∏ S_j) where S_j = () (∏ L_i)
   */
  decomposeWord(word) {
    if (this.words.has(word)) {
      return this.words.get(word);
    }
    
    const letters = Array.from(word);
    const letterFields = letters.map((l, i) => this.getLetterField(l, i));
    
    // Group into syllables (simplified: CV pattern)
    const syllables = this.groupIntoSyllables(letterFields);
    
    // Compute word coherence
    const coherence = this.computeWordCoherence(syllables);
    
    const wordStruct = {
      text: word,
      letters: letterFields,
      syllables,
      coherence,
      energy: this.computeWordEnergy(syllables)
    };
    
    this.words.set(word, wordStruct);
    return wordStruct;
  }
  
  /**
   * Get letter field: L_i = {C_i, V_i, φ_i}
   */
  getLetterField(letter, position) {
    if (this.letters.has(letter)) {
      return this.letters.get(letter);
    }
    
    const isVowel = /[aeiou]/.test(letter);
    const isConsonant = /[bcdfghjklmnpqrstvwxyz]/.test(letter);
    
    // Shape energy (semantic tilt of glyph)
    const phi = this.computeShapeEnergy(letter);
    
    const field = {
      letter,
      position,
      type: isVowel ? 'vowel' : isConsonant ? 'consonant' : 'other',
      phi,
      energy: isVowel ? 0.6 : isConsonant ? 0.8 : 0.3
    };
    
    this.letters.set(letter, field);
    return field;
  }
  
  /**
   * Compute shape energy (semantic tilt)
   */
  computeShapeEnergy(letter) {
    // Simple heuristic: round letters (o, e, a) have lower energy
    // angular letters (k, x, z) have higher energy
    const round = /[oaeu]/.test(letter) ? 0.3 : 0.7;
    const angular = /[kxz]/.test(letter) ? 0.9 : 0.5;
    return (round + angular) / 2;
  }
  
  /**
   * Group letters into syllables (simplified CV pattern)
   */
  groupIntoSyllables(letterFields) {
    const syllables = [];
    let currentSyllable = [];
    
    for (const field of letterFields) {
      if (field.type === 'vowel') {
        // Vowel starts new syllable or closes current
        if (currentSyllable.length > 0) {
          syllables.push(this.createSyllable(currentSyllable));
          currentSyllable = [field];
        } else {
          currentSyllable.push(field);
        }
      } else {
        currentSyllable.push(field);
      }
    }
    
    if (currentSyllable.length > 0) {
      syllables.push(this.createSyllable(currentSyllable));
    }
    
    return syllables;
  }
  
  /**
   * Create syllable: S_j = () (∏ L_i)
   */
  createSyllable(letterFields) {
    const text = letterFields.map(l => l.letter).join('');
    const energy = letterFields.reduce((sum, l) => sum + l.energy, 0) / letterFields.length;
    
    const syllable = {
      text,
      letters: letterFields,
      energy,
      morphism: this.computeMorphism(letterFields)
    };
    
    this.syllables.set(text, syllable);
    return syllable;
  }
  
  /**
   * Compute morphism transform for syllable
   */
  computeMorphism(letterFields) {
    // Morphism strength based on letter coherence
    const energies = letterFields.map(l => l.energy);
    const variance = this.variance(energies);
    return 1.0 - Math.min(1.0, variance);
  }
  
  /**
   * Compute word coherence: χ(W) = Σ χ(S_j) - Σ P_k
   */
  computeWordCoherence(syllables) {
    const syllableCoherence = syllables.reduce((sum, s) => sum + s.energy, 0);
    const pausePenalty = syllables.length > 1 ? (syllables.length - 1) * 0.1 : 0;
    return Math.max(0, syllableCoherence - pausePenalty);
  }
  
  /**
   * Compute word energy
   */
  computeWordEnergy(syllables) {
    return syllables.reduce((sum, s) => sum + s.energy, 0) / syllables.length;
  }
  
  /**
   * Build field grid from words
   * Each word becomes a field value in the semantic grid
   */
  buildFieldGrid(words) {
    this.fieldGrid = words.map((word, i) => ({
      index: i,
      word: word.text,
      energy: word.energy,
      coherence: word.coherence,
      domain: this.getDomain(word),
      morphism: this.getMorphism(i, words),
      witness: this.getWitness(word, i, words)
    }));
  }
  
  /**
   * Get domain curvature for word
   */
  getDomain(word) {
    // Domain based on word frequency/context
    const key = word.text;
    if (!this.domains.has(key)) {
      this.domains.set(key, {
        curvature: 0.5 + Math.random() * 0.3,
        concepts: new Set([word.text])
      });
    }
    return this.domains.get(key);
  }
  
  /**
   * Get morphism transform between words
   */
  getMorphism(index, words) {
    if (index === 0) return { strength: 1.0 };
    
    const prev = words[index - 1];
    const curr = words[index];
    
    const key = `${prev.text}→${curr.text}`;
    if (!this.morphisms.has(key)) {
      const strength = this.computeMorphismStrength(prev, curr);
      this.morphisms.set(key, { source: prev.text, target: curr.text, strength });
    }
    return this.morphisms.get(key);
  }
  
  /**
   * Compute morphism strength between words
   */
  computeMorphismStrength(word1, word2) {
    // Shared letters increase strength
    const letters1 = new Set(word1.text);
    const letters2 = new Set(word2.text);
    const shared = Array.from(letters1).filter(l => letters2.has(l)).length;
    const overlap = shared / Math.max(letters1.size, letters2.size);
    
    // Energy similarity
    const energyDiff = Math.abs(word1.energy - word2.energy);
    const energySim = 1.0 - Math.min(1.0, energyDiff);
    
    return (overlap * 0.6 + energySim * 0.4);
  }
  
  /**
   * Get witness invariant for word
   */
  getWitness(word, index, words) {
    // Witness pressure based on coherence and context
    const localCoherence = word.coherence;
    const contextCoherence = index > 0 
      ? this.computeContextCoherence(words.slice(Math.max(0, index - 2), index + 1))
      : 1.0;
    
    return {
      pressure: localCoherence * contextCoherence,
      stability: Math.min(1.0, localCoherence + contextCoherence * 0.5)
    };
  }
  
  /**
   * Compute context coherence
   */
  computeContextCoherence(contextWords) {
    if (contextWords.length < 2) return 1.0;
    
    const morphisms = [];
    for (let i = 1; i < contextWords.length; i++) {
      const strength = this.computeMorphismStrength(contextWords[i-1], contextWords[i]);
      morphisms.push(strength);
    }
    
    return morphisms.reduce((sum, m) => sum + m, 0) / morphisms.length;
  }
  
  /**
   * Compute semantic gradients (Sobel-like operator)
   * Detects rapid changes in field values
   */
  computeSemanticGradients() {
    const n = this.fieldGrid.length;
    this.gradients = [];
    
    for (let i = 0; i < n; i++) {
      const cell = this.fieldGrid[i];
      
      // Sobel-like gradient computation
      // gx: horizontal gradient (energy difference)
      // gy: vertical gradient (coherence difference)
      
      const prev = i > 0 ? this.fieldGrid[i - 1] : cell;
      const next = i < n - 1 ? this.fieldGrid[i + 1] : cell;
      
      // Energy gradient (horizontal)
      const gx = (next.energy - prev.energy) / 2;
      
      // Coherence gradient (vertical - semantic depth)
      const gy = cell.coherence - ((prev.coherence + next.coherence) / 2);
      
      // Magnitude and direction
      const magnitude = Math.sqrt(gx * gx + gy * gy);
      const direction = Math.atan2(gy, gx);
      
      this.gradients.push({
        index: i,
        word: cell.word,
        gx,
        gy,
        magnitude,
        direction,
        isEdge: magnitude > 0.3  // Threshold for edge detection
      });
    }
  }
  
  /**
   * Detect semantic edges (high gradient = boundary)
   */
  detectEdges() {
    return this.gradients
      .filter(g => g.isEdge)
      .map(g => ({
        position: g.index,
        word: g.word,
        magnitude: g.magnitude,
        direction: g.direction,
        type: this.classifyEdge(g)
      }));
  }
  
  /**
   * Classify edge type
   */
  classifyEdge(gradient) {
    const mag = gradient.magnitude;
    if (mag > 0.7) return 'strong';
    if (mag > 0.5) return 'medium';
    return 'weak';
  }
  
  /**
   * Compute coherence: Δ coherence = |<>_{n+1} - <>_n| < κ
   */
  computeCoherence(edges) {
    if (this.fieldGrid.length === 0) return 1.0;
    
    // Witness coherence across sentence
    const witnessValues = this.fieldGrid.map(cell => cell.witness.stability);
    const witnessDelta = this.computeDelta(witnessValues);
    
    // Check bound: κ ≤ 0.35
    const coherence = witnessDelta < this.kappa ? 1.0 : 1.0 - (witnessDelta - this.kappa);
    
    return Math.max(0, Math.min(1.0, coherence));
  }
  
  /**
   * Compute delta (max change in witness)
   */
  computeDelta(values) {
    if (values.length < 2) return 0;
    
    let maxDelta = 0;
    for (let i = 1; i < values.length; i++) {
      const delta = Math.abs(values[i] - values[i - 1]);
      maxDelta = Math.max(maxDelta, delta);
    }
    return maxDelta;
  }
  
  /**
   * Update witness invariant
   */
  updateWitness(coherence, edges) {
    this.witness.coherence = coherence;
    this.witness.stability = coherence > 0.8 ? 1.0 : coherence;
    this.witness.edges = edges;
    
    // Check if coherence bound violated
    if (coherence < 0.65) {
      console.warn(`⚠️ Witness coherence low: ${coherence.toFixed(3)} (bound: ${this.kappa})`);
    }
  }
  
  /**
   * Transformer mapping: Q, K, V → CE fields
   */
  mapTransformer(query, keys, values) {
    // Q → [] memory-gradient
    this.q = query.map((q, i) => ({
      intent: q,
      gradient: i > 0 ? q - this.q[i-1]?.intent : 0
    }));
    
    // K → {} curvature anchors
    this.k = keys.map(k => ({
      anchor: k,
      curvature: this.getDomain({ text: k }).curvature
    }));
    
    // V → () morphism action
    this.v = values.map((v, i) => ({
      value: v,
      morphism: i > 0 ? this.getMorphism(i, values.map(v => ({ text: v }))) : { strength: 1.0 }
    }));
    
    // Attention → <> witness pressure
    this.attention = this.q.map((q, i) => {
      const k = this.k[i] || { curvature: 0.5 };
      const v = this.v[i] || { morphism: { strength: 0.5 } };
      
      return {
        pressure: q.gradient * k.curvature * v.morphism.strength,
        witness: this.witness.coherence
      };
    });
    
    return {
      q: this.q,
      k: this.k,
      v: this.v,
      attention: this.attention
    };
  }
  
  /**
   * Generate next token using field evolution
   * Sentence_{a+1} = []W_a + ()(W_a → W_{a+1}) + <>_stability
   */
  generateNextToken(currentWords, options = {}) {
    if (currentWords.length === 0) return null;
    
    const lastWord = currentWords[currentWords.length - 1];
    const memoryGradient = this.memory.length > 0 
      ? this.memory[this.memory.length - 1]
      : { gradient: 0 };
    
    // Compute morphism transform
    const morphism = this.getMorphism(currentWords.length - 1, currentWords);
    
    // Witness stability
    const witnessStability = this.witness.stability;
    
    // Field evolution
    const nextEnergy = lastWord.energy + 
                       memoryGradient.gradient * 0.3 +
                       morphism.strength * 0.4 +
                       witnessStability * 0.3;
    
    // Find candidate word with similar energy
    const candidates = Array.from(this.words.values())
      .map(w => ({
        word: w,
        distance: Math.abs(w.energy - nextEnergy)
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 5);
    
    if (candidates.length === 0) return null;
    
    // Select based on coherence
    const selected = candidates[0].word;
    
    // Update memory
    this.memory.push({
      word: selected.text,
      gradient: nextEnergy - lastWord.energy,
      antclock: this.antclock
    });
    
    return selected;
  }
  
  /**
   * Generate full response using fractal field evolution
   * Uses Tower levels: Ground → Expand → Contract → Resolve
   */
  generateResponse(userMessage, options = {}) {
    this.antclock++;
    
    // Process user message to seed the field
    const userAnalysis = this.processSentence(userMessage, this.antclock);
    
    // Ground: Set domain and witness
    const domain = this.getDomain({ text: userMessage.split(/\s+/)[0] || 'hello' });
    const initialWitness = this.witness.coherence;
    
    // Expand: Build response using field evolution
    const responseWords = [];
    const maxWords = options.maxWords || 15;
    const seedWords = this.tokenize(userMessage).slice(0, 3).map(w => this.decomposeWord(w));
    
    // Start with seed words
    let currentWords = [...seedWords];
    
    // Generate response word by word
    for (let i = 0; i < maxWords; i++) {
      const nextWord = this.generateNextToken(currentWords, options);
      if (!nextWord) break;
      
      currentWords.push(nextWord);
      responseWords.push(nextWord);
      
      // Check coherence after each word
      const tempSentence = responseWords.map(w => w.text).join(' ');
      const tempAnalysis = this.processSentence(tempSentence, this.antclock);
      
      // Contract: Refine if coherence drops
      if (tempAnalysis.coherence < 0.6) {
        // Try to recover by selecting different word
        const alternatives = Array.from(this.words.values())
          .filter(w => w.text !== nextWord.text)
          .slice(0, 3);
        
        if (alternatives.length > 0) {
          currentWords.pop();
          responseWords.pop();
          const alt = alternatives[0];
          currentWords.push(alt);
          responseWords.push(alt);
        }
      }
      
      // Resolve: Check if we should stop
      if (this.shouldStop(responseWords, tempAnalysis)) {
        break;
      }
    }
    
    // Final coherence check
    const finalSentence = responseWords.map(w => w.text).join(' ');
    const finalAnalysis = this.processSentence(finalSentence, this.antclock);
    
    return {
      text: this.formatResponse(responseWords),
      coherence: finalAnalysis.coherence,
      edges: finalAnalysis.edges,
      witness: finalAnalysis.witness,
      words: responseWords,
      antclock: this.antclock
    };
  }
  
  /**
   * Check if generation should stop
   */
  shouldStop(words, analysis) {
    // Stop if coherence too low
    if (analysis.coherence < 0.5) return true;
    
    // Stop if too many edges (fragmentation)
    if (analysis.edges.length > words.length * 0.4) return true;
    
    // Stop if sentence feels complete (ends with common endings)
    if (words.length > 5) {
      const lastWord = words[words.length - 1].text;
      const endings = ['the', 'and', 'is', 'are', 'was', 'were', 'this', 'that'];
      if (endings.includes(lastWord)) return true;
    }
    
    return false;
  }
  
  /**
   * Format response words into sentence
   */
  formatResponse(words) {
    if (words.length === 0) return '';
    
    let text = words[0].text;
    for (let i = 1; i < words.length; i++) {
      text += ' ' + words[i].text;
    }
    
    // Capitalize first letter
    text = text.charAt(0).toUpperCase() + text.slice(1);
    
    // Add period if needed
    if (!text.endsWith('.') && !text.endsWith('!') && !text.endsWith('?')) {
      text += '.';
    }
    
    return text;
  }
  
  /**
   * Get word candidates from vocabulary (simple word list)
   */
  initializeVocabulary(commonWords = []) {
    const defaultWords = [
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be',
      'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
      'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that',
      'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they',
      'what', 'which', 'who', 'when', 'where', 'why', 'how', 'all', 'each',
      'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such', 'no',
      'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just',
      'now', 'think', 'know', 'see', 'come', 'want', 'use', 'find', 'give',
      'tell', 'work', 'call', 'try', 'ask', 'need', 'feel', 'become', 'leave',
      'put', 'mean', 'keep', 'let', 'begin', 'seem', 'help', 'show', 'hear',
      'play', 'run', 'move', 'like', 'live', 'believe', 'bring', 'happen',
      'write', 'sit', 'stand', 'lose', 'pay', 'meet', 'include', 'continue',
      'set', 'learn', 'change', 'lead', 'understand', 'watch', 'follow', 'stop',
      'create', 'speak', 'read', 'allow', 'add', 'spend', 'grow', 'open', 'walk',
      'win', 'offer', 'remember', 'love', 'consider', 'appear', 'buy', 'wait',
      'serve', 'die', 'send', 'build', 'stay', 'fall', 'cut', 'reach', 'kill',
      'raise', 'pass', 'sell', 'decide', 'return', 'explain', 'hope', 'develop',
      'carry', 'break', 'receive', 'agree', 'support', 'hit', 'produce', 'eat',
      'cover', 'catch', 'draw', 'choose'
    ];
    
    const words = commonWords.length > 0 ? commonWords : defaultWords;
    words.forEach(word => this.decomposeWord(word));
  }
  
  /**
   * Utility: variance
   */
  variance(values) {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const sqDiff = values.map(v => Math.pow(v - mean, 2));
    return sqDiff.reduce((a, b) => a + b, 0) / values.length;
  }
  
  /**
   * Get status
   */
  getStatus() {
    return {
      antclock: this.antclock,
      kappa: this.kappa,
      witness: this.witness,
      words: this.words.size,
      domains: this.domains.size,
      morphisms: this.morphisms.size,
      memory: this.memory.length
    };
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CEFractalSobel };
}

