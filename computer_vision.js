/**
 * Computer Vision Components for Spatiotemporal Continuity
 *
 * Implements Sobel boundary detection, contour extraction, and closed path finding
 * for identifying agents in video frames.
 */

class SobelDetector {
  /**
   * Sobel operator for boundary detection
   */
  constructor(options = {}) {
    this.kernelSize = options.kernelSize || 3;
    this.threshold = options.threshold || 50;
    this.blurRadius = options.blurRadius || 1;
  }

  /**
   * Detect boundaries in image data using Sobel operator
   */
  detectBoundaries(imageData) {
    const width = imageData.width;
    const height = imageData.height;
    const data = imageData.data;

    // Convert to grayscale if needed
    const grayscale = this.toGrayscale(data, width, height);

    // Apply Gaussian blur to reduce noise
    const blurred = this.gaussianBlur(grayscale, width, height, this.blurRadius);

    // Apply Sobel operator
    const {magnitude, direction} = this.applySobel(blurred, width, height);

    // Threshold and create binary boundary image
    const boundaries = this.threshold(magnitude, width, height, this.threshold);

    return {boundaries, magnitude, direction, width, height};
  }

  /**
   * Convert RGBA to grayscale
   */
  toGrayscale(data, width, height) {
    const grayscale = new Float32Array(width * height);

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i] / 255;
      const g = data[i + 1] / 255;
      const b = data[i + 2] / 255;
      // Luminance formula
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      grayscale[i / 4] = lum;
    }

    return grayscale;
  }

  /**
   * Simple Gaussian blur
   */
  gaussianBlur(data, width, height, radius) {
    if (radius <= 0) return data;

    const result = new Float32Array(data.length);
    const kernel = this.createGaussianKernel(radius);

    // Horizontal pass
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

    // Vertical pass
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

  /**
   * Create 1D Gaussian kernel
   */
  createGaussianKernel(radius) {
    const size = 2 * radius + 1;
    const kernel = new Float32Array(size);
    const sigma = radius / 3; // Rule of thumb

    let sum = 0;
    for (let i = 0; i < size; i++) {
      const x = i - radius;
      kernel[i] = Math.exp(-(x * x) / (2 * sigma * sigma));
      sum += kernel[i];
    }

    // Normalize
    for (let i = 0; i < size; i++) {
      kernel[i] /= sum;
    }

    return kernel;
  }

  /**
   * Apply Sobel operator
   */
  applySobel(data, width, height) {
    const magnitude = new Float32Array(width * height);
    const direction = new Float32Array(width * height);

    // Sobel kernels
    const Gx = [
      [-1, 0, 1],
      [-2, 0, 2],
      [-1, 0, 1]
    ];

    const Gy = [
      [-1, -2, -1],
      [0, 0, 0],
      [1, 2, 1]
    ];

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let sumX = 0;
        let sumY = 0;

        // Apply kernels
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const pixel = data[(y + ky) * width + (x + kx)];
            sumX += pixel * Gx[ky + 1][kx + 1];
            sumY += pixel * Gy[ky + 1][kx + 1];
          }
        }

        // Calculate magnitude and direction
        const mag = Math.sqrt(sumX * sumX + sumY * sumY);
        const dir = Math.atan2(sumY, sumX);

        magnitude[y * width + x] = mag;
        direction[y * width + x] = dir;
      }
    }

    return {magnitude, direction};
  }

  /**
   * Apply threshold to create binary image
   */
  threshold(magnitude, width, height, threshold) {
    const binary = new Uint8Array(width * height);

    for (let i = 0; i < magnitude.length; i++) {
      binary[i] = magnitude[i] > threshold ? 255 : 0;
    }

    return binary;
  }
}

class ContourExtractor {
  /**
   * Extract closed contours from binary boundary image
   */
  constructor(options = {}) {
    this.minContourLength = options.minContourLength || 20;
    this.maxContourLength = options.maxContourLength || 1000;
    this.smoothingIterations = options.smoothingIterations || 2;
  }

  /**
   * Extract closed paths from boundary data
   */
  extractClosedPaths(boundaryData, width, height) {
    const contours = this.findContours(boundaryData, width, height);
    const closedPaths = [];

    for (const contour of contours) {
      if (this.isClosed(contour) && this.isValidLength(contour)) {
        const smoothed = this.smoothContour(contour, this.smoothingIterations);
        closedPaths.push(smoothed);
      }
    }

    return closedPaths;
  }

  /**
   * Find contours using border following algorithm
   */
  findContours(binaryData, width, height) {
    const visited = new Uint8Array(width * height);
    const contours = [];

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;

        if (binaryData[idx] === 255 && !visited[idx]) {
          const contour = this.traceContour(binaryData, visited, width, height, x, y);
          if (contour.length >= 8) { // Minimum contour length
            contours.push(contour);
          }
        }
      }
    }

    return contours;
  }

  /**
   * Trace a single contour using Moore neighborhood
   */
  traceContour(binaryData, visited, width, height, startX, startY) {
    const contour = [];
    let x = startX;
    let y = startY;
    let direction = 0; // 0: right, 1: down-right, 2: down, etc.

    const directions = [
      [1, 0], [1, 1], [0, 1], [-1, 1],
      [-1, 0], [-1, -1], [0, -1], [1, -1]
    ];

    do {
      visited[y * width + x] = 1;
      contour.push([x, y]);

      // Find next boundary pixel
      let found = false;
      for (let i = 0; i < 8; i++) {
        const checkDir = (direction + i) % 8;
        const [dx, dy] = directions[checkDir];
        const nx = x + dx;
        const ny = y + dy;

        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          const nidx = ny * width + nx;
          if (binaryData[nidx] === 255 && !visited[nidx]) {
            x = nx;
            y = ny;
            direction = checkDir;
            found = true;
            break;
          }
        }
      }

      if (!found) break;

      // Prevent infinite loops
      if (contour.length > width * height) break;

    } while (!(x === startX && y === startY) || contour.length < 3);

    return contour;
  }

  /**
   * Check if contour is closed (starts and ends near each other)
   */
  isClosed(contour) {
    if (contour.length < 3) return false;

    const start = contour[0];
    const end = contour[contour.length - 1];
    const distance = Math.sqrt(
      Math.pow(end[0] - start[0], 2) + Math.pow(end[1] - start[1], 2)
    );

    return distance <= 3; // Within 3 pixels
  }

  /**
   * Check if contour length is within valid range
   */
  isValidLength(contour) {
    return contour.length >= this.minContourLength && contour.length <= this.maxContourLength;
  }

  /**
   * Smooth contour using moving average
   */
  smoothContour(contour, iterations) {
    let smoothed = contour.slice();

    for (let iter = 0; iter < iterations; iter++) {
      const newContour = [];

      for (let i = 0; i < smoothed.length; i++) {
        const prev = smoothed[(i - 1 + smoothed.length) % smoothed.length];
        const curr = smoothed[i];
        const next = smoothed[(i + 1) % smoothed.length];

        // Weighted average with neighbors
        const x = (prev[0] + 2 * curr[0] + next[0]) / 4;
        const y = (prev[1] + 2 * curr[1] + next[1]) / 4;

        newContour.push([x, y]);
      }

      smoothed = newContour;
    }

    return smoothed;
  }
}

class AgentPartitioner {
  /**
   * Partition environment into agents and background using masks
   */
  constructor() {
    this.agentMasks = new Map();
    this.environmentMask = null;
  }

  /**
   * Create unified masks for environment and agents
   */
  computeUnifiedMasks(agents, frameWidth, frameHeight) {
    // Start with full environment mask
    this.environmentMask = new Uint8Array(frameWidth * frameHeight);
    for (let i = 0; i < this.environmentMask.length; i++) {
      this.environmentMask[i] = 255; // All ones
    }

    // Create agent masks
    this.agentMasks.clear();

    for (const agent of agents.values()) {
      const mask = this.fillClosedPath(agent.boundary_env, frameWidth, frameHeight);
      this.agentMasks.set(agent.id, mask);

      // Subtract from environment (agents occlude environment)
      for (let i = 0; i < mask.length; i++) {
        if (mask[i] === 255) {
          this.environmentMask[i] = 0;
        }
      }
    }

    return {
      environment: this.environmentMask,
      agents: this.agentMasks,
      allOnes: new Uint8Array(frameWidth * frameHeight).fill(255) // Verification
    };
  }

  /**
   * Fill closed path to create binary mask
   */
  fillClosedPath(boundary, width, height) {
    const mask = new Uint8Array(width * height);

    if (!boundary || boundary.length < 3) return mask;

    // Use scanline fill algorithm
    const edges = this.computeEdges(boundary, height);

    for (let y = 0; y < height; y++) {
      const rowEdges = edges[y];
      if (!rowEdges || rowEdges.length === 0) continue;

      // Sort edges by x
      rowEdges.sort((a, b) => a - b);

      // Fill between pairs of edges
      for (let i = 0; i < rowEdges.length; i += 2) {
        if (i + 1 < rowEdges.length) {
          const startX = Math.max(0, Math.floor(rowEdges[i]));
          const endX = Math.min(width - 1, Math.ceil(rowEdges[i + 1]));

          for (let x = startX; x <= endX; x++) {
            mask[y * width + x] = 255;
          }
        }
      }
    }

    return mask;
  }

  /**
   * Compute edge intersections for each scanline
   */
  computeEdges(boundary, height) {
    const edges = Array.from({length: height}, () => []);

    // Process each edge of the boundary
    for (let i = 0; i < boundary.length; i++) {
      const p1 = boundary[i];
      const p2 = boundary[(i + 1) % boundary.length];

      const x1 = p1[0], y1 = p1[1];
      const x2 = p2[0], y2 = p2[1];

      // Skip horizontal edges
      if (Math.abs(y2 - y1) < 1e-6) continue;

      const minY = Math.min(y1, y2);
      const maxY = Math.max(y1, y2);

      // Find scanlines this edge crosses
      const startY = Math.max(0, Math.floor(minY));
      const endY = Math.min(height - 1, Math.ceil(maxY));

      for (let y = startY; y <= endY; y++) {
        if (y >= minY && y <= maxY) {
          // Interpolate x at this y
          const t = (y - y1) / (y2 - y1);
          const x = x1 + t * (x2 - x1);
          edges[y].push(x);
        }
      }
    }

    return edges;
  }

  /**
   * Get mask for specific agent
   */
  getAgentMask(agentId) {
    return this.agentMasks.get(agentId) || null;
  }

  /**
   * Check if point is inside any agent
   */
  pointInAgent(x, y, width) {
    for (const [agentId, mask] of this.agentMasks) {
      const idx = y * width + x;
      if (mask[idx] === 255) {
        return agentId;
      }
    }
    return null;
  }
}

// Main perception pipeline combining all components
class PerceptionPipeline {
  /**
   * Complete perception pipeline: video → boundaries → agents
   */
  constructor(options = {}) {
    this.sobelDetector = new SobelDetector(options.sobel || {});
    this.contourExtractor = new ContourExtractor(options.contour || {});
    this.agentPartitioner = new AgentPartitioner();

    this.frameCount = 0;
    this.lastBoundaries = [];
  }

  /**
   * Process video frame to extract agents
   */
  processFrame(imageData) {
    // Step 1: Sobel boundary detection
    const boundaryResult = this.sobelDetector.detectBoundaries(imageData);

    // Step 2: Extract closed contours
    const closedPaths = this.contourExtractor.extractClosedPaths(
      boundaryResult.boundaries,
      boundaryResult.width,
      boundaryResult.height
    );

    // Step 3: Create unified masks
    const masks = this.agentPartitioner.computeUnifiedMasks(
      new Map(), // Empty agents map for initial processing
      boundaryResult.width,
      boundaryResult.height
    );

    this.frameCount++;
    this.lastBoundaries = closedPaths;

    return {
      boundaries: closedPaths,
      masks: masks,
      sobelData: boundaryResult,
      frameCount: this.frameCount
    };
  }

  /**
   * Get last processed boundaries
   */
  getLastBoundaries() {
    return this.lastBoundaries;
  }
}

class UnifiedPerceptionLoop {
  /**
   * Complete spatiotemporal perception loop with memory and frame relativity
   */
  constructor(options = {}) {
    // Core components
    this.perception = new PerceptionPipeline(options.perception || {});
    this.memoryField = new MemoryField(
      options.frustumBounds || {left: 0, top: 0, right: 640, bottom: 480},
      options.memory || {}
    );

    // Agent registry
    this.agents = new Map(); // active agents on screen
    this.frameCount = 0;
    this.currentTime = performance.now();

    // Lifecycle tracking
    this.lifecycleEvents = {
      splits: 0,
      merges: 0,
      spawns: 0,
      deaths: 0
    };

    // Statistics
    this.stats = {
      framesProcessed: 0,
      agentsCreated: 0,
      agentsLost: 0,
      reidentifications: 0,
      averageProcessingTime: 0
    };
  }

  /**
   * Main perception loop: video frame → agents with spatiotemporal continuity
   */
  processFrame(imageData) {
    const startTime = performance.now();

    // Step 1: Extract boundaries using Sobel + contour detection
    const perceptionResult = this.perception.processFrame(imageData);

    // Step 2: Update guardian states for existing agents
    for (const [agentId, agent] of this.agents) {
      agent.updateGuardianState(this.memoryField.frustumBounds);
    }

    // Step 3: Process lifecycle operations
    this.processLifecycleOperations();

    // Step 5: Process each detected boundary
    const processedBoundaries = [];
    const newAgents = [];

    for (const boundary of perceptionResult.boundaries) {
      let agent = null;

      // Try re-identification from memory field
      const remembered = this.memoryField.tryReidentify({
        boundary_env: boundary,
        centroid: this.computeCentroid(boundary),
        phase: new PhaseState() // Basic phase for now
      });

      if (remembered) {
        // Update existing agent with new boundary
        remembered.updateBoundary(boundary);
        this.agents.set(remembered.id, remembered);
        agent = remembered;
        this.stats.reidentifications++;
      } else {
        // Create new agent with coordinate frame
        agent = new Agent({
          boundary: boundary,
          frame: FrameSystem.computeAgentFrame({boundary_env: boundary, centroid: this.computeCentroid(boundary)}),
          birthTime: performance.now(),
          frustumBounds: this.memoryField.frustumBounds
        });
        this.agents.set(agent.id, agent);
        newAgents.push(agent);
        this.stats.agentsCreated++;
      }

      processedBoundaries.push(agent);
    }

    // Step 3: Check for agents leaving frustum and store in memory
    const leavingAgents = [];
    for (const [agentId, agent] of this.agents) {
      if (agent.isLeavingFrustum(this.memoryField.frustumBounds)) {
        this.memoryField.storeAgent(agent);
        leavingAgents.push(agentId);
        this.stats.agentsLost++;
      }
    }

    // Remove leaving agents from active set
    for (const agentId of leavingAgents) {
      this.agents.delete(agentId);
    }

    // Step 4: Update memory field (decay, cleanup)
    this.memoryField.update();

    // Step 5: Update statistics
    const processingTime = performance.now() - startTime;
    this.stats.framesProcessed++;
    this.stats.averageProcessingTime =
      (this.stats.averageProcessingTime * (this.stats.framesProcessed - 1) + processingTime) /
      this.stats.framesProcessed;

    this.frameCount++;
    this.currentTime = performance.now();

    return {
      agents: this.agents,
      newAgents: newAgents,
      leavingAgents: leavingAgents,
      boundaries: processedBoundaries,
      perception: perceptionResult,
      memoryStats: this.memoryField.getStats(),
      processingTime: processingTime
    };
  }

  /**
   * Compute centroid of boundary points
   */
  computeCentroid(boundary) {
    if (!boundary || boundary.length === 0) return [0, 0];

    let x = 0, y = 0;
    for (const point of boundary) {
      x += point[0];
      y += point[1];
    }

    return [x / boundary.length, y / boundary.length];
  }

  /**
   * Process lifecycle operations (split, merge, spawn)
   */
  processLifecycleOperations() {
    const agentsToAdd = [];
    const agentsToRemove = [];

    // Check for splitting
    for (const [agentId, agent] of this.agents) {
      if (agent.shouldSplit()) {
        const children = agent.split();
        if (children) {
          agentsToRemove.push(agentId);
          agentsToAdd.push(...children);
          this.lifecycleEvents.splits++;
          console.log(`🔀 Agent ${agentId} split into ${children.length} children`);
        }
      }
    }

    // Check for spawning
    for (const [agentId, agent] of this.agents) {
      if (agent.shouldSpawn()) {
        const child = agent.spawn();
        if (child) {
          agentsToAdd.push(child);
          this.lifecycleEvents.spawns++;
          console.log(`🌱 Agent ${agentId} spawned child ${child.id}`);
        }
      }
    }

    // Check for merging (simplified: check pairs)
    const agentList = Array.from(this.agents.values());
    for (let i = 0; i < agentList.length; i++) {
      for (let j = i + 1; j < agentList.length; j++) {
        const agentA = agentList[i];
        const agentB = agentList[j];

        if (agentA.canMergeWith(agentB)) {
          const merged = agentA.mergeWith(agentB);
          if (merged) {
            agentsToRemove.push(agentA.id, agentB.id);
            agentsToAdd.push(merged);
            this.lifecycleEvents.merges++;
            console.log(`🔗 Agents ${agentA.id} and ${agentB.id} merged into ${merged.id}`);
            break; // Only merge one pair per frame
          }
        }
      }
    }

    // Apply lifecycle changes
    for (const agentId of agentsToRemove) {
      this.agents.delete(agentId);
    }

    for (const newAgent of agentsToAdd) {
      this.agents.set(newAgent.id, newAgent);
    }
  }

  /**
   * Get current system state
   */
  getSystemState() {
    return {
      activeAgents: this.agents.size,
      memoryAgents: this.memoryField.memoryBuffer.size,
      frameCount: this.frameCount,
      lifecycle: this.lifecycleEvents,
      stats: {...this.stats, ...this.memoryField.getStats()},
      agents: Array.from(this.agents.values()).map(agent => ({
        id: agent.id,
        centroid: agent.centroid,
        age: agent.age,
        antAge: agent.antclock.antAge,
        stability: agent.boundaryStability,
        coherence: agent.frameCoherence,
        guardianState: agent.guardianState,
        modulatedParams: agent.modulatedParams
      }))
    };
  }

  /**
   * Reset the system
   */
  reset() {
    this.agents.clear();
    this.memoryField = new MemoryField(this.memoryField.frustumBounds);
    this.frameCount = 0;
    this.currentTime = performance.now();
    this.stats = {
      framesProcessed: 0,
      agentsCreated: 0,
      agentsLost: 0,
      reidentifications: 0,
      averageProcessingTime: 0
    };
  }
}

// Visualization helpers for the perception loop
class PerceptionVisualizer {
  /**
   * Visualize perception results with memory fields and coordinate frames
   */
  constructor(svgElement) {
    this.svg = svgElement;
    this.width = 800;
    this.height = 600;

    // Create main groups
    this.frustumGroup = this.createGroup('frustum');
    this.activeAgentsGroup = this.createGroup('active-agents');
    this.memoryFieldGroup = this.createGroup('memory-field');
    this.coordinateFramesGroup = this.createGroup('coordinate-frames');
    this.statsGroup = this.createGroup('stats');
  }

  createGroup(id) {
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.id = id;
    this.svg.appendChild(group);
    return group;
  }

  /**
   * Update visualization with perception results
   */
  update(perceptionResult) {
    this.clear();

    // Draw frustum bounds
    this.drawFrustum(perceptionResult.memoryField.frustumBounds);

    // Draw active agents
    this.drawActiveAgents(perceptionResult.agents);

    // Draw memory field ghosts
    this.drawMemoryField(perceptionResult.memoryField);

    // Draw coordinate frames
    this.drawCoordinateFrames(perceptionResult.agents);

    // Draw statistics
    this.drawStats(perceptionResult.stats);
  }

  clear() {
    [this.frustumGroup, this.activeAgentsGroup, this.memoryFieldGroup,
     this.coordinateFramesGroup, this.statsGroup].forEach(group => {
      while (group.firstChild) {
        group.removeChild(group.firstChild);
      }
    });
  }

  drawFrustum(bounds) {
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', bounds.left);
    rect.setAttribute('y', bounds.top);
    rect.setAttribute('width', bounds.right - bounds.left);
    rect.setAttribute('height', bounds.bottom - bounds.top);
    rect.setAttribute('fill', 'none');
    rect.setAttribute('stroke', '#333');
    rect.setAttribute('stroke-width', '2');
    rect.setAttribute('stroke-dasharray', '5,5');
    this.frustumGroup.appendChild(rect);
  }

  drawActiveAgents(agents) {
    for (const [agentId, agent] of agents) {
      // Agent boundary
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', agent.getBoundaryPath());
      path.setAttribute('fill', 'rgba(0, 255, 0, 0.3)');
      path.setAttribute('stroke', '#00ff00');
      path.setAttribute('stroke-width', '2');
      this.activeAgentsGroup.appendChild(path);

      // Agent centroid with guardian state
      const centroid = agent.centroid;
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', centroid[0]);
      circle.setAttribute('cy', centroid[1]);
      circle.setAttribute('r', '5');
      circle.setAttribute('fill', `hsl(${120 * agent.guardianState}, 80%, 50%)`);
      circle.setAttribute('stroke', '#00ff00');
      circle.setAttribute('stroke-width', '2');
      circle.setAttribute('opacity', agent.guardianState);
      this.activeAgentsGroup.appendChild(circle);

      // Guardian state indicator
      const guardianIndicator = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      guardianIndicator.setAttribute('cx', centroid[0] + 15);
      guardianIndicator.setAttribute('cy', centroid[1]);
      guardianIndicator.setAttribute('r', Math.max(2, agent.guardianState * 8));
      guardianIndicator.setAttribute('fill', `hsl(${120 * agent.guardianState}, 100%, 70%)`);
      guardianIndicator.setAttribute('stroke', 'none');
      this.activeAgentsGroup.appendChild(guardianIndicator);

      // Trajectory
      if (agent.trajectory.length > 1) {
        const trajPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        trajPath.setAttribute('d', agent.getTrajectoryPath());
        trajPath.setAttribute('stroke', '#008800');
        trajPath.setAttribute('stroke-width', '1');
        trajPath.setAttribute('fill', 'none');
        trajPath.setAttribute('opacity', '0.7');
        this.activeAgentsGroup.appendChild(trajPath);
      }
    }
  }

  drawMemoryField(memoryField) {
    // Draw predictive field as contours
    const fieldStrength = 20; // Sample every 20 pixels

    for (let x = 0; x < this.width; x += fieldStrength) {
      for (let y = 0; y < this.height; y += fieldStrength) {
        const potential = memoryField.predictiveField.potentialAt([x, y]);

        if (potential > 0.1) { // Only show significant potentials
          const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          circle.setAttribute('cx', x);
          circle.setAttribute('cy', y);
          circle.setAttribute('r', potential * 10);
          circle.setAttribute('fill', `rgba(255, 255, 0, ${potential * 0.5})`);
          circle.setAttribute('stroke', 'none');
          this.memoryFieldGroup.appendChild(circle);
        }
      }
    }

    // Draw memory ghosts
    for (const [signature, memory] of memoryField.memoryBuffer) {
      const predictedPos = memory.predictedTrajectory[0] || memory.exitBoundary[0];
      if (!predictedPos) continue;

      const ghost = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      ghost.setAttribute('cx', predictedPos[0]);
      ghost.setAttribute('cy', predictedPos[1]);
      ghost.setAttribute('r', '8');
      ghost.setAttribute('fill', 'none');
      ghost.setAttribute('stroke', '#ff6b6b');
      ghost.setAttribute('stroke-width', '2');
      ghost.setAttribute('stroke-dasharray', '3,3');
      ghost.setAttribute('opacity', memory.confidence);
      this.memoryFieldGroup.appendChild(ghost);
    }
  }

  drawCoordinateFrames(agents) {
    for (const [agentId, agent] of agents) {
      const frame = agent.localFrame;
      const origin = frame.origin;
      const basis = frame.basis;

      // Environment axes (static)
      const envAxes = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      envAxes.setAttribute('transform', `translate(${origin[0]}, ${origin[1]})`);

      const envXAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      envXAxis.setAttribute('x1', '0');
      envXAxis.setAttribute('y1', '0');
      envXAxis.setAttribute('x2', '30');
      envXAxis.setAttribute('y2', '0');
      envXAxis.setAttribute('stroke', '#666');
      envXAxis.setAttribute('stroke-width', '2');
      envAxes.appendChild(envXAxis);

      const envYAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      envYAxis.setAttribute('x1', '0');
      envYAxis.setAttribute('y1', '0');
      envYAxis.setAttribute('x2', '0');
      envYAxis.setAttribute('y2', '30');
      envYAxis.setAttribute('stroke', '#666');
      envYAxis.setAttribute('stroke-width', '2');
      envAxes.appendChild(envYAxis);

      // Agent axes (rotated)
      const agentAxes = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      agentAxes.setAttribute('transform', `translate(${origin[0]}, ${origin[1]}) rotate(${(frame.env_to_agent.rotation || 0) * 180 / Math.PI})`);

      const agentXAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      agentXAxis.setAttribute('x1', '0');
      agentXAxis.setAttribute('y1', '0');
      agentXAxis.setAttribute('x2', '20');
      agentXAxis.setAttribute('y2', '0');
      agentXAxis.setAttribute('stroke', '#00ffff');
      agentXAxis.setAttribute('stroke-width', '2');
      agentAxes.appendChild(agentXAxis);

      const agentYAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      agentYAxis.setAttribute('x1', '0');
      agentYAxis.setAttribute('y1', '0');
      agentYAxis.setAttribute('x2', '0');
      agentYAxis.setAttribute('y2', '20');
      agentYAxis.setAttribute('stroke', '#ff0080');
      agentYAxis.setAttribute('stroke-width', '2');
      agentAxes.appendChild(agentYAxis);

      this.coordinateFramesGroup.appendChild(envAxes);
      this.coordinateFramesGroup.appendChild(agentAxes);
    }
  }

  drawStats(stats) {
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', '20');
    text.setAttribute('y', '30');
    text.setAttribute('font-family', 'monospace');
    text.setAttribute('font-size', '12');
    text.setAttribute('fill', '#fff');

    const lines = [
      `Frame: ${stats.framesProcessed}`,
      `Active: ${stats.activeAgents || 0}`,
      `Memory: ${stats.memoryAgents || 0}`,
      `Created: ${stats.agentsCreated}`,
      `Lost: ${stats.agentsLost}`,
      `Re-ID: ${stats.reidentifications}`,
      `Proc: ${(stats.averageProcessingTime || 0).toFixed(1)}ms`
    ];

    text.textContent = lines.join('\n');
    this.statsGroup.appendChild(text);
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    SobelDetector,
    ContourExtractor,
    AgentPartitioner,
    PerceptionPipeline,
    UnifiedPerceptionLoop,
    PerceptionVisualizer
  };
}
