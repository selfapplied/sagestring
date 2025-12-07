// SageString Core - Self-Referential Sobel System

class SelfReferentialSobelSystem {
    constructor(canvas, svg, options = {}) {
        this.canvas = canvas;
        this.svg = svg;
        this.ctx = canvas.getContext('2d');

        // Configuration from declarative attributes
        this.gridSize = options.gridSize || 64;
        this.cellSize = canvas.width / this.gridSize;
        this.running = options.autoStart || false;
        this.frameCount = 0;

        this.sobelSensitivity = options.sobelSensitivity || 50;
        this.stabilityThreshold = options.stabilityThreshold || 0.3;

        // Ballast system - fully configurable
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

        this.objects = new Map();
        this.objectIdCounter = 0;

        // Initialize system
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
// DECLARATIVE SYSTEM INITIALIZATION
// =============================================================================

// Auto-initialize declarative systems on page load
document.addEventListener('DOMContentLoaded', function() {
    // Find all declarative system elements
    const systems = document.querySelectorAll('sagestring-system');

    systems.forEach(systemElement => {
        initializeDeclarativeSystem(systemElement);
    });
});

function initializeDeclarativeSystem(systemElement) {
    // Read declarative configuration
    const config = {
        gridSize: parseInt(systemElement.getAttribute('grid-size') || '64'),
        sobelSensitivity: parseInt(systemElement.getAttribute('sobel-sensitivity') || '50'),
        stabilityThreshold: parseFloat(systemElement.getAttribute('stability-threshold') || '0.3'),
        conservationFactor: parseFloat(systemElement.getAttribute('conservation-factor') || '0.95'),
        ballastAttraction: parseFloat(systemElement.getAttribute('ballast-attraction') || '0.05'),
        autoStart: systemElement.getAttribute('auto-start') === 'true'
    };

    // Find display element
    const displayElement = systemElement.querySelector('sagestring-display');
    if (!displayElement) {
        console.error('No sagestring-display element found');
        return;
    }

    const width = parseInt(displayElement.getAttribute('width') || '512');
    const height = parseInt(displayElement.getAttribute('height') || '512');

    // Create canvas and SVG
    const canvas = displayElement.querySelector('canvas') || document.createElement('canvas');
    const svg = displayElement.querySelector('svg') || document.createElement('svg');

    canvas.width = width;
    canvas.height = height;
    svg.setAttribute('width', width);
    svg.setAttribute('height', height);
    svg.style.position = 'absolute';
    svg.style.top = '0';
    svg.style.left = '0';

    if (!displayElement.contains(canvas)) displayElement.appendChild(canvas);
    if (!displayElement.contains(svg)) displayElement.appendChild(svg);

    // Initialize system
    const system = new SelfReferentialSobelSystem(canvas, svg, config);

    // Load initial objects if declared
    const objectElements = systemElement.querySelectorAll('sagestring-object');
    objectElements.forEach(objElement => {
        const x = parseInt(objElement.getAttribute('x') || '0');
        const y = parseInt(objElement.getAttribute('y') || '0');
        const radius = parseInt(objElement.getAttribute('radius') || '5');
        system.createObject(x, y, radius);
    });

    // Set up control buttons
    const buttonElements = systemElement.querySelectorAll('sagestring-button');
    buttonElements.forEach(buttonElement => {
        const action = buttonElement.getAttribute('action');

        buttonElement.addEventListener('click', function() {
            handleDeclarativeAction(system, action, buttonElement);
        });
    });

    // Auto-start if configured
    if (config.autoStart) {
        system.running = true;
        startAnimation(system, systemElement);
    }

    // Store system reference
    systemElement._sagestringSystem = system;

    // Initial render
    system.render();
    updateDeclarativeStats(systemElement, system);
}

// Handle declarative actions
function handleDeclarativeAction(system, action, buttonElement) {
    const systemElement = buttonElement.closest('sagestring-system');

    switch (action) {
        case 'start':
            if (system.running) {
                system.running = false;
                stopAnimation(systemElement);
                buttonElement.textContent = '▶️ Start';
                buttonElement.removeAttribute('active');
            } else {
                system.running = true;
                startAnimation(system, systemElement);
                buttonElement.textContent = '⏸️ Pause';
                buttonElement.setAttribute('active', '');
            }
            break;

        case 'reset':
            system.running = false;
            stopAnimation(systemElement);
            const config = readConfigFromElement(systemElement);
            initializeDeclarativeSystem(systemElement);
            // Reset button states
            systemElement.querySelectorAll('sagestring-button[action="start"]').forEach(btn => {
                btn.textContent = '▶️ Start';
                btn.removeAttribute('active');
            });
            break;

        case 'seed':
            system.seedInitialObjects();
            break;

        case 'inject-phase':
            const phase = buttonElement.getAttribute('phase');
            if (phase) system.injectPhase(phase);
            break;

        case 'inject-ballast':
            const amount = parseFloat(buttonElement.getAttribute('amount') || '1.0');
            system.injectBallast(amount);
            break;
    }
}

function readConfigFromElement(systemElement) {
    return {
        gridSize: parseInt(systemElement.getAttribute('grid-size') || '64'),
        sobelSensitivity: parseInt(systemElement.getAttribute('sobel-sensitivity') || '50'),
        stabilityThreshold: parseFloat(systemElement.getAttribute('stability-threshold') || '0.3'),
        conservationFactor: parseFloat(systemElement.getAttribute('conservation-factor') || '0.95'),
        ballastAttraction: parseFloat(systemElement.getAttribute('ballast-attraction') || '0.05'),
        autoStart: systemElement.getAttribute('auto-start') === 'true'
    };
}

function startAnimation(system, systemElement) {
    if (systemElement._animationId) return;

    function animate() {
        if (system && system.running) {
            system.update();
            updateDeclarativeStats(systemElement, system);
            systemElement._animationId = requestAnimationFrame(animate);
        } else {
            systemElement._animationId = null;
        }
    }

    systemElement._animationId = requestAnimationFrame(animate);
}

function stopAnimation(systemElement) {
    if (systemElement._animationId) {
        cancelAnimationFrame(systemElement._animationId);
        systemElement._animationId = null;
    }
}

function updateDeclarativeStats(systemElement, system) {
    const stats = system.getStats();

    // Update all stat elements
    const statElements = systemElement.querySelectorAll('[data-stat]');
    statElements.forEach(element => {
        const statName = element.getAttribute('data-stat');
        if (stats[statName] !== undefined) {
            if (typeof stats[statName] === 'number') {
                element.textContent = `${statName.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${stats[statName].toFixed ? stats[statName].toFixed(2) : stats[statName]}`;
            } else {
                element.textContent = `${statName.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${stats[statName]}`;
            }
        }
    });
}

// =============================================================================
// EXPORTS
// =============================================================================

window.SageString = {
    SelfReferentialSobelSystem,
    initializeDeclarativeSystem
};