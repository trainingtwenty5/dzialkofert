// assets/layout.js
(function(){
  const isFile = location.protocol === 'file:';

  const INLINE_HEADER = `
<!-- TOP NAVBAR (desktop) -->
<div class="top-navbar" role="navigation" aria-label="Pasek informacyjny">
  <div class="wrap">
    <div class="contact-info">
      <span><i class="fas fa-clock"></i> Poniedziałek – Piątek 9:00–18:00</span>
      <span><i class="fas fa-phone"></i> +48 505 849 404</span>
    </div>
    <div class="auth-buttons" id="authButtons">
      <button class="btn btn-outline-primary btn-sm" id="loginBtn"><i class="fas fa-sign-in-alt"></i> Zaloguj się</button>
      <button class="btn btn-primary btn-sm" id="registerBtn"><i class="fas fa-user-plus"></i> Zarejestruj się</button>
    </div>
    <div class="user-menu" id="userMenu" style="display:none">
      <button class="btn btn-outline-primary btn-sm" id="accountBtn"><i class="fas fa-user"></i> Moje konto</button>
      <button class="btn btn-primary btn-sm" id="logoutBtn"><i class="fas fa-sign-out-alt"></i> Wyloguj</button>
    </div>
  </div>
</div>

<!-- HEADER (główna nawigacja) -->
<header role="navigation" aria-label="Główna nawigacja">
  <div class="header-inner">
    <a href="index.html" class="logo">
      <img src="https://storage.waw.cloud.ovh.net/v1/AUTH_024f82ed62da4186825a5b526cd1a61e/FishFounder/Dzialkofert_logo.png" alt="Działkofert">
      <span>Działkofert</span>
    </a>

    <nav class="desktop-nav" aria-label="Menu (desktop)">
      <a href="index.html" class="nav-link">Strona główna</a>
      <a href="oferty.html" class="nav-link">Oferty</a>
      <a href="dodaj.html" class="nav-link">Dodaj ofertę</a>
      <a href="#contact" class="nav-link">Kontakt</a>
    </nav>

    <a href="dodaj.html" class="desktop-add-offer"><i class="fas fa-plus"></i> Dodaj ofertę</a>

    <a href="dodaj.html" class="mobile-add-offer"><i class="fas fa-plus"></i> Dodaj ofertę</a>
    <button class="mobile-menu-btn" aria-label="Otwórz menu" aria-expanded="false">
      <i class="fas fa-bars"></i>
    </button>
  </div>

  <!-- Menu mobilne -->
  <nav class="nav-menu" aria-label="Menu (mobile)">
    <a href="index.html" class="nav-link">Strona główna</a>
    <a href="oferty.html" class="nav-link">Oferty</a>
    <a href="dodaj.html" class="nav-link">Dodaj ofertę</a>
    <a href="#contact" class="nav-link">Kontakt</a>
    <div class="mobile-auth" style="display:none">
      <a href="#" id="loginLink" class="nav-link">Zaloguj się</a>
      <a href="#" id="registerLink" class="nav-link">Zarejestruj się</a>
    </div>
  </nav>
</header>
`;
  const INLINE_FOOTER = `
<footer id="contact">
  <div class="container">
    <div class="footer-container">
      <div class="footer-about">
        <a href="index.html" class="footer-logo">
          <img src="https://storage.waw.cloud.ovh.net/v1/AUTH_024f82ed62da4186825a5b526cd1a61e/FishFounder/Dzialkofert_logo.png" alt="Działkofert">
          <span>Działkofert</span>
        </a>
        <p>Bezpłatne ogłoszenia nieruchomości. Szybka sprzedaż działek bez zbędnych kosztów i formalności.</p>
      </div>

      <div class="footer-links">
        <h3>Przydatne linki</h3>
        <ul>
          <li><a href="index.html">Strona główna</a></li>
          <li><a href="oferty.html">Oferty</a></li>
          <li><a href="dodaj.html">Dodaj ofertę</a></li>
          <li><a href="#contact">Kontakt</a></li>
        </ul>
      </div>

      <div class="footer-contact">
        <h3>Kontakt</h3>
        <p><i class="fas fa-envelope"></i> info@dzialkiekspres.pl</p>
        <p><i class="fas fa-phone"></i> +48 123 456 789</p>
      </div>
    </div>

    <div class="footer-bottom">
      © 2025 Działkofert. Wszelkie prawa zastrzeżone.
    </div>
  </div>
</footer>
`;

  function $(sel, root=document){ return root.querySelector(sel); }

  async function tryFetch(url){
    try{
      const res = await fetch(url, { cache: 'no-cache' });
      if(!res.ok) throw new Error(res.statusText);
      return await res.text();
    }catch(e){
      console.warn('[layout] fetch fail:', url, e.message);
      return null;
    }
  }

  function pathCandidates(file){
    // Relative variants + absolute
    const parts = location.pathname.split('/').filter(Boolean);
    const variants = [];
    let prefix = '';
    for(let i=0;i<=Math.min(3, parts.length); i++){
      variants.push(prefix + 'partials/' + file);
      prefix += '../';
    }
    variants.push('/partials/' + file);
    return variants;
  }

  async function loadPiece(name, targetId){
    const mount = document.getElementById(targetId);
    if(!mount){ console.warn('[layout] No mount:', targetId); return; }

    if(isFile){
      // Inline fallback for file://
      mount.innerHTML = (name === 'header') ? INLINE_HEADER : INLINE_FOOTER;
      afterInject(name);
      return;
    }

    const file = name + '.html';
    const urls = pathCandidates(file);

    let html = null;
    for(const u of urls){
      html = await tryFetch(u);
      if(html){ break; }
    }
    if(!html){
      console.warn(`[layout] Fallback to inline for ${name}`);
      html = (name === 'header') ? INLINE_HEADER : INLINE_FOOTER;
    }
    mount.innerHTML = html;
    afterInject(name);
  }

  function afterInject(name){
    if(name==='header'){
      // mobile menu
      const btn = $('.mobile-menu-btn');
      const menu = $('.nav-menu');
      const mobileAuth = $('.mobile-auth');
      if(btn && menu){
        const toggle = () => {
          const open = !menu.classList.contains('active');
          menu.classList.toggle('active', open);
          btn.setAttribute('aria-expanded', open ? 'true' : 'false');
          if(mobileAuth) mobileAuth.style.display = open ? 'flex' : 'none';
          document.body.classList.toggle('menu-open', open);
        };
        btn.addEventListener('click', toggle);
        menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
          menu.classList.remove('active');
          btn.setAttribute('aria-expanded', 'false');
          document.body.classList.remove('menu-open');
          if(mobileAuth) mobileAuth.style.display = 'none';
        }));
      }

      // auth triggers -> otwierają modale, jeśli istnieją
      const openModal = (id)=>{
        const m = document.getElementById(id);
        if(m){ m.style.display='flex'; }
        else { console.warn('[layout] Brak modala #' + id); }
      };
      $('#loginBtn')     && $('#loginBtn').addEventListener('click', ()=> openModal('loginModal'));
      $('#registerBtn')  && $('#registerBtn').addEventListener('click', ()=> openModal('registerModal'));
      $('#loginLink')    && $('#loginLink').addEventListener('click', (e)=>{ e.preventDefault(); openModal('loginModal'); });
      $('#registerLink') && $('#registerLink').addEventListener('click', (e)=>{ e.preventDefault(); openModal('registerModal'); });
    }
  }

  window.addEventListener('DOMContentLoaded', ()=>{
    loadPiece('header','site-header');
    loadPiece('footer','site-footer');
  });
})();
