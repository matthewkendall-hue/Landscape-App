import { TYPE_CFG } from '../config.js';
import { shapes, selectedShapeId, state } from '../state.js';
import { selectShape, deleteShape } from './shapes.js';
import { renderAreaPanel } from './landscapeAreas.js';
import { renderParametricPanel } from './parametric.js';
import { renderSiteAnalysis } from './siteAnalysis.js';
import { renderPathPanel } from './pathShape.js';

export function renderShapeList() {
  const wrap = document.getElementById('sl-items');
  wrap.innerHTML = '';
  if (!shapes.length) {
    wrap.innerHTML = '<div class="hint-text">No shapes yet.</div>';
    renderAreaPanel();
    renderParametricPanel(null);
    return;
  }
  for (const shape of shapes) {
    const cfg = TYPE_CFG[shape.type];
    const row = document.createElement('div');
    row.className = 'sl-item' + (shape.id === selectedShapeId ? ' selected' : '');

    const swatch = document.createElement('span');
    swatch.className = 'sl-swatch';
    swatch.style.background = cfg.stroke;

    const name = document.createElement('span');
    name.className = 'sl-name';
    name.textContent = shape.label;

    row.appendChild(swatch);
    row.appendChild(name);

    // Show area badge + inline resolve button for landscape shapes
    if (shape.type === 'landscape') {
      const badge = document.createElement('span');
      badge.className = 'sl-badge';
      badge.textContent = shape.parametric ? (shape.parametric.kind === 'rect' ? 'rect' : 'circ') : 'area';
      row.appendChild(badge);

      // Inline resolve / try-another button
      const hasPlants = state.placed.some(p => p.areaId === shape.id);
      const resolveBtn = document.createElement('button');
      resolveBtn.className = 'sl-resolve-btn';
      resolveBtn.textContent = hasPlants ? '↻' : '▶';
      resolveBtn.title = hasPlants ? 'Try another solution' : 'Resolve planting';
      resolveBtn.onclick = async (e) => {
        e.stopPropagation();
        const { solveForArea } = await import('./autofill.js');
        const { snapshot } = await import('./undoRedo.js');
        const { renderPlants, renderList } = await import('./plants.js');
        snapshot();
        const newSeed = Math.floor(Math.random() * 2147483647);
        solveForArea(shape, newSeed);
        renderPlants();
        renderList();
        renderShapeList();
      };
      row.appendChild(resolveBtn);
    }

    // Path badge (spine/spline + plant count)
    if (shape.type === 'path') {
      const badge = document.createElement('span');
      badge.className = 'sl-badge';
      badge.textContent = shape.smooth ? 'spline' : 'spine';
      row.appendChild(badge);
      if (shape.plantLine) {
        const plBadge = document.createElement('span');
        plBadge.className = 'sl-badge';
        plBadge.textContent = `${shape.plantLine.count} plants`;
        row.appendChild(plBadge);
      }
    }

    row.addEventListener('click', () => selectShape(shape.id));

    const del = document.createElement('button');
    del.className = 'sl-del';
    del.textContent = '\u00d7';
    del.title = 'Delete';
    del.onclick = e => { e.stopPropagation(); deleteShape(shape.id); };
    row.appendChild(del);
    wrap.appendChild(row);
  }

  // Update area panel & parametric panel for the currently selected shape
  renderAreaPanel();
  const selShape = shapes.find(s => s.id === selectedShapeId);
  renderParametricPanel(selShape);
  renderPathPanel(selShape);
  renderSiteAnalysis();
}
