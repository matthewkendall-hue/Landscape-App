import { state, shapes, houseEdgeIndex } from '../state.js';
import { ptInPoly, distPoly, ftToPx, layerAt } from '../utils/geometry.js';
import { getSiteShape } from './shapes.js';
import { renderPlants, renderList } from './plants.js';
import { snapshot } from './undoRedo.js';
import { getMyPlantsForSolver, renderMyPlants } from './myPlants.js';
import { naturalisticSolve } from './naturalisticPlacement.js';

function inObstacle(x, y) {
  return shapes.some(s => (s.type === 'house' || s.type === 'patio') && ptInPoly(x, y, s.points));
}

// Parameterized packing — boundary defaults to site shape
// maxCount limits how many plants to place (for My Plants quantity caps)
function packPlant(plant, boundary, edgeIdx, maxCount) {
  if (!boundary) {
    boundary = getSiteShape();
    if (!boundary) return [];
  }
  if (edgeIdx == null) edgeIdx = houseEdgeIndex;

  const spacingPx = ftToPx(plant.spacing || plant.width || 3);
  const r = spacingPx / 2 * 0.95;
  const dx = spacingPx, dy = spacingPx * Math.sin(Math.PI / 3);
  const xs = boundary.points.map(p => p.x), ys = boundary.points.map(p => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  const local = [];
  const limit = maxCount != null ? maxCount : Infinity;

  for (let row = 0, y = minY; y <= maxY; row++, y += dy) {
    const off = (row % 2) * dx / 2;
    for (let x = minX + off; x <= maxX; x += dx) {
      if (local.length >= limit) break;

      // Small jitter for natural look
      const jx = x + (Math.random() - 0.5) * spacingPx * 0.05;
      const jy = y + (Math.random() - 0.5) * spacingPx * 0.05;

      if (edgeIdx != null && layerAt({ x: jx, y: jy }, boundary, edgeIdx) !== plant.layer) continue;
      const inside = ptInPoly(jx, jy, boundary.points);
      const treeAllow = plant.layer === 'tree' && !inside && distPoly({ x: jx, y: jy }, boundary.points) <= r;
      if (!(inside || treeAllow)) continue;
      if (inObstacle(jx, jy)) continue;
      let ok = true;
      for (const q of local) { if (Math.hypot(q.x - jx, q.y - jy) < spacingPx * 0.92) { ok = false; break; } }
      if (ok) for (const q of state.placed) { if (Math.hypot(q.x - jx, q.y - jy) < (q.r + r)) { ok = false; break; } }
      if (ok) local.push({ x: jx, y: jy, r });
    }
    if (local.length >= limit) break;
  }

  // Edge case: if hex grid produced nothing in a small area, try centroid
  if (!local.length && boundary.points.length >= 3 && limit > 0) {
    const cx = xs.reduce((a, b) => a + b, 0) / xs.length;
    const cy = ys.reduce((a, b) => a + b, 0) / ys.length;
    if (ptInPoly(cx, cy, boundary.points) && !inObstacle(cx, cy)) {
      let ok = true;
      for (const q of state.placed) { if (Math.hypot(q.x - cx, q.y - cy) < (q.r + r)) { ok = false; break; } }
      if (ok) local.push({ x: cx, y: cy, r });
    }
  }

  return local.map(p => ({
    ...p,
    id: crypto.randomUUID(),
    plantId: plant.id,
    name: plant.name,
    layer: plant.layer,
    spacing: plant.spacing,
    light: plant.light,
    water: plant.water,
    fromMyPlants: !!plant._fromMyPlants,
  }));
}

// Sort queue: trees first (need most room), then shrubs, then ground
function sortByLayer(queue) {
  const order = { tree: 0, shrub: 1, ground: 2 };
  return [...queue].sort((a, b) => (order[a.layer] ?? 1) - (order[b.layer] ?? 1));
}

/**
 * Zone-aware filter: score plants for suitability in a zone.
 * Returns a filtered + sorted queue where best-fit plants come first.
 * Plants that are completely incompatible are removed.
 */
function filterByZone(queue, zones) {
  if (!zones) return queue;

  return queue
    .map(plant => {
      let score = 0;

      // Water match: plant.water vs zone hydrozone
      const waterMap = { low: 'xeric', medium: 'mesic', high: 'hydric' };
      const plantHydro = waterMap[plant.water] || 'mesic';
      if (plantHydro === zones.hydrozone) score += 3;
      else if (
        (plantHydro === 'mesic') || // mesic plants are somewhat adaptable
        (plantHydro === 'xeric' && zones.hydrozone === 'mesic') // xeric can survive mesic
      ) score += 1;
      else score -= 1; // e.g., high-water plant in xeric zone

      // Sun match: plant.light (hours string) vs zone sun exposure
      const lightHrs = parseFloat(plant.light) || 6;
      if (zones.sun === 'full' && lightHrs >= 6) score += 2;
      else if (zones.sun === 'partial' && lightHrs >= 3 && lightHrs <= 6) score += 2;
      else if (zones.sun === 'shade' && lightHrs < 4) score += 2;
      else if (zones.sun === 'full' && lightHrs >= 3) score += 0; // tolerable
      else score -= 1;

      return { plant, score };
    })
    .filter(p => p.score >= 0) // exclude clearly incompatible
    .sort((a, b) => b.score - a.score) // best-fit first
    .map(p => p.plant);
}

export function autoFill() {
  if (!getSiteShape()) { alert('Draw a Site Boundary first.'); return; }
  if (houseEdgeIndex == null) { alert('Set the House Edge first.'); return; }
  if (!state.queue.length && !state.myPlants.length) { alert('Queue at least one plant from the library or add to My Plants.'); return; }
  snapshot();

  // Place My Plants first (respecting quantity limits)
  const myPlants = sortByLayer(getMyPlantsForSolver());
  for (const plant of myPlants) {
    const results = packPlant(plant, null, null, plant._maxCount);
    state.placed.push(...results);
  }

  // Then fill remaining space with queue plants
  const sorted = sortByLayer(state.queue);
  for (const plant of sorted) state.placed.push(...packPlant(plant));

  renderPlants();
  renderList();
  renderMyPlants();
}

// Solve a specific landscape area using naturalistic placement (zone-aware)
export function solveForArea(area, seed) {
  const queue = area.queueOverride || state.queue;
  if (!queue.length && !state.myPlants.length) { alert('Queue at least one plant.'); return; }
  const zones = area.zones || null;

  // Resolve seed: use provided, or stored, or generate new
  const resolveSeed = seed ?? area._resolveSeed ?? Math.floor(Math.random() * 2147483647);
  area._resolveSeed = resolveSeed;

  // Remove previously placed plants for this area
  state.placed = state.placed.filter(p => p.areaId !== area.id);

  // Build combined plant list: My Plants first, then queue, zone-filtered
  const myPlants = filterByZone(sortByLayer(getMyPlantsForSolver()), zones);
  const queuePlants = filterByZone(sortByLayer(queue), zones);
  const allPlants = [...myPlants, ...queuePlants];

  // Existing placements in other areas (for collision avoidance)
  const existingPlaced = state.placed.filter(p => p.areaId !== area.id);

  // Run naturalistic placement algorithm
  const results = naturalisticSolve(area, allPlants, existingPlaced, resolveSeed);

  // Tag results with area ID
  results.forEach(p => p.areaId = area.id);
  state.placed.push(...results);
}
