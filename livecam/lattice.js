/**
 * Lattice Operations - Rasterization, transforms, sampling
 * 
 * Single responsibility: Convert between SVG paths and lattices, apply transforms
 */

class LatticeOps {
  /**
   * Rasterize SVG path to lattice
   */
  rasterizePath(path, size, supersample = 4) {
    const commands = this.parseSVGPath(path.d);
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size * supersample;
    const ctx = canvas.getContext('2d');

    ctx.strokeStyle = path.stroke || '#000000';
    ctx.lineWidth = (path.strokeWidth || 2) * supersample;
    ctx.fillStyle = path.fill || 'transparent';

    ctx.beginPath();
    this.renderPathCommands(ctx, commands, supersample);
    ctx.stroke();
    if (path.fill && path.fill !== 'none') {
      ctx.fill();
    }

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    return this.downsampleToLattice(imageData, size, supersample);
  }

  /**
   * Parse SVG path d attribute
   */
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

  /**
   * Render path commands to canvas
   */
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
        case 'Z':
          ctx.closePath();
          currentX = startX;
          currentY = startY;
          break;
      }
    }
  }

  /**
   * Downsample high-res canvas to lattice
   */
  downsampleToLattice(imageData, size, supersample) {
    const lattice = new Float32Array(size * size);
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

            if (data[idx + 3] > 0) {
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
        lattice[y * size + x] = avgPresence;
      }
    }

    return lattice;
  }

  /**
   * Scale lattice
   */
  scaleLattice(lattice, size, scale) {
    const scaled = new Float32Array(size * size);
    const center = size / 2;

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const sx = Math.floor((x - center) / scale + center);
        const sy = Math.floor((y - center) / scale + center);

        if (sx >= 0 && sx < size && sy >= 0 && sy < size) {
          scaled[y * size + x] = lattice[sy * size + sx];
        }
      }
    }

    return scaled;
  }

  /**
   * Rotate lattice
   */
  rotateLattice(lattice, size, angle) {
    const rotated = new Float32Array(size * size);
    const center = size / 2;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const dx = x - center;
        const dy = y - center;
        const sx = Math.round(center + dx * cos - dy * sin);
        const sy = Math.round(center + dx * sin + dy * cos);

        if (sx >= 0 && sx < size && sy >= 0 && sy < size) {
          rotated[y * size + x] = lattice[sy * size + sx];
        }
      }
    }

    return rotated;
  }

  /**
   * Mirror lattice
   */
  mirrorLattice(lattice, size, axis = 'x') {
    const mirrored = new Float32Array(lattice);

    if (axis === 'x') {
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size / 2; x++) {
          const left = y * size + x;
          const right = y * size + (size - 1 - x);
          [mirrored[left], mirrored[right]] = [mirrored[right], mirrored[left]];
        }
      }
    } else {
      for (let x = 0; x < size; x++) {
        for (let y = 0; y < size / 2; y++) {
          const top = y * size + x;
          const bottom = (size - 1 - y) * size + x;
          [mirrored[top], mirrored[bottom]] = [mirrored[bottom], mirrored[top]];
        }
      }
    }

    return mirrored;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { LatticeOps };
}

