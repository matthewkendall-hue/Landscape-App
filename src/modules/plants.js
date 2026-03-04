import { LAYER_HEX } from '../config.js';
import { state, plantDrag, setPlantDrag } from '../state.js';
import { ns, svgPt, mkTitle, getSvg } from '../utils/svg.js';
import { ptInPoly, distPoly } from '../utils/geometry.js';
import { getSiteShape, renderAllNodes } from './shapes.js';
import { snapshot } from './undoRedo.js';

function startPlantDrag(plant, node) {
  return e => {
    e.stopPropagation();
    setPlantDrag({ plant, node });
    node.style.cursor = 'grabbing';
  };
}

export function movePlant(evt) {
  if (!plantDrag) return;
  const p = svgPt(evt);
  const site = getSiteShape();
  if (!site) return;
  const inside = ptInPoly(p.x, p.y, site.points);
  const treeOk = !inside && plantDrag.plant.layer === 'tree' && distPoly({ x: p.x, y: p.y }, site.points) <= plantDrag.plant.r;
  if (!(inside || treeOk)) return;
  plantDrag.plant.x = p.x;
  plantDrag.plant.y = p.y;
  plantDrag.node.setAttribute('cx', p.x);
  plantDrag.node.setAttribute('cy', p.y);
}

export function endPlantDrag() {
  if (!plantDrag) return;
  plantDrag.node.style.cursor = 'grab';
  setPlantDrag(null);
  renderList();
}

export function renderPlants() {
  const svg = getSvg();
  svg.querySelectorAll('circle.plant-circle').forEach(n => n.remove());
  for (const p of state.placed) {
    const c = ns('circle');
    c.setAttribute('cx', p.x);
    c.setAttribute('cy', p.y);
    c.setAttribute('r', p.r);
    c.setAttribute('fill', LAYER_HEX[p.layer] || '#94a3b8');
    c.setAttribute('fill-opacity', '0.45');
    c.setAttribute('stroke', LAYER_HEX[p.layer] || '#94a3b8');
    c.setAttribute('stroke-width', '1.5');
    c.setAttribute('class', 'plant-circle');
    c.style.cursor = 'grab';
    c.appendChild(mkTitle(`${p.name}\nLayer: ${p.layer}\nSpacing: ${p.spacing}ft\nLight: ${p.light}\nWater: ${p.water}\n\nDrag to move · Dbl-click removes`));
    c.addEventListener('mousedown', startPlantDrag(p, c));
    c.addEventListener('dblclick', () => {
      snapshot();
      state.placed = state.placed.filter(q => q.id !== p.id);
      renderPlants();
      renderList();
    });
    svg.appendChild(c);
  }
  renderAllNodes(); // keep nodes on top
}

export function renderList() {
  const body = document.getElementById('list-body');
  body.innerHTML = '';
  const counts = {};
  for (const p of state.placed) {
    if (!counts[p.name]) counts[p.name] = { qty: 0, layer: p.layer, spacing: p.spacing, light: p.light, water: p.water };
    counts[p.name].qty++;
  }
  for (const [name, info] of Object.entries(counts)) {
    const col = LAYER_HEX[info.layer] || '#94a3b8';
    const tr = document.createElement('tr');
    tr.innerHTML = `<td style="color:var(--text)">${name}</td><td><span class="qty-badge">${info.qty}</span></td><td><span class="layer-pill" style="background:${col}22;color:${col};border:1px solid ${col}55">${info.layer}</span></td><td style="font-family:'Overpass Mono',monospace">${info.spacing}ft</td><td style="font-family:'Overpass Mono',monospace">${info.water}</td>`;
    body.appendChild(tr);
  }
  if (!body.children.length) body.innerHTML = '<tr><td colspan="5" class="hint-text">No plants placed yet.</td></tr>';
}
