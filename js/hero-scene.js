// Hero scene: "The Living Health System". An AI core connects six abstract system nodes.
// Decorative only (the container is aria-hidden); three.js loads after the page has rendered.

const MAX_PIXEL_RATIO = 2;
const MAX_FRAME_DT = 0.05;
const CAMERA_TILT = (12 * Math.PI) / 180;
const CAMERA_DISTANCE = 8.2;
const NODE_RING_RADIUS = 2.6;
const TUBE_RADIUS = 0.012;
const TUBE_SEGMENTS = 48;
const TUBE_SIDES = 6;
const DUST_COUNT = 50;
const PULSES_PER_LINK = 2;
const PULSE_SPEED = 0.22; // share of a link per second
const AUTO_ROTATE = (2 * Math.PI) / 75; // one revolution per 75 s
const SHELL_SPIN = 0.25;
const NODE_DIM_OPACITY = 0.35;
const LINK_OPACITY = 0.4;
const SPREAD = 0.2; // how far nodes drift out while the system is fragmented

// Intro timeline in seconds: fragmented 0–1, AI wakes 1–2, links draw 2–4.
const INTRO = {
  wakeStart: 1, wakeEnd: 2, linkStart: 2, linkStagger: 0.18, linkDraw: 0.8,
  nodeLight: 0.3, peerStart: 3.2, peerStagger: 0.12, peerDraw: 0.5, sparkFade: [2.4, 3.4], pulseFade: [3.5, 4], end: 4,
};

// Labels are for the hover chips (next step). Shapes are abstract primitives, one per node.
const NODES = [
  { label: 'ผู้ป่วย', shape: 'icosa', angle: 0, y: 0.5 },
  { label: 'โรงพยาบาล', shape: 'box', angle: 60, y: -0.4 },
  { label: 'ชุมชน', shape: 'tetra', angle: 120, y: 0.7 },
  { label: 'ร้านยา', shape: 'cone', angle: 180, y: -0.5 },
  { label: 'ข้อมูลสุขภาพ', shape: 'octa', angle: 240, y: 0.3 },
  { label: 'นโยบาย', shape: 'dodeca', angle: 300, y: -0.6 },
];
const NODE_LINKS = [[0, 1], [2, 3], [4, 5], [1, 4]];
// Red "pain point" sparks sit where the system is broken: between nodes that never link.
const SPARK_GAPS = [[0, 5], [3, 4], [1, 2]];

const clamp01 = (x) => Math.min(Math.max(x, 0), 1);
const easeInOutCubic = (x) => (x < 0.5 ? 4 * x ** 3 : 1 - (-2 * x + 2) ** 3 / 2);
const phase = (t, start, duration) => easeInOutCubic(clamp01((t - start) / duration));

function token(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function nodeGeometry(THREE, shape) {
  switch (shape) {
    case 'icosa': return new THREE.IcosahedronGeometry(0.2, 0);
    case 'box': return new THREE.BoxGeometry(0.3, 0.3, 0.3);
    case 'tetra': return new THREE.TetrahedronGeometry(0.26, 0);
    case 'cone': return new THREE.ConeGeometry(0.2, 0.34, 5);
    case 'octa': return new THREE.OctahedronGeometry(0.24, 0);
    default: return new THREE.DodecahedronGeometry(0.21, 0);
  }
}

// Soft radial texture: the core's glow (stands in for bloom so nothing else blooms) and round particles.
function glowTexture(THREE) {
  const size = 128;
  const canvas = Object.assign(document.createElement('canvas'), { width: size, height: size });
  const ctx = canvas.getContext('2d');
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgb(255 255 255 / 1)');
  g.addColorStop(0.25, 'rgb(255 255 255 / 0.45)');
  g.addColorStop(1, 'rgb(255 255 255 / 0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
}

function glowSprite(THREE, glow, color, scale) {
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glow, color, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true,
  }));
  sprite.scale.setScalar(scale);
  return sprite;
}

function buildCore(THREE, colors, glow) {
  const core = new THREE.Group();
  const shell = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.72, 1),
    new THREE.MeshBasicMaterial({ color: colors.mint, wireframe: true, transparent: true }),
  );
  const inner = new THREE.Mesh(
    new THREE.SphereGeometry(0.3, 32, 16),
    new THREE.MeshBasicMaterial({ color: colors.mintPale, transparent: true }),
  );
  const halo = glowSprite(THREE, glow, colors.mint, 2.4);
  core.add(halo, inner, shell);
  return { core, shell, coreParts: [[halo, 1], [inner, 1], [shell, 0.55]] };
}

function buildNodes(THREE, colors) {
  return NODES.map((node) => {
    const rad = (node.angle * Math.PI) / 180;
    const mesh = new THREE.Mesh(
      nodeGeometry(THREE, node.shape),
      new THREE.MeshStandardMaterial({ color: colors.mint, roughness: 0.85, metalness: 0, flatShading: true, transparent: true }),
    );
    mesh.position.set(Math.cos(rad) * NODE_RING_RADIUS, node.y, Math.sin(rad) * NODE_RING_RADIUS);
    mesh.rotation.set(rad, rad * 0.7, 0);
    mesh.userData = { label: node.label, base: mesh.position.clone() };
    return mesh;
  });
}

// Curved link: quadratic bezier whose control point bows away from the centre and upward.
function linkCurve(THREE, from, to, bow) {
  const mid = from.clone().add(to).multiplyScalar(0.5);
  const outward = mid.clone().setY(0);
  if (outward.lengthSq() > 0) outward.setLength(bow);
  return new THREE.QuadraticBezierCurve3(from, mid.add(outward).add(new THREE.Vector3(0, bow * 0.6, 0)), to);
}

function buildLinks(THREE, colors, nodes) {
  const origin = new THREE.Vector3();
  const coreLinks = nodes.map((node, i) => ({
    curve: linkCurve(THREE, origin, node.position, 0.5), nodes: [i],
    start: INTRO.linkStart + i * INTRO.linkStagger, draw: INTRO.linkDraw,
  }));
  const peerLinks = NODE_LINKS.map(([a, b], j) => ({
    curve: linkCurve(THREE, nodes[a].position, nodes[b].position, 0.7), nodes: [a, b],
    start: INTRO.peerStart + j * INTRO.peerStagger, draw: INTRO.peerDraw,
  }));
  return [...coreLinks, ...peerLinks].map((spec) => ({
    ...spec,
    mesh: new THREE.Mesh(
      new THREE.TubeGeometry(spec.curve, TUBE_SEGMENTS, TUBE_RADIUS, TUBE_SIDES, false),
      new THREE.MeshBasicMaterial({ color: colors.mint, transparent: true, opacity: LINK_OPACITY }),
    ),
  }));
}

function buildPoints(THREE, glow, count, color, size, opacity) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(count * 3), 3));
  const material = new THREE.PointsMaterial({
    map: glow, color, size, sizeAttenuation: true, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  return new THREE.Points(geometry, material);
}

function buildDust(THREE, colors, glow, count) {
  const dust = buildPoints(THREE, glow, count, colors.mintPale, 0.06, 0.3);
  const positions = dust.geometry.attributes.position.array;
  for (let i = 0; i < positions.length; i += 1) positions[i] = (Math.random() - 0.5) * (i % 3 === 1 ? 5 : 8);
  return dust;
}

function buildSparks(THREE, colors, glow, nodes) {
  return SPARK_GAPS.map(([a, b]) => {
    const spark = glowSprite(THREE, glow, colors.crimson, 0.45);
    spark.position.copy(nodes[a].position).add(nodes[b].position).multiplyScalar(0.5 * (1 + SPREAD));
    return spark;
  });
}

function buildScene(THREE, colors, isSmall) {
  const scene = new THREE.Scene();
  const world = new THREE.Group();
  const glow = glowTexture(THREE);
  const { core, shell, coreParts } = buildCore(THREE, colors, glow);
  const nodes = buildNodes(THREE, colors);
  const links = buildLinks(THREE, colors, nodes);
  const pulsesPerLink = isSmall ? 1 : PULSES_PER_LINK;
  const pulses = buildPoints(THREE, glow, links.length * pulsesPerLink, colors.mintPale, 0.16, 0.95);
  const sparks = buildSparks(THREE, colors, glow, nodes);
  const dust = buildDust(THREE, colors, glow, isSmall ? DUST_COUNT / 2 : DUST_COUNT);
  world.add(core, ...nodes, ...links.map((link) => link.mesh), pulses, ...sparks);
  scene.add(world, dust);

  scene.add(new THREE.AmbientLight(colors.mintPale, 0.6));
  const key = new THREE.DirectionalLight(colors.white, 1.4);
  key.position.set(2, 4, 5);
  const rim = new THREE.DirectionalLight(colors.mint, 2.2); // from behind: the subtle rim glow on nodes
  rim.position.set(-3, 2, -5);
  scene.add(key, rim);
  return {
    scene, world, core, shell, coreParts, nodes, links, pulses, pulsesPerLink, sparks,
    mint: new THREE.Color(colors.mint), dim: new THREE.Color(colors.dim),
  };
}

// Sets every intro-driven property for time t; t >= INTRO.end is the finished, connected system.
function applyIntro(state, t) {
  const fragmented = 1 - phase(t, INTRO.wakeStart, INTRO.wakeEnd - INTRO.wakeStart);
  const wake = 1 - fragmented;
  state.core.scale.setScalar(0.6 + 0.4 * wake);
  state.coreParts.forEach(([part, opacity]) => { part.material.opacity = opacity * wake; });

  state.links.forEach((link) => {
    const drawn = phase(t, link.start, link.draw);
    const segments = Math.floor(drawn * TUBE_SEGMENTS);
    link.mesh.geometry.setDrawRange(0, segments * TUBE_SIDES * 6); // tube indices run start→end, 6 per side per segment
  });
  state.nodes.forEach((mesh, i) => {
    const link = state.links[i];
    const lit = phase(t, link.start + link.draw - INTRO.nodeLight / 2, INTRO.nodeLight);
    mesh.position.copy(mesh.userData.base).multiplyScalar(1 + SPREAD * fragmented);
    mesh.material.color.lerpColors(state.dim, state.mint, lit);
    mesh.material.opacity = NODE_DIM_OPACITY + (1 - NODE_DIM_OPACITY) * lit;
  });

  const sparkLevel = 1 - phase(t, INTRO.sparkFade[0], INTRO.sparkFade[1] - INTRO.sparkFade[0]);
  state.sparks.forEach((spark, k) => {
    const flicker = 0.35 + 0.65 * Math.abs(Math.sin(t * (17 + k * 5) + k * 2));
    spark.material.opacity = sparkLevel * flicker;
    spark.visible = sparkLevel > 0;
  });
  state.pulses.material.opacity = 0.95 * phase(t, INTRO.pulseFade[0], INTRO.pulseFade[1] - INTRO.pulseFade[0]);
}

function updatePulses(state, time) {
  const positions = state.pulses.geometry.attributes.position;
  state.links.forEach((link, i) => {
    for (let k = 0; k < state.pulsesPerLink; k += 1) {
      const u = (time * PULSE_SPEED + k / state.pulsesPerLink + i * 0.13) % 1;
      const p = link.curve.getPointAt(u);
      positions.setXYZ(i * state.pulsesPerLink + k, p.x, p.y, p.z);
    }
  });
  positions.needsUpdate = true;
}

async function init(container) {
  const THREE = await import('three');
  const colors = {
    mint: token('--mint'), mintPale: token('--mint-pale'), white: token('--white'),
    crimson: token('--crimson-bright'), dim: token('--teal-400'),
  };
  const isSmall = window.matchMedia('(max-width: 767px)').matches;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO));
  renderer.setClearColor(0x000000, 0);
  container.append(renderer.domElement);

  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 50);
  camera.position.set(0, Math.sin(CAMERA_TILT) * CAMERA_DISTANCE, Math.cos(CAMERA_TILT) * CAMERA_DISTANCE);
  camera.lookAt(0, 0, 0);

  const state = buildScene(THREE, colors, isSmall);
  state.world.rotation.y = 0.35;
  // Reduced motion: no intro, no animation; the connected idle state as a still frame.
  let time = reduceMotion ? INTRO.end : 0;
  applyIntro(state, time);
  updatePulses(state, time);

  const render = () => renderer.render(state.scene, camera);
  const resize = () => {
    const { clientWidth: w, clientHeight: h } = container;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    render();
  };
  new ResizeObserver(resize).observe(container);
  resize();
  if (reduceMotion) return;

  let last = performance.now();
  const frame = (now) => {
    const dt = Math.min((now - last) / 1000, MAX_FRAME_DT);
    last = now;
    time += dt;
    if (time <= INTRO.end + dt) applyIntro(state, time); // stop touching intro state once it has settled
    updatePulses(state, time);
    state.world.rotation.y += AUTO_ROTATE * dt;
    state.shell.rotation.y += SHELL_SPIN * dt;
    state.shell.rotation.x += SHELL_SPIN * 0.4 * dt;
    render();
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

const container = document.querySelector('.hero__scene');
if (container) {
  const start = () => init(container).catch((error) => console.error('Hero scene failed to load', error));
  if (document.readyState === 'complete') start();
  else window.addEventListener('load', start, { once: true });
}
