// partials/header.js
export default `
<div class="top-navbar">
  <div class="contact-info">
    <i class="fas fa-clock"></i> Poniedziałek - Piątek 9:00 - 18:00
    <span><i class="fas fa-phone"></i> +48 505 849 404</span>
  </div>

  <div class="auth-buttons" id="authButtons">
    <button class="btn btn-outline-primary btn-sm me-2" id="loginBtn">
      <i class="fas fa-sign-in-alt me-1"></i> Zaloguj się
    </button>
    <button class="btn btn-primary btn-sm" id="registerBtn">
      <i class="fas fa-user-plus me-1"></i> Zarejestruj się
    </button>
  </div>

  <div class="user-menu" id="userMenu" style="display:none;">
    <button class="btn btn-outline-primary btn-sm me-2" id="accountBtn">
      <i class="fas fa-user me-1"></i> Moje konto
    </button>
    <button class="btn btn-secondary btn-sm ms-2" id="logoutBtn">
      <i class="fas fa-sign-out-alt me-1"></i> Wyloguj
    </button>
  </div>
</div>

<header>
  <a href="index.html" class="logo" aria-label="Działkofert">
    <img src="brand-assets/android-chrome-192x192.png"
         srcset="brand-assets/android-chrome-192x192.png 1x, brand-assets/android-chrome-512x512.png 2x"
         alt="Działkofert" width="40" height="40" loading="eager" decoding="async" fetchpriority="high" />
    <span>Działkofert</span>
  </a>

  <nav class="desktop-nav">
    <a href="index.html" class="nav-link">Strona główna</a>
    <a href="oferty.html" class="nav-link">Oferty</a>
    <a href="#contact" class="nav-link">Kontakt</a>
  </nav>

  <a href="dodaj.html" class="desktop-add-offer"><i class="fas fa-plus"></i> Dodaj ofertę</a>
  <a href="dodaj.html" class="mobile-add-offer"><i class="fas fa-plus"></i> Dodaj ofertę</a>

  <button class="mobile-menu-btn" aria-label="Otwórz menu">
    <i class="fas fa-bars"></i>
  </button>

  <nav class="nav-menu">
    <a href="index.html" class="nav-link">Strona główna</a>
    <a href="oferty.html" class="nav-link">Oferty</a>
    <a href="dodaj.html" class="nav-link">Dodaj ofertę</a>
    <a href="#contact" class="nav-link">Kontakt</a>
    <div class="mobile-auth" id="mobileAuth" style="display:none;"></div>
  </nav>
</header>

<!-- Modale -->
<div class="modal" id="loginModal">
  <div class="modal-content">
    <div class="modal-header">
      <h3>Zaloguj się</h3>
      <button class="modal-close" aria-label="Zamknij">&times;</button>
    </div>
    <form id="loginForm">
      <div class="form-group">
        <label for="loginEmail">Email</label>
        <input type="email" id="loginEmail" required>
      </div>
      <div class="form-group">
        <label for="loginPassword">Hasło</label>
        <input type="password" id="loginPassword" required>
      </div>
      <button type="submit" class="btn btn-primary" style="width:100%;">Zaloguj się</button>
    </form>
    <div class="social-login">
      <button type="button" class="btn btn-google" id="googleLoginBtnLogin">
        <i class="fab fa-google"></i> Kontynuuj z Google
      </button>
    </div>
    <div class="form-footer">
      <p>Nie masz konta? <a href="#" id="switchToRegister">Zarejestruj się</a></p>
    </div>
  </div>
</div>

<div class="modal" id="registerModal">
  <div class="modal-content">
    <div class="modal-header">
      <h3>Utwórz konto</h3>
      <button class="modal-close" aria-label="Zamknij">&times;</button>
    </div>
    <form id="registerForm">
      <div class="form-group">
        <label for="registerName">Imię i nazwisko</label>
        <input type="text" id="registerName" required>
      </div>
      <div class="form-group">
        <label for="registerEmail">Email</label>
        <input type="email" id="registerEmail" required>
      </div>
      <div class="form-group">
        <label for="registerPassword">Hasło</label>
        <input type="password" id="registerPassword" required>
      </div>
      <div class="form-group">
        <label for="registerConfirmPassword">Potwierdź hasło</label>
        <input type="password" id="registerConfirmPassword" required>
      </div>
      <button type="submit" class="btn btn-primary" style="width:100%;">Zarejestruj się</button>
    </form>
    <div class="social-login mt-3 text-center">
      <button type="button" class="btn btn-google w-100 mb-2" id="googleLoginBtn">
        <i class="fab fa-google"></i> Kontynuuj z Google
      </button>
    </div>
    <div class="domain-warning" id="domainWarning" style="display:none;">
      <i class="fas fa-exclamation-triangle"></i>
      Uwaga: Logowanie przez Facebook może nie działać na tej domenie.
    </div>
    <div class="form-footer">
      <p>Masz już konto? <a href="#" id="switchToLogin">Zaloguj się</a></p>
    </div>
  </div>
</div>
`;
