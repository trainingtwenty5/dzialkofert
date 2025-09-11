
/**
 * /assets/auth.js (ESM)
 * Firebase Auth + spójne podpinanie UI na KAŻDEJ stronie.
 */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth, onAuthStateChanged,
  signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile,
  GoogleAuthProvider, signInWithPopup, signInWithRedirect,
  setPersistence, browserLocalPersistence, browserSessionPersistence, inMemoryPersistence
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, query, where, getDocs, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// === Konfiguracja (ta sama co u Ciebie) ===
const firebaseConfig = {
  apiKey: "AIzaSyBdhMIiqetOfDGP85ERxtgwn3AXR50pBcE",
  authDomain: "base-468e0.firebaseapp.com",
  projectId: "base-468e0",
  storageBucket: "base-468e0.firebasestorage.app",
  messagingSenderId: "829161895559",
  appId: "1:829161895559:web:d832541aac05b35847ea22"
};

// === Init ===
const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);
auth.languageCode = 'pl';

async function useBestPersistence() {
  try { await setPersistence(auth, browserLocalPersistence); }
  catch { try { await setPersistence(auth, browserSessionPersistence); }
  catch { await setPersistence(auth, inMemoryPersistence); } }
}
await useBestPersistence();

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

/** Przyjazne komunikaty błędów */
const niceAuthError = (err) => {
  const code = err?.code || '';
  switch (code) {
    case 'auth/invalid-email':             return 'Nieprawidłowy adres e-mail.';
    case 'auth/missing-password':          return 'Podaj hasło.';
    case 'auth/invalid-credential':        return 'Nieprawidłowy e-mail lub hasło.';
    case 'auth/user-not-found':            return 'Użytkownik nie istnieje.';
    case 'auth/wrong-password':            return 'Błędne hasło.';
    case 'auth/too-many-requests':         return 'Za dużo prób. Spróbuj później.';
    case 'auth/unauthorized-domain':       return `Domena ${location.hostname} nie jest autoryzowana w Firebase (Authentication → Authorized domains).`;
    case 'auth/popup-blocked':             return 'Przeglądarka zablokowała okno logowania Google. Użyj przekierowania.';
    case 'auth/operation-not-supported-in-this-environment':
                                           return 'To środowisko nie wspiera popup (np. file://). Uruchom przez http/https.';
    default: return `Błąd: ${code || (err?.message || 'nieznany')}`;
  }
};

/** Podpięcie zdarzeń do aktualnego DOM (może być wołane wielokrotnie) */
function wireAuthUI(){
  // przyciski w top-navbarze
  const authButtons   = document.getElementById('authButtons');
  const userMenu      = document.getElementById('userMenu');
  const loginBtn      = document.getElementById('loginBtn');
  const registerBtn   = document.getElementById('registerBtn');
  const accountBtn    = document.getElementById('accountBtn');
  const logoutBtn     = document.getElementById('logoutBtn');

  // linki w menu mobilnym
  const mobileLogin   = document.getElementById('loginLink');
  const mobileReg     = document.getElementById('registerLink');

  // modale + formularze
  const loginModal    = document.getElementById('loginModal');
  const registerModal = document.getElementById('registerModal');
  const closeBtns     = document.querySelectorAll('.modal-close');
  const switchToReg   = document.getElementById('switchToRegister');
  const switchToLog   = document.getElementById('switchToLogin');
  const loginForm     = document.getElementById('loginForm');
  const registerForm  = document.getElementById('registerForm');
  const gBtn1         = document.getElementById('googleLoginBtn');
  const gBtn2         = document.getElementById('googleLoginBtnLogin');
  const userDashboard = document.getElementById('userDashboard');
  const userOffers    = document.getElementById('userOffers');

  const openModal  = (m) => m && (m.style.display = 'flex');
  const closeModal = (m) => m && (m.style.display = 'none');

  // UI handlers (usuwamy poprzednie poprzez klonowanie jeśli trzeba)
  function bindClick(el, handler){
    if (!el) return;
    const clone = el.cloneNode(true);
    el.parentNode.replaceChild(clone, el);
    clone.addEventListener('click', handler);
  }

  bindClick(loginBtn,     () => openModal(loginModal));
  bindClick(registerBtn,  () => openModal(registerModal));
  bindClick(mobileLogin,  (e) => { e.preventDefault(); openModal(loginModal);   document.querySelector('.nav-menu')?.classList.remove('active'); });
  bindClick(mobileReg,    (e) => { e.preventDefault(); openModal(registerModal);document.querySelector('.nav-menu')?.classList.remove('active'); });
  closeBtns.forEach(b => bindClick(b, () => closeModal(b.closest('.modal'))));
  bindClick(switchToReg,  (e) => { e.preventDefault(); closeModal(loginModal);  openModal(registerModal); });
  bindClick(switchToLog,  (e) => { e.preventDefault(); closeModal(registerModal); openModal(loginModal); });

  window.addEventListener('click', (e) => { if (e.target.classList?.contains('modal')) closeModal(e.target); });

  // Formularze
  if (loginForm && !loginForm.__wired){
    loginForm.__wired = true;
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value.trim();
      const pass  = document.getElementById('loginPassword').value;
      try {
        await signInWithEmailAndPassword(auth, email, pass);
      } catch (err) {
        console.error('[login]', err);
        alert(niceAuthError(err));
      }
    });
  }

  if (registerForm && !registerForm.__wired){
    registerForm.__wired = true;
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name  = document.getElementById('registerName').value.trim();
      const email = document.getElementById('registerEmail').value.trim();
      const pass1 = document.getElementById('registerPassword').value;
      const pass2 = document.getElementById('registerConfirmPassword').value;
      if (pass1 !== pass2) return alert('Hasła nie są identyczne!');
      try {
        const { user } = await createUserWithEmailAndPassword(auth, email, pass1);
        if (name) await updateProfile(user, { displayName: name });
        await setDoc(doc(db, "users", user.uid), { name: name || null, email, createdAt: new Date(), provider: "password" }, { merge: true });
      } catch (err) {
        console.error('[register]', err);
        alert(niceAuthError(err));
      }
    });
  }

  // Google
  async function signInWithGoogleSmart() {
    const ok = ['http:', 'https:'].includes(location.protocol);
    if (!ok) return alert('Uruchom stronę przez http/https (nie file://).');
    try {
      await signInWithPopup(auth, googleProvider);
      closeModal(loginModal); closeModal(registerModal);
    } catch (err) {
      console.error('[google]', err);
      if (err?.code === 'auth/popup-blocked' || err?.code === 'auth/operation-not-supported-in-this-environment') {
        await signInWithRedirect(auth, googleProvider);
      } else {
        alert(niceAuthError(err));
      }
    }
  }
  bindClick(gBtn1, (e)=>{ e.preventDefault(); signInWithGoogleSmart(); });
  bindClick(gBtn2, (e)=>{ e.preventDefault(); signInWithGoogleSmart(); });

  // Wylogowanie
  bindClick(logoutBtn, async ()=>{ try{ await auth.signOut(); }catch(e){} });

  // Stan auth
  if (!auth.__observerSet){
    auth.__observerSet = true;
    onAuthStateChanged(auth, (user) => {
      if (user) {
        authButtons && (authButtons.style.display = 'none');
        userMenu    && (userMenu.style.display = 'flex');
        if (accountBtn) {
          const label = user.displayName ? user.displayName.split(' ')[0] : (user.email || 'Moje konto');
          accountBtn.innerHTML = `<i class="fas fa-user me-1"></i> ${label}`;
        }
        userDashboard && (userDashboard.style.display = 'block');
        if (userOffers) loadUserOffers(user.email || null, user.uid || null, userOffers);
        // zamknij ewentualne modale
        document.querySelectorAll('.modal').forEach(m => m.style.display='none');
      } else {
        authButtons && (authButtons.style.display = 'flex');
        userMenu    && (userMenu.style.display = 'none');
        userDashboard && (userDashboard.style.display = 'none');
        if (userOffers) userOffers.innerHTML = '';
      }
    });
  }
}

/** Ładowanie ofert użytkownika (opcjonalne) */
import { where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
async function loadUserOffers(email, uid, mount){
  if (!mount) return;
  mount.innerHTML = '<p>Ładuję Twoje oferty…</p>';
  try {
    const colRef = collection(db, "propertyListings");
    const qs = [];
    if (email){ qs.push(getDocs(query(colRef, where("email","==",email)))); qs.push(getDocs(query(colRef, where("userEmail","==",email)))); }
    if (uid){   qs.push(getDocs(query(colRef, where("userUid","==",uid)))); qs.push(getDocs(query(colRef, where("uid","==",uid)))); qs.push(getDocs(query(colRef, where("ownerId","==",uid)))); }
    const results = await Promise.allSettled(qs);
    const docsById = new Map();
    results.forEach(r => { if (r.status==='fulfilled') r.value.forEach(d => docsById.set(d.id,d)); });
    mount.innerHTML = '';
    if (docsById.size===0) { mount.innerHTML = '<p>Nie masz jeszcze żadnych ofert.</p>'; return; }
    docsById.forEach(docSnap => {
      const offer = docSnap.data();
      const offerId = docSnap.id;
      if (!Array.isArray(offer.plots)) return;
      offer.plots.forEach((plot, idx) => {
        if (plot?.mock === false) return;
        const el = document.createElement('div');
        el.className = 'offer-card';
        const price = Number(plot.price || 0);
        const area  = Number(plot.pow_dzialki_m2_uldk || 0);
        const ppm2  = price && area ? Math.round(price / area) : 0;
        const city  = offer.city || 'Nie podano';
        const phone = offer.phone || 'Nie podano';
        const title = plot.Id || `Działka ${idx + 1}`;
        const detailsUrl = `oferta.html?id=${offerId}&plot=${idx}`;
        el.innerHTML = `
          <h3 class="offer-title">${title}</h3>
          <div class="offer-details">
            <p><strong>Lokalizacja:</strong> ${city}</p>
            <p><strong>Telefon:</strong> ${phone}</p>
            ${area  ? `<p><strong>Powierzchnia:</strong> ${area.toLocaleString('pl-PL')} m²</p>` : ''}
            ${price ? `<p><strong>Cena całkowita:</strong> ${price.toLocaleString('pl-PL')} zł
              ${ppm2 ? `<span style="color:#888;font-size:.85em;margin-left:5px;">${ppm2.toLocaleString('pl-PL')} zł/m²</span>` : ''}
            </p>` : ''}
          </div>
          <div class="offer-actions">
            <a class="btn btn-secondary btn-sm" target="_blank" href="${detailsUrl}">
              <i class="fas fa-info-circle"></i> Szczegóły
            </a>
          </div>
        `;
        mount.appendChild(el);
      });
    });
    if (!mount.querySelector('.offer-card')) mount.innerHTML = '<p>Nie masz jeszcze żadnych aktywnych ofert.</p>';
  } catch (e){
    console.error(e);
    mount.innerHTML = '<p>Wystąpił błąd podczas ładowania ofert.</p>';
  }
}

// gdy partiale się załadują — podpinamy UI
document.addEventListener('partials:loaded', wireAuthUI);
// gdy DOM jest gotowy (na wypadek, gdy ktoś wkleił modale bez partiali)
if (document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', wireAuthUI);
} else {
  wireAuthUI();
}

// prosta wskazówka domenowa
(function domainHint(){
  const hint = document.getElementById('domainWarning');
  if (!hint) return;
  const knownGood = ['localhost','127.0.0.1'];
  if (!knownGood.includes(location.hostname)) hint.style.display = 'block';
})();
