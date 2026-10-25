// Small interface behaviour: toasts, mobile menu, user dropdown, confirm dialog.
(function () {
  const TOAST_KEY = 'aj-toast';

  // ---------- Toasts ----------
  function toast(message, type = 'success') {
    const region = document.getElementById('toast-region');
    if (!region || !message) return;
    const element = document.createElement('div');
    element.className = `toast toast--${type}`;
    element.setAttribute('role', type === 'error' ? 'alert' : 'status');
    element.textContent = message;
    region.appendChild(element);
    setTimeout(() => {
      element.classList.add('is-leaving');
      setTimeout(() => element.remove(), 300);
    }, 4500);
  }

  // Used right before a redirect or reload so the message shows on the next page.
  function toastAfterReload(message, type = 'success') {
    try { sessionStorage.setItem(TOAST_KEY, JSON.stringify({ message, type })); } catch (error) { /* storage blocked */ }
  }

  function showStoredToast() {
    try {
      const stored = sessionStorage.getItem(TOAST_KEY);
      if (!stored) return;
      sessionStorage.removeItem(TOAST_KEY);
      const { message, type } = JSON.parse(stored);
      toast(message, type);
    } catch (error) { /* ignore */ }
  }

  // ---------- Confirm dialog (<dialog id="confirm-dialog">) ----------
  function confirmDialog(message) {
    const dialog = document.getElementById('confirm-dialog');
    if (!dialog || typeof dialog.showModal !== 'function') return Promise.resolve(window.confirm(message));

    document.getElementById('confirm-text').textContent = message;
    dialog.returnValue = '';
    return new Promise((resolve) => {
      dialog.addEventListener('close', () => resolve(dialog.returnValue === 'ok'), { once: true });
      dialog.showModal();
    });
  }

  // ---------- Mobile navigation ----------
  const navToggle = document.querySelector('[data-nav-toggle]');
  const nav = document.getElementById('site-nav');
  if (navToggle && nav) {
    navToggle.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', String(open));
    });
  }

  // ---------- User dropdown ----------
  const dropdowns = document.querySelectorAll('[data-dropdown]');
  function closeDropdowns(except) {
    dropdowns.forEach((dropdown) => {
      if (dropdown === except) return;
      dropdown.classList.remove('is-open');
      dropdown.querySelector('[data-dropdown-toggle]').setAttribute('aria-expanded', 'false');
    });
  }
  dropdowns.forEach((dropdown) => {
    const toggle = dropdown.querySelector('[data-dropdown-toggle]');
    toggle.addEventListener('click', (event) => {
      event.stopPropagation();
      closeDropdowns(dropdown);
      const open = dropdown.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
    });
  });
  document.addEventListener('click', () => closeDropdowns(null));
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeDropdowns(null); });

  window.AJ = window.AJ || {};
  Object.assign(window.AJ, { toast, toastAfterReload, confirmDialog });
  showStoredToast();
})();
