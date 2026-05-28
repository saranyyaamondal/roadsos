// ═══════════════════════════════════════════
// gps.js — GPS detection + localStorage cache
// ═══════════════════════════════════════════

export async function autoDetectLocation() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      // No GPS support — use fallback
      _saveFallback();
      resolve(getFallback());
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = {
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          accuracy: pos.coords.accuracy
        };
        localStorage.setItem('lat',      loc.lat);
        localStorage.setItem('lon',      loc.lon);
        localStorage.setItem('accuracy', loc.accuracy);
        resolve(loc);
      },
      () => {
        // GPS denied or failed — use cached or fallback
        const cached = getStoredLocation();
        if (cached.lat && cached.lon) {
          resolve(cached);
        } else {
          _saveFallback();
          resolve(getFallback());
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  });
}

export function startLiveTracking() {
  if (!navigator.geolocation) return;
  navigator.geolocation.watchPosition(
    (pos) => {
      localStorage.setItem('lat', pos.coords.latitude);
      localStorage.setItem('lon', pos.coords.longitude);
    },
    () => {},
    { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
  );
}

export function getStoredLocation() {
  const lat = parseFloat(localStorage.getItem('lat'));
  const lon = parseFloat(localStorage.getItem('lon'));
  return {
    lat: isNaN(lat) ? null : lat,
    lon: isNaN(lon) ? null : lon,
    accuracy: localStorage.getItem('accuracy') || 'unknown'
  };
}

function getFallback() {
  return { lat: 20.5937, lon: 78.9629, accuracy: 'fallback-india-center' };
}

function _saveFallback() {
  const f = getFallback();
  localStorage.setItem('lat', f.lat);
  localStorage.setItem('lon', f.lon);
}