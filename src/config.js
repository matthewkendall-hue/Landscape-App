export const TYPE_CFG = {
  site:   { label: 'Site Boundary', stroke: '#5a8040', fill: '#1a2a14', fOpacity: 0.35, sw: 2.5, dash: '' },
  house:  { label: 'House',         stroke: '#e86a3a', fill: '#3a1a0a', fOpacity: 0.55, sw: 2,   dash: '' },
  patio:  { label: 'Patio',         stroke: '#b0a060', fill: '#2a2510', fOpacity: 0.50, sw: 1.8, dash: '6,3' },
  canopy:    { label: 'Canopy',         stroke: '#60b0a0', fill: '#0a2520', fOpacity: 0.30, sw: 1.5, dash: '4,4' },
  landscape: { label: 'Landscape Area', stroke: '#8cc63f', fill: '#1a3a0a', fOpacity: 0.20, sw: 2,   dash: '8,4' },
};

export const LAYER_HEX = {
  ground: '#72b8d4',
  shrub:  '#5dbb7a',
  tree:   '#e8a030',
};

export const LAYER_CSS = {
  ground: 'var(--ground-c)',
  shrub:  'var(--shrub-c)',
  tree:   'var(--tree-c)',
};

// Landscape planning zone classifications (from ecological design principles)

export const SUN_EXPOSURE = {
  full:    { label: 'Full Sun',      hours: '6+',  icon: '\u2600', desc: 'South/west facing, open sky' },
  partial: { label: 'Partial Sun',   hours: '3-6', icon: '\u26c5', desc: 'East facing or filtered light' },
  shade:   { label: 'Full Shade',    hours: '<3',  icon: '\u2601', desc: 'North facing or dense canopy' },
};

export const HYDROZONE = {
  xeric:  { label: 'Xeric (Low)',    color: '#d4a044', desc: 'Drought-tolerant, minimal irrigation' },
  mesic:  { label: 'Mesic (Medium)', color: '#5dbb7a', desc: 'Moderate water, typical garden' },
  hydric: { label: 'Hydric (High)',  color: '#72b8d4', desc: 'Wet areas, rain gardens, bioswales' },
};

export const SOIL_TYPE = {
  sand:  { label: 'Sandy',      desc: 'Fast-draining, low nutrients' },
  loam:  { label: 'Loam',       desc: 'Balanced, ideal for most plants' },
  clay:  { label: 'Clay',       desc: 'Slow-draining, nutrient-rich' },
  amend: { label: 'Amended',    desc: 'Improved with organic matter' },
};

export const USE_ZONE = {
  habitat:   { label: 'Habitat / Native',   color: '#5a8040', desc: 'Wildlife habitat, native plantings' },
  passive:   { label: 'Passive Recreation',  color: '#60b0a0', desc: 'Contemplation, seating, views' },
  active:    { label: 'Active Recreation',   color: '#e8a030', desc: 'Play, sport, gathering' },
  edible:    { label: 'Edible Garden',       color: '#bb5d7a', desc: 'Food production, herbs, fruit' },
  buffer:    { label: 'Buffer / Screen',     color: '#7a6090', desc: 'Privacy, wind, noise screening' },
  stormwater:{ label: 'Stormwater / LID',    color: '#4488cc', desc: 'Rain garden, bioswale, infiltration' },
};
