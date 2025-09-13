// ===== Firebase (bez dubla: użyj istniejącej app jeśli jest) =====
import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore, collection, getDocs, doc, getDoc, updateDoc, query, where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBdhMIiqetOfDGP85ERxtgwn3AXR50pBcE",
  authDomain: "base-468e0.firebaseapp.com",
  projectId: "base-468e0",
  storageBucket: "base-468e0.firebasestorage.app",
  messagingSenderId: "829161895559",
  appId: "1:829161895559:web:d832541aac05b35847ea22"
};
const app  = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db   = getFirestore(app);

// exporty globalnie jeśli chcesz używać w innych skryptach
window.db = db;

// ======= UI: Toast =======
function showToast(message, type = 'info'){
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const el = document.createElement('div');
  el.className = `toast-lite toast-${type}`;
  el.setAttribute('role','status');
  el.innerHTML = `
    <div class="toast-icon">${({success:'✓',info:'ℹ',warning:'!',error:'✕'})[type] || 'ℹ'}</div>
    <div class="toast-msg">${message}</div>
    <button class="toast-close" aria-label="Zamknij">&times;</button>
  `;
  const close = () => { el.classList.remove('show'); setTimeout(()=>el.remove(),160); };
  el.querySelector('.toast-close').addEventListener('click', close);
  container.appendChild(el);
  requestAnimationFrame(()=>el.classList.add('show'));
  const t = setTimeout(close, 4000);
  el.addEventListener('mouseenter', ()=>clearTimeout(t), { once:true });
}
window.showToast = showToast;

// ======= UI: Pretty confirm (Promise<boolean>) =======
function showConfirm({ title='Potwierdzenie', message='Czy na pewno chcesz kontynuować?', yesText='Tak', noText='Nie' } = {}){
  return new Promise((resolve)=>{
    const modal   = document.getElementById('confirmModal');
    const titleEl = document.getElementById('confirmTitle');
    const msgEl   = document.getElementById('confirmMessage');
    const btnNo   = document.getElementById('confirmNo');
    const btnYes  = document.getElementById('confirmYes');

    titleEl.textContent = title;
    msgEl.textContent   = message;
    btnYes.textContent  = yesText;
    btnNo.textContent   = noText;

    modal.style.display = 'flex';
    requestAnimationFrame(()=> modal.classList.add('show'));

    const cleanup = (val)=>{
      modal.classList.remove('show');
      setTimeout(()=>{ modal.style.display='none'; }, 120);
      document.removeEventListener('keydown', onKey);
      modal.removeEventListener('click', onBackdrop);
      btnNo.removeEventListener('click', onNo);
      btnYes.removeEventListener('click', onYes);
      resolve(val);
    };
    const onNo = ()=>cleanup(false);
    const onYes= ()=>cleanup(true);
    const onBackdrop = (e)=>{ if (e.target === modal) cleanup(false); };
    const onKey = (e)=>{ if(e.key==='Escape') cleanup(false); if(e.key==='Enter') cleanup(true); };

    btnNo.addEventListener('click', onNo);
    btnYes.addEventListener('click', onYes);
    modal.addEventListener('click', onBackdrop);
    document.addEventListener('keydown', onKey);
    btnYes.focus();
  });
}
window.showConfirm = showConfirm;

// ======= Google Maps + oferty =======
let map, markers = [], markerCluster, allOffers = [];
window.infoWin = null;

function infoHTML(plot, data, offerId, plotIndex){
  const price = Number(plot.price || 0);
  const area  = Number(plot.pow_dzialki_m2_uldk || 0);
  const ppm2  = price && area ? (price/area).toFixed(0) : null;
  const city  = data.city || "brak";
  const phone = data.phone || "brak";
  const detailsUrl = `oferta.html?id=${offerId}&plot=${plotIndex}`;

  return `
    <div class="map-info-window">
      <h3>${plot.Id || "Brak identyfikatora"}</h3>
      <p><b>Miejscowość:</b> ${city}</p>
      ${price ? `<p><b>Cena:</b> ${price.toLocaleString('pl-PL')} zł${ppm2 ? ` <span style="color:#718096;">(${ppm2} zł/m²)</span>` : ''}</p>` : ''}
      ${area  ? `<p><b>Powierzchnia:</b> ${area.toLocaleString('pl-PL')} m²</p>` : ''}
      <p><b>Telefon:</b> ${phone}</p>
      <div class="mini-actions">
        <a class="btn-mini" target="_blank" href="${detailsUrl}">Szczegóły</a>
      </div>
    </div>
  `;
}
function openInfo(marker, html){
  if (!window.infoWin) window.infoWin = new google.maps.InfoWindow();
  window.infoWin.setContent(html);
  window.infoWin.open(map, marker);
}

// EPSG:2180 -> WGS84
function parseGeometry(geometryString){
  const coords = [];
  try{
    proj4.defs("EPSG:2180","+proj=tmerc +lat_0=0 +lon_0=19 +k=0.9993 +x_0=500000 +y_0=-5300000 +ellps=GRS80 +units=m +no_defs");
    const coordString = geometryString.match(/\(\(([^)]+)\)\)/)[1];
    coordString.split(',').forEach(pt=>{
      const [xStr,yStr] = pt.trim().split(' ');
      const [lng,lat] = proj4("EPSG:2180","WGS84",[parseFloat(xStr),parseFloat(yStr)]);
      coords.push({ lat, lng });
    });
  }catch(e){ console.warn('Błąd geometrii', e); }
  return coords;
}

// Ładowanie ofert i render na mapie + liście
async function loadOffers(){
  const list = document.getElementById('offersList');
  if (list) list.innerHTML = '';

  allOffers = [];
  markers.forEach(m=>m.setMap(null));
  markers = [];

  const snap = await getDocs(collection(db,"propertyListings"));

  const polygons = [];
  snap.forEach(d=>{
    const data = d.data();
    if (!Array.isArray(data.plots) || !data.plots.length) return;

    data.plots.forEach((plot, index)=>{
      if (plot?.mock === false) return; // ukryte (miękkie usunięcie)

      const lat = plot.lat, lng = plot.lng;
      const marker = new google.maps.Marker({
        position:{lat,lng}, map,
        title: data.firstName || "Oferta",
        icon: { url: "https://maps.google.com/mapfiles/ms/icons/red-dot.png" }
      });
      marker.addListener('click', ()=> openInfo(marker, infoHTML(plot, data, d.id, index)));
      markers.push(marker);

      // ewentualny polygon
      if (plot.geometry_uldk){
        const coords = parseGeometry(plot.geometry_uldk);
        if (coords.length){
          const polygon = new google.maps.Polygon({
            paths:coords, strokeColor:"#FF0000", strokeOpacity:.9, strokeWeight:2,
            fillColor:"#FF0000", fillOpacity:.15, map:null, visible:false
          });
          polygon.addListener('click', (evt)=>{
            const fake = new google.maps.Marker({ position: evt.latLng, map: null });
            openInfo(fake, infoHTML(plot, data, d.id, index));
          });
          polygons.push(polygon);
        }
      }

      allOffers.push({ id:d.id, data, plot, index, marker });
    });
  });

  // cluster
  if (markerCluster) markerCluster.clearMarkers();
  markerCluster = new markerClusterer.MarkerClusterer({
    map, markers,
    renderer: {
      render: ({ count, position }) => new google.maps.Marker({
        position,
        label: { text:String(count), color:"#fff", fontSize:"14px", fontWeight:"700" },
        icon: {
          path: google.maps.SymbolPath.CIRCLE, scale: 20,
          fillColor: "#e11d48", fillOpacity: .9,
          strokeColor: "#e11d48", strokeWeight: 2
        }
      })
    }
  });

  // polygony pokazuj od zoom >= 8
  google.maps.event.addListener(map,'zoom_changed', ()=>{
    const show = map.getZoom() >= 8;
    polygons.forEach(p=> p.setMap(show ? map : null));
  });

  filterOffersByBounds();
}

function filterOffersByBounds(){
  if (!map || !allOffers.length) return;
  const bounds = map.getBounds(); if (!bounds) return;
  const visible = allOffers.filter(o => bounds.contains(o.marker.getPosition()));
  const list = document.getElementById('offersList'); if (!list) return;

  list.innerHTML = '';
  if (!visible.length){
    list.innerHTML = '<p class="no-offers">Brak ofert w widocznym obszarze</p>';
    return;
  }

  visible.forEach(o=>{
    const price = Number(o.plot.price || 0);
    const area  = Number(o.plot.pow_dzialki_m2_uldk || 0);
    const ppm2  = price && area ? (price/area).toFixed(0) : null;
    const detailsUrl = `oferta.html?id=${o.id}&plot=${o.index}`;

    const card = document.createElement('div');
    card.className = 'offer-card';
    card.innerHTML = `
      <h5>${o.plot.Id || 'Brak identyfikatora'}</h5>
      ${o.data.city ? `<p><b>Miejscowość:</b> ${o.data.city}</p>` : ''}
      <p><b>Telefon:</b> ${o.data.phone || '-'}</p>
      ${price ? `<p><b>Cena:</b> ${price.toLocaleString('pl-PL')} zł ${ppm2?`<span style="color:#888;font-size:.85em;margin-left:6px;">(${ppm2} zł/m²)</span>`:''}</p>`:''}
      ${area  ? `<p><b>Powierzchnia:</b> ${area.toLocaleString('pl-PL')} m²</p>` : ''}
      <div class="offer-actions">
        <a class="btn btn-accent btn-sm" target="_blank" href="${detailsUrl}">
          <i class="fas fa-info-circle"></i> Szczegóły
        </a>
      </div>
    `;
    card.addEventListener('click',(e)=>{
      if (e.target.closest('a')) return;
      map.panTo(o.marker.getPosition());
      map.setZoom(Math.max(16,map.getZoom()));
      openInfo(o.marker, infoHTML(o.plot, o.data, o.id, o.index));
    });
    list.appendChild(card);
  });
}

// Fokus z „Moje oferty”
window.focusOfferOnMap = function(offerId, plotIndex){
  const m = allOffers.find(o => o.id===offerId && o.index===plotIndex);
  if (!m || !map) return;
  map.panTo(m.marker.getPosition());
  map.setZoom(17);
  openInfo(m.marker, infoHTML(m.plot, m.data, m.id, m.index));
  document.querySelector('.map-container')?.scrollIntoView({ behavior:'smooth', block:'start' });
};

// Miękkie usuwanie pojedynczej działki w ogłoszeniu (plot.mock=false)
window.deletePlot = async function(offerId, plotIndex, plotTitle){
  const ok = await showConfirm({
    title:'Usunąć ofertę?',
    message:`Czy na pewno chcesz usunąć ofertę „${plotTitle}”?`,
    yesText:'Usuń', noText:'Anuluj'
  });
  if (!ok) return;

  try{
    const offerRef = doc(db, "propertyListings", offerId);
    const offerDoc = await getDoc(offerRef);
    if (!offerDoc.exists()){ showToast('Oferta nie istnieje.', 'warning'); return; }

    const data = offerDoc.data();
    if (!Array.isArray(data.plots) || plotIndex >= data.plots.length){
      showToast('Wybrana działka nie istnieje.', 'warning'); return;
    }
    const updated = [...data.plots];
    updated[plotIndex] = { ...updated[plotIndex], mock:false };

    await updateDoc(offerRef, { plots: updated });
    showToast(`Oferta „${plotTitle}” została usunięta.`, 'success');

    // odśwież listę użytkownika (jeśli sekcja widoczna)
    try{
      const userEmail = window?.currentUserEmail;  // jeżeli auth.js ustawia globalnie — opcjonalnie
      const userUid   = window?.currentUserUid;
      await loadUserOffers(userEmail || null, userUid || null);
      filterOffersByBounds();
    }catch(_){}
  }catch(err){
    console.error(err);
    showToast('Wystąpił błąd podczas usuwania oferty.', 'error');
  }
};

// Ładowanie własnych ofert zalogowanego (próbuje parę pól)
async function loadUserOffers(email, uid){
  const box = document.getElementById('userOffers');
  const wrap = document.getElementById('userDashboard');
  if (!box || !wrap) return;

  box.innerHTML = '<p>Ładuję Twoje oferty…</p>';

  const emailFields = ['email','userEmail','ownerEmail','createdByEmail','contactEmail'];
  const idFields    = ['userUid','uid','userId','ownerId','createdBy'];

  const results = new Map();

  // po e-mailu
  if (email){
    const variants = [...new Set([email, email.toLowerCase()])];
    for (const f of emailFields){
      for (const val of variants){
        try{
          const s = await getDocs(query(collection(db,'propertyListings'), where(f,'==',val)));
          s.forEach(d=> results.set(d.id,d));
        }catch(e){ /* ignoruj */ }
      }
    }
  }
  // po UID
  if (uid){
    for (const f of idFields){
      try{
        const s = await getDocs(query(collection(db,'propertyListings'), where(f,'==',uid)));
        s.forEach(d=> results.set(d.id,d));
      }catch(e){ /* ignoruj */ }
    }
  }

  box.innerHTML = '';
  if (results.size === 0){
    wrap.style.display = 'none';
    return;
  }
  wrap.style.display = 'block';

  Array.from(results.values()).forEach(docu=>{
    const offer = docu.data(); const offerId = docu.id;
    if (!Array.isArray(offer.plots) || !offer.plots.length) return;

    offer.plots.forEach((plot, originalIndex)=>{
      if (plot?.mock === false) return;
      const price = Number(plot.price || 0);
      const area  = Number(plot.pow_dzialki_m2_uldk || plot.area || plot.areaM2 || 0);
      const ppm2  = price && area ? Math.round(price/area) : 0;
      const detailsUrl = `oferta.html?id=${offerId}&plot=${originalIndex}`;

      const el = document.createElement('div');
      el.className = 'offer-card';
      el.innerHTML = `
        <h3 class="offer-title">${plot.Id || `Działka`}</h3>
        <div class="offer-details">
          <p><strong>Lokalizacja:</strong> ${offer.city || offer.location?.city || 'Nie podano'}</p>
          ${area  ? `<p><strong>Powierzchnia:</strong> ${area.toLocaleString('pl-PL')} m²</p>` : ''}
          ${price ? `<p><strong>Cena całkowita:</strong> ${price.toLocaleString('pl-PL')} zł
            ${ppm2 ? `<span style="color:#888;font-size:.85em;margin-left:5px;">${ppm2.toLocaleString('pl-PL')} zł/m²</span>`:''}
          </p>` : ''}
        </div>
        <div class="offer-actions">
          <a class="btn btn-accent btn-sm" target="_blank" href="${detailsUrl}">
            <i class="fas fa-info-circle"></i> Szczegóły
          </a>
          <button class="btn btn-primary btn-sm" onclick="window.location.href='dodaj.html?edit=${offerId}&plot=${originalIndex}'">
            <i class="fas fa-edit"></i> Edytuj
          </button>
          <button class="btn btn-secondary btn-sm" onclick="deletePlot('${offerId}', ${originalIndex}, '${(plot.Id||'Działka').replace(/'/g, "\\'")}')">
            <i class="fas fa-trash"></i> Usuń
          </button>
        </div>
      `;
      el.addEventListener('click',(e)=>{
        if (e.target.closest('.offer-actions')) return;
        window.focusOfferOnMap?.(offerId, originalIndex);
      });
      box.appendChild(el);
    });
  });

  if (!box.querySelector('.offer-card')){
    wrap.style.display = 'none';
  }
}
window.loadUserOffers = loadUserOffers;

// ======= Inicjacja Google Maps =======
async function initMap(){
  map = new google.maps.Map(document.getElementById('map'), {
    center:{ lat:52.0, lng:19.0 }, zoom:6,
    gestureHandling:"greedy",
    mapTypeId: google.maps.MapTypeId.HYBRID
  });
  google.maps.event.addListener(map,'idle', filterOffersByBounds);

  // Delikatny zoom kółkiem (opcjonalny)
  const mapEl = document.getElementById('map');
  mapEl.addEventListener('wheel', (e)=>{
    if (e.target.closest('.gm-style')){
      e.preventDefault();
      const delta = e.deltaY || e.detail || (-e.wheelDelta);
      const z = map.getZoom();
      map.setZoom(delta < 0 ? z + 0.5 : z - 0.5);
    }
  }, { passive:false });

  await loadOffers();
}

function loadGoogleMaps(){
  const apiKey = localStorage.getItem('googleMapsApiKey') || 'AIzaSyCr5TmFxnT3enxmyr6vujF8leP995giw8I';
  const script = document.createElement('script');
  script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=__gmLoaded`;
  script.async = true; script.defer = true;
  window.__gmLoaded = ()=> initMap();
  document.head.appendChild(script);
}
document.addEventListener('DOMContentLoaded', loadGoogleMaps);

// Opcjonalnie: jeżeli auth.js publikuje usera globalnie, tutaj możemy zareagować
// window.onUserReady = ({ email, uid }) => loadUserOffers(email, uid);
