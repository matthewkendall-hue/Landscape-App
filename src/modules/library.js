import { LAYER_CSS } from '../config.js';
import { state } from '../state.js';
import { DEFAULT_PLANTS } from '../data/plants.js';
import { snapshot } from './undoRedo.js';
import { addToMyPlants } from './myPlants.js';

export function loadLibrary() {
  const saved = JSON.parse(localStorage.getItem('terrainPlantLib') || 'null');
  state.plants = (saved && saved.length) ? saved : DEFAULT_PLANTS;
  renderLibrary();
}

function saveLibrary() {
  localStorage.setItem('terrainPlantLib', JSON.stringify(state.plants));
}

export function renderLibrary() {
  const region = document.getElementById('region-select').value;
  const searchEl = document.getElementById('lib-search');
  const query = (searchEl?.value || '').toLowerCase().trim();
  const list = document.getElementById('db-list');
  list.innerHTML = '';
  const items = state.plants.filter(p => {
    if (region !== 'All' && p.region !== region) return false;
    if (query) {
      const haystack = `${p.name} ${p.layer} ${p.water} ${p.light} ${p.region}`.toLowerCase();
      return haystack.includes(query);
    }
    return true;
  });
  if (!items.length) {
    list.innerHTML = '<div class="hint-text" style="padding:10px 6px">No plants for this region.</div>';
    return;
  }
  for (const p of items) {
    const div = document.createElement('div');
    div.className = 'plant-card';
    div.draggable = true;
    div.addEventListener('dragstart', e => {
      e.dataTransfer.setData('application/terrain-plant', JSON.stringify(p));
      e.dataTransfer.effectAllowed = 'copy';
    });
    div.innerHTML = `<div style="flex:1"><div class="plant-card-name"><span class="layer-dot" style="background:${LAYER_CSS[p.layer] || '#aaa'}"></span>${p.name}</div><div class="plant-card-meta">${p.layer} · ${p.spacing}ft · ${p.light}h · ${p.water}</div></div>`;
    const btns = document.createElement('div');
    btns.className = 'card-btns';

    const ownBtn = document.createElement('button');
    ownBtn.className = 'add-btn own-btn';
    ownBtn.textContent = '\u2b50';
    ownBtn.title = 'Add to My Plants inventory';
    ownBtn.onclick = () => addToMyPlants(p);
    btns.appendChild(ownBtn);

    const btn = document.createElement('button');
    btn.className = 'add-btn';
    btn.textContent = '+';
    btn.title = 'Queue for auto-fill';
    btn.onclick = () => { snapshot(); state.queue.push(p); renderQueue(); };
    btns.appendChild(btn);

    div.appendChild(btns);
    list.appendChild(div);
  }
}

export function renderQueue() {
  const wrap = document.getElementById('queue-wrap');
  wrap.innerHTML = '';
  if (!state.queue.length) {
    wrap.innerHTML = '<div class="hint-text">Use + in library to queue plants.</div>';
    return;
  }
  state.queue.forEach((p, i) => {
    const row = document.createElement('div');
    row.className = 'queue-item';
    row.innerHTML = `<div><div class="queue-name"><span class="layer-dot" style="background:${LAYER_CSS[p.layer] || '#aaa'}"></span>${p.name}</div><div class="queue-meta">${p.layer} · ${p.spacing}ft</div></div>`;
    const btn = document.createElement('button');
    btn.className = 'remove-btn';
    btn.textContent = '×';
    btn.onclick = () => { snapshot(); state.queue.splice(i, 1); renderQueue(); };
    row.appendChild(btn);
    wrap.appendChild(row);
  });
}

export function initLibraryForm() {
  document.getElementById('add-form').addEventListener('submit', e => {
    e.preventDefault();
    const plant = {
      id: crypto.randomUUID(),
      name: document.getElementById('p-name').value.trim(),
      layer: document.getElementById('p-layer').value,
      width: parseFloat(document.getElementById('p-width').value) || 0,
      height: parseFloat(document.getElementById('p-height').value) || 0,
      spacing: parseFloat(document.getElementById('p-spacing').value) || 0,
      light: document.getElementById('p-light').value.trim() || '—',
      water: document.getElementById('p-water').value,
      region: document.getElementById('p-region').value.trim() || 'All',
    };
    state.plants.push(plant);
    saveLibrary();
    renderLibrary();
    e.target.reset();
  });

  document.getElementById('region-select').onchange = renderLibrary;
  document.getElementById('lib-search').addEventListener('input', renderLibrary);
}
