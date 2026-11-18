const languagePicker = document.querySelector('.language-picker');
const languageTrigger = languagePicker.querySelector('summary');

document.addEventListener('keydown', event => {
  if (event.key !== 'Escape' || !languagePicker.open || event.defaultPrevented) return;

  languagePicker.open = false;
  if (languagePicker.contains(document.activeElement)) {
    event.preventDefault();
    languageTrigger.focus();
  }
});

document.addEventListener('click', event => {
  if (languagePicker.open && !languagePicker.contains(event.target)) {
    languagePicker.open = false;
  }
});
