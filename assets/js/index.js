console.log('[index.js] loaded');

function bindUI() {
  console.log('[index.js] binding UI…');

  const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
  const navMenu = document.querySelector('.nav-menu');
  const mobileAuth = document.getElementById('mobileAuth');

  function syncMobileAuthVisibility() {
    if (mobileAuth && navMenu) {
      mobileAuth.style.display = navMenu.classList.contains('active') ? 'flex' : 'none';
    }
  }

  if (mobileMenuBtn && navMenu) {
    // najpierw odpinamy potencjalne stare handlery
    mobileMenuBtn.onclick = null;
    mobileMenuBtn.addEventListener('click', () => {
      navMenu.classList.toggle('active');
      syncMobileAuthVisibility();
    });
  }

  window.addEventListener('resize', () => {
    if (window.innerWidth > 768 && navMenu) {
      navMenu.classList.remove('active');
      if (mobileAuth) mobileAuth.style.display = 'none';
    }
  });

  // Modale (działają niezależnie od Firebase)
  const loginBtn = document.getElementById('loginBtn');
  const registerBtn = document.getElementById('registerBtn');
  const loginModal = document.getElementById('loginModal');
  const registerModal = document.getElementById('registerModal');
  const closeBtns = document.querySelectorAll('.modal-close');
  const switchToReg = document.getElementById('switchToRegister');
  const switchToLog = document.getElementById('switchToLogin');

  function openModal(m) { if (m) m.style.display = 'flex'; }
  function closeModal(m) { if (m) m.style.display = 'none'; }

  if (loginBtn)    loginBtn.onclick = () => openModal(loginModal);
  if (registerBtn) registerBtn.onclick = () => openModal(registerModal);
  if (switchToReg) switchToReg.onclick = (e) => { e.preventDefault(); closeModal(loginModal);  openModal(registerModal); };
  if (switchToLog) switchToLog.onclick = (e) => { e.preventDefault(); closeModal(registerModal); openModal(loginModal); };

  closeBtns.forEach(b => {
    b.onclick = () => closeModal(b.closest('.modal'));
  });
  window.addEventListener('click', (e) => {
    if (e.target?.classList?.contains('modal')) closeModal(e.target);
  });

  console.log('[index.js] UI bound');
}

// ZAWSZE czekamy na partiale
document.addEventListener('partials:ready', bindUI);

// Jeśli ta strona ma header inline (np. index.html), odpalimy też od razu:
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  // ale poczekajmy jeszcze jedną klatkę na DOM
  setTimeout(() => {
    if (document.querySelector('.mobile-menu-btn')) bindUI();
  }, 0);
} else {
  document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.mobile-menu-btn')) bindUI();
  });
}
