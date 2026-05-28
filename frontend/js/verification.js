// ═══════════════════════════════════════════
// verification.js — bystander photo verify
// Calls /api/photo-verify (Claude Vision)
// ═══════════════════════════════════════════

import { getStoredLocation } from './gps.js';
import { CONFIG } from './config.js';

// DOM
const uploadBtn      = document.getElementById('uploadBtn');
const photoInput     = document.getElementById('photoInput');
const loadingEl      = document.getElementById('loading');
const messageEl      = document.getElementById('message');
const timerSection   = document.getElementById('timerSection');
const countdownEl    = document.getElementById('countdown');
const cancelBtn      = document.getElementById('cancelBtn');
const video          = document.getElementById('video');
const canvas         = document.getElementById('canvas');
const previewImage   = document.getElementById('previewImage');
const startCameraBtn = document.getElementById('startCameraBtn');
const captureBtn     = document.getElementById('captureBtn');

let capturedBase64 = null;
let cameraStream   = null;
let countdownTimer = null;

// ── Camera ────────────────────────────────────────
startCameraBtn?.addEventListener('click', async () => {
  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' }, audio: false
    });
    if (video) {
      video.srcObject = cameraStream;
      video.style.display = 'block';
      video.play();
    }
  } catch {
    alert('Camera permission denied. Please use file upload instead.');
  }
});

captureBtn?.addEventListener('click', () => {
  if (!video?.srcObject) { alert('Open camera first.'); return; }
  const ctx = canvas.getContext('2d');
  canvas.width  = video.videoWidth;
  canvas.height = video.videoHeight;
  ctx.drawImage(video, 0, 0);
  capturedBase64 = canvas.toDataURL('image/jpeg', 0.8);
  if (previewImage) {
    previewImage.src = capturedBase64;
    previewImage.classList.remove('hidden');
  }
  video.style.display = 'none';
  cameraStream?.getTracks().forEach(t => t.stop());
});

// ── Base64 helper ─────────────────────────────────
function toBase64(file) {
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload  = () => res(reader.result);
    reader.onerror = rej;
  });
}

function setMessage(text, color) {
  if (messageEl) { messageEl.textContent = text; messageEl.style.color = color; }
}
function setLoading(text) {
  if (loadingEl) loadingEl.textContent = text;
}

// ── Verify ────────────────────────────────────────
uploadBtn?.addEventListener('click', async () => {
  setLoading('🔄 Sending to AI for verification…');
  setMessage('', '#333');

  let imageData = null;
  if (capturedBase64) {
    imageData = capturedBase64;
  } else if (photoInput?.files?.length > 0) {
    imageData = await toBase64(photoInput.files[0]);
  } else {
    alert('Please capture or upload a photo first.');
    setLoading('');
    return;
  }

  const loc = getStoredLocation();

  try {
    const res = await fetch(CONFIG.API_BASE + '/api/photo-verify', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image:     imageData,
        lat:       loc.lat,
        lon:       loc.lon,
        timestamp: new Date().toISOString()
      })
    });

    const data = await res.json();
    setLoading('');

    if (data.verified === true) {
      setMessage('✅ Accident confirmed by AI — alert fires in:', '#2E7D32');
      startCountdown();
    } else {
      setMessage('❌ ' + (data.reason || 'Photo does not show a road accident. Please take a clearer photo.'), '#C62828');
      capturedBase64 = null;
      if (photoInput) photoInput.value = '';
    }

  } catch (err) {
    setLoading('');
    setMessage('⚠️ Server unreachable. Check your connection.', '#E65100');
    console.error('Verify error:', err);
  }
});

// ── Countdown — no scrolling ──────────────────────
function startCountdown() {
  if (timerSection) timerSection.classList.remove('hidden');
  let secs = 30;
  if (countdownEl) countdownEl.textContent = secs;

  countdownTimer = setInterval(() => {
    secs--;
    if (countdownEl) countdownEl.textContent = secs;
    if (secs <= 0) {
      clearInterval(countdownTimer);
      const dest = localStorage.getItem('verify_dest') || 'emergency.html';
      localStorage.removeItem('verify_dest');
      window.location.href = dest;
    }
  }, 1000);
}

// ── Cancel ────────────────────────────────────────
cancelBtn?.addEventListener('click', () => {
  clearInterval(countdownTimer);
  localStorage.removeItem('verify_dest');
  window.location.href = 'index.html';
});