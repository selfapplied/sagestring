/**
 * Hash-to-Genes Mapper - Extract field parameters from SHA-1 hash
 *
 * Takes 40 hex characters and maps them to Gaussian field parameters:
 * - Control points (centers) for each Gaussian
 * - Standard deviations (sigmas) for width
 * - Amplitudes for strength
 * - Colors for visualization
 */

class HashToGenes {
  /**
   * Convert hex char to number (0-15)
   */
  hexToNum(hexChar) {
    return parseInt(hexChar, 16);
  }

  /**
   * Convert hex char to normalized value (0-1)
   */
  hexToNorm(hexChar) {
    return this.hexToNum(hexChar) / 15.0;
  }

  /**
   * Map hash to field configuration
   * SHA-1: 40 hex chars = 160 bits
   * We extract ~8-12 Gaussian centers with parameters
   */
  hashToFieldConfig(hashHex) {
    if (hashHex.length !== 40) {
      throw new Error('Hash must be 40 hex characters (SHA-1)');
    }

    const chars = hashHex.split('');
    const centers = [];
    const sigmas = [];
    const amplitudes = [];
    const colors = [];

    // Extract 8-12 Gaussians (depending on hash entropy)
    const numGaussians = 8 + Math.floor(this.hexToNorm(chars[0]) * 4); // 8-12

    for (let i = 0; i < numGaussians; i++) {
      // Control point: parametric curve seed
      // Use 4 chars per center (8 coordinates total)
      const baseIdx = 1 + (i * 4) % 39; // Cycle through hash

      // Angles from hex chars (0-360°)
      const angle1 = this.hexToNorm(chars[baseIdx]) * 2 * Math.PI;
      const angle2 = this.hexToNorm(chars[(baseIdx + 1) % 40]) * 2 * Math.PI;

      // Radii from adjacent chars (scale 50-200)
      const radius1 = 50 + this.hexToNorm(chars[(baseIdx + 2) % 40]) * 150;
      const radius2 = 50 + this.hexToNorm(chars[(baseIdx + 3) % 40]) * 150;

      // Convert to Cartesian coordinates
      const x = radius1 * Math.cos(angle1);
      const y = radius2 * Math.sin(angle2);

      centers.push({x, y});

      // Sigma (width): 20-80 pixels
      const sigma = 20 + this.hexToNorm(chars[(baseIdx + 1) % 40]) * 60;
      sigmas.push(sigma);

      // Amplitude: 0.5-2.0
      const amplitude = 0.5 + this.hexToNorm(chars[(baseIdx + 2) % 40]) * 1.5;
      amplitudes.push(amplitude);

      // Color: HSL hue from hash
      const hue = (this.hexToNum(chars[(baseIdx + 3) % 40]) * 360) / 15;
      colors.push(hue);
    }

    return {
      centers,
      sigmas,
      amplitudes,
      colors,
      numGaussians,
      hash: hashHex
    };
  }

  /**
   * Generate seed points for characteristic curves
   * Distributed on circle or jitter grid based on hash
   */
  generateSeedPoints(hashHex, numSeeds = 100) {
    const config = this.hashToFieldConfig(hashHex);
    const seeds = [];

    // Use hash to determine distribution pattern
    const patternType = this.hexToNum(hashHex[0]) % 3; // 0: circle, 1: grid, 2: random

    if (patternType === 0) {
      // Circle distribution
      for (let i = 0; i < numSeeds; i++) {
        const angle = (i / numSeeds) * 2 * Math.PI;
        const radius = 200 + Math.sin(angle * 3) * 50; // Vary radius
        const x = radius * Math.cos(angle);
        const y = radius * Math.sin(angle);
        seeds.push({x, y});
      }
    } else if (patternType === 1) {
      // Jittered grid
      const gridSize = Math.ceil(Math.sqrt(numSeeds));
      const spacing = 400 / gridSize;

      for (let i = 0; i < numSeeds; i++) {
        const row = Math.floor(i / gridSize);
        const col = i % gridSize;

        // Base grid position
        let x = (col - gridSize/2) * spacing;
        let y = (row - gridSize/2) * spacing;

        // Add hash-based jitter
        const jitterX = (this.hexToNorm(hashHex[i % 40]) - 0.5) * spacing * 0.5;
        const jitterY = (this.hexToNorm(hashHex[(i + 17) % 40]) - 0.5) * spacing * 0.5;

        x += jitterX;
        y += jitterY;

        seeds.push({x, y});
      }
    } else {
      // Random distribution (hash-seeded)
      for (let i = 0; i < numSeeds; i++) {
        // Use hash chars as pseudo-random seed
        const seed1 = this.hexToNorm(hashHex[i % 40]);
        const seed2 = this.hexToNorm(hashHex[(i * 7) % 40]);
        const seed3 = this.hexToNorm(hashHex[(i * 13 + 23) % 40]);

        // Box-Muller transform for normal distribution
        const u1 = Math.max(1e-8, seed1); // Avoid log(0)
        const u2 = Math.max(1e-8, seed2);
        const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
        const z1 = Math.sqrt(-2 * Math.log(u1)) * Math.sin(2 * Math.PI * u2);

        // Scale to field bounds
        const x = z0 * 150;
        const y = z1 * 150 + seed3 * 100 - 50; // Add vertical offset

        seeds.push({x, y});
      }
    }

    return seeds;
  }
}

// Export for ES modules
export { HashToGenes };









