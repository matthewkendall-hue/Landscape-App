/**
 * Formal / Linear Placement Algorithm
 *
 * Strict parallel rows from the front edge, no randomization.
 * Geometric, evenly-spaced planting in layer bands:
 *  - Groundcover rows nearest the front edge
 *  - Shrub rows in the middle
 *  - Tree rows in the rear
 *
 * Front edge is REQUIRED — caller must validate before calling.
 */

import { ptInPoly, distSeg, ftToPx } from '../utils/geometry.js';
import { shapes } from '../state.js';

// ─── Seeded PRNG (mulberry32) ────────────────────────────────────────
// Used minimally — only for species cycling within a layer.
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function inObstacle(x, y) {
  return shapes.some(s =>
    (s.type === 'house' || s.type === 'patio') && ptInPoly(x, y, s.points)
  );
}

export function formalSolve(area, plants, existingPlaced, seed, frontEdge) {
  const rng = mulberry32(seed);
  const pts = area.points;

  // Front edge endpoints
  const edgeA = pts[frontEdge];
  const edgeB = pts[(frontEdge + 1) % pts.length];

  // Edge direction and inward normal
  const edgeDx = edgeB.x - edgeA.x;
  const edgeDy = edgeB.y - edgeA.y;
  const edgeLen = Math.hypot(edgeDx, edgeDy) || 1;
  const dirX = edgeDx / edgeLen;
  const dirY = edgeDy / edgeLen;

  // Inward normal (toward centroid)
  const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
  const cy = pts.reduce((s, p) => s + p.y, 0) / pts.length;
  let normX = -dirY, normY = dirX;
  const midX = (edgeA.x + edgeB.x) / 2, midY = (edgeA.y + edgeB.y) / 2;
  if ((cx - midX) * normX + (cy - midY) * normY < 0) {
    normX = -normX; normY = -normY;
  }

  // Max depth from front edge
  const maxDist = Math.max(...pts.map(p => distSeg(p, edgeA, edgeB)));
  if (maxDist < 1) return [];

  // Separate by layer
  const trees = plants.filter(p => p.layer === 'tree');
  const shrubs = plants.filter(p => p.layer === 'shrub');
  const ground = plants.filter(p => p.layer === 'ground');

  // Band boundaries
  const groundEnd = maxDist * 0.30;
  const shrubEnd = maxDist * 0.65;

  const allPlacements = [];

  // Track quantity usage for _maxCount
  const qtyUsed = {};
  function getKey(p) { return p.id || p.plantId || p.name; }
  function canPlace(p) {
    const max = p._maxCount != null ? p._maxCount : Infinity;
    return (qtyUsed[getKey(p)] || 0) < max;
  }
  function markUsed(p) {
    const k = getKey(p);
    qtyUsed[k] = (qtyUsed[k] || 0) + 1;
  }

  /**
   * Place a single row at a given depth, sweeping along the edge direction.
   * Returns placements for that row.
   */
  function placeRow(plant, depth) {
    const spacing = ftToPx(plant.spacing || plant.width || 3);
    const r = spacing / 2 * 0.95;
    const driftId = crypto.randomUUID();
    const row = [];

    // Scan along the edge direction, well beyond both endpoints
    const scanStart = -edgeLen * 0.5;
    const scanEnd = edgeLen * 1.5;

    for (let t = scanStart; t <= scanEnd; t += spacing) {
      if (!canPlace(plant)) break;

      const x = edgeA.x + normX * depth + dirX * t;
      const y = edgeA.y + normY * depth + dirY * t;

      if (!ptInPoly(x, y, pts)) continue;
      if (inObstacle(x, y)) continue;

      row.push({ x, y, r, plant, driftId });
      markUsed(plant);
    }
    return row;
  }

  /**
   * Fill a band with rows, cycling through available species.
   */
  function fillBand(bandPlants, bandStart, bandEnd) {
    if (!bandPlants.length) return;

    // Shuffle species order for variety
    const shuffled = [...bandPlants].sort(() => rng() - 0.5);

    let speciesIdx = 0;
    // Start at half-spacing from the band start so rows are inset
    const firstPlant = shuffled[0];
    const firstSpacing = ftToPx(firstPlant.spacing || firstPlant.width || 3);
    let depth = bandStart + firstSpacing * 0.5;

    while (depth < bandEnd) {
      const plant = shuffled[speciesIdx % shuffled.length];
      if (!canPlace(plant)) {
        speciesIdx++;
        // If we've cycled through all species and none can place, stop
        if (speciesIdx >= shuffled.length * 2) break;
        continue;
      }

      const spacing = ftToPx(plant.spacing || plant.width || 3);
      const row = placeRow(plant, depth);
      allPlacements.push(...row);

      depth += spacing;
      speciesIdx++;
    }
  }

  // Fill bands front-to-back
  fillBand(ground, 0, groundEnd);
  fillBand(shrubs, groundEnd, shrubEnd);
  fillBand(trees, shrubEnd, maxDist);

  // Final collision validation
  const result = [];
  for (const p of allPlacements) {
    if (!ptInPoly(p.x, p.y, pts)) continue;
    if (inObstacle(p.x, p.y)) continue;

    let collision = false;
    for (const ex of existingPlaced) {
      if (Math.hypot(ex.x - p.x, ex.y - p.y) < ex.r + p.r) { collision = true; break; }
    }
    if (!collision) {
      for (const placed of result) {
        if (Math.hypot(placed.x - p.x, placed.y - p.y) < (placed.r + p.r) * 0.85) { collision = true; break; }
      }
    }

    if (!collision) {
      result.push({
        id: crypto.randomUUID(),
        x: p.x, y: p.y, r: p.r,
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
