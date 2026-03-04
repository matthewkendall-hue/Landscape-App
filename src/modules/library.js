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

/** Check if a plant is already in My Plants */
function isInMyPlants(plantId) {
  return state.myPlants.some(mp => mp.plantId === plantId);
}

/** Check if a plant is already in the queue */
function isInQueue(plantId) {
  return state.queue.some(q => q.id === plantId);
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
    const owned = isInMyPlants(p.id);
    const queued = isInQueue(p.id);

    const div = document.createElement('div');
    div.className = 'plant-card' + (owned ? ' plant-card-owned' : '');
    div.draggable = true;
    div.addEventListener('dragstart', e => {
      e.dataTransfer.setData('application/terrain-plant', JSON.stringify(p));
      e.dataTransfer.effectAllowed = 'copy';
    });

    // Plant info
    const info = document.createElement('div');
    info.className = 'plant-card-info';

    const nameRow = document.createElement('div');
    nameRow.className = 'plant-card-name';
    nameRow.innerHTML = `<span class="layer-dot" style="background:${LAYER_CSS[p.layer] || '#aaa'}"></span>${p.name}`;
    if (owned) {
      const ownedBadge = document.createElement('span');
      ownedBadge.className = 'owned-badge';
      ownedBadge.textContent = 'OWNED';
      nameRow.appendChild(ownedBadge);
    }

    const meta = document.createElement('div');
    meta.className = 'plant-card-meta';
    meta.innerHTML = `<span class="meta-tag meta-layer">${p.layer}</span><span class="meta-tag">${p.spacing}ft</span><span class="meta-tag">${p.light}h</span><span class="meta-tag meta-${p.water}">${p.water}</span>`;

    info.appendChild(nameRow);
    info.appendChild(meta);
    div.appendChild(info);

    // Action buttons
    const btns = document.createElement('div');
    btns.className = 'card-btns';

    // Own button (star) — toggles My Plants membership
    const ownBtn = document.createElement('button');
    ownBtn.className = 'card-action-btn' + (owned ? ' card-action-active' : '');
    ownBtn.innerHTML = owned ? '<span class="card-icon">★</span>' : '<span class="card-icon">☆</span>';
    ownBtn.title = owned ? 'In My Plants (click to add more)' : 'Add to My Plants';
    ownBtn.onclick = (e) => {
      e.stopPropagation();
      addToMyPlants(p);
      renderLibrary(); // refresh to show owned state
    };
    btns.appendChild(ownBtn);

    // Queue button — adds to auto-fill queue
    const queueBtn = document.createElement('button');
    queueBtn.className = 'card-action-btn card-action-queue' + (queued ? ' card-action-queued' : '');
    queueBtn.innerHTML = '<span class="card-icon">+</span>';
    queueBtn.title = queued ? 'Already queued (click to add again)' : 'Add to fill queue';
    queueBtn.onclick = (e) => {
      e.stopPropagation();
      snapshot();
      state.queue.push(p);
      renderQueue();
      renderLibrary(); // refresh queued state
      // Flash feedback
      queueBtn.classList.add('card-action-flash');
      setTimeout(() => queueBtn.classList.remove('card-action-flash'), 400);
    };
    btns.appendChild(queueBtn);

    div.appendChild(btns);
    list.appendChild(div);
  }
}

export function renderQueue() {
  const wrap = document.getElementById('queue-wrap');
  wrap.innerHTML = '';
  if (!state.queue.length) {
    wrap.innerHTML = `<div class="hint-text">
      <div style="margin-bottom:4px">No plants queued yet.</div>
      <div style="font-size:9px;color:var(--text3);line-height:1.5">Use <span style="color:var(--accent)">+</span> in library to queue plants for auto-fill, or the solver will use zone-appropriate library defaults.</div>
    </div>`;
    return;
  }

  // Header with count and clear all
  const header = document.createElement('div');
  header.className = 'queue-header';
  header.innerHTML = `<span class="queue-count">${state.queue.length} plant${state.queue.length !== 1 ? 's' : ''} queued</span>`;
  const clearAll = document.createElement('button');
  clearAll.className = 'queue-clear-all';
  clearAll.textContent = 'Clear All';
  clearAll.onclick = () => { snapshot(); state.queue.length = 0; renderQueue(); renderLibrary(); };
  header.appendChild(clearAll);
  wrap.appendChild(header);

  state.queue.forEach((p, i) => {
    const row = document.createElement('div');
    row.className = 'queue-item';
    row.innerHTML = `<div><div class="queue-name"><span class="layer-dot" style="background:${LAYER_CSS[p.layer] || '#aaa'}"></span>${p.name}</div><div class="queue-meta">${p.layer} · ${p.spacing}ft</div></div>`;
    const btn = document.createElement('button');
    btn.className = 'remove-btn';
    btn.textContent = '×';
    btn.onclick = () => { snapshot(); state.queue.splice(i, 1); renderQueue(); renderLibrary(); };
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
