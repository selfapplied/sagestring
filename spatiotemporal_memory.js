/**
 * Spatiotemporal Continuity System
 *
 * Implements memory fields and frame relativity for persistent visual agents
 * that maintain identity beyond the frustum through predictive trajectories
 * and coordinate transformations.
 */

class MemoryField {
  /**
   * Memory buffer that stores agent states when they leave frustum
   * Maintains predictive fields for re-entry trajectories
   */
  constructor(frustumBounds, options = {}) {
    this.frustumBounds = frustumBounds;
    this.memoryBuffer = new Map(); // key: agentSignature → memoryEntry
    this.predictiveField = new PotentialField();

    // Configuration
    this.reidentificationThreshold = options.reidentificationThreshold || 0.75;
    this.memoryDecayRate = options.memoryDecayRate || 0.95;
    this.maxMemoryAge = options.maxMemoryAge || 1000; // frames
    this.antclockSlowRate = options.antclockSlowRate || 0.5;

    // Statistics
    this.stats = {
      totalStored: 0,
      totalReidentified: 0,
      reidentificationSuccess: 0,
      averageMemoryAge: 0,
      predictiveAccuracy: 0
    };
  }

  /**
   * Store agent when it leaves frustum
   */
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
    this.stats.totalStored++;

    // Add to predictive field
    this.predictiveField.addSource(
      agent.centroid,
      agent.phase,
      agent.velocity || [0, 0]
    );

    console.log(`📚 Stored agent ${agent.id} in memory (signature: ${signature})`);
  }

  /**
   * Try to re-identify a new agent with stored memories
   */
  tryReidentify(newAgent) {
    const candidates = this.findMemoryCandidates(newAgent);

    for (const [signature, memory] of candidates) {
      memory.reidentificationAttempts++;

      const matchScore = this.computeMatchScore(newAgent, memory);

      if (matchScore > this.reidentificationThreshold) {
        // Rehydrate the remembered agent
        const rehydrated = Agent.rehydrate(
          memory.agentState,
          newAgent.boundary_env,
          performance.now() - memory.exitTime
        );

        // Update antclock: age from memory + on-screen age
        const timeDiff = performance.now() - memory.exitTime;
        rehydrated.age += memory.antclockRate * (timeDiff / 16.67); // frames

        // Update statistics
        this.stats.totalReidentified++;
        this.stats.reidentificationSuccess =
          this.stats.totalReidentified / this.stats.totalStored;

        this.memoryBuffer.delete(signature);
        this.predictiveField.removeSource(signature);

        console.log(`🔄 Re-identified agent ${rehydrated.id} (score: ${matchScore.toFixed(3)})`);
        return rehydrated;
      }
    }

    return null; // No match found
  }

  /**
   * Compute signature for agent identification
   */
  computeSignature(agent) {
    // Use boundary shape, centroid, and phase as signature
    const centroid = agent.centroid;
    const boundaryHash = this.hashBoundary(agent.boundary_env);
    const phaseHash = Math.round(agent.phase.value * 1000);

    return `${boundaryHash}_${Math.round(centroid[0])}_${Math.round(centroid[1])}_${phaseHash}`;
  }

  /**
   * Simple boundary hash for identification
   */
  hashBoundary(boundary) {
    if (!boundary || boundary.length === 0) return 0;

    let hash = 0;
    const step = Math.max(1, Math.floor(boundary.length / 16)); // Sample 16 points

    for (let i = 0; i < boundary.length; i += step) {
      const point = boundary[i];
      hash = ((hash << 5) - hash) + Math.round(point[0] * 100) + Math.round(point[1] * 100);
    }

    return Math.abs(hash) % 10000; // Keep reasonable size
  }

  /**
   * Compute agent velocity from trajectory
   */
  computeVelocity(agent) {
    if (!agent.trajectory || agent.trajectory.length < 2) {
      return [0, 0];
    }

    const recent = agent.trajectory.slice(-2);
    const prev = recent[0].boundary[0]; // Use first boundary point
    const curr = recent[1].boundary[0];

    const dx = curr[0] - prev[0];
    const dy = curr[1] - prev[1];

    return [dx, dy];
  }

  /**
   * Predict trajectory for off-screen agent
   */
  predictTrajectory(agent) {
    const velocity = this.computeVelocity(agent);
    const centroid = agent.centroid;

    // Simple linear prediction with damping
    const predictions = [];
    let x = centroid[0];
    let y = centroid[1];
    let vx = velocity[0];
    let vy = velocity[1];

    for (let i = 0; i < 10; i++) { // Predict 10 frames ahead
      x += vx;
      y += vy;
      vx *= 0.95; // Damping
      vy *= 0.95;

      predictions.push([x, y]);
    }

    return predictions;
  }

  /**
   * Find memory candidates that could match new agent
   */
  findMemoryCandidates(newAgent) {
    const candidates = [];
    const newCentroid = newAgent.centroid;
    const newBoundary = newAgent.boundary_env;

    for (const [signature, memory] of this.memoryBuffer) {
      // Check if predicted position is near frustum edge
      const predictedPos = memory.predictedTrajectory[0]; // Next predicted position
      if (!predictedPos) continue;

      const distance = Math.sqrt(
        Math.pow(predictedPos[0] - newCentroid[0], 2) +
        Math.pow(predictedPos[1] - newCentroid[1], 2)
      );

      // Only consider if within reasonable distance
      if (distance < 100) {
        candidates.push([signature, memory]);
      }
    }

    return candidates;
  }

  /**
   * Compute match score between new agent and memory
   */
  computeMatchScore(newAgent, memory) {
    let score = 0;
    let totalWeight = 0;

    // Boundary shape similarity (40% weight)
    const boundarySimilarity = this.computeBoundarySimilarity(
      newAgent.boundary_env,
      memory.exitBoundary
    );
    score += boundarySimilarity * 0.4;
    totalWeight += 0.4;

    // Centroid proximity to predicted position (30% weight)
    const predictedPos = memory.predictedTrajectory[0] || memory.exitBoundary[0];
    const centroidDistance = Math.sqrt(
      Math.pow(newAgent.centroid[0] - predictedPos[0], 2) +
      Math.pow(newAgent.centroid[1] - predictedPos[1], 2)
    );
    const proximityScore = Math.max(0, 1 - centroidDistance / 200); // Normalize
    score += proximityScore * 0.3;
    totalWeight += 0.3;

    // Phase coherence (20% weight)
    const phaseDiff = Math.abs(newAgent.phase.coherence() - memory.phaseCoherence);
    const phaseScore = Math.max(0, 1 - phaseDiff);
    score += phaseScore * 0.2;
    totalWeight += 0.2;

    // Memory confidence decay (10% weight)
    const age = performance.now() - memory.exitTime;
    const confidenceScore = memory.confidence * Math.pow(this.memoryDecayRate, age / 1000);
    score += confidenceScore * 0.1;
    totalWeight += 0.1;

    return totalWeight > 0 ? score / totalWeight : 0;
  }

  /**
   * Compute boundary shape similarity
   */
  computeBoundarySimilarity(boundary1, boundary2) {
    if (!boundary1 || !boundary2 || boundary1.length === 0 || boundary2.length === 0) {
      return 0;
    }

    // Simple area and perimeter comparison
    const area1 = this.computePolygonArea(boundary1);
    const area2 = this.computePolygonArea(boundary2);
    const areaRatio = Math.min(area1, area2) / Math.max(area1, area2);

    const perimeter1 = this.computePolygonPerimeter(boundary1);
    const perimeter2 = this.computePolygonPerimeter(boundary2);
    const perimeterRatio = Math.min(perimeter1, perimeter2) / Math.max(perimeter1, perimeter2);

    return (areaRatio + perimeterRatio) / 2;
  }

  /**
   * Compute polygon area using shoelace formula
   */
  computePolygonArea(points) {
    let area = 0;
    const n = points.length;

    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      area += points[i][0] * points[j][1];
      area -= points[j][0] * points[i][1];
    }

    return Math.abs(area) / 2;
  }

  /**
   * Compute polygon perimeter
   */
  computePolygonPerimeter(points) {
    let perimeter = 0;
    const n = points.length;

    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      const dx = points[j][0] - points[i][0];
      const dy = points[j][1] - points[i][1];
      perimeter += Math.sqrt(dx * dx + dy * dy);
    }

    return perimeter;
  }

  /**
   * Update memory field (decay confidence, remove old entries)
   */
  update() {
    const now = performance.now();
    const toDelete = [];

    for (const [signature, memory] of this.memoryBuffer) {
      const age = now - memory.exitTime;

      // Decay confidence
      memory.confidence *= Math.pow(this.memoryDecayRate, 1/60); // Per frame decay

      // Mark for deletion if too old or confidence too low
      if (age > this.maxMemoryAge || memory.confidence < 0.1) {
        toDelete.push(signature);
      }

      memory.lastUpdate = now;
    }

    // Remove expired memories
    for (const signature of toDelete) {
      this.memoryBuffer.delete(signature);
      this.predictiveField.removeSource(signature);
    }
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      ...this.stats,
      activeMemories: this.memoryBuffer.size,
      averageConfidence: Array.from(this.memoryBuffer.values())
        .reduce((sum, mem) => sum + mem.confidence, 0) / Math.max(1, this.memoryBuffer.size)
    };
  }
}

class PotentialField {
  /**
   * Predictive field for off-screen agent motion
   */
  constructor() {
    this.sources = new Map(); // signature → {position, phase, velocity, strength}
  }

  addSource(position, phase, velocity, strength = 1.0) {
    this.sources.set(performance.now().toString(), {
      position: position.slice(),
      phase: phase,
      velocity: velocity.slice(),
      strength: strength,
      created: performance.now()
    });
  }

  removeSource(signature) {
    this.sources.delete(signature);
  }

  /**
   * Compute field potential at a point
   */
  potentialAt(point) {
    let totalPotential = 0;

    for (const [id, source] of this.sources) {
      const dx = point[0] - source.position[0];
      const dy = point[1] - source.position[1];
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > 0) {
        // Inverse square law with velocity direction bias
        const potential = source.strength / (distance * distance + 1);

        // Add directional component based on velocity
        const velMag = Math.sqrt(source.velocity[0] * source.velocity[0] + source.velocity[1] * source.velocity[1]);
        if (velMag > 0) {
          const dotProduct = (dx * source.velocity[0] + dy * source.velocity[1]) / (distance * velMag);
          totalPotential += potential * (1 + 0.5 * dotProduct); // Boost in velocity direction
        } else {
          totalPotential += potential;
        }
      }
    }

    return totalPotential;
  }

  /**
   * Get field gradient (direction of strongest attraction)
   */
  gradientAt(point) {
    const epsilon = 1.0;
    const p0 = this.potentialAt(point);

    const px = this.potentialAt([point[0] + epsilon, point[1]]);
    const py = this.potentialAt([point[0], point[1] + epsilon]);

    return [(px - p0) / epsilon, (py - p0) / epsilon];
  }
}

class FrameSystem {
  /**
   * Coordinate frame transformations between environment and agent frames
   * Environment frame: camera/global space
   * Agent frame: local coordinate system centered on agent
   */

  // Global environment frame (camera space)
  static environmentFrame = {
    origin: [0, 0],
    basis: [[1, 0], [0, 1]], // Orthonormal basis
    time: 0
  };

  /**
   * Compute agent-local coordinate frame
   */
  static computeAgentFrame(agent, environment = FrameSystem.environmentFrame) {
    const agentOrigin = agent.centroid.slice();
    const principalAxis = this.computePrincipalAxis(agent.boundary_env);
    const agentBasis = this.gramSchmidt([principalAxis, this.orthogonal(principalAxis)]);

    // Transformation matrix: environment → agent frame
    const T_env_to_agent = {
      translation: agentOrigin,
      rotation: this.basisAngle(environment.basis, agentBasis),
      scale: this.computeBoundaryScale(agent.boundary_env),
      phaseShift: agent.phase ? agent.phase.value : 0,
      timestamp: performance.now()
    };

    // Inverse: agent → environment
    const T_agent_to_env = this.invertTransformation(T_env_to_agent);

    return {
      id: agent.id,
      origin: agentOrigin,
      basis: agentBasis,
      env_to_agent: T_env_to_agent,
      agent_to_env: T_agent_to_env,
      phaseLock: agent.phase ? agent.phase.coherence() : 0,
      coherence: this.computeFrameCoherence(agent, T_env_to_agent)
    };
  }

  /**
   * Compute principal axis of boundary (direction of maximum variance)
   */
  static computePrincipalAxis(boundary) {
    if (!boundary || boundary.length < 3) return [1, 0];

    // Compute covariance matrix
    const centroid = this.computeCentroid(boundary);
    let xx = 0, xy = 0, yy = 0;

    for (const point of boundary) {
      const dx = point[0] - centroid[0];
      const dy = point[1] - centroid[1];
      xx += dx * dx;
      xy += dx * dy;
      yy += dy * dy;
    }

    const n = boundary.length;
    xx /= n;
    xy /= n;
    yy /= n;

    // Eigenvector for largest eigenvalue
    const trace = xx + yy;
    const det = xx * yy - xy * xy;

    // Characteristic equation: λ² - trace*λ + det = 0
    const discriminant = trace * trace - 4 * det;
    const lambda1 = (trace + Math.sqrt(Math.max(0, discriminant))) / 2;

    // Eigenvector corresponding to lambda1
    if (Math.abs(xy) < 1e-10) {
      // Axis-aligned case
      return xx > yy ? [1, 0] : [0, 1];
    } else {
      const vx = lambda1 - yy;
      const vy = xy;
      const mag = Math.sqrt(vx * vx + vy * vy);
      return mag > 0 ? [vx / mag, vy / mag] : [1, 0];
    }
  }

  /**
   * Gram-Schmidt orthogonalization
   */
  static gramSchmidt(vectors) {
    const result = [];
    for (let i = 0; i < vectors.length; i++) {
      let v = vectors[i].slice();

      // Subtract projections onto previous vectors
      for (let j = 0; j < i; j++) {
        const proj = this.dot(v, result[j]);
        v[0] -= proj * result[j][0];
        v[1] -= proj * result[j][1];
      }

      // Normalize
      const mag = Math.sqrt(v[0] * v[0] + v[1] * v[1]);
      if (mag > 1e-10) {
        v[0] /= mag;
        v[1] /= mag;
      } else {
        v = i === 0 ? [1, 0] : [0, 1]; // Fallback
      }

      result.push(v);
    }

    return result;
  }

  /**
   * Compute orthogonal vector
   */
  static orthogonal(v) {
    return [-v[1], v[0]]; // 90-degree rotation
  }

  /**
   * Dot product
   */
  static dot(a, b) {
    return a[0] * b[0] + a[1] * b[1];
  }

  /**
   * Compute angle between two basis vectors
   */
  static basisAngle(basis1, basis2) {
    if (!basis1 || !basis2 || basis1.length === 0 || basis2.length === 0) return 0;

    // Use first basis vector
    const v1 = basis1[0];
    const v2 = basis2[0];

    const dot = this.dot(v1, v2);
    const cross = v1[0] * v2[1] - v1[1] * v2[0];

    return Math.atan2(cross, dot);
  }

  /**
   * Compute boundary scale factor
   */
  static computeBoundaryScale(boundary) {
    if (!boundary || boundary.length < 3) return 1.0;

    const centroid = this.computeCentroid(boundary);
    let maxDist = 0;

    for (const point of boundary) {
      const dist = Math.sqrt(
        Math.pow(point[0] - centroid[0], 2) +
        Math.pow(point[1] - centroid[1], 2)
      );
      maxDist = Math.max(maxDist, dist);
    }

    return maxDist > 0 ? maxDist : 1.0;
  }

  /**
   * Compute centroid of boundary points
   */
  static computeCentroid(points) {
    if (!points || points.length === 0) return [0, 0];

    let x = 0, y = 0;
    for (const point of points) {
      x += point[0];
      y += point[1];
    }

    return [x / points.length, y / points.length];
  }

  /**
   * Invert transformation matrix
   */
  static invertTransformation(T) {
    return {
      translation: [-T.translation[0], -T.translation[1]],
      rotation: -T.rotation,
      scale: 1 / (T.scale || 1),
      phaseShift: -T.phaseShift,
      timestamp: T.timestamp
    };
  }

  /**
   * Transform boundary between frames
   */
  static transformBoundary(boundaryPoints, transformation) {
    if (!boundaryPoints || boundaryPoints.length === 0) return [];

    return boundaryPoints.map(point => {
      // Apply rotation, translation, scaling
      const rotated = this.rotate(point, transformation.rotation);
      const scaled = this.scale(rotated, transformation.scale || 1);
      const translated = this.translate(scaled, transformation.translation);

      // Phase modulation (nonlinear twist)
      return this.applyPhaseTwist(translated, transformation.phaseShift || 0);
    });
  }

  /**
   * Rotate point around origin
   */
  static rotate(point, angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    return [
      point[0] * cos - point[1] * sin,
      point[0] * sin + point[1] * cos
    ];
  }

  /**
   * Scale point
   */
  static scale(point, factor) {
    return [point[0] * factor, point[1] * factor];
  }

  /**
   * Translate point
   */
  static translate(point, offset) {
    return [point[0] + offset[0], point[1] + offset[1]];
  }

  /**
   * Apply phase twist (nonlinear deformation)
   */
  static applyPhaseTwist(point, phaseShift) {
    if (Math.abs(phaseShift) < 1e-10) return point;

    const r = Math.sqrt(point[0] * point[0] + point[1] * point[1]);
    const theta = Math.atan2(point[1], point[0]);

    // Phase-modulated radius
    const twistedTheta = theta + phaseShift * Math.sin(r * 0.1);

    return [
      r * Math.cos(twistedTheta),
      r * Math.sin(twistedTheta)
    ];
  }

  /**
   * Compute frame coherence (how well the frame fits the agent)
   */
  static computeFrameCoherence(agent, transformation) {
    if (!agent.boundary_env || agent.boundary_env.length < 3) return 0;

    // Transform boundary to local frame and measure alignment
    const localBoundary = this.transformBoundary(agent.boundary_env, transformation);

    // Compute how circular/aligned the local boundary is
    const centroid = this.computeCentroid(localBoundary);
    let variance = 0;

    for (const point of localBoundary) {
      const dist = Math.sqrt(
        Math.pow(point[0] - centroid[0], 2) +
        Math.pow(point[1] - centroid[1], 2)
      );
      variance += dist * dist;
    }

    variance /= localBoundary.length;

    // Lower variance = higher coherence (more circular/aligned)
    return Math.max(0, 1 - variance / 1000); // Normalize
  }

  /**
   * Transform point between frames
   */
  static transformPoint(point, transformation) {
    return this.transformBoundary([point], transformation)[0];
  }

  /**
   * Update agent frame (called when agent moves)
   */
  static updateAgentFrame(agent) {
    const newFrame = this.computeAgentFrame(agent);
    agent.localFrame = newFrame;
    agent.boundary_local = this.transformBoundary(agent.boundary_env, newFrame.env_to_agent);
    return newFrame;
  }
}

class Agent {
  /**
   * Enhanced agent with frame awareness, trajectory tracking, and spatiotemporal continuity
   */
  constructor(config) {
    this.id = config.id || this.generateId();
    this.boundary_env = config.boundary || []; // Closed path in environment coordinates
    this.phase = config.phase || new PhaseState();
    this.antclock = config.antclock || new Antclock(config.birthTime || performance.now());

    // Frame awareness
    this.localFrame = config.frame || FrameSystem.computeAgentFrame(this);
    this.boundary_local = FrameSystem.transformBoundary(
      this.boundary_env,
      this.localFrame.env_to_agent
    );

    // Trajectory memory (previous boundary/envFrame pairs)
    this.trajectory = config.trajectory || [];
    this.maxTrajectoryLength = 20; // Keep last 20 states

    // Motion tracking
    this.velocity = [0, 0];
    this.centroid = FrameSystem.computeCentroid(this.boundary_env);

    // Stability metrics
    this.boundaryStability = 1.0;
    this.frameCoherence = this.localFrame.coherence || 0;

    // Guardian consciousness state
    this.guardianState = this.computeGuardianState(config.frustumBounds);
    this.guardianHistory = [this.guardianState]; // Track consciousness over time
    this.maxGuardianHistory = 10;

    // Modulated parameters
    this.modulatedParams = this.computeModulatedParameters();

    // Metadata
    this.birthTime = config.birthTime || performance.now();
    this.lastUpdate = performance.now();
    this.persistence = 0; // How long this agent has been tracked
  }

  /**
   * Generate unique agent ID
   */
  generateId() {
    return 'agent_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  }

  /**
   * Get centroid (cached for performance)
   */
  get centroid() {
    if (!this._centroid) {
      this._centroid = FrameSystem.computeCentroid(this.boundary_env);
    }
    return this._centroid;
  }

  set centroid(value) {
    this._centroid = value;
  }

  /**
   * Serialize agent state for memory storage
   */
  serialize() {
    return {
      id: this.id,
      boundary_env: this.boundary_env.slice(),
      boundary_local: this.boundary_local.slice(),
      localFrame: {
        id: this.localFrame.id,
        origin: this.localFrame.origin.slice(),
        basis: this.localFrame.basis.map(v => v.slice()),
        env_to_agent: {...this.localFrame.env_to_agent},
        agent_to_env: {...this.localFrame.agent_to_env},
        phaseLock: this.localFrame.phaseLock,
        coherence: this.localFrame.coherence
      },
      phase: this.phase.serialize ? this.phase.serialize() : {value: this.phase.value},
      antclock: {
        value: this.antclock.value,
        age: this.antclock.age
      },
      trajectory: this.trajectory.slice(-5), // Keep last 5 states for rehydration
      velocity: this.velocity.slice(),
      centroid: this.centroid.slice(),
      birthTime: this.birthTime,
      persistence: this.persistence,
      frameCoherence: this.frameCoherence,
      boundaryStability: this.boundaryStability,
      guardianState: this.guardianState,
      guardianHistory: this.guardianHistory.slice(),
      modulatedParams: {...this.modulatedParams}
    };
  }

  /**
   * Rehydrate agent from serialized state
   */
  static rehydrate(serializedState, newBoundary, timeDiff) {
    const agent = new Agent({
      id: serializedState.id,
      boundary: newBoundary,
      birthTime: serializedState.birthTime,
      trajectory: serializedState.trajectory
    });

    // Restore phase state
    if (agent.phase && serializedState.phase) {
      agent.phase.value = serializedState.phase.value;
    }

    // Restore antclock (aged appropriately)
    if (agent.antclock && serializedState.antclock) {
      agent.antclock.value = serializedState.antclock.value;
      agent.antclock.age = serializedState.antclock.age + timeDiff;
    }

    // Restore other properties
    agent.velocity = serializedState.velocity || [0, 0];
    agent.persistence = serializedState.persistence || 0;
    agent.frameCoherence = serializedState.frameCoherence || 0;
    agent.boundaryStability = serializedState.boundaryStability || 1.0;

    return agent;
  }

  /**
   * Update agent with new boundary from perception
   */
  updateBoundary(newBoundary_env) {
    if (!newBoundary_env || newBoundary_env.length === 0) return;

    // Store previous state in trajectory
    this.trajectory.push({
      boundary: this.boundary_env.slice(),
      frame: {...this.localFrame},
      time: this.antclock.value,
      centroid: this.centroid.slice(),
      phase: this.phase.value
    });

    // Trim trajectory if too long
    if (this.trajectory.length > this.maxTrajectoryLength) {
      this.trajectory.shift();
    }

    // Update current state
    this.boundary_env = newBoundary_env.slice();
    this._centroid = null; // Invalidate centroid cache

    // Update frame (origin moves with centroid)
    this.localFrame = FrameSystem.updateAgentFrame(this);

    // Update motion tracking
    this.updateVelocity();

    // Update stability metrics
    this.updateStabilityMetrics();

    // Update antclock with modulated rate
    const modulatedStability = this.boundaryStability * this.modulatedParams.antclockRate;
    this.antclock.tick(modulatedStability);

    // Update metadata
    this.lastUpdate = performance.now();
    this.persistence += 1;
  }

  /**
   * Update velocity from trajectory
   */
  updateVelocity() {
    if (this.trajectory.length < 2) {
      this.velocity = [0, 0];
      return;
    }

    const prev = this.trajectory[this.trajectory.length - 2];
    const curr = this.trajectory[this.trajectory.length - 1];

    const dx = curr.centroid[0] - prev.centroid[0];
    const dy = curr.centroid[1] - prev.centroid[1];

    // Smooth velocity with previous velocity
    const alpha = 0.3; // Smoothing factor
    this.velocity[0] = alpha * dx + (1 - alpha) * this.velocity[0];
    this.velocity[1] = alpha * dy + (1 - alpha) * this.velocity[1];
  }

  /**
   * Update stability metrics
   */
  updateStabilityMetrics() {
    if (this.trajectory.length < 2) {
      this.boundaryStability = 1.0;
      return;
    }

    // Boundary stability: how similar current boundary is to previous
    const prevBoundary = this.trajectory[this.trajectory.length - 1].boundary;
    this.boundaryStability = this.computeBoundaryStability(this.boundary_env, prevBoundary);

    // Frame coherence from FrameSystem
    this.frameCoherence = this.localFrame.coherence || 0;
  }

  /**
   * Compute boundary stability (0-1, higher = more stable)
   */
  computeBoundaryStability(boundary1, boundary2) {
    if (!boundary1 || !boundary2 || boundary1.length !== boundary2.length) {
      return 0.5; // Neutral stability
    }

    let totalDistance = 0;
    const n = boundary1.length;

    for (let i = 0; i < n; i++) {
      const dx = boundary1[i][0] - boundary2[i][0];
      const dy = boundary1[i][1] - boundary2[i][1];
      totalDistance += Math.sqrt(dx * dx + dy * dy);
    }

    const avgDistance = totalDistance / n;

    // Convert to stability score (lower distance = higher stability)
    return Math.max(0, 1 - avgDistance / 50); // Normalize with 50px threshold
  }

  /**
   * Check if agent is leaving frustum
   */
  isLeavingFrustum(frustumBounds) {
    if (!frustumBounds) return false;

    const centroid = this.centroid;
    const margin = 50; // pixels from edge

    return (
      centroid[0] < frustumBounds.left + margin ||
      centroid[0] > frustumBounds.right - margin ||
      centroid[1] < frustumBounds.top + margin ||
      centroid[1] > frustumBounds.bottom - margin
    );
  }

  /**
   * Transform point from environment to local frame
   */
  transformToLocal(point_env) {
    return FrameSystem.transformPoint(point_env, this.localFrame.env_to_agent);
  }

  /**
   * Transform point from local to environment frame
   */
  transformToEnvironment(point_local) {
    return FrameSystem.transformPoint(point_local, this.localFrame.agent_to_env);
  }

  /**
   * Get age in frames since birth
   */
  get age() {
    return Math.floor((performance.now() - this.birthTime) / 16.67); // 60fps
  }

  /**
   * Compute guardian consciousness state
   */
  computeGuardianState(frustumBounds) {
    if (!frustumBounds || !this.boundary_env || this.boundary_env.length < 3) {
      return 0; // Fully asleep if no boundary or frustum
    }

    // Calculate intersection between boundary and frustum
    const intersectionLength = this.computeFrustumIntersection(frustumBounds);
    const boundaryLength = this.computeBoundaryLength(this.boundary_env);

    // Guardian equation: g_A = |∂A ∩ W| / (|∂A| + ε)
    const epsilon = 1e-6;
    const g_A = intersectionLength / (boundaryLength + epsilon);

    return Math.max(0, Math.min(1, g_A)); // Clamp to [0,1]
  }

  /**
   * Compute boundary-frustum intersection length
   */
  computeFrustumIntersection(frustumBounds) {
    if (!this.boundary_env || this.boundary_env.length < 3) return 0;

    let intersectionLength = 0;
    const points = this.boundary_env;

    // Simple line-frustum intersection
    for (let i = 0; i < points.length; i++) {
      const p1 = points[i];
      const p2 = points[(i + 1) % points.length];

      // Check if line segment p1->p2 intersects frustum
      if (this.lineIntersectsFrustum(p1, p2, frustumBounds)) {
        // Approximate intersection length
        const dx = p2[0] - p1[0];
        const dy = p2[1] - p1[1];
        const segmentLength = Math.sqrt(dx * dx + dy * dy);
        intersectionLength += segmentLength;
      }
    }

    return intersectionLength;
  }

  /**
   * Check if line segment intersects frustum rectangle
   */
  lineIntersectsFrustum(p1, p2, frustum) {
    // Cohen-Sutherland line clipping algorithm
    const INSIDE = 0;
    const LEFT = 1;
    const RIGHT = 2;
    const BOTTOM = 4;
    const TOP = 8;

    const computeOutCode = (x, y) => {
      let code = INSIDE;
      if (x < frustum.left) code |= LEFT;
      if (x > frustum.right) code |= RIGHT;
      if (y < frustum.top) code |= TOP;
      if (y > frustum.bottom) code |= BOTTOM;
      return code;
    };

    let outcode1 = computeOutCode(p1[0], p1[1]);
    let outcode2 = computeOutCode(p2[0], p2[1]);

    while (true) {
      if (!(outcode1 | outcode2)) {
        // Both points inside
        return true;
      } else if (outcode1 & outcode2) {
        // Both points outside same region
        return false;
      } else {
        // At least one point outside, clip
        let x, y;
        const outcodeOut = outcode1 ? outcode1 : outcode2;

        if (outcodeOut & TOP) {
          // Handle horizontal lines (p2[1] === p1[1]) - no intersection with top
          if (p2[1] === p1[1]) continue;
          x = p1[0] + (p2[0] - p1[0]) * (frustum.top - p1[1]) / (p2[1] - p1[1]);
          y = frustum.top;
        } else if (outcodeOut & BOTTOM) {
          // Handle horizontal lines (p2[1] === p1[1]) - no intersection with bottom
          if (p2[1] === p1[1]) continue;
          x = p1[0] + (p2[0] - p1[0]) * (frustum.bottom - p1[1]) / (p2[1] - p1[1]);
          y = frustum.bottom;
        } else if (outcodeOut & LEFT) {
          // Handle vertical lines (p2[0] === p1[0]) - no intersection with left
          if (p2[0] === p1[0]) continue;
          y = p1[1] + (p2[1] - p1[1]) * (frustum.left - p1[0]) / (p2[0] - p1[0]);
          x = frustum.left;
        } else if (outcodeOut & RIGHT) {
          // Handle vertical lines (p2[0] === p1[0]) - no intersection with right
          if (p2[0] === p1[0]) continue;
          y = p1[1] + (p2[1] - p1[1]) * (frustum.right - p1[0]) / (p2[0] - p1[0]);
          x = frustum.right;
        }

        if (outcodeOut === outcode1) {
          p1[0] = x;
          p1[1] = y;
          outcode1 = computeOutCode(p1[0], p1[1]);
        } else {
          p2[0] = x;
          p2[1] = y;
          outcode2 = computeOutCode(p2[0], p2[1]);
        }
      }
    }
  }

  /**
   * Compute total boundary length
   */
  computeBoundaryLength(boundary) {
    if (!boundary || boundary.length < 2) return 0;

    let length = 0;
    for (let i = 0; i < boundary.length; i++) {
      const p1 = boundary[i];
      const p2 = boundary[(i + 1) % boundary.length];
      const dx = p2[0] - p1[0];
      const dy = p2[1] - p1[1];
      length += Math.sqrt(dx * dx + dy * dy);
    }

    return length;
  }

  /**
   * Compute modulated parameters based on guardian state
   */
  computeModulatedParameters() {
    const g_A = this.guardianState;

    return {
      // Antclock rate: k1 + g_A * k2
      antclockRate: 0.1 + g_A * 0.5,

      // Bifurcation parameter: r0 + α * (1 - g_A)
      bifurcationParam: 2.5 + 1.2 * (1 - g_A),

      // Sobel threshold: τ0 - β * g_A
      sobelThreshold: 0.3 - 0.15 * g_A,

      // Complexity threshold for splitting: C_max * (1 + g_A)
      splitThreshold: 10.0 * (1 + g_A),

      // Spawn threshold: r_crit when g_A < g_threshold
      canSpawn: this.phase ? this.phase.value > 3.57 && g_A < 0.3 : false
    };
  }

  /**
   * Update guardian state and modulated parameters
   */
  updateGuardianState(frustumBounds) {
    const newGuardianState = this.computeGuardianState(frustumBounds);

    // Track guardian history
    this.guardianHistory.push(newGuardianState);
    if (this.guardianHistory.length > this.maxGuardianHistory) {
      this.guardianHistory.shift();
    }

    this.guardianState = newGuardianState;
    this.modulatedParams = this.computeModulatedParameters();
  }

  /**
   * Get trajectory as SVG path
   */
  getTrajectoryPath() {
    if (this.trajectory.length < 2) return '';

    let path = `M ${this.trajectory[0].centroid[0]} ${this.trajectory[0].centroid[1]}`;

    for (let i = 1; i < this.trajectory.length; i++) {
      const point = this.trajectory[i].centroid;
      path += ` L ${point[0]} ${point[1]}`;
    }

    return path;
  }

  /**
   * Get boundary as SVG path
   */
  getBoundaryPath() {
    if (!this.boundary_env || this.boundary_env.length < 3) return '';

    let path = `M ${this.boundary_env[0][0]} ${this.boundary_env[0][1]}`;

    for (let i = 1; i < this.boundary_env.length; i++) {
      path += ` L ${this.boundary_env[i][0]} ${this.boundary_env[i][1]}`;
    }

    path += ' Z'; // Close path
    return path;
  }

  /**
   * Check if agent should split (mitosis)
   */
  shouldSplit() {
    if (!this.boundary_env || this.boundary_env.length < 10) return false;

    const complexity = this.computeBoundaryComplexity();
    return complexity > this.modulatedParams.splitThreshold;
  }

  /**
   * Compute boundary complexity (rough measure of shape intricacy)
   */
  computeBoundaryComplexity() {
    if (!this.boundary_env || this.boundary_env.length < 3) return 0;

    // Measure total curvature variation
    let totalCurvature = 0;
    const n = this.boundary_env.length;

    for (let i = 0; i < n; i++) {
      const p0 = this.boundary_env[(i - 1 + n) % n];
      const p1 = this.boundary_env[i];
      const p2 = this.boundary_env[(i + 1) % n];

      // Compute angle at p1
      const v1 = [p1[0] - p0[0], p1[1] - p0[1]];
      const v2 = [p2[0] - p1[0], p2[1] - p1[1]];

      const mag1 = Math.sqrt(v1[0] * v1[0] + v1[1] * v1[1]);
      const mag2 = Math.sqrt(v2[0] * v2[0] + v2[1] * v2[1]);

      if (mag1 > 0 && mag2 > 0) {
        const cosAngle = (v1[0] * v2[0] + v1[1] * v2[1]) / (mag1 * mag2);
        const angle = Math.acos(Math.max(-1, Math.min(1, cosAngle)));
        totalCurvature += Math.abs(angle);
      }
    }

    return totalCurvature;
  }

  /**
   * Split agent into two children at point of maximum curvature
   */
  split() {
    if (!this.shouldSplit()) return null;

    const splitPoint = this.findMaxCurvaturePoint();
    const children = this.bisectAtPoint(splitPoint);

    return children;
  }

  /**
   * Find point of maximum curvature
   */
  findMaxCurvaturePoint() {
    if (!this.boundary_env || this.boundary_env.length < 3) return 0;

    let maxCurvature = 0;
    let maxIndex = 0;
    const n = this.boundary_env.length;

    for (let i = 0; i < n; i++) {
      const p0 = this.boundary_env[(i - 1 + n) % n];
      const p1 = this.boundary_env[i];
      const p2 = this.boundary_env[(i + 1) % n];

      const v1 = [p1[0] - p0[0], p1[1] - p0[1]];
      const v2 = [p2[0] - p1[0], p2[1] - p1[1]];

      const mag1 = Math.sqrt(v1[0] * v1[0] + v1[1] * v1[1]);
      const mag2 = Math.sqrt(v2[0] * v2[0] + v2[1] * v2[1]);

      if (mag1 > 0 && mag2 > 0) {
        const cosAngle = (v1[0] * v2[0] + v1[1] * v2[1]) / (mag1 * mag2);
        const angle = Math.acos(Math.max(-1, Math.min(1, cosAngle)));
        if (angle > maxCurvature) {
          maxCurvature = angle;
          maxIndex = i;
        }
      }
    }

    return maxIndex;
  }

  /**
   * Bisect boundary at given point and create two child agents
   */
  bisectAtPoint(splitIndex) {
    const boundary = this.boundary_env;
    const n = boundary.length;

    // Create two halves
    const half1 = [];
    const half2 = [];

    for (let i = 0; i < n; i++) {
      if (i <= splitIndex) {
        half1.push(boundary[i]);
      } else {
        half2.push(boundary[i]);
      }
    }

    // Ensure both halves have enough points
    if (half1.length < 5 || half2.length < 5) return null;

    // Create child agents
    const child1 = new Agent({
      boundary: half1,
      phase: this.phase ? new PhaseState(this.phase.value) : new PhaseState(),
      antclock: new Antclock(performance.now()),
      birthTime: performance.now()
    });

    const child2 = new Agent({
      boundary: half2,
      phase: this.phase ? new PhaseState(this.phase.value) : new PhaseState(),
      antclock: new Antclock(performance.now()),
      birthTime: performance.now()
    });

    // Copy phase state properties if phase exists
    if (this.phase) {
      child1.phase.drift = this.phase.drift;
      child1.phase.coherence = this.phase.coherence;
      child2.phase.drift = this.phase.drift;
      child2.phase.coherence = this.phase.coherence;
    }

    return [child1, child2];
  }

  /**
   * Check if this agent can merge with another
   */
  canMergeWith(otherAgent) {
    if (!otherAgent) return false;

    // Guardian coherence check
    const mutualAwareness = this.guardianState * otherAgent.guardianState;
    if (mutualAwareness < 0.1) return false;

    // Phase coherence check
    const phaseCoherence = this.computePhaseCoherence(otherAgent);
    const compatibility = mutualAwareness * phaseCoherence;

    return compatibility > 0.7; // Merge threshold
  }

  /**
   * Compute phase coherence with another agent
   */
  computePhaseCoherence(otherAgent) {
    if (!this.phase || !otherAgent.phase) return 0.5;

    const phaseDiff = Math.abs(this.phase.value - otherAgent.phase.value);
    const coherence = Math.max(0, 1 - phaseDiff / Math.PI);

    return coherence;
  }

  /**
   * Merge with another agent to form unified agent
   */
  mergeWith(otherAgent) {
    if (!this.canMergeWith(otherAgent)) return null;

    // Combine boundaries
    const combinedBoundary = this.combineBoundaries(otherAgent);

    // Create unified agent
    const unified = new Agent({
      boundary: combinedBoundary,
      phase: this.phase, // Keep primary agent's phase
      antclock: new Antclock(performance.now()),
      birthTime: performance.now()
    });

    return unified;
  }

  /**
   * Combine boundaries of two agents
   */
  combineBoundaries(otherAgent) {
    // Simple convex hull combination for now
    const allPoints = [...this.boundary_env, ...otherAgent.boundary_env];
    return this.computeConvexHull(allPoints);
  }

  /**
   * Compute convex hull using Graham scan
   */
  computeConvexHull(points) {
    if (points.length < 3) return points;

    // Find point with lowest y-coordinate
    let minY = Infinity;
    let minIndex = 0;

    for (let i = 0; i < points.length; i++) {
      if (points[i][1] < minY || (points[i][1] === minY && points[i][0] < points[minIndex][0])) {
        minY = points[i][1];
        minIndex = i;
      }
    }

    // Sort points by polar angle with min point
    const sortedPoints = points.slice().sort((a, b) => {
      const angleA = Math.atan2(a[1] - minY, a[0] - points[minIndex][0]);
      const angleB = Math.atan2(b[1] - minY, b[0] - points[minIndex][0]);
      return angleA - angleB;
    });

    const hull = [];

    for (const point of sortedPoints) {
      while (hull.length >= 2 && this.crossProduct(hull[hull.length - 2], hull[hull.length - 1], point) <= 0) {
        hull.pop();
      }
      hull.push(point);
    }

    return hull;
  }

  /**
   * Cross product for convex hull computation
   */
  crossProduct(o, a, b) {
    return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  }

  /**
   * Check if agent should spawn a child
   */
  shouldSpawn() {
    return this.modulatedParams.canSpawn;
  }

  /**
   * Spawn a child agent
   */
  spawn() {
    if (!this.shouldSpawn()) return null;

    // Create child at point of maximum curvature
    const spawnPoint = this.findMaxCurvaturePoint();
    const childBoundary = this.createChildBoundary(spawnPoint);

    const child = new Agent({
      boundary: childBoundary,
      phase: new PhaseState(Math.random() * 2 * Math.PI), // Random phase
      antclock: new Antclock(performance.now()),
      birthTime: performance.now()
    });

    return child;
  }

  /**
   * Create child boundary based on parent shape
   */
  createChildBoundary(spawnPoint) {
    const boundary = this.boundary_env;
    const n = boundary.length;

    // Create a smaller version of the boundary around spawn point
    const childBoundary = [];
    const childSize = 0.3; // Child is 30% size of parent

    for (let i = 0; i < Math.max(8, Math.floor(n * 0.3)); i++) {
      const angle = (i / Math.max(8, Math.floor(n * 0.3))) * 2 * Math.PI;
      const radius = childSize * 20; // Base radius

      const x = boundary[spawnPoint][0] + radius * Math.cos(angle);
      const y = boundary[spawnPoint][1] + radius * Math.sin(angle);

      childBoundary.push([x, y]);
    }

    return childBoundary;
  }
}

class PhaseState {
  /**
   * Phase state for agent (ties into antclock system)
   */
  constructor(initialPhase = 0) {
    this.value = initialPhase;
    this.drift = 0;
    this.coherence = 1.0;
  }

  /**
   * Update phase
   */
  update(delta) {
    this.value += delta;
    // Keep in [0, 2π]
    this.value = ((this.value % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  }

  /**
   * Get coherence (how stable the phase is)
   */
  coherence() {
    return this.coherence;
  }

  /**
   * Serialize for memory storage
   */
  serialize() {
    return {
      value: this.value,
      drift: this.drift,
      coherence: this.coherence
    };
  }
}

class Antclock {
  /**
   * Antclock timing system (discrete Riemann geometry)
   */
  constructor(birthTime) {
    this.birthTime = birthTime || performance.now();
    this.value = 0; // Current antclock value
    this.age = 0; // Age in frames
    this.rate = 1.0; // Current ticking rate
  }

  /**
   * Tick the antclock
   */
  tick(stability = 1.0) {
    // Use the provided rate directly (already modulated by guardian state)
    this.rate = stability;
    this.value += this.rate;
    this.age += 1;
  }

  /**
   * Get current time
   */
  now() {
    return this.value;
  }

  /**
   * Get age in antclock units
   */
  get antAge() {
    return this.age * this.rate;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { MemoryField, PotentialField, FrameSystem, Agent, PhaseState, Antclock };
}
