const launch = document.querySelector('.partner-start');
const screen = document.querySelector('.partner-screen');
const frame = screen.querySelector('template');

launch.addEventListener('click', event => {
  if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
  event.preventDefault();
  const player = frame.content.firstElementChild.cloneNode();
  screen.append(player);
  screen.classList.add('is-playing');
  screen.querySelector('.partner-launch').hidden = true;
  player.focus({ preventScroll: true });
});
