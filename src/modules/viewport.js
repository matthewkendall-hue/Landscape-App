import { getSvg, svgPt } from '../utils/svg.js';
import * as st from '../state.js';

const MIN_ZOOM = 0.2;
const MAX_ZOOM = 5.0;

let baseW = 0;
let baseH = 0;
let zoomLevel = 1.0;
let panStart = null; // {clientX, clientY, vbx, vby}
let spaceHeld = false;

function applyViewBox() {
  const vb = st.viewBox;
  getSvg().setAttribute('viewBox', `${vb.x} ${vb.y} ${vb.w} ${vb.h}`);
  updateZoomDisplay();
}

function updateZoomDisplay() {
  const el = document.getElementById('zoom-level');
  if (el) el.textContent = Math.round(zoomLevel * 100) + '%';
}

export function initViewport() {
  const svg = getSvg();
  const w = svg.clientWidth || 800;
  const h = svg.clientHeight || 600;
  baseW = w;
  baseH = h;
  st.setViewBox({ x: 0, y: 0, w, h });
  applyViewBox();

  // Wheel zoom
  svg.addEventListener('wheel', e => {
    e.preventDefault();
    const pt = svgPt(e);
    const factor = e.deltaY > 0 ? 1.1 : 1 / 1.1;
    const newZoom = zoomLevel / factor;
    if (newZoom < MIN_ZOOM || newZoom > MAX_ZOOM) return;
    zoomLevel = newZoom;

    const vb = st.viewBox;
    const newW = vb.w * factor;
    const newH = vb.h * factor;
    st.setViewBox({
      x: pt.x - (pt.x - vb.x) * (newW / vb.w),
      y: pt.y - (pt.y - vb.y) * (newH / vb.h),
      w: newW,
      h: newH,
    });
    applyViewBox();
  }, { passive: false });

  // Pan via middle-click or space+drag
  svg.addEventListener('mousedown', e => {
    if (e.button === 1 || (e.button === 0 && spaceHeld)) {
      e.preventDefault();
      st.setIsPanning(true);
      panStart = { clientX: e.clientX, clientY: e.clientY, vbx: st.viewBox.x, vby: st.viewBox.y };
      svg.style.cursor = 'grabbing';
    }
  });

  window.addEventListener('mousemove', e => {
    if (!st.isPanning || !panStart) return;
    const vb = st.viewBox;
    const scale = vb.w / (baseW || 1);
    const dx = (e.clientX - panStart.clientX) * scale;
    const dy = (e.clientY - panStart.clientY) * scale;
    st.setViewBox({ ...vb, x: panStart.vbx - dx, y: panStart.vby - dy });
    applyViewBox();
  });

  window.addEventListener('mouseup', e => {
    if (st.isPanning) {
      st.setIsPanning(false);
      panStart = null;
      svg.style.cursor = spaceHeld ? 'grab' : 'default';
    }
  });

  // Space key for pan mode
  window.addEventListener('keydown', e => {
    if (e.code === 'Space' && !e.repeat && !isInputFocused()) {
      e.preventDefault();
      spaceHeld = true;
      if (!st.drawingType) svg.style.cursor = 'grab';
    }
  });

  window.addEventListener('keyup', e => {
    if (e.code === 'Space') {
      spaceHeld = false;
      if (!st.isPanning && !st.drawingType) svg.style.cursor = 'default';
    }
  });

  // Zoom buttons
  document.getElementById('btn-zoom-in')?.addEventListener('click', () => zoomBy(1 / 1.2));
  document.getElementById('btn-zoom-out')?.addEventListener('click', () => zoomBy(1.2));
  document.getElementById('btn-zoom-fit')?.addEventListener('click', zoomToFit);
  document.getElementById('btn-zoom-reset')?.addEventListener('click', resetZoom);
}

function isInputFocused() {
  const tag = document.activeElement?.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
}

function zoomBy(factor) {
  const vb = st.viewBox;
  const newZoom = zoomLevel / factor;
  if (newZoom < MIN_ZOOM || newZoom > MAX_ZOOM) return;
  zoomLevel = newZoom;
  const cx = vb.x + vb.w / 2;
  const cy = vb.y + vb.h / 2;
  const newW = vb.w * factor;
  const newH = vb.h * factor;
  st.setViewBox({ x: cx - newW / 2, y: cy - newH / 2, w: newW, h: newH });
  applyViewBox();
}

function resetZoom() {
  zoomLevel = 1.0;
  st.setViewBox({ x: 0, y: 0, w: baseW, h: baseH });
  applyViewBox();
}

function zoomToFit() {
  const { shapes } = st;
  if (!shapes.length) { resetZoom(); return; }
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const s of shapes) {
    for (const p of s.points) {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }
  }
  const pad = 60;
  const w = (maxX - minX) + pad * 2;
  const h = (maxY - minY) + pad * 2;
  const aspect = baseW / baseH;
  let fitW, fitH;
  if (w / h > aspect) { fitW = w; fitH = w / aspect; }
  else { fitH = h; fitW = h * aspect; }
  zoomLevel = baseW / fitW;
  st.setViewBox({
    x: (minX + maxX) / 2 - fitW / 2,
    y: (minY + maxY) / 2 - fitH / 2,
    w: fitW, h: fitH,
  });
  applyViewBox();
}

export function syncViewBoxOnResize() {
  const svg = getSvg();
  const w = svg.clientWidth || 800;
  const h = svg.clientHeight || 600;
  if (!baseW) { baseW = w; baseH = h; return; }
  const vb = st.viewBox;
  const cx = vb.x + vb.w / 2;
  const cy = vb.y + vb.h / 2;
  const scale = vb.w / baseW;
  const newW = w * scale;
  const newH = h * scale;
  baseW = w;
  baseH = h;
  st.setViewBox({ x: cx - newW / 2, y: cy - newH / 2, w: newW, h: newH });
  applyViewBox();
}
