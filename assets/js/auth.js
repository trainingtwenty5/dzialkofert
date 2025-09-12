// auth.js
// Uwaga: brak top-level await i brak optional chaining – działa też na starszych przeglądarkach.

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth, onAuthStateChanged, signOut,
  signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile,
  GoogleAuthProvider, signInWithPopup, signInWithRedirect,
  setPersistence, browserLocalPersistence, browserSessionPersistence, inMemoryPersistence
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

console.log('[auth.js] start');

// --- Konfiguracja ---
const firebaseConfig = {
  apiKey: "AIzaSyBdhMIiqetOfDGP85ERxtgwn3AXR50pBcE",
  authDomain: "base-468e0.firebaseapp.com",
  projectId: "base-468e0",
  storageBucket: "base-468e0.firebasestorage.app",
  messagingSenderId: "829161895559",
  appId: "1:829161895559:web:d832541aac05b35847ea22"
};

// --- Init ---
export const app  = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db   = getFirestore(app);
auth.languageCode = 'pl';

// Persystencja – bez top-level await
(function useBestPersistence(){
  setPersistence(auth, browserLocalPersistence).catch(function(){
    return setPersistence(auth, browserSessionPersistence);
  }).catch(function(){
    return setPersistence(auth, inMemoryPersistence);
  }).catch(function(e){
    console.warn('[auth.js] persistence error', e);
  });
})();

// DOM refs (pobieramy po załadowaniu DOM, żeby nic nie było null)
document.addEventListener('DOMContentLoaded', function(){
  console.log('[auth.js] DOMContentLoaded');

  var authButtons   = document.getElementById('authButtons');
  var userMenu      = document.getElementById('userMenu');
  var loginBtn      = document.getElementById('loginBtn');
  var registerBtn   = document.getElementById('registerBtn');
  var accountBtn    = document.getElementById('accountBtn');
  var logoutBtn     = document.getElementById('logoutBtn');
  var loginModal    = document.getElementById('loginModal');
  var registerModal = document.getElementById('registerModal');
  var closeBtns     = document.querySelectorAll('.modal-close');
  var switchToReg   = document.getElementById('switchToRegister');
  var switchToLog   = document.getElementById('switchToLogin');
  var loginForm     = document.getElementById('loginForm');
  var registerForm  = document.getElementById('registerForm');

  function openModal(m){ if (m) m.style.display = 'flex'; }
  function closeModal(m){ if (m) m.style.display = 'none'; }
  window.__openLoginModal = function(){ openModal(loginModal); };
  window.__openRegisterModal = function(){ openModal(registerModal); };

  // Domena – hint
  var hint = document.getElementById('domainWarning');
  if (hint) {
    var knownGood = ['localhost','127.0.0.1','trainingtwenty5.github.io'];
    if (knownGood.indexOf(location.hostname) === -1) hint.style.display = 'block';
  }

  // Google provider
  var googleProvider = new GoogleAuthProvider();
  googleProvider.setCustomParameters({ prompt: 'select_account' });

  function renderMobileAuth(user){
    var navMenu = document.querySelector('.nav-menu');
    var mobileAuthC = document.getElementById('mobileAuth');
    if (!mobileAuthC) return;

    if (user) {
      var label = user.displayName ? user.displayName.split(' ')[0] : (user.email || 'Użytkownik');
      mobileAuthC.innerHTML =
        '<div class="nav-link" style="font-weight:600;">' +
          '<i class="fas fa-user"></i> ' + label +
        '</div>' +
        '<a href="#userDashboard" class="nav-link" id="mobileAccountLink">Moje konto</a>' +
        '<button class="btn btn-secondary" id="mobileLogoutBtn" style="width:100%;">' +
          '<i class="fas fa-sign-out-alt"></i> Wyloguj się' +
        '</button>';
    } else {
      mobileAuthC.innerHTML =
        '<a href="#" id="loginLink" class="nav-link">Zaloguj się</a>' +
        '<a href="#" id="registerLink" class="nav-link">Zarejestruj się</a>';
    }

    var loginLink = document.getElementById('loginLink');
    var registerLink = document.getElementById('registerLink');
    var mobileLogoutBtn = document.getElementById('mobileLogoutBtn');
    var mobileAccountLink = document.getElementById('mobileAccountLink');

    if (loginLink) loginLink.addEventListener('click', function(e){
      e.preventDefault();
      openModal(loginModal);
      if (navMenu) navMenu.classList.remove('active');
      mobileAuthC.style.display = 'none';
    });

    if (registerLink) registerLink.addEventListener('click', function(e){
      e.preventDefault();
      openModal(registerModal);
      if (navMenu) navMenu.classList.remove('active');
      mobileAuthC.style.display = 'none';
    });

    if (mobileLogoutBtn) mobileLogoutBtn.addEventListener('click', function(){
      signOut(auth).catch(function(e){ console.error(e); });
      if (navMenu) navMenu.classList.remove('active');
      mobileAuthC.style.display = 'none';
    });

    if (mobileAccountLink) mobileAccountLink.addEventListener('click', function(e){
      e.preventDefault();
      var ud = document.getElementById('userDashboard');
      if (ud && ud.scrollIntoView) ud.scrollIntoView({behavior:'smooth'});
      if (navMenu) navMenu.classList.remove('active');
      mobileAuthC.style.display = 'none';
    });

    if (mobileAuthC) {
      var show = navMenu && navMenu.classList.contains('active');
      mobileAuthC.style.display = show ? 'flex' : 'none';
    }
  }

  function niceAuthError(err){
    var code = (err && err.code) ? err.code : '';
    switch (code) {
      case 'auth/invalid-email':             return 'Nieprawidłowy adres e-mail.';
      case 'auth/missing-password':          return 'Podaj hasło.';
      case 'auth/invalid-credential':        return 'Nieprawidłowy e-mail lub hasło.';
      case 'auth/user-not-found':            return 'Użytkownik nie istnieje.';
      case 'auth/wrong-password':            return 'Błędne hasło.';
      case 'auth/too-many-requests':         return 'Za dużo prób. Spróbuj później.';
      case 'auth/unauthorized-domain':       return 'Domena nie jest autoryzowana w Firebase.';
      case 'auth/popup-blocked':             return 'Okno Google zablokowane. Użyj przekierowania.';
      case 'auth/operation-not-supported-in-this-environment':
                                             return 'To środowisko nie wspiera popup (np. file://).';
      default: return 'Błąd: ' + (code || (err && err.message) || 'nieznany');
    }
  }

  // Zdarzenia UI auth
  if (loginBtn)    loginBtn.addEventListener('click', function(){ openModal(loginModal); });
  if (registerBtn) registerBtn.addEventListener('click', function(){ openModal(registerModal); });
  if (switchToReg) switchToReg.addEventListener('click', function(e){ e.preventDefault(); closeModal(loginModal);  openModal(registerModal); });
  if (switchToLog) switchToLog.addEventListener('click', function(e){ e.preventDefault(); closeModal(registerModal); openModal(loginModal); });
  if (closeBtns && closeBtns.length) {
    for (var i=0;i<closeBtns.length;i++){
      closeBtns[i].addEventListener('click', function(){
        var m = this.closest('.modal');
        if (m) closeModal(m);
      });
    }
  }
  window.addEventListener('click', function(e){
    if (e.target && e.target.classList && e.target.classList.contains('modal')) closeModal(e.target);
  });

  if (accountBtn) accountBtn.addEventListener('click', function(){
    var ud = document.getElementById('userDashboard');
    if (ud && ud.scrollIntoView) ud.scrollIntoView({behavior:'smooth'});
  });

  if (loginForm) loginForm.addEventListener('submit', function(e){
    e.preventDefault();
    var email = (document.getElementById('loginEmail').value || '').trim();
    var pass  = document.getElementById('loginPassword').value;
    signInWithEmailAndPassword(auth, email, pass).catch(function(err){
      console.error('[login]', err); alert(niceAuthError(err));
    });
  });

  if (registerForm) registerForm.addEventListener('submit', function(e){
    e.preventDefault();
    var name  = (document.getElementById('registerName').value || '').trim();
    var email = (document.getElementById('registerEmail').value || '').trim();
    var pass1 = document.getElementById('registerPassword').value;
    var pass2 = document.getElementById('registerConfirmPassword').value;
    if (pass1 !== pass2) { alert('Hasła nie są identyczne!'); return; }
    createUserWithEmailAndPassword(auth, email, pass1)
      .then(function(res){
        var user = res.user;
        var p = [];
        if (name) p.push(updateProfile(user, { displayName: name }));
        p.push(setDoc(doc(db, "users", user.uid), { name: name || null, email: email, createdAt: new Date(), provider: "password" }, { merge: true }));
        return Promise.all(p);
      })
      .catch(function(err){
        console.error('[register]', err); alert(niceAuthError(err));
      });
  });

  function signInWithGoogleSmart(){
    var ok = (location && (location.protocol === 'http:' || location.protocol === 'https:'));
    if (!ok) { alert('Uruchom stronę przez http/https (nie file://).'); return; }
    signInWithPopup(auth, googleProvider)
      .then(function(){
        closeModal(loginModal); closeModal(registerModal);
        var nav = document.querySelector('.nav-menu');
        if (nav) nav.classList.remove('active');
        var mAuth = document.getElementById('mobileAuth');
        if (mAuth) mAuth.style.display = 'none';
      })
      .catch(function(err){
        console.error('[google]', err);
        if (err && (err.code === 'auth/popup-blocked' || err.code === 'auth/operation-not-supported-in-this-environment')) {
          signInWithRedirect(auth, googleProvider);
        } else {
          alert(niceAuthError(err));
        }
      });
  }
  var gBtn1 = document.getElementById('googleLoginBtn');
  var gBtn2 = document.getElementById('googleLoginBtnLogin');
  if (gBtn1) gBtn1.addEventListener('click', function(e){ e.preventDefault(); signInWithGoogleSmart(); });
  if (gBtn2) gBtn2.addEventListener('click', function(e){ e.preventDefault(); signInWithGoogleSmart(); });

  if (logoutBtn) logoutBtn.addEventListener('click', function(){
    signOut(auth).catch(function(e){ console.error(e); });
  });

  // Stan auth → UI + event dla innych modułów
  onAuthStateChanged(auth, function(user){
    console.log('[auth.js] onAuthStateChanged', !!user);
    if (user) {
      if (authButtons) authButtons.style.display = 'none';
      if (userMenu)    userMenu.style.display = 'flex';
      if (accountBtn) {
        var label = user.displayName ? user.displayName.split(' ')[0] : (user.email || 'Moje konto');
        accountBtn.innerHTML = '<i class="fas fa-user me-1"></i> ' + label;
      }
    } else {
      if (authButtons) authButtons.style.display = 'flex';
      if (userMenu)    userMenu.style.display = 'none';
    }
    renderMobileAuth(user);
    document.dispatchEvent(new CustomEvent('auth:state', { detail: { user: user } }));
  });

});
