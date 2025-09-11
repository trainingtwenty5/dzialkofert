// assets/auth-ui.js
// Wstrzykuje modale jeśli nie ma ich w DOM, żeby przyciski zawsze miały cel.
(function(){
  function inject(){
    if(document.getElementById('loginModal') && document.getElementById('registerModal')) return;
    const html = `
<div class="modal" id="loginModal" style="display:none;">
  <div class="modal-content">
    <div class="modal-header">
      <h3>Zaloguj się</h3>
      <button class="modal-close" aria-label="Zamknij">&times;</button>
    </div>
    <form id="loginForm">
      <div class="form-group"><label for="loginEmail">Email</label><input type="email" id="loginEmail" required/></div>
      <div class="form-group"><label for="loginPassword">Hasło</label><input type="password" id="loginPassword" required/></div>
      <button type="submit" class="btn btn-primary" style="width:100%;">Zaloguj się</button>
    </form>
    <div class="social-login" style="margin-top:.75rem;text-align:center;">
      <button type="button" class="btn btn-primary" id="googleLoginBtnLogin"><i class="fab fa-google"></i> Kontynuuj z Google</button>
    </div>
    <div class="form-footer"><p>Nie masz konta? <a href="#" id="switchToRegister">Zarejestruj się</a></p></div>
  </div>
</div>

<div class="modal" id="registerModal" style="display:none;">
  <div class="modal-content">
    <div class="modal-header">
      <h3>Utwórz konto</h3>
      <button class="modal-close" aria-label="Zamknij">&times;</button>
    </div>
    <form id="registerForm">
      <div class="form-group"><label for="registerName">Imię i nazwisko</label><input type="text" id="registerName" required/></div>
      <div class="form-group"><label for="registerEmail">Email</label><input type="email" id="registerEmail" required/></div>
      <div class="form-group"><label for="registerPassword">Hasło</label><input type="password" id="registerPassword" required/></div>
      <div class="form-group"><label for="registerConfirmPassword">Potwierdź hasło</label><input type="password" id="registerConfirmPassword" required/></div>
      <button type="submit" class="btn btn-primary" style="width:100%;">Zarejestruj się</button>
    </form>
    <div class="social-login" style="margin-top:.75rem;text-align:center;">
      <button type="button" class="btn btn-primary" id="googleLoginBtn"><i class="fab fa-google"></i> Kontynuuj z Google</button>
    </div>
    <div class="domain-warning" id="domainWarning" style="display:none;">
      <i class="fas fa-exclamation-triangle"></i> Domena może nie być autoryzowana w Firebase.
    </div>
    <div class="form-footer"><p>Masz już konto? <a href="#" id="switchToLogin">Zaloguj się</a></p></div>
  </div>
</div>`;
    document.body.insertAdjacentHTML('beforeend', html);

    // podstawowe zamykanie
    document.querySelectorAll('.modal-close').forEach(b=>b.addEventListener('click',()=>b.closest('.modal').style.display='none'));
    window.addEventListener('click', (e)=>{ if(e.target.classList?.contains('modal')) e.target.style.display='none'; });
    document.getElementById('switchToRegister')?.addEventListener('click', (e)=>{ e.preventDefault(); document.getElementById('loginModal').style.display='none'; document.getElementById('registerModal').style.display='flex'; });
    document.getElementById('switchToLogin')?.addEventListener('click', (e)=>{ e.preventDefault(); document.getElementById('registerModal').style.display='none'; document.getElementById('loginModal').style.display='flex'; });
  }
  document.addEventListener('DOMContentLoaded', inject);
})();
