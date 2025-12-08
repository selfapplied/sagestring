/**
 * Sketch DSL: A Gentle Language for Diagrams
 * 
 * Quiet verbs, lowercase keywords, gentle shapes, readable flow.
 * Feels like a sketchbook, not a contract.
 * 
 * Author: Joel
 */

/**
 * Parse sketch DSL
 * 
 * Reads gentle, lowercase syntax and builds a diagram structure
 */
class SketchParser {
    constructor() {
        this.diagram = null;
        this.currentPanel = null;
        this.currentElement = null;
        this.stack = [];
    }

    /**
     * Parse DSL text
     */
    parse(text) {
        const lines = text.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('//'));
        
        this.diagram = {
            title: null,
            size: { width: 1600, height: 900 },
            panels: [],
            law: null
        };
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            this.parseLine(line, lines, i);
        }
        
        return this.diagram;
    }

    /**
     * Parse a single line
     */
    parseLine(line, allLines, index) {
        const words = line.split(/\s+/);
        const verb = words[0];
        
        if (!verb) return;
        
        // Diagram declaration
        if (verb === 'diagram') {
            this.diagram.title = this.extractQuoted(words.slice(1).join(' '));
        }
        
        // Size
        else if (verb === 'size') {
            const size = words[1];
            if (size.includes('x')) {
                const [w, h] = size.split('x').map(Number);
                this.diagram.size = { width: w, height: h };
            }
        }
        
        // Panel
        else if (verb === 'panel') {
            const position = words[1];
            const title = this.extractQuoted(words.slice(2).join(' '));
            this.currentPanel = {
                position,
                title,
                note: null,
                caption: null,
                elements: []
            };
            this.diagram.panels.push(this.currentPanel);
            this.stack.push('panel');
        }
        
        // End panel
        else if (verb === 'end' && this.stack[this.stack.length - 1] === 'panel') {
            this.stack.pop();
            this.currentPanel = null;
        }
        
        // Note
        else if (verb === 'note') {
            const text = this.extractQuoted(line.substring(verb.length).trim());
            if (this.currentPanel) {
                this.currentPanel.note = text;
            } else if (this.diagram.law) {
                if (!this.diagram.law.notes) this.diagram.law.notes = [];
                this.diagram.law.notes.push(text);
            }
        }
        
        // Caption
        else if (verb === 'caption') {
            const text = this.extractQuoted(line.substring(verb.length).trim());
            if (this.currentPanel) {
                this.currentPanel.caption = text;
            } else if (this.diagram.law) {
                this.diagram.law.caption = text;
            }
        }
        
        // Element
        else if (verb === 'element') {
            const name = words[1];
            const type = words[3] || words[2]; // "element name type type" or "element name type"
            this.currentElement = {
                name,
                type,
                properties: {}
            };
            if (this.currentPanel) {
                this.currentPanel.elements.push(this.currentElement);
            }
            this.stack.push('element');
        }
        
        // End element
        else if (verb === 'end' && this.stack[this.stack.length - 1] === 'element') {
            this.stack.pop();
            this.currentElement = null;
        }
        
        // Element properties
        else if (this.currentElement && words.length >= 2) {
            const key = words[0];
            const value = this.parseValue(words.slice(1).join(' '));
            this.currentElement.properties[key] = value;
        }
        
        // Law
        else if (verb === 'law') {
            const name = words[1];
            this.diagram.law = {
                name,
                equation: null,
                notes: [],
                caption: null
            };
        }
        
        // Equation
        else if (verb === 'equation') {
            const eq = this.extractQuoted(line.substring(verb.length).trim());
            if (this.diagram.law) {
                this.diagram.law.equation = eq;
            }
        }
    }

    /**
     * Extract quoted string
     */
    extractQuoted(text) {
        const match = text.match(/"([^"]+)"/);
        return match ? match[1] : text;
    }

    /**
     * Parse value (number, string, array, etc.)
     */
    parseValue(text) {
        // Quoted string
        if (text.startsWith('"') && text.endsWith('"')) {
            return text.slice(1, -1);
        }
        
        // Number
        if (!isNaN(text)) {
            return Number(text);
        }
        
        // Boolean
        if (text === 'true') return true;
        if (text === 'false') return false;
        
        // Array (comma-separated)
        if (text.includes(',')) {
            return text.split(',').map(s => this.parseValue(s.trim()));
        }
        
        // Range (1..8)
        if (text.includes('..')) {
            const [start, end] = text.split('..').map(Number);
            return { range: true, start, end };
        }
        
        // Default: string
        return text;
    }
}

/**
 * Sketch Renderer
 * 
 * Renders diagram structure to SVG/Canvas
 */
class SketchRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.diagram = null;
    }

    /**
     * Render diagram
     */
    render(diagram) {
        this.diagram = diagram;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Set canvas size
        this.canvas.width = diagram.size.width;
        this.canvas.height = diagram.size.height;
        
        // Render panels
        diagram.panels.forEach(panel => this.renderPanel(panel));
        
        // Render law
        if (diagram.law) {
            this.renderLaw(diagram.law);
        }
    }

    /**
     * Render panel
     */
    renderPanel(panel) {
        const bounds = this.getPanelBounds(panel.position);
        
        // Panel background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        this.ctx.strokeStyle = '#00ff88';
        this.ctx.lineWidth = 2;
        this.ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
        this.ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
        
        // Title
        this.ctx.fillStyle = '#00aaff';
        this.ctx.font = 'bold 20px monospace';
        this.ctx.fillText(panel.title, bounds.x + 20, bounds.y + 30);
        
        // Note
        if (panel.note) {
            this.ctx.fillStyle = '#888';
            this.ctx.font = '12px monospace';
            const noteLines = this.wrapText(panel.note, bounds.width - 40);
            noteLines.forEach((line, i) => {
                this.ctx.fillText(line, bounds.x + 20, bounds.y + 60 + i * 20);
            });
        }
        
        // Elements
        panel.elements.forEach((element, i) => {
            this.renderElement(element, bounds, i);
        });
        
        // Caption
        if (panel.caption) {
            this.ctx.fillStyle = '#666';
            this.ctx.font = 'italic 11px monospace';
            this.ctx.fillText(panel.caption, bounds.x + 20, bounds.y + bounds.height - 20);
        }
    }

    /**
     * Get panel bounds based on position
     */
    getPanelBounds(position) {
        const { width, height } = this.diagram.size;
        const padding = 20;
        
        if (position === 'left') {
            return { x: padding, y: 100, width: width / 2 - padding * 1.5, height: height - 120 };
        } else if (position === 'right') {
            return { x: width / 2 + padding / 2, y: 100, width: width / 2 - padding * 1.5, height: height - 120 };
        } else if (position === 'center') {
            return { x: padding, y: height / 2, width: width - padding * 2, height: height / 2 - 20 };
        } else if (position === 'top') {
            return { x: padding, y: padding, width: width - padding * 2, height: 80 };
        } else {
            return { x: padding, y: padding, width: width - padding * 2, height: height - padding * 2 };
        }
    }

    /**
     * Render element
     */
    renderElement(element, panelBounds, index) {
        const y = panelBounds.y + 100 + index * 200;
        const x = panelBounds.x + 20;
        const w = panelBounds.width - 40;
        const h = 180;
        
        switch (element.type) {
            case 'wavefield':
                this.renderWavefield(element, x, y, w, h);
                break;
            case 'potential_well':
                this.renderPotentialWell(element, x, y, w, h);
                break;
            case 'bar_spectrum':
                this.renderBarSpectrum(element, x, y, w, h);
                break;
            case 'decay_curve':
                this.renderDecayCurve(element, x, y, w, h);
                break;
            case 'ribbon_flow':
                this.renderRibbonFlow(element, x, y, w, h);
                break;
            case 'text_block':
                this.renderTextBlock(element, x, y, w, h);
                break;
        }
    }

    /**
     * Render wavefield (scribbled waves)
     */
    renderWavefield(element, x, y, w, h) {
        const colors = element.properties.color || ['#00aaff', '#ff6b6b'];
        const complexity = element.properties.complexity === 'high' ? 50 : 20;
        
        this.ctx.strokeStyle = colors[0];
        this.ctx.lineWidth = 1;
        
        for (let i = 0; i < complexity; i++) {
            this.ctx.beginPath();
            const startX = x + Math.random() * w;
            const startY = y + Math.random() * h;
            this.ctx.moveTo(startX, startY);
            
            for (let j = 0; j < 10; j++) {
                this.ctx.lineTo(
                    startX + (Math.random() - 0.5) * 50,
                    startY + (Math.random() - 0.5) * 50
                );
            }
            this.ctx.stroke();
        }
    }

    /**
     * Render potential well
     */
    renderPotentialWell(element, x, y, w, h) {
        const centerX = x + w / 2;
        const centerY = y + h / 2;
        
        // Draw well
        this.ctx.strokeStyle = '#ff6b6b';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        for (let i = 0; i < w; i++) {
            const px = x + i;
            const dx = (i - w / 2) / 50;
            const py = centerY + 30 * (dx * dx - 1);
            if (i === 0) this.ctx.moveTo(px, py);
            else this.ctx.lineTo(px, py);
        }
        this.ctx.stroke();
        
        // Draw species at depths
        const labels = element.properties.labels || ['common', 'rare', 'cryptic'];
        labels.forEach((label, i) => {
            const px = centerX + (i - 1) * 80;
            const py = centerY + (i * 0.3 + 0.2) * 30;
            this.ctx.fillStyle = '#00ff88';
            this.ctx.beginPath();
            this.ctx.arc(px, py, 8, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.fillText(label, px - 20, py - 15);
        });
    }

    /**
     * Render bar spectrum
     */
    renderBarSpectrum(element, x, y, w, h) {
        const numBins = 20;
        const binWidth = w / numBins;
        const colors = element.properties.colors || ['#00aaff', '#ff00ff', '#ff6b6b'];
        
        for (let i = 0; i < numBins; i++) {
            const amplitude = Math.random() > 0.7 ? Math.random() * 0.9 + 0.1 : Math.random() * 0.1;
            const height = amplitude * h;
            const color = colors[i % colors.length];
            
            this.ctx.fillStyle = color;
            this.ctx.fillRect(x + i * binWidth, y + h - height, binWidth - 2, height);
        }
    }

    /**
     * Render decay curve
     */
    renderDecayCurve(element, x, y, w, h) {
        const orders = element.properties.orders;
        const maxOrder = orders?.end || 10;
        
        this.ctx.strokeStyle = '#00aaff';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        
        for (let z = 1; z <= maxOrder; z++) {
            const decay = Math.exp(-0.3 * z);
            const px = x + (z / maxOrder) * w;
            const py = y + h - 20 - decay * (h - 40);
            
            if (z === 1) this.ctx.moveTo(px, py);
            else this.ctx.lineTo(px, py);
        }
        this.ctx.stroke();
    }

    /**
     * Render ribbon flow
     */
    renderRibbonFlow(element, x, y, w, h) {
        const gradient = this.ctx.createLinearGradient(x, y, x + w, y);
        gradient.addColorStop(0, '#00aaff');
        gradient.addColorStop(1, '#ff6b6b');
        
        this.ctx.strokeStyle = gradient;
        this.ctx.lineWidth = 3;
        
        for (let i = 0; i < 5; i++) {
            const py = y + (h / 6) * (i + 1);
            this.ctx.beginPath();
            this.ctx.moveTo(x, py);
            this.ctx.lineTo(x + w, py);
            this.ctx.lineTo(x + w - 10, py - 5);
            this.ctx.moveTo(x + w, py);
            this.ctx.lineTo(x + w - 10, py + 5);
            this.ctx.stroke();
        }
        
        // CE1 kernel symbol
        this.ctx.fillStyle = '#00ff88';
        this.ctx.font = '24px monospace';
        const centerX = x + w / 2;
        const centerY = y + h / 2;
        this.ctx.fillText('{ [ ( < > ) ] }', centerX - 60, centerY);
    }

    /**
     * Render text block
     */
    renderTextBlock(element, x, y, w, h) {
        const text = element.properties.text || element.properties.equation || '';
        const size = element.properties.size || 'medium';
        const fontSize = size === 'large' ? 24 : size === 'small' ? 14 : 18;
        
        this.ctx.fillStyle = '#00ff88';
        this.ctx.font = `${fontSize}px monospace`;
        this.ctx.fillText(text, x, y + h / 2);
    }

    /**
     * Render law
     */
    renderLaw(law) {
        const y = this.diagram.size.height - 100;
        const x = 20;
        
        if (law.equation) {
            this.ctx.fillStyle = '#00ff88';
            this.ctx.font = '16px monospace';
            this.ctx.fillText(law.equation, x, y);
        }
        
        if (law.caption) {
            this.ctx.fillStyle = '#666';
            this.ctx.font = 'italic 12px monospace';
            this.ctx.fillText(law.caption, x, y + 30);
        }
    }

    /**
     * Wrap text to fit width
     */
    wrapText(text, maxWidth) {
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';
        
        for (const word of words) {
            const testLine = currentLine + (currentLine ? ' ' : '') + word;
            const metrics = this.ctx.measureText(testLine);
            if (metrics.width > maxWidth && currentLine) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        }
        if (currentLine) lines.push(currentLine);
        return lines;
    }
}

export { SketchParser, SketchRenderer };

