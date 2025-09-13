// Toggle menu mobilnego + auto-zamykanie przy resize
document.addEventListener("DOMContentLoaded", () => {
  const mobileMenuBtn = document.querySelector(".mobile-menu-btn");
  const navMenu = document.querySelector(".nav-menu");
  const mobileAuth = document.getElementById("mobileAuth");

  mobileMenuBtn?.addEventListener("click", () => {
    navMenu.classList.toggle("active");
    if (mobileAuth) {
      mobileAuth.style.display = navMenu.classList.contains("active") ? "flex" : "none";
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 768) {
      navMenu.classList.remove("active");
      if (mobileAuth) mobileAuth.style.display = "none";
    }
  });
});

// Funkcje do otwierania modali (obsłuży auth.js)
const openLoginModal    = () => window.dispatchEvent(new Event("ui:openLoginModal"));
const openRegisterModal = () => window.dispatchEvent(new Event("ui:openRegisterModal"));

// Render sekcji auth w menu mobilnym
function renderMobileAuth(user) {
  const navMenu = document.querySelector(".nav-menu");
  const mobileAuthC = document.getElementById("mobileAuth");
  if (!mobileAuthC) return;

  if (user) {
    const label = user.displayName ? user.displayName.split(" ")[0] : (user.email || "Użytkownik");
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

  const loginLink = document.getElementById("loginLink");
  const registerLink = document.getElementById("registerLink");
  const mobileLogoutBtn = document.getElementById("mobileLogoutBtn");
  const mobileAccountLink = document.getElementById("mobileAccountLink");

  loginLink && loginLink.addEventListener("click", (e) => {
    e.preventDefault();
    openLoginModal();
    navMenu?.classList.remove("active");
    mobileAuthC.style.display = "none";
  });

  registerLink && registerLink.addEventListener("click", (e) => {
    e.preventDefault();
    openRegisterModal();
    navMenu?.classList.remove("active");
    mobileAuthC.style.display = "none";
  });

  mobileLogoutBtn && mobileLogoutBtn.addEventListener("click", () => {
    window.dispatchEvent(new Event("auth:logoutRequest"));
    navMenu?.classList.remove("active");
    mobileAuthC.style.display = "none";
  });

  mobileAccountLink && mobileAccountLink.addEventListener("click", (e) => {
    e.preventDefault();
    document.getElementById("userDashboard")?.scrollIntoView({behavior:"smooth"});
    navMenu?.classList.remove("active");
    mobileAuthC.style.display = "none";
  });

  // dopasuj widoczność do stanu menu
  const isOpen = navMenu?.classList.contains("active");
  mobileAuthC.style.display = isOpen ? "flex" : "none";
}

// Reakcje na login/logout – aktualizacja mobile-auth
window.addEventListener("auth:login", (ev) => {
  renderMobileAuth(ev.detail.user);
  document.querySelector(".nav-menu")?.classList.remove("active");
  document.getElementById("mobileAuth")?.setAttribute("style","display:none;");
});
window.addEventListener("auth:logout", () => {
  renderMobileAuth(null);
});

// „Moje konto” (desktop)
document.getElementById("accountBtn")?.addEventListener("click", () => {
  document.getElementById("userDashboard")?.scrollIntoView({behavior:"smooth"});
});
