// --- Firebase importy (ESM z CDN) ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth, onAuthStateChanged, signOut,
  signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile,
  GoogleAuthProvider, signInWithPopup, signInWithRedirect,
  setPersistence, browserLocalPersistence, browserSessionPersistence, inMemoryPersistence
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// --- Konfiguracja Firebase ---
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
auth.languageCode = "pl";

// Pomocnicy modali
const openModal  = (m) => m && (m.style.display = "flex");
const closeModal = (m) => m && (m.style.display = "none");

// Persystencja
async function useBestPersistence() {
  try { await setPersistence(auth, browserLocalPersistence); }
  catch { try { await setPersistence(auth, browserSessionPersistence); }
  catch { await setPersistence(auth, inMemoryPersistence); } }
}
await useBestPersistence();

// Podpowiedź o domenie
(function domainHint(){
  const hint = document.getElementById("domainWarning");
  if (!hint) return;
  const knownGood = ["localhost","127.0.0.1","trainingtwenty5.github.io"];
  if (!knownGood.includes(location.hostname)) hint.style.display = "block";
})();

// Google provider
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

// DOM referencje
const authButtons   = document.getElementById("authButtons");
const userMenu      = document.getElementById("userMenu");
const loginBtn      = document.getElementById("loginBtn");
const registerBtn   = document.getElementById("registerBtn");
const accountBtn    = document.getElementById("accountBtn");
const logoutBtn     = document.getElementById("logoutBtn");
const loginModal    = document.getElementById("loginModal");
const registerModal = document.getElementById("registerModal");
const closeBtns     = document.querySelectorAll(".modal-close");
const switchToReg   = document.getElementById("switchToRegister");
const switchToLog   = document.getElementById("switchToLogin");
const loginForm     = document.getElementById("loginForm");
const registerForm  = document.getElementById("registerForm");
const gBtn1         = document.getElementById("googleLoginBtn");
const gBtn2         = document.getElementById("googleLoginBtnLogin");

// Sygnały UI z innych modułów
window.addEventListener("ui:openLoginModal", () => openModal(loginModal));
window.addEventListener("ui:openRegisterModal", () => openModal(registerModal));
window.addEventListener("ui:closeAllModals", () => { closeModal(loginModal); closeModal(registerModal); });

// Mapowanie błędów
const niceAuthError = (err) => {
  const code = err?.code || "";
  switch (code) {
    case "auth/invalid-email":             return "Nieprawidłowy adres e-mail.";
    case "auth/missing-password":          return "Podaj hasło.";
    case "auth/invalid-credential":        return "Nieprawidłowy e-mail lub hasło.";
    case "auth/user-not-found":            return "Użytkownik nie istnieje.";
    case "auth/wrong-password":            return "Błędne hasło.";
    case "auth/too-many-requests":         return "Za dużo prób. Spróbuj później.";
    case "auth/unauthorized-domain":       return `Domena ${location.hostname} nie jest autoryzowana w Firebase.`;
    case "auth/popup-blocked":             return "Przeglądarka zablokowała okno logowania Google. Użyj przekierowania.";
    case "auth/operation-not-supported-in-this-environment":
                                           return "To środowisko nie wspiera popup (np. file://). Uruchom przez http/https.";
    default: return `Błąd: ${code || (err?.message || "nieznany")}`;
  }
};

// Zdarzenia UI
loginBtn     && loginBtn.addEventListener("click", () => openModal(loginModal));
registerBtn  && registerBtn.addEventListener("click", () => openModal(registerModal));
switchToReg  && switchToReg.addEventListener("click", (e) => { e.preventDefault(); closeModal(loginModal);  openModal(registerModal); });
switchToLog  && switchToLog.addEventListener("click", (e) => { e.preventDefault(); closeModal(registerModal); openModal(loginModal); });
closeBtns?.forEach(b => b.addEventListener("click", () => closeModal(b.closest(".modal"))));
window.addEventListener("click", (e) => { if (e.target.classList?.contains("modal")) closeModal(e.target); });

// Email/hasło
loginForm && loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("loginEmail").value.trim();
  const pass  = document.getElementById("loginPassword").value;
  try { await signInWithEmailAndPassword(auth, email, pass); }
  catch (err) { console.error("[login]", err); alert(niceAuthError(err)); }
});

// Rejestracja
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
  } catch (err) { console.error("[register]", err); alert(niceAuthError(err)); }
});

// Google
async function signInWithGoogleSmart() {
  const ok = ["http:", "https:"].includes(location.protocol);
  if (!ok) return alert("Uruchom stronę przez http/https (nie file://).");
  try { await signInWithPopup(auth, googleProvider); }
  catch (err) {
    console.error("[google]", err);
    if (err?.code === "auth/popup-blocked" || err?.code === "auth/operation-not-supported-in-this-environment") {
      await signInWithRedirect(auth, googleProvider);
    } else { alert(niceAuthError(err)); }
  }
}
[gBtn1, gBtn2].forEach(b => b && b.addEventListener("click", (e) => { e.preventDefault(); signInWithGoogleSmart(); }));

// Wylogowanie (desktop)
logoutBtn && logoutBtn.addEventListener("click", async () => {
  try { await signOut(auth); } catch(e){ console.error(e); }
});

// Wylogowanie (mobile – żądanie z index.js)
window.addEventListener("auth:logoutRequest", async () => {
  try { await signOut(auth); } catch(e){ console.error(e); }
});

// Reakcja na zmianę stanu
onAuthStateChanged(auth, (user) => {
  if (user) {
    authButtons && (authButtons.style.display = "none");
    userMenu    && (userMenu.style.display = "flex");
    if (accountBtn) {
      const label = user.displayName ? user.displayName.split(" ")[0] : (user.email || "Moje konto");
      accountBtn.innerHTML = `<i class="fas fa-user me-1"></i> ${label}`;
    }
    // zamknij modale
    closeModal(loginModal); closeModal(registerModal);
    // powiadom resztę systemu
    window.dispatchEvent(new CustomEvent("auth:login", { detail: { user } }));
  } else {
    authButtons && (authButtons.style.display = "flex");
    userMenu    && (userMenu.style.display = "none");
    window.dispatchEvent(new Event("auth:logout"));
  }
});
