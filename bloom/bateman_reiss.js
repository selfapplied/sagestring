/**
 * Bateman-Reiss Characteristic Curve Integrator
 *
 * Solves the characteristic ODE system:
 * dx/dt = u_x(x,y)
 * dy/dt = u_y(x,y)
 *
 * Using 4th-order Runge-Kutta integration
 */

class BatemanReiss {
  constructor(field) {
    this.field = field;
  }

  /**
   * Compute single RK4 step for the ODE system
   * dy/dt = f(t, y) where y = [x, y] and f = [u_x, u_y]
   */
  rk4Step(t, x, y, dt) {
    // k1 = f(t, y)
    const k1x = this.field.gradient(x, y).x;
    const k1y = this.field.gradient(x, y).y;

    // k2 = f(t + dt/2, y + dt/2 * k1)
    const k2x = this.field.gradient(x + dt/2 * k1x, y + dt/2 * k1y).x;
    const k2y = this.field.gradient(x + dt/2 * k1x, y + dt/2 * k1y).y;

    // k3 = f(t + dt/2, y + dt/2 * k2)
    const k3x = this.field.gradient(x + dt/2 * k2x, y + dt/2 * k2y).x;
    const k3y = this.field.gradient(x + dt/2 * k2x, y + dt/2 * k2y).y;

    // k4 = f(t + dt, y + dt * k3)
    const k4x = this.field.gradient(x + dt * k3x, y + dt * k3y).x;
    const k4y = this.field.gradient(x + dt * k3x, y + dt * k3y).y;

    // y_{n+1} = y_n + (dt/6) * (k1 + 2*k2 + 2*k3 + k4)
    const newX = x + (dt/6) * (k1x + 2*k2x + 2*k3x + k4x);
    const newY = y + (dt/6) * (k1y + 2*k2y + 2*k3y + k4y);

    return {x: newX, y: newY};
  }

  /**
   * Integrate characteristic curve from seed point
   */
  integrateCurve(seedX, seedY, options = {}) {
    const dt = options.dt || 0.1;
    const maxSteps = options.maxSteps || 500;
    const minGradientMag = options.minGradientMag || 0.01;
    const maxDistance = options.maxDistance || 1000;

    const points = [{x: seedX, y: seedY}];
    let x = seedX;
    let y = seedY;
    let totalDistance = 0;

    for (let step = 0; step < maxSteps; step++) {
      // Check gradient magnitude (stop if too small)
      const gradMag = this.field.gradientMagnitude(x, y);
      if (gradMag < minGradientMag) break;

      // RK4 step
      const next = this.rk4Step(0, x, y, dt);
      const dx = next.x - x;
      const dy = next.y - y;
      const stepDistance = Math.sqrt(dx*dx + dy*dy);

      // Check for excessive step size (possible instability)
      if (stepDistance > maxDistance / maxSteps * 10) break;

      totalDistance += stepDistance;
      if (totalDistance > maxDistance) break;

      x = next.x;
      y = next.y;
      points.push({x, y});
    }

    return points;
  }

  /**
   * Compute all characteristic curves from seed points
   */
  computeCharacteristicCurves(seedPoints, options = {}) {
    const curves = [];
    const minLength = options.minLength || 5;

    for (const seed of seedPoints) {
      const curve = this.integrateCurve(seed.x, seed.y, options);

      // Only keep curves above minimum length
      if (curve.length >= minLength) {
        curves.push(curve);
      }

      // Limit total number of curves
      if (curves.length >= (options.maxCurves || 100)) break;
    }

    return curves;
  }

  /**
   * Compute both forward and backward characteristic curves
   * (useful for closed orbits or separatrices)
   */
  computeBidirectionalCurve(seedX, seedY, options = {}) {
    const forward = this.integrateCurve(seedX, seedY, options);
    const backward = this.integrateCurve(seedX, seedY, {...options, dt: -(options.dt || 0.1)});

    // Combine backward (reversed) + forward, removing duplicate seed point
    const combined = [...backward.slice(0, -1).reverse(), ...forward];

    return combined;
  }

  /**
   * Find critical points (where ∇u = 0)
   * Useful for seeding important characteristic curves
   */
  findCriticalPoints(gridSize = 100, bounds = null) {
    if (!bounds) {
      bounds = this.field.getBounds();
    }

    const criticalPoints = [];
    const threshold = 0.01; // Gradient magnitude threshold

    // Sample grid points
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        const x = bounds.x + (i / gridSize) * bounds.width;
        const y = bounds.y + (j / gridSize) * bounds.height;

        const gradMag = this.field.gradientMagnitude(x, y);
        if (gradMag < threshold) {
          criticalPoints.push({x, y, type: this.classifyCriticalPoint(x, y)});
        }
      }
    }

    return criticalPoints;
  }

  /**
   * Classify critical point type (saddle, source, sink, center)
   */
  classifyCriticalPoint(x, y) {
    // Compute Hessian at critical point
    const eps = 1e-4;

    // Second derivatives (finite difference approximation)
    const uxx = (this.field.u(x + eps, y) - 2 * this.field.u(x, y) + this.field.u(x - eps, y)) / (eps * eps);
    const uyy = (this.field.u(x, y + eps) - 2 * this.field.u(x, y) + this.field.u(x, y - eps)) / (eps * eps);
    const uxy = (this.field.u(x + eps, y + eps) - this.field.u(x + eps, y - eps) -
                 this.field.u(x - eps, y + eps) + this.field.u(x - eps, y - eps)) / (4 * eps * eps);

    const det = uxx * uyy - uxy * uxy;
    const trace = uxx + uyy;

    if (det > 0 && trace < 0) return 'sink';
    if (det > 0 && trace > 0) return 'source';
    if (det < 0) return 'saddle';
    if (det === 0) return 'degenerate';

    return 'unknown';
  }

  /**
   * Adaptive step size control for RK4
   * Adjusts dt based on local gradient magnitude
   */
  adaptiveDt(x, y, baseDt = 0.1, targetError = 1e-3) {
    const gradMag = this.field.gradientMagnitude(x, y);

    if (gradMag < 1e-6) return baseDt; // Avoid division by zero

    // Smaller steps in high-gradient regions
    const adaptiveDt = baseDt / Math.sqrt(gradMag);

    // Clamp to reasonable range
    return Math.max(0.01, Math.min(adaptiveDt, 1.0));
  }
}

// Export for ES modules
export { BatemanReiss };









