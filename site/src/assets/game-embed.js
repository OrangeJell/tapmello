(() => {
  const frame = document.getElementById('game-frame');
  const loader = createNativeLoader({
    onStart(isRetry) {
      if (isRetry) window.tapmeloAnalytics?.loadStart();
      window.tapmeloAnalytics?.setAvailable(false);
    },
    onError: reason => window.tapmeloAnalytics?.loadError(reason),
    onReady: () => window.tapmeloAnalytics?.setAvailable(true),
  });

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
      loader.ready();
    } else if (event.data.type === 'load_error') {
      loader.fail(event.data.reason ?? 'initialization_error');
    }
  });
  frame.contentWindow?.postMessage({ scope: 'tapmelo:screw-sort', type: 'hello' }, location.origin);
})();
