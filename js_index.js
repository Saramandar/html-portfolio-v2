/* =========================
   Loading screen
   ========================= */
(function () {
  const loader = document.querySelector('.site-loader');
  if (!loader) return;

  const loaderKey = 'abinasLoaderShown';
  const getLoaderShown = () => {
    try {
      return window.sessionStorage.getItem(loaderKey) === '1';
    } catch (_) {
      return false;
    }
  };
  const setLoaderShown = () => {
    try {
      window.sessionStorage.setItem(loaderKey, '1');
    } catch (_) {}
  };
  const revealPortal = () => {
    window.setTimeout(() => {
      document.body.classList.add('portal-ready');
    }, 80);
  };

  if (getLoaderShown()) {
    loader.remove();
    document.body.classList.remove('has-loader');
    document.body.classList.add('is-loaded');
    revealPortal();
    return;
  }

  const fill = loader.querySelector('.loader-bar-fill');
  const percent = loader.querySelector('.loader-percent');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let progress = 0;
  let completed = false;
  const startedAt = Date.now();
  const minDisplayTime = reducedMotion ? 700 : 8000;
  const progressDelay = reducedMotion ? 120 : 3300;

  const setProgress = (value) => {
    progress = Math.max(progress, Math.min(100, Math.round(value)));
    loader.style.setProperty('--loader-progress', `${progress}%`);
    if (fill) fill.style.width = `${progress}%`;
    if (percent) percent.textContent = `${String(progress).padStart(2, '0')}%`;
  };

  const interval = window.setInterval(() => {
    if (completed) return;
    const elapsed = Math.max(0, Date.now() - startedAt - progressDelay);
    const progressDuration = Math.max(1, minDisplayTime - progressDelay);
    const ratio = Math.min(elapsed / progressDuration, 0.96);
    const eased = 1 - Math.pow(1 - ratio, 2.4);
    setProgress(Math.min(94, 3 + eased * 91));
  }, reducedMotion ? 90 : 180);

  const finish = () => {
    if (completed) return;
    completed = true;
    window.clearInterval(interval);
    setProgress(100);
    const delay = reducedMotion ? 80 : 520;
    window.setTimeout(() => {
      loader.classList.add('is-complete');
      document.body.classList.remove('has-loader');
      document.body.classList.add('is-loaded');
      setLoaderShown();
      revealPortal();
    }, delay);
    window.setTimeout(() => {
      loader.remove();
    }, delay + 900);
  };

  const requestFinish = () => {
    const remaining = Math.max(0, minDisplayTime - (Date.now() - startedAt));
    window.setTimeout(finish, remaining);
  };

  window.addEventListener('load', requestFinish, { once: true });
  window.setTimeout(finish, 9800);
  setProgress(3);
})();

/* =========================
   Orb entry menu
   ========================= */
(async function () {
  const portal = document.querySelector('.portal-menu');
  const canvas = document.querySelector('.portal-orb-canvas');
  const link = document.querySelector('[data-portal-link]');
  const description = document.querySelector('[data-portal-description]');
  const prev = document.querySelector('.portal-arrow-prev');
  const next = document.querySelector('.portal-arrow-next');
  if (!portal || !canvas || !link || !description || !prev || !next) return;

  const items = [
    {
      label: 'About Me',
      href: '#about',
      description: 'Enter the personal portfolio overview.',
      color: 0xd6b56d,
      accent: 0x17120d,
      image: './assets/profile_picture v3.jpg'
    },
    {
      label: 'Skillset',
      href: '#skillset',
      description: 'Explore the tools, systems and capabilities behind the work.',
      color: 0xcaa15a,
      accent: 0x5f431e,
      image: './assets/portal_images/skillset-tech.jpg'
    },
    {
      label: 'Work Experience',
      href: '#experience',
      description: 'Move through the professional timeline and selected roles.',
      color: 0xe2c982,
      accent: 0x2a2014,
      image: './assets/portal_images/work-coding.jpg'
    },
    {
      label: 'Projects',
      href: '#projects',
      description: 'View selected pieces, builds and applied concepts.',
      color: 0xb88736,
      accent: 0x11100e,
      image: './assets/portal_images/projects-studio.jpg'
    }
  ];

  let activeIndex = 0;
  let setOrbState = () => {};
  let isRevealingAbout = false;
  let refreshPortalScene = () => {};

  const revealAbout = (target = '#about') => {
    if (isRevealingAbout) return;
    isRevealingAbout = true;
    document.body.classList.add('portal-warp', 'portal-docking');

    window.setTimeout(() => {
      document.body.classList.remove('has-portal');
      document.body.classList.add('portal-entered', 'about-warping');
      window.scrollTo({ top: 0, behavior: 'auto' });
    }, 1120);

    window.setTimeout(() => {
      const targetElement = document.querySelector(target);
      if (targetElement && target !== '#about') {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      document.body.classList.remove('portal-warp', 'portal-docking', 'about-warping');
      isRevealingAbout = false;
    }, 2140);
  };

  const renderItem = () => {
    const item = items[activeIndex];
    link.textContent = item.label;
    link.href = item.href;
    description.textContent = item.description;
    setOrbState(item);
  };

  const move = (direction) => {
    activeIndex = (activeIndex + direction + items.length) % items.length;
    renderItem();
  };

  prev.addEventListener('click', () => move(-1));
  next.addEventListener('click', () => move(1));

  portal.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') move(-1);
    if (event.key === 'ArrowRight') move(1);
  });

  link.addEventListener('click', (event) => {
    event.preventDefault();
    revealAbout(items[activeIndex].href);
  });

  try {
    const THREE = await import('./assets/vendor/three/three.module.js');
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2.5));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0, 7.35);

    const group = new THREE.Group();
    scene.add(group);

    const loadEarthPolygons = async () => {
      try {
        const response = await fetch('./assets/vendor/natural-earth/ne_110m_land.polygons.json');
        if (!response.ok) return null;
        const data = await response.json();
        return Array.isArray(data.polygons) ? data.polygons : null;
      } catch (_) {
        return null;
      }
    };

    const fallbackEarthPolygons = [
      [[71,-168],[70,-145],[60,-132],[54,-124],[49,-123],[43,-117],[34,-119],[26,-112],[22,-101],[15,-96],[8,-82],[12,-72],[22,-77],[29,-82],[31,-91],[38,-100],[49,-94],[55,-80],[50,-67],[45,-61],[31,-81],[25,-97],[19,-104],[26,-113],[37,-122],[50,-132],[58,-152]],
      [[13,-81],[8,-76],[5,-78],[2,-75],[-5,-79],[-13,-76],[-22,-71],[-34,-70],[-50,-73],[-56,-68],[-54,-58],[-45,-53],[-32,-51],[-22,-44],[-10,-39],[-3,-45],[-12,-55],[-8,-67],[1,-72],[8,-78]],
      [[37,-10],[44,1],[50,18],[55,37],[54,56],[47,71],[40,78],[31,74],[27,58],[22,45],[15,39],[5,43],[-4,38],[-11,32],[-19,19],[-29,17],[-35,22],[-35,10],[-28,1],[-12,-8],[6,-5],[20,-7],[31,-9]],
      [[36,-7],[32,4],[31,16],[26,25],[19,33],[10,42],[0,49],[-11,45],[-23,36],[-34,26],[-35,16],[-29,7],[-14,4],[-4,0],[10,-4],[23,-8]],
      [[56,43],[61,57],[61,77],[55,92],[49,113],[43,128],[35,139],[25,121],[17,106],[19,88],[27,73],[39,58]],
      [[31,66],[21,78],[12,86],[5,96],[-3,104],[-8,116],[-18,123],[-26,134],[-38,145],[-43,157],[-35,168],[-23,155],[-15,141],[-8,128],[5,119],[16,105],[25,91]],
      [[-63,-74],[-68,-42],[-73,0],[-70,58],[-65,112],[-70,160],[-79,180],[-81,-162],[-75,-112]]
    ];

    const earthPolygons = await loadEarthPolygons();

    const makeEarthTexture = (landPolygons = fallbackEarthPolygons) => {
      const width = 3072;
      const height = 1536;
      const mapCanvas = document.createElement('canvas');
      mapCanvas.width = width;
      mapCanvas.height = height;
      const ctx = mapCanvas.getContext('2d');
      ctx.clearRect(0, 0, width, height);

      const project = (lat, lon) => [
        ((lon + 180) / 360) * width,
        ((90 - lat) / 180) * height
      ];

      const drawPath = (coords, fill = true) => {
        ctx.beginPath();
        coords.forEach(([lat, lon], index) => {
          const [x, y] = project(lat, lon);
          if (index === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.closePath();
        if (fill) ctx.fill();
        ctx.stroke();
      };

      ctx.strokeStyle = 'rgba(120, 86, 34, 0.18)';
      ctx.lineWidth = 1.2;
      for (let lat = -60; lat <= 60; lat += 20) {
        ctx.beginPath();
        for (let lon = -180; lon <= 180; lon += 4) {
          const [x, y] = project(lat, lon);
          if (lon === -180) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      for (let lon = -150; lon <= 180; lon += 30) {
        ctx.beginPath();
        for (let lat = -82; lat <= 82; lat += 3) {
          const [x, y] = project(lat, lon);
          if (lat === -82) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      ctx.fillStyle = 'rgba(204, 168, 89, 0.76)';
      ctx.strokeStyle = 'rgba(48, 34, 16, 0.92)';
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.lineWidth = 3.8;
      landPolygons.forEach((continent) => drawPath(continent));

      ctx.globalCompositeOperation = 'screen';
      const glow = ctx.createRadialGradient(width * 0.52, height * 0.45, 80, width * 0.52, height * 0.45, width * 0.55);
      glow.addColorStop(0, 'rgba(255, 244, 205, 0.24)');
      glow.addColorStop(1, 'rgba(255, 244, 205, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);

      const texture = new THREE.CanvasTexture(mapCanvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.wrapS = THREE.RepeatWrapping;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
      return texture;
    };

    const sphereGeometry = new THREE.SphereGeometry(1.72, 96, 56);
    const earthMaterial = new THREE.MeshBasicMaterial({
      map: makeEarthTexture(earthPolygons || fallbackEarthPolygons),
      transparent: true,
      opacity: 0.96,
      depthWrite: false,
      blending: THREE.NormalBlending
    });
    const globe = new THREE.Mesh(sphereGeometry, earthMaterial);
    group.add(globe);

    const earthLineMaterial = new THREE.LineBasicMaterial({
      color: items[0].color,
      transparent: true,
      opacity: 0.2
    });
    const earthLines = new THREE.Group();
    group.add(earthLines);

    const latLonToVector = (lat, lon, radius = 1.755) => {
      const phi = (90 - lat) * Math.PI / 180;
      const theta = (lon + 180) * Math.PI / 180;
      return new THREE.Vector3(
        -radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.sin(theta)
      );
    };

    const addGeoLine = (coords, closed = false) => {
      const points = coords.map(([lat, lon]) => latLonToVector(lat, lon));
      if (closed) points.push(points[0].clone());
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geometry, earthLineMaterial);
      earthLines.add(line);
    };

    for (let lat = -60; lat <= 60; lat += 30) {
      const coords = [];
      for (let lon = -180; lon <= 180; lon += 8) coords.push([lat, lon]);
      addGeoLine(coords);
    }

    for (let lon = -150; lon <= 180; lon += 45) {
      const coords = [];
      for (let lat = -78; lat <= 78; lat += 6) coords.push([lat, lon]);
      addGeoLine(coords);
    }

    const connectionMaterial = new THREE.MeshBasicMaterial({
      color: 0x315c58,
      transparent: true,
      opacity: 0.74,
      depthWrite: false
    });
    const connectionGroup = new THREE.Group();
    const connectionArcs = [];
    group.add(connectionGroup);

    const makeArc = (from, to, phase = 0) => {
      const start = latLonToVector(from[0], from[1], 1.82);
      const end = latLonToVector(to[0], to[1], 1.82);
      const points = [];
      const steps = 168;
      for (let i = 0; i <= steps; i += 1) {
        const progress = i / steps;
        const point = start.clone().lerp(end, progress).normalize();
        const lift = Math.sin(progress * Math.PI) * 0.42;
        point.multiplyScalar(1.88 + lift);
        points.push(point);
      }
      const arc = new THREE.Group();
      arc.userData = { phase, segments: [] };
      for (let i = 0; i < points.length - 1; i += 1) {
        const curve = new THREE.LineCurve3(points[i], points[i + 1]);
        const geometry = new THREE.TubeGeometry(curve, 2, 0.01, 8, false);
        const segment = new THREE.Mesh(geometry, connectionMaterial);
        segment.visible = false;
        arc.add(segment);
        arc.userData.segments.push(segment);
      }
      connectionGroup.add(arc);
      connectionArcs.push(arc);
    };

    const greeceHub = [37.98, 23.72];
    [
      { to: [21.31, -157.86], phase: 0 },
      { to: [40.71, -74.01], phase: .13 },
      { to: [-33.87, 151.21], phase: .26 },
      { to: [52.52, 13.4], phase: .39 },
      { to: [25.2, 55.27], phase: .52 },
      { to: [22.32, 114.17], phase: .65 },
      { to: [35.68, 139.69], phase: .78 }
    ].forEach(({ to, phase }) => makeArc(greeceHub, to, phase));

    const nodePositions = [
      greeceHub,
      [21.31, -157.86],
      [40.71, -74.01],
      [-33.87, 151.21],
      [52.52, 13.4],
      [25.2, 55.27],
      [22.32, 114.17],
      [35.68, 139.69]
    ];
    const nodeMaterial = new THREE.MeshBasicMaterial({
      color: 0x315c58,
      transparent: true,
      opacity: 0.9,
      depthWrite: false
    });
    const nodeGlowMaterial = new THREE.MeshBasicMaterial({
      color: 0xfff1bc,
      transparent: true,
      opacity: 0.34,
      depthWrite: false
    });
    const connectionNodes = [];
    nodePositions.forEach(([lat, lon], index) => {
      const node = new THREE.Group();
      const isHub = index === 0;
      const core = new THREE.Mesh(new THREE.SphereGeometry(isHub ? 0.056 : 0.038, 16, 12), nodeMaterial);
      const glow = new THREE.Mesh(new THREE.SphereGeometry(isHub ? 0.105 : 0.072, 16, 12), nodeGlowMaterial);
      node.add(glow, core);
      node.position.copy(latLonToVector(lat, lon, 1.94));
      connectionGroup.add(node);
      connectionNodes.push(node);
    });

    const ringMaterial = new THREE.MeshBasicMaterial({
      color: items[0].color,
      transparent: true,
      opacity: 0.36
    });
    const rings = new THREE.Group();
    [0, Math.PI / 3, -Math.PI / 3].forEach((rotation, index) => {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(1.92 + index * 0.08, 0.006, 12, 180),
        ringMaterial
      );
      ring.rotation.x = Math.PI / 2;
      ring.rotation.y = rotation;
      rings.add(ring);
    });
    group.add(rings);

    const pointsGeometry = new THREE.BufferGeometry();
    const pointCount = 160;
    const positions = new Float32Array(pointCount * 3);
    for (let i = 0; i < pointCount; i += 1) {
      const phi = Math.acos(1 - 2 * (i + 0.5) / pointCount);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      const radius = 1.74 + (i % 7) * 0.005;
      positions[i * 3] = Math.cos(theta) * Math.sin(phi) * radius;
      positions[i * 3 + 1] = Math.sin(theta) * Math.sin(phi) * radius;
      positions[i * 3 + 2] = Math.cos(phi) * radius;
    }
    pointsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const pointsMaterial = new THREE.PointsMaterial({
      color: items[0].color,
      size: 0.018,
      transparent: true,
      opacity: 0.12,
      depthWrite: false
    });
    const points = new THREE.Points(pointsGeometry, pointsMaterial);
    group.add(points);

    const textureLoader = new THREE.TextureLoader();
    const photoMaterial = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0,
      depthWrite: false,
      depthTest: false
    });
    const photoDisc = new THREE.Mesh(new THREE.CircleGeometry(1.32, 192), photoMaterial);
    photoDisc.position.set(0, 0, 0.18);
    photoDisc.renderOrder = 10;
    scene.add(photoDisc);

    const photoCache = new Map();
    const makePortalTexture = (src) =>
      new Promise((resolve) => {
        if (photoCache.has(src)) {
          resolve(photoCache.get(src));
          return;
        }
        textureLoader.load(src, (imageTexture) => {
          const textureImage = imageTexture.image;
          const size = 1280;
          const textureCanvas = document.createElement('canvas');
          textureCanvas.width = size;
          textureCanvas.height = size;
          const ctx = textureCanvas.getContext('2d');
          ctx.clearRect(0, 0, size, size);
          ctx.save();
          ctx.beginPath();
          ctx.arc(size / 2, size / 2, size * 0.44, 0, Math.PI * 2);
          ctx.clip();
          const scale = Math.max(size / textureImage.width, size / textureImage.height);
          const drawWidth = textureImage.width * scale;
          const drawHeight = textureImage.height * scale;
          ctx.drawImage(textureImage, (size - drawWidth) / 2, (size - drawHeight) / 2, drawWidth, drawHeight);
          ctx.globalCompositeOperation = 'source-atop';
          const gradient = ctx.createLinearGradient(0, 0, size, size);
          gradient.addColorStop(0, 'rgba(255, 245, 212, .22)');
          gradient.addColorStop(.5, 'rgba(214, 181, 109, .18)');
          gradient.addColorStop(1, 'rgba(18, 14, 8, .28)');
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, size, size);
          ctx.restore();
          ctx.beginPath();
          ctx.arc(size / 2, size / 2, size * 0.44, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(214,181,109,.72)';
          ctx.lineWidth = 5;
          ctx.stroke();
          const texture = new THREE.CanvasTexture(textureCanvas);
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.minFilter = THREE.LinearFilter;
          texture.magFilter = THREE.LinearFilter;
          texture.generateMipmaps = false;
          photoCache.set(src, texture);
          resolve(texture);
        }, undefined, () => resolve(null));
      });

    let targetPhotoOpacity = 0;
    let targetPhotoScale = 1;
    let targetGroupScale = 0.82;
    let targetGroupX = -1.5;
    let targetPhotoX = 1.5;
    let portalTextureRequest = 0;
    const wait = (duration) => new Promise((resolve) => window.setTimeout(resolve, duration));

    const getPairLayout = () => {
      const width = canvas.getBoundingClientRect().width;
      if (width < 430) {
        return { groupScale: 1, photoScale: 1, x: 0, photoRadius: 0.98 };
      }
      return { groupScale: 0.86, photoScale: 0.98, x: 2.05, photoRadius: 1.46 };
    };

    setOrbState = async (item) => {
      const requestId = ++portalTextureRequest;
      const layout = getPairLayout();
      targetPhotoOpacity = 0;
      targetPhotoScale = Math.max(layout.photoScale - 0.08, 0.82);
      ringMaterial.color.setHex(item.color);
      pointsMaterial.color.setHex(item.color);
      earthLineMaterial.color.setHex(item.color);
      earthMaterial.opacity = 0.94;
      ringMaterial.opacity = 0.5;
      earthLineMaterial.opacity = 0.3;
      pointsMaterial.opacity = 0.16;
      pointsMaterial.size = 0.022;
      const [texture] = await Promise.all([
        makePortalTexture(item.image),
        wait(260)
      ]);
      if (requestId !== portalTextureRequest) return;
      if (texture) photoMaterial.map = texture;
      targetPhotoOpacity = texture ? 0.86 : 0;
      targetPhotoScale = layout.photoScale;
      targetGroupScale = layout.groupScale;
      targetGroupX = -layout.x;
      targetPhotoX = layout.x;
      photoDisc.geometry.dispose();
      photoDisc.geometry = new THREE.CircleGeometry(layout.photoRadius, 128);
      photoMaterial.needsUpdate = true;
    };

    let resizeFrame = 0;
    let lastCanvasWidth = 0;
    let lastCanvasHeight = 0;

    const resize = (options = {}) => {
      const rect = canvas.getBoundingClientRect();
      const width = Math.round(rect.width);
      const height = Math.round(rect.height);
      if (width < 2 || height < 2) return false;

      const force = Boolean(options.force);
      const instant = Boolean(options.instant);
      if (!force && width === lastCanvasWidth && height === lastCanvasHeight) return true;

      lastCanvasWidth = width;
      lastCanvasHeight = height;
      renderer.setSize(width, height, false);
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      const layout = getPairLayout();
      targetPhotoScale = layout.photoScale;
      targetGroupScale = layout.groupScale;
      targetGroupX = -layout.x;
      targetPhotoX = layout.x;
      photoDisc.geometry.dispose();
      photoDisc.geometry = new THREE.CircleGeometry(layout.photoRadius, 128);
      if (instant) {
        group.position.x = targetGroupX;
        group.scale.setScalar(targetGroupScale);
        photoDisc.position.x = targetPhotoX;
        photoDisc.scale.setScalar(targetPhotoScale);
      }
      renderer.render(scene, camera);
      return true;
    };

    const scheduleResize = (options = {}) => {
      window.cancelAnimationFrame(resizeFrame);
      resizeFrame = window.requestAnimationFrame(() => {
        const resized = resize(options);
        if (!resized) {
          window.setTimeout(() => scheduleResize(options), 80);
        }
      });
    };
    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('orientationchange', () => {
      scheduleResize({ force: true, instant: true });
      window.setTimeout(() => scheduleResize({ force: true, instant: true }), 260);
    });

    if ('ResizeObserver' in window) {
      const portalResizeObserver = new ResizeObserver(() => {
        scheduleResize({ force: true });
      });
      portalResizeObserver.observe(portal);
      portalResizeObserver.observe(canvas);
    }

    refreshPortalScene = () => {
      isRevealingAbout = false;
      if (isDraggingGlobe) {
        isDraggingGlobe = false;
        canvas.classList.remove('is-dragging');
      }
      photoMaterial.opacity = 0;
      targetPhotoOpacity = 0;
      renderItem();
      scheduleResize({ force: true, instant: true });
      window.setTimeout(() => scheduleResize({ force: true, instant: true }), 120);
      window.setTimeout(() => scheduleResize({ force: true }), 520);
      window.setTimeout(() => scheduleResize({ force: true }), 1200);
    };

    window.addEventListener('portfolio:portal-reset', refreshPortalScene);
    window.addEventListener('pageshow', () => scheduleResize({ force: true, instant: true }));

    let globeRotationY = -0.42;
    let globeRotationX = 0;
    let lastFrameTime = 0;
    let isDraggingGlobe = false;
    let lastDragX = 0;
    let lastDragY = 0;

    const isDesktopPortal = () => canvas.getBoundingClientRect().width >= 430;

    canvas.addEventListener('pointerdown', (event) => {
      if (!isDesktopPortal()) return;
      isDraggingGlobe = true;
      lastDragX = event.clientX;
      lastDragY = event.clientY;
      canvas.classList.add('is-dragging');
      canvas.setPointerCapture?.(event.pointerId);
      event.preventDefault();
    });

    canvas.addEventListener('pointermove', (event) => {
      if (!isDraggingGlobe) return;
      const deltaX = event.clientX - lastDragX;
      const deltaY = event.clientY - lastDragY;
      lastDragX = event.clientX;
      lastDragY = event.clientY;
      globeRotationY += deltaX * 0.006;
      globeRotationX = Math.max(-0.55, Math.min(0.55, globeRotationX + deltaY * 0.003));
    });

    const stopGlobeDrag = (event) => {
      if (!isDraggingGlobe) return;
      isDraggingGlobe = false;
      canvas.classList.remove('is-dragging');
      canvas.releasePointerCapture?.(event.pointerId);
    };

    canvas.addEventListener('pointerup', stopGlobeDrag);
    canvas.addEventListener('pointercancel', stopGlobeDrag);
    canvas.addEventListener('lostpointercapture', () => {
      isDraggingGlobe = false;
      canvas.classList.remove('is-dragging');
    });

    const animate = (time) => {
      const t = time * 0.001;
      const delta = lastFrameTime ? Math.min(0.05, t - lastFrameTime) : 0;
      lastFrameTime = t;
      resize();
      group.position.x += (targetGroupX - group.position.x) * 0.08;
      const nextGroupScale = group.scale.x + (targetGroupScale - group.scale.x) * 0.08;
      group.scale.setScalar(nextGroupScale);
      if (!isDraggingGlobe) globeRotationY += delta * 0.16;
      group.rotation.y = globeRotationY;
      group.rotation.x += (globeRotationX - group.rotation.x) * 0.1;
      globe.rotation.x = Math.sin(t * 0.5) * 0.08;
      rings.rotation.z = t * 0.05;
      connectionArcs.forEach((arc) => {
        const cycle = (t * 0.26 + arc.userData.phase) % 1;
        const progress = cycle < 0.78 ? cycle / 0.78 : 1;
        const eased = 1 - Math.pow(1 - progress, 3);
        const visibleCount = Math.floor(arc.userData.segments.length * eased);
        arc.userData.segments.forEach((segment, index) => {
          segment.visible = index <= visibleCount;
        });
      });
      const nodePulse = 1 + Math.sin(t * 2.6) * 0.12;
      connectionNodes.forEach((node) => {
        node.scale.setScalar(nodePulse);
      });
      nodeMaterial.opacity = 0.82 + Math.sin(t * 2.4) * 0.12;
      photoMaterial.opacity += (targetPhotoOpacity - photoMaterial.opacity) * 0.08;
      photoDisc.position.x += (targetPhotoX - photoDisc.position.x) * 0.08;
      const currentScale = photoDisc.scale.x + (targetPhotoScale - photoDisc.scale.x) * 0.08;
      photoDisc.scale.setScalar(currentScale);
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };
    renderItem();
    animate(0);
  } catch (error) {
    console.warn('[PORTAL ORB] Three.js unavailable:', error);
    renderItem();
  }
})();

/* =========================
   Floating globe navigation
   ========================= */
(function () {
  const nav = document.querySelector('.orb-nav-v2');
  const toggle = document.querySelector('.orb-nav-toggle');
  const panel = document.getElementById('orbNavPanel');
  if (!nav || !toggle || !panel) return;

  const closeNav = () => {
    nav.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
  };

  toggle.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(isOpen));
  });

  document.addEventListener('click', (event) => {
    if (!nav.contains(event.target)) closeNav();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeNav();
  });

  const returnToStartingPoint = () => {
    closeNav();
    document.body.classList.remove('portal-ready', 'portal-warp', 'portal-docking', 'about-warping');
    document.body.classList.add('section-warping');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    window.setTimeout(() => {
      document.body.classList.remove('portal-entered', 'section-warping');
      document.body.classList.add('has-portal');
      window.scrollTo({ top: 0, behavior: 'auto' });
      window.dispatchEvent(new CustomEvent('portfolio:portal-reset'));
      window.requestAnimationFrame(() => {
        document.body.classList.add('portal-ready');
        window.dispatchEvent(new CustomEvent('portfolio:portal-reset'));
      });
    }, 520);
  };

  const startLink = panel.querySelector('[data-starting-point]');
  startLink?.addEventListener('click', (event) => {
    event.preventDefault();
    returnToStartingPoint();
  });

  panel.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (event) => {
      if (anchor.matches('[data-starting-point]')) return;
      const target = document.querySelector(anchor.getAttribute('href'));
      if (!target) return;
      event.preventDefault();
      closeNav();
      panel.querySelectorAll('a').forEach((link) => link.classList.remove('active'));
      anchor.classList.add('active');
      document.body.classList.add('section-warping');
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      window.setTimeout(() => {
        document.body.classList.remove('section-warping');
      }, 760);
    });
  });

  const sectionLinks = [...panel.querySelectorAll('a[href^="#"]:not([data-starting-point])')];
  const updateActiveLink = (id) => {
    sectionLinks.forEach((link) => {
      link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
    });
  };

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible?.target?.id) updateActiveLink(visible.target.id);
    }, { threshold: [0.28, 0.46, 0.64] });

    ['about', 'skillset', 'experience', 'projects'].forEach((id) => {
      const section = document.getElementById(id);
      if (section) observer.observe(section);
    });
  }

  const miniCanvas = document.querySelector('.orb-nav-mini-canvas');
  if (!miniCanvas) return;

  const fallbackPolygons = [
    [[71,-168],[70,-145],[60,-132],[54,-124],[49,-123],[43,-117],[34,-119],[26,-112],[22,-101],[15,-96],[8,-82],[12,-72],[22,-77],[29,-82],[31,-91],[38,-100],[49,-94],[55,-80],[50,-67],[45,-61],[31,-81],[25,-97],[19,-104],[26,-113],[37,-122],[50,-132],[58,-152]],
    [[13,-81],[8,-76],[5,-78],[2,-75],[-5,-79],[-13,-76],[-22,-71],[-34,-70],[-50,-73],[-56,-68],[-54,-58],[-45,-53],[-32,-51],[-22,-44],[-10,-39],[-3,-45],[-12,-55],[-8,-67],[1,-72],[8,-78]],
    [[37,-10],[44,1],[50,18],[55,37],[54,56],[47,71],[40,78],[31,74],[27,58],[22,45],[15,39],[5,43],[-4,38],[-11,32],[-19,19],[-29,17],[-35,22],[-35,10],[-28,1],[-12,-8],[6,-5],[20,-7],[31,-9]],
    [[36,-7],[32,4],[31,16],[26,25],[19,33],[10,42],[0,49],[-11,45],[-23,36],[-34,26],[-35,16],[-29,7],[-14,4],[-4,0],[10,-4],[23,-8]],
    [[56,43],[61,57],[61,77],[55,92],[49,113],[43,128],[35,139],[25,121],[17,106],[19,88],[27,73],[39,58]],
    [[31,66],[21,78],[12,86],[5,96],[-3,104],[-8,116],[-18,123],[-26,134],[-38,145],[-43,157],[-35,168],[-23,155],[-15,141],[-8,128],[5,119],[16,105],[25,91]],
    [[-63,-74],[-68,-42],[-73,0],[-70,58],[-65,112],[-70,160],[-79,180],[-81,-162],[-75,-112]]
  ];

  const drawMiniGlobe = async () => {
    const context = miniCanvas.getContext('2d');
    if (!context) return;
    let polygons = fallbackPolygons;

    try {
      const response = await fetch('./assets/vendor/natural-earth/ne_110m_land.polygons.json');
      const data = await response.json();
      if (Array.isArray(data.polygons)) polygons = data.polygons;
    } catch (_) {}

    const resize = () => {
      const rect = miniCanvas.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2.5);
      miniCanvas.width = Math.max(1, Math.floor(rect.width * ratio));
      miniCanvas.height = Math.max(1, Math.floor(rect.height * ratio));
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const project = (lat, lon, centerLon, radius, cx, cy) => {
      const phi = lat * Math.PI / 180;
      const lambda = (lon - centerLon) * Math.PI / 180;
      const x = Math.cos(phi) * Math.sin(lambda);
      const y = Math.sin(phi);
      const z = Math.cos(phi) * Math.cos(lambda);
      if (z <= -0.04) return null;
      return [cx + x * radius, cy - y * radius, z];
    };

    const drawLineSet = (coords, centerLon, radius, cx, cy, closePath = false) => {
      let active = false;
      let visibleCount = 0;
      context.beginPath();
      coords.forEach(([lat, lon]) => {
        const point = project(lat, lon, centerLon, radius, cx, cy);
        if (!point) {
          active = false;
          return;
        }
        if (!active) {
          context.moveTo(point[0], point[1]);
          active = true;
        } else {
          context.lineTo(point[0], point[1]);
        }
        visibleCount += 1;
      });
      if (closePath && visibleCount > 4) context.closePath();
      if (visibleCount > 1) {
        if (closePath) context.fill();
        context.stroke();
      }
    };

    const draw = (time) => {
      const rect = miniCanvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      const size = Math.min(width, height);
      const cx = width / 2;
      const cy = height / 2;
      const radius = size * 0.43;
      const centerLon = (time * 0.018) % 360;

      context.clearRect(0, 0, width, height);
      context.save();
      context.beginPath();
      context.arc(cx, cy, radius, 0, Math.PI * 2);
      context.clip();

      const sea = context.createRadialGradient(cx - radius * .35, cy - radius * .42, 1, cx, cy, radius * 1.18);
      sea.addColorStop(0, 'rgba(255, 248, 232, .92)');
      sea.addColorStop(.42, 'rgba(214, 181, 109, .30)');
      sea.addColorStop(1, 'rgba(14, 12, 10, .96)');
      context.fillStyle = sea;
      context.fillRect(0, 0, width, height);

      context.strokeStyle = 'rgba(255, 241, 188, .32)';
      context.lineWidth = 0.65;
      for (let lat = -60; lat <= 60; lat += 30) {
        const coords = [];
        for (let lon = -180; lon <= 180; lon += 5) coords.push([lat, lon]);
        drawLineSet(coords, centerLon, radius, cx, cy);
      }
      for (let lon = -150; lon <= 180; lon += 30) {
        const coords = [];
        for (let lat = -82; lat <= 82; lat += 5) coords.push([lat, lon]);
        drawLineSet(coords, centerLon, radius, cx, cy);
      }

      context.fillStyle = 'rgba(214, 181, 109, .82)';
      context.strokeStyle = 'rgba(255, 248, 232, .76)';
      context.lineWidth = 0.8;
      polygons.forEach((coords) => drawLineSet(coords, centerLon, radius, cx, cy, true));

      context.restore();
      context.beginPath();
      context.arc(cx, cy, radius, 0, Math.PI * 2);
      context.strokeStyle = 'rgba(255, 241, 188, .88)';
      context.lineWidth = 1.1;
      context.stroke();
      context.beginPath();
      context.ellipse(cx, cy, radius * .96, radius * .36, 0, 0, Math.PI * 2);
      context.strokeStyle = 'rgba(49, 92, 88, .48)';
      context.lineWidth = .9;
      context.stroke();

      requestAnimationFrame(draw);
    };
    draw(0);
  };

  drawMiniGlobe();
})();

document.addEventListener('click', (event) => {
  const anchor = event.target.closest('a[href^="#"]');
  if (!anchor || anchor.closest('.portal-menu') || anchor.closest('.orb-nav-panel')) return;
  const target = document.querySelector(anchor.getAttribute('href'));
  if (!target || document.body.classList.contains('has-portal')) return;
  event.preventDefault();
  document.body.classList.add('section-warping');
  target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  window.setTimeout(() => {
    document.body.classList.remove('section-warping');
  }, 760);
});

/* =========================
   Auto-close mobile menu
   ========================= */
document.addEventListener('click', function (e) {
  const link = e.target.closest('#mobileMenu a.nav-link');
  if (!link) return;

  const menu = document.getElementById('mobileMenu');
  if (!menu) return;

  // Requires Bootstrap JS bundle loaded in HTML before this file
  const c = bootstrap.Collapse.getOrCreateInstance(menu);
  c.hide();
});

/* =========================
   Fade-in on load + bfcache
   ========================= */
function enableFade() {
  // ensure we paint once at opacity:0 before switching to 1
  requestAnimationFrame(() => {
    document.body.classList.add('is-loaded');
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', enableFade);
} else {
  enableFade();
}

// Handle back/forward cache restores
window.addEventListener('pageshow', (e) => {
  if (e.persisted) enableFade();
});

/* =========================
   Video resilience (bfcache/WebKit quirks) + button
   ========================= */
(function () {
  const video = document.querySelector('.hp-stage-video');
  const button = document.querySelector('.hp-toggle-btn');
  if (!video || !button) return;

  // Remember if the user explicitly paused
  const setUserPaused = (v) =>
    v ? (button.dataset.userPaused = '1') : delete button.dataset.userPaused;
  const userPaused = () => button.dataset.userPaused === '1';

  // Cache the actual source URL (from <video src>, <source>, or currentSrc)
  const getSrc = () => {
    const s = video.getAttribute('src');
    if (s) return s;
    const child = video.querySelector('source');
    if (child && child.src) return child.src;
    if (video.currentSrc) return video.currentSrc;
    return '';
  };
  const baseSrc = getSrc();

  const setUI = (playing) => {
    button.textContent = playing ? '⏸' : '▶';
    button.title = playing ? 'Pause' : 'Play';
    button.setAttribute(
      'aria-label',
      playing ? 'Pause background video' : 'Play background video'
    );
    button.setAttribute('aria-pressed', (!playing).toString());
  };

  const tryPlay = () =>
    video
      .play()
      .then(() => setUI(true))
      .catch((e) => {
        setUI(false);
        console.warn('[HERO VIDEO] play() rejected:', e?.name || e);
      });

  // Hard reload the media pipeline (for bfcache / WebKit quirks)
  const hardResume = () => {
    if (userPaused()) return; // don't override user's pause

    // Ensure autoplay conditions
    video.muted = true;
    video.playsInline = true; // for Safari/iOS
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');

    try {
      const src = baseSrc || getSrc();

      // Full reset: drop src, load, then reassign and play
      video.pause();
      video.removeAttribute('src');

      // Remove any <source> children to avoid stale states
      const sources = video.querySelectorAll('source');
      sources.forEach((n) => n.parentNode.removeChild(n));
      video.load();

      // Reassign source directly to <video> (more reliable than <source> after bfcache)
      if (src) video.src = src;

      // Tiny nudge for Safari to wake decoders
      setTimeout(() => {
        try {
          video.currentTime = (video.currentTime || 0) + 0.001;
        } catch (_) {}
        tryPlay();
      }, 60);
    } catch (e) {
      console.warn('[HERO VIDEO] hardResume failed:', e);
      tryPlay();
    }
  };

  // Initial autoplay
  if (video.muted && (video.autoplay || video.getAttribute('autoplay') !== null)) {
    tryPlay();
  }
  video.addEventListener('loadedmetadata', () => {
    if (!userPaused()) tryPlay();
  });

  video.addEventListener('playing', () => setUI(true));
  video.addEventListener('pause', () => setUI(false));

  // Button toggle
  button.addEventListener('click', async () => {
    if (video.paused) {
      setUserPaused(false);
      await tryPlay();
    } else {
      setUserPaused(true);
      video.pause();
    }
  });

  // Resume when page becomes visible again
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && video.paused && video.muted && !userPaused()) {
      hardResume();
    }
  });

  // Back/Forward cache restores
  window.addEventListener('pageshow', () => {
    if (video.paused && video.muted && !userPaused()) {
      hardResume();
    }
  });

  // Focus regain
  window.addEventListener('focus', () => {
    if (video.paused && video.muted && !userPaused()) {
      hardResume();
    }
  });
})();

// SKILL ICON ZOOM
  document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach(el => {
    new bootstrap.Tooltip(el);
  });

/* =========================
   Futuristic 3D hero
   ========================= */
(async function () {
  const canvas = document.querySelector('.hp-3d-canvas');
  const stage = document.querySelector('.hp-stage');
  if (!canvas || !stage) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pointer = { x: 0, y: 0 };

  window.addEventListener('pointermove', (event) => {
    pointer.x = (event.clientX / window.innerWidth - 0.5) * 2;
    pointer.y = (event.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });

  try {
    const THREE = await import('./assets/vendor/three/three.module.js');
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(54, 1, 0.1, 100);
    camera.position.set(0, 0.1, 7.4);

    const group = new THREE.Group();
    scene.add(group);

    const coreGeometry = new THREE.IcosahedronGeometry(1.65, 2);
    const coreMaterial = new THREE.MeshStandardMaterial({
      color: 0xd6b56d,
      roughness: 0.36,
      metalness: 0.66,
      transparent: true,
      opacity: 0.34,
      wireframe: true
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    core.position.set(1.9, 0.25, 0);
    group.add(core);

    const shellGeometry = new THREE.TorusKnotGeometry(1.42, 0.014, 190, 12, 2, 3);
    const shellMaterial = new THREE.MeshBasicMaterial({
      color: 0x315c58,
      transparent: true,
      opacity: 0.34
    });
    const shell = new THREE.Mesh(shellGeometry, shellMaterial);
    shell.position.copy(core.position);
    group.add(shell);

    const particlesGeometry = new THREE.BufferGeometry();
    const particleCount = 760;
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i += 1) {
      const radius = 3.2 + Math.random() * 4.8;
      const angle = Math.random() * Math.PI * 2;
      const height = (Math.random() - 0.5) * 5.2;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = height;
      positions[i * 3 + 2] = Math.sin(angle) * radius - 1.2;
    }
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particlesMaterial = new THREE.PointsMaterial({
      color: 0xd6b56d,
      size: 0.018,
      transparent: true,
      opacity: 0.32,
      depthWrite: false
    });
    const particles = new THREE.Points(particlesGeometry, particlesMaterial);
    group.add(particles);

    const ambient = new THREE.AmbientLight(0xfff1bc, 0.72);
    const key = new THREE.PointLight(0xd6b56d, 2.3, 20);
    key.position.set(-3, 3, 4);
    const rim = new THREE.PointLight(0x315c58, 1.25, 18);
    rim.position.set(5, -1, 3);
    scene.add(ambient, key, rim);

    const resize = () => {
      const rect = stage.getBoundingClientRect();
      const width = Math.max(1, rect.width);
      const height = Math.max(1, rect.height);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      group.position.x = width < 992 ? 0 : 0.65;
      group.position.y = width < 992 ? -0.55 : 0;
    };
    resize();
    window.addEventListener('resize', resize);

    let rafId = 0;
    const animate = (time) => {
      const t = time * 0.001;
      core.rotation.x = t * 0.22 + pointer.y * 0.12;
      core.rotation.y = t * 0.28 + pointer.x * 0.16;
      shell.rotation.x = -t * 0.18;
      shell.rotation.y = t * 0.34;
      particles.rotation.y = t * 0.026;
      particles.rotation.x = pointer.y * 0.025;
      group.rotation.y += (pointer.x * 0.055 - group.rotation.y) * 0.035;
      group.rotation.x += (-pointer.y * 0.04 - group.rotation.x) * 0.035;
      renderer.render(scene, camera);
      if (!prefersReducedMotion) rafId = requestAnimationFrame(animate);
    };
    animate(0);

    if (prefersReducedMotion) renderer.render(scene, camera);
    window.addEventListener('pagehide', () => cancelAnimationFrame(rafId));
  } catch (error) {
    console.warn('[3D HERO] Three.js could not load, using canvas fallback:', error);
    drawCanvasFallback(canvas, stage);
  }

  function drawCanvasFallback(targetCanvas, targetStage) {
    const context = targetCanvas.getContext('2d');
    if (!context) return;

    const resize = () => {
      const rect = targetStage.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      targetCanvas.width = Math.max(1, Math.floor(rect.width * ratio));
      targetCanvas.height = Math.max(1, Math.floor(rect.height * ratio));
      targetCanvas.style.width = `${rect.width}px`;
      targetCanvas.style.height = `${rect.height}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = (time) => {
      const rect = targetStage.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      const t = time * 0.001;
      context.clearRect(0, 0, width, height);
      context.save();
      context.translate(width * 0.68, height * 0.45);
      context.rotate(t * 0.18);
      for (let ring = 0; ring < 5; ring += 1) {
        context.beginPath();
        context.ellipse(0, 0, 90 + ring * 28, 38 + ring * 12, ring * 0.55, 0, Math.PI * 2);
        context.strokeStyle = ring % 2 ? 'rgba(182,255,103,.32)' : 'rgba(88,230,255,.36)';
        context.lineWidth = 1;
        context.stroke();
      }
      context.restore();
      if (!prefersReducedMotion) requestAnimationFrame(draw);
    };
    draw(0);
  }
})();

/* =========================
   Depth tilt panels
   ========================= */
document.querySelectorAll('[data-tilt-panel], [data-depth-card]').forEach((panel) => {
  panel.addEventListener('pointermove', (event) => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const rect = panel.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    panel.style.transform = `perspective(900px) rotateX(${y * -5}deg) rotateY(${x * 7}deg) translateY(-4px)`;
  });

  panel.addEventListener('pointerleave', () => {
    panel.style.transform = '';
  });
});
