/**
 * Naturalistic Plant Placement Algorithm
 *
 * Replaces the hex-grid packer with Poisson disk sampling + drift clustering
 * to produce organic, landscape-architecture-informed planting layouts.
 *
 * Principles applied:
 *  - Drift planting (Oudolf): same-species plants in flowing organic groups
 *  - Layered communities (McHarg): canopy → shrub → groundcover
 *  - Focal specimens: trees placed strategically, not on a grid
 *  - Naturalistic spacing: Poisson disk eliminates grid artifacts
 */

import { ptInPoly, distPoly, distSeg, ftToPx } from '../utils/geometry.js';
import { shapes } from '../state.js';

// ─── Seeded PRNG (mulberry32) ────────────────────────────────────────
// Deterministic: same seed → same layout. Different seed → different layout.
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── Obstacle check (house / patio) ─────────────────────────────────
function inObstacle(x, y) {
  return shapes.some(
    (s) =>
      (s.type === 'house' || s.type === 'patio') &&
      ptInPoly(x, y, s.points),
  );
}

// ─── Poisson Disk Sampling (Bridson's algorithm) ────────────────────
// Generates well-spaced candidate positions inside a polygon boundary
// with no grid artifacts.
function poissonDiskSample(boundary, minDist, rng, k = 30) {
  const pts = boundary.points;
  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  const minX = Math.min(...xs),
    maxX = Math.max(...xs);
  const minY = Math.min(...ys),
    maxY = Math.max(...ys);
  const w = maxX - minX,
    h = maxY - minY;

  if (w < 1 || h < 1) return [];

  const cellSize = minDist / Math.SQRT2;
  const gridW = Math.ceil(w / cellSize) + 1;
  const gridH = Math.ceil(h / cellSize) + 1;
  const grid = new Array(gridW * gridH).fill(-1);

  const samples = [];
  const active = [];

  const toGrid = (x, y) => ({
    gx: Math.floor((x - minX) / cellSize),
    gy: Math.floor((y - minY) / cellSize),
  });

  function addSample(x, y) {
    const i = samples.length;
    samples.push({ x, y });
    active.push(i);
    const { gx, gy } = toGrid(x, y);
    if (gx >= 0 && gx < gridW && gy >= 0 && gy < gridH) {
      grid[gy * gridW + gx] = i;
    }
  }

  // Find initial point inside polygon
  let initX, initY, found = false;
  for (let attempt = 0; attempt < 1000; attempt++) {
    initX = minX + rng() * w;
    initY = minY + rng() * h;
    if (ptInPoly(initX, initY, pts) && !inObstacle(initX, initY)) {
      found = true;
      break;
    }
  }
  if (!found) {
    // Fallback: centroid
    initX = xs.reduce((a, b) => a + b, 0) / xs.length;
    initY = ys.reduce((a, b) => a + b, 0) / ys.length;
  }

  addSample(initX, initY);

  // Outer loop: expand from active seeds, then try to seed disconnected regions
  // (handles obstacles like patios that split a landscape area into separate zones)
  let seeding = true;
  while (seeding) {
    // Poisson expansion from active seeds
    while (active.length > 0) {
      const idx = Math.floor(rng() * active.length);
      const { x: cx, y: cy } = samples[active[idx]];
      let accepted = false;

      for (let i = 0; i < k; i++) {
        const angle = rng() * Math.PI * 2;
        const dist = minDist + rng() * minDist; // annulus [r, 2r]
        const nx = cx + Math.cos(angle) * dist;
        const ny = cy + Math.sin(angle) * dist;

        if (nx < minX || nx > maxX || ny < minY || ny > maxY) continue;
        if (!ptInPoly(nx, ny, pts)) continue;
        if (inObstacle(nx, ny)) continue;

        const { gx, gy } = toGrid(nx, ny);
        if (gx < 0 || gx >= gridW || gy < 0 || gy >= gridH) continue;

        // Check 5×5 neighborhood in spatial grid
        let tooClose = false;
        for (let dy = -2; dy <= 2 && !tooClose; dy++) {
          for (let dx = -2; dx <= 2 && !tooClose; dx++) {
            const ngy = gy + dy, ngx = gx + dx;
            if (ngy < 0 || ngy >= gridH || ngx < 0 || ngx >= gridW) continue;
            const gi = ngy * gridW + ngx;
            if (grid[gi] >= 0) {
              const s = samples[grid[gi]];
              if (Math.hypot(nx - s.x, ny - s.y) < minDist) tooClose = true;
            }
          }
        }

        if (!tooClose) {
          addSample(nx, ny);
          accepted = true;
        }
      }

      if (!accepted) active.splice(idx, 1);
    }

    // Try to find a seed point in an unsampled disconnected region
    seeding = false;
    for (let attempt = 0; attempt < 150; attempt++) {
      const rx = minX + rng() * w;
      const ry = minY + rng() * h;
      if (!ptInPoly(rx, ry, pts) || inObstacle(rx, ry)) continue;

      const { gx, gy } = toGrid(rx, ry);
      if (gx < 0 || gx >= gridW || gy < 0 || gy >= gridH) continue;

      let tooClose = false;
      for (let dy = -2; dy <= 2 && !tooClose; dy++) {
        for (let dx = -2; dx <= 2 && !tooClose; dx++) {
          const ngy = gy + dy, ngx = gx + dx;
          if (ngy < 0 || ngy >= gridH || ngx < 0 || ngx >= gridW) continue;
          const gi = ngy * gridW + ngx;
          if (grid[gi] >= 0) {
            const s = samples[grid[gi]];
            if (Math.hypot(rx - s.x, ry - s.y) < minDist) tooClose = true;
          }
        }
      }

      if (!tooClose) {
        addSample(rx, ry);
        seeding = true; // Found a new region — re-enter expansion loop
        break;
      }
    }
  }

  return samples;
}

// ─── Candidate annotation ───────────────────────────────────────────
function annotateCandidates(candidates, boundary, frontEdge) {
  const pts = boundary.points;
  const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
  const cy = pts.reduce((s, p) => s + p.y, 0) / pts.length;

  for (const c of candidates) {
    c.distFromEdge = distPoly(c, pts);
    c.distFromCentroid = Math.hypot(c.x - cx, c.y - cy);
    if (frontEdge != null) {
      const a = pts[frontEdge], b = pts[(frontEdge + 1) % pts.length];
      c.distFromFront = distSeg(c, a, b);
    }
  }
}

// ─── Pick N well-separated positions from candidates ────────────────
function pickSpreadOut(viable, count, minSep, rng) {
  const picked = [];
  const pool = [...viable];

  for (let n = 0; n < count && pool.length > 0; n++) {
    // Weighted selection: prefer candidates farther from already-picked
    let best = null, bestScore = -1;
    const tries = Math.min(pool.length, 20);
    for (let t = 0; t < tries; t++) {
      const idx = Math.floor(rng() * pool.length);
      const c = pool[idx];
      let minD = Infinity;
      for (const p of picked) {
        minD = Math.min(minD, Math.hypot(c.x - p.x, c.y - p.y));
      }
      // First pick has no distance constraint
      const score = picked.length === 0 ? c.distFromEdge : minD;
      if (score > bestScore) {
        bestScore = score;
        best = idx;
      }
    }

    if (best === null) break;
    const chosen = pool.splice(best, 1)[0];

    // Enforce minimum separation
    if (picked.length > 0 && bestScore < minSep * 0.5) continue;

    picked.push(chosen);
  }

  return picked;
}

// ─── Phase 1: Tree Specimens ────────────────────────────────────────
function placeTreeSpecimens(candidates, treePlants, rng) {
  const placements = [];
  const usedIndices = new Set();

  for (const tree of treePlants) {
    const spacingPx = ftToPx(tree.spacing || tree.width || 12);
    const r = spacingPx / 2 * 0.95;

    // Trees: 1–3 specimens (weighted: 1=35%, 2=40%, 3=25%)
    const maxFromQty = tree._maxCount != null ? tree._maxCount : Infinity;
    const roll = rng();
    const baseCount = roll < 0.35 ? 1 : roll < 0.75 ? 2 : 3;
    const count = Math.min(baseCount, maxFromQty);

    // Filter: prefer interior candidates not too close to edges
    let viable = candidates
      .map((c, i) => ({ ...c, i }))
      .filter((c) => !usedIndices.has(c.i))
      .filter((c) => c.distFromEdge > spacingPx * 0.4);

    // Front edge: prefer candidates away from front (rear of bed)
    if (viable.length > 3 && viable[0]?.distFromFront != null) {
      const maxFD = Math.max(...viable.map(c => c.distFromFront));
      if (maxFD > 0) {
        const rear = viable.filter(c => c.distFromFront > maxFD * 0.35);
        if (rear.length >= count) viable = rear;
      }
    }

    if (viable.length === 0) continue;

    const chosen = pickSpreadOut(viable, count, spacingPx * 1.5, rng);

    for (const pos of chosen) {
      usedIndices.add(pos.i);
      // Exclude candidates within tree canopy radius
      for (let j = 0; j < candidates.length; j++) {
        if (
          !usedIndices.has(j) &&
          Math.hypot(candidates[j].x - pos.x, candidates[j].y - pos.y) < spacingPx * 0.8
        ) {
          usedIndices.add(j);
        }
      }
      placements.push({
        x: pos.x + (rng() - 0.5) * spacingPx * 0.1,
        y: pos.y + (rng() - 0.5) * spacingPx * 0.1,
        r,
        plant: tree,
        driftId: crypto.randomUUID(),
      });
    }
  }

  return { placements, usedIndices };
}

// ─── Phase 2: Shrub Clusters ────────────────────────────────────────
function placeShrubClusters(candidates, shrubPlants, usedIndices, rng) {
  const placements = [];
  if (!shrubPlants.length) return placements;

  // Odd-number cluster sizes (landscape design rule of odds)
  const clusterSizes = [3, 3, 5, 5, 5, 7, 7];

  for (const shrub of shrubPlants) {
    const spacingPx = ftToPx(shrub.spacing || shrub.width || 4);
    const r = spacingPx / 2 * 0.95;
    const maxFromQty = shrub._maxCount != null ? shrub._maxCount : Infinity;

    let placed = 0;

    // Determine how many clusters based on available space
    const available = candidates.filter((_, i) => !usedIndices.has(i));
    const targetSize = clusterSizes[Math.floor(rng() * clusterSizes.length)];
    const numClusters = Math.max(1, Math.floor(available.length / (targetSize * 3)));

    for (let c = 0; c < numClusters && placed < maxFromQty; c++) {
      const driftId = crypto.randomUUID();

      // Pick drift center from unused candidates
      const pool = candidates
        .map((p, i) => ({ ...p, i }))
        .filter((p) => !usedIndices.has(p.i));
      if (pool.length === 0) break;

      const centerIdx = Math.floor(rng() * pool.length);
      const center = pool[centerIdx];
      usedIndices.add(center.i);

      // Grow cluster: find nearest candidates within reach
      const clusterCount = Math.min(targetSize, maxFromQty - placed);
      const nearby = candidates
        .map((p, i) => ({
          ...p,
          i,
          dist: Math.hypot(p.x - center.x, p.y - center.y),
        }))
        .filter((p) => !usedIndices.has(p.i) && p.dist < spacingPx * 3.5)
        .sort((a, b) => a.dist - b.dist)
        .slice(0, clusterCount - 1); // -1 because center is already included

      // Place center
      placements.push({
        x: center.x + (rng() - 0.5) * spacingPx * 0.4,
        y: center.y + (rng() - 0.5) * spacingPx * 0.4,
        r,
        plant: shrub,
        driftId,
      });
      placed++;

      // Place cluster members
      for (const pos of nearby) {
        if (placed >= maxFromQty) break;
        usedIndices.add(pos.i);
        placements.push({
          x: pos.x + (rng() - 0.5) * spacingPx * 0.4,
          y: pos.y + (rng() - 0.5) * spacingPx * 0.4,
          r,
          plant: shrub,
          driftId,
        });
        placed++;
      }
    }
  }

  return placements;
}

// ─── Phase 3: Groundcover Drifts ────────────────────────────────────
function placeGroundcoverDrifts(candidates, groundPlants, usedIndices, rng) {
  const placements = [];
  if (!groundPlants.length) return placements;

  const remaining = candidates
    .map((c, i) => ({ ...c, i }))
    .filter((c) => !usedIndices.has(c.i));

  if (!remaining.length) return placements;

  // Front edge: prefer starting drifts near the front
  if (remaining[0]?.distFromFront != null) {
    remaining.sort((a, b) => a.distFromFront - b.distFromFront);
  }

  // Build quantity caps per plant
  const qtyCaps = {};
  const qtyUsed = {};
  for (const gp of groundPlants) {
    const key = gp.id || gp.name;
    qtyCaps[key] = gp._maxCount != null ? gp._maxCount : Infinity;
    qtyUsed[key] = 0;
  }

  // Odd-number drift sizes (naturalistic design)
  const driftSizes = [7, 9, 11, 13, 15];

  const unassigned = new Set(remaining.map((r) => r.i));

  while (unassigned.size > 0) {
    // Pick a species (round-robin with random start for variety)
    const speciesIdx = Math.floor(rng() * groundPlants.length);
    const species = groundPlants[speciesIdx];
    const key = species.id || species.name;
    const spacingPx = ftToPx(species.spacing || species.width || 2);
    const r = spacingPx / 2 * 0.95;

    // Check quantity cap
    if (qtyUsed[key] >= qtyCaps[key]) {
      // Try to find another species that isn't capped
      let found = false;
      for (const gp of groundPlants) {
        const k = gp.id || gp.name;
        if (qtyUsed[k] < qtyCaps[k]) { found = true; break; }
      }
      if (!found) break; // All groundcover species maxed out
      continue; // Try again with different random pick
    }

    const driftId = crypto.randomUUID();
    const targetSize = driftSizes[Math.floor(rng() * driftSizes.length)];

    // Pick a seed point
    const unArr = [...unassigned];
    const seedIdx = unArr[Math.floor(rng() * unArr.length)];
    const seed = candidates[seedIdx];

    // Flood-fill nearby unassigned candidates
    const drift = [seedIdx];
    unassigned.delete(seedIdx);

    const queue = [seed];
    while (drift.length < targetSize && queue.length > 0) {
      const current = queue.shift();
      // Find nearest unassigned neighbors
      const neighbors = [...unassigned]
        .map((i) => ({
          i,
          dist: Math.hypot(candidates[i].x - current.x, candidates[i].y - current.y),
        }))
        .filter((n) => n.dist < spacingPx * 3)
        .sort((a, b) => a.dist - b.dist);

      for (const n of neighbors) {
        if (drift.length >= targetSize) break;
        drift.push(n.i);
        unassigned.delete(n.i);
        queue.push(candidates[n.i]);
      }
    }

    // Place the drift
    for (const idx of drift) {
      if (qtyUsed[key] >= qtyCaps[key]) break;
      const pos = candidates[idx];
      placements.push({
        x: pos.x + (rng() - 0.5) * spacingPx * 0.3,
        y: pos.y + (rng() - 0.5) * spacingPx * 0.3,
        r,
        plant: species,
        driftId,
      });
      qtyUsed[key]++;
    }
  }

  return placements;
}

// ─── Main Export ────────────────────────────────────────────────────
/**
 * Generate a naturalistic planting layout for a landscape area.
 *
 * @param {Object}   area            Landscape area shape (.points, .zones)
 * @param {Array}    plants          Zone-filtered plant list (sorted tree→shrub→ground)
 * @param {Array}    existingPlaced  Plants already placed in other areas (collision avoidance)
 * @param {number}   seed            Random seed for deterministic generation
 * @returns {Array}  Placed plant objects ready for state.placed
 */
export function naturalisticSolve(area, plants, existingPlaced, seed, frontEdge) {
  const rng = mulberry32(seed);

  // Separate plants by layer
  const trees = plants.filter((p) => p.layer === 'tree');
  const shrubs = plants.filter((p) => p.layer === 'shrub');
  const ground = plants.filter((p) => p.layer === 'ground');

  // Determine minimum spacing for Poisson sampling
  const allSpacings = plants.map((p) => ftToPx(p.spacing || p.width || 3));
  if (!allSpacings.length) return [];
  const minSpacing = Math.min(...allSpacings) * 0.85; // slight relaxation for density

  // Phase 0: Generate candidate positions via Poisson disk sampling
  const candidates = poissonDiskSample(area, minSpacing, rng);
  if (!candidates.length) return [];

  // Annotate with distance metadata
  annotateCandidates(candidates, area, frontEdge);

  // Phase 1: Trees as focal specimens (1–3 per species)
  const usedIndices = new Set();
  const allPlacements = [];

  const { placements: treePlacements, usedIndices: treeUsed } =
    placeTreeSpecimens(candidates, trees, rng);
  treePlacements.forEach((p) => allPlacements.push(p));
  treeUsed.forEach((i) => usedIndices.add(i));

  // Phase 2: Shrubs in organic clusters (3–7 per drift)
  const shrubPlacements = placeShrubClusters(
    candidates, shrubs, usedIndices, rng,
  );
  shrubPlacements.forEach((p) => allPlacements.push(p));

  // Phase 3: Groundcover in large flowing drifts (7–15+)
  const groundPlacements = placeGroundcoverDrifts(
    candidates, ground, usedIndices, rng,
  );
  groundPlacements.forEach((p) => allPlacements.push(p));

  // Final validation: collisions against existing placements + self
  const result = [];
  for (const p of allPlacements) {
    // Boundary check (jitter may have pushed outside)
    if (!ptInPoly(p.x, p.y, area.points)) continue;
    if (inObstacle(p.x, p.y)) continue;

    // Collision with plants in other areas
    let collision = false;
    for (const ex of existingPlaced) {
      if (Math.hypot(ex.x - p.x, ex.y - p.y) < ex.r + p.r) {
        collision = true;
        break;
      }
    }
    // Collision with already-accepted plants in this solve
    if (!collision) {
      for (const placed of result) {
        if (Math.hypot(placed.x - p.x, placed.y - p.y) < (placed.r + p.r) * 0.85) {
          collision = true;
          break;
        }
      }
    }

    if (!collision) {
      result.push({
        id: crypto.randomUUID(),
        x: p.x,
        y: p.y,
        r: p.r,
        plantId: p.plant.id || p.plant.plantId,
        name: p.plant.name,
        layer: p.plant.layer,
        spacing: p.plant.spacing,
        light: p.plant.light,
        water: p.plant.water,
        fromMyPlants: !!p.plant._fromMyPlants,
        driftId: p.driftId,
      });
    }
  }

  return result;
}
