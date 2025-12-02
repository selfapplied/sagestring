// FEG Runtime — The Harmonic Core
// The interpreter that breathes life into SVG

class FEGRuntime {
    constructor() {
        // Symbol registry: name → Set of operators (by arity)
        this.registry = new Map();
        
        // Ambient scopes: stack of scope objects
        this.scopes = [];
        
        // Three-clock witness cycle state
        this.clocks = {
            fast: 0,   // Δ
            slow: 0,   // Ω
            wit: 0     // W
        };
        this.Q = 0;
        
        // Reserved attribute names
        this.reserved = new Set(['symbol', 'string', 'phase', 'id', 'Q', 'Q_fast', 'Q_slow', 'Q_wit']);
    }
    
    // Register a FEG operator from XML element
    register(element) {
        const symbol = element.getAttribute('symbol');
        if (!symbol) {
            // This is an ambient scope
            this.pushScope(element);
            return;
        }
        
        // Extract dependencies (non-reserved attributes)
        const deps = new Set();
        const defaults = {};
        
        for (const attr of element.attributes) {
            const name = attr.name;
            if (!this.reserved.has(name)) {
                deps.add(name);
                if (attr.value) {
                    defaults[name] = parseFloat(attr.value) || attr.value;
                }
            }
        }
        
        const arity = deps.size;
        const expr = element.getAttribute('string') || '';
        
        // Store operator
        if (!this.registry.has(symbol)) {
            this.registry.set(symbol, new Map());
        }
        
        const family = this.registry.get(symbol);
        if (!family.has(arity)) {
            family.set(arity, []);
        }
        
        family.get(arity).push({
            element,
            deps,
            defaults,
            expr,
            arity
        });
    }
    
    // Push ambient scope
    pushScope(element) {
        const scope = {};
        for (const attr of element.attributes) {
            const name = attr.name;
            if (!this.reserved.has(name)) {
                scope[name] = parseFloat(attr.value) || attr.value;
            }
        }
        this.scopes.push(scope);
    }
    
    // Pop ambient scope
    popScope() {
        return this.scopes.pop();
    }
    
    // Resolve dependency value (local > caller > scope > global)
    resolveDependency(name, bindings = {}) {
        // 1. Local binding (caller-provided)
        if (name in bindings) {
            return bindings[name];
        }
        
        // 2. Nearest scope
        for (let i = this.scopes.length - 1; i >= 0; i--) {
            if (name in this.scopes[i]) {
                return this.scopes[i][name];
            }
        }
        
        // 3. Unbound (return 0 as safe default)
        return 0;
    }
    
    // Find operator by symbol and arity (with dispatch)
    findOperator(symbol, arity, bindings = {}) {
        const family = this.registry.get(symbol);
        if (!family) return null;
        
        // 1. Exact arity match
        if (family.has(arity)) {
            const ops = family.get(arity);
            return ops[0]; // Return first match
        }
        
        // 2. Find nearest arity
        const arities = Array.from(family.keys()).sort((a, b) => a - b);
        
        // Lower arity (promote)
        const lower = arities.filter(a => a < arity);
        // Higher arity (reduce)
        const higher = arities.filter(a => a > arity);
        
        if (lower.length > 0 && higher.length > 0) {
            // Blend nearest two
            const lowOp = family.get(lower[lower.length - 1])[0];
            const highOp = family.get(higher[0])[0];
            return this.blend(lowOp, highOp, arity, bindings);
        } else if (lower.length > 0) {
            // Promote
            const op = family.get(lower[lower.length - 1])[0];
            return this.promote(op, arity, bindings);
        } else if (higher.length > 0) {
            // Reduce
            const op = family.get(higher[0])[0];
            return this.reduce(op, arity, bindings);
        }
        
        return null;
    }
    
    // Promote lower-arity operator to higher arity
    promote(op, targetArity, bindings) {
        // Simple promotion: duplicate first dependency
        const newDeps = new Set(op.deps);
        const newDefaults = { ...op.defaults };
        
        while (newDeps.size < targetArity) {
            const firstDep = Array.from(newDeps)[0];
            const newName = `${firstDep}_${newDeps.size}`;
            newDeps.add(newName);
            newDefaults[newName] = newDefaults[firstDep] || 0;
        }
        
        return {
            ...op,
            deps: newDeps,
            defaults: newDefaults,
            arity: targetArity
        };
    }
    
    // Reduce higher-arity operator to lower arity
    reduce(op, targetArity, bindings) {
        const deps = Array.from(op.deps);
        const newDeps = new Set(deps.slice(0, targetArity));
        const newDefaults = {};
        
        for (const dep of newDeps) {
            newDefaults[dep] = op.defaults[dep] || this.resolveDependency(dep, bindings);
        }
        
        return {
            ...op,
            deps: newDeps,
            defaults: newDefaults,
            arity: targetArity
        };
    }
    
    // Blend two operators
    blend(op1, op2, targetArity, bindings) {
        // Weighted blend based on arity distance
        const dist1 = Math.abs(op1.arity - targetArity);
        const dist2 = Math.abs(op2.arity - targetArity);
        const total = dist1 + dist2;
        const w1 = total > 0 ? dist2 / total : 0.5;
        const w2 = total > 0 ? dist1 / total : 0.5;
        
        // Use closer operator, fallback to op1
        return dist1 <= dist2 ? op1 : op2;
    }
    
    // Evaluate FEG expression
    evaluate(expr, bindings = {}) {
        if (!expr || expr === '0') return 0;
        
        // Resolve all variables in expression
        let result = expr;
        
        // First, resolve from bindings
        for (const [key, value] of Object.entries(bindings)) {
            result = result.replace(new RegExp(`\\b${key}\\b`, 'g'), value);
        }
        
        // Then resolve from scopes for any remaining variables
        const varPattern = /\b([a-zA-Z_][a-zA-Z0-9_]*)\b/g;
        let match;
        while ((match = varPattern.exec(result)) !== null) {
            const varName = match[1];
            if (!isNaN(parseFloat(varName)) || ['sin', 'cos', 'tan', 'sqrt', 'abs', 'max', 'min', 'Math'].includes(varName)) {
                continue; // Skip numbers and built-ins
            }
            const value = this.resolveDependency(varName, bindings);
            result = result.replace(new RegExp(`\\b${varName}\\b`, 'g'), value);
        }
        
        // Evaluate math expression
        try {
            // Replace sin/cos/tan with Math.*
            result = result.replace(/\bsin\b/g, 'Math.sin');
            result = result.replace(/\bcos\b/g, 'Math.cos');
            result = result.replace(/\btan\b/g, 'Math.tan');
            result = result.replace(/\bsqrt\b/g, 'Math.sqrt');
            result = result.replace(/\babs\b/g, 'Math.abs');
            result = result.replace(/\bmax\b/g, 'Math.max');
            result = result.replace(/\bmin\b/g, 'Math.min');
            
            return Function('"use strict"; return (' + result + ')')();
        } catch (e) {
            console.warn('FEG evaluation error:', e, 'expr:', expr);
            return 0;
        }
    }
    
    // Call operator by symbol
    call(symbol, bindings = {}) {
        // Determine required arity from bindings
        const arity = Object.keys(bindings).length;
        
        // Find operator
        const op = this.findOperator(symbol, arity, bindings);
        if (!op) {
            console.warn(`FEG: operator '${symbol}' not found with arity ${arity}`);
            return 0;
        }
        
        // Merge defaults with bindings
        const merged = { ...op.defaults };
        for (const [key, value] of Object.entries(bindings)) {
            merged[key] = value;
        }
        
        // Resolve all dependencies
        const resolved = {};
        for (const dep of op.deps) {
            resolved[dep] = this.resolveDependency(dep, merged);
        }
        
        // Evaluate expression
        return this.evaluate(op.expr, resolved);
    }
    
    // Update three-clock witness cycle
    updateClocks(fast, slow, wit) {
        this.clocks.fast = fast;
        this.clocks.slow = slow;
        this.clocks.wit = wit;
        this.Q = Math.sqrt(fast * slow) * wit;
    }
    
    // Get current Q values
    getQ() {
        return {
            Q: this.Q,
            Q_fast: this.clocks.fast,
            Q_slow: this.clocks.slow,
            Q_wit: this.clocks.wit
        };
    }
    
    // Initialize from SVG document
    initialize(svgElement) {
        // Find all <feg> elements
        const fegElements = svgElement.querySelectorAll('feg');
        
        // Process in document order (scopes first)
        for (const el of fegElements) {
            this.register(el);
        }
    }
    
    // Clear registry
    clear() {
        this.registry.clear();
        this.scopes = [];
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FEGRuntime;
}


