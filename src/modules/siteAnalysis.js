import { shapes, state } from '../state.js';
import { SUN_EXPOSURE, HYDROZONE, SOIL_TYPE, USE_ZONE } from '../config.js';
import { ftToPx } from '../utils/geometry.js';

const PX_TO_FT = 1 / ftToPx(1);

/**
 * Calculate polygon area in square feet via shoelace formula.
 */
function polyAreaSqFt(pts) {
  let area = 0;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    area += pts[j].x * pts[i].y - pts[i].x * pts[j].y;
  }
  return Math.abs(area / 2) * PX_TO_FT * PX_TO_FT;
}

/**
 * Render the Site Analysis panel in the right sidebar.
 * Shows a summary of all landscape areas, zone breakdown, and design metrics.
 */
export function renderSiteAnalysis() {
  const panel = document.getElementById('site-analysis');
  if (!panel) return;

  const landscapeAreas = shapes.filter(s => s.type === 'landscape' && s.closed);
  const site = shapes.find(s => s.type === 'site' && s.closed);

  if (!landscapeAreas.length && !site) {
    panel.style.display = 'none';
    return;
  }

  panel.style.display = 'block';
  panel.innerHTML = '';

  // Header
  const header = document.createElement('div');
  header.className = 'pane-header';
  header.innerHTML = '<span class="pane-title">Site Analysis</span>';
  panel.appendChild(header);

  const body = document.createElement('div');
  body.className = 'sa-body';

  // Site overview
  if (site) {
    const siteArea = polyAreaSqFt(site.points);
    const row = document.createElement('div');
    row.className = 'sa-stat-row';
    row.innerHTML = `<span class="sa-stat-label">Total Site</span><span class="sa-stat-val">${formatArea(siteArea)}</span>`;
    body.appendChild(row);
  }

  // Per-area summary
  if (landscapeAreas.length) {
    let totalLandscape = 0;

    // Zone tallies
    const sunTally = {};
    const hydroTally = {};
    const useTally = {};

    for (const area of landscapeAreas) {
      const sqft = polyAreaSqFt(area.points);
      totalLandscape += sqft;

      const zones = area.zones || { sun: 'full', hydrozone: 'mesic', soil: 'loam', use: 'habitat' };
      sunTally[zones.sun] = (sunTally[zones.sun] || 0) + sqft;
      hydroTally[zones.hydrozone] = (hydroTally[zones.hydrozone] || 0) + sqft;
      useTally[zones.use] = (useTally[zones.use] || 0) + sqft;
    }

    const row = document.createElement('div');
    row.className = 'sa-stat-row';
    row.innerHTML = `<span class="sa-stat-label">Landscape Areas</span><span class="sa-stat-val">${landscapeAreas.length} \u00b7 ${formatArea(totalLandscape)}</span>`;
    body.appendChild(row);

    // Sun breakdown
    if (Object.keys(sunTally).length > 0) {
      body.appendChild(makeBreakdown('Sun Exposure', sunTally, SUN_EXPOSURE, totalLandscape));
    }

    // Hydrozone breakdown
    if (Object.keys(hydroTally).length > 0) {
      body.appendChild(makeBreakdown('Hydrozones', hydroTally, HYDROZONE, totalLandscape));
    }

    // Use zones
    if (Object.keys(useTally).length > 0) {
      body.appendChild(makeBreakdown('Use Zones', useTally, USE_ZONE, totalLandscape));
    }
  }

  // Plant summary
  if (state.placed.length) {
    const divider = document.createElement('div');
    divider.className = 'sa-divider';
    body.appendChild(divider);

    const layers = { tree: 0, shrub: 0, ground: 0 };
    for (const p of state.placed) layers[p.layer] = (layers[p.layer] || 0) + 1;

    const plantRow = document.createElement('div');
    plantRow.className = 'sa-stat-row';
    plantRow.innerHTML = `<span class="sa-stat-label">Total Plants</span><span class="sa-stat-val">${state.placed.length}</span>`;
    body.appendChild(plantRow);

    for (const [layer, count] of Object.entries(layers)) {
      if (!count) continue;
      const r = document.createElement('div');
      r.className = 'sa-bar-row';
      r.innerHTML = `<span class="sa-bar-label">${layer}</span><span class="sa-bar-val">${count}</span>`;
      body.appendChild(r);
    }
  }

  // Design guidance
  const tips = getDesignTips(landscapeAreas);
  if (tips.length) {
    const divider = document.createElement('div');
    divider.className = 'sa-divider';
    body.appendChild(divider);

    const tipTitle = document.createElement('div');
    tipTitle.className = 'sa-section-title';
    tipTitle.textContent = 'Design Guidance';
    body.appendChild(tipTitle);

    for (const tip of tips) {
      const t = document.createElement('div');
      t.className = 'sa-tip';
      t.textContent = tip;
      body.appendChild(t);
    }
  }

  panel.appendChild(body);
}

// ——— Helpers ———

function formatArea(sqft) {
  return sqft >= 1000 ? `${(sqft / 1000).toFixed(1)}k ft\u00b2` : `${Math.round(sqft)} ft\u00b2`;
}

function makeBreakdown(title, tally, config, total) {
  const section = document.createElement('div');
  section.className = 'sa-breakdown';

  const t = document.createElement('div');
  t.className = 'sa-section-title';
  t.textContent = title;
  section.appendChild(t);

  for (const [key, sqft] of Object.entries(tally)) {
    const pct = total > 0 ? Math.round((sqft / total) * 100) : 0;
    const cfg = config[key];
    const row = document.createElement('div');
    row.className = 'sa-bar-row';

    const bar = document.createElement('div');
    bar.className = 'sa-bar';
    const fill = document.createElement('div');
    fill.className = 'sa-bar-fill';
    fill.style.width = `${pct}%`;
    if (cfg?.color) fill.style.background = cfg.color;
    bar.appendChild(fill);

    row.innerHTML = `<span class="sa-bar-label">${cfg?.label || key}</span>`;
    row.appendChild(bar);
    row.insertAdjacentHTML('beforeend', `<span class="sa-bar-pct">${pct}%</span>`);
    section.appendChild(row);
  }

  return section;
}

/**
 * Generate contextual design guidance based on the current site configuration.
 * Grounded in McHarg's ecological planning, Simonds' spatial design, and SITES sustainability.
 */
function getDesignTips(areas) {
  const tips = [];

  if (!areas.length) return tips;

  // Check zone diversity
  const useTypes = new Set(areas.map(a => a.zones?.use || 'habitat'));
  if (useTypes.size === 1) {
    tips.push('Consider diversifying use zones — mix habitat, buffer, and recreation for a balanced site.');
  }

  // Check for habitat connectivity (Forman's corridor principle)
  const habitatAreas = areas.filter(a => (a.zones?.use || 'habitat') === 'habitat');
  if (habitatAreas.length > 1) {
    tips.push('Multiple habitat zones detected. Connect them with planted corridors for wildlife movement (Forman).');
  }

  // Check for stormwater management
  const hasStormwater = areas.some(a => a.zones?.use === 'stormwater');
  const hasHydric = areas.some(a => a.zones?.hydrozone === 'hydric');
  if (!hasStormwater && !hasHydric) {
    tips.push('Consider adding a rain garden or bioswale area for on-site stormwater management (LID).');
  }

  // Check for layered planting (McHarg/ecological communities)
  const layers = new Set(areas.map(a => {
    // Check what layers are present in placed plants for this area
    const areaPlants = state.placed.filter(p => p.areaId === a.id);
    return [...new Set(areaPlants.map(p => p.layer))];
  }).flat());
  if (layers.size === 1 && state.placed.length > 5) {
    tips.push('Use all 3 planting layers (canopy, shrub, groundcover) for ecological richness and structure.');
  }

  // Xeric efficiency check
  const xericAreas = areas.filter(a => a.zones?.hydrozone === 'xeric');
  if (xericAreas.length > 0) {
    tips.push('Xeric zones reduce irrigation needs. Group drought-tolerant species together (hydrozoning).');
  }

  // Buffer/screening guidance
  const bufferAreas = areas.filter(a => a.zones?.use === 'buffer');
  if (bufferAreas.length > 0) {
    tips.push('Buffers are most effective with mixed-height evergreen + deciduous plantings at 60/40 ratio.');
  }

  return tips.slice(0, 3); // max 3 tips
}
