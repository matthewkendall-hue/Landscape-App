import { shapes, state, selectedShapeId, setSelectedShapeId, houseEdgeIndex, setHouseEdgeIndex, setHouseEdgeLine, houseEdgeLine } from '../state.js';
import { getSvg } from '../utils/svg.js';

const undoStack = [];
const redoStack = [];
const MAX_HISTORY = 50;

// Callback set by main.js to rebuild SVG from shape data (avoids circular imports)
let _onRestore = null;
export function setOnRestore(fn) { _onRestore = fn; }

function captureState() {
  return {
    shapes: shapes.map(s => {
      const snap = {
        id: s.id, type: s.type, label: s.label,
        points: s.points.map(p => ({ x: p.x, y: p.y })),
        closed: s.closed,
      };
      // Extended landscape area / parametric properties
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
    houseEdgeIndex,
    selectedShapeId,
  };
}

export function snapshot() {
  undoStack.push(captureState());
  if (undoStack.length > MAX_HISTORY) undoStack.shift();
  redoStack.length = 0;
  updateButtons();
}

function applyState(snap) {
  const svg = getSvg();

  // Remove existing SVG shape elements
  shapes.forEach(s => s.svgEl.remove());
  shapes.length = 0;
  svg.querySelectorAll('circle.plant-circle,g.node-grp,.house-edge-indicator').forEach(n => n.remove());
  if (houseEdgeLine) { houseEdgeLine.remove(); setHouseEdgeLine(null); }

  // Restore scalar state
  state.placed = snap.placed.map(p => ({ ...p }));
  state.queue = snap.queue.map(p => ({ ...p }));
  state.myPlants = (snap.myPlants || []).map(mp => ({ ...mp }));
  setHouseEdgeIndex(snap.houseEdgeIndex);
  setSelectedShapeId(snap.selectedShapeId);

  // Rebuild shapes via callback (main.js provides this to avoid circular deps)
  if (_onRestore) _onRestore(snap.shapes);
  updateButtons();
}

export function undo() {
  if (!undoStack.length) return;
  redoStack.push(captureState());
  applyState(undoStack.pop());
}

export function redo() {
  if (!redoStack.length) return;
  undoStack.push(captureState());
  applyState(redoStack.pop());
}

export function clearHistory() {
  undoStack.length = 0;
  redoStack.length = 0;
  updateButtons();
}

function updateButtons() {
  const u = document.getElementById('btn-undo');
  const r = document.getElementById('btn-redo');
  if (u) u.disabled = !undoStack.length;
  if (r) r.disabled = !redoStack.length;
}
