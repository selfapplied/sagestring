/**
 * SVG Parser - Parses SVG kernel definitions
 * 
 * Single responsibility: Convert SVG text to kernel definition objects
 */

class SVGParser {
  parseKernel(svgText) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgText, 'text/xml');
    const kernelElements = doc.querySelectorAll('kernel');
    const kernels = [];

    for (const kernelEl of kernelElements) {
      kernels.push(this.parseKernelElement(kernelEl));
    }

    return kernels;
  }

  parseKernelElement(element) {
    const id = element.getAttribute('id');
    const energy = parseFloat(element.getAttribute('energy') || '1.0');
    const power = parseFloat(element.getAttribute('power') || '2.0');

    const kernel = {
      id: id,
      energy: energy,
      power: power,
      shape: null,
      discrete: null,
      invariants: []
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

    const transforms = element.querySelectorAll('transform');
    for (const transformEl of transforms) {
      shape.transforms.push({
        type: transformEl.getAttribute('type'),
        params: transformEl.getAttribute('params')
      });
    }

    return shape;
  }

  parseDiscreteElement(element) {
    const latticeEl = element.querySelector('lattice');
    return {
      lattice: {
        size: parseInt(latticeEl?.getAttribute('size') || '256'),
        boundary: latticeEl?.getAttribute('boundary') || 'wrap',
        dimensions: parseInt(latticeEl?.getAttribute('dimensions') || '2')
      }
    };
  }

  parseInvariantElement(element) {
    const invariant = {
      type: element.tagName,
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
}

export { SVGParser };

