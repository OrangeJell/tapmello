// Shared by site pages and the game. Embedded games use a same-origin proxy;
// the top-level document owns browser installation and the guidance dialog.
(() => {
  if (window.tapmeloReturnVisit) return;
  const KEY = 'tapmelo.returnVisit.v1';
  const COOLDOWN_MS = 600000;
  const scope = 'tapmelo:screw-sort';
  const embedded = window.parent !== window;
  const siteLocale = document.getElementById('site-localized-copy');
  const siteCopy = siteLocale ? JSON.parse(siteLocale.textContent) : {};
  const pageLanguage = () => siteLocale?.dataset.language ?? (/^hi(?:-|$)/i.test(document.documentElement.lang) ? 'hi' : 'en');
  const hindiPage = pageLanguage() === 'hi' || location.pathname.startsWith('/hi/') ||
    new URLSearchParams(location.search).get('lang') === 'hi';
  const gamePath = siteLocale?.dataset.gamePath ?? (hindiPage ? '/hi/games/screw-sort/' : '/games/screw-sort/');
  const gameUrl = new URL(gamePath, location.origin).href;
  const copy = {
    en: {
      save: 'Save tapmelo', title: 'Your next little play break.',
      intro: 'Add tapmelo to your home screen or bookmarks so it is easy to find next time. An internet connection is needed to play.',
      prompt: 'Enjoying the game? Save tapmelo for your next little break.',
      add: 'Add / Bookmark', later: 'Not now', close: 'Close',
      addTitle: 'Add to home screen or desktop', bookmarkTitle: 'Bookmark this page',
      install: 'Add tapmelo', installing: 'Waiting for your browser…',
      installed: 'tapmelo has been installed.', accepted: 'Your browser is finishing the installation.',
      cancelled: 'Installation was cancelled. You can still use the steps below.',
      failed: 'Your browser could not open the installation window. Use the steps below.',
      ios: 'Tap Share, then Add to Home Screen, and confirm Add. If that option is missing, open this page in Safari first.',
      android: 'Open your browser menu (⋮), choose Add to Home screen or Install app, and confirm. Menu names may vary.',
      desktop: 'In Chrome or Edge, open the browser menu and look for Install tapmelo or Install this page as an app. On Safari for Mac, use File → Add to Dock when available.',
      generic: 'Open this game in your system browser, then look in the browser menu for Add to Home screen or an install option.',
      inapp: 'Open the browser menu and choose Open in browser. You can also copy the game address below and open it in your system browser.',
      bookmarkDesktop: 'Press {shortcut}, or use the bookmark / favourites option in your browser menu, to save the current page.',
      bookmarkMobile: 'Open your browser menu and select the star or Add bookmark to save the current page.',
      bookmarkIos: 'Tap Share, then Add Bookmark or Add to Favourites, to save the current page.',
      bookmarkGeneric: 'Use the bookmark or favourites option in your browser menu. If you are in an app, open this page in your system browser first.',
      openGame: 'Open the game page to add it manually', copy: 'Copy game address', copied: 'Game address copied.',
      copyFallback: 'Copy this address and open it in your browser:',
      confirmed: 'I have added it — stop reminding me', confirmedStatus: 'Thanks! We will stop showing game reminders on this browser.',
      progress: 'Progress is saved in this browser. On iPhone or iPad, a home-screen app may have separate progress.',
    },
    hi: {
      save: 'tapmelo सहेजें', title: 'अगली बार फिर खेलें।',
      intro: 'अगली बार आसानी से खेलने के लिए tapmelo को होम स्क्रीन या बुकमार्क में जोड़ें। खेलने के लिए इंटरनेट ज़रूरी है।',
      prompt: 'खेल पसंद आया? अगली बार के लिए tapmelo सहेजें।',
      add: 'जोड़ें / बुकमार्क करें', later: 'अभी नहीं', close: 'बंद करें',
      addTitle: 'होम स्क्रीन या डेस्कटॉप पर जोड़ें', bookmarkTitle: 'इस पेज को बुकमार्क करें',
      install: 'tapmelo जोड़ें', installing: 'ब्राउज़र की प्रतीक्षा हो रही है…',
      installed: 'tapmelo इंस्टॉल हो गया है।', accepted: 'ब्राउज़र इंस्टॉलेशन पूरा कर रहा है।',
      cancelled: 'इंस्टॉलेशन रद्द हुआ। नीचे दिए चरणों से भी जोड़ सकते हैं।',
      failed: 'इंस्टॉलेशन विंडो नहीं खुल सकी। नीचे दिए चरणों का उपयोग करें।',
      ios: 'शेयर पर टैप करें, फिर होम स्क्रीन पर जोड़ें चुनकर पुष्टि करें। विकल्प न दिखे तो पहले यह पेज Safari में खोलें।',
      android: 'ब्राउज़र मेनू (⋮) खोलें, होम स्क्रीन पर जोड़ें या ऐप इंस्टॉल करें चुनें और पुष्टि करें। मेनू के नाम अलग हो सकते हैं।',
      desktop: 'Chrome या Edge के मेनू में tapmelo इंस्टॉल करें या इस पेज को ऐप के रूप में इंस्टॉल करें खोजें। Mac के Safari में उपलब्ध होने पर File → Add to Dock चुनें।',
      generic: 'गेम को अपने सिस्टम ब्राउज़र में खोलें, फिर मेनू में होम स्क्रीन पर जोड़ें या इंस्टॉल विकल्प खोजें।',
      inapp: 'ऐप का मेनू खोलकर ब्राउज़र में खोलें चुनें। नीचे गेम का पता कॉपी करके अपने सिस्टम ब्राउज़र में भी खोल सकते हैं।',
      bookmarkDesktop: 'इस पेज को सहेजने के लिए {shortcut} दबाएँ या ब्राउज़र मेनू का बुकमार्क / पसंदीदा विकल्प चुनें।',
      bookmarkMobile: 'ब्राउज़र मेनू खोलकर तारा या बुकमार्क जोड़ें चुनें।',
      bookmarkIos: 'शेयर पर टैप करके बुकमार्क जोड़ें या पसंदीदा में जोड़ें चुनें।',
      bookmarkGeneric: 'ब्राउज़र मेनू में बुकमार्क या पसंदीदा विकल्प चुनें। ऐप में हैं तो पहले यह पेज सिस्टम ब्राउज़र में खोलें।',
      openGame: 'मैन्युअल रूप से जोड़ने के लिए गेम पेज खोलें', copy: 'गेम का पता कॉपी करें', copied: 'गेम का पता कॉपी हो गया।',
      copyFallback: 'यह पता कॉपी करके ब्राउज़र में खोलें:',
      confirmed: 'मैंने जोड़ लिया है — फिर याद न दिलाएँ', confirmedStatus: 'धन्यवाद! इस ब्राउज़र में गेम के रिमाइंडर बंद कर दिए हैं।',
      progress: 'प्रगति इसी ब्राउज़र में सहेजी जाती है। iPhone या iPad के होम स्क्रीन ऐप में प्रगति अलग हो सकती है।',
    },
  };
  const text = (language, key) => (language === siteLocale?.dataset.language ? siteCopy['save.' + key] : copy[language === 'hi' ? 'hi' : 'en'][key]) ?? copy.en[key] ?? key;
  const stateListeners = new Set(), guideListeners = new Set();
  let state = { cooldownUntil: 0, confirmed: false, installed: false };
  let guideOpen = false;
  const announceState = () => stateListeners.forEach(fn => fn({ ...state }));
  const announceGuide = (open, source) => {
    guideOpen = open;
    guideListeners.forEach(fn => fn({ open, source }));
  };
  const allowedSource = value => ['site', 'pause', 'win'].includes(value) ? value : 'site';
  const allowedLanguage = value => (siteLocale && value === siteLocale.dataset.language) || value === 'hi' ? value : 'en';
  const post = details => window.parent.postMessage({ scope, type: 'return_visit', ...details }, location.origin);
  const api = {
    text,
    canRemind: () => !state.confirmed && !state.installed && Date.now() >= state.cooldownUntil,
    getState: () => ({ ...state }),
    onState(fn) { stateListeners.add(fn); fn({ ...state }); return () => stateListeners.delete(fn); },
    onGuide(fn) { guideListeners.add(fn); fn({ open: guideOpen, source: 'site' }); return () => guideListeners.delete(fn); },
  };
  window.tapmeloReturnVisit = api;

  if (embedded) {
    // Fail closed until the parent supplies its persisted suppression state.
    state.installed = true;
    api.open = ({ source = 'win', language = 'en' } = {}) => post({ action: 'open', source, language });
    api.snooze = (reason, fields = {}) => {
      state.cooldownUntil = Date.now() + COOLDOWN_MS;
      announceState();
      post({ action: 'snooze', reason, fields });
    };
    api.event = (name, fields = {}) => post({ action: 'event', name, fields });
    window.addEventListener('message', event => {
      if (event.origin !== location.origin || event.source !== window.parent || event.data?.scope !== scope ||
          event.data.type !== 'return_visit_state') return;
      const next = event.data.state;
      if (!next || typeof next.confirmed !== 'boolean' || typeof next.installed !== 'boolean' ||
          !Number.isFinite(next.cooldownUntil)) return;
      state = { cooldownUntil: next.cooldownUntil, confirmed: next.confirmed, installed: next.installed };
      announceState();
      if (guideOpen !== !!event.data.open) announceGuide(!!event.data.open, allowedSource(event.data.source));
    });
    api.sync = () => post({ action: 'hello' });
    api.restoreParentFocus = () => post({ action: 'focus' });
    api.sync();
    window.addEventListener('pageshow', api.sync);
    return;
  }

  const standalone = () => !!navigator.standalone ||
    ['standalone', 'fullscreen', 'minimal-ui', 'window-controls-overlay'].some(mode => window.matchMedia(`(display-mode: ${mode})`).matches);
  const readState = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY));
      if (saved && typeof saved === 'object') state = {
        cooldownUntil: Number.isFinite(saved.cooldownUntil) && saved.cooldownUntil >= 0 ? saved.cooldownUntil : 0,
        confirmed: saved.confirmed === true, installed: saved.installed === true,
      };
    } catch { /* Keep in-memory preferences when storage is unavailable. */ }
    if (standalone()) state.installed = true;
  };
  let guideSource = 'site', language = 'en', deferredPrompt = null, dialog = null, opener = null, closing = false;
  const sendState = () => {
    document.getElementById('game-frame')?.contentWindow?.postMessage({
      scope, type: 'return_visit_state', state: { ...state }, open: guideOpen, source: guideSource,
    }, location.origin);
  };
  const publish = () => { announceState(); sendState(); };
  const writeState = changes => {
    readState();
    state = { ...state, ...changes };
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* In-memory fallback. */ }
    publish();
  };
  api.event = (name, fields = {}) => window.tapmeloAnalytics?.retention?.(name, fields);
  api.snooze = (reason = 'close', fields = {}) => {
    writeState({ cooldownUntil: Date.now() + COOLDOWN_MS });
    api.event('save_dismiss', { source: guideOpen ? guideSource : allowedSource(fields?.source || 'win'),
      action: reason, language: guideOpen ? language : allowedLanguage(fields?.language) });
  };
  const detectPlatform = () => {
    const ua = navigator.userAgent;
    const inapp = /MicroMessenger|FBAN|FBAV|Instagram|; wv\)|\bWebView\b/i.test(ua);
    const ios = /iPhone|iPad|iPod/i.test(ua) || (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1);
    const android = /Android/i.test(ua);
    const desktop = !ios && !android && /Chrome|Edg|Firefox|Safari/i.test(ua) && !/Mobile/i.test(ua);
    return { inapp, ios, android, desktop, mac: /Mac/i.test(navigator.platform || ua) };
  };
  const make = (tag, content, className) => {
    const node = document.createElement(tag);
    if (content) node.textContent = content;
    if (className) node.className = className;
    return node;
  };
  const button = (label, callback, className = 'rv-secondary') => {
    const node = make('button', label, className);
    node.type = 'button';
    node.addEventListener('click', callback);
    return node;
  };
  let installButton, status;
  const updateInstall = () => {
    if (!installButton) return;
    installButton.hidden = !deferredPrompt || state.installed || detectPlatform().inapp;
    installButton.disabled = false;
    installButton.textContent = text(language, 'install');
  };
  const finishGuide = () => {
    if (!guideOpen || closing) return;
    closing = true;
    api.snooze('close');
    if (dialog.open) dialog.close();
    announceGuide(false, guideSource);
    sendState();
    if (opener?.isConnected) opener.focus({ preventScroll: true });
    closing = false;
  };
  const install = async () => {
    const prompt = deferredPrompt;
    if (!prompt) { updateInstall(); return; }
    deferredPrompt = null;
    installButton.disabled = true;
    status.textContent = text(language, 'installing');
    api.event('save_action', { source: guideSource, action: 'install', language });
    try {
      // Call before the first await to preserve the top-level user's gesture.
      const pending = prompt.prompt();
      await pending;
      const result = await prompt.userChoice;
      if (state.installed) status.textContent = text(language, 'installed');
      else status.textContent = text(language, result?.outcome === 'accepted' ? 'accepted' : 'cancelled');
      if (result?.outcome !== 'accepted') api.snooze('install_cancel');
    } catch {
      status.textContent = text(language, 'failed');
      api.snooze('install_error');
    }
    updateInstall();
  };
  const renderGuide = () => {
    const platform = detectPlatform();
    dialog.replaceChildren();
    dialog.lang = language;
    const heading = make('h2', text(language, 'title'));
    heading.id = 'return-visit-title';
    const intro = make('p', text(language, 'intro'));
    intro.id = 'return-visit-description';
    const close = button(text(language, 'close'), finishGuide, 'rv-close');
    const top = make('div', '', 'rv-heading'); top.append(heading, close);
    const add = make('section'); add.append(make('h3', text(language, 'addTitle')));
    const instructions = platform.inapp ? 'inapp' : platform.ios ? 'ios' : platform.android ? 'android' : platform.desktop ? 'desktop' : 'generic';
    installButton = button(text(language, 'install'), install, 'rv-primary');
    add.append(make('p', text(language, instructions)), installButton);
    if (location.pathname !== gamePath && location.pathname !== gamePath.slice(0, -1)) {
      const link = make('a', text(language, 'openGame'), 'rv-game-link');
      link.href = gameUrl;
      add.append(link);
    }
    const bookmark = make('section'); bookmark.append(make('h3', text(language, 'bookmarkTitle')));
    const bookmarkKey = platform.inapp ? 'bookmarkGeneric' : platform.ios ? 'bookmarkIos' : platform.android ? 'bookmarkMobile' : platform.desktop ? 'bookmarkDesktop' : 'bookmarkGeneric';
    bookmark.append(make('p', text(language, bookmarkKey).replace('{shortcut}', platform.mac ? '⌘D' : 'Ctrl+D')));
    status = make('p', '', 'rv-status'); status.setAttribute('role', 'status');
    const fallback = make('div', '', 'rv-copy-fallback'); fallback.hidden = true;
    const address = make('input'); address.type = 'url'; address.readOnly = true; address.value = gameUrl;
    address.setAttribute('aria-label', text(language, 'copyFallback'));
    fallback.append(make('p', text(language, 'copyFallback')), address);
    const copyButton = button(text(language, 'copy'), async () => {
      api.event('save_action', { source: guideSource, action: 'copy', language });
      try { await navigator.clipboard.writeText(gameUrl); status.textContent = text(language, 'copied'); }
      catch { fallback.hidden = false; address.focus(); address.select(); }
    });
    const confirmed = button(text(language, 'confirmed'), () => {
      writeState({ confirmed: true });
      api.event('save_confirmed', { source: guideSource, action: 'self_report', language });
      finishGuide();
    }, 'rv-confirmed');
    dialog.append(top, intro, add, bookmark, copyButton, fallback, status);
    if (platform.ios) dialog.append(make('p', text(language, 'progress'), 'rv-note'));
    dialog.append(confirmed);
    updateInstall();
  };
  api.open = ({ source = 'site', language: requestedLanguage = 'en', trigger } = {}) => {
    if (guideOpen) return;
    guideSource = allowedSource(source); language = allowedLanguage(requestedLanguage);
    opener = trigger || document.activeElement;
    if (!dialog) {
      dialog = make('dialog', '', 'return-visit-dialog');
      dialog.id = 'return-visit-dialog';
      dialog.setAttribute('aria-labelledby', 'return-visit-title');
      dialog.setAttribute('aria-describedby', 'return-visit-description');
      dialog.addEventListener('cancel', event => { event.preventDefault(); finishGuide(); });
      dialog.addEventListener('close', finishGuide);
      document.body.append(dialog);
    }
    renderGuide();
    announceGuide(true, guideSource); sendState();
    dialog.showModal();
    dialog.querySelector('.rv-close').focus({ preventScroll: true });
    api.event('save_action', { source: guideSource, action: 'open', language });
  };
  api.handleMessage = event => {
    const frame = document.getElementById('game-frame');
    if (event.origin !== location.origin || event.source !== frame?.contentWindow ||
        event.data?.scope !== scope || event.data.type !== 'return_visit') return;
    const data = event.data;
    if (data.action === 'hello') sendState();
    else if (data.action === 'focus' && !guideOpen && opener?.isConnected) opener.focus({ preventScroll: true });
    else if (data.action === 'open') api.open({ source: data.source, language: data.language });
    else if (data.action === 'snooze') api.snooze(data.reason, data.fields);
    else if (data.action === 'event') api.event(data.name, data.fields);
  };
  api.syncFrame = sendState;
  window.addEventListener('message', api.handleMessage);
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault(); deferredPrompt = event; updateInstall();
  });
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    writeState({ installed: true });
    updateInstall();
    if (status) status.textContent = text(language, 'installed');
    api.event('app_installed', { source: guideOpen ? guideSource : 'site', language });
  });
  window.addEventListener('storage', event => {
    if (event.key !== KEY && event.key !== null) return;
    if (event.key === null || event.newValue === null) state = { cooldownUntil: 0, confirmed: false, installed: false };
    readState(); publish(); updateInstall();
  });
  window.addEventListener('pageshow', () => { readState(); publish(); });
  window.addEventListener('pagehide', () => { if (guideOpen) finishGuide(); });
  for (const mode of ['standalone', 'fullscreen', 'minimal-ui', 'window-controls-overlay']) {
    window.matchMedia(`(display-mode: ${mode})`).addEventListener?.('change', () => {
      if (standalone()) writeState({ installed: true });
    });
  }
  readState();
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-save-tapmelo]').forEach(node => node.addEventListener('click', () => api.open({ trigger: node, language: pageLanguage() })));
    if (standalone()) {
      writeState({ installed: true });
      api.event('app_launch', { source: 'site', language: pageLanguage() });
    }
  });
})();
