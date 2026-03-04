import { shapes } from '../state.js';
import { ns, getSvg } from '../utils/svg.js';

let measurementsVisible = false;

const PX_TO_FT = 1 / 8; // inverse of ftToPx

/**
 * Shoelace formula for polygon area in px^2, converted to ft^2.
 */
function polyAreaFt(pts) {
  let area = 0;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    area += pts[j].x * pts[i].y - pts[i].x * pts[j].y;
  }
  return Math.abs(area / 2) * PX_TO_FT * PX_TO_FT;
}

/**
 * Edge length in feet.
 */
function edgeLenFt(a, b) {
  return Math.hypot(b.x - a.x, b.y - a.y) * PX_TO_FT;
}

/**
 * Polygon centroid.
 */
function centroid(pts) {
  const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
  const cy = pts.reduce((s, p) => s + p.y, 0) / pts.length;
  return { x: cx, y: cy };
}

/**
 * Render all measurement labels into a dedicated SVG group.
 */
export function renderMeasurements() {
  const svg = getSvg();
  // Remove old measurements layer
  svg.querySelector('g.measurements-layer')?.remove();

  if (!measurementsVisible) return;

  const g = ns('g');
  g.setAttribute('class', 'measurements-layer');

  for (const shape of shapes) {
    if (!shape.closed || !shape.points.length) continue;

    const pts = shape.points;

    // Edge length labels
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i];
      const b = pts[(i + 1) % pts.length];
      const len = edgeLenFt(a, b);
      if (len < 0.5) continue; // skip tiny edges (parametric circles)

      const mx = (a.x + b.x) / 2;
      const my = (a.y + b.y) / 2;

      // Offset label slightly perpendicular to edge
      const dx = b.x - a.x, dy = b.y - a.y;
      const d = Math.hypot(dx, dy) || 1;
      const nx = -dy / d * 10, ny = dx / d * 10;

      const text = ns('text');
      text.setAttribute('x', mx + nx);
      text.setAttribute('y', my + ny);
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('dominant-baseline', 'middle');
      text.setAttribute('class', 'measure-edge');
      text.textContent = `${len.toFixed(1)}ft`;
      g.appendChild(text);
    }

    // Area label at centroid
    const areaFt = polyAreaFt(pts);
    if (areaFt > 0.5) {
      const c = centroid(pts);
      const text = ns('text');
      text.setAttribute('x', c.x);
      text.setAttribute('y', c.y);
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('dominant-baseline', 'middle');
      text.setAttribute('class', 'measure-area');
      text.textContent = areaFt >= 100 ? `${Math.round(areaFt)} ft\u00b2` : `${areaFt.toFixed(1)} ft\u00b2`;
      g.appendChild(text);
    }
  }

  svg.appendChild(g);
}

export function toggleMeasurements() {
  measurementsVisible = !measurementsVisible;
  const btn = document.getElementById('btn-measure');
  if (btn) btn.classList.toggle('active', measurementsVisible);
  renderMeasurements();
}

export function isMeasurementsVisible() {
  return measurementsVisible;
}
