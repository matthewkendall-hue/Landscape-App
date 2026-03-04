export function ptInPoly(x, y, pts) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const xi = pts[i].x, yi = pts[i].y, xj = pts[j].x, yj = pts[j].y;
    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / ((yj - yi) || 1e-9) + xi))
      inside = !inside;
  }
  return inside;
}

export function distSeg(p, a, b) {
  const APx = p.x - a.x, APy = p.y - a.y, ABx = b.x - a.x, ABy = b.y - a.y;
  const ab2 = ABx * ABx + ABy * ABy || 1;
  const t = Math.max(0, Math.min(1, (APx * ABx + APy * ABy) / ab2));
  return Math.hypot(p.x - (a.x + ABx * t), p.y - (a.y + ABy * t));
}

export function distPoly(p, pts) {
  let min = Infinity;
  for (let i = 0; i < pts.length; i++)
    min = Math.min(min, distSeg(p, pts[i], pts[(i + 1) % pts.length]));
  return min;
}

export function ftToPx(ft) {
  return (ft || 1) * 8;
}

export function layerAt(p, site, houseEdgeIndex) {
  if (!site || houseEdgeIndex == null) return 'shrub';
  const pts = site.points;
  const d = distSeg(p, pts[houseEdgeIndex], pts[(houseEdgeIndex + 1) % pts.length]);
  return d < 80 ? 'ground' : d < 200 ? 'shrub' : 'tree';
}
