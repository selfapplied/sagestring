/**
 * SVG Kernel 3D Visualization: WebGL Volumetric Rendering
 *
 * Provides 3D visualization capabilities for volumetric pattern recognition,
 * using Three.js for WebGL-accelerated rendering of 3D lattices as point clouds,
 * voxel volumes, and isosurfaces.
 */

class SVGKernel3DVisualization {
  /**
   * 3D visualization system for volumetric kernels
   */
  constructor(containerId, options = {}) {
    this.containerId = containerId;
    this.options = {
      backgroundColor: 0x0a0a0a,
      pointSize: 2,
      cameraDistance: 200,
      enableControls: true,
      showAxes: true,
      showGrid: false,
      ...options
    };

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.pointCloud = null;
    this.volumeMesh = null;
    this.axesHelper = null;
    this.gridHelper = null;

    this.isInitialized = false;
    this.currentKernelId = null;
    this.animationId = null;

    // Visualization modes
    this.modes = {
      POINTS: 'points',
      VOLUME: 'volume',
      ISOSURFACE: 'isosurface',
      SLICES: 'slices'
    };
    this.currentMode = this.modes.POINTS;

    console.log('🎨 SVG Kernel 3D Visualization initialized');
  }

  /**
   * Initialize Three.js scene and renderer
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      // Check if Three.js is available
      if (typeof THREE === 'undefined') {
        await this.loadThreeJS();
      }

      const container = document.getElementById(this.containerId);
      if (!container) {
        throw new Error(`Container element ${this.containerId} not found`);
      }

      // Scene setup
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(this.options.backgroundColor);

      // Camera setup
      const aspect = container.clientWidth / container.clientHeight;
      this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
      this.camera.position.set(
        this.options.cameraDistance,
        this.options.cameraDistance,
        this.options.cameraDistance
      );

      // Renderer setup
      this.renderer = new THREE.WebGLRenderer({ antialias: true });
      this.renderer.setSize(container.clientWidth, container.clientHeight);
      this.renderer.setPixelRatio(window.devicePixelRatio);
      container.appendChild(this.renderer.domElement);

      // Lighting
      this.setupLighting();

      // Controls
      if (this.options.enableControls) {
        this.setupControls();
      }

      // Helpers
      if (this.options.showAxes) {
        this.axesHelper = new THREE.AxesHelper(50);
        this.scene.add(this.axesHelper);
      }

      if (this.options.showGrid) {
        this.gridHelper = new THREE.GridHelper(200, 20);
        this.scene.add(this.gridHelper);
      }

      // Event listeners
      window.addEventListener('resize', this.onWindowResize.bind(this));

      this.isInitialized = true;
      console.log('🎬 3D visualization initialized');

    } catch (error) {
      console.error('Failed to initialize 3D visualization:', error);
      throw error;
    }
  }

  /**
   * Load Three.js library
   */
  async loadThreeJS() {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  /**
   * Setup scene lighting
   */
  setupLighting() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    this.scene.add(ambientLight);

    // Directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(100, 100, 50);
    this.scene.add(directionalLight);

    // Point light for volumetric effects
    const pointLight = new THREE.PointLight(0x4488ff, 0.5, 300);
    pointLight.position.set(-100, 50, 100);
    this.scene.add(pointLight);
  }

  /**
   * Setup camera controls
   */
  setupControls() {
    // Load OrbitControls if not available
    if (typeof THREE.OrbitControls === 'undefined') {
      return this.loadOrbitControls().then(() => {
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.enableZoom = true;
        this.controls.enablePan = true;
      });
    } else {
      this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.05;
      this.controls.enableZoom = true;
      this.controls.enablePan = true;
    }
  }

  /**
   * Load OrbitControls
   */
  async loadOrbitControls() {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  /**
   * Visualize 3D kernel data
   */
  visualizeKernel(kernelId, visData, mode = this.modes.POINTS) {
    if (!this.isInitialized) {
      throw new Error('Visualization not initialized. Call initialize() first.');
    }

    this.currentKernelId = kernelId;
    this.currentMode = mode;

    // Clear previous visualization
    this.clearVisualization();

    switch (mode) {
      case this.modes.POINTS:
        this.createPointCloud(visData);
        break;
      case this.modes.VOLUME:
        this.createVolumeMesh(visData);
        break;
      case this.modes.ISOSURFACE:
        this.createIsoSurface(visData);
        break;
      case this.modes.SLICES:
        this.createSliceVisualization(visData);
        break;
    }

    this.startAnimation();
  }

  /**
   * Create point cloud visualization
   */
  createPointCloud(visData) {
    const { points, colors, size } = visData;

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));

    if (colors && colors.length > 0) {
      geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 4));
    }

    const material = new THREE.PointsMaterial({
      size: this.options.pointSize,
      vertexColors: colors && colors.length > 0,
      color: colors && colors.length > 0 ? undefined : 0x4488ff,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true
    });

    this.pointCloud = new THREE.Points(geometry, material);
    this.scene.add(this.pointCloud);

    // Center the visualization
    this.centerCameraOnVisualization(size);
  }

  /**
   * Create volume mesh (voxel-based)
   */
  createVolumeMesh(visData) {
    const { points, colors, size } = visData;

    // Create box geometry for each occupied voxel
    const voxelSize = 1;
    const voxelGeometry = new THREE.BoxGeometry(voxelSize, voxelSize, voxelSize);

    // Group for all voxels
    const voxelGroup = new THREE.Group();

    for (let i = 0; i < points.length; i += 3) {
      const x = points[i];
      const y = points[i + 1];
      const z = points[i + 2];

      const voxelMaterial = new THREE.MeshLambertMaterial({
        color: colors && colors.length > i ? new THREE.Color(colors[i]/255, colors[i+1]/255, colors[i+2]/255) : 0x4488ff,
        transparent: true,
        opacity: 0.7
      });

      const voxel = new THREE.Mesh(voxelGeometry, voxelMaterial);
      voxel.position.set(x, y, z);
      voxelGroup.add(voxel);
    }

    this.volumeMesh = voxelGroup;
    this.scene.add(this.volumeMesh);

    this.centerCameraOnVisualization(size);
  }

  /**
   * Create isosurface visualization (Marching Cubes algorithm)
   */
  createIsoSurface(visData) {
    // Simplified isosurface - in a full implementation, this would use
    // Marching Cubes algorithm to generate smooth surfaces
    // For now, we'll use a point cloud with larger points
    this.options.pointSize = 4;
    this.createPointCloud(visData);
    this.options.pointSize = 2;
  }

  /**
   * Create slice visualization (showing 2D slices through 3D volume)
   */
  createSliceVisualization(visData) {
    const { size } = visData;
    const sliceGroup = new THREE.Group();

    // Create XY, XZ, and YZ slice planes
    const sliceGeometry = new THREE.PlaneGeometry(size.x, size.y);

    // XY slice (constant Z)
    const xyMaterial = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide
    });
    const xySlice = new THREE.Mesh(sliceGeometry, xyMaterial);
    xySlice.position.set(size.x/2, size.y/2, size.z/2);
    sliceGroup.add(xySlice);

    // XZ slice (constant Y)
    const xzMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide
    });
    const xzSlice = new THREE.Mesh(sliceGeometry, xzMaterial);
    xzSlice.rotation.x = Math.PI / 2;
    xzSlice.position.set(size.x/2, size.y/2, size.z/2);
    sliceGroup.add(xzSlice);

    // YZ slice (constant X)
    const yzMaterial = new THREE.MeshBasicMaterial({
      color: 0x0000ff,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide
    });
    const yzSlice = new THREE.Mesh(sliceGeometry, yzMaterial);
    yzSlice.rotation.y = Math.PI / 2;
    yzSlice.position.set(size.x/2, size.y/2, size.z/2);
    sliceGroup.add(yzSlice);

    this.volumeMesh = sliceGroup;
    this.scene.add(this.volumeMesh);

    this.centerCameraOnVisualization(size);
  }

  /**
   * Center camera on visualization
   */
  centerCameraOnVisualization(size) {
    const center = new THREE.Vector3(size.x/2, size.y/2, size.z/2);
    const distance = Math.max(size.x, size.y, size.z) * 1.5;

    this.camera.position.copy(center).add(new THREE.Vector3(distance, distance, distance));
    this.camera.lookAt(center);

    if (this.controls) {
      this.controls.target.copy(center);
      this.controls.update();
    }
  }

  /**
   * Clear current visualization
   */
  clearVisualization() {
    if (this.pointCloud) {
      this.scene.remove(this.pointCloud);
      this.pointCloud.geometry.dispose();
      this.pointCloud.material.dispose();
      this.pointCloud = null;
    }

    if (this.volumeMesh) {
      this.scene.remove(this.volumeMesh);
      // Dispose of geometries and materials in volume mesh
      if (this.volumeMesh.children) {
        this.volumeMesh.children.forEach(child => {
          if (child.geometry) child.geometry.dispose();
          if (child.material) child.material.dispose();
        });
      }
      this.volumeMesh = null;
    }
  }

  /**
   * Start animation loop
   */
  startAnimation() {
    if (this.animationId) return;

    const animate = () => {
      this.animationId = requestAnimationFrame(animate);

      if (this.controls) {
        this.controls.update();
      }

      // Add subtle rotation for dynamic effect
      if (this.pointCloud && this.options.enableRotation) {
        this.pointCloud.rotation.y += 0.002;
      }

      this.renderer.render(this.scene, this.camera);
    };

    animate();
  }

  /**
   * Stop animation
   */
  stopAnimation() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  /**
   * Change visualization mode
   */
  setVisualizationMode(mode) {
    if (!this.currentKernelId) return;

    // Re-visualize with new mode (would need visData passed in or cached)
    this.currentMode = mode;
  }

  /**
   * Update visualization parameters
   */
  updateParameters(params) {
    if (params.pointSize !== undefined) {
      this.options.pointSize = params.pointSize;
      if (this.pointCloud && this.pointCloud.material) {
        this.pointCloud.material.size = params.pointSize;
        this.pointCloud.material.needsUpdate = true;
      }
    }

    if (params.opacity !== undefined) {
      if (this.pointCloud && this.pointCloud.material) {
        this.pointCloud.material.opacity = params.opacity;
        this.pointCloud.material.needsUpdate = true;
      }
    }

    if (params.enableRotation !== undefined) {
      this.options.enableRotation = params.enableRotation;
    }
  }

  /**
   * Take screenshot of current visualization
   */
  takeScreenshot() {
    return this.renderer.domElement.toDataURL('image/png');
  }

  /**
   * Export visualization as OBJ file
   */
  exportOBJ() {
    // This would require a library like OBJExporter
    // For now, return placeholder
    console.log('OBJ export not implemented yet');
    return null;
  }

  /**
   * Window resize handler
   */
  onWindowResize() {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    this.camera.aspect = container.clientWidth / container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(container.clientWidth, container.clientHeight);
  }

  /**
   * Cleanup resources
   */
  dispose() {
    this.stopAnimation();
    this.clearVisualization();

    if (this.renderer) {
      this.renderer.dispose();
    }

    if (this.controls) {
      this.controls.dispose();
    }

    // Remove event listeners
    window.removeEventListener('resize', this.onWindowResize);
  }

  /**
   * Get available visualization modes
   */
  getVisualizationModes() {
    return Object.keys(this.modes);
  }

  /**
   * Check if visualization is ready
   */
  isReady() {
    return this.isInitialized;
  }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SVGKernel3DVisualization };
}

