// assets/layout.js
(function(){
  const isFile = location.protocol === 'file:';
  const $ = (s, r=document)=>r.querySelector(s);

  const INLINE_HEADER = `
<!-- TOP NAVBAR (desktop) -->
<div class="top-navbar" role="navigation" aria-label="Pasek informacyjny">
  <div class="wrap">
    <div class="contact-info">
      <span><i class="fas fa-clock"></i> Pon.–Pt. 9:00–18:00</span>
      <span><i class="fas fa-phone"></i> +48 505 849 404</span>
    </div>
    <div>
      <div class="auth-buttons" id="authButtons">
        <button class="btn btn-outline-primary btn-sm" id="loginBtn"><i class="fas fa-sign-in-alt"></i> Zaloguj się</button>
        <button class="btn btn-primary btn-sm" id="registerBtn"><i class="fas fa-user-plus"></i> Zarejestruj się</button>
      </div>
      <div class="user-menu" id="userMenu" style="display:none;">
        <button class="btn btn-outline-primary btn-sm" id="accountBtn"><i class="fas fa-user"></i> Moje konto</button>
        <button class="btn btn-secondary btn-sm" id="logoutBtn"><i class="fas fa-sign-out-alt"></i> Wyloguj</button>
      </div>
    </div>
  </div>
</div>

<!-- HEADER -->
<header role="navigation" aria-label="Główna nawigacja">
  <div class="header-inner">
    <a class="logo" href="index.html">
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

  <nav class="nav-menu" aria-label="Menu (mobile)">
    <a href="index.html" class="nav-link">Strona główna</a>
    <a href="oferty.html" class="nav-link">Oferty</a>
    <a href="dodaj.html" class="nav-link">Dodaj ofertę</a>
    <a href="#contact" class="nav-link">Kontakt</a>

    <div class="mobile-auth" id="mobileAuth" style="display:none;">
      <a href="#" id="mobileLoginLink" class="nav-link">Zaloguj się</a>
      <a href="#" id="mobileRegisterLink" class="nav-link">Zarejestruj się</a>
    </div>
  </nav>
</header>
`;

  const INLINE_FOOTER = `
<footer id="contact">
  <div class="container">
    <div class="footer-container" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1.5rem;margin:2rem 0;">
      <div class="footer-about">
        <a href="index.html" class="footer-logo" style="display:flex;align-items:center;gap:.6rem;font-weight:700;">
          <img src="https://storage.waw.cloud.ovh.net/v1/AUTH_024f82ed62da4186825a5b526cd1a61e/FishFounder/Dzialkofert_logo.png" alt="Działkofert" style="height:32px;">
          <span>Działkofert</span>
        </a>
        <p style="opacity:.8">Bezpłatne ogłoszenia nieruchomości.</p>
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
        <p><i class="fas fa-envelope"></i> info@dzialkofert.pl</p>
        <p><i class="fas fa-phone"></i> +48 123 456 789</p>
      </div>
    </div>
    <div class="footer-bottom" style="text-align:center;border-top:1px solid #eee;padding:1rem 0;opacity:.75;">
      © 2025 Działkofert. Wszelkie prawa zastrzeżone.
    </div>
  </div>
</footer>
`;

  async function tryFetch(url){
    try{
      const res = await fetch(url,{cache:'no-cache'});
      if(!res.ok) throw new Error(res.statusText);
      return await res.text();
    }catch(e){ console.warn('[layout] fetch fail:',url,e.message); return null; }
  }

  function pathCandidates(file){
    const parts = location.pathname.split('/').filter(Boolean);
    const variants=[]; let prefix='';
    for(let i=0;i<=Math.min(3,parts.length);i++){ variants.push(prefix+'partials/'+file); prefix+='../'; }
    variants.push('/partials/'+file);
    return variants;
  }

  async function loadPiece(name, targetId){
    const mount = document.getElementById(targetId);
    if(!mount){ console.warn('[layout] No mount:',targetId); return; }

    if(isFile){
      mount.innerHTML = (name==='header') ? INLINE_HEADER : INLINE_FOOTER;
      afterInject(name); return;
    }

    const file = name + '.html';
    const urls = pathCandidates(file);
    let html=null;
    for(const u of urls){ html = await tryFetch(u); if(html) break; }
    if(!html){ console.warn(`[layout] Fallback to inline for ${name}`); html = (name==='header')?INLINE_HEADER:INLINE_FOOTER; }
    mount.innerHTML = html;
    afterInject(name);
  }

  // otwieranie modala nawet jeśli jeszcze się nie wstrzyknął
  function openModalById(id){
    const t0 = performance.now();
    (function again(){
      const m = document.getElementById(id);
      if(m){ m.style.display='flex'; return; }
      if(performance.now()-t0>1500){ console.warn('[layout] modal not found:',id); return; }
      requestAnimationFrame(again);
    })();
  }

  function afterInject(name){
    if(name!=='header') return;

    const btn = $('.mobile-menu-btn');
    const menu = $('.nav-menu');
    const mobileAuth = $('#mobileAuth');

    if(btn && menu){
      const toggle = ()=>{
        const open = !menu.classList.contains('active');
        menu.classList.toggle('active', open);
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
        if(mobileAuth) mobileAuth.style.display = open ? 'flex' : 'none';
        document.body.classList.toggle('menu-open', open);
      };
      btn.addEventListener('click', toggle);
      // zamykaj po kliknięciu w link
      menu.querySelectorAll('a').forEach(a=>a.addEventListener('click', ()=>{
        menu.classList.remove('active'); btn.setAttribute('aria-expanded','false');
        if(mobileAuth) mobileAuth.style.display='none';
      }));
      // po resize >768 zamknij
      window.addEventListener('resize', ()=>{ if(innerWidth>768){ menu.classList.remove('active'); if(mobileAuth) mobileAuth.style.display='none'; }});
    }

    // natychmiastowe bindowanie do modali
    $('#loginBtn')?.addEventListener('click', ()=> openModalById('loginModal'));
    $('#registerBtn')?.addEventListener('click', ()=> openModalById('registerModal'));
    $('#mobileLoginLink')?.addEventListener('click', (e)=>{ e.preventDefault(); openModalById('loginModal'); menu?.classList.remove('active'); mobileAuth && (mobileAuth.style.display='none'); });
    $('#mobileRegisterLink')?.addEventListener('click', (e)=>{ e.preventDefault(); openModalById('registerModal'); menu?.classList.remove('active'); mobileAuth && (mobileAuth.style.display='none'); });

    // sygnał dla auth.js
    window.dispatchEvent(new CustomEvent('layout:header-ready'));
  }

  window.addEventListener('DOMContentLoaded', ()=>{
    loadPiece('header','site-header');
    loadPiece('footer','site-footer');
  });
})();
