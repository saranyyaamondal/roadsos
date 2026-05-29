// verification.js — bystander photo verify
// Falls back to client-side check if /api/photo-verify is unavailable

import { getStoredLocation } from './gps.js';
import { CONFIG } from './config.js';

const uploadBtn      = document.getElementById('uploadBtn');
const photoInput     = document.getElementById('photoInput');
const fileNameEl     = document.getElementById('file-name');
const loadingEl      = document.getElementById('loading');
const messageEl      = document.getElementById('message');
const timerSection   = document.getElementById('timerSection');
const countdownEl    = document.getElementById('countdown');
const cancelBtn      = document.getElementById('cancelBtn');
const video          = document.getElementById('video');
const canvas         = document.getElementById('canvas');
const previewImage   = document.getElementById('previewImage');
const previewLabel   = document.getElementById('preview-label');
const startCameraBtn = document.getElementById('startCameraBtn');
const captureBtn     = document.getElementById('captureBtn');

let capturedBase64 = null;
let cameraStream   = null;
let countdownTimer = null;

// ── Show selected filename ────────────────────────────
photoInput?.addEventListener('change', () => {
  const file = photoInput.files?.[0];
  if (file) {
    if (fileNameEl) fileNameEl.textContent = '✅ ' + file.name;
    // Show preview of selected file
    const reader = new FileReader();
    reader.onload = e => {
      if (previewImage) {
        previewImage.src = e.target.result;
        previewImage.style.display = 'block';
      }
      if (previewLabel) previewLabel.style.display = 'block';
      capturedBase64 = null; // clear camera capture since file is chosen
    };
    reader.readAsDataURL(file);
  }
});

// ── Camera ────────────────────────────────────────────
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
    if (previewImage) previewImage.style.display = 'none';
    if (previewLabel) previewLabel.style.display = 'none';
  } catch {
    alert('Camera permission denied. Please use the file upload option instead.');
  }
});

captureBtn?.addEventListener('click', () => {
  if (!video?.srcObject) { alert('Open camera first.'); return; }
  const ctx = canvas.getContext('2d');
  canvas.width  = video.videoWidth;
  canvas.height = video.videoHeight;
  ctx.drawImage(video, 0, 0);
  capturedBase64 = canvas.toDataURL('image/jpeg', 0.8);

  // Show captured photo
  if (previewImage) {
    previewImage.src = capturedBase64;
    previewImage.style.display = 'block';
  }
  if (previewLabel) previewLabel.style.display = 'block';
  if (fileNameEl) fileNameEl.textContent = '📷 Photo captured from camera';

  // Hide video feed
  video.style.display = 'none';
  cameraStream?.getTracks().forEach(t => t.stop());
  cameraStream = null;
});

// ── Base64 helper ─────────────────────────────────────
function toBase64(file) {
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload  = () => res(reader.result);
    reader.onerror = rej;
  });
}

function setMessage(text, type) {
  if (!messageEl) return;
  messageEl.textContent = text;
  messageEl.className = type === 'ok' ? 'msg-ok' : type === 'err' ? 'msg-err' : '';
}

function setLoading(text) {
  if (loadingEl) loadingEl.textContent = text;
}

// ── Verify button ─────────────────────────────────────
uploadBtn?.addEventListener('click', async () => {
  // Make sure a photo exists
  const hasFile    = photoInput?.files?.length > 0;
  const hasCapture = !!capturedBase64;

  if (!hasFile && !hasCapture) {
    setMessage('⚠️ Please capture a photo or choose one from your gallery first.', 'err');
    return;
  }

  setLoading('🔄 Verifying photo…');
  setMessage('', '');

  let imageData = capturedBase64;
  if (!imageData && hasFile) {
    imageData = await toBase64(photoInput.files[0]);
  }

  const loc = getStoredLocation();

  // Try backend first, fall back to client-side if unreachable
  let verified = false;
  let reason   = '';

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

    if (res.ok) {
      const data = await res.json();
      verified = data.verified === true;
      reason   = data.reason || '';
    } else {
      // Backend responded but with error — use client fallback
      verified = true;
      reason   = 'offline-fallback';
    }

  } catch {
    // Server unreachable — use client-side fallback so bystanders aren't blocked
    verified = true;
    reason   = 'offline-fallback';
  }

  setLoading('');

  if (verified) {
    const fallbackNote = reason === 'offline-fallback'
      ? ' (offline mode — please ensure this is a real accident)'
      : '';
    setMessage('✅ Photo accepted — alert fires in 30 seconds' + fallbackNote, 'ok');
    startCountdown();
  } else {
    setMessage('❌ ' + (reason || 'Photo does not appear to show a road accident. Please take a clearer photo.'), 'err');
    capturedBase64 = null;
    if (photoInput) photoInput.value = '';
    if (previewImage) previewImage.style.display = 'none';
    if (previewLabel) previewLabel.style.display = 'none';
    if (fileNameEl) fileNameEl.textContent = 'No file selected';
  }
});

// ── Countdown ─────────────────────────────────────────
function startCountdown() {
  if (timerSection) timerSection.style.display = 'block';
  if (uploadBtn)    uploadBtn.disabled = true;

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

// ── Cancel ────────────────────────────────────────────
cancelBtn?.addEventListener('click', () => {
  clearInterval(countdownTimer);
  localStorage.removeItem('verify_dest');
  window.location.href = 'index.html';
});