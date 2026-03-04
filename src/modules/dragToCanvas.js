import { state, shapes } from '../state.js';
import { getSvg } from '../utils/svg.js';
import { ptInPoly, ftToPx } from '../utils/geometry.js';
import { getSiteShape } from './shapes.js';
import { renderPlants, renderList } from './plants.js';
import { renderMyPlants } from './myPlants.js';
import { snapshot } from './undoRedo.js';

/**
 * Drag-to-canvas: drop plants from library or My Plants onto the SVG canvas.
 */
export function initDragToCanvas() {
  const svg = getSvg();
  const wrap = document.getElementById('canvas-wrap');

  // Prevent default to allow drop
  wrap.addEventListener('dragover', e => {
    if (e.dataTransfer.types.includes('application/terrain-plant') ||
        e.dataTransfer.types.includes('application/terrain-myplant')) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    }
  });

  wrap.addEventListener('drop', e => {
    e.preventDefault();

    let plant = null;
    let fromMyPlants = false;

    // Check both data formats
    const myPlantData = e.dataTransfer.getData('application/terrain-myplant');
    const plantData = e.dataTransfer.getData('application/terrain-plant');

    if (myPlantData) {
      plant = JSON.parse(myPlantData);
      fromMyPlants = true;
    } else if (plantData) {
      plant = JSON.parse(plantData);
    }

    if (!plant) return;

    // Convert drop point to SVG coordinates using getScreenCTM
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const ctm = svg.getScreenCTM().inverse();
    const svgPoint = pt.matrixTransform(ctm);

    const x = svgPoint.x;
    const y = svgPoint.y;

    // Validate: must be inside site boundary
    const site = getSiteShape();
    if (!site) return;
    if (!ptInPoly(x, y, site.points)) return;

    // Check not inside obstacles
    const inObstacle = shapes.some(s =>
      (s.type === 'house' || s.type === 'patio') && ptInPoly(x, y, s.points)
    );
    if (inObstacle) return;

    // Check My Plants quantity
    if (fromMyPlants) {
      const mp = state.myPlants.find(m => m.plantId === plant.id);
      if (mp) {
        // Recount used
        let used = 0;
        for (const p of state.placed) {
          if (p.fromMyPlants && p.plantId === plant.id) used++;
        }
        if (used >= mp.quantity) return;
      }
    }

    const spacingPx = ftToPx(plant.spacing || plant.width || 3);
    const r = spacingPx / 2 * 0.95;

    snapshot();
    state.placed.push({
      id: crypto.randomUUID(),
      x, y, r,
      plantId: plant.id,
      name: plant.name,
      layer: plant.layer,
      spacing: plant.spacing,
      light: plant.light,
      water: plant.water,
      fromMyPlants,
    });

    renderPlants();
    renderList();
    if (fromMyPlants) renderMyPlants();
  });
}
