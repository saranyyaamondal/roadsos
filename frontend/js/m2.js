// ═══════════════════════════════════════════
// m2.js — Medical card + offline cache
// Requires profile-bridge.js to run first
// ═══════════════════════════════════════════

function loadProfile() {
  try {
    const raw = localStorage.getItem('surakshaProfile');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

// ── Populate medical card strip on home screen ──
function populateMedicalCard() {
  const p = loadProfile();
  if (!p) return;

  // Home strip
  const stripName = document.getElementById('user-name');
  if (stripName) stripName.textContent = p.name || 'User';

  const blood = document.getElementById('user-blood');
  if (blood) blood.textContent = p.bloodGroup || '—';

  const allergy = document.getElementById('user-allergy');
  if (allergy) allergy.textContent = (p.allergy || 'None').substring(0, 12);

  const cond = document.getElementById('user-condition');
  if (cond) cond.textContent = (p.condition || 'None').substring(0, 12);

  // Initials avatar
  const avatar = document.getElementById('mc-initials');
  if (avatar && p.name) {
    avatar.textContent = p.name.trim().split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
  }
}

// ── WhatsApp share ──────────────────────────────
window.shareViaWhatsApp = function () {
  const p = loadProfile();
  const lat = localStorage.getItem('lat');
  const lon = localStorage.getItem('lon');
  const mapsLink = lat && lon ? `https://maps.google.com/?q=${lat},${lon}` : 'Location unavailable';

  const msg = p
    ? `🚨 *MEDICAL CARD — SurakshaRoad*\n\n` +
      `*Patient:* ${p.name || 'Unknown'}\n` +
      `*Blood:* ${p.bloodGroup || '—'}\n` +
      `*Allergy:* ${p.allergy || 'None'}\n` +
      `*Condition:* ${p.condition || 'None'}\n` +
      `*Medication:* ${p.medication || 'None'}\n` +
      `*Emergency Contact:* ${p.ecName || 'Not set'}${p.ecPhone ? ' — ' + p.ecPhone : ''}\n` +
      `*Insurance:* ${p.insurer || 'Not provided'}${p.policyNo ? ' / ' + p.policyNo : ''}\n` +
      `*Location:* ${mapsLink}`
    : '🚨 *MEDICAL CARD — SurakshaRoad*\n\nNo profile saved yet.';

  window.open('https://wa.me/?text=' + encodeURIComponent(msg), '_blank');
};

// ── IndexedDB offline cache ─────────────────────
const DB_NAME  = 'SurakshaRoadDB';
const DB_STORE = 'nearbyCache';

function openDB() {
  return new Promise((res, rej) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = e => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(DB_STORE)) {
        db.createObjectStore(DB_STORE, { keyPath: 'key' });
      }
    };
    req.onsuccess = e => res(e.target.result);
    req.onerror   = e => rej(e.target.error);
  });
}

async function idbSet(key, value) {
  const db = await openDB();
  return new Promise((res, rej) => {
    const tx = db.transaction(DB_STORE, 'readwrite');
    tx.objectStore(DB_STORE).put({ key, value, savedAt: Date.now() });
    tx.oncomplete = res;
    tx.onerror    = e => rej(e.target.error);
  });
}

async function idbGet(key) {
  const db = await openDB();
  return new Promise((res, rej) => {
    const req = db.transaction(DB_STORE, 'readonly').objectStore(DB_STORE).get(key);
    req.onsuccess = e => res(e.target.result ? e.target.result.value : null);
    req.onerror   = e => rej(e.target.error);
  });
}

// ── First aid tab rendering ─────────────────────
let _firstAidData = null;

async function loadFirstAidData() {
  if (_firstAidData) return _firstAidData;
  try {
    const r = await fetch('data/firstaid.json');
    _firstAidData = await r.json();
    return _firstAidData;
  } catch { return null; }
}

async function renderFirstAidTab(category) {
  const data = await loadFirstAidData();
  if (!data || !data[category]) return;

  const container = document.getElementById('fa-' + category);
  if (!container) return;

  container.innerHTML = data[category].map((s, i) => `
    <div class="fa-step">
      <div class="step-num">${i + 1}</div>
      <div class="step-body">
        <strong>${s.title}</strong>
        ${s.detail ? `<p>${s.detail}</p>` : ''}
      </div>
    </div>`).join('');
}

// Override setFATab globally
window.setFATab = function (el, cat) {
  document.querySelectorAll('.fa-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  document.querySelectorAll('[id^="fa-"]').forEach(p => p.style.display = 'none');
  const panel = document.getElementById('fa-' + cat);
  if (panel) panel.style.display = 'block';
  renderFirstAidTab(cat);
};

// ── Init ────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  populateMedicalCard();

  // Wire WhatsApp button if on medical card page
  const waBtn = document.querySelector('.btn-whatsapp');
  if (waBtn) waBtn.addEventListener('click', window.shareViaWhatsApp);

  // Pre-render bleeding tab if on first aid page
  if (document.getElementById('fa-bleeding')) {
    renderFirstAidTab('bleeding');
  }
});