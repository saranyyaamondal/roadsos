// language.js — runs on every page load, applies saved language
const SUPPORTED = ['en','hi','ta','te','bn','kn','ml','mr'];

async function applyLanguage() {
  const lang = localStorage.getItem('sr_language') || 'en';
  if (lang === 'en') return; // English is default — no translation needed

  try {
    const res  = await fetch('data/i18n.json');
    const i18n = await res.json();
    const translations = i18n[lang];
    if (!translations) return;

    // Replace every element that has a data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (translations[key]) el.textContent = translations[key];
    });
  } catch (e) {
    console.warn('Language file not found:', e);
  }
}

// Run on every page
document.addEventListener('DOMContentLoaded', applyLanguage);