// Three.js 3D Codebase Galaxy Particle System
class GalaxyEngine {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.points = null;
    this.isRotating = true;
    this.animationFrameId = null;

    this.init();
  }

  init() {
    const width = this.container.clientWidth || 600;
    const height = this.container.clientHeight || 520;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x010409);

    this.camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    this.camera.position.set(0, 0, 180);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Clear existing children
    this.container.innerHTML = '';
    this.container.appendChild(this.renderer.domElement);

    if (window.THREE.OrbitControls) {
      this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.05;
      this.controls.rotateSpeed = 0.8;
      this.controls.minDistance = 60;
      this.controls.maxDistance = 400;
    }

    window.addEventListener('resize', () => this.onResize());
    this.animate();
  }

  buildGalaxy(languagesData) {
    if (this.points) {
      this.scene.remove(this.points);
      this.points.geometry.dispose();
      this.points.material.dispose();
      this.points = null;
    }

    const totalBytes = Object.values(languagesData).reduce((a, b) => a + b, 0);
    if (totalBytes === 0) return;

    const totalParticles = 6000;
    const positions = new Float32Array(totalParticles * 3);
    const colors = new Float32Array(totalParticles * 3);

    let offset = 0;
    const entries = Object.entries(languagesData);

    entries.forEach(([lang, bytes], index) => {
      const share = bytes / totalBytes;
      const count = Math.max(Math.floor(share * totalParticles), 50);
      const hexColor = getLanguageColor(lang);
      const color = new THREE.Color(hexColor);

      const baseRadius = 30 + (index * 12);
      const ringThickness = 12;

      for (let i = 0; i < count && offset < totalParticles; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = (Math.random() - 0.5) * Math.PI * 0.6;
        const radius = baseRadius + (Math.random() - 0.5) * ringThickness;

        const x = radius * Math.cos(theta) * Math.cos(phi);
        const y = radius * Math.sin(phi) * 0.6 + (Math.random() - 0.5) * 6;
        const z = radius * Math.sin(theta) * Math.cos(phi);

        positions[offset * 3] = x;
        positions[offset * 3 + 1] = y;
        positions[offset * 3 + 2] = z;

        colors[offset * 3] = color.r;
        colors[offset * 3 + 1] = color.g;
        colors[offset * 3 + 2] = color.b;

        offset++;
      }
    });

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions.subarray(0, offset * 3), 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors.subarray(0, offset * 3), 3));

    const material = new THREE.PointsMaterial({
      size: 2.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.85
    });

    this.points = new THREE.Points(geometry, material);
    this.scene.add(this.points);
  }

  toggleRotation() {
    this.isRotating = !this.isRotating;
    return this.isRotating;
  }

  resetCamera() {
    if (this.camera && this.controls) {
      this.camera.position.set(0, 0, 180);
      this.controls.target.set(0, 0, 0);
      this.controls.update();
    }
  }

  onResize() {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  animate() {
    this.animationFrameId = requestAnimationFrame(() => this.animate());

    if (this.points && this.isRotating) {
      this.points.rotation.y += 0.002;
    }

    if (this.controls) {
      this.controls.update();
    }

    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }
}
