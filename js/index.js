// js/index.js
// Zarządzanie menu (desktop + mobile) i sekcją mobile-auth w nav

// helpers
const $qs  = (sel, root=document) => root.querySelector(sel);

function setMobileAuthVisibility() {
  const navMenu    = $qs('.nav-menu');
  const mobileAuth = $qs('#mobileAuth');
  if (!navMenu || !mobileAuth) return;

  const isOpen = navMenu.classList.contains('active');
  mobileAuth.style.display = isOpen ? 'flex' : 'none';
}

function renderMobileAuth(user) {
  const navMenu     = $qs('.nav-menu');
  const mobileAuthC = $qs('#mobileAuth');
  if (!mobileAuthC) return;

  if (user) {
    const label = user.displayName ? user.displayName.split(' ')[0] : (user.email || 'Użytkownik');
    mobileAuthC.innerHTML = `
      <div class="nav-link" style="font-weight:600;">
        <i class="fas fa-user"></i> ${label}
      </div>
      <a href="#userDashboard" class="nav-link" id="mobileAccountLink">Moje konto</a>
      <button class="btn btn-secondary" id="mobileLogoutBtn" style="width:100%;">
        <i class="fas fa-sign-out-alt"></i> Wyloguj się
      </button>
    `;
  } else {
    mobileAuthC.innerHTML = `
      <a href="#" id="loginLink" class="nav-link">Zaloguj się</a>
      <a href="#" id="registerLink" class="nav-link">Zarejestruj się</a>
    `;
  }

  // podpinamy zachowania
  const loginLink        = $qs('#loginLink');
  const registerLink     = $qs('#registerLink');
  const mobileLogoutBtn  = $qs('#mobileLogoutBtn');
  const mobileAccountLink= $qs('#mobileAccountLink');

  loginLink && loginLink.addEventListener('click', (e) => {
    e.preventDefault();
    window.dispatchEvent(new Event('ui:openLoginModal'));
    navMenu?.classList.remove('active');
    setMobileAuthVisibility();
  });

  registerLink && registerLink.addEventListener('click', (e) => {
    e.preventDefault();
    window.dispatchEvent(new Event('ui:openRegisterModal'));
    navMenu?.classList.remove('active');
    setMobileAuthVisibility();
  });

  mobileLogoutBtn && mobileLogoutBtn.addEventListener('click', () => {
    // nie importujemy Firebase tutaj – prosimy auth.js o wylogowanie
    window.dispatchEvent(new Event('auth:logoutRequest'));
    navMenu?.classList.remove('active');
    setMobileAuthVisibility();
  });

  mobileAccountLink && mobileAccountLink.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('userDashboard')?.scrollIntoView({ behavior:'smooth' });
    navMenu?.classList.remove('active');
    setMobileAuthVisibility();
  });

  setMobileAuthVisibility();
}

// init po załadowaniu DOM
document.addEventListener('DOMContentLoaded', () => {
  const mobileMenuBtn = $qs('.mobile-menu-btn');
  const navMenu       = $qs('.nav-menu');

  mobileMenuBtn?.addEventListener('click', () => {
    navMenu?.classList.toggle('active');
    // przy każdym otwarciu odświeżamy zawartość (ważne na mobile po zalogowaniu)
    renderMobileAuth(window.__currentUser || null);
  });

  // zamknij menu na desktopie
  window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
      navMenu?.classList.remove('active');
      setMobileAuthVisibility();
    }
  });

  // „Moje konto” (desktop)
  document.getElementById('accountBtn')?.addEventListener('click', () => {
    document.getElementById('userDashboard')?.scrollIntoView({ behavior:'smooth' });
  });

  // pierwsze renderowanie – jeśli auth.js już zna użytkownika
  renderMobileAuth(window.__currentUser || null);
});

// reaguj na zmiany stanu logowania (z auth.js)
window.addEventListener('auth:login',  (ev) => { window.__currentUser = ev.detail.user; renderMobileAuth(ev.detail.user); });
window.addEventListener('auth:logout', ()    => { window.__currentUser = null;          renderMobileAuth(null);           });

// na żądanie od auth.js (np. po init)
window.addEventListener('ui:refreshMobileAuth', (ev) => {
  renderMobileAuth(ev.detail?.user || window.__currentUser || null);
});
