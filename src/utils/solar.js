/**
 * NOAA-based solar position calculator.
 * Returns sun altitude and azimuth for a given location, date, and time.
 */

const DEG = Math.PI / 180;
const RAD = 180 / Math.PI;

/**
 * Get Julian Day Number from a Date object.
 */
function julianDay(date) {
  return date.getTime() / 86400000 + 2440587.5;
}

/**
 * Calculate sun position (altitude and azimuth) for a given location and time.
 * @param {number} lat  - Latitude in degrees (positive = north)
 * @param {number} lng  - Longitude in degrees (positive = east)
 * @param {Date}   date - Date/time (local or UTC)
 * @returns {{ altitude: number, azimuth: number }} in radians
 *   altitude: 0 = horizon, PI/2 = zenith, negative = below horizon
 *   azimuth:  0 = north, PI/2 = east, PI = south, 3PI/2 = west (clockwise from north)
 */
export function getSunPosition(lat, lng, date) {
  const jd = julianDay(date);
  const n = jd - 2451545.0; // days since J2000.0

  // Mean longitude and mean anomaly of the sun
  const L = ((280.460 + 0.9856474 * n) % 360 + 360) % 360;
  const g = ((357.528 + 0.9856003 * n) % 360 + 360) % 360;

  // Ecliptic longitude
  const lambda = L + 1.915 * Math.sin(g * DEG) + 0.020 * Math.sin(2 * g * DEG);

  // Obliquity of the ecliptic
  const epsilon = 23.439 - 0.0000004 * n;

  // Right ascension and declination
  const sinLam = Math.sin(lambda * DEG);
  const cosLam = Math.cos(lambda * DEG);
  const sinEps = Math.sin(epsilon * DEG);
  const cosEps = Math.cos(epsilon * DEG);

  const alpha = Math.atan2(cosEps * sinLam, cosLam) * RAD; // right ascension (deg)
  const delta = Math.asin(sinEps * sinLam); // declination (rad)

  // Greenwich Mean Sidereal Time
  const gmst = ((280.46061837 + 360.98564736629 * (jd - 2451545.0)) % 360 + 360) % 360;

  // Local hour angle
  const ha = ((gmst + lng - alpha) % 360 + 360) % 360;
  const haRad = ha * DEG;
  const latRad = lat * DEG;

  // Altitude
  const sinAlt = Math.sin(latRad) * Math.sin(delta) + Math.cos(latRad) * Math.cos(delta) * Math.cos(haRad);
  const altitude = Math.asin(sinAlt);

  // Azimuth (measured clockwise from north)
  const cosAlt = Math.cos(altitude);
  let azimuth;
  if (Math.abs(cosAlt) < 1e-10) {
    azimuth = 0;
  } else {
    const sinAz = -Math.cos(delta) * Math.sin(haRad) / cosAlt;
    const cosAz = (Math.sin(delta) - Math.sin(latRad) * sinAlt) / (Math.cos(latRad) * cosAlt);
    azimuth = Math.atan2(sinAz, cosAz);
    if (azimuth < 0) azimuth += 2 * Math.PI;
  }

  return { altitude, azimuth };
}

/**
 * Get sunrise and sunset hours (UTC) for a given lat/lng and date.
 * Returns approximate times by scanning in 15-minute increments.
 * @returns {{ sunrise: number, sunset: number }} hours in UTC (0-24)
 */
export function getSunriseSunset(lat, lng, date) {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();

  let sunrise = 6, sunset = 18; // fallbacks
  let foundRise = false, foundSet = false;

  for (let h = 0; h < 24; h += 0.25) {
    const d = new Date(Date.UTC(year, month, day, Math.floor(h), (h % 1) * 60));
    const pos = getSunPosition(lat, lng, d);
    if (!foundRise && pos.altitude > 0) { sunrise = h; foundRise = true; }
    if (foundRise && !foundSet && pos.altitude < 0 && h > 12) { sunset = h; foundSet = true; }
  }

  return { sunrise, sunset };
}

/**
 * Get sun direction as a 3D unit vector (for shadow casting).
 * Coordinates: x = east, y = up, z = south (Three.js convention with y-up).
 * @param {number} altitude - Sun altitude in radians
 * @param {number} azimuth  - Sun azimuth in radians (clockwise from north)
 * @param {number} northAngleDeg - Rotation of north from screen-up (degrees clockwise)
 * @returns {{ x: number, y: number, z: number }}
 */
export function sunDirection(altitude, azimuth, northAngleDeg = 0) {
  // Adjust azimuth by north rotation
  const az = azimuth - northAngleDeg * DEG;
  const cosAlt = Math.cos(altitude);

  return {
    x: -cosAlt * Math.sin(az),  // east component
    y: Math.sin(altitude),       // up component
    z: -cosAlt * Math.cos(az),   // south component (toward screen-down in 2D)
  };
}
