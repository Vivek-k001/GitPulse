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
    this.mode = 'sphere'; // 'sphere', 'spiral', 'ring'
    this.languagesData = null;

    this.init();
  }

  init() {
    const width = this.container.clientWidth || 600;
    const height = this.container.clientHeight || 520;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x010409);

    const gridHelper = new THREE.GridHelper(260, 26, 0x21262d, 0x161b22);
    gridHelper.position.y = -50;
    this.scene.add(gridHelper);

    this.camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    this.camera.position.set(0, 40, 200);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.container.innerHTML = '';
    this.container.appendChild(this.renderer.domElement);

    if (window.THREE.OrbitControls) {
      this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.05;
      this.controls.rotateSpeed = 0.8;
      this.controls.minDistance = 60;
      this.controls.maxDistance = 500;
    }

    window.addEventListener('resize', () => this.onResize());
    this.animate();
  }

  setMode(mode) {
    this.mode = mode;
    if (this.languagesData) {
      this.buildGalaxy(this.languagesData);
    }
  }

  buildGalaxy(languagesData) {
    this.languagesData = languagesData;
    if (this.points) {
      this.scene.remove(this.points);
      this.points.geometry.dispose();
      this.points.material.dispose();
      this.points = null;
    }

    const totalBytes = Object.values(languagesData).reduce((a, b) => a + b, 0);
    if (totalBytes === 0) return;

    const totalParticles = 7500;
    const positions = new Float32Array(totalParticles * 3);
    const colors = new Float32Array(totalParticles * 3);

    let offset = 0;
    const entries = Object.entries(languagesData);

    entries.forEach(([lang, bytes], index) => {
      const share = bytes / totalBytes;
      const count = Math.max(Math.floor(share * totalParticles), 80);
      const hexColor = getLanguageColor(lang);
      const color = new THREE.Color(hexColor);

      for (let i = 0; i < count && offset < totalParticles; i++) {
        let x = 0, y = 0, z = 0;

        if (this.mode === 'spiral') {
          // Archimedean Spiral arms
          const armAngle = (index / Math.max(entries.length, 1)) * Math.PI * 2;
          const distance = Math.pow(Math.random(), 0.5) * 85 + 10;
          const theta = armAngle + distance * 0.08 + (Math.random() - 0.5) * 0.4;
          x = distance * Math.cos(theta);
          z = distance * Math.sin(theta);
          y = (Math.random() - 0.5) * (14 - distance * 0.1);
        } else if (this.mode === 'ring') {
          // Torus ring structure
          const u = Math.random() * Math.PI * 2;
          const v = Math.random() * Math.PI * 2;
          const majorRadius = 55 + (index * 6);
          const minorRadius = 10;
          x = (majorRadius + minorRadius * Math.cos(v)) * Math.cos(u);
          z = (majorRadius + minorRadius * Math.cos(v)) * Math.sin(u);
          y = minorRadius * Math.sin(v) * 0.7;
        } else {
          // Spherical core & planetary belts
          const baseRadius = 28 + (index * 14);
          const ringThickness = 14;
          const theta = Math.random() * Math.PI * 2;
          const phi = (Math.random() - 0.5) * Math.PI * 0.65;
          const radius = baseRadius + (Math.random() - 0.5) * ringThickness;

          x = radius * Math.cos(theta) * Math.cos(phi);
          y = radius * Math.sin(phi) * 0.6 + (Math.random() - 0.5) * 6;
          z = radius * Math.sin(theta) * Math.cos(phi);
        }

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
      opacity: 0.88
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
      this.camera.position.set(0, 40, 200);
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
      this.points.rotation.y += 0.0018;
    }

    if (this.controls) {
      this.controls.update();
    }

    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }
}
