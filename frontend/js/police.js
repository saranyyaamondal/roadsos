// ─── police.js ────────────────────────────────────────────────
import { initMap, addDestinationMarker, fitMapBounds } from './map.js';

const BACKEND_URL = window.BACKEND_URL ?? 'https://suraksharoad.onrender.com';
const ORS_API_KEY = window.ORS_API_KEY ?? '';

// ─── GPS ──────────────────────────────────────────────────────
function getCoords() {
  return new Promise((resolve, reject) => {
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
function buildCard(p, eta) {
  const etaText = eta !== null ? `${eta} min drive` : 'ETA unavailable';
  const mapsUrl = `https://maps.google.com/?daddr=${p.lat},${p.lon}`;
  const jxTag   = p.jurisdiction
    ? `<span class="tag tag--jurisdiction">${p.jurisdiction}</span>`
    : '';

  return `
    <div class="card" data-lat="${p.lat}" data-lon="${p.lon}">
      <div class="card-header">
        <div class="card-name">${p.name}</div>
        <span class="distance-badge">${p.distance.toFixed(1)} km</span>
      </div>
      <div class="card-tags">${jxTag}</div>
      <div class="card-info">
        <span>🕐 ${etaText}</span>
        ${p.address ? `<span>📍 ${p.address}</span>` : ''}
      </div>
      <div class="card-actions">
        ${p.phone ? `<a class="btn btn-call" href="tel:${p.phone}">📞 Call Now</a>` : ''}
        <a class="btn btn-nav" href="${mapsUrl}" target="_blank">🗺️ Take Me There</a>
      </div>
    </div>`;
}

// ─── Main ──────────────────────────────────────────────────────
async function main() {
  const statusEl = document.getElementById('status');
  const listEl   = document.getElementById('cards-list');

  let coords;
  try {
    coords = await getCoords();
  } catch {
    statusEl.innerHTML = '';
    listEl.innerHTML = `<div class="error-box">❌ Location access denied. Please allow location and reload.</div>`;
    return;
  }

  const { lat, lon } = coords;

  initMap('map', lat, lon, { userColor: '#1a1a2e' });
  statusEl.innerHTML = '<span class="spinner"></span> Finding nearby police stations…';

  let stations;
  try {
    const r   = await fetch(`${BACKEND_URL}/api/nearby?type=police&lat=${lat}&lon=${lon}`);
    stations  = await r.json();
  } catch {
    statusEl.innerHTML = '';
    listEl.innerHTML = `<div class="error-box">❌ Could not reach the server.</div>`;
    return;
  }

  statusEl.innerHTML = '';

  if (!stations.length) {
    listEl.innerHTML = '<div class="error-box">No police stations found within 15 km.</div>';
    return;
  }

  for (const s of stations) {
    const eta = await getETA(lat, lon, s.lat, s.lon);
    addDestinationMarker(s.lat, s.lon, s.name, s.distance, eta, { color: '#2c3e8c' });
    listEl.innerHTML += buildCard(s, eta);
  }
  fitMapBounds();
}

main();
