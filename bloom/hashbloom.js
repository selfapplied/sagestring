/**
 * HashBloom - Scalar Field and SVG Generator
 *
 * Core engine that:
 * - Defines Gaussian mixture field from hash genes
 * - Computes analytical gradients
 * - Generates SVG from characteristic curves
 */

import { HashToGenes } from './hash_to_genes.js';
import { BatemanReiss } from './bateman_reiss.js';

class ScalarField {
  constructor(config) {
    this.centers = config.centers;
    this.sigmas = config.sigmas;
    this.amplitudes = config.amplitudes;
    this.colors = config.colors;
    this.numGaussians = config.numGaussians;
  }

  /**
   * Evaluate field u(x,y) at point
   */
  u(x, y) {
    let sum = 0;
    for (let i = 0; i < this.numGaussians; i++) {
      const dx = x - this.centers[i].x;
      const dy = y - this.centers[i].y;
      const sigma = this.sigmas[i];
      const amplitude = this.amplitudes[i];

      const exponent = -(dx*dx + dy*dy) / (2 * sigma * sigma);
      sum += amplitude * Math.exp(exponent);
    }
    return sum;
  }

  /**
   * Evaluate gradient ∇u(x,y) analytically
   */
  gradient(x, y) {
    let ux = 0, uy = 0;

    for (let i = 0; i < this.numGaussians; i++) {
      const dx = x - this.centers[i].x;
      const dy = y - this.centers[i].y;
      const sigma = this.sigmas[i];
      const amplitude = this.amplitudes[i];

      const sigma2 = sigma * sigma;
      const exponent = -(dx*dx + dy*dy) / (2 * sigma2);
      const gaussian = Math.exp(exponent);

      // ∂u/∂x = Σ A_i * (-dx/σ²) * exp(-r²/(2σ²))
      ux += amplitude * (-dx / sigma2) * gaussian;

      // ∂u/∂y = Σ A_i * (-dy/σ²) * exp(-r²/(2σ²))
      uy += amplitude * (-dy / sigma2) * gaussian;
    }

    return {x: ux, y: uy};
  }

  /**
   * Evaluate gradient magnitude |∇u|
   */
  gradientMagnitude(x, y) {
    const grad = this.gradient(x, y);
    return Math.sqrt(grad.x * grad.x + grad.y * grad.y);
  }

  /**
   * Get field bounds for SVG viewBox
   */
  getBounds() {
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;

    // Include all centers
    for (const center of this.centers) {
      minX = Math.min(minX, center.x);
      maxX = Math.max(maxX, center.x);
      minY = Math.min(minY, center.y);
      maxY = Math.max(maxY, center.y);
    }

    // Add padding based on maximum sigma
    const maxSigma = Math.max(...this.sigmas);
    const padding = maxSigma * 3;

    return {
      x: minX - padding,
      y: minY - padding,
      width: (maxX - minX) + 2 * padding,
      height: (maxY - minY) + 2 * padding
    };
  }
}

class SVGGenerator {
  constructor(field, polylines) {
    this.field = field;
    this.polylines = polylines;
  }

  /**
   * Convert polyline to SVG cubic Bézier curve
   * Uses Catmull-Rom spline approximation
   */
  polylineToCubicBezier(points, tension = 0.5) {
    if (points.length < 2) return '';

    // Use Catmull-Rom spline for smooth curves
    let path = `M ${points[0].x} ${points[0].y}`;

    for (let i = 0; i < points.length - 1; i++) {
      const p0 = i > 0 ? points[i-1] : points[i];
      const p1 = points[i];
      const p2 = points[i+1];
      const p3 = i < points.length - 2 ? points[i+2] : p2;

      // Catmull-Rom control points
      const cp1x = p1.x + (p2.x - p0.x) * tension * 0.5;
      const cp1y = p1.y + (p2.y - p0.y) * tension * 0.5;
      const cp2x = p2.x - (p3.x - p1.x) * tension * 0.5;
      const cp2y = p2.y - (p3.y - p1.y) * tension * 0.5;

      path += ` C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${p2.x} ${p2.y}`;
    }

    return path;
  }

  /**
   * Convert polyline to piecewise linear path (fallback)
   */
  polylineToLinear(points) {
    if (points.length < 2) return '';

    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      path += ` L ${points[i].x} ${points[i].y}`;
    }
    return path;
  }

  /**
   * Simplify polyline by removing collinear points
   */
  simplifyPolyline(points, tolerance = 1.0) {
    if (points.length <= 2) return points;

    const simplified = [points[0]];

    for (let i = 1; i < points.length - 1; i++) {
      const prev = simplified[simplified.length - 1];
      const curr = points[i];
      const next = points[i + 1];

      // Calculate distance from current point to line segment
      const dx = next.x - prev.x;
      const dy = next.y - prev.y;
      const length = Math.sqrt(dx*dx + dy*dy);

      if (length < 1e-6) continue; // Skip duplicate points

      const t = ((curr.x - prev.x) * dx + (curr.y - prev.y) * dy) / (length * length);
      const closestX = prev.x + t * dx;
      const closestY = prev.y + t * dy;

      const distance = Math.sqrt((curr.x - closestX)**2 + (curr.y - closestY)**2);

      if (distance > tolerance) {
        simplified.push(curr);
      }
    }

    simplified.push(points[points.length - 1]);
    return simplified;
  }

  /**
   * Generate complete SVG string
   */
  generateSVG() {
    const bounds = this.field.getBounds();

    let svg = `<svg width="100%" height="100%" viewBox="${bounds.x} ${bounds.y} ${bounds.width} ${bounds.height}" xmlns="http://www.w3.org/2000/svg">`;

    // Glow filter
    svg += `
      <defs>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
          <feBlend in="coloredBlur" in2="SourceGraphic" mode="screen"/>
        </filter>
      </defs>`;

    // Flow lines group
    svg += '<g id="flow-lines">';

    for (let i = 0; i < this.polylines.length; i++) {
      const polyline = this.polylines[i];
      if (polyline.length < 2) continue;

      // Try cubic Bézier, fallback to linear
      let pathData = this.polylineToCubicBezier(polyline, 0.3); // Lower tension for smoother curves
      if (!pathData || pathData.length < 10) {
        pathData = this.polylineToLinear(polyline);
      }

      const hue = this.field.colors[i % this.field.colors.length];
      const color = `hsl(${hue}, 70%, 60%)`;

      svg += `<path d="${pathData}" stroke="${color}" stroke-width="2" fill="none" filter="url(#glow)" class="flow-line-${i}"/>`;
    }

    svg += '</g></svg>';

    return svg;
  }
}

class HashBloom {
  constructor() {
    this.hashToGenes = new HashToGenes();
  }

  /**
   * Generate SVG from hash
   */
  async generateFromHash(hashHex) {
    // Extract field configuration
    const config = this.hashToGenes.hashToFieldConfig(hashHex);
    const field = new ScalarField(config);

    // Generate seed points for characteristic curves
    const seedPoints = this.hashToGenes.generateSeedPoints(hashHex, 100);

    // Compute characteristic curves using Bateman-Reiss
    const batemanReiss = new BatemanReiss(field);
    const polylines = batemanReiss.computeCharacteristicCurves(seedPoints, {
      dt: 0.1,
      maxSteps: 300,
      minGradientMag: 0.01,
      maxDistance: 800,
      minLength: 8,
      maxCurves: 50
    });

    // Simplify and smooth polylines
    const smoothedPolylines = polylines.map(polyline => {
      const simplified = this.simplifyPolyline(polyline, 0.5);
      return simplified;
    });

    // Generate SVG
    const svgGen = new SVGGenerator(field, smoothedPolylines);
    const svg = svgGen.generateSVG();

    return {
      svg,
      config,
      polylines: smoothedPolylines,
      hash: hashHex
    };
  }
}

// Export for ES modules
export { HashBloom, ScalarField, SVGGenerator };
