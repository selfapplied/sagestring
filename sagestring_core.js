/**
 * SageString Core - Self-Referential Visual Systems
 *
 * Consolidated JavaScript library containing:
 * - Self-referential Sobel system with ballast
 * - SVG kernel pattern recognition
 * - Cellular automata with phase dynamics
 * - Computer vision components
 * - Spatiotemporal memory
 */

// =============================================================================
// SELF-REFERENTIAL SOBEL SYSTEM WITH BALLAST
// =============================================================================

class SelfReferentialSobelSystem {
    constructor(canvas, svg, options = {}) {
        this.canvas = canvas;
        this.svg = svg;
        this.ctx = canvas.getContext('2d');

        // Configuration
        this.gridSize = options.gridSize || 64;
        this.cellSize = canvas.width / this.gridSize;
        this.running = false;
        this.frameCount = 0;

        // Sobel parameters
        this.sobelSensitivity = options.sobelSensitivity || 50;

        // System parameters
        this.stabilityThreshold = options.stabilityThreshold || 0.3;

        // Objects
        this.objects = new Map();
        this.objectIdCounter = 0;

        // Ballast system
        this.ballastSystem = {
            totalStabilityMass: 0,
            stabilityBudget: this.gridSize * this.gridSize * 0.1,
            ballastFields: new Map(),
            conservationFactor: options.conservationFactor || 0.95,
            redistributionRate: 0.1,
            ballastTiers: {
                tier1: { threshold: 0.3, massMultiplier: 1.0, decayRate: 0.02 },
                tier2: { threshold: 0.6, massMultiplier: 2.0, decayRate: 0.01 },
                tier3: { threshold: 0.8, massMultiplier: 3.0, decayRate: 0.005 }
            },
            globalAttraction: options.ballastAttraction || 0.05,
            memoryBallast: [],
            ballastResonance: 0.0
        };

        // Initialize
        this.grid = this.createGrid();
        this.initializeGrid();
    }

    createGrid() {
        const grid = [];
        for (let y = 0; y < this.gridSize; y++) {
            const row = [];
            for (let x = 0; x < this.gridSize; x++) {
                row.push({
                    x, y,
                    value: 0,
                    phase: 'fixed',
                    stability: 0,
                    age: 0,
                    sobelGradient: { magnitude: 0, direction: 0 },
                    objectId: null
                });
            }
            grid.push(row);
        }
        return grid;
    }

    initializeGrid() {
        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                const cell = this.grid[y][x];
                cell.value = Math.random() * 0.1;
                cell.phase = ['fixed', 'osc28', 'osc37'][Math.floor(Math.random() * 3)];
                cell.stability = Math.random() * 0.2;
            }
        }
        this.seedInitialObjects();
    }

    seedInitialObjects() {
        const centers = [
            {x: 20, y: 20, radius: 8},
            {x: 44, y: 20, radius: 6},
            {x: 32, y: 44, radius: 10}
        ];

        for (const center of centers) {
            this.createObject(center.x, center.y, center.radius);
        }
    }

    createObject(centerX, centerY, radius) {
        const objectId = ++this.objectIdCounter;
        const object = {
            id: objectId,
            centerX, centerY,
            radius,
            stability: 0.8,
            age: 0,
            phase: ['fixed', 'osc28', 'osc37'][Math.floor(Math.random() * 3)],
            cells: [],
            wireframeSignature: this.generateWireframe(radius),
            stabilityMass: 0,
            ballastTier: 1,
            ballastField: null,
            conservedEnergy: 0,
            memoryFootprint: null
        };

        // Assign cells to object
        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                const x = centerX + dx;
                const y = centerY + dy;

                if (x >= 0 && x < this.gridSize && y >= 0 && y < this.gridSize) {
                    const distance = Math.sqrt(dx*dx + dy*dy);
                    if (distance <= radius) {
                        const cell = this.grid[y][x];
                        cell.objectId = objectId;
                        cell.value = 1;
                        cell.phase = object.phase;
                        cell.stability = object.stability;
                        object.cells.push(cell);
                    }
                }
            }
        }

        this.objects.set(objectId, object);
        return object;
    }

    generateWireframe(radius) {
        const points = [];
        const segments = Math.max(8, Math.floor(radius * 2));

        for (let i = 0; i < segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            const r = radius * (0.8 + Math.sin(angle * 3) * 0.2);
            const x = Math.cos(angle) * r;
            const y = Math.sin(angle) * r;
            points.push({x, y});
        }

        let path = `M${points[0].x} ${points[0].y}`;
        for (let i = 1; i < points.length; i++) {
            path += ` L${points[i].x} ${points[i].y}`;
        }
        path += ' Z';

        return path;
    }

    update() {
        if (!this.running) return;

        this.frameCount++;
        this.computeSobelGradients();

        for (const [id, object] of this.objects) {
            this.updateObject(object);
        }

        this.applyPhaseDynamics();
        this.updateBallastSystem();
        this.updateObjectStability();
        this.attemptObjectRebirth();

        this.render();
    }

    computeSobelGradients() {
        for (let y = 1; y < this.gridSize - 1; y++) {
            for (let x = 1; x < this.gridSize - 1; x++) {
                const cell = this.grid[y][x];

                const gx = -this.grid[y-1][x-1].value + this.grid[y-1][x+1].value +
                          -2 * this.grid[y][x-1].value + 2 * this.grid[y][x+1].value +
                          -this.grid[y+1][x-1].value + this.grid[y+1][x+1].value;

                const gy = -this.grid[y-1][x-1].value - 2 * this.grid[y-1][x].value - this.grid[y-1][x+1].value +
                           this.grid[y+1][x-1].value + 2 * this.grid[y+1][x].value + this.grid[y+1][x+1].value;

                const magnitude = Math.sqrt(gx*gx + gy*gy);
                const direction = Math.atan2(gy, gx);

                cell.sobelGradient = {
                    magnitude: Math.min(1, magnitude / this.sobelSensitivity),
                    direction: direction
                };
            }
        }
    }

    updateObject(object) {
        object.age++;

        let boundaryStrength = 0;
        let cellCount = 0;

        for (const cell of object.cells) {
            if (cell.objectId === object.id) {
                boundaryStrength += cell.sobelGradient.magnitude;
                cellCount++;
            }
        }

        if (cellCount > 0) {
            const newStability = boundaryStrength / cellCount;
            object.stability = object.stability * 0.9 + newStability * 0.1;
        }

        this.applyBallastInfluence(object);
        this.updateObjectPhase(object);
        this.updateObjectBallast(object);

        for (const cell of object.cells) {
            if (cell.objectId === object.id) {
                const ballastBoost = object.stabilityMass * 0.1;
                cell.value = Math.max(0, Math.min(1,
                    (object.stability + ballastBoost) * (0.5 + 0.5 * Math.sin(this.frameCount * 0.1 * (object.phase === 'osc28' ? 28 : object.phase === 'osc37' ? 37 : 1)))
                ));
                cell.stability = object.stability;
                cell.age = object.age;
            }
        }
    }

    applyBallastInfluence(object) {
        const resonanceBoost = this.ballastSystem.ballastResonance * 0.1;
        object.stability += resonanceBoost;

        if (object.ballastField) {
            const fieldStrength = object.ballastField.strength;
            object.stability += fieldStrength * 0.05;
        }

        const memoryInfluence = this.getMemoryBallastInfluence(object);
        object.stability += memoryInfluence * 0.03;
    }

    updateObjectPhase(object) {
        if (object.phase === 'fixed') {
            object.stability *= 0.99;
        } else {
            const period = object.phase === 'osc28' ? 28 : 37;
            const phase = (this.frameCount / period) * Math.PI * 2;

            const r = 3.5; // Feigenbaum parameter
            const x = object.stability;
            const newX = r * x * (1 - x);

            object.stability = Math.max(0, Math.min(1, newX));
            object.stability += 0.1 * Math.sin(phase);
        }
    }

    updateObjectBallast(object) {
        const massGain = object.stability * object.age * 0.001;
        object.stabilityMass += massGain;
        object.stabilityMass *= this.ballastSystem.conservationFactor;

        this.updateBallastTier(object);
        this.updateBallastField(object);
        this.ballastSystem.totalStabilityMass += massGain;

        if (object.stability > 0.7 && object.age > 50) {
            this.createMemoryFootprint(object);
        }
    }

    updateBallastTier(object) {
        const tiers = this.ballastSystem.ballastTiers;
        const combinedMetric = (object.stability + object.stabilityMass * 0.1) / 2;

        if (combinedMetric >= tiers.tier3.threshold) {
            object.ballastTier = 3;
        } else if (combinedMetric >= tiers.tier2.threshold) {
            object.ballastTier = 2;
        } else {
            object.ballastTier = 1;
        }

        const tier = tiers[`tier${object.ballastTier}`];
        object.stabilityMass *= (1 - tier.decayRate);
    }

    updateBallastField(object) {
        if (object.stability > 0.5) {
            const tier = this.ballastSystem.ballastTiers[`tier${object.ballastTier}`];
            const fieldStrength = object.stability * tier.massMultiplier * 0.1;

            object.ballastField = {
                centerX: object.centerX,
                centerY: object.centerY,
                radius: object.radius * 2,
                strength: fieldStrength,
                tier: object.ballastTier
            };

            this.ballastSystem.ballastFields.set(object.id, object.ballastField);
        } else {
            if (object.ballastField) {
                this.ballastSystem.ballastFields.delete(object.id);
                object.ballastField = null;
            }
        }
    }

    getMemoryBallastInfluence(object) {
        let influence = 0;

        for (const memory of this.ballastSystem.memoryBallast) {
            const distance = Math.sqrt(
                Math.pow(object.centerX - memory.centerX, 2) +
                Math.pow(object.centerY - memory.centerY, 2)
            );

            const spatialInfluence = Math.max(0, 1 - distance / 20);
            const temporalInfluence = Math.max(0, 1 - (this.frameCount - memory.timestamp) / 500);
            const phaseMatch = object.phase === memory.phase ? 1.5 : 1.0;

            influence += spatialInfluence * temporalInfluence * phaseMatch * 0.05;
        }

        return Math.min(0.2, influence);
    }

    applyPhaseDynamics() {
        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                const cell = this.grid[y][x];
                let couplingSum = 0;
                let couplingCount = 0;

                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        if (dx === 0 && dy === 0) continue;

                        const nx = x + dx;
                        const ny = y + dy;

                        if (nx >= 0 && nx < this.gridSize && ny >= 0 && ny < this.gridSize) {
                            const neighbor = this.grid[ny][nx];
                            if (neighbor.phase === cell.phase) {
                                couplingSum += neighbor.stability;
                                couplingCount++;
                            }
                        }
                    }
                }

                if (couplingCount > 0) {
                    const couplingStrength = couplingSum / couplingCount;
                    cell.stability = cell.stability * 0.95 + couplingStrength * 0.05;
                }
            }
        }
    }

    updateBallastSystem() {
        for (const [id, field] of this.ballastSystem.ballastFields) {
            if (field.residual) {
                field.strength *= field.decay;
                field.lifetime--;

                if (field.lifetime <= 0 || field.strength < 0.01) {
                    this.ballastSystem.ballastFields.delete(id);
                }
            }
        }

        this.enforceStabilityBudget();
        this.updateBallastResonance();
    }

    enforceStabilityBudget() {
        const currentMass = this.ballastSystem.totalStabilityMass;
        const budget = this.ballastSystem.stabilityBudget;

        if (currentMass > budget * 1.2) {
            const excessRatio = currentMass / budget;
            for (const [id, object] of this.objects) {
                object.stabilityMass *= (0.98 - (excessRatio - 1) * 0.1);
            }
        } else if (currentMass < budget * 0.5) {
            for (const [id, object] of this.objects) {
                if (object.stability > 0.6) {
                    object.stabilityMass *= 1.02;
                }
            }
        }
    }

    updateBallastResonance() {
        let totalFieldStrength = 0;
        let fieldCount = 0;

        for (const [id, field] of this.ballastSystem.ballastFields) {
            totalFieldStrength += field.strength;
            fieldCount++;
        }

        if (fieldCount > 0) {
            this.ballastSystem.ballastResonance = Math.min(1, totalFieldStrength / fieldCount);
        } else {
            this.ballastSystem.ballastResonance *= 0.99;
        }
    }

    updateObjectStability() {
        const objectsToRemove = [];

        for (const [id, object] of this.objects) {
            const effectiveThreshold = this.stabilityThreshold - (object.stabilityMass * 0.1);

            if (object.stability < effectiveThreshold) {
                objectsToRemove.push(id);
            }
        }

        for (const id of objectsToRemove) {
            const object = this.objects.get(id);
            this.redistributeBallast(object);
            this.removeObject(id);
        }
    }

    removeObject(objectId) {
        const object = this.objects.get(objectId);
        if (!object) return;

        for (const cell of object.cells) {
            if (cell.objectId === objectId) {
                cell.objectId = null;
                cell.value = 0;
                cell.stability = 0;
            }
        }

        if (object.ballastField) {
            this.ballastSystem.ballastFields.delete(objectId);
        }

        this.ballastSystem.totalStabilityMass -= object.stabilityMass;
        this.objects.delete(objectId);
    }

    redistributeBallast(deadObject) {
        if (deadObject.stabilityMass <= 0) return;

        const redistributionAmount = deadObject.stabilityMass * this.ballastSystem.redistributionRate;
        const nearbyObjects = this.findNearbyObjects(deadObject.centerX, deadObject.centerY, deadObject.radius * 3);

        if (nearbyObjects.length > 0) {
            const sharePerObject = redistributionAmount / nearbyObjects.length;
            for (const nearbyObj of nearbyObjects) {
                nearbyObj.stabilityMass += sharePerObject;
                nearbyObj.conservedEnergy += sharePerObject * 0.5;
            }
        } else {
            this.createResidualBallastField(deadObject.centerX, deadObject.centerY, redistributionAmount);
        }

        this.updateBallastResonance();
    }

    findNearbyObjects(centerX, centerY, radius) {
        const nearby = [];

        for (const [id, object] of this.objects) {
            const distance = Math.sqrt(
                Math.pow(object.centerX - centerX, 2) +
                Math.pow(object.centerY - centerY, 2)
            );

            if (distance <= radius) {
                nearby.push(object);
            }
        }

        return nearby;
    }

    createResidualBallastField(x, y, energy) {
        const fieldId = `residual_${Date.now()}`;

        this.ballastSystem.ballastFields.set(fieldId, {
            centerX: x,
            centerY: y,
            radius: 5,
            strength: energy * 0.1,
            tier: 1,
            residual: true,
            decay: 0.95,
            lifetime: 100
        });
    }

    createMemoryFootprint(object) {
        object.memoryFootprint = {
            centerX: object.centerX,
            centerY: object.centerY,
            radius: object.radius,
            phase: object.phase,
            stabilitySignature: object.stability,
            ballastTier: object.ballastTier,
            timestamp: this.frameCount
        };

        this.ballastSystem.memoryBallast.push(object.memoryFootprint);
        if (this.ballastSystem.memoryBallast.length > 20) {
            this.ballastSystem.memoryBallast.shift();
        }
    }

    attemptObjectRebirth() {
        const candidates = [];

        for (let y = 2; y < this.gridSize - 2; y++) {
            for (let x = 2; x < this.gridSize - 2; x++) {
                const cell = this.grid[y][x];

                if (cell.objectId === null && cell.sobelGradient.magnitude > 0.5) {
                    let regionGradient = 0;
                    let regionSize = 0;
                    let ballastInfluence = 0;

                    for (let dy = -2; dy <= 2; dy++) {
                        for (let dx = -2; dx <= 2; dx++) {
                            const nx = x + dx;
                            const ny = y + dy;
                            if (nx >= 0 && nx < this.gridSize && ny >= 0 && ny < this.gridSize) {
                                regionGradient += this.grid[ny][nx].sobelGradient.magnitude;
                                regionSize++;

                                for (const [fieldId, field] of this.ballastSystem.ballastFields) {
                                    const distance = Math.sqrt(
                                        Math.pow(nx - field.centerX, 2) +
                                        Math.pow(ny - field.centerY, 2)
                                    );
                                    if (distance <= field.radius) {
                                        ballastInfluence += field.strength * (1 - distance / field.radius);
                                    }
                                }
                            }
                        }
                    }

                    const avgGradient = regionGradient / regionSize;
                    const totalPotential = avgGradient + ballastInfluence * 0.5;

                    if (totalPotential > 0.3) {
                        candidates.push({
                            x, y,
                            gradient: avgGradient,
                            ballastBoost: ballastInfluence,
                            size: Math.floor(totalPotential * 10) + 3
                        });
                    }
                }
            }
        }

        candidates.sort((a, b) => (b.gradient + b.ballastBoost) - (a.gradient + a.ballastBoost));
        const maxNewObjects = Math.max(1, Math.floor(this.gridSize / 16));

        for (let i = 0; i < Math.min(candidates.length, maxNewObjects); i++) {
            const candidate = candidates[i];
            const newObject = this.createObject(candidate.x, candidate.y, candidate.size);

            if (candidate.ballastBoost > 0) {
                newObject.stabilityMass += candidate.ballastBoost * 0.1;
                newObject.conservedEnergy += candidate.ballastBoost * 0.05;
            }
        }
    }

    render() {
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.svg.innerHTML = '';

        // Render grid
        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                const cell = this.grid[y][x];
                const intensity = cell.value;

                if (intensity > 0.1) {
                    const hue = cell.phase === 'fixed' ? 120 : cell.phase === 'osc28' ? 240 : 0;
                    this.ctx.fillStyle = `hsl(${hue}, 70%, ${20 + intensity * 50}%)`;
                    this.ctx.fillRect(x * this.cellSize, y * this.cellSize, this.cellSize, this.cellSize);
                }

                if (cell.sobelGradient.magnitude > 0.3) {
                    this.ctx.strokeStyle = '#0f0';
                    this.ctx.lineWidth = 1;
                    this.ctx.strokeRect(x * this.cellSize, y * this.cellSize, this.cellSize, this.cellSize);
                }
            }
        }

        this.renderBallastFields();
        this.renderObjects();
    }

    renderBallastFields() {
        for (const [id, field] of this.ballastSystem.ballastFields) {
            const cx = field.centerX * this.cellSize;
            const cy = field.centerY * this.cellSize;
            const radius = field.radius * this.cellSize;

            const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'radialGradient');
            gradient.setAttribute('id', `ballastField${id}`);
            gradient.setAttribute('cx', '50%');
            gradient.setAttribute('cy', '50%');
            gradient.setAttribute('r', '50%');

            const stops = [
                {offset: '0%', opacity: field.strength * 0.3},
                {offset: '70%', opacity: field.strength * 0.1},
                {offset: '100%', opacity: '0'}
            ];

            for (let i = 0; i < stops.length; i++) {
                const stop = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
                stop.setAttribute('offset', stops[i].offset);
                stop.setAttribute('stop-color', field.residual ? '#333' : '#666');
                stop.setAttribute('stop-opacity', stops[i].opacity);
                gradient.appendChild(stop);
            }

            this.svg.appendChild(gradient);

            const fieldCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            fieldCircle.setAttribute('cx', cx);
            fieldCircle.setAttribute('cy', cy);
            fieldCircle.setAttribute('r', radius);
            fieldCircle.setAttribute('fill', `url(#ballastField${id})`);
            fieldCircle.setAttribute('opacity', field.residual ? '0.3' : '0.5');

            this.svg.appendChild(fieldCircle);
        }
    }

    renderObjects() {
        if (!this.svg.querySelector('#glow1')) {
            const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');

            for (let tier = 1; tier <= 3; tier++) {
                const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
                filter.setAttribute('id', `glow${tier}`);
                const blurAmount = tier * 1.5;
                filter.innerHTML = `
                    <feGaussianBlur stdDeviation="${blurAmount}" result="coloredBlur"/>
                    <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                `;
                defs.appendChild(filter);
            }

            this.svg.appendChild(defs);
        }

        for (const [id, object] of this.objects) {
            const cx = object.centerX * this.cellSize;
            const cy = object.centerY * this.cellSize;
            const scale = (object.radius * this.cellSize) / 50;

            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', object.wireframeSignature);

            const hue = object.phase === 'fixed' ? 120 : object.phase === 'osc28' ? 240 : 0;
            const saturation = 70 + object.stability * 30;
            const lightness = 50 + object.age * 0.1;
            const ballastBoost = object.stabilityMass * 10;

            path.setAttribute('stroke', `hsl(${hue}, ${saturation}%, ${lightness}%)`);
            path.setAttribute('stroke-width', `${2 + ballastBoost}`);
            path.setAttribute('fill', 'none');
            path.setAttribute('transform', `translate(${cx}, ${cy}) scale(${scale})`);

            if (object.stability > 0.7 || object.ballastTier > 1) {
                path.setAttribute('filter', `url(#glow${object.ballastTier})`);
            }

            this.svg.appendChild(path);

            if (object.ballastTier > 1) {
                const tierCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                tierCircle.setAttribute('cx', cx);
                tierCircle.setAttribute('cy', cy);
                tierCircle.setAttribute('r', object.radius * this.cellSize * 0.6);
                tierCircle.setAttribute('stroke', `hsl(${hue}, 100%, 80%)`);
                tierCircle.setAttribute('stroke-width', object.ballastTier);
                tierCircle.setAttribute('fill', 'none');
                this.svg.appendChild(tierCircle);
            }

            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', cx);
            circle.setAttribute('cy', cy);
            circle.setAttribute('r', object.radius * this.cellSize * 0.8);
            circle.setAttribute('stroke', `hsl(${hue}, 100%, 70%)`);
            circle.setAttribute('stroke-width', '1');
            circle.setAttribute('fill', 'none');
            circle.setAttribute('stroke-dasharray', '5,5');
            circle.setAttribute('opacity', '0.3');
            this.svg.appendChild(circle);
        }
    }

    getStats() {
        let totalStability = 0;
        for (const [id, object] of this.objects) {
            totalStability += object.stability;
        }

        const avgStability = this.objects.size > 0 ? totalStability / this.objects.size : 0;

        return {
            frameCount: this.frameCount,
            objectCount: this.objects.size,
            avgStability: avgStability,
            totalBallastMass: this.ballastSystem.totalStabilityMass,
            ballastResonance: this.ballastSystem.ballastResonance,
            ballastFields: this.ballastSystem.ballastFields.size,
            memoryFootprints: this.ballastSystem.memoryBallast.length
        };
    }

    getObjectList() {
        const objects = [];
        for (const [id, object] of this.objects) {
            objects.push({
                id: object.id,
                phase: object.phase,
                tier: object.ballastTier,
                age: object.age,
                stability: object.stability,
                mass: object.stabilityMass,
                cells: object.cells.length
            });
        }
        return objects;
    }

    setGridSize(size) {
        this.gridSize = size;
        this.cellSize = this.canvas.width / this.gridSize;
        this.grid = this.createGrid();
        this.initializeGrid();
        this.render();
    }

    setStabilityThreshold(threshold) {
        this.stabilityThreshold = threshold;
    }

    setSobelSensitivity(sensitivity) {
        this.sobelSensitivity = sensitivity;
    }

    setConservationFactor(factor) {
        this.ballastSystem.conservationFactor = factor;
    }

    injectPhase(phase) {
        const injectionPoints = 5;

        for (let i = 0; i < injectionPoints; i++) {
            const x = Math.floor(Math.random() * this.gridSize);
            const y = Math.floor(Math.random() * this.gridSize);

            for (let dy = -3; dy <= 3; dy++) {
                for (let dx = -3; dx <= 3; dx++) {
                    const nx = x + dx;
                    const ny = y + dy;

                    if (nx >= 0 && nx < this.gridSize && ny >= 0 && ny < this.gridSize) {
                        const cell = this.grid[ny][nx];
                        const distance = Math.sqrt(dx*dx + dy*dy);
                        const influence = Math.max(0, 1 - distance / 3);

                        if (Math.random() < influence) {
                            cell.phase = phase;
                            cell.stability = Math.max(cell.stability, 0.5);

                            if (cell.objectId) {
                                const object = this.objects.get(cell.objectId);
                                if (object) {
                                    object.stabilityMass += influence * 0.1;
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    injectBallast(amount) {
        const injectionPoints = Math.floor(amount / 2) + 1;

        for (let i = 0; i < injectionPoints; i++) {
            const x = Math.floor(Math.random() * this.gridSize);
            const y = Math.floor(Math.random() * this.gridSize);

            this.createResidualBallastField(x, y, amount / injectionPoints);

            for (const [id, object] of this.objects) {
                const distance = Math.sqrt(
                    Math.pow(object.centerX - x, 2) +
                    Math.pow(object.centerY - y, 2)
                );

                if (distance < 5) {
                    object.stabilityMass += amount * 0.1 * (1 - distance / 5);
                    object.conservedEnergy += amount * 0.05 * (1 - distance / 5);
                }
            }
        }
    }
}

// =============================================================================
// COMPUTER VISION COMPONENTS
// =============================================================================

class SobelDetector {
    constructor(options = {}) {
        this.kernelSize = options.kernelSize || 3;
        this.sobelThreshold = options.threshold || 50;
        this.blurRadius = options.blurRadius || 1;
    }

    detectBoundaries(imageData) {
        const width = imageData.width;
        const height = imageData.height;
        const data = imageData.data;

        const grayscale = this.toGrayscale(data, width, height);
        const blurred = this.gaussianBlur(grayscale, width, height, this.blurRadius);
        const {magnitude, direction} = this.applySobel(blurred, width, height);
        const boundaries = this.threshold(magnitude, width, height, this.sobelThreshold);

        return {boundaries, magnitude, direction, width, height};
    }

    toGrayscale(data, width, height) {
        const grayscale = new Float32Array(width * height);

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i] / 255;
            const g = data[i + 1] / 255;
            const b = data[i + 2] / 255;
            const lum = 0.299 * r + 0.587 * g + 0.114 * b;
            grayscale[i / 4] = lum;
        }

        return grayscale;
    }

    gaussianBlur(data, width, height, radius) {
        if (radius <= 0) return data;

        const result = new Float32Array(data.length);
        const kernel = this.createGaussianKernel(radius);

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                let sum = 0;
                let weight = 0;

                for (let k = -radius; k <= radius; k++) {
                    const xk = Math.max(0, Math.min(width - 1, x + k));
                    const w = kernel[k + radius];
                    sum += data[y * width + xk] * w;
                    weight += w;
                }

                result[y * width + x] = sum / weight;
            }
        }

        const temp = result.slice();
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                let sum = 0;
                let weight = 0;

                for (let k = -radius; k <= radius; k++) {
                    const yk = Math.max(0, Math.min(height - 1, y + k));
                    const w = kernel[k + radius];
                    sum += temp[yk * width + x] * w;
                    weight += w;
                }

                result[y * width + x] = sum / weight;
            }
        }

        return result;
    }

    createGaussianKernel(radius) {
        const size = radius * 2 + 1;
        const kernel = new Float32Array(size);
        const sigma = radius / 3;
        let sum = 0;

        for (let i = 0; i < size; i++) {
            const x = i - radius;
            kernel[i] = Math.exp(-(x * x) / (2 * sigma * sigma));
            sum += kernel[i];
        }

        for (let i = 0; i < size; i++) {
            kernel[i] /= sum;
        }

        return kernel;
    }

    applySobel(data, width, height) {
        const magnitude = new Float32Array(width * height);
        const direction = new Float32Array(width * height);

        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const idx = y * width + x;

                const gx = -data[(y-1) * width + (x-1)] + data[(y-1) * width + (x+1)] +
                          -2 * data[y * width + (x-1)] + 2 * data[y * width + (x+1)] +
                          -data[(y+1) * width + (x-1)] + data[(y+1) * width + (x+1)];

                const gy = -data[(y-1) * width + (x-1)] - 2 * data[(y-1) * width + x] - data[(y-1) * width + (x+1)] +
                           data[(y+1) * width + (x-1)] + 2 * data[(y+1) * width + x] + data[(y+1) * width + (x+1)];

                magnitude[idx] = Math.sqrt(gx*gx + gy*gy);
                direction[idx] = Math.atan2(gy, gx);
            }
        }

        return {magnitude, direction};
    }

    threshold(magnitude, width, height, threshold) {
        const boundaries = new Uint8Array(width * height);

        for (let i = 0; i < magnitude.length; i++) {
            boundaries[i] = magnitude[i] > threshold ? 255 : 0;
        }

        return boundaries;
    }
}

// =============================================================================
// SPATIOTEMPORAL MEMORY
// =============================================================================

class SpatiotemporalMemory {
    constructor(options = {}) {
        this.frustumBounds = options.frustumBounds || {left: -100, top: -100, right: 100, bottom: 100};
        this.memoryBuffer = new Map();
        this.predictiveField = new PotentialField();
        this.reidentificationThreshold = options.reidentificationThreshold || 0.85;
        this.memoryDecayRate = options.memoryDecayRate || 0.95;
        this.maxMemoryAge = options.maxMemoryAge || 1000;
        this.antclockSlowRate = options.antclockSlowRate || 0.5;
    }

    storeAgent(agent) {
        const signature = this.computeSignature(agent);
        const memoryEntry = {
            agentState: agent.serialize(),
            exitTime: performance.now(),
            exitBoundary: agent.boundary_env.slice(),
            exitVelocity: this.computeVelocity(agent),
            predictedTrajectory: this.predictTrajectory(agent),
            phaseCoherence: agent.phase.coherence(),
            antclockRate: this.antclockSlowRate,
            confidence: 1.0,
            reidentificationAttempts: 0,
            lastUpdate: performance.now()
        };

        this.memoryBuffer.set(signature, memoryEntry);
        this.predictiveField.addSource(
            agent.centroid,
            agent.phase,
            agent.velocity || [0, 0]
        );

        console.log(`📚 Stored agent ${agent.id} in memory (signature: ${signature})`);
    }

    tryReidentify(newAgent) {
        const candidates = this.findMemoryCandidates(newAgent);

        for (const [signature, memory] of candidates) {
            memory.reidentificationAttempts++;

            const matchScore = this.computeMatchScore(newAgent, memory);

            if (matchScore > this.reidentificationThreshold) {
                const rehydrated = Agent.rehydrate(
                    memory.agentState,
                    newAgent.boundary_env,
                    performance.now() - memory.exitTime
                );

                const timeDiff = performance.now() - memory.exitTime;
                rehydrated.age += memory.antclockRate * (timeDiff / 16.67);

                console.log(`🔄 Re-identified agent ${rehydrated.id} (score: ${matchScore.toFixed(3)})`);
                this.memoryBuffer.delete(signature);
                this.predictiveField.removeSource(signature);

                return rehydrated;
            }
        }

        return null;
    }

    computeSignature(agent) {
        return `${agent.id}_${Math.round(agent.centroid[0])}_${Math.round(agent.centroid[1])}_${agent.phase.toString()}`;
    }

    findMemoryCandidates(newAgent) {
        const candidates = [];
        const currentTime = performance.now();

        for (const [signature, memory] of this.memoryBuffer) {
            const age = currentTime - memory.exitTime;
            if (age > this.maxMemoryAge) continue;

            const distance = Math.sqrt(
                Math.pow(newAgent.centroid[0] - memory.predictedTrajectory.x, 2) +
                Math.pow(newAgent.centroid[1] - memory.predictedTrajectory.y, 2)
            );

            if (distance < 50) {
                candidates.push([signature, memory]);
            }
        }

        return candidates;
    }

    computeMatchScore(newAgent, memory) {
        let score = 0;

        // Phase coherence match
        if (newAgent.phase.coherence() === memory.phaseCoherence) score += 0.3;

        // Boundary similarity
        const boundaryOverlap = this.computeBoundaryOverlap(newAgent.boundary_env, memory.exitBoundary);
        score += boundaryOverlap * 0.4;

        // Trajectory prediction accuracy
        const trajectoryError = Math.sqrt(
            Math.pow(newAgent.centroid[0] - memory.predictedTrajectory.x, 2) +
            Math.pow(newAgent.centroid[1] - memory.predictedTrajectory.y, 2)
        );
        const trajectoryScore = Math.max(0, 1 - trajectoryError / 100);
        score += trajectoryScore * 0.3;

        // Age consistency
        const expectedAge = memory.antclockRate * ((performance.now() - memory.exitTime) / 16.67);
        const ageError = Math.abs(newAgent.age - expectedAge);
        const ageScore = Math.max(0, 1 - ageError / 100);
        score += ageScore * 0.2;

        return Math.min(1, score);
    }

    computeBoundaryOverlap(boundary1, boundary2) {
        const overlap = [];
        for (let i = 0; i < boundary1.length; i++) {
            const diff = Math.abs(boundary1[i] - boundary2[i]);
            overlap.push(Math.max(0, 1 - diff / 50));
        }
        return overlap.reduce((sum, val) => sum + val, 0) / overlap.length;
    }

    computeVelocity(agent) {
        return agent.velocity || [0, 0];
    }

    predictTrajectory(agent) {
        const velocity = this.computeVelocity(agent);
        const predictionTime = 1000; // 1 second prediction

        return {
            x: agent.centroid[0] + velocity[0] * predictionTime / 16.67,
            y: agent.centroid[1] + velocity[1] * predictionTime / 16.67,
            confidence: agent.phase.coherence()
        };
    }

    updateMemory() {
        const currentTime = performance.now();

        for (const [signature, memory] of this.memoryBuffer) {
            const age = currentTime - memory.exitTime;

            if (age > this.maxMemoryAge) {
                this.memoryBuffer.delete(signature);
                this.predictiveField.removeSource(signature);
                continue;
            }

            memory.confidence *= this.memoryDecayRate;
            memory.lastUpdate = currentTime;
        }
    }

    getPotentialAt(position) {
        return this.predictiveField.getPotentialAt(position);
    }
}

class PotentialField {
    constructor() {
        this.sources = new Map();
    }

    addSource(position, phase, velocity) {
        const id = `source_${Date.now()}_${Math.random()}`;
        this.sources.set(id, {
            position: [...position],
            phase: phase,
            velocity: [...velocity],
            strength: 1.0
        });
        return id;
    }

    removeSource(id) {
        this.sources.delete(id);
    }

    getPotentialAt(position) {
        let totalPotential = 0;

        for (const [id, source] of this.sources) {
            const distance = Math.sqrt(
                Math.pow(position[0] - source.position[0], 2) +
                Math.pow(position[1] - source.position[1], 2)
            );

            if (distance > 0) {
                const potential = source.strength / (distance * distance);
                totalPotential += potential;
            }
        }

        return totalPotential;
    }
}

// =============================================================================
// SVG KERNEL SYSTEM
// =============================================================================

class SVGKernelSystem {
    constructor() {
        this.kernels = new Map();
        this.lattices = new Map();
    }

    parseKernel(svgText) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(svgText, 'text/xml');

        const kernelElements = doc.querySelectorAll('kernel');
        const kernels = [];

        for (const kernelEl of kernelElements) {
            const kernel = this.parseKernelElement(kernelEl);
            this.kernels.set(kernel.id, kernel);
            kernels.push(kernel);
        }

        return kernels;
    }

    parseKernelElement(element) {
        const id = element.getAttribute('id');
        const energy = parseFloat(element.getAttribute('energy') || 1.0);

        const kernel = {
            id: id,
            energy: energy,
            shape: null,
            discrete: null,
            invariants: [],
            power: parseFloat(element.getAttribute('power') || 2.0)
        };

        const shapeEl = element.querySelector('shape');
        if (shapeEl) {
            kernel.shape = this.parseShapeElement(shapeEl);
        }

        const discreteEl = element.querySelector('discrete');
        if (discreteEl) {
            kernel.discrete = this.parseDiscreteElement(discreteEl);
        }

        const invariantEls = element.querySelectorAll('invariants > *');
        for (const invEl of invariantEls) {
            kernel.invariants.push(this.parseInvariantElement(invEl));
        }

        return kernel;
    }

    parseShapeElement(element) {
        const shape = {
            type: 'svg',
            paths: [],
            transforms: [],
            attributes: {}
        };

        const paths = element.querySelectorAll('path');
        for (const pathEl of paths) {
            shape.paths.push({
                d: pathEl.getAttribute('d'),
                stroke: pathEl.getAttribute('stroke'),
                strokeWidth: parseFloat(pathEl.getAttribute('stroke-width') || '2'),
                fill: pathEl.getAttribute('fill'),
                transform: pathEl.getAttribute('transform')
            });
        }

        return shape;
    }

    parseDiscreteElement(element) {
        return {
            lattice: {
                size: parseInt(element.querySelector('lattice')?.getAttribute('size') || 256),
                boundary: element.querySelector('lattice')?.getAttribute('boundary') || 'wrap',
                dimensions: parseInt(element.querySelector('lattice')?.getAttribute('dimensions') || '2')
            }
        };
    }

    parseInvariantElement(element) {
        const type = element.tagName;
        const invariant = {
            type: type,
            enabled: true,
            params: {}
        };

        for (const attr of element.attributes) {
            if (attr.name === 'enabled') {
                invariant.enabled = attr.value === 'true';
            } else {
                invariant.params[attr.name] = attr.value;
            }
        }

        return invariant;
    }

    discretizeKernel(kernel) {
        const latticeSize = kernel.discrete.lattice.size;
        const lattice = new Float32Array(latticeSize * latticeSize);

        for (const path of kernel.shape.paths) {
            this.rasterizePathToLattice(path, lattice, latticeSize);
        }

        this.applyInvariants(lattice, kernel.invariants, latticeSize);
        kernel.lattice = lattice;
        this.lattices.set(kernel.id, lattice);

        return lattice;
    }

    rasterizePathToLattice(path, lattice, size) {
        const commands = this.parseSVGPath(path.d);
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = size * 4;
        const ctx = canvas.getContext('2d');

        ctx.strokeStyle = path.stroke || '#000000';
        ctx.lineWidth = (path.strokeWidth || 2) * 4;
        ctx.fillStyle = path.fill || 'transparent';

        ctx.beginPath();
        this.renderPathCommands(ctx, commands, 4);
        ctx.stroke();
        if (path.fill && path.fill !== 'none') {
            ctx.fill();
        }

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        this.downsampleToLattice(imageData, lattice, size, 4);
    }

    parseSVGPath(d) {
        const commands = [];
        const tokens = d.match(/[a-zA-Z][^a-zA-Z]*/g) || [];

        for (const token of tokens) {
            const cmd = token[0];
            const params = token.slice(1).trim().split(/[\s,]+/).map(parseFloat);
            commands.push({cmd: cmd.toUpperCase(), params});
        }

        return commands;
    }

    renderPathCommands(ctx, commands, scale = 1) {
        let currentX = 0, currentY = 0;
        let startX = 0, startY = 0;

        for (const command of commands) {
            const {cmd, params} = command;

            switch (cmd) {
                case 'M':
                    currentX = params[0] * scale;
                    currentY = params[1] * scale;
                    startX = currentX;
                    startY = currentY;
                    ctx.moveTo(currentX, currentY);
                    break;
                case 'L':
                    currentX = params[0] * scale;
                    currentY = params[1] * scale;
                    ctx.lineTo(currentX, currentY);
                    break;
                case 'C':
                    ctx.bezierCurveTo(
                        params[0] * scale, params[1] * scale,
                        params[2] * scale, params[3] * scale,
                        params[4] * scale, params[5] * scale
                    );
                    currentX = params[4] * scale;
                    currentY = params[5] * scale;
                    break;
                case 'Q':
                    ctx.quadraticCurveTo(
                        params[0] * scale, params[1] * scale,
                        params[2] * scale, params[3] * scale
                    );
                    currentX = params[2] * scale;
                    currentY = params[3] * scale;
                    break;
                case 'A':
                    currentX = params[5] * scale;
                    currentY = params[6] * scale;
                    ctx.lineTo(currentX, currentY);
                    break;
                case 'Z':
                    ctx.closePath();
                    break;
            }
        }
    }

    downsampleToLattice(imageData, lattice, size, supersample) {
        const data = imageData.data;
        const blockSize = supersample;

        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                let sum = 0;
                let count = 0;

                for (let sy = 0; sy < blockSize; sy++) {
                    for (let sx = 0; sx < blockSize; sx++) {
                        const px = x * blockSize + sx;
                        const py = y * blockSize + sy;
                        const idx = (py * imageData.width + px) * 4;

                        if (px < imageData.width && py < imageData.height) {
                            const r = data[idx] / 255;
                            const g = data[idx + 1] / 255;
                            const b = data[idx + 2] / 255;
                            const lum = 0.299 * r + 0.587 * g + 0.114 * b;
                            sum += lum;
                            count++;
                        }
                    }
                }

                const avgPresence = count > 0 ? sum / count : 0;
                lattice[y * size + x] = Math.max(lattice[y * size + x], avgPresence);
            }
        }
    }

    applyInvariants(lattice, invariants, size) {
        for (const invariant of invariants) {
            if (!invariant.enabled) continue;

            switch (invariant.type) {
                case 'scale-invariance':
                    this.applyScaleInvariance(lattice, size);
                    break;
                case 'mirror-symmetry':
                    this.applyMirrorSymmetry(lattice, size);
                    break;
                case 'rotation-invariance':
                    this.applyRotationInvariance(lattice, size);
                    break;
            }
        }
    }

    applyScaleInvariance(lattice, size) {
        const scales = [0.5, 0.707, 1.0, 1.414, 2.0];

        for (const scale of scales) {
            const scaledLattice = this.scaleLattice(lattice, size, scale);
            for (let i = 0; i < lattice.length; i++) {
                lattice[i] = Math.max(lattice[i], scaledLattice[i]);
            }
        }
    }

    scaleLattice(lattice, size, scale) {
        const newSize = Math.floor(size * scale);
        const scaled = new Float32Array(newSize * newSize);

        for (let y = 0; y < newSize; y++) {
            for (let x = 0; x < newSize; x++) {
                const srcX = Math.floor(x / scale);
                const srcY = Math.floor(y / scale);

                if (srcX < size && srcY < size) {
                    scaled[y * newSize + x] = lattice[srcY * size + srcX];
                }
            }
        }

        return scaled;
    }

    applyMirrorSymmetry(lattice, size) {
        const mirrored = new Float32Array(lattice);

        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const mx = size - 1 - x;
                const my = size - 1 - y;

                mirrored[y * size + x] = Math.max(mirrored[y * size + x], lattice[y * size + mx]);
                mirrored[y * size + x] = Math.max(mirrored[y * size + x], lattice[my * size + x]);
            }
        }

        mirrored.forEach((val, i) => lattice[i] = val);
    }

    applyRotationInvariance(lattice, size) {
        const rotations = [90, 180, 270];

        for (const angle of rotations) {
            const rotated = this.rotateLattice(lattice, size, angle);
            for (let i = 0; i < lattice.length; i++) {
                lattice[i] = Math.max(lattice[i], rotated[i]);
            }
        }
    }

    rotateLattice(lattice, size, angle) {
        const rotated = new Float32Array(size * size);
        const radians = (angle * Math.PI) / 180;
        const cos = Math.cos(radians);
        const sin = Math.sin(radians);
        const center = size / 2;

        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const dx = x - center;
                const dy = y - center;
                const rx = dx * cos - dy * sin + center;
                const ry = dx * sin + dy * cos + center;

                const rxInt = Math.round(rx);
                const ryInt = Math.round(ry);

                if (rxInt >= 0 && rxInt < size && ryInt >= 0 && ryInt < size) {
                    rotated[y * size + x] = lattice[ryInt * size + rxInt];
                }
            }
        }

        return rotated;
    }

    evolveLattice(kernelId, inputLattice = null) {
        const kernel = this.kernels.get(kernelId);
        if (!kernel) return null;

        const size = kernel.discrete.lattice.size;
        const currentLattice = inputLattice || kernel.lattice;
        const newLattice = new Float32Array(size * size);

        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const idx = y * size + x;

                const match = this.computeKernelMatch(kernel, currentLattice, x, y, size);
                const coupling = this.computeCouplingSum(currentLattice, x, y, size);

                const energy = kernel.energy;
                const power = kernel.power;
                const evolved = energy * Math.pow(match + coupling, power);

                newLattice[idx] = Math.max(0, Math.min(1, evolved));
            }
        }

        kernel.lattice = newLattice;
        this.lattices.set(kernelId, newLattice);

        return newLattice;
    }

    computeKernelMatch(kernel, lattice, x, y, size) {
        const kernelLattice = kernel.lattice;
        let match = 0;
        let weight = 0;

        const kernelSize = Math.min(size, 32);
        const halfKernel = kernelSize / 2;

        for (let ky = -halfKernel; ky <= halfKernel; ky++) {
            for (let kx = -halfKernel; kx <= halfKernel; kx++) {
                const lx = x + kx;
                const ly = y + ky;

                if (lx >= 0 && lx < size && ly >= 0 && ly < size) {
                    const lidx = ly * size + lx;
                    const kidx = (ky + halfKernel) * kernelSize + (kx + halfKernel);

                    if (kidx < kernelLattice.length) {
                        const similarity = 1 - Math.abs(lattice[lidx] - kernelLattice[kidx]);
                        match += similarity * kernelLattice[kidx];
                        weight += kernelLattice[kidx];
                    }
                }
            }
        }

        return weight > 0 ? match / weight : 0;
    }

    computeCouplingSum(lattice, x, y, size) {
        let coupling = 0;
        const radius = 3;

        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                if (dx === 0 && dy === 0) continue;

                const nx = x + dx;
                const ny = y + dy;

                if (nx >= 0 && nx < size && ny >= 0 && ny < size) {
                    const distance = Math.sqrt(dx*dx + dy*dy);
                    const weight = 1 / (1 + distance);
                    coupling += lattice[ny * size + nx] * weight;
                }
            }
        }

        return coupling * 0.1;
    }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

class SageStringUtils {
    static createSVGElement(type, attributes = {}) {
        const element = document.createElementNS('http://www.w3.org/2000/svg', type);
        for (const [key, value] of Object.entries(attributes)) {
            element.setAttribute(key, value);
        }
        return element;
    }

    static hsvToRgb(h, s, v) {
        const c = v * s;
        const x = c * (1 - Math.abs((h / 60) % 2 - 1));
        const m = v - c;

        let r, g, b;
        if (h >= 0 && h < 60) {
            r = c; g = x; b = 0;
        } else if (h >= 60 && h < 120) {
            r = x; g = c; b = 0;
        } else if (h >= 120 && h < 180) {
            r = 0; g = c; b = x;
        } else if (h >= 180 && h < 240) {
            r = 0; g = x; b = c;
        } else if (h >= 240 && h < 300) {
            r = x; g = 0; b = c;
        } else {
            r = c; g = 0; b = x;
        }

        return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
    }

    static clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    static lerp(a, b, t) {
        return a + (b - a) * t;
    }

    static distance(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    }

    static randomBetween(min, max) {
        return Math.random() * (max - min) + min;
    }

    static gaussianRandom(mean = 0, std = 1) {
        const u1 = Math.random();
        const u2 = Math.random();
        const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
        return z0 * std + mean;
    }
}

// =============================================================================
// EXPORTS
// =============================================================================

window.SageString = {
    SelfReferentialSobelSystem,
    SobelDetector,
    SpatiotemporalMemory,
    SVGKernelSystem,
    SageStringUtils
};


