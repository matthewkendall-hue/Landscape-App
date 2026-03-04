// Shared mutable application state.
// Modules import this object and read/write its properties directly.

export const state = {
  placed: [],
  queue: [],
  plants: [],
  myPlants: [], // {plantId, name, layer, spacing, light, water, width, height, region, quantity, used}
};

// Shape list: [{id, type, label, points, svgEl, closed}]
export const shapes = [];

export let selectedShapeId = null;
export function setSelectedShapeId(id) { selectedShapeId = id; }

// Drawing state
export let drawingType = null;
export let drawingPts = [];
export let previewPoly = null;
export let ghostDots = [];

export function setDrawingType(v) { drawingType = v; }
export function setDrawingPts(v) { drawingPts = v; }
export function setPreviewPoly(v) { previewPoly = v; }
export function setGhostDots(v) { ghostDots = v; }

// Node dragging
export let draggingNode = null;
export function setDraggingNode(v) { draggingNode = v; }

// Edge dragging
export let draggingEdge = null;
export function setDraggingEdge(v) { draggingEdge = v; }

// Plant dragging
export let plantDrag = null;
export function setPlantDrag(v) { plantDrag = v; }

// House edge
export let houseEdgeIndex = null;
export let houseEdgeLine = null;
export function setHouseEdgeIndex(v) { houseEdgeIndex = v; }
export function setHouseEdgeLine(v) { houseEdgeLine = v; }

// Viewport
export let viewBox = { x: 0, y: 0, w: 0, h: 0 };
export function setViewBox(v) { viewBox = v; }

export let isPanning = false;
export function setIsPanning(v) { isPanning = v; }
