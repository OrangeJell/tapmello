(() => {
  const key = 'tapmelo.theme';
  const root = document.documentElement;
  const system = matchMedia('(prefers-color-scheme: dark)');
  const themeColor = document.querySelector('meta[name="theme-color"]');
  const currentTheme = () => root.dataset.theme || (system.matches ? 'dark' : 'light');
  const syncThemeColor = () => {
    themeColor.content = currentTheme() === 'dark' ? '#211e2c' : '#f8f7f2';
  };

  // Apply a saved choice before styles load so the first paint uses the right palette.
  try {
    const saved = localStorage.getItem(key);
    if (saved === 'light' || saved === 'dark') root.dataset.theme = saved;
  } catch {
    // System settings still work when storage is unavailable.
  }
  syncThemeColor();

  document.addEventListener('DOMContentLoaded', () => {
    const toggle = document.querySelector('.theme-toggle');
    const icons = toggle.querySelectorAll('[data-theme-icon]');
    const nextTheme = () => currentTheme() === 'dark' ? 'light' : 'dark';

    function updateToggle() {
      const next = nextTheme();
      const label = next === 'light' ? toggle.dataset.lightLabel : toggle.dataset.darkLabel;
      toggle.setAttribute('aria-label', label);
      toggle.title = label;
      for (const icon of icons) icon.toggleAttribute('hidden', icon.dataset.themeIcon !== next);
      syncThemeColor();
    }

    toggle.addEventListener('click', () => {
      root.dataset.theme = nextTheme();
      try {
        localStorage.setItem(key, root.dataset.theme);
      } catch {
        // The current page can still switch themes.
      }
      updateToggle();
    });

    system.addEventListener('change', updateToggle);
    updateToggle();
    toggle.hidden = false;
  });
})();
