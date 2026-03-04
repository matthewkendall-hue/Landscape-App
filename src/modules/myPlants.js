import { LAYER_CSS } from '../config.js';
import { state } from '../state.js';
import { snapshot } from './undoRedo.js';

/**
 * My Plants Inventory — tracks plants the user already owns with quantity limits.
 * Solver prioritizes these before queue plants.
 */

export function addToMyPlants(plant, quantity = 1) {
  snapshot();
  const existing = state.myPlants.find(mp => mp.plantId === plant.id);
  if (existing) {
    existing.quantity += quantity;
  } else {
    state.myPlants.push({
      plantId: plant.id,
      name: plant.name,
      layer: plant.layer,
      spacing: plant.spacing || plant.width || 3,
      light: plant.light,
      water: plant.water,
      width: plant.width,
      height: plant.height,
      region: plant.region,
      quantity,
      used: 0,
      includeInSolve: true, // default: included in auto-fill
    });
  }
  renderMyPlants();
}

export function removeFromMyPlants(plantId) {
  snapshot();
  const idx = state.myPlants.findIndex(mp => mp.plantId === plantId);
  if (idx >= 0) state.myPlants.splice(idx, 1);
  renderMyPlants();
}

export function renderMyPlants() {
  const wrap = document.getElementById('my-plants-list');
  if (!wrap) return;

  wrap.innerHTML = '';
  if (!state.myPlants.length) {
    wrap.innerHTML = `<div class="hint-text">
      <div>No owned plants yet.</div>
      <div style="font-size:9px;color:var(--text3);margin-top:3px;line-height:1.5">Click <span style="color:var(--tree-c)">★</span> on a library plant to add it to your inventory.</div>
    </div>`;
    return;
  }

  // Recount used quantities from placed plants
  recountUsed();

  // Summary header
  const total = state.myPlants.reduce((s, mp) => s + mp.quantity, 0);
  const included = state.myPlants.filter(mp => mp.includeInSolve !== false).length;
  const header = document.createElement('div');
  header.className = 'mp-header';
  header.innerHTML = `<span class="mp-summary">${total} plant${total !== 1 ? 's' : ''} · ${included} in solver</span>`;
  wrap.appendChild(header);

  for (const mp of state.myPlants) {
    const remaining = mp.quantity - mp.used;
    const isIncluded = mp.includeInSolve !== false;

    const row = document.createElement('div');
    row.className = 'mp-item' + (!isIncluded ? ' mp-excluded' : '');

    // Draggable to canvas
    if (remaining > 0) {
      row.draggable = true;
      row.addEventListener('dragstart', e => {
        e.dataTransfer.setData('application/terrain-myplant', JSON.stringify({
          id: mp.plantId,
          name: mp.name,
          layer: mp.layer,
          spacing: mp.spacing,
          light: mp.light,
          water: mp.water,
          width: mp.width,
          height: mp.height,
        }));
        e.dataTransfer.effectAllowed = 'copy';
      });
      row.style.cursor = 'grab';
    }

    // Include toggle (checkbox on the left)
    const toggle = document.createElement('button');
    toggle.className = 'mp-toggle' + (isIncluded ? ' mp-toggle-on' : '');
    toggle.innerHTML = isIncluded ? '✓' : '—';
    toggle.title = isIncluded ? 'Included in solve (click to exclude)' : 'Excluded from solve (click to include)';
    toggle.onclick = (e) => {
      e.stopPropagation();
      snapshot();
      mp.includeInSolve = !isIncluded;
      renderMyPlants();
    };

    const info = document.createElement('div');
    info.className = 'mp-info';

    const nameEl = document.createElement('div');
    nameEl.className = 'mp-name';
    nameEl.innerHTML = `<span class="layer-dot" style="background:${LAYER_CSS[mp.layer] || '#aaa'}"></span>${mp.name}`;

    const metaEl = document.createElement('div');
    metaEl.className = 'mp-meta';
    if (mp.used > 0) {
      metaEl.innerHTML = `<span class="mp-used">${mp.used} placed</span> · ${remaining} left of ${mp.quantity}`;
    } else {
      metaEl.textContent = `${remaining}/${mp.quantity} available`;
    }

    info.appendChild(nameEl);
    info.appendChild(metaEl);

    const controls = document.createElement('div');
    controls.className = 'mp-controls';

    const minus = document.createElement('button');
    minus.className = 'mp-qty-btn';
    minus.textContent = '\u2212';
    minus.title = 'Decrease quantity';
    minus.onclick = () => {
      if (mp.quantity > 1) {
        snapshot();
        mp.quantity--;
        renderMyPlants();
      } else {
        removeFromMyPlants(mp.plantId);
      }
    };

    const qtySpan = document.createElement('span');
    qtySpan.className = 'mp-qty';
    qtySpan.textContent = mp.quantity;

    const plus = document.createElement('button');
    plus.className = 'mp-qty-btn';
    plus.textContent = '+';
    plus.title = 'Increase quantity';
    plus.onclick = () => {
      snapshot();
      mp.quantity++;
      renderMyPlants();
    };

    const del = document.createElement('button');
    del.className = 'remove-btn';
    del.textContent = '\u00d7';
    del.title = 'Remove from inventory';
    del.style.marginLeft = '2px';
    del.onclick = () => removeFromMyPlants(mp.plantId);

    controls.appendChild(minus);
    controls.appendChild(qtySpan);
    controls.appendChild(plus);
    controls.appendChild(del);

    row.appendChild(toggle);
    row.appendChild(info);
    row.appendChild(controls);
    wrap.appendChild(row);
  }
}

/** Recount how many of each "my plant" are currently placed on the canvas */
function recountUsed() {
  for (const mp of state.myPlants) mp.used = 0;
  for (const p of state.placed) {
    if (p.fromMyPlants) {
      const mp = state.myPlants.find(m => m.plantId === p.plantId);
      if (mp) mp.used++;
    }
  }
}

/**
 * Get my plants as queue-compatible objects for the solver.
 * Only returns plants where includeInSolve is true and remaining > 0.
 */
export function getMyPlantsForSolver() {
  recountUsed();
  const result = [];
  for (const mp of state.myPlants) {
    if (mp.includeInSolve === false) continue; // skip excluded plants
    const remaining = mp.quantity - mp.used;
    if (remaining > 0) {
      result.push({
        id: mp.plantId,
        name: mp.name,
        layer: mp.layer,
        spacing: mp.spacing,
        light: mp.light,
        water: mp.water,
        width: mp.width,
        height: mp.height,
        _maxCount: remaining,
        _fromMyPlants: true,
      });
    }
  }
  return result;
}
