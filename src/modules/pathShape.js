/**
 * Path Shape Module — Spine (straight) & Spline (curved) paths
 *
 * Supports:
 *  - Drawing open paths (click to add control points)
 *  - Catmull-Rom spline rendering through SVG cubic Bezier
 *  - Persistent plant lines along paths
 *  - Path offset to generate footprint polygons
 */

import { TYPE_CFG } from '../config.js';
import { shapes, selectedShapeId, state } from '../state.js';
import { ns, svgPt, setBanner, getSvg } from '../utils/svg.js';
import { selectShape, renderAllNodes, addShape } from './shapes.js';
import { renderShapeList } from './shapeList.js';
import { snapshot } from './undoRedo.js';
import { ptInPoly, ftToPx } from '../utils/geometry.js';
import { renderPlants, renderList } from './plants.js';

// ─── SVG Path Generation ────────────────────────────────────────────

/** Straight polyline → SVG path d attribute */
function polylineToSvgPath(pts) {
  if (pts.length < 2) return '';
  return 'M ' + pts.map(p => `${p.x} ${p.y}`).join(' L ');
}

/** Catmull-Rom through control points → SVG cubic Bezier path */
function catmullRomToSvgPath(pts) {
  if (pts.length < 2) return '';
  if (pts.length === 2) return polylineToSvgPath(pts);

  // Pad with phantom start/end points for smooth endpoints
  const padded = [pts[0], ...pts, pts[pts.length - 1]];
  let d = `M ${pts[0].x} ${pts[0].y}`;

  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = padded[i], p1 = padded[i + 1], p2 = padded[i + 2], p3 = padded[i + 3];
    // Catmull-Rom → cubic Bezier control points (1/6 tangent formula)
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

/** Get SVG d attribute for a path shape */
function pathToD(pts, smooth) {
  return smooth ? catmullRomToSvgPath(pts) : polylineToSvgPath(pts);
}

// ─── SVG Element Creation ───────────────────────────────────────────

/** Create SVG <path> element for a path shape */
export function makePathEl(pts, smooth = false) {
  const cfg = TYPE_CFG.path;
  const el = ns('path');
  el.setAttribute('d', pathToD(pts, smooth));
  el.setAttribute('fill', 'none');
  el.setAttribute('stroke', cfg.stroke);
  el.setAttribute('stroke-width', cfg.sw);
  if (cfg.dash) el.setAttribute('stroke-dasharray', cfg.dash);
  el.setAttribute('stroke-linecap', 'round');
  el.setAttribute('stroke-linejoin', 'round');
  return el;
}

// ─── Shape CRUD ─────────────────────────────────────────────────────

/** Create a path shape and add to shapes array */
export function addPathShape(pts, smooth = false) {
  snapshot();
  const svg = getSvg();
  const count = shapes.filter(s => s.type === 'path').length + 1;
  const label = count > 1 ? `Path ${count}` : 'Path';
  const el = makePathEl(pts, smooth);

  // Insert before plant circles (z-order)
  const firstPlant = svg.querySelector('circle.plant-circle');
  if (firstPlant) svg.insertBefore(el, firstPlant);
  else svg.appendChild(el);

  const shape = {
    id: crypto.randomUUID(),
    type: 'path',
    label,
    points: pts.map(p => ({ x: p.x, y: p.y })),
    svgEl: el,
    closed: false,
    smooth,
    plantLine: null,
  };

  shapes.push(shape);
  selectShape(shape.id);
  return shape;
}

/** Update SVG path from shape points. Redistribute plants if linked. */
export function refreshPathShape(shape) {
  if (shape.type !== 'path') return;
  shape.svgEl.setAttribute('d', pathToD(shape.points, shape.smooth));
}

// ─── Spline Sampling ────────────────────────────────────────────────

/** Evaluate Catmull-Rom at parameter t (0–1) for segment between p1 and p2 */
function catmullRomPoint(p0, p1, p2, p3, t) {
  const t2 = t * t, t3 = t2 * t;
  return {
    x: 0.5 * ((2 * p1.x) + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
    y: 0.5 * ((2 * p1.y) + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
  };
}

/** Sample a Catmull-Rom spline at many points for arc length / offset */
export function sampleSpline(pts, samplesPerSeg = 50) {
  if (pts.length < 2) return [...pts];
  if (pts.length === 2) return [...pts];

  const padded = [pts[0], ...pts, pts[pts.length - 1]];
  const result = [{ x: pts[0].x, y: pts[0].y }];

  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = padded[i], p1 = padded[i + 1], p2 = padded[i + 2], p3 = padded[i + 3];
    for (let s = 1; s <= samplesPerSeg; s++) {
      const t = s / samplesPerSeg;
      result.push(catmullRomPoint(p0, p1, p2, p3, t));
    }
  }
  return result;
}

// ─── Path Length & Interpolation ────────────────────────────────────

function polylineSegments(pts) {
  const segs = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1];
    segs.push({ start: a, end: b, len: Math.hypot(b.x - a.x, b.y - a.y) });
  }
  return segs;
}

/** Total path length (pixels) */
export function pathLength(shape) {
  const pts = shape.smooth && shape.points.length > 2
    ? sampleSpline(shape.points)
    : shape.points;
  let total = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    total += Math.hypot(pts[i + 1].x - pts[i].x, pts[i + 1].y - pts[i].y);
  }
  return total;
}

/** Interpolate position at given distance along a path */
export function pointAtDistanceOnPath(shape, dist) {
  const pts = shape.smooth && shape.points.length > 2
    ? sampleSpline(shape.points)
    : shape.points;
  const segs = polylineSegments(pts);
  let accum = 0;
  for (const seg of segs) {
    if (accum + seg.len >= dist || seg === segs[segs.length - 1]) {
      const t = seg.len > 0 ? Math.min(1, Math.max(0, (dist - accum) / seg.len)) : 0;
      return {
        x: seg.start.x + (seg.end.x - seg.start.x) * t,
        y: seg.start.y + (seg.end.y - seg.start.y) * t,
      };
    }
    accum += seg.len;
  }
  return pts[pts.length - 1];
}

// ─── Plant Line Placement ───────────────────────────────────────────

/** Get combined plant list from all sources, deduplicated */
function getAllPlantSources() {
  const seen = new Set();
  const all = [];
  const sources = [
    ...state.myPlants.map(mp => ({
      id: mp.plantId || mp.id, name: mp.name, layer: mp.layer,
      spacing: mp.spacing, light: mp.light, water: mp.water, width: mp.width,
    })),
    ...state.queue,
    ...state.plants,
  ];
  for (const p of sources) {
    const key = p.id || p.name;
    if (!seen.has(key)) { seen.add(key); all.push(p); }
  }
  return all;
}

/** Place plants evenly along a path shape */
export function placePlantsAlongPath(shape) {
  if (!shape.plantLine) return;
  const cfg = shape.plantLine;
  const allPlants = getAllPlantSources();
  const plant = allPlants.find(p => (p.id || p.name) === cfg.plantId);
  if (!plant) return;
  const plant2 = cfg.plant2Id ? allPlants.find(p => (p.id || p.name) === cfg.plant2Id) : null;

  // Remove existing plants for this path
  state.placed = state.placed.filter(p => p.pathId !== shape.id);

  const totalLen = pathLength(shape);
  if (totalLen <= 0) return;

  const count = cfg.count || 1;
  const plants = cfg.pattern === 'alternating' && plant2 ? [plant, plant2] : [plant];
  const siteShape = shapes.find(s => s.type === 'site' && s.closed);

  for (let i = 0; i < count; i++) {
    const dist = count > 1 ? (totalLen / (count - 1)) * i : totalLen / 2;
    const pos = pointAtDistanceOnPath(shape, dist);
    if (!pos) continue;

    const curPlant = plants[i % plants.length];
    const spacingPx = ftToPx(curPlant.spacing || curPlant.width || 3);
    const r = spacingPx / 2 * 0.95;

    // Validate position
    if (siteShape && !ptInPoly(pos.x, pos.y, siteShape.points)) continue;
    const inObstacle = shapes.some(s =>
      (s.type === 'house' || s.type === 'patio') && ptInPoly(pos.x, pos.y, s.points)
    );
    if (inObstacle) continue;

    // Detect landscape area
    const targetArea = shapes.find(s =>
      s.type === 'landscape' && s.closed && ptInPoly(pos.x, pos.y, s.points)
    );

    state.placed.push({
      id: crypto.randomUUID(),
      x: pos.x, y: pos.y, r,
      plantId: curPlant.id || curPlant.name,
      name: curPlant.name,
      layer: curPlant.layer,
      spacing: curPlant.spacing,
      light: curPlant.light,
      water: curPlant.water,
      areaId: targetArea ? targetArea.id : undefined,
      pathId: shape.id,
    });
  }

  renderPlants();
  renderList();
}

/** Re-distribute plants when path is edited */
export function redistributePlantsOnPath(shape) {
  if (!shape.plantLine) return;
  placePlantsAlongPath(shape);
}

// ─── Path Offset ────────────────────────────────────────────────────

/** Compute perpendicular unit normals at each point of a polyline */
function computeNormals(pts) {
  return pts.map((p, i) => {
    let dx, dy;
    if (i === 0) {
      dx = pts[1].x - pts[0].x;
      dy = pts[1].y - pts[0].y;
    } else if (i === pts.length - 1) {
      dx = pts[i].x - pts[i - 1].x;
      dy = pts[i].y - pts[i - 1].y;
    } else {
      dx = pts[i + 1].x - pts[i - 1].x;
      dy = pts[i + 1].y - pts[i - 1].y;
    }
    const len = Math.hypot(dx, dy) || 1;
    return { x: -dy / len, y: dx / len };
  });
}

/** Generate closed polygon from centerline path + width + justification */
export function offsetPathToPolygon(points, widthFt, justify, smooth = false) {
  const widthPx = ftToPx(widthFt);

  // Dense sampling for smooth paths
  const sampled = smooth && points.length > 2
    ? sampleSpline(points, 50)
    : points;

  const normals = computeNormals(sampled);

  let leftOff, rightOff;
  switch (justify) {
    case 'left':
      leftOff = 0; rightOff = widthPx; break;
    case 'right':
      leftOff = widthPx; rightOff = 0; break;
    default: // center
      leftOff = widthPx / 2; rightOff = widthPx / 2; break;
  }

  const leftSide = sampled.map((p, i) => ({
    x: p.x + normals[i].x * leftOff,
    y: p.y + normals[i].y * leftOff,
  }));
  const rightSide = sampled.map((p, i) => ({
    x: p.x - normals[i].x * rightOff,
    y: p.y - normals[i].y * rightOff,
  }));

  return [...leftSide, ...rightSide.reverse()];
}

// ─── Path Drawing Mode ──────────────────────────────────────────────

let pathMode = null; // { points, previewEl, ghostDots, smooth }
let lastPathClick = 0;

export function isPathDrawingMode() { return !!pathMode; }

export function startPathDrawing(smooth = false) {
  cancelPathDrawing();
  // Cancel other drawing modes
  const { cancelDrawing } = require_drawing();
  cancelDrawing();

  pathMode = { points: [], previewEl: null, ghostDots: [], smooth };
  getSvg().style.cursor = 'crosshair';
  setBanner(`Draw ${smooth ? 'Spline' : 'Spine'} — click to add points · Enter/dbl-click to finish · Esc to cancel`);
}

export function cancelPathDrawing() {
  if (!pathMode) return;
  if (pathMode.previewEl) pathMode.previewEl.remove();
  pathMode.ghostDots.forEach(d => d.remove());
  pathMode = null;
  getSvg().style.cursor = 'default';
  setBanner('', false);
}

export function handlePathClick(evt) {
  if (!pathMode) return true;
  const p = svgPt(evt);
  const now = Date.now();

  // Double-click detection
  if (now - lastPathClick < 300 && pathMode.points.length >= 2) {
    pathMode.points.pop(); // Remove duplicate
    finishPathDrawing();
    lastPathClick = 0;
    return true;
  }
  lastPathClick = now;

  // Add point
  pathMode.points.push({ x: p.x, y: p.y });

  // Ghost dot
  const dot = ns('circle');
  dot.setAttribute('cx', p.x);
  dot.setAttribute('cy', p.y);
  dot.setAttribute('r', '5');
  dot.setAttribute('fill', TYPE_CFG.path.stroke);
  dot.setAttribute('stroke', '#fff');
  dot.setAttribute('stroke-width', '1');
  dot.setAttribute('class', 'ghost-dot');
  getSvg().appendChild(dot);
  pathMode.ghostDots.push(dot);

  return true;
}

export function handlePathMove(evt) {
  if (!pathMode || pathMode.points.length < 1) return;
  const p = svgPt(evt);

  if (pathMode.previewEl) pathMode.previewEl.remove();

  const allPts = [...pathMode.points, { x: p.x, y: p.y }];
  const el = ns('path');
  el.setAttribute('d', pathToD(allPts, pathMode.smooth));
  el.setAttribute('fill', 'none');
  el.setAttribute('stroke', TYPE_CFG.path.stroke);
  el.setAttribute('stroke-width', '2');
  el.setAttribute('stroke-dasharray', '6,4');
  el.setAttribute('opacity', '0.7');
  getSvg().appendChild(el);
  pathMode.previewEl = el;
}

function finishPathDrawing() {
  if (!pathMode || pathMode.points.length < 2) return;
  const pts = [...pathMode.points];
  const smooth = pathMode.smooth;

  // Cleanup
  if (pathMode.previewEl) pathMode.previewEl.remove();
  pathMode.ghostDots.forEach(d => d.remove());
  pathMode = null;
  getSvg().style.cursor = 'default';
  setBanner('', false);

  addPathShape(pts, smooth);
  renderAllNodes();
  renderShapeList();
}

// Lazy import to avoid circular dependency with drawing.js
let _cancelDrawing = null;
function require_drawing() {
  if (!_cancelDrawing) {
    // Will be set by initPathDrawing
  }
  return { cancelDrawing: _cancelDrawing || (() => {}) };
}

export function initPathDrawing(cancelDrawingFn) {
  _cancelDrawing = cancelDrawingFn;

  document.addEventListener('keydown', e => {
    if (!pathMode) return;
    if (e.key === 'Escape') { cancelPathDrawing(); }
    if (e.key === 'Enter' && pathMode.points.length >= 2) { finishPathDrawing(); }
  });
}

// ─── Path Edit Panel ────────────────────────────────────────────────

export function renderPathPanel(shape) {
  const panel = document.getElementById('path-edit-panel');
  if (!panel) return;

  if (!shape || shape.type !== 'path') {
    panel.style.display = 'none';
    return;
  }

  panel.style.display = 'block';
  panel.innerHTML = '';

  // Header
  const header = document.createElement('div');
  header.className = 'pane-header';
  header.innerHTML = `<span class="pane-title">${shape.label}</span>`;
  panel.appendChild(header);

  const body = document.createElement('div');
  body.style.padding = '8px 10px';

  // ─── Spine / Spline Toggle ───
  const toggleDiv = document.createElement('div');
  toggleDiv.className = 'path-toggle';

  const spineBtn = document.createElement('button');
  spineBtn.className = 'btn' + (!shape.smooth ? ' active' : '');
  spineBtn.textContent = 'Spine';
  spineBtn.onclick = () => {
    if (!shape.smooth) return;
    snapshot();
    shape.smooth = false;
    refreshPathShape(shape);
    renderAllNodes();
    renderPathPanel(shape);
  };

  const splineBtn = document.createElement('button');
  splineBtn.className = 'btn' + (shape.smooth ? ' active' : '');
  splineBtn.textContent = 'Spline';
  splineBtn.onclick = () => {
    if (shape.smooth) return;
    snapshot();
    shape.smooth = true;
    refreshPathShape(shape);
    renderAllNodes();
    renderPathPanel(shape);
  };

  toggleDiv.appendChild(spineBtn);
  toggleDiv.appendChild(splineBtn);
  body.appendChild(toggleDiv);

  // ─── Plant Line Section ───
  const plSection = document.createElement('div');
  plSection.style.marginTop = '8px';

  if (shape.plantLine) {
    plSection.innerHTML = '<div class="form-title" style="font-size:10px;margin-bottom:6px">Plant Line</div>';
    const fields = document.createElement('div');
    fields.className = 'path-pl-fields';

    // Plant selector
    const allPlants = getAllPlantSources();
    fields.appendChild(makePlantSelect('Plant', 'path-pl-plant', shape.plantLine.plantId, allPlants));

    // Count
    const countRow = document.createElement('label');
    countRow.innerHTML = 'Count ';
    const countInput = document.createElement('input');
    countInput.type = 'number'; countInput.min = '1'; countInput.max = '200';
    countInput.value = shape.plantLine.count || 5;
    countInput.id = 'path-pl-count';
    countRow.appendChild(countInput);
    fields.appendChild(countRow);

    // Pattern
    const patRow = document.createElement('label');
    patRow.innerHTML = 'Pattern ';
    const patSel = document.createElement('select');
    patSel.id = 'path-pl-pattern';
    patSel.innerHTML = `<option value="even" ${shape.plantLine.pattern !== 'alternating' ? 'selected' : ''}>Evenly Spaced</option><option value="alternating" ${shape.plantLine.pattern === 'alternating' ? 'selected' : ''}>Alternating</option>`;
    patRow.appendChild(patSel);
    fields.appendChild(patRow);

    // Plant 2 (for alternating)
    const p2Row = makePlantSelect('Plant 2', 'path-pl-plant2', shape.plantLine.plant2Id, allPlants);
    p2Row.style.display = shape.plantLine.pattern === 'alternating' ? '' : 'none';
    p2Row.id = 'path-pl-p2-row';
    fields.appendChild(p2Row);

    patSel.onchange = () => {
      p2Row.style.display = patSel.value === 'alternating' ? '' : 'none';
    };

    plSection.appendChild(fields);

    // Update button
    const updateBtn = document.createElement('button');
    updateBtn.className = 'btn primary';
    updateBtn.textContent = 'Update Plants';
    updateBtn.style.cssText = 'width:100%;margin-top:6px;font-size:10px';
    updateBtn.onclick = () => {
      snapshot();
      const sel = document.getElementById('path-pl-plant');
      const cnt = document.getElementById('path-pl-count');
      const pat = document.getElementById('path-pl-pattern');
      const sel2 = document.getElementById('path-pl-plant2');
      const selPlant = allPlants.find(p => (p.id || p.name) === sel.value);
      shape.plantLine.plantId = sel.value;
      shape.plantLine.plantName = selPlant ? selPlant.name : '';
      shape.plantLine.count = parseInt(cnt.value) || 5;
      shape.plantLine.pattern = pat.value;
      if (pat.value === 'alternating' && sel2) {
        shape.plantLine.plant2Id = sel2.value || null;
        const p2 = allPlants.find(p => (p.id || p.name) === sel2.value);
        shape.plantLine.plant2Name = p2 ? p2.name : null;
      } else {
        shape.plantLine.plant2Id = null;
        shape.plantLine.plant2Name = null;
      }
      placePlantsAlongPath(shape);
    };
    plSection.appendChild(updateBtn);

    // Remove plants button
    const removeBtn = document.createElement('button');
    removeBtn.className = 'btn danger';
    removeBtn.textContent = 'Remove Plants';
    removeBtn.style.cssText = 'width:100%;margin-top:4px;font-size:10px';
    removeBtn.onclick = () => {
      snapshot();
      shape.plantLine = null;
      state.placed = state.placed.filter(p => p.pathId !== shape.id);
      renderPlants();
      renderList();
      renderPathPanel(shape);
    };
    plSection.appendChild(removeBtn);
  } else {
    const addBtn = document.createElement('button');
    addBtn.className = 'btn';
    addBtn.textContent = '+ Add Plants Along Path';
    addBtn.style.cssText = 'width:100%;font-size:10px';
    addBtn.onclick = () => {
      const allPlants = getAllPlantSources();
      if (!allPlants.length) { alert('Add plants to library first.'); return; }
      snapshot();
      shape.plantLine = {
        plantId: allPlants[0].id || allPlants[0].name,
        plantName: allPlants[0].name,
        plant2Id: null, plant2Name: null,
        count: 5, pattern: 'even',
      };
      placePlantsAlongPath(shape);
      renderPathPanel(shape);
    };
    plSection.appendChild(addBtn);
  }
  body.appendChild(plSection);

  // ─── Path Offset Section ───
  const offsetSection = document.createElement('div');
  offsetSection.className = 'path-offset-section';
  offsetSection.innerHTML = '<div class="form-title" style="font-size:10px;margin-bottom:6px">Generate Footprint</div>';

  const oFields = document.createElement('div');
  oFields.className = 'path-pl-fields';

  // Width
  const wRow = document.createElement('label');
  wRow.innerHTML = 'Width (ft) ';
  const wInput = document.createElement('input');
  wInput.type = 'number'; wInput.min = '0.5'; wInput.step = '0.5'; wInput.value = '4';
  wInput.id = 'path-offset-width';
  wRow.appendChild(wInput);
  oFields.appendChild(wRow);

  // Justify
  const jRow = document.createElement('label');
  jRow.innerHTML = 'Justify ';
  const jSel = document.createElement('select');
  jSel.id = 'path-offset-justify';
  jSel.innerHTML = '<option value="center">Center</option><option value="left">Left Edge</option><option value="right">Right Edge</option>';
  jRow.appendChild(jSel);
  oFields.appendChild(jRow);

  // Create as type
  const tRow = document.createElement('label');
  tRow.innerHTML = 'Type ';
  const tSel = document.createElement('select');
  tSel.id = 'path-offset-type';
  tSel.innerHTML = '<option value="landscape">Landscape</option><option value="patio">Patio</option><option value="canopy">Canopy</option><option value="site">Site</option><option value="house">House</option>';
  tRow.appendChild(tSel);
  oFields.appendChild(tRow);

  offsetSection.appendChild(oFields);

  const genBtn = document.createElement('button');
  genBtn.className = 'btn primary';
  genBtn.textContent = 'Generate Footprint';
  genBtn.style.cssText = 'width:100%;margin-top:6px;font-size:10px';
  genBtn.onclick = () => {
    const w = parseFloat(document.getElementById('path-offset-width').value) || 4;
    const j = document.getElementById('path-offset-justify').value;
    const t = document.getElementById('path-offset-type').value;
    const pts = offsetPathToPolygon(shape.points, w, j, shape.smooth);
    if (pts.length < 3) { alert('Could not generate polygon from this path.'); return; }
    addShape(t, pts);
    renderAllNodes();
    renderShapeList();
  };
  offsetSection.appendChild(genBtn);
  body.appendChild(offsetSection);

  panel.appendChild(body);
}

// Helper: create a plant selector label+select
function makePlantSelect(labelText, id, currentVal, allPlants) {
  const row = document.createElement('label');
  row.innerHTML = labelText + ' ';
  const sel = document.createElement('select');
  sel.id = id;
  for (const p of allPlants) {
    const opt = document.createElement('option');
    opt.value = p.id || p.name;
    opt.textContent = `${p.name} (${p.layer})`;
    if ((p.id || p.name) === currentVal) opt.selected = true;
    sel.appendChild(opt);
  }
  row.appendChild(sel);
  return row;
}
