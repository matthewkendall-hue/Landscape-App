import { LAYER_CSS, SUN_EXPOSURE, HYDROZONE, SOIL_TYPE, USE_ZONE } from '../config.js';
import { shapes, selectedShapeId, state } from '../state.js';
import { selectShape } from './shapes.js';
import { snapshot } from './undoRedo.js';
import { getPlantSourceMode } from './autofill.js';

export function getAreaShapes() {
  return shapes.filter(s => s.type === 'landscape' && s.closed);
}

/** Ensure area has zone defaults */
function ensureZones(area) {
  if (!area.zones) {
    area.zones = { sun: 'full', hydrozone: 'mesic', soil: 'loam', use: 'habitat' };
  }
  return area.zones;
}

export function renderAreaPanel() {
  const panel = document.getElementById('area-panel');
  if (!panel) return;

  const area = shapes.find(s => s.id === selectedShapeId && s.type === 'landscape');
  if (!area) {
    panel.style.display = 'none';
    return;
  }

  panel.style.display = 'block';
  panel.innerHTML = '';

  // Header
  const header = document.createElement('div');
  header.className = 'pane-header';
  header.innerHTML = `<span class="pane-title">${area.label}</span>`;
  panel.appendChild(header);

  const body = document.createElement('div');
  body.style.padding = '8px 10px';
  body.className = 'area-panel-body';

  // ——— Zone properties (from landscape planning skill) ———
  const zones = ensureZones(area);

  const zoneSection = document.createElement('div');
  zoneSection.className = 'zone-section';
  zoneSection.innerHTML = '<div class="zone-section-title">Site Conditions</div>';

  // Sun Exposure
  zoneSection.appendChild(makeZoneSelect('Sun', 'zone-sun', zones.sun, SUN_EXPOSURE, v => {
    snapshot(); zones.sun = v; renderAreaPanel();
  }));

  // Hydrozone
  zoneSection.appendChild(makeZoneSelect('Water', 'zone-hydro', zones.hydrozone, HYDROZONE, v => {
    snapshot(); zones.hydrozone = v; renderAreaPanel();
  }));

  // Soil Type
  zoneSection.appendChild(makeZoneSelect('Soil', 'zone-soil', zones.soil, SOIL_TYPE, v => {
    snapshot(); zones.soil = v; renderAreaPanel();
  }));

  // Use Zone
  zoneSection.appendChild(makeZoneSelect('Use', 'zone-use', zones.use, USE_ZONE, v => {
    snapshot(); zones.use = v; renderAreaPanel();
  }));

  body.appendChild(zoneSection);

  // ——— Zone suitability hint ———
  const hint = getZoneHint(zones);
  if (hint) {
    const hintEl = document.createElement('div');
    hintEl.className = 'zone-hint';
    hintEl.textContent = hint;
    body.appendChild(hintEl);
  }

  // ——— Queue mode toggle ———
  const useCustom = !!area.queueOverride;
  const toggleRow = document.createElement('div');
  toggleRow.className = 'area-toggle-row';
  toggleRow.style.marginTop = '8px';
  toggleRow.innerHTML = `
    <label class="area-toggle-label">
      <input type="checkbox" id="area-custom-queue" ${useCustom ? 'checked' : ''}/>
      <span>Custom queue</span>
    </label>`;
  body.appendChild(toggleRow);

  const checkbox = toggleRow.querySelector('input');
  checkbox.addEventListener('change', () => {
    snapshot();
    if (checkbox.checked) {
      area.queueOverride = area.queueOverride || [];
    } else {
      area.queueOverride = null;
    }
    renderAreaPanel();
  });

  // Custom queue list
  if (useCustom) {
    const queueDiv = document.createElement('div');
    queueDiv.className = 'area-queue-list';
    if (!area.queueOverride.length) {
      queueDiv.innerHTML = '<div class="hint-text">No plants queued.</div>';
    } else {
      area.queueOverride.forEach((p, i) => {
        const row = document.createElement('div');
        row.className = 'queue-item';
        row.innerHTML = `<div><span class="queue-name"><span class="layer-dot" style="background:${LAYER_CSS[p.layer] || '#aaa'}"></span>${p.name}</span></div>`;
        const btn = document.createElement('button');
        btn.className = 'remove-btn';
        btn.textContent = '\u00d7';
        btn.onclick = () => { snapshot(); area.queueOverride.splice(i, 1); renderAreaPanel(); };
        row.appendChild(btn);
        queueDiv.appendChild(row);
      });
    }
    body.appendChild(queueDiv);

    const addBtn = document.createElement('button');
    addBtn.className = 'btn';
    addBtn.textContent = '+ Add from Library';
    addBtn.style.width = '100%';
    addBtn.style.marginTop = '4px';
    addBtn.style.fontSize = '10px';
    addBtn.onclick = () => {
      if (state.queue.length) {
        snapshot();
        area.queueOverride.push(...state.queue.map(p => ({ ...p })));
        renderAreaPanel();
      }
    };
    body.appendChild(addBtn);
  }

  // Visibility toggle
  const visRow = document.createElement('div');
  visRow.className = 'area-toggle-row';
  visRow.style.marginTop = '6px';
  const isVisible = area.visible !== false;
  visRow.innerHTML = `
    <label class="area-toggle-label">
      <input type="checkbox" id="area-visible" ${isVisible ? 'checked' : ''}/>
      <span>Show solution</span>
    </label>`;
  body.appendChild(visRow);
  visRow.querySelector('input').addEventListener('change', async (e) => {
    area.visible = e.target.checked;
    const mod = await import('./plants.js');
    mod.renderPlants();
  });

  // ——— Plant source info ———
  const sourceMode = getPlantSourceMode();
  const sourceInfo = document.createElement('div');
  sourceInfo.className = 'area-source-info';
  const queueLen = (area.queueOverride || state.queue).length;
  const myLen = state.myPlants.filter(mp => mp.includeInSolve !== false).length;

  let sourceText = '';
  if (sourceMode === 'myPlants') {
    sourceText = myLen ? `Using ${myLen} My Plant${myLen !== 1 ? 's' : ''}` : 'No My Plants — will use library defaults';
  } else if (sourceMode === 'recommended') {
    sourceText = queueLen ? `Using ${queueLen} queued plant${queueLen !== 1 ? 's' : ''}` : 'No queue — will use library defaults';
  } else {
    const parts = [];
    if (myLen) parts.push(`${myLen} owned`);
    if (queueLen) parts.push(`${queueLen} queued`);
    sourceText = parts.length ? `Using ${parts.join(' + ')}` : 'Will use zone-appropriate library defaults';
  }
  sourceInfo.textContent = sourceText;
  body.appendChild(sourceInfo);

  // Resolve / Try Another / Clear buttons
  const hasPlants = state.placed.some(p => p.areaId === area.id);

  const btnRow = document.createElement('div');
  btnRow.style.display = 'flex';
  btnRow.style.gap = '4px';
  btnRow.style.marginTop = '6px';

  const resolveBtn = document.createElement('button');
  resolveBtn.className = 'btn primary';
  resolveBtn.textContent = hasPlants ? 'Try Another' : 'Resolve';
  resolveBtn.style.flex = '1';
  resolveBtn.style.fontSize = '10px';
  resolveBtn.onclick = () => {
    const newSeed = Math.floor(Math.random() * 2147483647);
    solveArea(area, newSeed);
  };
  btnRow.appendChild(resolveBtn);

  const clearBtn = document.createElement('button');
  clearBtn.className = 'btn danger';
  clearBtn.textContent = 'Clear';
  clearBtn.style.fontSize = '10px';
  clearBtn.onclick = async () => {
    snapshot();
    state.placed = state.placed.filter(p => p.areaId !== area.id);
    area._resolveSeed = null;
    const mod = await import('./plants.js');
    mod.renderPlants();
    mod.renderList();
    renderAreaPanel(); // re-render to show "Resolve" instead of "Try Another"
  };
  btnRow.appendChild(clearBtn);

  body.appendChild(btnRow);
  panel.appendChild(body);
}

// ——— Helpers ———

function makeZoneSelect(label, id, current, options, onChange) {
  const row = document.createElement('div');
  row.className = 'zone-row';
  row.innerHTML = `<span class="zone-label">${label}</span>`;
  const sel = document.createElement('select');
  sel.className = 'zone-select';
  sel.id = id;
  for (const [key, opt] of Object.entries(options)) {
    const o = document.createElement('option');
    o.value = key;
    o.textContent = opt.label;
    if (key === current) o.selected = true;
    sel.appendChild(o);
  }
  sel.addEventListener('change', () => onChange(sel.value));
  row.appendChild(sel);
  return row;
}

/** Contextual guidance based on selected zone conditions */
function getZoneHint(zones) {
  const hints = [];
  if (zones.sun === 'shade' && zones.hydrozone === 'xeric')
    hints.push('Shade + xeric is unusual — consider ferns or dry-shade natives.');
  if (zones.hydrozone === 'hydric' && zones.soil === 'sand')
    hints.push('Sandy soil drains fast — amend or use a rain garden liner.');
  if (zones.use === 'stormwater')
    hints.push('Use deep-rooted native grasses and sedges for infiltration.');
  if (zones.use === 'edible' && zones.sun === 'shade')
    hints.push('Most edibles need 6+ hrs sun. Consider shade-tolerant herbs.');
  if (zones.use === 'habitat')
    hints.push('Prioritize native species in layered communities (canopy \u2192 ground).');
  if (zones.use === 'buffer')
    hints.push('Mix evergreen + deciduous for year-round screening.');
  return hints[0] || '';
}

async function solveArea(area, seed) {
  const { solveForArea } = await import('./autofill.js');
  snapshot();
  solveForArea(area, seed);
  const { renderPlants, renderList } = await import('./plants.js');
  renderPlants();
  renderList();
  renderAreaPanel(); // re-render to swap Resolve ↔ Try Another
}
