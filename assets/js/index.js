// index.js – hamburger + FAQ (bez optional chaining)
console.log('[index.js] start');

document.addEventListener('DOMContentLoaded', function(){
  console.log('[index.js] DOMContentLoaded');

  var mobileMenuBtn = document.querySelector('.mobile-menu-btn');
  var navMenu = document.querySelector('.nav-menu');
  var mobileAuth = document.getElementById('mobileAuth');

  function syncMobileAuthVisibility(){
    if (!mobileAuth || !navMenu) return;
    mobileAuth.style.display = navMenu.classList.contains('active') ? 'flex' : 'none';
  }

  if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', function(){
      if (!navMenu) return;
      navMenu.classList.toggle('active');
      syncMobileAuthVisibility();
    });
  }

  window.addEventListener('resize', function(){
    if (window.innerWidth > 768 && navMenu) {
      navMenu.classList.remove('active');
      if (mobileAuth) mobileAuth.style.display = 'none';
    }
  });

  // FAQ akordeon
  var items = document.querySelectorAll('.faq-item');
  for (var i=0;i<items.length;i++){
    (function(item){
      var q = item.querySelector('.faq-question');
      if (q) q.addEventListener('click', function(){ item.classList.toggle('active'); });
    })(items[i]);
  }
});
