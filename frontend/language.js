// ============================================
// LANGUAGE SWITCHER
// ============================================

// Step 1 — Load the i18n.json file and apply
// the saved language to every text label on screen

async function applyLanguage() {
  // Get whichever language the user picked
  // Default to English if nothing saved yet
  const lang = localStorage.getItem('sr_language') || 'en';

  // Fetch the translations file
  const response = await fetch('js/i18n.json');
  const i18n     = await response.json();
  const t        = i18n[lang];

  // Find every element that has a data-i18n attribute
  // and replace its text with the translation
  document.querySelectorAll('[data-i18n]').forEach(element => {
    const key = element.getAttribute('data-i18n');
    if (t[key]) {
      element.innerText = t[key];
    }
  });

  // Also update placeholders on input fields
  document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
    const key = element.getAttribute('data-i18n-placeholder');
    if (t[key]) {
      element.placeholder = t[key];
    }
  });
}


// Step 2 — When user clicks a language chip,
// save their choice and refresh the text

function selectLanguage(langCode) {
  localStorage.setItem('sr_language', langCode);

  // Highlight the selected language chip
  document.querySelectorAll('.lang-chip').forEach(chip => {
    chip.classList.remove('selected');
  });
  const selected = document.querySelector(`.lang-chip[data-lang="${langCode}"]`);
  if (selected) selected.classList.add('selected');

  // Re-apply translations immediately
  applyLanguage();
}


// Step 3 — Run on every page load
window.addEventListener('load', applyLanguage);