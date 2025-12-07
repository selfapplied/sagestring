/**
 * Renderer - Convert lattices to SVG
 * 
 * Single responsibility: Extract paths from lattices and render as SVG
 */

class LatticeRenderer {
  /**
   * Render lattice to SVG
   */
  render(lattice, size, options = {}) {
    if (!lattice || !size || size <= 0) {
      console.warn('render: invalid lattice or size', {lattice: !!lattice, size});
      return '<svg width="256" height="256" xmlns="http://www.w3.org/2000/svg" style="background: #000;"><text x="10" y="20" fill="#f00">No data</text></svg>';
    }
    
    const threshold = options.threshold || 0.2; // Lower threshold
    let paths = [];
    
    // Extract paths from edges if available (preferred)
    if (options.edges && options.edges.magnitude) {
      try {
        paths = this.extractEdgePaths(options.edges, size, threshold);
      } catch (e) {
        console.error('Error extracting edge paths:', e);
        paths = this.extractPaths(lattice, size, threshold);
      }
    } else {
      paths = this.extractPaths(lattice, size, threshold);
    }
    
    let svg = `<svg width="100%" height="100%" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg" style="background: #000;">`;
    
    // Always add at least one path to show it's working
    if (paths.length === 0) {
      // Draw a simple test path
      svg += `<path d="M 10 10 L ${size-10} 10 L ${size-10} ${size-10} L 10 ${size-10} Z" fill="none" stroke="#f00" stroke-width="2"/>`;
      svg += `<text x="10" y="20" fill="#0f0" font-size="12">No edges found (${paths.length} paths)</text>`;
    }
    
    // Render paths as SVG
    for (const path of paths) {
      if (path && path.d) {
        svg += `<path d="${path.d}" fill="none" stroke="#4ecdc4" stroke-width="1" opacity="0.8"/>`;
      }
    }
    
    svg += '</svg>';
    return svg;
  }

  /**
   * Extract paths from lattice using marching squares
   */
  extractPaths(lattice, size, threshold) {
    const paths = [];
    const visited = new Set();

    for (let y = 0; y < size - 1; y++) {
      for (let x = 0; x < size - 1; x++) {
        const idx = y * size + x;
        if (visited.has(idx)) continue;

        if (lattice[idx] >= threshold) {
          const path = this.traceContour(lattice, size, x, y, threshold, visited);
          if (path.length > 0) {
            paths.push({d: this.contourToSVGPath(path)});
          }
        }
      }
    }

    return paths;
  }

  /**
   * Extract paths from edge magnitude field
   * Uses edge following along gradient direction
   */
  extractEdgePaths(edges, size, threshold = 0.2) {
    if (!edges || !edges.magnitude) {
      return [];
    }
    
    const paths = [];
    const visited = new Set();
    const { magnitude, direction } = edges;
    
    // If no direction, use simple threshold-based extraction
    if (!direction) {
      return this.extractPaths(magnitude, size, threshold);
    }

    // Lower threshold, check every pixel
    for (let y = 1; y < size - 1; y++) {
      for (let x = 1; x < size - 1; x++) {
        const idx = y * size + x;
        if (visited.has(idx) || !magnitude[idx] || magnitude[idx] < threshold) continue;

        // Trace edge following gradient direction
        const path = this.traceEdgePath(magnitude, direction, size, x, y, threshold, visited);
        if (path.length > 2) {
          paths.push({d: this.contourToSVGPath(path)});
        }
      }
    }

    return paths;
  }

  /**
   * Trace edge path following gradient direction
   */
  traceEdgePath(magnitude, direction, size, startX, startY, threshold, visited) {
    const path = [];
    let x = startX;
    let y = startY;
    const maxLength = 100;

    while (path.length < maxLength) {
      const idx = y * size + x;
      if (visited.has(idx) || magnitude[idx] < threshold) break;

      visited.add(idx);
      path.push({x, y});

      // Follow gradient direction
      const angle = direction[idx];
      const dx = Math.cos(angle);
      const dy = Math.sin(angle);

      const nextX = Math.round(x + dx);
      const nextY = Math.round(y + dy);

      if (nextX < 1 || nextX >= size - 1 || nextY < 1 || nextY >= size - 1) break;
      if (magnitude[nextY * size + nextX] < threshold) break;

      x = nextX;
      y = nextY;
    }

    return path;
  }

  /**
   * Trace contour using marching squares
   */
  traceContour(lattice, size, startX, startY, threshold, visited) {
    const contour = [];
    let x = startX;
    let y = startY;
    let dir = 0;

    do {
      const idx = y * size + x;
      visited.add(idx);
      contour.push({x, y});

      const right = (x + 1 < size) ? lattice[y * size + (x + 1)] >= threshold : false;
      const down = (y + 1 < size) ? lattice[(y + 1) * size + x] >= threshold : false;
      const left = (x - 1 >= 0) ? lattice[y * size + (x - 1)] >= threshold : false;
      const up = (y - 1 >= 0) ? lattice[(y - 1) * size + x] >= threshold : false;

      if (dir === 0 && right) { x++; }
      else if (dir === 1 && down) { y++; }
      else if (dir === 2 && left) { x--; }
      else if (dir === 3 && up) { y--; }
      else {
        dir = (dir + 1) % 4;
      }

      if (contour.length > size * 4) break;

    } while (x !== startX || y !== startY || contour.length === 1);

    return contour;
  }

  /**
   * Convert contour points to SVG path
   */
  contourToSVGPath(contour) {
    if (contour.length === 0) return '';
    if (contour.length === 1) return `M${contour[0].x} ${contour[0].y}`;

    let path = `M${contour[0].x} ${contour[0].y}`;
    for (let i = 1; i < contour.length; i++) {
      path += ` L${contour[i].x} ${contour[i].y}`;
    }
    path += ' Z';
    return path;
  }

  /**
   * Render edges as SVG
   */
  renderEdges(edges, size) {
    let svg = '';
    const magnitude = edges.magnitude;

    for (let y = 0; y < size; y += 2) {
      for (let x = 0; x < size; x += 2) {
        const idx = y * size + x;
        const mag = magnitude[idx];
        if (mag > 0.2) {
          const opacity = Math.min(1.0, mag);
          svg += `<circle cx="${x}" cy="${y}" r="1" fill="#ff0000" opacity="${opacity * 0.8}"/>`;
        }
      }
    }

    return svg;
  }
}

export { LatticeRenderer };

