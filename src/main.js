import './styles/main.css';
import { shapes } from './state.js';
import { syncViewBox, getSvg } from './utils/svg.js';
import { initDrawingEvents, startDrawing } from './modules/drawing.js';
import { loadLibrary, renderLibrary, renderQueue, initLibraryForm } from './modules/library.js';
import { renderPlants, renderList } from './modules/plants.js';
import { renderShapeList } from './modules/shapeList.js';
import { initHouseEdge } from './modules/houseEdge.js';
import { renderHouseEdge } from './modules/houseEdge.js';
import { initSurvey } from './modules/survey.js';
import { autoFill } from './modules/autofill.js';
import { exportJSON, resetAll } from './modules/exportReset.js';
import { makeShapeEl, renderAllNodes } from './modules/shapes.js';
import { undo, redo, setOnRestore } from './modules/undoRedo.js';
import { initViewport, syncViewBoxOnResize } from './modules/viewport.js';
import { initParametric } from './modules/parametric.js';
import { renderMyPlants } from './modules/myPlants.js';
import { initDragToCanvas } from './modules/dragToCanvas.js';
import { showSaveModal, showLoadModal, exportProjectFile, setOnRebuild } from './modules/saveLoad.js';
import { renderMeasurements, toggleMeasurements } from './modules/measurements.js';
import { renderSiteAnalysis } from './modules/siteAnalysis.js';

/**
 * Rebuild SVG shapes from serialized shape data and re-render all UI.
 * Used by both undo/redo restore and project load.
 */
function rebuildFromData(shapeData) {
  const svg = getSvg();
  for (const s of shapeData) {
    const el = makeShapeEl(s.type, s.points);
    svg.appendChild(el);
    const shape = {
      id: s.id, type: s.type, label: s.label,
      points: s.points.map(p => ({ x: p.x, y: p.y })),
      svgEl: el, closed: s.closed,
    };
    // Restore extended properties
    if (s.parametric) shape.parametric = s.parametric;
    if (s.queueOverride) shape.queueOverride = s.queueOverride;
    if (s.visible !== undefined) shape.visible = s.visible;
    if (s.zones) shape.zones = s.zones;
    if (s._resolveSeed !== undefined) shape._resolveSeed = s._resolveSeed;
    shapes.push(shape);
  }
  renderPlants();
  renderAllNodes();
  renderShapeList();
  renderList();
  renderQueue();
  renderHouseEdge();
  renderMyPlants();
  renderLibrary();
  renderMeasurements();
  renderSiteAnalysis();
}

function init() {
  syncViewBox();
  initViewport();
  loadLibrary();
  renderQueue();
  renderList();
  renderShapeList();
  renderMyPlants();

  // Register rebuild callback for undo/redo and save/load
  setOnRestore(rebuildFromData);
  setOnRebuild(rebuildFromData);

  // Drawing events (SVG click, mousemove, keyboard)
  initDrawingEvents();

  // Draw buttons
  ['site', 'house', 'patio', 'canopy', 'landscape'].forEach(t => {
    document.getElementById('btn-draw-' + t).onclick = () => startDrawing(t);
  });

  // Parametric planter placement
  initParametric();

  // Drag-to-canvas from library/My Plants
  initDragToCanvas();

  // House edge
  initHouseEdge();

  // Survey image
  initSurvey();

  // Library form
  initLibraryForm();

  // Action buttons
  document.getElementById('btn-fill').onclick = autoFill;
  document.getElementById('btn-export').onclick = exportProjectFile;
  document.getElementById('btn-reset').onclick = resetAll;

  // Save/Load buttons
  document.getElementById('btn-save').onclick = showSaveModal;
  document.getElementById('btn-load').onclick = showLoadModal;

  // Measurements toggle
  document.getElementById('btn-measure').onclick = toggleMeasurements;

  // Undo/redo buttons
  document.getElementById('btn-undo').onclick = undo;
  document.getElementById('btn-redo').onclick = redo;
}

window.addEventListener('load', init);
window.addEventListener('resize', syncViewBoxOnResize);
