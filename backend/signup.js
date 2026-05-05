function saveStep1() {
  const name     = document.getElementById('input-name').value.trim();
  const age      = document.getElementById('input-age').value.trim();
  const gender   = document.getElementById('input-gender').value;
  const phone    = document.getElementById('input-phone').value.trim();
  const address  = document.getElementById('input-address').value.trim();
  const ecName   = document.getElementById('input-ec-name').value.trim();
  const ecRel    = document.getElementById('input-ec-rel').value.trim();
  const ecPhone  = document.getElementById('input-ec-phone').value.trim();
  if (!name || !age || !phone || !ecName || !ecPhone) {
    alert('Please fill in all required fields before continuing.');
    return;
  }
  localStorage.setItem('sr_name',     name);
  localStorage.setItem('sr_age',      age);
  localStorage.setItem('sr_gender',   gender);
  localStorage.setItem('sr_phone',    phone);
  localStorage.setItem('sr_address',  address);
  localStorage.setItem('sr_ec_name',  ecName);
  localStorage.setItem('sr_ec_rel',   ecRel);
  localStorage.setItem('sr_ec_phone', ecPhone);

  showStep(2);
}
function saveStep2() {
  const bloodGroup  = document.querySelector('.blood-chip.selected')?.dataset.value || '';
  const allergies   = document.getElementById('input-allergies').value.trim();
  const conditions  = document.getElementById('input-conditions').value.trim();
  const medications = document.getElementById('input-medications').value.trim();
  const surgeries   = document.getElementById('input-surgeries').value.trim();

  if (!bloodGroup) {
    alert('Please select your blood group.');
    return;
  }

  localStorage.setItem('sr_blood',       bloodGroup);
  localStorage.setItem('sr_allergies',   allergies);
  localStorage.setItem('sr_conditions',  conditions);
  localStorage.setItem('sr_medications', medications);
  localStorage.setItem('sr_surgeries',   surgeries);

  showStep(3);
}

function saveStep3() {
  const insuranceProvider = document.getElementById('input-insurance').value.trim();
  const policyNumber      = document.getElementById('input-policy').value.trim();

  localStorage.setItem('sr_insurance', insuranceProvider);
  localStorage.setItem('sr_policy',    policyNumber);

  
  localStorage.setItem('sr_signup_done', 'true');

  
  window.location.href = 'home.html';
}




function setupBloodChips() {
  const chips = document.querySelectorAll('.blood-chip');
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
     
      chips.forEach(c => c.classList.remove('selected'));
      
      chip.classList.add('selected');
    });
  });
}




function showStep(stepNumber) {

  document.querySelectorAll('.step-section').forEach(section => {
    section.style.display = 'none';
  });

  
  document.getElementById('step-' + stepNumber).style.display = 'block';


  document.querySelectorAll('.step-dot').forEach((dot, index) => {
    if (index < stepNumber) {
      dot.style.background = '#C62828'; 
    } else {
      dot.style.background = '#e0e0e0'; 
    }
  });

  window.scrollTo(0, 0);
}


function checkIfSignedUp() {
  if (localStorage.getItem('sr_signup_done') === 'true') {
    window.location.href = 'home.html';
  }
}


window.addEventListener('load', () => {
  checkIfSignedUp();
  showStep(1);
  setupBloodChips();
});