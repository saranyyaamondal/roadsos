// ═══════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════
let currentMode = 'victim';
let bystanderVerified = false;
let pendingDest = null;
let gateTimer = null;

// ═══════════════════════════════════════════
// SCREEN NAV
// ═══════════════════════════════════════════
const screenMap = {
  home:'screen-home', profile:'screen-profile',
  police:'screen-police', hospital:'screen-hospital',
  emergency:'screen-emergency', medcard:'screen-medcard', firstaid:'screen-firstaid'
};

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(screenMap[id]).classList.add('active');
  const btn = document.querySelector(`.tab-btn[data-screen="${id}"]`);
  if (btn) btn.classList.add('active');
  window.scrollTo({top:0, behavior:'smooth'});
}

// For service screens: victim goes direct, bystander must verify first
function guardedNav(dest) {
  if (currentMode === 'victim') {
    renderServiceScreen(dest, 'victim');
    showScreen(dest);
  } else {
    if (bystanderVerified) {
      renderServiceScreen(dest, 'bystander');
      showScreen(dest);
    } else {
      openGate(dest);
    }
  }
}

// Show correct content panel within service screens
function renderServiceScreen(dest, mode) {
  const show = mode === 'victim' ? `${dest[0]}-v` : `${dest[0]}-b`;
  // police→p, hospital→h, emergency→e — use first letter shorthand
  const idMap = {police:['police-v','police-b'], hospital:['hospital-v','hospital-b'], emergency:['emergency-v','emergency-b']};
  if (!idMap[dest]) return;
  idMap[dest].forEach((id, i) => {
    document.getElementById(id).style.display = (mode === 'victim' ? i===0 : i===1) ? 'block' : 'none';
  });
}

// ═══════════════════════════════════════════
// MODE TOGGLE
// ═══════════════════════════════════════════
function setMode(mode) {
  currentMode = mode;
  bystanderVerified = false;
  document.getElementById('btn-victim').classList.toggle('active', mode==='victim');
  document.getElementById('btn-bystander').classList.toggle('active', mode==='bystander');
  document.getElementById('victim-panel').style.display    = mode==='victim'    ? 'block' : 'none';
  document.getElementById('bystander-panel').style.display = mode==='bystander' ? 'block' : 'none';
}

// ═══════════════════════════════════════════
// GATE (BYSTANDER VERIFICATION SHEET)
// ═══════════════════════════════════════════
function openGate(dest) {
  pendingDest = dest;
  resetGate();
  document.getElementById('gate-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeGate() {
  clearInterval(gateTimer);
  document.getElementById('gate-overlay').classList.remove('open');
  document.body.style.overflow = '';
}

function closeGateIfOutside(e) {
  if (e.target === document.getElementById('gate-overlay')) closeGate();
}

function resetGate() {
  clearInterval(gateTimer);
  document.getElementById('gate-file-input').value = '';
  document.getElementById('gate-photo-zone').style.display  = 'block';
  document.getElementById('gate-verifying').style.display   = 'none';
  document.getElementById('gate-confirmed').style.display   = 'none';
  document.getElementById('gate-countdown-box').style.display = 'none';
  document.getElementById('gate-cancel-btn').style.display  = 'none';
}

function triggerGateUpload() { document.getElementById('gate-file-input').click(); }

function gatePhotoSelected() {
  document.getElementById('gate-photo-zone').style.display = 'none';
  document.getElementById('gate-verifying').style.display  = 'flex';

  // Simulate AI verification (2.2s)
  setTimeout(() => {
    document.getElementById('gate-verifying').style.display    = 'none';
    document.getElementById('gate-confirmed').style.display    = 'flex';
    document.getElementById('gate-countdown-box').style.display = 'block';
    document.getElementById('gate-cancel-btn').style.display   = 'block';

    let secs = 30;
    document.getElementById('gate-countdown-num').textContent = secs;

    gateTimer = setInterval(() => {
      secs--;
      document.getElementById('gate-countdown-num').textContent = secs;
      if (secs <= 0) {
        clearInterval(gateTimer);
        bystanderVerified = true;
        closeGate();
        renderServiceScreen(pendingDest, 'bystander');
        showScreen(pendingDest);
      }
    }, 1000);
  }, 2200);
}

function cancelGateAlert() {
  clearInterval(gateTimer);
  bystanderVerified = false;
  resetGate();
}

// ═══════════════════════════════════════════
// PROFILE STEPS
// ═══════════════════════════════════════════
function profileStep(n) {
  [1,2,3].forEach(i => {
    document.getElementById(`profile-step-${i}`).style.display = i===n ? 'block' : 'none';
  });
  window.scrollTo({top:0, behavior:'smooth'});
}

// ═══════════════════════════════════════════
// CHIPS
// ═══════════════════════════════════════════
function selectChip(el) {
  el.closest('.chips').querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
}
document.querySelectorAll('.lang-chip').forEach(c => {
  c.addEventListener('click', () => {
    c.closest('.lang-chips').querySelectorAll('.lang-chip').forEach(x => x.classList.remove('active'));
    c.classList.add('active');
  });
});

// ═══════════════════════════════════════════
// CALL
// ═══════════════════════════════════════════
function fakeCall(num) {
  if (confirm(`Call ${num}?`)) window.location.href = `tel:${num.replace(/\s/g,'')}`;
}

// ═══════════════════════════════════════════
// FIRST AID TABS
// ═══════════════════════════════════════════
function setFATab(el, cat) {
  document.querySelectorAll('.fa-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  ['bleeding','fracture','unconscious'].forEach(c => {
    document.getElementById(`fa-${c}`).style.display = c===cat ? 'block' : 'none';
  });
}