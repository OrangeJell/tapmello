(() => {
  const keyPrefix = 'tapmelo.lastPlayed.';
  const player = document.querySelector('.detail-player[data-game]');

  if (player) {
    player.addEventListener('game-played', () => {
      try {
        localStorage.setItem(keyPrefix + player.dataset.game, String(performance.timeOrigin + performance.now()));
      } catch {
        // Browsers can disable storage. The game can still open.
      }
    });
  }

  const grid = document.querySelector('[data-played-games]');
  if (!grid) return;

  const section = grid.closest('.continue-playing');
  const emptyState = document.querySelector('[data-played-empty]');
  const templates = document.querySelectorAll('template[data-game-batch], template[data-played-catalogue]');
  const tiles = new Map();
  for (const tile of document.querySelectorAll('#games [data-game-tile]')) {
    tiles.set(tile.dataset.game, tile.cloneNode(true));
  }
  for (const template of templates) {
    for (const tile of template.content.querySelectorAll('[data-game-tile]')) {
      tiles.set(tile.dataset.game, tile);
    }
  }

  const mobile = window.matchMedia('(max-width: 700px)');
  let history = [];

  function render() {
    if (section) section.hidden = history.length === 0;
    if (emptyState) emptyState.hidden = history.length > 0;

    let visible = history;
    if (section && history.length) {
      // The recent shelf uses the same responsive grid as the main catalogue.
      const columns = getComputedStyle(grid).gridTemplateColumns.split(' ').length;
      visible = history.slice(0, columns * (mobile.matches ? 2 : 1));
    }

    if (visible.length === grid.childElementCount &&
        visible.every((id, index) => grid.children[index].dataset.game === id)) return;

    const cards = visible.map(id => {
      const tile = tiles.get(id).cloneNode(true);
      if (section) tile.removeAttribute('id');
      return tile;
    });
    grid.replaceChildren(...cards);
    document.dispatchEvent(new CustomEvent('game-tiles-added', { detail: cards }));
  }

  function refresh() {
    try {
      history = [...tiles.keys()]
        .map(id => ({ id, lastPlayed: Number(localStorage.getItem(keyPrefix + id)) }))
        .filter(entry => Number.isFinite(entry.lastPlayed) && entry.lastPlayed > 0)
        .sort((left, right) => right.lastPlayed - left.lastPlayed)
        .map(entry => entry.id);
    } catch {
      history = [];
    }
    render();
  }

  if (section) {
    new ResizeObserver(render).observe(grid);
    mobile.addEventListener('change', render);
  }
  window.addEventListener('pageshow', refresh);
  window.addEventListener('storage', event => {
    if (event.key === null || event.key.startsWith(keyPrefix)) refresh();
  });
  refresh();
})();
