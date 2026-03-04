import { houseEdgeIndex, houseEdgeLine, setHouseEdgeIndex, setHouseEdgeLine, drawingType } from '../state.js';
import { ns, svgPt, setBanner, getSvg } from '../utils/svg.js';
import { distSeg } from '../utils/geometry.js';
import { getSiteShape } from './shapes.js';

export function renderHouseEdge() {
  if (houseEdgeLine) { houseEdgeLine.remove(); setHouseEdgeLine(null); }
  const site = getSiteShape();
  if (!site || houseEdgeIndex == null) return;
  const pts = site.points;
  const a = pts[houseEdgeIndex], b = pts[(houseEdgeIndex + 1) % pts.length];
  const ln = ns('line');
  ln.setAttribute('x1', a.x);
  ln.setAttribute('y1', a.y);
  ln.setAttribute('x2', b.x);
  ln.setAttribute('y2', b.y);
  ln.setAttribute('stroke', '#e86a3a');
  ln.setAttribute('stroke-width', '4');
  ln.setAttribute('stroke-dasharray', '8,4');
  ln.setAttribute('class', 'house-edge-indicator');
  getSvg().appendChild(ln);
  setHouseEdgeLine(ln);
}

export function initHouseEdge() {
  document.getElementById('btn-house-edge').onclick = () => {
    const site = getSiteShape();
    if (!site) { alert('Draw a Site Boundary first.'); return; }
    setBanner('Click near a site boundary edge to set as House Edge');
    const svg = getSvg();
    svg.style.cursor = 'crosshair';
    const handler = evt => {
      if (drawingType) { svg.removeEventListener('click', handler); return; }
      const p = svgPt(evt);
      const pts = site.points;
      let best = 0, bestD = Infinity;
      for (let i = 0; i < pts.length; i++) {
        const d = distSeg(p, pts[i], pts[(i + 1) % pts.length]);
        if (d < bestD) { bestD = d; best = i; }
      }
      setHouseEdgeIndex(best);
      renderHouseEdge();
      svg.removeEventListener('click', handler);
      svg.style.cursor = 'default';
      setBanner('House edge set ✓', true);
      setTimeout(() => setBanner('', false), 2000);
    };
    svg.addEventListener('click', handler);
  };
}
