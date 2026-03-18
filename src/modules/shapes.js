import { TYPE_CFG } from '../config.js';
import { shapes, selectedShapeId, setSelectedShapeId, setDraggingNode, setDraggingEdge, state } from '../state.js';
import { ns, getSvg, svgPt } from '../utils/svg.js';
import { renderShapeList } from './shapeList.js';
import { renderHouseEdge } from './houseEdge.js';
import { renderPlants, renderList } from './plants.js';
import { snapshot } from './undoRedo.js';

export function makeShapeEl(type, pts) {
  const cfg = TYPE_CFG[type];
  const el = ns('polygon');
  el.setAttribute('fill', cfg.fill);
  el.setAttribute('fill-opacity', cfg.fOpacity);
  el.setAttribute('stroke', cfg.stroke);
  el.setAttribute('stroke-width', cfg.sw);
  if (cfg.dash) el.setAttribute('stroke-dasharray', cfg.dash);
  el.setAttribute('stroke-linejoin', 'round');
  el.setAttribute('points', pts.map(p => `${p.x},${p.y}`).join(' '));
  return el;
}

export function addShape(type, pts) {
  snapshot();
  const svg = getSvg();
  const cfg = TYPE_CFG[type];
  const count = shapes.filter(s => s.type === type).length + 1;
  const label = count > 1 ? `${cfg.label} ${count}` : cfg.label;
  const el = makeShapeEl(type, pts);
  const firstPlant = svg.querySelector('circle.plant-circle');
  if (firstPlant) svg.insertBefore(el, firstPlant);
  else svg.appendChild(el);
  const shape = { id: crypto.randomUUID(), type, label, points: [...pts], svgEl: el, closed: true };
  shapes.push(shape);
  selectShape(shape.id);
  return shape;
}

export function deleteShape(id) {
  const idx = shapes.findIndex(s => s.id === id);
  if (idx < 0) return;
  snapshot();
  const shape = shapes[idx];
  // Clean up plants associated with a plant-line path
  if (shape.type === 'path' && shape.plantLine) {
    state.placed = state.placed.filter(p => p.pathId !== id);
    renderPlants();
    renderList();
  }
  shape.svgEl.remove();
  shapes.splice(idx, 1);
  if (selectedShapeId === id) setSelectedShapeId(null);
  renderAllNodes();
  renderShapeList();
  renderHouseEdge();
}

export function selectShape(id) {
  setSelectedShapeId(id);
  renderAllNodes();
  renderShapeList();
}

export function refreshShape(shape) {
  if (shape.type === 'path') {
    import('./pathShape.js').then(m => m.refreshPathShape(shape));
  } else {
    shape.svgEl.setAttribute('points', shape.points.map(p => `${p.x},${p.y}`).join(' '));
  }
  renderHouseEdge();
  renderPlants();
  // Lazy import to avoid circular dep — measurements.js is leaf-only
  import('./measurements.js').then(m => m.renderMeasurements());
}

export function getSiteShape() {
  return shapes.find(s => s.type === 'site' && s.closed);
}

export function renderAllNodes() {
  const svg = getSvg();
  svg.querySelectorAll('g.node-grp').forEach(n => n.remove());

  for (const shape of shapes) {
    if (!shape.closed && shape.type !== 'path') continue;
    const cfg = TYPE_CFG[shape.type];
    if (!cfg) continue;
    const isSel = shape.id === selectedShapeId;
    const g = ns('g');
    g.setAttribute('class', 'node-grp');

    // Open paths have N-1 edges; closed polygons have N edges (wrapping)
    const edgeCount = shape.closed ? shape.points.length : shape.points.length - 1;
    const minPts = shape.closed ? 3 : 2;

    shape.points.forEach((pt, idx) => {
      // Edge elements only for edges that exist
      if (idx < edgeCount) {
        const nextIdx = shape.closed ? (idx + 1) % shape.points.length : idx + 1;
        const next = shape.points[nextIdx];

        // edge drag hit area (invisible wide line)
        if (isSel) {
          const edge = ns('line');
          edge.setAttribute('x1', pt.x);
          edge.setAttribute('y1', pt.y);
          edge.setAttribute('x2', next.x);
          edge.setAttribute('y2', next.y);
          edge.setAttribute('stroke', 'transparent');
          edge.setAttribute('stroke-width', '14');
          edge.setAttribute('class', 'edge-hit');
          edge.style.cursor = 'move';
          edge.style.pointerEvents = 'stroke';
          edge.addEventListener('mousedown', e => {
            e.stopPropagation();
            snapshot();
            selectShape(shape.id);
            const dx = next.x - pt.x;
            const dy = next.y - pt.y;
            const len = Math.hypot(dx, dy) || 1;
            const startSvg = svgPt(e);
            setDraggingEdge({
              shapeId: shape.id,
              idx,
              startSvg,
              origA: { x: pt.x, y: pt.y },
              origB: { x: next.x, y: next.y },
              normal: { x: -dy / len, y: dx / len },
            });
          });
          g.appendChild(edge);
        }

        // mid-edge add-node button
        const mx = (pt.x + next.x) / 2, my = (pt.y + next.y) / 2;
        const mid = ns('circle');
        mid.setAttribute('cx', mx);
        mid.setAttribute('cy', my);
        mid.setAttribute('r', isSel ? 5 : 3.5);
        mid.setAttribute('fill', cfg.stroke);
        mid.setAttribute('fill-opacity', isSel ? 0.35 : 0.2);
        mid.setAttribute('stroke', cfg.stroke);
        mid.setAttribute('stroke-width', '1');
        mid.setAttribute('stroke-dasharray', '2,2');
        mid.style.cursor = 'copy';
        mid.title = 'Click to add node here';
        mid.addEventListener('mousedown', e => {
          e.stopPropagation();
          snapshot();
          shape.points.splice(idx + 1, 0, { x: mx, y: my });
          refreshShape(shape);
          renderAllNodes();
        });
        g.appendChild(mid);
      }

      // vertex node (always rendered for every point)
      const h = ns('circle');
      h.setAttribute('cx', pt.x);
      h.setAttribute('cy', pt.y);
      h.setAttribute('r', isSel ? 7 : 5);
      h.setAttribute('fill', isSel ? cfg.stroke : '#131a0f');
      h.setAttribute('stroke', cfg.stroke);
      h.setAttribute('stroke-width', isSel ? 2 : 1.5);
      h.setAttribute('fill-opacity', isSel ? 1 : 0.8);
      h.style.cursor = 'move';
      h.addEventListener('mousedown', e => {
        e.stopPropagation();
        snapshot();
        selectShape(shape.id);
        setDraggingNode({ shapeId: shape.id, idx });
      });
      h.addEventListener('contextmenu', e => {
        e.preventDefault();
        if (shape.points.length <= minPts) return;
        snapshot();
        shape.points.splice(idx, 1);
        refreshShape(shape);
        renderAllNodes();
      });
      g.appendChild(h);
    });

    svg.appendChild(g);
  }
}
