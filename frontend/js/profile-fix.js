// profile-fix.js
// Add this as a <script> tag at the bottom of signup.html
// OR call fixPhoneNumbers() once after signup completes

function fixPhoneNumbers() {
  const key = 'sr_ec_phone';
  let phone = localStorage.getItem(key) || '';

  // Strip all spaces
  phone = phone.replace(/\s/g, '');

  // Already correct
  if (phone.startsWith('+91') && phone.length === 13) return;

  // Has 0091 prefix
  if (phone.startsWith('0091')) phone = '+91' + phone.slice(4);
  // Has leading 0
  else if (phone.startsWith('0') && phone.length === 11) phone = '+91' + phone.slice(1);
  // Bare 10 digits
  else if (/^\d{10}$/.test(phone)) phone = '+91' + phone;
  // Has + but not +91
  else if (phone.startsWith('+') && !phone.startsWith('+91')) {
    // leave as-is (international number)
  }

  if (phone) localStorage.setItem(key, phone);
}

// Run immediately on load — fixes any already-saved wrong number
fixPhoneNumbers();