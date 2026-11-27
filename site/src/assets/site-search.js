(() => {
  const search = document.querySelector('.site-game-search');
  const input = search.querySelector('input');
  const popup = search.querySelector('.site-search-popup');
  const list = popup.querySelector('[role="listbox"]');
  const status = popup.querySelector('[role="status"]');
  const normalize = value => value.normalize('NFKC').toLowerCase().replace(/[-_:!]+/g, ' ').replace(/\s+/g, ' ').trim();
  let catalogue;
  let generation = 0;
  let options = [];
  let active = -1;

  function loadCatalogue() {
    catalogue ??= fetch(search.dataset.catalogue).then(response => {
      if (!response.ok) throw Error('Search catalogue unavailable');
      return response.json();
    }).then(entries => entries.map(entry => ({
      ...entry, words: normalize(entry.title), originalWords: normalize(entry.originalTitle ?? ''), keywords: normalize(entry.keywords),
    }))).catch(error => {
      catalogue = undefined;
      throw error;
    });
    return catalogue;
  }

  function showStatus(message) {
    status.textContent = message;
    status.hidden = !message;
  }

  function select(index) {
    options[active]?.setAttribute('aria-selected', 'false');
    active = index;
    const option = options[active];
    if (option) {
      option.setAttribute('aria-selected', 'true');
      input.setAttribute('aria-activedescendant', option.id);
      option.scrollIntoView({ block: 'nearest' });
    } else input.removeAttribute('aria-activedescendant');
  }

  function close() {
    generation++;
    popup.hidden = true;
    input.setAttribute('aria-expanded', 'false');
    select(-1);
  }

  function makeOption(game, index) {
    const link = document.createElement('a');
    link.id = 'site-search-result-' + index;
    link.href = game.href;
    link.tabIndex = -1;
    link.setAttribute('role', 'option');
    link.setAttribute('aria-selected', 'false');
    const cover = document.createElement('img');
    cover.src = game.cover;
    cover.alt = '';
    cover.width = cover.height = 34;
    const label = document.createElement('span');
    label.textContent = game.title;
    link.append(cover, label);
    return link;
  }

  async function update() {
    const query = normalize(input.value);
    if (!query) return close();
    const request = ++generation;
    select(-1);
    options = [];
    list.replaceChildren();
    popup.hidden = false;
    input.setAttribute('aria-expanded', 'true');
    showStatus(search.dataset.loading);
    try {
      const entries = await loadCatalogue();
      if (request !== generation) return;
      const terms = query.split(' ');
      const matches = entries.map(entry => {
        let rank = 0;
        if (entry.words === query || entry.originalWords === query) rank = 4;
        else if (entry.words.startsWith(query) || entry.originalWords.startsWith(query)) rank = 3;
        else if (terms.every(term => entry.words.includes(term))) rank = 2;
        else if (terms.every(term => (entry.words + ' ' + entry.keywords).includes(term))) rank = 1;
        return { entry, rank };
      }).filter(match => match.rank).sort((a, b) => b.rank - a.rank);
      options = matches.slice(0, 8).map(({ entry }, index) => makeOption(entry, index));
      list.replaceChildren(...options);
      showStatus(options.length ? '' : search.dataset.empty);
    } catch {
      if (request === generation) showStatus(search.dataset.error);
    }
  }

  input.addEventListener('input', update);
  input.addEventListener('focus', () => { if (input.value) update(); });
  input.addEventListener('click', () => { if (popup.hidden && input.value) update(); });
  input.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !popup.hidden) {
      event.preventDefault();
      close();
      return;
    }
    if (popup.hidden || !options.length) return;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const next = event.key === 'ArrowDown' ? (active + 1) % options.length
        : (active <= 0 ? options.length - 1 : active - 1);
      select(next);
    } else if (event.key === 'Enter' && !event.isComposing) {
      event.preventDefault();
      options[Math.max(active, 0)].click();
    }
  });
  search.addEventListener('focusout', event => {
    if (!search.contains(event.relatedTarget)) close();
  });
  document.addEventListener('pointerdown', event => {
    if (!popup.hidden && !search.contains(event.target)) close();
  });
})();
