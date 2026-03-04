import { shapes, houseEdgeIndex, houseEdgeLine, state, setHouseEdgeIndex, setHouseEdgeLine, setSelectedShapeId } from '../state.js';
import { setBanner, getSvg } from '../utils/svg.js';
import { cancelDrawing } from './drawing.js';
import { renderList } from './plants.js';
import { renderQueue } from './library.js';
import { renderShapeList } from './shapeList.js';
import { snapshot, clearHistory } from './undoRedo.js';

export function exportJSON() {
  const data = {
    shapes: shapes.map(({ id, type, label, points }) => ({ id, type, label, points })),
    houseEdgeIndex,
    placed: state.placed.map(({ id, name, layer, x, y, r, spacing, light, water }) => ({ id, name, layer, x, y, r, spacing, light, water })),
  };
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  Object.assign(document.createElement('a'), { href: url, download: 'terrain-layout.json' }).click();
  URL.revokeObjectURL(url);
}

export function resetAll() {
  snapshot();
  cancelDrawing();
  shapes.forEach(s => s.svgEl.remove());
  shapes.length = 0;
  setSelectedShapeId(null);
  setHouseEdgeIndex(null);
  if (houseEdgeLine) { houseEdgeLine.remove(); setHouseEdgeLine(null); }
  getSvg().querySelectorAll('circle.plant-circle,g.node-grp,.house-edge-indicator,.ghost-dot').forEach(n => n.remove());
  state.placed = [];
  renderList();
  renderQueue();
  renderShapeList();
  const img = document.getElementById('survey-img');
  img.src = '';
  img.style.display = 'none';
  document.getElementById('survey-controls').classList.remove('visible');
  setBanner('', false);
}
