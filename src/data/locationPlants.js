/**
 * Location-aware plant palettes organized by USDA hardiness zone.
 * Each zone has curated plant lists grouped by layer for use in 3D concept generation.
 * Plants include 3D rendering hints (color, shape archetype, mature size).
 */

export const ZONE_PLANT_PALETTES = {
  'USDA-7': {
    label: 'USDA Zone 7 (0–10 °F)',
    climate: 'Temperate — cold winters, warm summers',
    trees: [
      { name: 'Eastern Redbud',      height: 25, spread: 25, shape: 'vase',    color: '#6b8e4e', flowerColor: '#d48bc8' },
      { name: 'Skyrocket Juniper',    height: 15, spread: 3,  shape: 'columnar', color: '#3a6b4a' },
      { name: 'Japanese Maple',       height: 15, spread: 15, shape: 'rounded',  color: '#8b3a3a' },
      { name: 'American Holly',       height: 30, spread: 15, shape: 'conical',  color: '#2d5a3a' },
      { name: 'Dogwood',              height: 20, spread: 20, shape: 'layered',  color: '#5a8040', flowerColor: '#f0e8e0' },
    ],
    shrubs: [
      { name: 'Winterberry',          height: 8,  spread: 6,  shape: 'rounded', color: '#4a7a3a', berryColor: '#cc3030' },
      { name: 'Inkberry Holly',       height: 6,  spread: 6,  shape: 'rounded', color: '#2d5a3a' },
      { name: 'Forsythia',            height: 8,  spread: 8,  shape: 'arching', color: '#5a8040', flowerColor: '#f0d040' },
      { name: 'Viburnum',             height: 8,  spread: 6,  shape: 'rounded', color: '#4a7a3a' },
      { name: 'Hydrangea',            height: 5,  spread: 5,  shape: 'rounded', color: '#5a8040', flowerColor: '#8888cc' },
    ],
    ground: [
      { name: 'Hosta',                height: 2,  spread: 3,  shape: 'mound', color: '#6b9e5e' },
      { name: 'Daylily',              height: 2,  spread: 2,  shape: 'grass', color: '#5a8a40', flowerColor: '#e8a030' },
      { name: 'Creeping Phlox',       height: 0.5,spread: 2,  shape: 'mat',   color: '#3a7a3a', flowerColor: '#cc66cc' },
      { name: 'Sedum',                height: 1,  spread: 2,  shape: 'mat',   color: '#7a9a5a' },
      { name: 'Liriope',              height: 1,  spread: 1.5,shape: 'grass', color: '#4a7a4a' },
    ],
  },

  'USDA-8': {
    label: 'USDA Zone 8 (10–20 °F)',
    climate: 'Warm temperate — mild winters, hot summers',
    trees: [
      { name: 'Crape Myrtle',         height: 20, spread: 12, shape: 'vase',    color: '#5a8040', flowerColor: '#d060a0' },
      { name: 'Live Oak',             height: 40, spread: 40, shape: 'spreading', color: '#3a5a2a' },
      { name: 'Nellie R. Stevens Holly', height: 20, spread: 8, shape: 'conical', color: '#2d5a3a' },
      { name: 'Southern Magnolia',    height: 40, spread: 25, shape: 'conical',  color: '#2a4a2a', flowerColor: '#f8f0e8' },
      { name: 'Bald Cypress',         height: 50, spread: 20, shape: 'conical',  color: '#5a8a4a' },
    ],
    shrubs: [
      { name: 'Loropetalum',          height: 6,  spread: 5,  shape: 'rounded', color: '#5a3050', flowerColor: '#d060a0' },
      { name: 'Yaupon Holly',         height: 8,  spread: 6,  shape: 'rounded', color: '#2d5a3a' },
      { name: 'Abelia',               height: 4,  spread: 4,  shape: 'arching', color: '#5a8040' },
      { name: 'Boxwood',              height: 3,  spread: 3,  shape: 'rounded', color: '#3a6a3a' },
      { name: 'Indian Hawthorn',      height: 4,  spread: 4,  shape: 'rounded', color: '#4a6a3a', flowerColor: '#e8b8c8' },
    ],
    ground: [
      { name: 'Lavender',             height: 2,  spread: 2,  shape: 'mound',  color: '#6a7a5a', flowerColor: '#8866aa' },
      { name: 'Salvia Greggii',       height: 2,  spread: 2,  shape: 'mound',  color: '#5a8040', flowerColor: '#cc3030' },
      { name: 'Liriope',              height: 1,  spread: 1.5,shape: 'grass',  color: '#4a7a4a' },
      { name: 'Lantana',              height: 2,  spread: 3,  shape: 'mound',  color: '#5a8040', flowerColor: '#e8a030' },
      { name: 'Purple Fountain Grass',height: 3,  spread: 2,  shape: 'grass',  color: '#7a5040' },
    ],
  },

  'USDA-9': {
    label: 'USDA Zone 9 (20–30 °F)',
    climate: 'Subtropical — rare frost, long hot summers',
    trees: [
      { name: 'Mexican Fan Palm',     height: 30, spread: 8,  shape: 'palm',     color: '#4a7a3a' },
      { name: 'Texas Ebony',          height: 25, spread: 20, shape: 'spreading', color: '#3a5a2a' },
      { name: 'Desert Willow',        height: 20, spread: 15, shape: 'vase',     color: '#6a8a5a', flowerColor: '#cc66aa' },
      { name: 'Palo Verde',           height: 20, spread: 20, shape: 'spreading', color: '#5a8a40' },
      { name: 'Windmill Palm',        height: 20, spread: 8,  shape: 'palm',     color: '#3a6a3a' },
    ],
    shrubs: [
      { name: 'Texas Sage',           height: 5,  spread: 4,  shape: 'rounded', color: '#7a8a7a', flowerColor: '#9944aa' },
      { name: 'Oleander',             height: 8,  spread: 6,  shape: 'rounded', color: '#4a7a3a', flowerColor: '#e8607a' },
      { name: 'Agave',                height: 4,  spread: 4,  shape: 'rosette', color: '#6a8a6a' },
      { name: 'Red Yucca',            height: 4,  spread: 3,  shape: 'grass',   color: '#5a7a4a', flowerColor: '#cc4444' },
      { name: 'Dwarf Palmetto',       height: 5,  spread: 5,  shape: 'palm',    color: '#3a6a3a' },
    ],
    ground: [
      { name: 'Agapanthus',           height: 2,  spread: 2,  shape: 'grass',  color: '#4a7a4a', flowerColor: '#4466cc' },
      { name: 'Society Garlic',       height: 1.5,spread: 1.5,shape: 'grass',  color: '#5a7a4a', flowerColor: '#aa66cc' },
      { name: 'Trailing Rosemary',    height: 1,  spread: 3,  shape: 'mat',    color: '#5a7a5a', flowerColor: '#6688cc' },
      { name: 'Blue Daze',            height: 1,  spread: 2,  shape: 'mound',  color: '#5a8a5a', flowerColor: '#4488dd' },
      { name: 'Damianita',            height: 1.5,spread: 2,  shape: 'mound',  color: '#6a8a4a', flowerColor: '#e8d040' },
    ],
  },

  'All': {
    label: 'All Regions',
    climate: 'Mixed conditions',
    trees: [
      { name: 'Crape Myrtle',         height: 20, spread: 12, shape: 'vase',     color: '#5a8040', flowerColor: '#d060a0' },
      { name: 'Live Oak',             height: 40, spread: 40, shape: 'spreading', color: '#3a5a2a' },
      { name: 'Eastern Redbud',       height: 25, spread: 25, shape: 'vase',     color: '#6b8e4e', flowerColor: '#d48bc8' },
      { name: 'Japanese Maple',       height: 15, spread: 15, shape: 'rounded',  color: '#8b3a3a' },
      { name: 'Desert Willow',        height: 20, spread: 15, shape: 'vase',     color: '#6a8a5a', flowerColor: '#cc66aa' },
    ],
    shrubs: [
      { name: 'Boxwood',              height: 3,  spread: 3,  shape: 'rounded', color: '#3a6a3a' },
      { name: 'Hydrangea',            height: 5,  spread: 5,  shape: 'rounded', color: '#5a8040', flowerColor: '#8888cc' },
      { name: 'Loropetalum',          height: 6,  spread: 5,  shape: 'rounded', color: '#5a3050', flowerColor: '#d060a0' },
      { name: 'Abelia',               height: 4,  spread: 4,  shape: 'arching', color: '#5a8040' },
      { name: 'Yaupon Holly',         height: 8,  spread: 6,  shape: 'rounded', color: '#2d5a3a' },
    ],
    ground: [
      { name: 'Lavender',             height: 2,  spread: 2,  shape: 'mound', color: '#6a7a5a', flowerColor: '#8866aa' },
      { name: 'Liriope',              height: 1,  spread: 1.5,shape: 'grass', color: '#4a7a4a' },
      { name: 'Sedum',                height: 1,  spread: 2,  shape: 'mat',   color: '#7a9a5a' },
      { name: 'Daylily',              height: 2,  spread: 2,  shape: 'grass', color: '#5a8a40', flowerColor: '#e8a030' },
      { name: 'Salvia Greggii',       height: 2,  spread: 2,  shape: 'mound', color: '#5a8040', flowerColor: '#cc3030' },
    ],
  },
};
