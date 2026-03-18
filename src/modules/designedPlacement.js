/**
 * Designed Placement Algorithm
 *
 * Organized bands parallel to the front edge with rule-of-odds clustering.
 * Professional landscape design principles:
 *  - Clear layer separation: groundcover front, shrubs middle, trees rear
 *  - Clusters of 3, 5, or 7 (rule of odds)
 *  - Organized rows within each band, slight variety in cluster positioning
 */

import { ptInPoly, distSeg, ftToPx } from '../utils/geometry.js';
import { shapes } from '../state.js';

// ─── Seeded PRNG (mulberry32) ────────────────────────────────────────
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

/**
 * Compute edge direction, inward normal, and max depth for a polygon
 * relative to a reference edge (front edge or longest edge).
 */
function computeEdgeFrame(pts, frontEdge) {
  let edgeA, edgeB;

  if (frontEdge != null) {
    edgeA = pts[frontEdge];
    edgeB = pts[(frontEdge + 1) % pts.length];
  } else {
    // Fallback: longest edge
    let maxLen = 0;
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      const len = Math.hypot(b.x - a.x, b.y - a.y);
      if (len > maxLen) { maxLen = len; edgeA = a; edgeB = b; }
    }
  }

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

  // Max depth from front edge to any vertex
  const maxDist = Math.max(...pts.map(p => distSeg(p, edgeA, edgeB)));

  return { edgeA, edgeB, edgeLen, dirX, dirY, normX, normY, maxDist };
}

export function designedSolve(area, plants, existingPlaced, seed, frontEdge) {
  const rng = mulberry32(seed);
  const pts = area.points;

  const frame = computeEdgeFrame(pts, frontEdge);
  const { edgeA, edgeLen, dirX, dirY, normX, normY, maxDist } = frame;

  if (maxDist < 1) return [];

  // Separate by layer
  const trees = plants.filter(p => p.layer === 'tree');
  const shrubs = plants.filter(p => p.layer === 'shrub');
  const ground = plants.filter(p => p.layer === 'ground');

  // Band boundaries (fraction of maxDist)
  const groundEnd = maxDist * 0.30;
  const shrubEnd = maxDist * 0.65;

  const allPlacements = [];
  const clusterSizes = [3, 3, 5, 5, 7];

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
   * Place clusters within a depth band for a set of plant species.
   */
  function placeBand(bandPlants, bandStart, bandEnd) {
    if (!bandPlants.length) return;

    // Shuffle species order with PRNG for variety
    const shuffled = [...bandPlants].sort(() => rng() - 0.5);

    for (const plant of shuffled) {
      if (!canPlace(plant)) continue;

      const spacing = ftToPx(plant.spacing || plant.width || 3);
      const r = spacing / 2 * 0.95;
      const rowSpacing = spacing * 1.2;

      for (let depth = bandStart + spacing * 0.6; depth < bandEnd; depth += rowSpacing) {
        if (!canPlace(plant)) break;

        const clusterSize = clusterSizes[Math.floor(rng() * clusterSizes.length)];
        const driftId = crypto.randomUUID();

        // Random offset along the edge for this cluster
        const clusterOffset = rng() * edgeLen * 0.8 + edgeLen * 0.1;

        for (let i = 0; i < clusterSize; i++) {
          if (!canPlace(plant)) break;

          // Place plants centered around clusterOffset
          const t = clusterOffset + (i - (clusterSize - 1) / 2) * spacing;
          // Small depth jitter for designed (not as much as naturalistic)
          const depthJitter = (rng() - 0.5) * spacing * 0.2;

          const x = edgeA.x + normX * (depth + depthJitter) + dirX * t;
          const y = edgeA.y + normY * (depth + depthJitter) + dirY * t;

          if (!ptInPoly(x, y, pts)) continue;
          if (inObstacle(x, y)) continue;

          allPlacements.push({ x, y, r, plant, driftId });
          markUsed(plant);
        }
      }
    }
  }

  // Place each band front-to-back
  placeBand(ground, 0, groundEnd);
  placeBand(shrubs, groundEnd, shrubEnd);
  placeBand(trees, shrubEnd, maxDist);

  // Final collision validation (same pattern as naturalisticSolve)
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
