/**
 * 3D Garden Concept Viewer
 * Renders interactive Three.js scenes showing 3 garden concept previews
 * that use context-specific plants based on the user's selected USDA zone.
 */

import * as THREE from 'three';
import { ZONE_PLANT_PALETTES } from '../data/locationPlants.js';
import { GARDEN_CONCEPTS } from '../data/gardenConcepts.js';
import { state } from '../state.js';
import { getPlantSourceMode } from './autofill.js';

// ─── Constants ───────────────────────────────────────────────────────
const SCENE_SIZE = 40; // feet
const GROUND_Y = 0;
const FT_SCALE = 1;   // 1 unit = 1 foot

// ─── State ───────────────────────────────────────────────────────────
let activeViewer = null;
let animationFrameId = null;

// ─── Public API ──────────────────────────────────────────────────────

/**
 * Show the 3D concept viewer overlay for the given USDA zone.
 */
export function showGardenConcepts(zone) {
  // Remove old viewer if any
  hideGardenConcepts();

  const palette = ZONE_PLANT_PALETTES[zone] || ZONE_PLANT_PALETTES['All'];

  // Determine plant source mode
  const sourceMode = getPlantSourceMode();
  const hasMyPlants = state.myPlants.length > 0;
  const sourceLabel = sourceMode === 'myPlants' ? 'My Plants Only' :
                      sourceMode === 'recommended' ? 'Recommended Plants' : 'All Plants';

  // Build My Plants palette overlay (convert user's plants to 3D-compatible format)
  const myPlantsPalette = hasMyPlants ? buildMyPlantsPalette() : null;

  // Determine effective palette: merge My Plants into zone palette when applicable
  const effectivePalette = getEffectivePalette(palette, myPlantsPalette, sourceMode);

  // Build overlay DOM
  const overlay = document.createElement('div');
  overlay.id = 'garden-concepts-overlay';
  overlay.innerHTML = `
    <div class="gc-container">
      <div class="gc-header">
        <div class="gc-header-left">
          <h2 class="gc-title">Garden Concepts</h2>
          <span class="gc-zone-badge">${palette.label}</span>
          <span class="gc-source-badge ${sourceMode === 'myPlants' ? 'gc-source-my' : ''}">${sourceLabel}</span>
        </div>
        <div class="gc-header-right">
          <span class="gc-hint">${palette.climate}</span>
          <button class="gc-close" title="Close">&times;</button>
        </div>
      </div>
      <div class="gc-cards" id="gc-cards"></div>
      <div class="gc-3d-wrap" id="gc-3d-wrap" style="display:none">
        <div class="gc-3d-header">
          <button class="btn gc-back-btn" id="gc-back">&larr; All Concepts</button>
          <span class="gc-3d-title" id="gc-3d-title"></span>
          <div class="gc-3d-controls">
            <span class="gc-3d-hint">Drag to orbit &middot; Scroll to zoom</span>
          </div>
        </div>
        <div class="gc-canvas-container" id="gc-canvas-container"></div>
        <div class="gc-plant-legend" id="gc-plant-legend"></div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  // Close button
  overlay.querySelector('.gc-close').addEventListener('click', hideGardenConcepts);
  overlay.addEventListener('click', e => {
    if (e.target === overlay) hideGardenConcepts();
  });

  // Render concept cards
  const cardsEl = overlay.querySelector('#gc-cards');
  for (const concept of GARDEN_CONCEPTS) {
    const card = createConceptCard(concept, effectivePalette, zone);
    cardsEl.appendChild(card);
  }

  // Back button
  overlay.querySelector('#gc-back').addEventListener('click', () => {
    disposeScene();
    overlay.querySelector('#gc-cards').style.display = '';
    overlay.querySelector('#gc-3d-wrap').style.display = 'none';
  });

  activeViewer = overlay;
}

/**
 * Remove the concept viewer overlay.
 */
export function hideGardenConcepts() {
  disposeScene();
  if (activeViewer) {
    activeViewer.remove();
    activeViewer = null;
  }
}

// ─── Concept Cards ───────────────────────────────────────────────────

// ─── My Plants Palette Builder ───────────────────────────────────────

/**
 * Convert user's My Plants inventory into a 3D-compatible palette format.
 * Maps plant layers and assigns default 3D properties.
 */
function buildMyPlantsPalette() {
  const SHAPE_DEFAULTS = {
    tree: ['vase', 'rounded', 'spreading', 'conical'],
    shrub: ['rounded', 'arching', 'rounded', 'grass'],
    ground: ['mound', 'grass', 'mat', 'mound'],
  };

  const COLOR_DEFAULTS = {
    tree: ['#5a8040', '#3a5a2a', '#6b8e4e', '#2d5a3a'],
    shrub: ['#4a7a3a', '#5a8040', '#3a6a3a', '#5a3050'],
    ground: ['#6a7a5a', '#4a7a4a', '#5a8a40', '#7a9a5a'],
  };

  const result = { trees: [], shrubs: [], ground: [] };
  let treeIdx = 0, shrubIdx = 0, groundIdx = 0;

  for (const mp of state.myPlants) {
    const layerKey = mp.layer === 'tree' ? 'trees' : mp.layer === 'shrub' ? 'shrubs' : 'ground';
    let idx, shapes, colors;

    if (mp.layer === 'tree') {
      idx = treeIdx++;
      shapes = SHAPE_DEFAULTS.tree;
      colors = COLOR_DEFAULTS.tree;
    } else if (mp.layer === 'shrub') {
      idx = shrubIdx++;
      shapes = SHAPE_DEFAULTS.shrub;
      colors = COLOR_DEFAULTS.shrub;
    } else {
      idx = groundIdx++;
      shapes = SHAPE_DEFAULTS.ground;
      colors = COLOR_DEFAULTS.ground;
    }

    result[layerKey].push({
      name: mp.name,
      height: mp.height || (mp.layer === 'tree' ? 20 : mp.layer === 'shrub' ? 5 : 2),
      spread: mp.width || mp.spacing || (mp.layer === 'tree' ? 12 : mp.layer === 'shrub' ? 4 : 2),
      shape: shapes[idx % shapes.length],
      color: colors[idx % colors.length],
    });
  }

  return result;
}

/**
 * Get effective palette based on plant source mode.
 * 'myPlants'    — use only user's plants (converted to 3D format)
 * 'recommended' — use only zone-recommended plants
 * 'all'         — merge: user's plants first, then fill with recommended
 */
function getEffectivePalette(zonePalette, myPlantsPalette, sourceMode) {
  if (sourceMode === 'recommended' || !myPlantsPalette) {
    return zonePalette;
  }
  if (sourceMode === 'myPlants') {
    return {
      ...zonePalette,
      trees: myPlantsPalette.trees.length ? myPlantsPalette.trees : zonePalette.trees,
      shrubs: myPlantsPalette.shrubs.length ? myPlantsPalette.shrubs : zonePalette.shrubs,
      ground: myPlantsPalette.ground.length ? myPlantsPalette.ground : zonePalette.ground,
    };
  }
  // 'all' — merge: user plants first, pad with zone plants
  return {
    ...zonePalette,
    trees: [...myPlantsPalette.trees, ...zonePalette.trees].slice(0, 5),
    shrubs: [...myPlantsPalette.shrubs, ...zonePalette.shrubs].slice(0, 5),
    ground: [...myPlantsPalette.ground, ...zonePalette.ground].slice(0, 5),
  };
}

function createConceptCard(concept, palette, zone) {
  const card = document.createElement('div');
  card.className = 'gc-card';
  card.dataset.conceptId = concept.id;

  // Pick a few sample plants to show
  const sampleTrees = selectPlants(palette.trees, concept.plantStrategy.treePreference, 2);
  const sampleShrubs = selectPlants(palette.shrubs, concept.plantStrategy.shrubPreference, 2);
  const sampleGround = selectPlants(palette.ground, concept.plantStrategy.groundPreference, 2);

  const plantList = [...sampleTrees, ...sampleShrubs, ...sampleGround]
    .map(p => `<span class="gc-plant-chip">${p.name}</span>`)
    .join('');

  card.innerHTML = `
    <div class="gc-card-icon">${concept.icon}</div>
    <h3 class="gc-card-name">${concept.name}</h3>
    <p class="gc-card-subtitle">${concept.subtitle}</p>
    <p class="gc-card-desc">${concept.description}</p>
    <div class="gc-card-plants">
      <span class="gc-card-plants-label">Featured plants:</span>
      <div class="gc-plant-chips">${plantList}</div>
    </div>
    <button class="btn primary gc-view-btn">View in 3D</button>
  `;

  // Create a mini canvas preview
  const preview = createMiniPreview(concept, palette);
  card.insertBefore(preview, card.querySelector('.gc-card-name'));

  card.querySelector('.gc-view-btn').addEventListener('click', () => {
    openConcept3D(concept, palette, zone);
  });

  return card;
}

function createMiniPreview(concept, palette) {
  const canvas = document.createElement('canvas');
  canvas.className = 'gc-mini-canvas';
  canvas.width = 320;
  canvas.height = 180;

  const ctx = canvas.getContext('2d');

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, 0, 180);
  grad.addColorStop(0, '#1a2a14');
  grad.addColorStop(1, concept.ground.color);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 320, 180);

  // Draw ground plane as perspective trapezoid
  ctx.fillStyle = concept.ground.color;
  ctx.globalAlpha = 0.6;
  ctx.beginPath();
  ctx.moveTo(40, 80);
  ctx.lineTo(280, 80);
  ctx.lineTo(320, 180);
  ctx.lineTo(0, 180);
  ctx.fill();
  ctx.globalAlpha = 1;

  // Draw path
  if (concept.layout.paths.length > 0) {
    const p = concept.layout.paths[0];
    ctx.strokeStyle = concept.hardscape.color;
    ctx.lineWidth = 8;
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    const fx = p.from.x * 320, fy = 80 + p.from.z * 100;
    const tx = p.to.x * 320, ty = 80 + p.to.z * 100;
    if (p.via) {
      const vx = p.via.x * 320, vy = 80 + p.via.z * 100;
      ctx.moveTo(fx, fy);
      ctx.quadraticCurveTo(vx, vy, tx, ty);
    } else {
      ctx.moveTo(fx, fy);
      ctx.lineTo(tx, ty);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // Draw trees as simple circles with depth sorting
  const trees = selectPlants(palette.trees, concept.plantStrategy.treePreference, concept.layout.trees.length);
  concept.layout.trees.forEach((pos, i) => {
    const plant = trees[i % trees.length];
    const sx = pos.x * 320;
    const sy = 80 + pos.z * 100;
    const r = Math.min(plant.spread, 20) * 1.5;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(sx, sy + r * 0.2, r, r * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Canopy
    ctx.fillStyle = plant.color;
    ctx.beginPath();
    ctx.arc(sx, sy - r * 0.5, r, 0, Math.PI * 2);
    ctx.fill();

    // Highlight
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.beginPath();
    ctx.arc(sx - r * 0.2, sy - r * 0.7, r * 0.5, 0, Math.PI * 2);
    ctx.fill();
  });

  // Draw shrubs
  const shrubs = selectPlants(palette.shrubs, concept.plantStrategy.shrubPreference, 3);
  concept.layout.shrubs.forEach((group, gi) => {
    const plant = shrubs[gi % shrubs.length];
    for (let j = 0; j < Math.min(group.count, 4); j++) {
      const sx = (group.x + j * group.spacing) * 320;
      const sy = 80 + group.z * 100;
      const r = Math.min(plant.spread, 5) * 1.5;
      ctx.fillStyle = plant.color;
      ctx.globalAlpha = 0.8;
      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  });

  return canvas;
}

// ─── Full 3D View ────────────────────────────────────────────────────

let renderer, scene, camera, orbitState;

function openConcept3D(concept, palette, zone) {
  const overlay = activeViewer;
  overlay.querySelector('#gc-cards').style.display = 'none';
  overlay.querySelector('#gc-3d-wrap').style.display = '';
  overlay.querySelector('#gc-3d-title').textContent = concept.name;

  const container = overlay.querySelector('#gc-canvas-container');
  container.innerHTML = '';

  // Setup Three.js
  scene = new THREE.Scene();
  scene.background = new THREE.Color('#0c1109');
  scene.fog = new THREE.FogExp2('#0c1109', 0.015);

  // Camera
  camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 200);
  camera.position.set(30, 25, 30);
  camera.lookAt(0, 0, 0);

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  container.appendChild(renderer.domElement);

  // Lighting
  setupLighting(scene);

  // Ground plane
  buildGround(scene, concept);

  // Path
  buildPaths(scene, concept);

  // Features (planters, boulders, arbors)
  buildFeatures(scene, concept);

  // Plants
  const plantInfo = buildPlants(scene, concept, palette);

  // Legend
  buildLegend(overlay.querySelector('#gc-plant-legend'), plantInfo);

  // Simple orbit controls (no dependency needed)
  orbitState = initSimpleOrbit(renderer.domElement, camera);

  // Animate
  function animate() {
    animationFrameId = requestAnimationFrame(animate);
    updateOrbit(orbitState, camera);
    renderer.render(scene, camera);
  }
  animate();

  // Resize handling
  const ro = new ResizeObserver(() => {
    if (!container.clientWidth) return;
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  });
  ro.observe(container);
  orbitState._ro = ro;
}

function disposeScene() {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  if (orbitState?._ro) {
    orbitState._ro.disconnect();
  }
  if (renderer) {
    renderer.dispose();
    renderer.domElement.remove();
    renderer = null;
  }
  if (scene) {
    scene.traverse(obj => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
        else obj.material.dispose();
      }
    });
    scene = null;
  }
  camera = null;
  orbitState = null;
}

// ─── Scene Building ──────────────────────────────────────────────────

function setupLighting(scene) {
  // Ambient
  scene.add(new THREE.AmbientLight(0x6688aa, 0.6));

  // Sun
  const sun = new THREE.DirectionalLight(0xffeedd, 1.8);
  sun.position.set(20, 30, 15);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -30;
  sun.shadow.camera.right = 30;
  sun.shadow.camera.top = 30;
  sun.shadow.camera.bottom = -30;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 80;
  sun.shadow.bias = -0.001;
  scene.add(sun);

  // Fill light
  const fill = new THREE.DirectionalLight(0x88aacc, 0.4);
  fill.position.set(-15, 10, -10);
  scene.add(fill);

  // Hemisphere
  scene.add(new THREE.HemisphereLight(0x88bbcc, 0x334422, 0.5));
}

function buildGround(scene, concept) {
  const geo = new THREE.PlaneGeometry(SCENE_SIZE * 1.5, SCENE_SIZE * 1.5, 32, 32);
  const color = new THREE.Color(concept.ground.color);

  // Add subtle vertex displacement for terrain
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    pos.setZ(i, (Math.sin(x * 0.3) * Math.cos(y * 0.3) * 0.3));
  }
  geo.computeVertexNormals();

  const mat = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.95,
    metalness: 0.0,
    flatShading: false,
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.receiveShadow = true;
  scene.add(mesh);

  // Grid lines for scale
  const grid = new THREE.GridHelper(SCENE_SIZE, SCENE_SIZE / 5, 0x1a2a14, 0x1a2a14);
  grid.position.y = 0.01;
  grid.material.opacity = 0.3;
  grid.material.transparent = true;
  scene.add(grid);
}

function buildPaths(scene, concept) {
  for (const path of concept.layout.paths) {
    const hw = (path.width * SCENE_SIZE) / 2;
    const fromX = (path.from.x - 0.5) * SCENE_SIZE;
    const fromZ = (path.from.z - 0.5) * SCENE_SIZE;
    const toX = (path.to.x - 0.5) * SCENE_SIZE;
    const toZ = (path.to.z - 0.5) * SCENE_SIZE;

    if (path.curve && path.via) {
      // Curved path using tube geometry
      const viaX = (path.via.x - 0.5) * SCENE_SIZE;
      const viaZ = (path.via.z - 0.5) * SCENE_SIZE;
      const curve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(fromX, 0.05, fromZ),
        new THREE.Vector3(viaX, 0.05, viaZ),
        new THREE.Vector3(toX, 0.05, toZ),
      );
      const pts = curve.getPoints(20);
      // Extrude path as flat ribbon
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i], b = pts[i + 1];
        const dx = b.x - a.x, dz = b.z - a.z;
        const len = Math.sqrt(dx * dx + dz * dz);
        const nx = -dz / len * hw, nz = dx / len * hw;

        const shape = new THREE.BufferGeometry();
        const verts = new Float32Array([
          a.x + nx, 0.06, a.z + nz,
          a.x - nx, 0.06, a.z - nz,
          b.x + nx, 0.06, b.z + nz,
          b.x - nx, 0.06, b.z - nz,
        ]);
        const indices = [0, 1, 2, 1, 3, 2];
        shape.setAttribute('position', new THREE.BufferAttribute(verts, 3));
        shape.setIndex(indices);
        shape.computeVertexNormals();

        const mat = new THREE.MeshStandardMaterial({
          color: concept.hardscape.color,
          roughness: 0.9,
          metalness: 0.0,
        });
        const mesh = new THREE.Mesh(shape, mat);
        mesh.receiveShadow = true;
        scene.add(mesh);
      }
    } else {
      // Straight path
      const dx = toX - fromX, dz = toZ - fromZ;
      const len = Math.sqrt(dx * dx + dz * dz);
      const geo = new THREE.PlaneGeometry(hw * 2, len);
      const mat = new THREE.MeshStandardMaterial({
        color: concept.hardscape.color,
        roughness: 0.85,
        metalness: 0.0,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.rotation.z = -Math.atan2(dx, dz);
      mesh.position.set((fromX + toX) / 2, 0.06, (fromZ + toZ) / 2);
      mesh.receiveShadow = true;
      scene.add(mesh);
    }
  }
}

function buildFeatures(scene, concept) {
  for (const feat of concept.layout.features) {
    const fx = (feat.x - 0.5) * SCENE_SIZE;
    const fz = (feat.type === 'arbor' ? feat.z : feat.z - 0.5) * SCENE_SIZE;

    switch (feat.type) {
      case 'planter-box': {
        const w = (feat.w || 0.15) * SCENE_SIZE;
        const d = (feat.d || 0.06) * SCENE_SIZE;
        const h = 1.5;
        const geo = new THREE.BoxGeometry(w, h, d);
        const mat = new THREE.MeshStandardMaterial({ color: '#6a5a40', roughness: 0.8 });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(fx, h / 2, fz);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);
        // Soil fill
        const soilGeo = new THREE.BoxGeometry(w - 0.3, 0.1, d - 0.3);
        const soilMat = new THREE.MeshStandardMaterial({ color: '#3a2a1a', roughness: 1 });
        const soil = new THREE.Mesh(soilGeo, soilMat);
        soil.position.set(fx, h - 0.05, fz);
        scene.add(soil);
        break;
      }
      case 'boulder': {
        const r = 1.2 + Math.random() * 0.8;
        const geo = new THREE.DodecahedronGeometry(r, 1);
        // Randomize vertices for natural look
        const pos = geo.attributes.position;
        for (let i = 0; i < pos.count; i++) {
          pos.setX(i, pos.getX(i) + (Math.random() - 0.5) * 0.3);
          pos.setY(i, pos.getY(i) * 0.7 + (Math.random() - 0.5) * 0.2);
          pos.setZ(i, pos.getZ(i) + (Math.random() - 0.5) * 0.3);
        }
        geo.computeVertexNormals();
        const mat = new THREE.MeshStandardMaterial({ color: '#7a7060', roughness: 0.95, metalness: 0.05 });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(fx, r * 0.4, fz);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);
        break;
      }
      case 'arbor': {
        const mat = new THREE.MeshStandardMaterial({ color: '#8a6a4a', roughness: 0.7 });
        // Two posts
        const postGeo = new THREE.CylinderGeometry(0.15, 0.15, 7, 8);
        for (const side of [-1, 1]) {
          const post = new THREE.Mesh(postGeo, mat);
          post.position.set(fx + side * 1.5, 3.5, fz);
          post.castShadow = true;
          scene.add(post);
        }
        // Top beam
        const beamGeo = new THREE.BoxGeometry(3.5, 0.3, 0.3);
        const beam = new THREE.Mesh(beamGeo, mat);
        beam.position.set(fx, 7, fz);
        beam.castShadow = true;
        scene.add(beam);
        // Cross beams
        for (let j = -1; j <= 1; j += 0.5) {
          const crossGeo = new THREE.BoxGeometry(0.15, 0.15, 2);
          const cross = new THREE.Mesh(crossGeo, mat);
          cross.position.set(fx + j, 6.8, fz);
          scene.add(cross);
        }
        break;
      }
    }
  }
}

function buildPlants(scene, concept, palette) {
  const plantInfo = [];

  // Trees
  const trees = selectPlants(palette.trees, concept.plantStrategy.treePreference, concept.layout.trees.length);
  concept.layout.trees.forEach((pos, i) => {
    const plant = trees[i % trees.length];
    const x = (pos.x - 0.5) * SCENE_SIZE;
    const z = (pos.z - 0.5) * SCENE_SIZE;
    buildTree(scene, plant, x, z);
    if (!plantInfo.find(p => p.name === plant.name)) {
      plantInfo.push({ ...plant, layer: 'tree' });
    }
  });

  // Shrubs
  const shrubs = selectPlants(palette.shrubs, concept.plantStrategy.shrubPreference, 5);
  concept.layout.shrubs.forEach((group, gi) => {
    const plant = shrubs[gi % shrubs.length];
    for (let j = 0; j < group.count; j++) {
      const x = ((group.x + j * group.spacing) - 0.5) * SCENE_SIZE;
      const z = (group.z - 0.5) * SCENE_SIZE;
      buildShrub(scene, plant, x, z);
    }
    if (!plantInfo.find(p => p.name === plant.name)) {
      plantInfo.push({ ...plant, layer: 'shrub' });
    }
  });

  // Groundcover
  const grounds = selectPlants(palette.ground, concept.plantStrategy.groundPreference, 4);
  concept.layout.ground.forEach((area, gi) => {
    const plant = grounds[gi % grounds.length];
    const cx = (area.x - 0.5) * SCENE_SIZE;
    const cz = (area.z - 0.5) * SCENE_SIZE;
    const r = area.radius * SCENE_SIZE;
    buildGroundcover(scene, plant, cx, cz, r);
    if (!plantInfo.find(p => p.name === plant.name)) {
      plantInfo.push({ ...plant, layer: 'ground' });
    }
  });

  return plantInfo;
}

// ─── Plant Geometry Builders ─────────────────────────────────────────

function buildTree(scene, plant, x, z) {
  const h = plant.height * FT_SCALE * 0.5; // Scale down for scene
  const s = plant.spread * FT_SCALE * 0.4;

  // Trunk
  const trunkH = h * 0.4;
  const trunkGeo = new THREE.CylinderGeometry(0.2, 0.35, trunkH, 8);
  const trunkMat = new THREE.MeshStandardMaterial({ color: '#5a4030', roughness: 0.9 });
  const trunk = new THREE.Mesh(trunkGeo, trunkMat);
  trunk.position.set(x, trunkH / 2, z);
  trunk.castShadow = true;
  scene.add(trunk);

  // Canopy
  const canopyColor = new THREE.Color(plant.color);
  const canopyMat = new THREE.MeshStandardMaterial({
    color: canopyColor,
    roughness: 0.85,
    metalness: 0.0,
  });

  switch (plant.shape) {
    case 'columnar': {
      const geo = new THREE.CylinderGeometry(s * 0.4, s * 0.5, h * 0.7, 10);
      const mesh = new THREE.Mesh(geo, canopyMat);
      mesh.position.set(x, trunkH + h * 0.35, z);
      mesh.castShadow = true;
      scene.add(mesh);
      break;
    }
    case 'conical': {
      const geo = new THREE.ConeGeometry(s * 0.6, h * 0.7, 10);
      const mesh = new THREE.Mesh(geo, canopyMat);
      mesh.position.set(x, trunkH + h * 0.35, z);
      mesh.castShadow = true;
      scene.add(mesh);
      break;
    }
    case 'palm': {
      // Palm trunk - taller, thinner
      trunk.geometry.dispose();
      const palmTrunkGeo = new THREE.CylinderGeometry(0.3, 0.4, h * 0.75, 8);
      trunk.geometry = palmTrunkGeo;
      trunk.position.y = h * 0.375;
      // Fronds as flat cone
      const frondGeo = new THREE.ConeGeometry(s * 0.7, h * 0.3, 8);
      const frondMesh = new THREE.Mesh(frondGeo, canopyMat);
      frondMesh.position.set(x, h * 0.85, z);
      frondMesh.castShadow = true;
      scene.add(frondMesh);
      break;
    }
    case 'spreading': {
      // Wide, flat canopy
      const geo = new THREE.SphereGeometry(s * 0.6, 12, 8);
      geo.scale(1, 0.5, 1);
      const mesh = new THREE.Mesh(geo, canopyMat);
      mesh.position.set(x, trunkH + s * 0.2, z);
      mesh.castShadow = true;
      scene.add(mesh);
      break;
    }
    case 'layered': {
      // Multiple layers
      for (let i = 0; i < 3; i++) {
        const lr = s * (0.6 - i * 0.12);
        const lh = trunkH + h * 0.2 + i * h * 0.15;
        const geo = new THREE.SphereGeometry(lr, 10, 6);
        geo.scale(1, 0.4, 1);
        const shade = canopyColor.clone().multiplyScalar(1 - i * 0.1);
        const mat = new THREE.MeshStandardMaterial({ color: shade, roughness: 0.85 });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x + (Math.random() - 0.5) * 0.5, lh, z + (Math.random() - 0.5) * 0.5);
        mesh.castShadow = true;
        scene.add(mesh);
      }
      break;
    }
    default: { // 'vase', 'rounded'
      const geo = new THREE.SphereGeometry(s * 0.5, 12, 10);
      geo.scale(1, 0.8, 1);
      const mesh = new THREE.Mesh(geo, canopyMat);
      mesh.position.set(x, trunkH + s * 0.3, z);
      mesh.castShadow = true;
      scene.add(mesh);
    }
  }

  // Flower clusters if applicable
  if (plant.flowerColor) {
    addFlowerAccents(scene, x, trunkH + h * 0.3, z, s * 0.4, plant.flowerColor);
  }

  // Shadow disc
  const shadowGeo = new THREE.CircleGeometry(s * 0.5, 16);
  const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.2 });
  const shadow = new THREE.Mesh(shadowGeo, shadowMat);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.set(x, 0.02, z);
  scene.add(shadow);
}

function buildShrub(scene, plant, x, z) {
  const h = plant.height * FT_SCALE * 0.5;
  const s = plant.spread * FT_SCALE * 0.4;

  const color = new THREE.Color(plant.color);
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.88 });

  switch (plant.shape) {
    case 'rosette': {
      // Agave-like rosette
      const geo = new THREE.ConeGeometry(s * 0.5, h, 8);
      geo.scale(1, 0.6, 1);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, h * 0.3, z);
      mesh.castShadow = true;
      scene.add(mesh);
      break;
    }
    case 'palm': {
      const geo = new THREE.SphereGeometry(s * 0.45, 8, 6);
      geo.scale(1, 1.2, 1);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, h * 0.6, z);
      mesh.castShadow = true;
      scene.add(mesh);
      break;
    }
    case 'arching': {
      // Elongated hemisphere
      const geo = new THREE.SphereGeometry(s * 0.45, 10, 8);
      geo.scale(1.3, 0.8, 1);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, h * 0.4, z);
      mesh.castShadow = true;
      scene.add(mesh);
      break;
    }
    case 'grass': {
      // Ornamental grass shape
      const geo = new THREE.ConeGeometry(s * 0.3, h * 1.2, 8);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, h * 0.6, z);
      mesh.castShadow = true;
      scene.add(mesh);
      break;
    }
    default: { // 'rounded'
      const geo = new THREE.SphereGeometry(s * 0.45, 10, 8);
      geo.scale(1, 0.75, 1);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, h * 0.4, z);
      mesh.castShadow = true;
      scene.add(mesh);
    }
  }

  if (plant.flowerColor) {
    addFlowerAccents(scene, x, h * 0.5, z, s * 0.25, plant.flowerColor);
  }
}

function buildGroundcover(scene, plant, cx, cz, radius) {
  const color = new THREE.Color(plant.color);
  const count = Math.floor(radius * radius * 1.5);

  for (let i = 0; i < count; i++) {
    // Random position in circle
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.sqrt(Math.random()) * radius;
    const x = cx + Math.cos(angle) * dist;
    const z = cz + Math.sin(angle) * dist;

    const h = plant.height * FT_SCALE * 0.4;
    const s = plant.spread * FT_SCALE * 0.3;

    switch (plant.shape) {
      case 'grass': {
        const geo = new THREE.ConeGeometry(s * 0.3, h, 6);
        const jitter = color.clone().offsetHSL(Math.random() * 0.05 - 0.025, 0, Math.random() * 0.1 - 0.05);
        const mat = new THREE.MeshStandardMaterial({ color: jitter, roughness: 0.9 });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, h / 2, z);
        scene.add(mesh);
        break;
      }
      case 'mat': {
        const geo = new THREE.CylinderGeometry(s * 0.4, s * 0.5, h * 0.3, 8);
        const jitter = color.clone().offsetHSL(Math.random() * 0.05 - 0.025, 0, Math.random() * 0.1 - 0.05);
        const mat = new THREE.MeshStandardMaterial({ color: jitter, roughness: 0.9 });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, h * 0.15, z);
        scene.add(mesh);
        break;
      }
      default: { // 'mound'
        const geo = new THREE.SphereGeometry(s * 0.35, 6, 4);
        geo.scale(1, 0.5, 1);
        const jitter = color.clone().offsetHSL(Math.random() * 0.05 - 0.025, 0, Math.random() * 0.1 - 0.05);
        const mat = new THREE.MeshStandardMaterial({ color: jitter, roughness: 0.9 });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, h * 0.2, z);
        scene.add(mesh);
      }
    }

    // Occasional flowers
    if (plant.flowerColor && Math.random() < 0.3) {
      const fGeo = new THREE.SphereGeometry(0.15, 4, 3);
      const fMat = new THREE.MeshStandardMaterial({ color: plant.flowerColor, emissive: plant.flowerColor, emissiveIntensity: 0.15 });
      const flower = new THREE.Mesh(fGeo, fMat);
      flower.position.set(x, h * 0.5 + 0.1, z);
      scene.add(flower);
    }
  }
}

function addFlowerAccents(scene, x, y, z, radius, color) {
  const flowerMat = new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: 0.2,
    roughness: 0.7,
  });
  const count = 5 + Math.floor(Math.random() * 5);
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const d = Math.random() * radius;
    const geo = new THREE.SphereGeometry(0.2 + Math.random() * 0.15, 5, 4);
    const mesh = new THREE.Mesh(geo, flowerMat);
    mesh.position.set(
      x + Math.cos(a) * d,
      y + (Math.random() - 0.5) * radius * 0.5,
      z + Math.sin(a) * d,
    );
    scene.add(mesh);
  }
}

// ─── Plant Selection ─────────────────────────────────────────────────

function selectPlants(available, preferredShapes, count) {
  // Prefer plants matching the concept's shape preferences
  const scored = available.map(p => {
    const idx = preferredShapes.indexOf(p.shape);
    return { ...p, score: idx >= 0 ? preferredShapes.length - idx : -1 };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, Math.max(count, 1));
}

// ─── Legend ──────────────────────────────────────────────────────────

function buildLegend(el, plantInfo) {
  el.innerHTML = '';
  const title = document.createElement('div');
  title.className = 'gc-legend-title';
  title.textContent = 'Plants in this concept';
  el.appendChild(title);

  const layerOrder = ['tree', 'shrub', 'ground'];
  const layerLabels = { tree: 'Trees', shrub: 'Shrubs', ground: 'Groundcover' };
  const layerColors = { tree: '#e8a030', shrub: '#5dbb7a', ground: '#72b8d4' };

  for (const layer of layerOrder) {
    const plants = plantInfo.filter(p => p.layer === layer);
    if (!plants.length) continue;

    const section = document.createElement('div');
    section.className = 'gc-legend-section';
    section.innerHTML = `<span class="gc-legend-layer" style="color:${layerColors[layer]}">${layerLabels[layer]}</span>`;
    for (const p of plants) {
      const chip = document.createElement('span');
      chip.className = 'gc-legend-chip';
      chip.innerHTML = `<span class="gc-legend-dot" style="background:${p.color}"></span>${p.name}`;
      if (p.flowerColor) {
        chip.innerHTML += `<span class="gc-legend-flower" style="background:${p.flowerColor}"></span>`;
      }
      section.appendChild(chip);
    }
    el.appendChild(section);
  }
}

// ─── Simple Orbit Controls (no external dependency) ──────────────────

function initSimpleOrbit(canvas, camera) {
  const state = {
    theta: Math.PI / 4,
    phi: Math.PI / 4,
    radius: 35,
    target: new THREE.Vector3(0, 2, 0),
    isDragging: false,
    lastX: 0,
    lastY: 0,
    _ro: null,
  };

  canvas.addEventListener('pointerdown', e => {
    state.isDragging = true;
    state.lastX = e.clientX;
    state.lastY = e.clientY;
    canvas.setPointerCapture(e.pointerId);
  });

  canvas.addEventListener('pointermove', e => {
    if (!state.isDragging) return;
    const dx = e.clientX - state.lastX;
    const dy = e.clientY - state.lastY;
    state.theta -= dx * 0.005;
    state.phi = Math.max(0.1, Math.min(Math.PI / 2.1, state.phi - dy * 0.005));
    state.lastX = e.clientX;
    state.lastY = e.clientY;
  });

  canvas.addEventListener('pointerup', e => {
    state.isDragging = false;
    canvas.releasePointerCapture(e.pointerId);
  });

  canvas.addEventListener('wheel', e => {
    e.preventDefault();
    state.radius = Math.max(10, Math.min(80, state.radius + e.deltaY * 0.05));
  }, { passive: false });

  return state;
}

function updateOrbit(state, camera) {
  if (!state || !camera) return;
  camera.position.x = state.target.x + state.radius * Math.sin(state.phi) * Math.cos(state.theta);
  camera.position.y = state.target.y + state.radius * Math.cos(state.phi);
  camera.position.z = state.target.z + state.radius * Math.sin(state.phi) * Math.sin(state.theta);
  camera.lookAt(state.target);
}
