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
    wrap.innerHTML = '<div class="hint-text">No owned plants. Use \u2b50 in library.</div>';
    return;
  }

  // Recount used quantities from placed plants
  recountUsed();

  for (const mp of state.myPlants) {
    const remaining = mp.quantity - mp.used;
    const row = document.createElement('div');
    row.className = 'mp-item';
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

    const info = document.createElement('div');
    info.className = 'mp-info';
    info.innerHTML = `<div class="mp-name"><span class="layer-dot" style="background:${LAYER_CSS[mp.layer] || '#aaa'}"></span>${mp.name}</div><div class="mp-meta">${remaining}/${mp.quantity} remaining</div>`;

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
    del.onclick = () => removeFromMyPlants(mp.plantId);

    controls.appendChild(minus);
    controls.appendChild(qtySpan);
    controls.appendChild(plus);
    controls.appendChild(del);

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
 * Each entry repeats based on remaining quantity.
 */
export function getMyPlantsForSolver() {
  recountUsed();
  const result = [];
  for (const mp of state.myPlants) {
    const remaining = mp.quantity - mp.used;
    if (remaining > 0) {
      // Create a queue-like plant object with quantity limit
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
