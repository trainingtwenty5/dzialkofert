// assets/js/auth.js
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth, onAuthStateChanged, signOut,
  signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile,
  GoogleAuthProvider, signInWithPopup, signInWithRedirect,
  setPersistence, browserLocalPersistence, browserSessionPersistence, inMemoryPersistence
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore, doc, setDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBdhMIiqetOfDGP85ERxtgwn3AXR50pBcE",
  authDomain: "base-468e0.firebaseapp.com",
  projectId: "base-468e0",
  storageBucket: "base-468e0.firebasestorage.app",
  messagingSenderId: "829161895559",
  appId: "1:829161895559:web:d832541aac05b35847ea22"
};

// Init only once
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);
auth.languageCode = "pl";

// najlepsza możliwa persystencja
async function useBestPersistence() {
  try { await setPersistence(auth, browserLocalPersistence); }
  catch { try { await setPersistence(auth, browserSessionPersistence); }
  catch { await setPersistence(auth, inMemoryPersistence); } }
}

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

// --- helpers
function getRefs() {
  return {
    // header/topbar
    authButtons:  document.getElementById("authButtons"),
    userMenu:     document.getElementById("userMenu"),
    accountBtn:   document.getElementById("accountBtn"),
    logoutBtn:    document.getElementById("logoutBtn"),
    loginBtn:     document.getElementById("loginBtn"),
    registerBtn:  document.getElementById("registerBtn"),
    // modals
    loginModal:    document.getElementById("loginModal"),
    registerModal: document.getElementById("registerModal"),
    closeBtns:     document.querySelectorAll(".modal-close"),
    switchToReg:   document.getElementById("switchToRegister"),
    switchToLog:   document.getElementById("switchToLogin"),
    loginForm:     document.getElementById("loginForm"),
    registerForm:  document.getElementById("registerForm"),
    // mobile
    navMenu:     document.querySelector(".nav-menu"),
    mobileAuth:  document.getElementById("mobileAuth"),
    // google
    gBtn1: document.getElementById("googleLoginBtn"),
    gBtn2: document.getElementById("googleLoginBtnLogin"),
    // dashboard
    userDashboard: document.getElementById("userDashboard"),
    userOffers:    document.getElementById("userOffers"),
  };
}

const openModal  = (m) => m && (m.style.display = "flex");
const closeModal = (m) => m && (m.style.display = "none");

function niceAuthError(err) {
  const code = err?.code || "";
  switch (code) {
    case "auth/invalid-email":             return "Nieprawidłowy adres e-mail.";
    case "auth/missing-password":          return "Podaj hasło.";
    case "auth/invalid-credential":        return "Nieprawidłowy e-mail lub hasło.";
    case "auth/user-not-found":            return "Użytkownik nie istnieje.";
    case "auth/wrong-password":            return "Błędne hasło.";
    case "auth/too-many-requests":         return "Za dużo prób. Spróbuj później.";
    case "auth/unauthorized-domain":       return `Domena ${location.hostname} nie jest autoryzowana w Firebase.`;
    case "auth/popup-blocked":             return "Przeglądarka zablokowała okno logowania Google.";
    case "auth/operation-not-supported-in-this-environment":
                                           return "To środowisko nie wspiera popup (np. file://). Uruchom przez http/https.";
    default: return `Błąd: ${code || (err?.message || "nieznany")}`;
  }
}

function renderMobileAuth(user) {
  const { navMenu, mobileAuth } = getRefs();
  if (!mobileAuth) return;

  if (user) {
    const label = user.displayName ? user.displayName.split(" ")[0] : (user.email || "Użytkownik");
    mobileAuth.innerHTML = `
      <div class="nav-link" style="font-weight:600;">
        <i class="fas fa-user"></i> ${label}
      </div>
      <a href="#userDashboard" class="nav-link" id="mobileAccountLink">Moje konto</a>
      <button class="btn btn-secondary" id="mobileLogoutBtn" style="width:100%;">
        <i class="fas fa-sign-out-alt"></i> Wyloguj się
      </button>
    `;
  } else {
    mobileAuth.innerHTML = `
      <a href="#" id="loginLink" class="nav-link">Zaloguj się</a>
      <a href="#" id="registerLink" class="nav-link">Zarejestruj się</a>
    `;
  }

  const { loginModal, registerModal } = getRefs();
  const loginLink = document.getElementById("loginLink");
  const registerLink = document.getElementById("registerLink");
  const mobileLogoutBtn = document.getElementById("mobileLogoutBtn");
  const mobileAccountLink = document.getElementById("mobileAccountLink");

  loginLink && loginLink.addEventListener("click", (e) => {
    e.preventDefault(); openModal(loginModal);
    navMenu?.classList.remove("active"); mobileAuth.style.display = "none";
  });

  registerLink && registerLink.addEventListener("click", (e) => {
    e.preventDefault(); openModal(registerModal);
    navMenu?.classList.remove("active"); mobileAuth.style.display = "none";
  });

  mobileLogoutBtn && mobileLogoutBtn.addEventListener("click", async () => {
    try { await signOut(auth); } catch(e){ console.error(e); }
    navMenu?.classList.remove("active");
    mobileAuth.style.display = "none";
  });

  mobileAccountLink && mobileAccountLink.addEventListener("click", (e) => {
    e.preventDefault();
    document.getElementById("userDashboard")?.scrollIntoView({ behavior:"smooth" });
    navMenu?.classList.remove("active");
    mobileAuth.style.display = "none";
  });

  // aktualny stan widoczności
  mobileAuth.style.display = navMenu?.classList.contains("active") ? "flex" : "none";
}

async function signInWithGoogleSmart() {
  const ok = ["http:", "https:"].includes(location.protocol);
  if (!ok) return alert("Uruchom stronę przez http/https (nie file://).");
  try {
    await signInWithPopup(auth, googleProvider);
    const { loginModal, registerModal, navMenu, mobileAuth } = getRefs();
    closeModal(loginModal); closeModal(registerModal);
    navMenu?.classList.remove("active");
    mobileAuth?.setAttribute("style","display:none;");
  } catch (err) {
    console.error("[google]", err);
    if (err?.code === "auth/popup-blocked" || err?.code === "auth/operation-not-supported-in-this-environment") {
      await signInWithRedirect(auth, googleProvider);
    } else {
      alert(niceAuthError(err));
    }
  }
}

export async function initAuthUI() {
  await useBestPersistence();

  // zdarzenia UI (po partials:ready elementy już istnieją)
  const {
    loginBtn, registerBtn, logoutBtn, accountBtn,
    loginModal, registerModal, closeBtns, switchToReg, switchToLog,
    loginForm, registerForm, gBtn1, gBtn2
  } = getRefs();

  loginBtn     && loginBtn.addEventListener("click", () => openModal(loginModal));
  registerBtn  && registerBtn.addEventListener("click", () => openModal(registerModal));
  switchToReg  && switchToReg.addEventListener("click", (e) => { e.preventDefault(); closeModal(loginModal);  openModal(registerModal); });
  switchToLog  && switchToLog.addEventListener("click", (e) => { e.preventDefault(); closeModal(registerModal); openModal(loginModal); });
  closeBtns?.forEach(b => b.addEventListener("click", () => closeModal(b.closest(".modal"))));
  window.addEventListener("click", (e) => { if (e.target.classList?.contains("modal")) closeModal(e.target); });
  accountBtn && accountBtn.addEventListener("click", () =>
    document.getElementById("userDashboard")?.scrollIntoView({ behavior:"smooth" })
  );

  gBtn1 && gBtn1.addEventListener("click", (e) => { e.preventDefault(); signInWithGoogleSmart(); });
  gBtn2 && gBtn2.addEventListener("click", (e) => { e.preventDefault(); signInWithGoogleSmart(); });

  loginForm && loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value.trim();
    const pass  = document.getElementById("loginPassword").value;
    try { await signInWithEmailAndPassword(auth, email, pass); }
    catch (err) { console.error("[login]", err); alert(niceAuthError(err)); }
  });

  registerForm && registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name  = document.getElementById("registerName").value.trim();
    const email = document.getElementById("registerEmail").value.trim();
    const pass1 = document.getElementById("registerPassword").value;
    const pass2 = document.getElementById("registerConfirmPassword").value;
    if (pass1 !== pass2) return alert("Hasła nie są identyczne!");
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, pass1);
      if (name) await updateProfile(user, { displayName: name });
      await setDoc(doc(db, "users", user.uid), { name: name || null, email, createdAt: new Date(), provider: "password" }, { merge: true });
    } catch (err) {
      console.error("[register]", err); alert(niceAuthError(err));
    }
  });

  logoutBtn && logoutBtn.addEventListener("click", async () => {
    try { await signOut(auth); } catch(e){ console.error(e); }
  });

  // reakcja na stan logowania – ZA KAŻDYM RAZEM świeże referencje
  onAuthStateChanged(auth, (user) => {
    const { authButtons, userMenu, accountBtn, userDashboard, mobileAuth } = getRefs();

    if (user) {
      authButtons && (authButtons.style.display = "none");
      userMenu    && (userMenu.style.display = "flex");
      if (accountBtn) {
        const label = user.displayName ? user.displayName.split(" ")[0] : (user.email || "Moje konto");
        accountBtn.innerHTML = `<i class="fas fa-user me-1"></i> ${label}`;
      }
      userDashboard && (userDashboard.style.display = "block");
    } else {
      authButtons && (authButtons.style.display = "flex");
      userMenu    && (userMenu.style.display = "none");
      userDashboard && (userDashboard.style.display = "none");
      const uo = document.getElementById("userOffers");
      uo && (uo.innerHTML = "");
    }
    renderMobileAuth(user); // mobilne linki/login/logout
  });

  console.log("[auth.js] initialized");
}
