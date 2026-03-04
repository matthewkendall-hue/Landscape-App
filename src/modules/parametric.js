import { svgPt, setBanner, getSvg } from '../utils/svg.js';
import { ftToPx } from '../utils/geometry.js';
import { addShape, refreshShape, renderAllNodes } from './shapes.js';
import { snapshot } from './undoRedo.js';

let placementMode = null; // null | {kind: 'rect'|'circle', params: {...}}

function rectPoints(cx, cy, wPx, hPx) {
  return [
    { x: cx - wPx / 2, y: cy - hPx / 2 },
    { x: cx + wPx / 2, y: cy - hPx / 2 },
    { x: cx + wPx / 2, y: cy + hPx / 2 },
    { x: cx - wPx / 2, y: cy + hPx / 2 },
  ];
}

function circlePoints(cx, cy, rPx, n = 32) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const angle = (2 * Math.PI * i) / n - Math.PI / 2;
    pts.push({ x: cx + rPx * Math.cos(angle), y: cy + rPx * Math.sin(angle) });
  }
  return pts;
}

export function startParametricPlacement(kind) {
  // Show settings popover
  const popover = document.getElementById('param-popover');
  if (!popover) return;

  placementMode = { kind };
  popover.style.display = 'block';

  const inner = document.getElementById('param-fields');
  if (kind === 'rect') {
    inner.innerHTML = `
      <label>Width (ft) <input type="number" id="param-w" value="10" min="1" step="0.5"/></label>
      <label>Length (ft) <input type="number" id="param-l" value="15" min="1" step="0.5"/></label>`;
  } else {
    inner.innerHTML = `
      <label>Diameter (ft) <input type="number" id="param-d" value="10" min="1" step="0.5"/></label>`;
  }

  getSvg().style.cursor = 'crosshair';
  setBanner(`Click on canvas to place ${kind === 'rect' ? 'rectangle' : 'circle'} · Esc to cancel`);
}

export function cancelParametric() {
  placementMode = null;
  const popover = document.getElementById('param-popover');
  if (popover) popover.style.display = 'none';
  getSvg().style.cursor = 'default';
  setBanner('', false);
}

export function isParametricMode() {
  return !!placementMode;
}

export function handleParametricClick(evt) {
  if (!placementMode) return false;

  const p = svgPt(evt);
  const { kind } = placementMode;
  let pts, parametric;

  if (kind === 'rect') {
    const w = parseFloat(document.getElementById('param-w')?.value) || 10;
    const l = parseFloat(document.getElementById('param-l')?.value) || 15;
    const wPx = ftToPx(w), hPx = ftToPx(l);
    pts = rectPoints(p.x, p.y, wPx, hPx);
    parametric = { kind: 'rect', width: w, length: l, originX: p.x, originY: p.y };
  } else {
    const d = parseFloat(document.getElementById('param-d')?.value) || 10;
    const rPx = ftToPx(d) / 2;
    pts = circlePoints(p.x, p.y, rPx);
    parametric = { kind: 'circle', diameter: d, originX: p.x, originY: p.y };
  }

  const shape = addShape('landscape', pts);
  shape.parametric = parametric;

  cancelParametric();
  setBanner(`${kind === 'rect' ? 'Rectangle' : 'Circle'} planter created`, true);
  setTimeout(() => setBanner('', false), 2500);
  return true;
}

export function renderParametricPanel(shape) {
  const panel = document.getElementById('param-edit-panel');
  if (!panel) return;

  if (!shape || !shape.parametric) {
    panel.style.display = 'none';
    return;
  }

  panel.style.display = 'block';
  const p = shape.parametric;

  if (p.kind === 'rect') {
    panel.innerHTML = `
      <div class="form-title">Planter Dimensions</div>
      <div class="param-edit-grid">
        <label>W <input type="number" id="pe-w" value="${p.width}" min="1" step="0.5"/></label>
        <label>L <input type="number" id="pe-l" value="${p.length}" min="1" step="0.5"/></label>
      </div>`;
    panel.querySelector('#pe-w').addEventListener('change', e => updateParametric(shape, { width: parseFloat(e.target.value) || p.width }));
    panel.querySelector('#pe-l').addEventListener('change', e => updateParametric(shape, { length: parseFloat(e.target.value) || p.length }));
  } else {
    panel.innerHTML = `
      <div class="form-title">Planter Dimensions</div>
      <div class="param-edit-grid">
        <label>Dia <input type="number" id="pe-d" value="${p.diameter}" min="1" step="0.5"/></label>
      </div>`;
    panel.querySelector('#pe-d').addEventListener('change', e => updateParametric(shape, { diameter: parseFloat(e.target.value) || p.diameter }));
  }
}

function updateParametric(shape, changes) {
  snapshot();
  Object.assign(shape.parametric, changes);
  const p = shape.parametric;

  let pts;
  if (p.kind === 'rect') {
    pts = rectPoints(p.originX, p.originY, ftToPx(p.width), ftToPx(p.length));
  } else {
    pts = circlePoints(p.originX, p.originY, ftToPx(p.diameter) / 2);
  }
  shape.points = pts;
  refreshShape(shape);
  renderAllNodes();
}

export function initParametric() {
  document.getElementById('btn-param-rect')?.addEventListener('click', () => startParametricPlacement('rect'));
  document.getElementById('btn-param-circle')?.addEventListener('click', () => startParametricPlacement('circle'));

  window.addEventListener('keydown', e => {
    if (e.key === 'Escape' && placementMode) cancelParametric();
  });
}
