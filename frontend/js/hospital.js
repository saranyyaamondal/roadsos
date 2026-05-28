// ─── hospital.js ──────────────────────────────────────────────
import { initMap, addDestinationMarker, fitMapBounds } from './map.js';

const BACKEND_URL = window.BACKEND_URL ?? 'http://localhost:3000';
const ORS_API_KEY = window.ORS_API_KEY ?? '';  // set via <script> before this module

// ─── GPS ──────────────────────────────────────────────────────
function getCoords() {
  return new Promise((resolve, reject) => {
    // Prefer live GPS; fall back to localStorage
    const storedLat = localStorage.getItem('lat');
    const storedLon = localStorage.getItem('lon');

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        p => resolve({ lat: p.coords.latitude, lon: p.coords.longitude }),
        () => {
          if (storedLat && storedLon) {
            resolve({ lat: parseFloat(storedLat), lon: parseFloat(storedLon) });
          } else {
            reject(new Error('Location unavailable'));
          }
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else if (storedLat && storedLon) {
      resolve({ lat: parseFloat(storedLat), lon: parseFloat(storedLon) });
    } else {
      reject(new Error('Geolocation not supported'));
    }
  });
}

// ─── ETA via OpenRouteService ──────────────────────────────────
async function getETA(userLat, userLon, destLat, destLon) {
  if (!ORS_API_KEY) return null;
  try {
    const url =
      `https://api.openrouteservice.org/v2/directions/driving-car` +
      `?api_key=${ORS_API_KEY}&start=${userLon},${userLat}&end=${destLon},${destLat}`;
    const r    = await fetch(url);
    const data = await r.json();
    const secs = data.features[0].properties.segments[0].duration;
    return Math.round(secs / 60);
  } catch {
    return null;
  }
}

// ─── Card HTML ─────────────────────────────────────────────────
function buildCard(h, eta) {
  const etaText = eta !== null ? `${eta} min drive` : 'ETA unavailable';
  const mapsUrl = `https://maps.google.com/?daddr=${h.lat},${h.lon}`;
  const typeTag = h.type
    ? `<span class="tag tag--${h.type.toLowerCase()}">${h.type}</span>`
    : '';
  const traumaTag = h.trauma
    ? `<span class="tag tag--trauma">🚨 Trauma Ready</span>`
    : '';

  return `
    <div class="card" data-lat="${h.lat}" data-lon="${h.lon}">
      <div class="card-header">
        <div class="card-name">${h.name}</div>
        <span class="distance-badge">${h.distance.toFixed(1)} km</span>
      </div>
      <div class="card-tags">${typeTag}${traumaTag}</div>
      <div class="card-info">
        <span>🕐 ${etaText}</span>
        ${h.address ? `<span>📍 ${h.address}</span>` : ''}
      </div>
      <div class="card-actions">
        ${h.phone ? `<a class="btn btn-call" href="tel:${h.phone}">📞 Call Now</a>` : ''}
        <a class="btn btn-nav" href="${mapsUrl}" target="_blank">🗺️ Take Me There</a>
      </div>
    </div>`;
}

// ─── AI Triage ─────────────────────────────────────────────────
async function loadAITriage(hospitals) {
  const el = document.getElementById('ai-text');
  try {
    const r = await fetch(`${BACKEND_URL}/api/triage`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hospitals, injuryType: 'general emergency' })
    });
    const data = await r.json();
    el.textContent = data.reasoning ?? 'No AI response.';
  } catch {
    el.textContent = 'AI triage unavailable right now.';
  }
}

// ─── Main ──────────────────────────────────────────────────────
async function main() {
  const statusEl = document.getElementById('status');
  const listEl   = document.getElementById('cards-list');

  // 1. Get coordinates
  let coords;
  try {
    coords = await getCoords();
  } catch {
    statusEl.innerHTML = '';
    listEl.innerHTML = `<div class="error-box">❌ Location access denied. Please allow location and reload.</div>`;
    return;
  }

  const { lat, lon } = coords;

  // 2. Map
  initMap('map', lat, lon, { userColor: '#c0392b' });
  statusEl.innerHTML = '<span class="spinner"></span> Finding nearby hospitals…';

  // 3. Fetch nearby hospitals
  let hospitals;
  try {
    const r  = await fetch(`${BACKEND_URL}/api/nearby?type=hospital&lat=${lat}&lon=${lon}`);
    hospitals = await r.json();
  } catch {
    statusEl.innerHTML = '';
    listEl.innerHTML = `<div class="error-box">❌ Could not reach the server.</div>`;
    return;
  }

  statusEl.innerHTML = '';

  if (!hospitals.length) {
    listEl.innerHTML = '<div class="error-box">No hospitals found within 15 km.</div>';
    return;
  }

  // 4. Cards + ETAs + map markers
  for (const h of hospitals) {
    const eta = await getETA(lat, lon, h.lat, h.lon);
    addDestinationMarker(h.lat, h.lon, h.name, h.distance, eta, { color: '#2980b9' });
    listEl.innerHTML += buildCard(h, eta);
  }
  fitMapBounds();

  // 5. AI Triage (non-blocking)
  loadAITriage(hospitals);
}

main();
