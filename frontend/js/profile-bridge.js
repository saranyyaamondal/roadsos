// ═══════════════════════════════════════════
// profile-bridge.js
// Converts M1's individual sr_* localStorage keys
// into M2's surakshaProfile JSON object
// Call this BEFORE m2.js on every page
// ═══════════════════════════════════════════

function bridgeProfileToM2() {
  if (localStorage.getItem('sr_signup_done') !== 'true') return;

  const profile = {
    name:       localStorage.getItem('sr_name')       || '',
    age:        localStorage.getItem('sr_age')        || '',
    gender:     localStorage.getItem('sr_gender')     || '',
    phone:      localStorage.getItem('sr_phone')      || '',
    address:    localStorage.getItem('sr_address')    || '',
    ecName:     localStorage.getItem('sr_ec_name')    || '',
    ecRelation: localStorage.getItem('sr_ec_rel')     || '',
    ecPhone:    localStorage.getItem('sr_ec_phone')   || '',
    language:   localStorage.getItem('sr_language')   || 'en',
    bloodGroup: localStorage.getItem('sr_blood')      || '',
    allergy:    localStorage.getItem('sr_allergies')  || 'None',
    condition:  localStorage.getItem('sr_conditions') || 'None',
    medication: localStorage.getItem('sr_medications')|| 'None',
    surgery:    localStorage.getItem('sr_surgeries')  || 'None',
    insurer:    localStorage.getItem('sr_insurance')  || 'Not provided',
    policyNo:   localStorage.getItem('sr_policy')     || 'Not provided'
  };

  localStorage.setItem('surakshaProfile', JSON.stringify(profile));
}

// Run immediately every time this file loads
bridgeProfileToM2();