/**
 * Bateman-Reiss Boundary Renderer
 * 
 * Single responsibility: Render self-boundary curves as shimmering SVG overlays
 */

class BRRenderer {
  constructor(options = {}) {
    this.strokeColor = options.strokeColor || '#4ecdc4';
    this.strokeWidth = options.strokeWidth || 1.5;
    this.opacity = options.opacity || 0.8;
    this.glow = options.glow !== false; // Enable glow filter by default
  }

  /**
   * Convert curve points to SVG path with smooth Bezier curves
   */
  curveToSVGPath(curve) {
    if (curve.length === 0) return '';
    if (curve.length === 1) return `M${curve[0].x} ${curve[0].y}`;
    
    let path = `M${curve[0].x} ${curve[0].y}`;
    
    // Use smooth cubic Bezier for flowing curves
    if (curve.length === 2) {
      path += ` L${curve[1].x} ${curve[1].y}`;
    } else {
      for (let i = 1; i < curve.length; i++) {
        const p0 = curve[i - 1];
        const p1 = curve[i];
        const p2 = i < curve.length - 1 ? curve[i + 1] : curve[0];
        
        // Control points for smooth curve
        const cp1x = p0.x + (p1.x - p0.x) * 0.5;
        const cp1y = p0.y + (p1.y - p0.y) * 0.5;
        const cp2x = p1.x - (p2.x - p1.x) * 0.5;
        const cp2y = p1.y - (p2.y - p1.y) * 0.5;
        
        path += ` C${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
      }
      
      // Close the loop
      if (curve[0].x === curve[curve.length - 1].x && 
          curve[0].y === curve[curve.length - 1].y) {
        path += ' Z';
      }
    }
    
    return path;
  }

  /**
   * Render boundaries as SVG overlay
   */
  renderBoundaries(boundaries, size, options = {}) {
    if (!boundaries || boundaries.length === 0) {
      return '<svg></svg>';
    }
    
    const strokeColor = options.strokeColor || this.strokeColor;
    const strokeWidth = options.strokeWidth || this.strokeWidth;
    const opacity = options.opacity || this.opacity;
    const enableGlow = options.glow !== false && this.glow;
    
    let svg = `<svg width="100%" height="100%" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg" style="pointer-events: none;">`;
    
    // Add glow filter
    if (enableGlow) {
      svg += `
        <defs>
          <filter id="brGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
      `;
    }
    
    // Render each boundary curve
    for (const boundary of boundaries) {
      if (!boundary || boundary.length < 2) continue;
      
      const path = this.curveToSVGPath(boundary);
      const filterAttr = enableGlow ? 'filter="url(#brGlow)"' : '';
      
      svg += `<path d="${path}" fill="none" stroke="${strokeColor}" stroke-width="${strokeWidth}" opacity="${opacity}" ${filterAttr}/>`;
    }
    
    svg += '</svg>';
    return svg;
  }

  /**
   * Render boundaries to canvas context (for overlay)
   */
  renderToCanvas(ctx, boundaries, scale = 1) {
    if (!boundaries || boundaries.length === 0) return;
    
    ctx.strokeStyle = this.strokeColor;
    ctx.lineWidth = this.strokeWidth * scale;
    ctx.globalAlpha = this.opacity;
    
    for (const boundary of boundaries) {
      if (!boundary || boundary.length < 2) continue;
      
      ctx.beginPath();
      ctx.moveTo(boundary[0].x * scale, boundary[0].y * scale);
      
      for (let i = 1; i < boundary.length; i++) {
        ctx.lineTo(boundary[i].x * scale, boundary[i].y * scale);
      }
      
      if (boundary[0].x === boundary[boundary.length - 1].x && 
          boundary[0].y === boundary[boundary.length - 1].y) {
        ctx.closePath();
      }
      
      ctx.stroke();
    }
    
    ctx.globalAlpha = 1.0;
  }
}

export { BRRenderer };










