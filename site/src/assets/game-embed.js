(() => {
  const shell = document.getElementById('game-embed');
  const frame = document.getElementById('game-frame');
  const status = document.getElementById('embed-status');
  const retry = document.getElementById('embed-retry');
  const gameUrl = frame.getAttribute('data-src');
  const hindi = /^hi(?:-|$)/i.test(document.documentElement.lang);
  const copy = hindi ? {
    error: 'Glass Twist लोड नहीं हो सका। फिर कोशिश करें या खेल सीधे खोलें।',
    failed: 'लोड नहीं हो सका', loading: 'लोड हो रहा है',
    start: 'Glass Twist लोड हो रहा है…', ready: 'खेलने के लिए तैयार!',
  } : {
    error: 'Glass Twist could not load. Try again or open the game directly.',
    failed: 'Loading failed', loading: 'Loading',
    start: 'Loading Glass Twist…', ready: 'Ready to play!',
  };
  const localized = document.getElementById('site-localized-copy');
  if (localized) {
    const messages = JSON.parse(localized.textContent);
    for (const key of Object.keys(copy)) copy[key] = messages['glass.' + key];
  }
  const progress = document.getElementById('embed-progress');
  let timeout, finishTimer;
  let attempt = 0;

  function showError(reason = 'initialization_error') {
    if (shell.dataset.state !== 'loading') return;
    window.tapmeloAnalytics?.loadError(reason);
    clearTimeout(timeout);
    clearTimeout(finishTimer);
    shell.dataset.state = 'error';
    progress.setAttribute('aria-valuetext', copy.failed);
    status.textContent = copy.error;
  }

  function beginLoading() {
    window.tapmeloAnalytics?.setAvailable(false);
    clearTimeout(timeout);
    clearTimeout(finishTimer);
    shell.dataset.state = 'loading';
    progress.removeAttribute('aria-valuenow');
    progress.setAttribute('aria-valuetext', copy.loading);
    status.textContent = copy.start;
    timeout = setTimeout(() => showError('timeout'), 15000);
  }

  frame.addEventListener('load', () => {
    frame.contentWindow?.postMessage({ scope: 'tapmelo:screw-sort', type: 'hello' }, location.origin);
  });
  window.addEventListener('message', event => {
    if (event.origin !== location.origin || event.source !== frame.contentWindow ||
        event.data?.scope !== 'tapmelo:screw-sort') return;
    if (event.data.type === 'analytics') {
      window.tapmeloAnalytics?.game(event.data.telemetry);
    } else if (event.data.type === 'resize') {
      const height = event.data.height;
      if (Number.isFinite(height) && height >= 280 && height <= 4000) {
        frame.style.height = `${Math.ceil(height) + 2}px`;
      }
    } else if (event.data.type === 'ready') {
      window.tapmeloReturnVisit?.syncFrame();
      clearTimeout(timeout);
      if (shell.dataset.state === 'ready' || shell.dataset.state === 'finishing') return;
      shell.dataset.state = 'finishing';
      progress.setAttribute('aria-valuenow', '100');
      progress.setAttribute('aria-valuetext', copy.ready);
      status.textContent = copy.ready;
      finishTimer = setTimeout(() => {
        shell.dataset.state = 'ready';
        window.tapmeloAnalytics?.setAvailable(true);
        status.textContent = '';
      }, 220);
    } else if (event.data.type === 'load_error') {
      showError(event.data.reason);
    }
  });
  retry.addEventListener('click', () => {
    window.tapmeloAnalytics?.loadStart();
    beginLoading();
    attempt += 1;
    frame.contentWindow.location.replace(`${gameUrl}&retry=${attempt}`);
  });
  document.addEventListener('game-launch', beginLoading);
  frame.contentWindow?.postMessage({ scope: 'tapmelo:screw-sort', type: 'hello' }, location.origin);
})();
