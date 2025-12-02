/**
 * SVG Declarative Parser for Guardian Specifications
 *
 * Parses XML/SVG declarations into executable JavaScript objects
 * for the spatiotemporal continuity system.
 */

class SVGDeclarativeParser {
  /**
   * Parse SVG declarative specifications
   */
  constructor() {
    this.declarations = new Map();
    this.parameters = new Map();
    this.rules = [];
  }

  /**
   * Parse XML/SVG string into declarations
   */
  parse(xmlString) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlString, 'text/xml');

    // Parse parameters
    this.parseParameters(doc);

    // Parse guardian declarations
    this.parseGuardians(doc);

    // Parse lifecycle rules
    this.parseRules(doc);

    return {
      declarations: this.declarations,
      parameters: this.parameters,
      rules: this.rules
    };
  }

  /**
   * Parse parameter definitions
   */
  parseParameters(doc) {
    const paramElements = doc.querySelectorAll('param, parameters param');

    for (const param of paramElements) {
      const name = param.getAttribute('name');
      const value = parseFloat(param.getAttribute('value') || param.textContent);

      if (name && !isNaN(value)) {
        this.parameters.set(name, value);
      }
    }
  }

  /**
   * Parse guardian declarations
   */
  parseGuardians(doc) {
    const guardians = doc.querySelectorAll('guardian');

    for (const guardian of guardians) {
      const declaration = this.parseGuardianDeclaration(guardian);
      this.declarations.set(declaration.id, declaration);
    }

    // Also parse feg elements (functional expressions)
    const fegs = doc.querySelectorAll('feg');
    for (const feg of fegs) {
      const declaration = this.parseFEGDeclaration(feg);
      this.declarations.set(declaration.id, declaration);
    }
  }

  /**
   * Parse individual guardian declaration
   */
  parseGuardianDeclaration(element) {
    const id = element.getAttribute('id') || element.getAttribute('symbol');
    const symbol = element.getAttribute('symbol') || id;

    const declaration = {
      type: 'guardian',
      id: id,
      symbol: symbol,
      attributes: {},
      expressions: {},
      visualElements: []
    };

    // Parse attributes
    for (const attr of element.attributes) {
      if (attr.name !== 'id' && attr.name !== 'symbol') {
        declaration.attributes[attr.name] = this.parseExpression(attr.value);
      }
    }

    // Parse child elements
    for (const child of element.children) {
      if (child.tagName === 'ellipse' || child.tagName === 'circle') {
        declaration.visualElements.push(this.parseVisualElement(child));
      }
    }

    return declaration;
  }

  /**
   * Parse FEG (Functional Expression Generator) declaration
   */
  parseFEGDeclaration(element) {
    const symbol = element.getAttribute('symbol');

    const declaration = {
      type: 'feg',
      id: symbol,
      symbol: symbol,
      expression: this.parseExpression(element.textContent || ''),
      attributes: {}
    };

    // Parse attributes
    for (const attr of element.attributes) {
      if (attr.name !== 'symbol') {
        declaration.attributes[attr.name] = this.parseExpression(attr.value);
      }
    }

    return declaration;
  }

  /**
   * Parse visual element (ellipse, circle, etc.)
   */
  parseVisualElement(element) {
    const visual = {
      type: element.tagName,
      attributes: {}
    };

    for (const attr of element.attributes) {
      visual.attributes[attr.name] = this.parseExpression(attr.value);
    }

    return visual;
  }

  /**
   * Parse expression string into executable form
   */
  parseExpression(exprString) {
    if (!exprString) return null;

    // Handle calc() expressions
    if (exprString.startsWith('calc(') && exprString.endsWith(')')) {
      const innerExpr = exprString.slice(5, -1);
      return this.parseCalcExpression(innerExpr);
    }

    // Handle direct references
    if (exprString.includes('.')) {
      return this.parseReferenceExpression(exprString);
    }

    // Handle numeric literals
    const numValue = parseFloat(exprString);
    if (!isNaN(numValue)) {
      return numValue;
    }

    // Return as string
    return exprString;
  }

  /**
   * Parse calc() expressions
   */
  parseCalcExpression(expr) {
    // Replace parameter references
    expr = expr.replace(/\$(\w+)/g, (match, param) => {
      return this.parameters.get(param) || match;
    });

    // Convert to JavaScript expression
    return {
      type: 'calc',
      expression: expr,
      evaluate: (context) => this.evaluateCalcExpression(expr, context)
    };
  }

  /**
   * Parse reference expressions (agent.property)
   */
  parseReferenceExpression(expr) {
    const parts = expr.split('.');

    return {
      type: 'reference',
      object: parts[0],
      property: parts[1],
      evaluate: (context) => this.evaluateReferenceExpression(parts, context)
    };
  }

  /**
   * Evaluate calc expression with context
   */
  evaluateCalcExpression(expr, context) {
    try {
      // Replace variable references
      let processedExpr = expr;

      // Replace agent properties
      processedExpr = processedExpr.replace(/\b(\w+)\.(\w+)\b/g, (match, obj, prop) => {
        const value = this.getContextValue(context, obj, prop);
        return typeof value === 'number' ? value.toString() : '0';
      });

      // Replace function calls
      processedExpr = processedExpr.replace(/\b(\w+)\(([^)]*)\)/g, (match, func, args) => {
        return this.evaluateFunction(func, args.split(',').map(a => a.trim()), context);
      });

      // Evaluate the expression
      return Function('"use strict"; return (' + processedExpr + ')')();
    } catch (e) {
      console.warn('Calc evaluation error:', e);
      return 0;
    }
  }

  /**
   * Evaluate reference expression
   */
  evaluateReferenceExpression(parts, context) {
    return this.getContextValue(context, parts[0], parts[1]);
  }

  /**
   * Get value from context
   */
  getContextValue(context, object, property) {
    if (context[object] && typeof context[object][property] !== 'undefined') {
      return context[object][property];
    }

    // Check for special properties
    if (object === 'centroid' && property === 'x') {
      return context.agent?.centroid?.[0] || 0;
    }
    if (object === 'centroid' && property === 'y') {
      return context.agent?.centroid?.[1] || 0;
    }
    if (object === 'axes') {
      if (property === 'major') return context.agent?.boundaryStability * 50 || 20;
      if (property === 'minor') return context.agent?.boundaryStability * 30 || 15;
    }

    return this.parameters.get(property) || 0;
  }

  /**
   * Evaluate function calls
   */
  evaluateFunction(funcName, args, context) {
    switch (funcName) {
      case 'length':
        return args[0] === 'intersect(∂A, W)' ? context.agent?.guardianState * 100 : 100;
      case 'hsl':
        const h = parseFloat(args[0]);
        const s = args[1] || '80%';
        const l = args[2] || '50%';
        return `hsl(${h}, ${s}, ${l})`;
      default:
        return 0;
    }
  }

  /**
   * Parse lifecycle rules
   */
  parseRules(doc) {
    const ruleElements = doc.querySelectorAll('split-rule, merge-rule, spawn-rule, reappear-rule');

    for (const ruleElement of ruleElements) {
      const rule = this.parseRule(ruleElement);
      this.rules.push(rule);
    }
  }

  /**
   * Parse individual rule
   */
  parseRule(element) {
    const rule = {
      type: element.tagName,
      conditions: [],
      actions: []
    };

    // Parse conditions
    const conditionElements = element.querySelectorAll('condition');
    for (const condition of conditionElements) {
      rule.conditions.push(this.parseCondition(condition));
    }

    // Parse actions
    const actionElements = element.querySelectorAll('action');
    for (const action of actionElements) {
      rule.actions.push(this.parseAction(action));
    }

    // Parse direct attributes for some rules
    if (element.tagName === 'merge-rule') {
      const compatibility = element.querySelector('compatibility');
      const threshold = element.querySelector('threshold');

      if (compatibility) rule.compatibility = this.parseExpression(compatibility.textContent);
      if (threshold) rule.threshold = parseFloat(threshold.textContent);
    }

    return rule;
  }

  /**
   * Parse condition
   */
  parseCondition(element) {
    return {
      expression: this.parseExpression(element.textContent),
      evaluate: (context) => this.evaluateCondition(element.textContent, context)
    };
  }

  /**
   * Parse action
   */
  parseAction(element) {
    return {
      command: element.textContent.trim(),
      execute: (context) => this.executeAction(element.textContent.trim(), context)
    };
  }

  /**
   * Evaluate condition
   */
  evaluateCondition(expr, context) {
    try {
      // Replace references
      let processedExpr = expr.replace(/\b(\w+)\.(\w+)\b/g, (match, obj, prop) => {
        return this.getContextValue(context, obj, prop);
      });

      return Function('"use strict"; return (' + processedExpr + ')')();
    } catch (e) {
      console.warn('Condition evaluation error:', e);
      return false;
    }
  }

  /**
   * Execute action
   */
  executeAction(command, context) {
    console.log('Executing action:', command);
    // Actions are handled by the main system
    return true;
  }

  /**
   * Evaluate declaration with context
   */
  evaluateDeclaration(declarationId, context) {
    const declaration = this.declarations.get(declarationId);
    if (!declaration) return null;

    const result = {};

    // Evaluate attributes
    for (const [key, expr] of Object.entries(declaration.attributes)) {
      if (expr && expr.evaluate) {
        result[key] = expr.evaluate(context);
      } else {
        result[key] = expr;
      }
    }

    // Evaluate expressions
    for (const [key, expr] of Object.entries(declaration.expressions)) {
      if (expr && expr.evaluate) {
        result[key] = expr.evaluate(context);
      } else {
        result[key] = expr;
      }
    }

    return result;
  }
}

// Camera frustum specification parser
class CameraFrustumParser {
  /**
   * Parse camera frustum specifications
   */
  static parseFrustum(element) {
    const frustum = {
      width: parseFloat(element.getAttribute('width')) || 1920,
      height: parseFloat(element.getAttribute('height')) || 1080,
      fov: parseFloat(element.getAttribute('fov')) || 60,
      near: parseFloat(element.getAttribute('near')) || 0.1,
      far: parseFloat(element.getAttribute('far')) || 1000
    };

    // Convert to bounds for our system
    return {
      left: -frustum.width / 2,
      top: -frustum.height / 2,
      right: frustum.width / 2,
      bottom: frustum.height / 2,
      width: frustum.width,
      height: frustum.height
    };
  }
}

// Pipeline specification parser
class PipelineParser {
  /**
   * Parse processing pipeline specifications
   */
  static parsePipeline(element) {
    const pipeline = {
      source: element.getAttribute('source'),
      stages: []
    };

    // Parse pipeline stages
    for (const child of element.children) {
      const stage = this.parseStage(child);
      if (stage) pipeline.stages.push(stage);
    }

    return pipeline;
  }

  static parseStage(element) {
    const stage = {
      type: element.tagName,
      attributes: {}
    };

    for (const attr of element.attributes) {
      stage.attributes[attr.name] = attr.value;
    }

    return stage;
  }
}

// CE123 Zeta Card Grammar Parser
class ZetaCardParser {
  /**
   * Parse CE123 Zeta Card Grammar specifications
   * Extends SVG declarative grammar with self-referential operators
   */
  constructor() {
    this.cards = new Map();
    this.operators = new Map();
    this.stabilizers = new Map(); // 𝕊 operators (comments)
    this.ce1 = { memory: [], region: {}, morphisms: {}, witness: {} };
    this.ce2 = { tau: 0, partial: null, phi: null, rules: {} };
    this.ce3 = { evolution: null, epsilon: 0, expansions: [] };
    this.story = [];
  }

  /**
   * Parse Zeta Card specification text
   */
  parse(cardText) {
    const lines = cardText.split('\n');
    let currentSection = null;
    let currentBlock = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const rawLine = lines[i]; // Preserve original indentation

      if (line.startsWith('@')) {
        currentSection = this.parseSectionHeader(line);
        currentBlock = null;
        continue;
      }

      if (currentSection && line.length > 0) {
        currentBlock = this.parseSectionLine(currentSection, line, rawLine, currentBlock);
      }
    }

    return this.buildCardStructure();
  }

  /**
   * Parse section headers (@HEADER, @CE1, etc.)
   */
  parseSectionHeader(line) {
    const section = line.substring(1).split(' ')[0];

    switch (section) {
      case 'HEADER':
        return 'header';
      case 'CE1':
        return 'ce1';
      case 'CE2':
        return 'ce2';
      case 'CE3':
        return 'ce3';
      case '𝕊':
        return 'operator';
      case 'STORY':
        return 'story';
      default:
        return section.toLowerCase();
    }
  }

  /**
   * Parse lines within sections
   */
  parseSectionLine(section, line, rawLine, currentBlock) {
    const indentLevel = rawLine.length - rawLine.trimStart().length;

    switch (section) {
      case 'header':
        this.parseHeaderLine(line);
        break;
      case 'ce1':
        currentBlock = this.parseCE1Line(line, indentLevel, currentBlock);
        break;
      case 'ce2':
        currentBlock = this.parseCE2Line(line, currentBlock);
        break;
      case 'ce3':
        currentBlock = this.parseCE3Line(line, indentLevel, currentBlock);
        break;
      case 'operator':
        currentBlock = this.parseOperatorLine(line, indentLevel, currentBlock);
        break;
      case 'story':
        this.parseStoryLine(line);
        break;
    }

    return currentBlock;
  }

  /**
   * Parse header metadata
   */
  parseHeaderLine(line) {
    const [key, ...valueParts] = line.split(':');
    const value = valueParts.join(':').trim();

    if (key && value) {
      this.header = this.header || {};
      this.header[key.trim()] = value.replace(/^#/, '').trim(); // Remove leading #
    }
  }

  /**
   * Parse CE1 foundational structure
   */
  parseCE1Line(line, indent, currentBlock) {
    if (line.includes(':')) {
      const [key, value] = line.split(':').map(s => s.trim());

      if (indent === 2) {
        // Top level CE1 sections
        currentBlock = key;
        if (key === 'memory' || key === 'region' || key === 'morphisms' || key === 'witness') {
          this.ce1[key] = {};
        }
      } else if (indent >= 4 && currentBlock) {
        // Sub-properties
        if (!this.ce1[currentBlock]) this.ce1[currentBlock] = {};
        this.ce1[currentBlock][key] = value;
      }
    } else if (line.startsWith('-')) {
      // List items
      if (currentBlock && Array.isArray(this.ce1[currentBlock])) {
        this.ce1[currentBlock].push(line.substring(1).trim());
      }
    }
    return currentBlock;
  }

  /**
   * Parse CE2 dynamic structure
   */
  parseCE2Line(line, currentBlock) {
    if (line.includes(':')) {
      const [key, value] = line.split(':').map(s => s.trim());

      if (key === 'τ') {
        this.ce2.tau = parseFloat(value) || value;
      } else if (key === '∂') {
        this.ce2.partial = value;
      } else if (key === 'ϕ') {
        this.ce2.phi = value;
      } else if (key === 'ℛ') {
        // Evolution rules section
        currentBlock = 'evolution';
      } else if (currentBlock === 'evolution') {
        if (!this.ce2.rules) this.ce2.rules = {};
        this.ce2.rules[key] = value;
      }
    }
    return currentBlock;
  }

  /**
   * Parse CE3 evolution structure
   */
  parseCE3Line(line, indent, currentBlock) {
    if (line.includes(':')) {
      const [key, value] = line.split(':').map(s => s.trim());

      if (key === '𝔈') {
        this.ce3.evolution = value;
      } else if (key === 'ε') {
        this.ce3.epsilon = parseFloat(value) || value;
      } else if (key === 'expansions') {
        currentBlock = 'expansions';
        this.ce3.expansions = [];
      } else if (currentBlock === 'expansions') {
        if (key === '- at') {
          const expansion = { at: value };
          this.ce3.expansions.push(expansion);
          currentBlock = 'expansion_' + this.ce3.expansions.length;
        } else if (currentBlock.startsWith('expansion_')) {
          const currentExpansion = this.ce3.expansions[this.ce3.expansions.length - 1];
          if (!currentExpansion[key]) currentExpansion[key] = [];
          currentExpansion[key].push(value);
        }
      }
    }
    return currentBlock;
  }

  /**
   * Parse 𝕊 operator definitions (the key innovation)
   */
  parseOperatorLine(line, indent, currentBlock) {
    if (line.includes(':')) {
      const [key, value] = line.split(':').map(s => s.trim());

      if (indent === 0) {
        // New operator definition
        currentBlock = key;
        this.operators.set(key, {
          definition: value,
          properties: {},
          examples: [],
          behavior: {}
        });
      } else if (currentBlock && indent >= 2) {
        const operator = this.operators.get(currentBlock);
        if (operator) {
          if (key === 'examples' || key === 'behavior') {
            currentBlock = key;
          } else if (currentBlock === 'examples') {
            operator.examples.push({ [key]: value });
          } else if (currentBlock === 'behavior') {
            operator.behavior[key] = value;
          } else {
            operator.properties[key] = value;
          }
        }
      }
    }

    // Parse 𝕊 stabilizers (comments after #)
    const commentMatch = line.match(/^([^#]+)#\s*(.+)$/);
    if (commentMatch) {
      const [_, operator, comment] = commentMatch;
      this.stabilizers.set(operator.trim(), {
        comment: comment.trim(),
        operator: operator.trim(),
        type: 'semantic_stabilizer'
      });
    }
    return currentBlock;
  }

  /**
   * Parse evolutionary story
   */
  parseStoryLine(line) {
    if (line.includes(':')) {
      const [version, description] = line.split(':').map(s => s.trim());
      this.story.push({
        version: version,
        description: description
      });
    }
  }

  /**
   * Build complete Zeta Card structure
   */
  buildCardStructure() {
    return {
      header: this.header || {},
      ce1: this.ce1,
      ce2: this.ce2,
      ce3: this.ce3,
      operators: this.operators,
      stabilizers: this.stabilizers,
      story: this.story,

      // Computed properties
      invariants: this.extractInvariants(),
      operators: this.operators,
      stabilizers: this.stabilizers
    };
  }

  /**
   * Extract invariants from the card structure
   */
  extractInvariants() {
    const invariants = [];

    // CE1 invariants
    if (this.ce1.witness && this.ce1.witness.invariants) {
      invariants.push(...this.ce1.witness.invariants);
    }

    // 𝕊 operator invariants
    for (const [opName, opData] of this.operators) {
      if (opData.properties.meaning) {
        invariants.push(...opData.properties.meaning);
      }
    }

    return invariants;
  }

  /**
   * Apply Zeta Card to agent behavior specification
   */
  applyToAgent(agentSpec, card) {
    const enhancedSpec = { ...agentSpec };

    // Apply CE1 memory structure
    if (card.ce1.memory) {
      enhancedSpec.memory = card.ce1.memory;
    }

    // Apply CE2 dynamics
    enhancedSpec.dynamics = {
      tau: card.ce2.tau,
      partial: card.ce2.partial,
      phi: card.ce2.phi,
      rules: card.ce2.rules
    };

    // Apply CE3 evolution
    enhancedSpec.evolution = {
      evolution: card.ce3.evolution,
      epsilon: card.ce3.epsilon,
      expansions: card.ce3.expansions
    };

    // Apply 𝕊 stabilizers
    enhancedSpec.stabilizers = {};
    for (const [key, stabilizer] of card.stabilizers) {
      enhancedSpec.stabilizers[key] = stabilizer.comment;
    }

    return enhancedSpec;
  }
}

// Enhanced SVG Parser with Zeta Card support
class EnhancedSVGDeclarativeParser extends SVGDeclarativeParser {
  constructor() {
    super();
    this.zetaParser = new ZetaCardParser();
    this.zetaCards = new Map();
  }

  /**
   * Parse mixed SVG + Zeta Card content
   */
  parse(content) {
    // Check if content contains Zeta Card syntax
    if (content.includes('@HEADER') || content.includes('@CE1')) {
      // Split content into SVG and Zeta Card parts
      const parts = content.split(/(?=^@\w+)/m);
      let svgContent = '';
      let zetaContent = '';

      for (const part of parts) {
        if (part.startsWith('@')) {
          zetaContent += part;
        } else {
          svgContent += part;
        }
      }

      // Parse both parts
      const svgResult = super.parse(svgContent);
      const zetaResult = this.zetaParser.parse(zetaContent);

      return {
        ...svgResult,
        zetaCards: zetaResult,
        integratedSpecs: this.integrateZetaWithSVG(svgResult, zetaResult)
      };
    } else {
      // Pure SVG content
      return super.parse(content);
    }
  }

  /**
   * Integrate Zeta Card semantics with SVG declarations
   */
  integrateZetaWithSVG(svgResult, zetaResult) {
    const integrated = { ...svgResult };

    // Apply Zeta Card stabilizers to SVG declarations
    for (const [declId, declaration] of integrated.declarations) {
      if (zetaResult.stabilizers.has(declId)) {
        declaration.stabilizer = zetaResult.stabilizers.get(declId);
        declaration.zetaEnhanced = true;
      }
    }

    // Add Zeta Card operators as available functions
    integrated.zetaOperators = zetaResult.operators;

    return integrated;
  }
}

// Agent Behavior Specification with Zeta Card integration
class ZetaCardAgentBehavior {
  constructor() {
    this.behaviors = new Map();
    this.stabilizers = new Map();
  }

  /**
   * Define agent behavior using Zeta Card specification
   */
  defineBehavior(agentId, zetaCard) {
    const behavior = {
      agentId: agentId,
      card: zetaCard,
      stabilizers: new Map(),
      dynamics: {},
      evolution: {},
      memory: []
    };

    // Extract stabilizers
    for (const [key, stabilizer] of zetaCard.stabilizers) {
      behavior.stabilizers.set(key, stabilizer);
    }

    // Extract dynamics from CE2
    behavior.dynamics = {
      time: zetaCard.ce2.tau,
      boundary: zetaCard.ce2.partial,
      phase: zetaCard.ce2.phi,
      evolutionRules: zetaCard.ce2.rules
    };

    // Extract evolution from CE3
    behavior.evolution = {
      updateFunction: zetaCard.ce3.evolution,
      driftThreshold: zetaCard.ce3.epsilon,
      expansions: zetaCard.ce3.expansions
    };

    this.behaviors.set(agentId, behavior);
    return behavior;
  }

  /**
   * Apply behavior to agent at runtime
   */
  applyBehavior(agent, context = {}) {
    const behavior = this.behaviors.get(agent.id);
    if (!behavior) return agent;

    const enhanced = { ...agent };

    // Apply stabilizers to agent properties
    for (const [property, stabilizer] of behavior.stabilizers) {
      if (stabilizer.comment && stabilizer.comment.includes('consciousness')) {
        enhanced.guardianState *= 1.1; // Boost consciousness
      }
      if (stabilizer.comment && stabilizer.comment.includes('coherent')) {
        enhanced.phaseCoherence = Math.min(1.0, enhanced.phaseCoherence + 0.1);
      }
    }

    // Apply CE2 dynamics
    if (behavior.dynamics.time !== undefined) {
      enhanced.antclock.value += behavior.dynamics.time * 0.01;
    }

    // Apply CE3 evolution
    if (behavior.evolution.driftThreshold > 0) {
      const drift = Math.abs(enhanced.boundaryStability - 1.0);
      if (drift > behavior.evolution.driftThreshold) {
        // Trigger evolution
        enhanced.evolutionPending = true;
      }
    }

    return enhanced;
  }

  /**
   * Get semantic guidance from stabilizers
   */
  getGuidance(agentId, property) {
    const behavior = this.behaviors.get(agentId);
    if (!behavior) return null;

    const stabilizer = behavior.stabilizers.get(property);
    return stabilizer ? stabilizer.comment : null;
  }
}

// Export enhanced parser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    SVGDeclarativeParser,
    CameraFrustumParser,
    PipelineParser,
    ZetaCardParser,
    EnhancedSVGDeclarativeParser,
    ZetaCardAgentBehavior
  };
}
