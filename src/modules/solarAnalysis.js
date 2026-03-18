/**
 * Solar Analysis module — shadow casting, north compass, and sun path overlay.
 * Renders SVG shadows from house/canopy shapes and a draggable north compass.
 */

import { shapes, northAngle, setNorthAngle } from '../state.js';
import { state } from '../state.js';
import { getSunPosition, getSunriseSunset } from '../utils/solar.js';
import { ns, getSvg } from '../utils/svg.js';

const DEG = Math.PI / 180;
const RAD = 180 / Math.PI;

let solarActive = false;
let shadowGroup = null;    // SVG <g> for shadow polygons
let compassEl = null;      // DOM element for north compass
let panelEl = null;        // DOM element for control panel
let currentHour = 12;      // current hour slider value
let currentMonth = new Date().getMonth(); // 0-11

// Default house heights (ft) for shadow length calculation
const DEFAULT_HEIGHTS = { house: 18, canopy: 25, patio: 0, site: 0, landscape: 0, path: 0 };

export function isSolarActive() { return solarActive; }

/**
 * Toggle solar analysis on/off.
 */
export function toggleSolar() {
  if (solarActive) {
    closeSolar();
  } else {
    openSolar();
  }
}

function openSolar() {
  if (!state.selectedLocation) {
    alert('Select a location (state + city) in the Plant Library panel first to enable solar analysis.');
    return;
  }
  solarActive = true;
  createPanel();
  createCompass();
  createShadowGroup();
  updateShadows();
  document.getElementById('btn-solar')?.classList.add('active');
}

function closeSolar() {
  solarActive = false;
  if (shadowGroup) { shadowGroup.remove(); shadowGroup = null; }
  if (compassEl) { compassEl.remove(); compassEl = null; }
  if (panelEl) { panelEl.remove(); panelEl = null; }
  document.getElementById('btn-solar')?.classList.remove('active');
}

/** Create the control panel (time slider, month, sun info) */
function createPanel() {
  if (panelEl) panelEl.remove();
  panelEl = document.createElement('div');
  panelEl.id = 'solar-panel';
  panelEl.innerHTML = `
    <div class="solar-panel-title">Solar Analysis</div>
    <div class="solar-row">
      <label>Month</label>
      <select id="solar-month">
        ${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
          .map((m, i) => `<option value="${i}" ${i === currentMonth ? 'selected' : ''}>${m}</option>`).join('')}
      </select>
    </div>
    <div class="solar-row">
      <label>Time</label>
      <input type="range" id="solar-hour" min="5" max="21" step="0.25" value="${currentHour}" />
      <span id="solar-hour-label">${fmtTime(currentHour)}</span>
    </div>
    <div class="solar-row">
      <label>North</label>
      <input type="range" id="solar-north" min="0" max="359" step="1" value="${northAngle}" />
      <span id="solar-north-label">${Math.round(northAngle)}°</span>
    </div>
    <div id="solar-info"></div>
    <button class="btn" id="solar-close-btn">Close</button>
  `;
  document.getElementById('canvas-wrap').appendChild(panelEl);

  // Events
  panelEl.querySelector('#solar-hour').oninput = (e) => {
    currentHour = parseFloat(e.target.value);
    panelEl.querySelector('#solar-hour-label').textContent = fmtTime(currentHour);
    updateShadows();
  };
  panelEl.querySelector('#solar-month').onchange = (e) => {
    currentMonth = parseInt(e.target.value);
    updateShadows();
  };
  panelEl.querySelector('#solar-north').oninput = (e) => {
    setNorthAngle(parseInt(e.target.value));
    panelEl.querySelector('#solar-north-label').textContent = `${Math.round(northAngle)}°`;
    updateCompassRotation();
    updateShadows();
  };
  panelEl.querySelector('#solar-close-btn').onclick = closeSolar;
}

/** Create the SVG shadow group */
function createShadowGroup() {
  if (shadowGroup) shadowGroup.remove();
  const svg = getSvg();
  shadowGroup = ns('g');
  shadowGroup.setAttribute('id', 'shadow-group');
  shadowGroup.setAttribute('opacity', '0.35');
  // Insert before plants but after shapes
  svg.appendChild(shadowGroup);
}

/** Create the north compass overlay */
function createCompass() {
  if (compassEl) compassEl.remove();
  compassEl = document.createElement('div');
  compassEl.id = 'north-compass';
  compassEl.innerHTML = `
    <svg viewBox="0 0 60 60" width="60" height="60">
      <circle cx="30" cy="30" r="28" fill="rgba(0,0,0,0.5)" stroke="var(--border2)" stroke-width="1"/>
      <polygon points="30,6 25,28 35,28" fill="#e05040" stroke="none"/>
      <polygon points="30,54 25,32 35,32" fill="#888" stroke="none"/>
      <text x="30" y="18" text-anchor="middle" fill="#fff" font-size="9" font-weight="bold" font-family="Overpass Mono, monospace">N</text>
    </svg>
  `;
  document.getElementById('canvas-wrap').appendChild(compassEl);
  updateCompassRotation();
}

function updateCompassRotation() {
  if (!compassEl) return;
  const svg = compassEl.querySelector('svg');
  svg.style.transform = `rotate(${-northAngle}deg)`;
}

/**
 * Compute and render shadow polygons for house and canopy shapes.
 */
function updateShadows() {
  if (!shadowGroup || !state.selectedLocation) return;
  shadowGroup.innerHTML = '';

  const { lat, lng } = state.selectedLocation;
  const now = new Date();
  // Build a date for the selected month/hour (using 15th of month)
  const date = new Date(now.getFullYear(), currentMonth, 15, Math.floor(currentHour), (currentHour % 1) * 60);

  const sun = getSunPosition(lat, lng, date);
  const { sunrise, sunset } = getSunriseSunset(lat, lng, date);

  // Update info
  updateInfo(sun, sunrise, sunset);

  // No shadows when sun is below horizon
  if (sun.altitude <= 0) {
    const text = ns('text');
    text.setAttribute('x', '50%');
    text.setAttribute('y', '50%');
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', '#e05040');
    text.setAttribute('font-size', '14');
    text.setAttribute('font-family', 'Overpass Mono, monospace');
    text.textContent = 'Sun below horizon';
    shadowGroup.appendChild(text);
    return;
  }

  // Shadow direction: opposite of sun azimuth, adjusted for north angle
  // On-screen: azimuth 0 = north = up, rotated by northAngle
  const screenAz = sun.azimuth - northAngle * DEG + Math.PI; // shadow direction (opposite sun)
  const shadowLen = 1 / Math.tan(sun.altitude); // shadow multiplier (ft per ft of height)

  // Cast shadows for each house and canopy shape
  for (const shape of shapes) {
    const height = shape.height || DEFAULT_HEIGHTS[shape.type] || 0;
    if (height <= 0 || !shape.points || shape.points.length < 2) continue;
    if (shape.type !== 'house' && shape.type !== 'canopy') continue;

    const offsetX = Math.sin(screenAz) * shadowLen * height;
    const offsetY = -Math.cos(screenAz) * shadowLen * height;

    // Create shadow polygon: shape outline + offset outline
    const pts = shape.points;
    const shadowPts = pts.map(p => ({ x: p.x + offsetX, y: p.y + offsetY }));

    // Build a combined polygon (original + offset connected at edges)
    const allPts = [...pts, ...shadowPts.reverse()];
    const polyStr = allPts.map(p => `${p.x},${p.y}`).join(' ');

    const poly = ns('polygon');
    poly.setAttribute('points', polyStr);
    poly.setAttribute('fill', shape.type === 'house' ? '#1a0a05' : '#0a1a10');
    poly.setAttribute('stroke', 'none');
    shadowGroup.appendChild(poly);

    // Also draw the offset shape itself for a cleaner look
    const shadowOutline = ns('polygon');
    shadowOutline.setAttribute('points', shadowPts.reverse().map(p => `${p.x},${p.y}`).join(' '));
    shadowOutline.setAttribute('fill', shape.type === 'house' ? '#1a0a05' : '#0a1a10');
    shadowOutline.setAttribute('stroke', 'none');
    shadowGroup.appendChild(shadowOutline);
  }

  // Draw sun direction indicator arrow on compass
  drawSunIndicator(sun.azimuth);
}

function drawSunIndicator(azimuth) {
  if (!compassEl) return;
  const svg = compassEl.querySelector('svg');
  // Remove old indicator
  const old = svg.querySelector('.sun-indicator');
  if (old) old.remove();

  // Sun indicator dot on compass edge
  const angle = azimuth - Math.PI / 2; // convert to SVG angle (0 = right)
  const r = 22;
  const cx = 30 + r * Math.cos(angle - northAngle * DEG);
  const cy = 30 + r * Math.sin(angle - northAngle * DEG);

  const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  dot.setAttribute('class', 'sun-indicator');
  dot.setAttribute('cx', cx);
  dot.setAttribute('cy', cy);
  dot.setAttribute('r', '4');
  dot.setAttribute('fill', '#f0c030');
  dot.setAttribute('stroke', '#e8a020');
  dot.setAttribute('stroke-width', '1');
  svg.appendChild(dot);
}

function updateInfo(sun, sunrise, sunset) {
  const infoEl = panelEl?.querySelector('#solar-info');
  if (!infoEl) return;

  const altDeg = (sun.altitude * RAD).toFixed(1);
  const azDeg = (sun.azimuth * RAD).toFixed(1);
  const dir = azimuthToCardinal(sun.azimuth * RAD);
  const rise = fmtTime(sunrise);
  const set = fmtTime(sunset);
  const dayLen = (sunset - sunrise).toFixed(1);

  infoEl.innerHTML = `
    <div class="solar-info-row"><span>Altitude</span><span>${altDeg}°</span></div>
    <div class="solar-info-row"><span>Azimuth</span><span>${azDeg}° ${dir}</span></div>
    <div class="solar-info-row"><span>Sunrise</span><span>${rise}</span></div>
    <div class="solar-info-row"><span>Sunset</span><span>${set}</span></div>
    <div class="solar-info-row"><span>Day Length</span><span>${dayLen} hrs</span></div>
  `;
}

function fmtTime(h) {
  const hr = Math.floor(h);
  const min = Math.round((h % 1) * 60);
  const ampm = hr >= 12 ? 'PM' : 'AM';
  const hr12 = hr === 0 ? 12 : hr > 12 ? hr - 12 : hr;
  return `${hr12}:${String(min).padStart(2, '0')} ${ampm}`;
}

function azimuthToCardinal(deg) {
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  return dirs[Math.round(((deg % 360) + 360) % 360 / 22.5) % 16];
}

/** Re-render shadows if solar analysis is active (call after shape changes) */
export function refreshSolar() {
  if (solarActive) updateShadows();
}
