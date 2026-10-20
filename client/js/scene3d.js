/**
 * Three.js 3D Holographic Envelope Security Scanner
 * Provides realistic 3D mesh creation, dynamic lighting,
 * laser scanning plane, animated flap opening, and cyber hazard shield.
 */

class HolographicScanner3D {
  constructor(canvasContainerId) {
    this.container = document.getElementById(canvasContainerId);
    this.state = 'idle'; // 'idle' | 'scanning' | 'ham' | 'spam'
    this.time = 0;
    this.targetFlapAngle = 0;
    this.currentFlapAngle = 0;
    this.targetPaperY = 0;
    this.currentPaperY = 0;
    this.mouseX = 0;
    this.mouseY = 0;
    this.targetRotX = 0;
    this.targetRotY = 0;
    this.isDragging = false;
    this.prevMousePos = { x: 0, y: 0 };

    this.colors = {
      idle: new THREE.Color(0x00f0ff),
      scanning: new THREE.Color(0xffb800),
      ham: new THREE.Color(0x00ff88),
      spam: new THREE.Color(0xff2a5f)
    };

    this.currentColor = this.colors.idle.clone();
    this.targetColor = this.colors.idle.clone();

    this.init();
  }

  init() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x070a13, 0.05);

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    this.camera.position.set(0, 1.2, 5.2);

    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.container.appendChild(this.renderer.domElement);

    // 4. Lighting
    this.ambientLight = new THREE.AmbientLight(0x0d1e38, 1.5);
    this.scene.add(this.ambientLight);

    this.keyLight = new THREE.PointLight(0x00f0ff, 3.0, 15);
    this.keyLight.position.set(2, 3, 3);
    this.scene.add(this.keyLight);

    this.rimLight = new THREE.PointLight(0xff2a5f, 1.2, 10);
    this.rimLight.position.set(-3, -2, -2);
    this.scene.add(this.rimLight);

    this.scannerLight = new THREE.PointLight(0x00f0ff, 2.5, 8);
    this.scannerLight.position.set(0, 0, 1.5);
    this.scene.add(this.scannerLight);

    // 5. Build 3D Meshes
    this.buildEnvelope();
    this.buildScannerRing();
    this.buildHazardShield();
    this.buildParticles();

    // 6. Event Listeners
    window.addEventListener('resize', () => this.onResize());
    this.setupInteractivity();

    // 7. Start Render Loop
    this.animate();
  }

  buildEnvelope() {
    this.envelopeGroup = new THREE.Group();

    // Base body (Back & front pouch)
    const bodyGeo = new THREE.BoxGeometry(2.4, 1.5, 0.12);
    this.bodyMat = new THREE.MeshStandardMaterial({
      color: 0x0e1c33,
      metalness: 0.75,
      roughness: 0.25,
      emissive: 0x002233,
      emissiveIntensity: 0.4
    });
    this.bodyMesh = new THREE.Mesh(bodyGeo, this.bodyMat);
    this.envelopeGroup.add(this.bodyMesh);

    // Body Neon Edges
    const edgesGeo = new THREE.EdgesGeometry(bodyGeo);
    this.edgesMat = new THREE.LineBasicMaterial({ color: 0x00f0ff, linewidth: 2 });
    this.bodyEdges = new THREE.LineSegments(edgesGeo, this.edgesMat);
    this.envelopeGroup.add(this.bodyEdges);

    // Flap group hinged at the top edge of the envelope (y = +0.75)
    this.flapHinge = new THREE.Group();
    this.flapHinge.position.set(0, 0.75, 0.06);

    // Triangular/Trapezoidal Flap Geometry
    const flapShape = new THREE.Shape();
    flapShape.moveTo(-1.2, 0);
    flapShape.lineTo(1.2, 0);
    flapShape.lineTo(0, -0.9);
    flapShape.closePath();

    const flapGeo = new THREE.ShapeGeometry(flapShape);
    this.flapMat = new THREE.MeshStandardMaterial({
      color: 0x122440,
      metalness: 0.7,
      roughness: 0.3,
      side: THREE.DoubleSide
    });
    this.flapMesh = new THREE.Mesh(flapGeo, this.flapMat);
    this.flapHinge.add(this.flapMesh);

    // Cyber-Seal / Emblem on the flap
    const sealGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.04, 16);
    this.sealMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x00f0ff,
      emissiveIntensity: 0.8,
      metalness: 0.9,
      roughness: 0.1
    });
    this.sealMesh = new THREE.Mesh(sealGeo, this.sealMat);
    this.sealMesh.rotation.x = Math.PI / 2;
    this.sealMesh.position.set(0, -0.45, 0.03);
    this.flapHinge.add(this.sealMesh);

    this.envelopeGroup.add(this.flapHinge);

    // Inner Letter Paper (visible when flap unfolds)
    const paperGeo = new THREE.PlaneGeometry(2.1, 1.3);
    this.paperMat = new THREE.MeshStandardMaterial({
      color: 0xe8f0fe,
      roughness: 0.8,
      metalness: 0.1,
      side: THREE.DoubleSide
    });
    this.paperMesh = new THREE.Mesh(paperGeo, this.paperMat);
    this.paperMesh.position.set(0, 0, 0.01);
    this.envelopeGroup.add(this.paperMesh);

    this.scene.add(this.envelopeGroup);
  }

  buildScannerRing() {
    this.scannerGroup = new THREE.Group();

    // Torus scanner emitter
    const ringGeo = new THREE.TorusGeometry(1.9, 0.025, 16, 64);
    this.ringMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.7
    });
    this.scannerRing = new THREE.Mesh(ringGeo, this.ringMat);
    this.scannerRing.rotation.x = Math.PI / 2;
    this.scannerGroup.add(this.scannerRing);

    // Glowing Laser Scan Plane
    const planeGeo = new THREE.PlaneGeometry(3.6, 0.06);
    this.laserMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide
    });
    this.laserPlane = new THREE.Mesh(planeGeo, this.laserMat);
    this.laserPlane.rotation.x = Math.PI / 2;
    this.scannerGroup.add(this.laserPlane);

    this.scene.add(this.scannerGroup);
  }

  buildHazardShield() {
    // Hexagonal / Icosahedral Hazard Forcefield
    const shieldGeo = new THREE.IcosahedronGeometry(2.3, 1);
    this.shieldMat = new THREE.MeshStandardMaterial({
      color: 0xff2a5f,
      emissive: 0xff2a5f,
      emissiveIntensity: 0.6,
      wireframe: true,
      transparent: true,
      opacity: 0.0
    });
    this.hazardShield = new THREE.Mesh(shieldGeo, this.shieldMat);
    this.scene.add(this.hazardShield);
  }

  buildParticles() {
    const particleCount = 400;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 8;
      positions[i + 1] = (Math.random() - 0.5) * 6;
      positions[i + 2] = (Math.random() - 0.5) * 6;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.particleMat = new THREE.PointsMaterial({
      color: 0x00f0ff,
      size: 0.035,
      transparent: true,
      opacity: 0.45
    });

    this.particles = new THREE.Points(geometry, this.particleMat);
    this.scene.add(this.particles);
  }

  setupInteractivity() {
    this.container.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.prevMousePos = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    this.container.addEventListener('mousemove', (e) => {
      if (this.isDragging) {
        const deltaX = e.clientX - this.prevMousePos.x;
        const deltaY = e.clientY - this.prevMousePos.y;
        this.targetRotY += deltaX * 0.008;
        this.targetRotX += deltaY * 0.008;
        this.prevMousePos = { x: e.clientX, y: e.clientY };
      } else {
        const rect = this.container.getBoundingClientRect();
        this.mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouseY = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      }
    });

    // Touch support for mobile devices
    this.container.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        this.isDragging = true;
        this.prevMousePos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    });

    this.container.addEventListener('touchmove', (e) => {
      if (this.isDragging && e.touches.length === 1) {
        const deltaX = e.touches[0].clientX - this.prevMousePos.x;
        const deltaY = e.touches[0].clientY - this.prevMousePos.y;
        this.targetRotY += deltaX * 0.008;
        this.targetRotX += deltaY * 0.008;
        this.prevMousePos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    });

    window.addEventListener('touchend', () => {
      this.isDragging = false;
    });
  }

  setState(newState) {
    this.state = newState;
    const hudBadge = document.getElementById('hud-state-badge');

    if (newState === 'idle') {
      this.targetColor.copy(this.colors.idle);
      this.targetFlapAngle = 0;
      this.targetPaperY = 0;
      this.shieldMat.opacity = 0;
      if (hudBadge) {
        hudBadge.className = 'state-badge';
        hudBadge.textContent = 'SCANNER IDLE // READY';
      }
    } else if (newState === 'scanning') {
      this.targetColor.copy(this.colors.scanning);
      this.targetFlapAngle = 0;
      this.targetPaperY = 0;
      this.shieldMat.opacity = 0;
      if (hudBadge) {
        hudBadge.className = 'state-badge scanning';
        hudBadge.textContent = 'NEURAL SCAN IN PROGRESS...';
      }
    } else if (newState === 'ham') {
      this.targetColor.copy(this.colors.ham);
      this.targetFlapAngle = -Math.PI * 0.78; // Flap opens fully
      this.targetPaperY = 0.55; // Paper rises out of envelope
      this.shieldMat.opacity = 0;
      if (hudBadge) {
        hudBadge.className = 'state-badge ham';
        hudBadge.textContent = 'STATUS: VERIFIED HAM (LEGITIMATE)';
      }
    } else if (newState === 'spam') {
      this.targetColor.copy(this.colors.spam);
      this.targetFlapAngle = 0; // Flap slammed locked
      this.targetPaperY = 0;
      this.shieldMat.opacity = 0.65; // Deploy hazard shield
      if (hudBadge) {
        hudBadge.className = 'state-badge spam';
        hudBadge.textContent = 'SECURITY ALERT: MALICIOUS SPAM DETECTED!';
      }
    }
  }

  onResize() {
    if (!this.container) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    this.time += 0.02;

    // Smooth color interpolation
    this.currentColor.lerp(this.targetColor, 0.08);
    this.edgesMat.color.copy(this.currentColor);
    this.ringMat.color.copy(this.currentColor);
    this.laserMat.color.copy(this.currentColor);
    this.sealMat.color.copy(this.currentColor);
    this.sealMat.emissive.copy(this.currentColor);
    this.scannerLight.color.copy(this.currentColor);

    // Smooth flap and paper animation
    this.currentFlapAngle += (this.targetFlapAngle - this.currentFlapAngle) * 0.08;
    this.flapHinge.rotation.x = this.currentFlapAngle;

    this.currentPaperY += (this.targetPaperY - this.currentPaperY) * 0.08;
    this.paperMesh.position.y = this.currentPaperY;

    // Laser plane vertical scan motion
    const scanSpeed = this.state === 'scanning' ? 4.5 : 1.5;
    const scanY = Math.sin(this.time * scanSpeed) * 0.9;
    this.scannerGroup.position.y = scanY;

    // Envelope hovering and interactive orientation
    if (this.state === 'scanning') {
      this.envelopeGroup.rotation.y += 0.05;
      this.envelopeGroup.position.y = Math.sin(this.time * 3) * 0.12;
    } else {
      // Gentle floating bob
      this.envelopeGroup.position.y = Math.sin(this.time * 1.5) * 0.08;
      
      // Interpolate rotation toward user drag or subtle mouse tilt
      const passiveRotY = Math.sin(this.time * 0.8) * 0.15;
      this.envelopeGroup.rotation.y += (this.targetRotY + this.mouseX * 0.4 + passiveRotY - this.envelopeGroup.rotation.y) * 0.06;
      this.envelopeGroup.rotation.x += (this.targetRotX - this.mouseY * 0.3 - this.envelopeGroup.rotation.x) * 0.06;
    }

    // Hazard shield animation
    if (this.state === 'spam') {
      this.hazardShield.rotation.y += 0.015;
      this.hazardShield.rotation.x += 0.01;
      this.hazardShield.scale.setScalar(1.0 + Math.sin(this.time * 6) * 0.03);
    }

    // Particle field slow orbit
    this.particles.rotation.y = this.time * 0.03;

    this.renderer.render(this.scene, this.camera);
  }
}

// Global instance holder
window.scanner3D = null;

function init3DScene(containerId) {
  if (typeof THREE === 'undefined') {
    console.error('Three.js library is not loaded.');
    return;
  }
  window.scanner3D = new HolographicScanner3D(containerId);
}
