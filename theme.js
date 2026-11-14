/* BriefDrop – shared appearance preference */
(() => {
  'use strict';
  const root = document.documentElement;
  const meta = document.querySelector('meta[name="theme-color"]');

  function applyTheme() {
    let appearance = true;
    try {
      const settings = JSON.parse(localStorage.getItem('briefdrop.settings') || '{}');
      if (typeof settings.appearance === 'boolean') appearance = settings.appearance;
    } catch (_) {}
    root.dataset.theme = appearance ? 'dark' : 'light';
    if (meta) meta.content = appearance ? '#0a0a0a' : '#f6f4ee';
  }

  applyTheme();
  addEventListener('storage', (e) => {
    if (e.key === 'briefdrop.settings' || e.key === null) applyTheme();
  });
})();
