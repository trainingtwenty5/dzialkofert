// js/index.js
// Proste UI: mobile menu + FAQ akordeony + linki z mobilnego auth
(function(){
  const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
  const navMenu = document.querySelector('.nav-menu');
  const mobileAuth = document.getElementById('mobileAuth');

  if (mobileMenuBtn && navMenu){
    const toggleMenu = () => {
      const open = !navMenu.classList.contains('active');
      navMenu.classList.toggle('active', open);
      navMenu.setAttribute('aria-hidden', open ? 'false' : 'true');
      mobileMenuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.classList.toggle('menu-open', open);
      if (mobileAuth) mobileAuth.style.display = open ? 'flex' : 'none';
    };
    mobileMenuBtn.addEventListener('click', toggleMenu);
    navMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', ()=>{
      navMenu.classList.remove('active');
      navMenu.setAttribute('aria-hidden', 'true');
      mobileMenuBtn.setAttribute('aria-expanded','false');
      document.body.classList.remove('menu-open');
      if (mobileAuth) mobileAuth.style.display = 'none';
    }));
  }

  // FAQ
  document.querySelectorAll('.faq-item .faq-question').forEach(q => {
    q.addEventListener('click', () => q.parentElement.classList.toggle('active'));
  });
})();
