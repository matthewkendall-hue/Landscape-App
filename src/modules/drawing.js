import { TYPE_CFG } from '../config.js';
import * as st from '../state.js';
import { ns, svgPt, setBanner, getSvg } from '../utils/svg.js';
import { addShape, renderAllNodes, selectShape, refreshShape } from './shapes.js';
import { renderShapeList } from './shapeList.js';
import { movePlant, endPlantDrag } from './plants.js';
import { undo, redo } from './undoRedo.js';
import { isParametricMode, handleParametricClick } from './parametric.js';
import { isPlantLineMode, handlePlantLineClick, handlePlantLineMove } from './plantLine.js';
import { isPathDrawingMode, handlePathClick, handlePathMove } from './pathShape.js';

let lastClickTime = 0;

export function startDrawing(type) {
  cancelDrawing();
  st.setDrawingType(type);
  st.setDrawingPts([]);
  getSvg().style.cursor = 'crosshair';
  document.querySelectorAll('[id^="btn-draw-"]').forEach(b => b.classList.remove('active'));
  document.getElementById('btn-draw-' + type).classList.add('active');
  setBanner(`Draw ${TYPE_CFG[type].label} — click to add vertices · Enter or double-click to finish · Esc to cancel`);
}

export function cancelDrawing() {
  if (!st.drawingType) return;
  st.setDrawingType(null);
  st.setDrawingPts([]);
  if (st.previewPoly) { st.previewPoly.remove(); st.setPreviewPoly(null); }
  st.ghostDots.forEach(d => d.remove());
  st.setGhostDots([]);
  getSvg().style.cursor = 'default';
  document.querySelectorAll('[id^="btn-draw-"]').forEach(b => b.classList.remove('active'));
  setBanner('', false);
}

function addDrawPt(x, y) {
  st.drawingPts.push({ x, y });
  const cfg = TYPE_CFG[st.drawingType];
  const dot = ns('circle');
  dot.setAttribute('cx', x);
  dot.setAttribute('cy', y);
  dot.setAttribute('r', '4');
  dot.setAttribute('fill', cfg.stroke);
  dot.setAttribute('class', 'ghost-dot');
  getSvg().appendChild(dot);
  st.ghostDots.push(dot);
}

function updatePreview(cursorX, cursorY) {
  if (st.previewPoly) { st.previewPoly.remove(); st.setPreviewPoly(null); }
  if (!st.drawingType || st.drawingPts.length < 1) return;
  const cfg = TYPE_CFG[st.drawingType];
  const pts = [...st.drawingPts, { x: cursorX, y: cursorY }];
  const poly = ns('polyline');
  poly.setAttribute('points', pts.map(p => `${p.x},${p.y}`).join(' '));
  poly.setAttribute('fill', 'none');
  poly.setAttribute('stroke', cfg.stroke);
  poly.setAttribute('stroke-width', '1.5');
  poly.setAttribute('stroke-dasharray', '5,3');
  poly.setAttribute('opacity', '0.65');
  getSvg().appendChild(poly);
  st.setPreviewPoly(poly);
}

function finishDrawing() {
  if (!st.drawingType || st.drawingPts.length < 3) return;
  const type = st.drawingType;
  const pts = [...st.drawingPts];
  cancelDrawing();
  addShape(type, pts);
  renderAllNodes();
  renderShapeList();
  setBanner(`${TYPE_CFG[type].label} created — drag nodes to adjust · right-click node to delete · click mid-edge to add`, true);
  setTimeout(() => setBanner('', false), 4000);
}

export function initDrawingEvents() {
  const svg = getSvg();

  svg.addEventListener('click', evt => {
    // Path drawing mode intercept
    if (isPathDrawingMode()) {
      handlePathClick(evt);
      return;
    }

    // Plant line mode intercept
    if (isPlantLineMode()) {
      handlePlantLineClick(evt);
      return;
    }

    // Parametric placement intercept
    if (isParametricMode()) {
      handleParametricClick(evt);
      return;
    }

    const { shapes } = st;

    // shape selection when not drawing
    if (!st.drawingType) {
      for (const shape of shapes) {
        if (shape.svgEl === evt.target) { selectShape(shape.id); return; }
      }
      return;
    }

    const now = Date.now();
    if (now - lastClickTime < 300) {
      if (st.drawingPts.length >= 3) {
        st.drawingPts.pop();
        st.ghostDots.pop()?.remove();
        finishDrawing();
      }
      return;
    }
    lastClickTime = now;

    const p = svgPt(evt);
    if (st.drawingPts.length >= 3) {
      const fp = st.drawingPts[0];
      if (Math.hypot(p.x - fp.x, p.y - fp.y) < 14) { finishDrawing(); return; }
    }
    addDrawPt(p.x, p.y);
  });

  svg.addEventListener('mousemove', evt => {
    if (isPathDrawingMode()) handlePathMove(evt);
    if (isPlantLineMode()) handlePlantLineMove(evt);
    const p = svgPt(evt);
    if (st.drawingType) updatePreview(p.x, p.y);
    if (st.draggingNode) {
      const shape = st.shapes.find(s => s.id === st.draggingNode.shapeId);
      if (shape) {
        shape.points[st.draggingNode.idx] = { x: p.x, y: p.y };
        refreshShape(shape);
        renderAllNodes();
      }
    }
    if (st.draggingEdge) {
      const shape = st.shapes.find(s => s.id === st.draggingEdge.shapeId);
      if (shape) {
        const e = st.draggingEdge;
        const nextIdx = shape.closed ? (e.idx + 1) % shape.points.length : e.idx + 1;
        const dx = p.x - e.startSvg.x;
        const dy = p.y - e.startSvg.y;
        const proj = dx * e.normal.x + dy * e.normal.y;
        shape.points[e.idx] = { x: e.origA.x + e.normal.x * proj, y: e.origA.y + e.normal.y * proj };
        shape.points[nextIdx] = { x: e.origB.x + e.normal.x * proj, y: e.origB.y + e.normal.y * proj };
        refreshShape(shape);
        renderAllNodes();
      }
    }
    if (st.plantDrag) movePlant(evt);
  });

  window.addEventListener('mouseup', () => {
    // Redistribute plants on path after drag ends
    if (st.draggingNode || st.draggingEdge) {
      const shapeId = st.draggingNode?.shapeId || st.draggingEdge?.shapeId;
      const shape = shapeId ? st.shapes.find(s => s.id === shapeId) : null;
      if (shape?.type === 'path' && shape.plantLine) {
        import('./pathShape.js').then(m => m.redistributePlantsOnPath(shape));
      }
    }
    st.setDraggingNode(null);
    st.setDraggingEdge(null);
    endPlantDrag();
  });

  window.addEventListener('keydown', e => {
    if (e.key === 'Enter' && st.drawingType && st.drawingPts.length >= 3) finishDrawing();
    if (e.key === 'Escape') cancelDrawing();
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
    if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); redo(); }
  });
}
