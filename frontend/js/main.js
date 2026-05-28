// ═══════════════════════════════════════════
// main.js — home screen only
// Handles GPS, role toggle, emergency routing
// ═══════════════════════════════════════════

import { autoDetectLocation, startLiveTracking } from './gps.js';
import { CONFIG } from './config.js';

// Stop if not on home page
if (!document.getElementById('victimBtn')) {
  throw new Error('main.js: not home page');
}

// Auth guard
if (!CONFIG.requireAuth()) throw new Error('Not authenticated');

// ── DOM refs ──────────────────────────────────────
const victimBtn      = document.getElementById('victimBtn');
const bystanderBtn   = document.getElementById('bystanderBtn');
const statusText     = document.getElementById('gps-status');
const locText        = document.getElementById('loc-text');
const gpsManual      = document.getElementById('gpsManualInput');
const saveLocBtn     = document.getElementById('saveLocationBtn');
const bystanderNote  = document.getElementById('bystander-note');

// ── GPS on load ───────────────────────────────────
window.addEventListener('load', async () => {
  if (statusText) statusText.textContent = 'Detecting GPS…';

  const loc = await autoDetectLocation();

  if (loc.accuracy === 'fallback-india-center') {
    if (statusText) statusText.textContent = '⚠️ GPS denied — showing approximate location';
    if (gpsManual)  gpsManual.style.display = 'block';
  } else {
    if (statusText) statusText.textContent = `📍 ${loc.lat.toFixed(4)}, ${loc.lon.toFixed(4)}`;
    if (locText)    locText.textContent = `📍 GPS: ${loc.lat.toFixed(4)}, ${loc.lon.toFixed(4)}`;
    startLiveTracking();
  }
});

// ── Restore saved role ────────────────────────────
const savedRole = localStorage.getItem('role') || 'victim';
if (savedRole === 'bystander') {
  bystanderBtn?.classList.add('active');
  victimBtn?.classList.remove('active');
  bystanderNote?.classList.add('visible');
}

// ── Role toggle ───────────────────────────────────
victimBtn?.addEventListener('click', () => {
  localStorage.setItem('role', 'victim');
  victimBtn.classList.add('active');
  bystanderBtn?.classList.remove('active');
  if (bystanderNote) bystanderNote.classList.remove('visible');
});

bystanderBtn?.addEventListener('click', () => {
  localStorage.setItem('role', 'bystander');
  bystanderBtn.classList.add('active');
  victimBtn?.classList.remove('active');
  if (bystanderNote) bystanderNote.classList.add('visible');
});

// ── Manual GPS ────────────────────────────────────
saveLocBtn?.addEventListener('click', () => {
  const lat = document.getElementById('manualLat')?.value;
  const lon = document.getElementById('manualLon')?.value;
  if (!lat || !lon) return;
  localStorage.setItem('lat', lat);
  localStorage.setItem('lon', lon);
  if (statusText) statusText.textContent = `📍 Manual: ${parseFloat(lat).toFixed(4)}, ${parseFloat(lon).toFixed(4)}`;
  if (gpsManual)  gpsManual.style.display = 'none';
});

// ── Emergency button routing ──────────────────────
// Victim   → go directly to service page
// Bystander → verify photo first, then go to service
document.querySelectorAll('.emergencyBtn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const dest = btn.dataset.dest || 'emergency.html';
    const role = localStorage.getItem('role') || 'victim';

    if (role === 'bystander') {
      localStorage.setItem('verify_dest', dest);
      window.location.href = 'verification.html';
    } else {
      window.location.href = dest;
    }
  });
});