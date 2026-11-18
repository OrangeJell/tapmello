const navigation = document.querySelector('.discovery-nav');
const toggle = document.querySelector('.discovery-toggle');
const mobileToggle = document.querySelector('.discovery-mobile-toggle');
const categoryDrawer = document.querySelector('.discovery-drawer');
const mobileNavigation = matchMedia('(max-width: 700px), (any-pointer: coarse) and (max-height: 600px)');

if (navigation && toggle) {
  const setOpen = open => {
    navigation.classList.toggle('is-open', open);
    navigation.classList.toggle('is-dismissed', !open);
    toggle.setAttribute('aria-expanded', String(open));
  };

  toggle.hidden = false;
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    setOpen(open);
  });
  navigation.addEventListener('pointerleave', () => {
    if (!navigation.contains(document.activeElement)) navigation.classList.remove('is-dismissed');
  });
  navigation.addEventListener('focusout', event => {
    if (navigation.contains(event.relatedTarget)) return;
    navigation.classList.remove('is-dismissed', 'is-open');
    toggle.setAttribute('aria-expanded', 'false');
  });
  navigation.addEventListener('focusin', event => {
    if (event.target.matches('a:focus-visible')) navigation.classList.remove('is-dismissed');
  });
  document.addEventListener('click', event => {
    if (navigation.contains(event.target) || toggle.contains(event.target)) return;
    if (navigation.classList.contains('is-open')) setOpen(false);
  });
  document.addEventListener('keydown', event => {
    if (categoryDrawer.open) return;
    if (event.key !== 'Escape' || !navigation.matches(':focus-within, :hover, .is-open')) return;
    setOpen(false);
    if (navigation.contains(document.activeElement)) {
      if (toggle.getClientRects().length) toggle.focus();
      else navigation.focus();
    }
  });

  function updateNavigationLayout() {
    const mobile = mobileNavigation.matches;
    if (!mobile && categoryDrawer.open) categoryDrawer.close();
    setOpen(false);
    navigation.classList.remove('is-dismissed');
    if (mobile) categoryDrawer.append(navigation);
    else categoryDrawer.before(navigation);
    mobileToggle.hidden = !mobile;
    document.documentElement.classList.toggle('has-mobile-discovery', mobile);
  }

  mobileToggle.addEventListener('click', () => {
    categoryDrawer.showModal();
    mobileToggle.setAttribute('aria-expanded', 'true');
  });
  if (!('closedBy' in categoryDrawer)) {
    const hitsBackdrop = event => {
      const { left, right, top, bottom } = categoryDrawer.getBoundingClientRect();
      return event.clientX < left || event.clientX >= right || event.clientY < top || event.clientY >= bottom;
    };
    let pressedBackdrop = false;
    categoryDrawer.addEventListener('pointerdown', event => {
      pressedBackdrop = event.isPrimary && event.button === 0 && hitsBackdrop(event);
    });
    categoryDrawer.addEventListener('pointercancel', () => { pressedBackdrop = false; });
    categoryDrawer.addEventListener('click', event => {
      if (pressedBackdrop && event.detail && hitsBackdrop(event)) categoryDrawer.close();
      pressedBackdrop = false;
    });
  }
  categoryDrawer.addEventListener('close', () => {
    mobileToggle.setAttribute('aria-expanded', 'false');
    if (mobileNavigation.matches) mobileToggle.focus({ preventScroll: true });
  });
  mobileNavigation.addEventListener('change', updateNavigationLayout);
  updateNavigationLayout();
}
