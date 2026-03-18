import { LAYER_CSS } from '../config.js';
import { state } from '../state.js';
import { DEFAULT_PLANTS } from '../data/plants.js';
import { NATIVE_PLANTS } from '../data/nativePlants.js';
import { US_STATES } from '../data/cityPlantMap.js';
import { snapshot } from './undoRedo.js';
import { addToMyPlants } from './myPlants.js';

// Index native plants by ID for fast lookup
const nativePlantMap = new Map();
for (const p of NATIVE_PLANTS) nativePlantMap.set(p.id, p);

export function loadLibrary() {
  const saved = JSON.parse(localStorage.getItem('terrainPlantLib') || 'null');
  state.plants = (saved && saved.length) ? saved : DEFAULT_PLANTS;
  populateStateDropdown();
  renderLibrary();
}

function saveLibrary() {
  localStorage.setItem('terrainPlantLib', JSON.stringify(state.plants));
}

function populateStateDropdown() {
  const sel = document.getElementById('state-select');
  // Keep the first "Select State..." option
  while (sel.options.length > 1) sel.remove(1);
  for (const s of US_STATES) {
    const opt = document.createElement('option');
    opt.value = s.code;
    opt.textContent = s.name;
    sel.appendChild(opt);
  }
  // Restore saved location
  if (state.selectedLocation) {
    sel.value = state.selectedLocation.stateCode;
    populateCityDropdown(state.selectedLocation.stateCode);
    const citySel = document.getElementById('city-select');
    citySel.value = state.selectedLocation.city;
    populateThemeDropdown(state.selectedLocation.stateCode, state.selectedLocation.city);
  }
}

function populateCityDropdown(stateCode) {
  const citySel = document.getElementById('city-select');
  const themeSel = document.getElementById('theme-select');
  citySel.innerHTML = '<option value="">Select City...</option>';
  themeSel.style.display = 'none';

  if (!stateCode) { citySel.style.display = 'none'; return; }

  const st = US_STATES.find(s => s.code === stateCode);
  if (!st) { citySel.style.display = 'none'; return; }

  for (const c of st.cities) {
    const opt = document.createElement('option');
    opt.value = c.name;
    opt.textContent = `${c.name} (${c.usdaZone})`;
    citySel.appendChild(opt);
  }
  citySel.style.display = '';
}

function populateThemeDropdown(stateCode, cityName) {
  const themeSel = document.getElementById('theme-select');
  themeSel.innerHTML = '<option value="">All Native Plants</option>';

  if (!stateCode || !cityName) { themeSel.style.display = 'none'; return; }

  const st = US_STATES.find(s => s.code === stateCode);
  const city = st?.cities.find(c => c.name === cityName);
  if (!city || !city.themes?.length) { themeSel.style.display = 'none'; return; }

  for (const t of city.themes) {
    const opt = document.createElement('option');
    opt.value = t.name;
    opt.textContent = t.name;
    themeSel.appendChild(opt);
  }
  themeSel.style.display = '';
}

/** Get the active city data or null */
function getSelectedCity() {
  const stateCode = document.getElementById('state-select').value;
  const cityName = document.getElementById('city-select').value;
  if (!stateCode || !cityName) return null;
  const st = US_STATES.find(s => s.code === stateCode);
  return st?.cities.find(c => c.name === cityName) || null;
}

/** Build the plant list to display based on location + theme + search */
function getDisplayPlants() {
  const city = getSelectedCity();
  const theme = document.getElementById('theme-select').value;
  const searchEl = document.getElementById('lib-search');
  const query = (searchEl?.value || '').toLowerCase().trim();

  let plants;
  if (city) {
    let ids = city.plantIds;
    // If a theme is selected, narrow to theme's plant IDs
    if (theme) {
      const t = city.themes?.find(th => th.name === theme);
      if (t) ids = t.plantIds;
    }
    // Resolve IDs to plant objects, skip missing
    plants = ids.map(id => nativePlantMap.get(id)).filter(Boolean);
    // Also include user's custom plants
    const customPlants = state.plants.filter(p => !p.native);
    plants = [...plants, ...customPlants];
  } else {
    // No city selected — show default library plants
    plants = state.plants;
  }

  // Apply search filter
  if (query) {
    plants = plants.filter(p => {
      const haystack = `${p.name} ${p.scientificName || ''} ${p.layer} ${p.water} ${p.light} ${(p.tags || []).join(' ')}`.toLowerCase();
      return haystack.includes(query);
    });
  }

  return plants;
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
  const list = document.getElementById('db-list');
  list.innerHTML = '';
  const items = getDisplayPlants();

  if (!items.length) {
    const city = getSelectedCity();
    list.innerHTML = `<div class="hint-text" style="padding:10px 6px">${city ? 'No plants match this filter.' : 'No plants for this region.'}</div>`;
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
    if (p.native) {
      const nativeBadge = document.createElement('span');
      nativeBadge.className = 'native-badge';
      nativeBadge.textContent = 'NATIVE';
      nameRow.appendChild(nativeBadge);
    }

    const meta = document.createElement('div');
    meta.className = 'plant-card-meta';
    meta.innerHTML = `<span class="meta-tag meta-layer">${p.layer}</span><span class="meta-tag">${p.spacing}ft</span><span class="meta-tag">${p.light}h</span><span class="meta-tag meta-${p.water}">${p.water}</span>`;

    // Show scientific name if available
    if (p.scientificName) {
      const sci = document.createElement('div');
      sci.className = 'plant-card-sci';
      sci.textContent = p.scientificName;
      info.appendChild(nameRow);
      info.appendChild(sci);
    } else {
      info.appendChild(nameRow);
    }
    info.appendChild(meta);
    div.appendChild(info);

    // Action buttons
    const btns = document.createElement('div');
    btns.className = 'card-btns';

    // Own button (star)
    const ownBtn = document.createElement('button');
    ownBtn.className = 'card-action-btn' + (owned ? ' card-action-active' : '');
    ownBtn.innerHTML = owned ? '<span class="card-icon">★</span>' : '<span class="card-icon">☆</span>';
    ownBtn.title = owned ? 'In My Plants (click to add more)' : 'Add to My Plants';
    ownBtn.onclick = (e) => {
      e.stopPropagation();
      addToMyPlants(p);
      renderLibrary();
    };
    btns.appendChild(ownBtn);

    // Queue button
    const queueBtn = document.createElement('button');
    queueBtn.className = 'card-action-btn card-action-queue' + (queued ? ' card-action-queued' : '');
    queueBtn.innerHTML = '<span class="card-icon">+</span>';
    queueBtn.title = queued ? 'Already queued (click to add again)' : 'Add to fill queue';
    queueBtn.onclick = (e) => {
      e.stopPropagation();
      snapshot();
      state.queue.push(p);
      renderQueue();
      renderLibrary();
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
  // Location picker events
  document.getElementById('state-select').onchange = (e) => {
    const code = e.target.value;
    populateCityDropdown(code);
    document.getElementById('theme-select').style.display = 'none';
    if (!code) {
      state.selectedLocation = null;
    }
    renderLibrary();
  };

  document.getElementById('city-select').onchange = (e) => {
    const stateCode = document.getElementById('state-select').value;
    const cityName = e.target.value;
    populateThemeDropdown(stateCode, cityName);

    if (stateCode && cityName) {
      const st = US_STATES.find(s => s.code === stateCode);
      const city = st?.cities.find(c => c.name === cityName);
      if (city) {
        state.selectedLocation = { stateCode, city: cityName, lat: city.lat, lng: city.lng, usdaZone: city.usdaZone };
      }
    } else {
      state.selectedLocation = null;
    }
    renderLibrary();
  };

  document.getElementById('theme-select').onchange = renderLibrary;

  // Add plant form
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

  document.getElementById('lib-search').addEventListener('input', renderLibrary);
}
