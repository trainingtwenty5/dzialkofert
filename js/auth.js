// js/auth.js
import { initializeApp, getApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth, onAuthStateChanged, signOut,
  signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile,
  GoogleAuthProvider, signInWithPopup, signInWithRedirect,
  setPersistence, browserLocalPersistence, browserSessionPersistence, inMemoryPersistence
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore, doc, setDoc, getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* ------------------ Firebase ------------------ */
const firebaseConfig = {
  apiKey: "AIzaSyBdhMIiqetOfDGP85ERxtgwn3AXR50pBcE",
  authDomain: "base-468e0.firebaseapp.com",
  projectId: "base-468e0",
  storageBucket: "base-468e0.firebasestorage.app",
  messagingSenderId: "829161895559",
  appId: "1:829161895559:web:d832541aac05b35847ea22"
};

const app  = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);
auth.languageCode = 'pl';

/* ------------------ UI helpers ------------------ */
function toast(msg){ try{ (window.showToast ? window.showToast(msg,'info') : console.log('[TOAST]', msg)); }catch{} }
const openModal  = (m) => m && (m.style.display = 'flex');
const closeModal = (m) => m && (m.style.display = 'none');

/* Wstrzyknięcie reguł, które PRZEBIJAJĄ inline style w desktop top-navbar */
(function injectTopbarAuthCSS(){
  const css = `
    .top-navbar #authButtons { display: flex; }
    .top-navbar #userMenu    { display: none; }
    body.auth .top-navbar #authButtons { display: none !important; }
    body.auth .top-navbar #userMenu    { display: flex !important; }
  `;
  const s = document.createElement('style');
  s.setAttribute('data-auth-topbar-css','true');
  s.appendChild(document.createTextNode(css));
  document.head.appendChild(s);
})();

/* ------------------ DOM refs (pozwalamy na brak elementów) ------------------ */
const $authButtons = Array.from(document.querySelectorAll('#authButtons'));
const $userMenus   = Array.from(document.querySelectorAll('#userMenu'));
const $accountBtns = Array.from(document.querySelectorAll('#accountBtn'));
const $userDash    = Array.from(document.querySelectorAll('#userDashboard'));

const loginBtn      = document.getElementById('loginBtn');
const registerBtn   = document.getElementById('registerBtn');
const logoutBtn     = document.getElementById('logoutBtn');

const loginModal    = document.getElementById('loginModal');
const registerModal = document.getElementById('registerModal');
const closeBtns     = document.querySelectorAll('.modal-close');

const switchToRegister = document.getElementById('switchToRegister');
const switchToLogin    = document.getElementById('switchToLogin');

const loginForm     = document.getElementById('loginForm');
const registerForm  = document.getElementById('registerForm');

const googleBtnRegister = document.getElementById('googleLoginBtn');
const googleBtnLogin    = document.getElementById('googleLoginBtnLogin');

// Mobile links
const loginLink    = document.getElementById('loginLink');
const registerLink = document.getElementById('registerLink');
const navMenu      = document.querySelector('.nav-menu');

/* ------------------ Persistence fallback ------------------ */
try { await setPersistence(auth, browserLocalPersistence); }
catch { try { await setPersistence(auth, browserSessionPersistence); }
catch { await setPersistence(auth, inMemoryPersistence); } }

/* ------------------ Providers ------------------ */
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

/* ------------------ Domain warning (opcjonalne) ------------------ */
const domainWarning = document.getElementById('domainWarning');
const okDomains = ['localhost','127.0.0.1','trainingtwenty5.github.io','twojadomena.pl'];
if (domainWarning && !okDomains.includes(location.hostname)) domainWarning.style.display = 'block';

/* ------------------ Modals open/close ------------------ */
loginBtn    && loginBtn.addEventListener('click', () => openModal(loginModal));
registerBtn && registerBtn.addEventListener('click', () => openModal(registerModal));

loginLink && loginLink.addEventListener('click', (e)=>{
  e.preventDefault(); navMenu?.classList.remove('active');
  document.body.classList.remove('menu-open');
  openModal(loginModal);
});
registerLink && registerLink.addEventListener('click', (e)=>{
  e.preventDefault(); navMenu?.classList.remove('active');
  document.body.classList.remove('menu-open');
  openModal(registerModal);
});

switchToRegister && switchToRegister.addEventListener('click', (e)=>{ e.preventDefault(); closeModal(loginModal);  openModal(registerModal); });
switchToLogin    && switchToLogin.addEventListener('click',    (e)=>{ e.preventDefault(); closeModal(registerModal); openModal(loginModal); });

closeBtns.forEach(b => b.addEventListener('click', () => closeModal(b.closest('.modal'))));
window.addEventListener('click', (e) => { if (e.target.classList?.contains('modal')) closeModal(e.target); });

/* ------------------ Errors ------------------ */
const niceErr = (err) => {
  switch (err?.code) {
    case 'auth/invalid-email': return 'Nieprawidłowy adres e-mail.';
    case 'auth/missing-password': return 'Podaj hasło.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential': return 'Nieprawidłowy e-mail lub hasło.';
    case 'auth/too-many-requests': return 'Za dużo prób. Spróbuj później.';
    case 'auth/unauthorized-domain': return `Domena ${location.hostname} nie jest dodana w Firebase (Authorized domains).`;
    case 'auth/popup-blocked': return 'Przeglądarka zablokowała okno logowania Google.';
    case 'auth/operation-not-supported-in-this-environment': return 'Uruchom stronę przez http/https (nie file://).';
    default: return 'Błąd: ' + (err?.code || err?.message || 'nieznany');
  }
};

/* ------------------ E-mail/hasło ------------------ */
loginForm && loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const pass  = document.getElementById('loginPassword').value;
  try { await signInWithEmailAndPassword(auth, email, pass); closeModal(loginModal); }
  catch (err) { toast(niceErr(err)); }
});

registerForm && registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name  = document.getElementById('registerName').value.trim();
  const email = document.getElementById('registerEmail').value.trim();
  const pass1 = document.getElementById('registerPassword').value;
  const pass2 = document.getElementById('registerConfirmPassword').value;
  if (pass1 !== pass2) return toast('Hasła nie są identyczne!');
  try {
    const { user } = await createUserWithEmailAndPassword(auth, email, pass1);
    if (name) await updateProfile(user, { displayName: name });
    const uref = doc(db, "users", user.uid);
    const udoc = await getDoc(uref);
    if (!udoc.exists()) {
      await setDoc(uref, { name: name || null, email, createdAt: new Date(), provider: 'password' }, { merge: true });
    }
    closeModal(registerModal);
  } catch (err) { toast(niceErr(err)); }
});

/* ------------------ Google ------------------ */
async function signInWithGoogleSmart() {
  if (!['http:', 'https:'].includes(location.protocol))
    return toast('Uruchom stronę przez http/https (nie file://).');
  try {
    const res = await signInWithPopup(auth, googleProvider);
    const user = res.user;
    const uref = doc(db, "users", user.uid);
    const udoc = await getDoc(uref);
    if (!udoc.exists()) {
      await setDoc(uref, { name: user.displayName, email: user.email, createdAt: new Date(), provider: 'google' });
    }
    closeModal(loginModal); closeModal(registerModal);
  } catch (err) {
    if (['auth/popup-blocked','auth/operation-not-supported-in-this-environment'].includes(err?.code)) {
      await signInWithRedirect(auth, googleProvider);
    } else { toast(niceErr(err)); }
  }
}
[googleBtnRegister, googleBtnLogin].forEach(btn =>
  btn && btn.addEventListener('click', (e)=>{ e.preventDefault(); signInWithGoogleSmart(); })
);

/* ------------------ UI state ------------------ */
function applyAuthUI(user) {
  const isAuth = !!user;

  // 1) klasa na <body> (napędza nasze CSS z !important)
  document.body.classList.toggle('auth', isAuth);

  // 2) fallback inline (gdyby ktoś nadpisał styles)
  $authButtons.forEach(el => { if (!el) return; el.style.display = isAuth ? 'none' : 'flex'; });
  $userMenus.forEach(el   => { if (!el) return; el.style.display = isAuth ? 'flex' : 'none'; });
  $userDash.forEach(el    => { if (!el) return; el.style.display = isAuth ? 'block' : 'none'; });

  // 3) podpis „Moje konto”
  const label = isAuth ? (user.displayName || user.email || 'Moje konto') : 'Moje konto';
  $accountBtns.forEach(btn => { if (!btn) return; btn.innerHTML = `<i class="fas fa-user me-1"></i> ${label}`; });

  // 4) udostępnij globalnie (np. do loadUserOffers)
  window.currentUserEmail = isAuth ? (user.email || null) : null;
  window.currentUserUid   = isAuth ? (user.uid   || null) : null;

  // 5) załaduj oferty użytkownika (jeśli funkcja istnieje na stronie)
  if (isAuth && typeof window.loadUserOffers === 'function') {
    try { window.loadUserOffers(window.currentUserEmail, window.currentUserUid); }
    catch(e){ console.warn('[loadUserOffers]', e); }
  }
}

/* natychmiastowa próba ustawienia UI po załadowaniu DOM */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => applyAuthUI(auth.currentUser));
} else {
  applyAuthUI(auth.currentUser);
}

/* i pełna synchronizacja przez Firebase */
onAuthStateChanged(auth, (user) => applyAuthUI(user));

/* ------------------ Logout ------------------ */
logoutBtn && logoutBtn.addEventListener('click', async () => {
  try { await signOut(auth); } catch(_) {}
});

/* ------------------ Exports ------------------ */
export { auth, db };
