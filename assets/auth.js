// assets/auth.js  (ESM)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth, onAuthStateChanged, signOut,
  signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile,
  GoogleAuthProvider, signInWithPopup, signInWithRedirect,
  setPersistence, browserLocalPersistence, browserSessionPersistence, inMemoryPersistence
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore, doc, setDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* -------- Firebase -------- */
const firebaseConfig = {
  apiKey: "AIzaSyBdhMIiqetOfDGP85ERxtgwn3AXR50pBcE",
  authDomain: "base-468e0.firebaseapp.com",
  projectId: "base-468e0",
  storageBucket: "base-468e0.firebasestorage.app",
  messagingSenderId: "829161895559",
  appId: "1:829161895559:web:d832541aac05b35847ea22"
};
const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);
auth.languageCode = 'pl';

/* -------- Helpers -------- */
const $ = (s,r=document)=>r.querySelector(s);
const open  = (m)=>m && (m.style.display='flex');
const close = (m)=>m && (m.style.display='none');

function waitHeaderReady(){
  return new Promise(res=>{
    if (document.querySelector('#site-header .top-navbar')) return res();
    const h=()=>{res(); window.removeEventListener('layout:header-ready',h);};
    window.addEventListener('layout:header-ready',h);
  });
}

function errMsg(err){
  const c = err?.code || '';
  switch(c){
    case 'auth/invalid-email': return 'Nieprawidłowy adres e-mail.';
    case 'auth/missing-password': return 'Podaj hasło.';
    case 'auth/invalid-credential': return 'Nieprawidłowy e-mail lub hasło.';
    case 'auth/user-not-found': return 'Użytkownik nie istnieje.';
    case 'auth/wrong-password': return 'Błędne hasło.';
    case 'auth/too-many-requests': return 'Za dużo prób. Spróbuj później.';
    case 'auth/unauthorized-domain': return `Domena ${location.hostname} nie jest autoryzowana w Firebase.`;
    case 'auth/popup-blocked': return 'Przeglądarka zablokowała okno logowania Google.';
    case 'auth/operation-not-supported-in-this-environment': return 'Środowisko nie wspiera popup (np. file://). Uruchom przez http/https.';
    default: return `Błąd: ${c || err?.message || 'nieznany'}`;
  }
}

/* -------- Persistence -------- */
async function useBestPersistence(){
  try{ await setPersistence(auth, browserLocalPersistence); }
  catch{ try{ await setPersistence(auth, browserSessionPersistence); }
  catch{ await setPersistence(auth, inMemoryPersistence); } }
}
await useBestPersistence();

/* -------- Google -------- */
const google = new GoogleAuthProvider();
google.setCustomParameters({ prompt: 'select_account' });
async function signInWithGoogleSmart(){
  if(!['http:','https:'].includes(location.protocol)) return alert('Uruchom przez http/https (nie file://).');
  try{ await signInWithPopup(auth, google); }
  catch(err){
    if(err?.code==='auth/popup-blocked' || err?.code==='auth/operation-not-supported-in-this-environment'){
      await signInWithRedirect(auth, google);
    }else{ alert(errMsg(err)); }
  }
}

/* -------- Forms -------- */
document.addEventListener('DOMContentLoaded', ()=>{
  $('#loginForm')?.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const email = $('#loginEmail').value.trim();
    const pass  = $('#loginPassword').value;
    try{ await signInWithEmailAndPassword(auth, email, pass); }
    catch(err){ alert(errMsg(err)); }
  });

  $('#registerForm')?.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const name  = $('#registerName').value.trim();
    const email = $('#registerEmail').value.trim();
    const p1    = $('#registerPassword').value;
    const p2    = $('#registerConfirmPassword').value;
    if(p1!==p2) return alert('Hasła nie są identyczne!');
    try{
      const { user } = await createUserWithEmailAndPassword(auth, email, p1);
      if(name) await updateProfile(user,{ displayName:name });
      await setDoc(doc(db,'users',user.uid), { name:name||null,email,createdAt:new Date(),provider:'password' }, { merge:true });
    }catch(err){ alert(errMsg(err)); }
  });

  $('#googleLoginBtn')?.addEventListener('click', (e)=>{ e.preventDefault(); signInWithGoogleSmart(); });
  $('#googleLoginBtnLogin')?.addEventListener('click', (e)=>{ e.preventDefault(); signInWithGoogleSmart(); });

  // ostrzeżenie o domenie
  const hint = $('#domainWarning');
  if(hint){
    const ok=['localhost','127.0.0.1','trainingtwenty5.github.io'];
    if(!ok.includes(location.hostname)) hint.style.display='block';
  }
});

/* -------- Mobile auth renderer -------- */
function renderMobileAuth(user){
  const menu = document.querySelector('.nav-menu');
  if(!menu) return;
  let box = document.getElementById('mobileAuth') || menu.querySelector('.mobile-auth');
  if(!box){ box = document.createElement('div'); box.id='mobileAuth'; box.className='mobile-auth'; menu.appendChild(box); }

  if(user){
    const label = user.displayName ? user.displayName.split(' ')[0] : (user.email || 'Użytkownik');
    box.innerHTML = `
      <div class="nav-link" style="font-weight:600;"><i class="fas fa-user"></i> ${label}</div>
      <a href="#userDashboard" class="nav-link" id="mobileAccountLink">Moje konto</a>
      <button class="btn btn-secondary" id="mobileLogoutBtn" style="width:100%;"><i class="fas fa-sign-out-alt"></i> Wyloguj się</button>
    `;
  }else{
    box.innerHTML = `
      <a href="#" id="mobileLoginLink" class="nav-link">Zaloguj się</a>
      <a href="#" id="mobileRegisterLink" class="nav-link">Zarejestruj się</a>
    `;
  }

  const sync = ()=>{ box.style.display = menu.classList.contains('active') ? 'flex' : 'none'; };

  $('#mobileLoginLink')?.addEventListener('click',(e)=>{ e.preventDefault(); open($('#loginModal')); menu.classList.remove('active'); sync(); });
  $('#mobileRegisterLink')?.addEventListener('click',(e)=>{ e.preventDefault(); open($('#registerModal')); menu.classList.remove('active'); sync(); });
  $('#mobileLogoutBtn')?.addEventListener('click', async ()=>{ try{ await signOut(auth); }catch(e){ console.error(e); } menu.classList.remove('active'); sync(); });
  $('#mobileAccountLink')?.addEventListener('click',(e)=>{ e.preventDefault(); document.getElementById('userDashboard')?.scrollIntoView({behavior:'smooth'}); menu.classList.remove('active'); sync(); });

  document.querySelector('.mobile-menu-btn')?.addEventListener('click', sync);
  window.addEventListener('resize', ()=>{ if(innerWidth>768){ menu.classList.remove('active'); sync(); } });
  sync();
}

/* -------- Header binds once header exists -------- */
(async ()=>{
  await waitHeaderReady();

  // przyciski w top-navbar (otwieranie modali)
  document.getElementById('loginBtn')?.addEventListener('click', ()=> open($('#loginModal')));
  document.getElementById('registerBtn')?.addEventListener('click', ()=> open($('#registerModal')));

  // konto / wyloguj
  document.getElementById('accountBtn')?.addEventListener('click', ()=> document.getElementById('userDashboard')?.scrollIntoView({behavior:'smooth'}));
  document.getElementById('logoutBtn')?.addEventListener('click', async ()=>{ try{ await signOut(auth); }catch(e){ console.error(e); } });

  // startowy render sekcji mobilnej
  renderMobileAuth(auth.currentUser || null);
})();

/* -------- Auth state -> przepinanie UI -------- */
onAuthStateChanged(auth, async (user)=>{
  await waitHeaderReady();

  const authButtons = document.getElementById('authButtons');
  const userMenu    = document.getElementById('userMenu');
  const accountBtn  = document.getElementById('accountBtn');

  if(user){
    authButtons && (authButtons.style.display='none');
    userMenu    && (userMenu.style.display='flex');
    if(accountBtn){
      const label = user.displayName ? user.displayName.split(' ')[0] : (user.email || 'Moje konto');
      accountBtn.innerHTML = `<i class="fas fa-user"></i> ${label}`;
    }
    close($('#loginModal')); close($('#registerModal'));
  }else{
    authButtons && (authButtons.style.display='flex');
    userMenu    && (userMenu.style.display='none');
  }
  renderMobileAuth(user);
});
