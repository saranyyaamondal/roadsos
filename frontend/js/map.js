// ─── map.js — shared Leaflet map helpers ──────────────────────

let map = null;

/**
 * Initialise a Leaflet map centred on the user's position.
 * @param {string} containerId  - id of the <div> to mount the map into
 * @param {number} lat
 * @param {number} lon
 * @param {object} opts         - optional: { userColor, zoom }
 * @returns {L.Map}
 */
export function initMap(containerId, lat, lon, opts = {}) {
  const { userColor = '#c0392b', zoom = 13 } = opts;

  map = L.map(containerId).setView([lat, lon], zoom);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 18
  }).addTo(map);

  // User marker
  const userIcon = L.divIcon({
    className: '',
    html: `<div style="
      width:16px;height:16px;
      background:${userColor};
      border:3px solid white;
      border-radius:50%;
      box-shadow:0 2px 8px rgba(0,0,0,0.45);
    "></div>`,
    iconAnchor: [8, 8]
  });

  L.marker([lat, lon], { icon: userIcon })
    .addTo(map)
    .bindPopup('<b>📍 You are here</b>');

  return map;
}

/**
 * Add a destination marker to the existing map instance.
 * @param {number} lat
 * @param {number} lon
 * @param {string} name
 * @param {number} distance  - km
 * @param {number|null} eta  - minutes, or null
 * @param {object} opts      - optional: { color }
 */
export function addDestinationMarker(lat, lon, name, distance, eta = null, opts = {}) {
  if (!map) throw new Error('initMap() must be called before addDestinationMarker()');

  const { color = '#2980b9' } = opts;

  const icon = L.divIcon({
    className: '',
    html: `<div style="
      width:14px;height:14px;
      background:${color};
      border:3px solid white;
      border-radius:50%;
      box-shadow:0 2px 6px rgba(0,0,0,0.35);
    "></div>`,
    iconAnchor: [7, 7]
  });

  const etaLine = eta !== null ? `<br>🕐 ${eta} min drive` : '';
  const popup   = `<b>${name}</b><br>📏 ${distance.toFixed(1)} km${etaLine}`;

  L.marker([lat, lon], { icon }).addTo(map).bindPopup(popup);
}

/**
 * Fit the map bounds to include all markers (call after adding all markers).
 */
export function fitMapBounds() {
  if (!map) return;
  const bounds = [];
  map.eachLayer(layer => {
    if (layer instanceof L.Marker) bounds.push(layer.getLatLng());
  });
  if (bounds.length > 1) map.fitBounds(bounds, { padding: [40, 40] });
}
