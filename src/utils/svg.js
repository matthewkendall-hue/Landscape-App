const svgEl = () => document.getElementById('svg');

// Initial fallback — viewport.js takes over once initialized
export function syncViewBox() {
  const svg = svgEl();
  if (!svg.getAttribute('viewBox')) {
    svg.setAttribute('viewBox', `0 0 ${svg.clientWidth || 800} ${svg.clientHeight || 600}`);
  }
}

export function ns(tag) {
  return document.createElementNS('http://www.w3.org/2000/svg', tag);
}

export function svgPt(e) {
  const svg = svgEl();
  const p = svg.createSVGPoint();
  p.x = e.clientX;
  p.y = e.clientY;
  return p.matrixTransform(svg.getScreenCTM().inverse());
}

export function mkTitle(text) {
  const el = ns('title');
  el.textContent = text;
  return el;
}

export function setBanner(txt, show = true) {
  const el = document.getElementById('mode-banner');
  el.textContent = txt;
  el.classList.toggle('visible', show);
}

export function getSvg() {
  return svgEl();
}
