// assets/js/index.js
export function initIndexUI() {
  const toggle = document.getElementById('navToggle');
  const menuId = toggle?.getAttribute('aria-controls') || 'mainNav';
  const menu = document.getElementById(menuId);
  if (!toggle || !menu) return;

  const open = () => {
    menu.hidden = false;
    menu.classList.add('is-open');
    toggle.setAttribute('aria-expanded', 'true');
    document.body.classList.add('nav-open');
  };
  const close = () => {
    menu.classList.remove('is-open');
    menu.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('nav-open');
  };

  toggle.addEventListener('click', () => (menu.hidden ? open() : close()));

  // zamykanie po kliknięciu poza menu
  document.addEventListener('click', (e) => {
    if (!menu.hidden && !menu.contains(e.target) && !toggle.contains(e.target)) close();
  });

  // zamykanie po kliknięciu linku z data-nav-close
  menu.querySelectorAll('[data-nav-close]').forEach(a => {
    a.addEventListener('click', () => close());
  });

  // reset na desktopie (gdy zmieniasz rozmiar okna)
  const MQ = 1024; // piksele
  const onResize = () => {
    if (window.innerWidth >= MQ) {
      menu.hidden = true;
      menu.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('nav-open');
    }
  };
  window.addEventListener('resize', onResize);
}
