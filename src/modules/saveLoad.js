import { state, shapes, houseEdgeIndex, setHouseEdgeIndex, viewBox, setViewBox, northAngle, setNorthAngle } from '../state.js';
import { openModal, closeModal } from '../utils/modal.js';
import { clearHistory } from './undoRedo.js';

const STORAGE_KEY = 'terrainProjects';
const FORMAT_VERSION = 2;

/**
 * Serialize the full project state (shapes + placed + queue + myPlants + viewBox + houseEdge + custom plants).
 * SVG elements are excluded — they'll be reconstructed on load.
 */
function serializeProject() {
  return {
    version: FORMAT_VERSION,
    timestamp: Date.now(),
    shapes: shapes.map(s => {
      const snap = {
        id: s.id, type: s.type, label: s.label,
        points: s.points.map(p => ({ x: p.x, y: p.y })),
        closed: s.closed,
      };
      if (s.parametric) snap.parametric = { ...s.parametric };
      if (s.queueOverride) snap.queueOverride = s.queueOverride.map(q => ({ ...q }));
      if (s.visible !== undefined) snap.visible = s.visible;
      if (s.zones) snap.zones = { ...s.zones };
      if (s._resolveSeed !== undefined) snap._resolveSeed = s._resolveSeed;
      if (s.smooth !== undefined) snap.smooth = s.smooth;
      if (s.plantLine) snap.plantLine = { ...s.plantLine };
      if (s.frontEdge != null) snap.frontEdge = s.frontEdge;
      if (s.solveType) snap.solveType = s.solveType;
      if (s.height != null) snap.height = s.height;
      return snap;
    }),
    placed: state.placed.map(p => ({ ...p })),
    queue: state.queue.map(p => ({ ...p })),
    myPlants: state.myPlants.map(mp => ({ ...mp })),
    plants: state.plants.map(p => ({ ...p })),
    viewBox: { ...viewBox },
    houseEdgeIndex,
    selectedLocation: state.selectedLocation ? { ...state.selectedLocation } : null,
    northAngle,
  };
}

/**
 * Apply a deserialized project — restores all state and calls the provided rebuild callback.
 */
function applyProject(data, onRebuild) {
  // Clear existing shapes from SVG
  shapes.forEach(s => s.svgEl?.remove());
  shapes.length = 0;

  // Restore arrays
  state.placed = (data.placed || []).map(p => ({ ...p }));
  state.queue = (data.queue || []).map(p => ({ ...p }));
  state.myPlants = (data.myPlants || []).map(mp => ({ ...mp }));
  if (data.plants && data.plants.length) {
    state.plants = data.plants.map(p => ({ ...p }));
    localStorage.setItem('terrainPlantLib', JSON.stringify(state.plants));
  }

  // Restore scalar state
  if (data.viewBox) setViewBox(data.viewBox);
  setHouseEdgeIndex(data.houseEdgeIndex ?? null);
  state.selectedLocation = data.selectedLocation || null;
  setNorthAngle(data.northAngle || 0);

  clearHistory();

  // Rebuild (callback from main.js provides SVG reconstruction)
  if (onRebuild) onRebuild(data.shapes || []);
}

// ——— localStorage projects ———

function getProjects() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
}

function setProjects(projects) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

// ——— Public API ———

let _onRebuild = null;
export function setOnRebuild(fn) { _onRebuild = fn; }

export function showSaveModal() {
  openModal('Save Project', body => {
    const projects = getProjects();
    const names = Object.keys(projects);

    body.innerHTML = `
      <div class="save-load-form">
        <input type="text" id="sl-name" placeholder="Project name" class="sl-input" list="sl-names"/>
        <datalist id="sl-names">${names.map(n => `<option value="${n}">`).join('')}</datalist>
        <button class="btn primary" id="sl-save-btn">Save</button>
      </div>
      ${names.length ? '<div class="sl-hint">Existing names will be overwritten.</div>' : ''}
    `;

    body.querySelector('#sl-save-btn').onclick = () => {
      const name = body.querySelector('#sl-name').value.trim();
      if (!name) return;
      const projects = getProjects();
      projects[name] = serializeProject();
      setProjects(projects);
      closeModal();
    };
  });
}

export function showLoadModal() {
  openModal('Load Project', body => {
    const projects = getProjects();
    const names = Object.keys(projects);

    if (!names.length) {
      body.innerHTML = '<div class="hint-text" style="padding:10px 0">No saved projects.</div>';
      return;
    }

    const list = document.createElement('div');
    list.className = 'sl-project-list';

    for (const name of names) {
      const p = projects[name];
      const row = document.createElement('div');
      row.className = 'sl-project-row';

      const info = document.createElement('div');
      info.className = 'sl-project-info';
      const date = new Date(p.timestamp || 0);
      info.innerHTML = `<div class="sl-project-name">${name}</div><div class="sl-project-meta">${date.toLocaleDateString()} · ${(p.shapes || []).length} shapes · ${(p.placed || []).length} plants</div>`;

      const btns = document.createElement('div');
      btns.className = 'sl-project-btns';

      const loadBtn = document.createElement('button');
      loadBtn.className = 'btn primary';
      loadBtn.textContent = 'Load';
      loadBtn.style.fontSize = '10px';
      loadBtn.onclick = () => {
        applyProject(p, _onRebuild);
        closeModal();
      };

      const delBtn = document.createElement('button');
      delBtn.className = 'btn danger';
      delBtn.textContent = 'Del';
      delBtn.style.fontSize = '10px';
      delBtn.onclick = () => {
        delete projects[name];
        setProjects(projects);
        showLoadModal(); // re-render
      };

      btns.appendChild(loadBtn);
      btns.appendChild(delBtn);
      row.appendChild(info);
      row.appendChild(btns);
      list.appendChild(row);
    }

    body.appendChild(list);

    // Import from file
    const hr = document.createElement('hr');
    hr.style.cssText = 'border:none;border-top:1px solid var(--border);margin:10px 0';
    body.appendChild(hr);

    const importBtn = document.createElement('button');
    importBtn.className = 'btn';
    importBtn.textContent = 'Import from File';
    importBtn.style.width = '100%';
    importBtn.onclick = () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = () => {
        const file = input.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const data = JSON.parse(reader.result);
            applyProject(data, _onRebuild);
            closeModal();
          } catch (err) {
            alert('Invalid project file.');
          }
        };
        reader.readAsText(file);
      };
      input.click();
    };
    body.appendChild(importBtn);
  });
}

export function exportProjectFile() {
  const data = serializeProject();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `terrain-project-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
