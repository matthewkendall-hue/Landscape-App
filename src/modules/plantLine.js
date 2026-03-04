// plantLine.js — Plant Line Tool
// Draw a polyline path, then place plants evenly along it.

import { state, shapes } from '../state.js';
import { ns, svgPt, setBanner, getSvg } from '../utils/svg.js';
import { ftToPx, ptInPoly } from '../utils/geometry.js';
import { getSiteShape } from './shapes.js';
import { renderPlants, renderList } from './plants.js';
import { snapshot } from './undoRedo.js';

let lineMode = null; // null | { points, previewLine, ghostDots }

export function isPlantLineMode() { return !!lineMode; }

export function startPlantLine() {
  cancelPlantLine();
  lineMode = { points: [], previewLine: null, ghostDots: [] };
  getSvg().style.cursor = 'crosshair';
  document.getElementById('btn-plant-line')?.classList.add('active');
  setBanner('Plant Line — click to add points · Enter or double-click to finish · Esc to cancel');
  showPopover();
}

export function cancelPlantLine() {
  if (!lineMode) return;
  if (lineMode.previewLine) lineMode.previewLine.remove();
  lineMode.ghostDots.forEach(d => d.remove());
  lineMode = null;
  getSvg().style.cursor = 'default';
  document.getElementById('btn-plant-line')?.classList.remove('active');
  setBanner('', false);
  hidePopover();
}

let lastLineClickTime = 0;

export function handlePlantLineClick(evt) {
  if (!lineMode) return false;

  const now = Date.now();
  if (now - lastLineClickTime < 300) {
    // Double-click → finish
    if (lineMode.points.length >= 2) {
      lineMode.points.pop();
      lineMode.ghostDots.pop()?.remove();
      finishPlantLine();
    }
    return true;
  }
  lastLineClickTime = now;

  const p = svgPt(evt);
  lineMode.points.push({ x: p.x, y: p.y });
  const dot = ns('circle');
  dot.setAttribute('cx', p.x);
  dot.setAttribute('cy', p.y);
  dot.setAttribute('r', '4');
  dot.setAttribute('fill', '#8cc63f');
  dot.setAttribute('class', 'ghost-dot');
  getSvg().appendChild(dot);
  lineMode.ghostDots.push(dot);
  updateInfo();
  return true;
}

export function handlePlantLineMove(evt) {
  if (!lineMode || !lineMode.points.length) return;
  const p = svgPt(evt);
  if (lineMode.previewLine) lineMode.previewLine.remove();
  const pts = [...lineMode.points, { x: p.x, y: p.y }];
  const poly = ns('polyline');
  poly.setAttribute('points', pts.map(pt => `${pt.x},${pt.y}`).join(' '));
  poly.setAttribute('fill', 'none');
  poly.setAttribute('stroke', '#8cc63f');
  poly.setAttribute('stroke-width', '2');
  poly.setAttribute('stroke-dasharray', '6,4');
  poly.setAttribute('opacity', '0.7');
  getSvg().appendChild(poly);
  lineMode.previewLine = poly;
}

export function finishPlantLine() {
  if (!lineMode || lineMode.points.length < 2) return;
  const points = [...lineMode.points];
  const config = getConfig();

  // Cleanup drawing
  if (lineMode.previewLine) lineMode.previewLine.remove();
  lineMode.ghostDots.forEach(d => d.remove());
  lineMode = null;
  getSvg().style.cursor = 'default';
  document.getElementById('btn-plant-line')?.classList.remove('active');
  setBanner('', false);
  hidePopover();

  if (!config.plant) { alert('Select a plant for the line.'); return; }
  placePlantsAlongLine(points, config);
}

function placePlantsAlongLine(points, config) {
  snapshot();

  // Calculate total path length and segments
  let totalLen = 0;
  const segments = [];
  for (let i = 0; i < points.length - 1; i++) {
    const len = Math.hypot(points[i + 1].x - points[i].x, points[i + 1].y - points[i].y);
    segments.push({ start: points[i], end: points[i + 1], len });
    totalLen += len;
  }

  const count = config.count;
  if (count < 1 || totalLen < 1) return;

  const site = getSiteShape();
  const plants = config.pattern === 'alternating' && config.plant2
    ? [config.plant, config.plant2]
    : [config.plant];

  for (let i = 0; i < count; i++) {
    const dist = count > 1 ? (totalLen / (count - 1)) * i : totalLen / 2;
    const pos = pointAtDistance(segments, dist);
    if (!pos) continue;

    const plant = plants[i % plants.length];
    const spacingPx = ftToPx(plant.spacing || plant.width || 3);
    const r = spacingPx / 2 * 0.95;

    // Validate position
    const inSite = site ? ptInPoly(pos.x, pos.y, site.points) : true;
    const inObstacle = shapes.some(s =>
      (s.type === 'house' || s.type === 'patio') && ptInPoly(pos.x, pos.y, s.points)
    );
    if (!inSite || inObstacle) continue;

    // Detect landscape area
    const targetArea = shapes.find(s =>
      s.type === 'landscape' && s.closed && ptInPoly(pos.x, pos.y, s.points)
    );

    state.placed.push({
      id: crypto.randomUUID(),
      x: pos.x, y: pos.y, r,
      plantId: plant.id,
      name: plant.name,
      layer: plant.layer,
      spacing: plant.spacing,
      light: plant.light,
      water: plant.water,
      areaId: targetArea ? targetArea.id : undefined,
    });
  }

  renderPlants();
  renderList();
}

function pointAtDistance(segments, dist) {
  let accum = 0;
  for (const seg of segments) {
    if (accum + seg.len >= dist || seg === segments[segments.length - 1]) {
      const t = seg.len > 0 ? Math.min(1, (dist - accum) / seg.len) : 0;
      return {
        x: seg.start.x + (seg.end.x - seg.start.x) * t,
        y: seg.start.y + (seg.end.y - seg.start.y) * t,
      };
    }
    accum += seg.len;
  }
  return segments[segments.length - 1]?.end;
}

// ---- Popover UI ----

function showPopover() {
  let el = document.getElementById('plant-line-popover');
  if (!el) createPopover();
  el = document.getElementById('plant-line-popover');
  el.style.display = 'block';
  populateSelects();
}

function hidePopover() {
  const el = document.getElementById('plant-line-popover');
  if (el) el.style.display = 'none';
}

function createPopover() {
  const wrap = document.getElementById('canvas-wrap');
  const div = document.createElement('div');
  div.id = 'plant-line-popover';
  div.innerHTML = `
    <div class="form-title">Plant Line</div>
    <div class="pl-fields">
      <label>Plant <select id="pl-plant"></select></label>
      <label>Count <input type="number" id="pl-count" value="5" min="1" max="100"/></label>
      <label>Pattern
        <select id="pl-pattern">
          <option value="even">Evenly Spaced</option>
          <option value="alternating">Alternating (2 species)</option>
        </select>
      </label>
      <div id="pl-plant2-wrap" style="display:none">
        <label>Plant 2 <select id="pl-plant2"></select></label>
      </div>
    </div>
    <div class="pl-info" id="pl-preview-info">Click to add points</div>
  `;
  div.style.display = 'none';
  wrap.appendChild(div);

  div.querySelector('#pl-pattern').addEventListener('change', e => {
    document.getElementById('pl-plant2-wrap').style.display =
      e.target.value === 'alternating' ? 'block' : 'none';
  });
}

function populateSelects() {
  // Combine all plant sources, dedup by id
  const seen = new Set();
  const all = [];
  const addPlant = p => { if (!seen.has(p.id)) { seen.add(p.id); all.push(p); } };

  state.myPlants.forEach(mp => addPlant({
    id: mp.plantId, name: mp.name, layer: mp.layer,
    spacing: mp.spacing, light: mp.light, water: mp.water,
    width: mp.width, height: mp.height,
  }));
  state.queue.forEach(addPlant);
  state.plants.forEach(addPlant);

  const html = all.map(p => `<option value="${p.id}">${p.name} (${p.layer})</option>`).join('');
  ['pl-plant', 'pl-plant2'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = html;
  });
}

function getConfig() {
  const plantId = document.getElementById('pl-plant')?.value;
  const count = parseInt(document.getElementById('pl-count')?.value) || 5;
  const pattern = document.getElementById('pl-pattern')?.value || 'even';
  const plant2Id = document.getElementById('pl-plant2')?.value;

  // Build lookup
  const seen = new Set();
  const all = [];
  const addPlant = p => { if (!seen.has(p.id)) { seen.add(p.id); all.push(p); } };
  state.myPlants.forEach(mp => addPlant({
    id: mp.plantId, name: mp.name, layer: mp.layer,
    spacing: mp.spacing, light: mp.light, water: mp.water,
    width: mp.width, height: mp.height,
  }));
  state.queue.forEach(addPlant);
  state.plants.forEach(addPlant);

  return {
    plant: all.find(p => p.id === plantId) || null,
    plant2: all.find(p => p.id === plant2Id) || null,
    count,
    pattern,
  };
}

function updateInfo() {
  const el = document.getElementById('pl-preview-info');
  if (el && lineMode) {
    el.textContent = `${lineMode.points.length} point${lineMode.points.length !== 1 ? 's' : ''} placed`;
  }
}

export function initPlantLine() {
  window.addEventListener('keydown', e => {
    if (!lineMode) return;
    if (e.key === 'Escape') cancelPlantLine();
    if (e.key === 'Enter' && lineMode.points.length >= 2) finishPlantLine();
  });
}
