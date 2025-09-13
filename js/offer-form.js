import { auth, db } from './auth.js'; // ten sam moduł co na index (system logowania)
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  collection, addDoc, getDoc, doc, updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { showToast } from './alerts.js';

// jQuery i Bootstrap są wczytane z CDN w HTML
const $ = window.jQuery;

const FORM_KEY   = 'df.form.v1';
const POINTS_KEY = 'df.points.v1';

let isLoggedIn = false;

// Mapy/punkty
let desktopMap, mobileMap;
let selectedPoints = []; // [{id,lat,lng,timestamp}]
let pointMarkers   = []; // [{id, desktopMarker, mobileMarker}]
let isSaving = false;
let lastCenter = { lat: 51.63538575429843, lng: 16.45740592647929 };
let lastZoom   = 17;

// ===== PERSISTENCJA FORMULARZA =====
function saveFormToStorage() {
  const data = {
    firstName: $('#firstName').val()?.trim() || '',
    phone:     $('#phone').val()?.trim() || '',
    email:     $('#email').val()?.trim() || '',
    city:      $('#city').val()?.trim() || '',
    price:     $('#price').val()?.trim() || '',
    termsConsent:     $('#termsConsent').is(':checked'),
    marketingConsent: $('#marketingConsent').is(':checked')
  };
  localStorage.setItem(FORM_KEY, JSON.stringify(data));
}
function loadFormFromStorage() {
  const raw = localStorage.getItem(FORM_KEY);
  if (!raw) return;
  try {
    const d = JSON.parse(raw);
    if (d.firstName !== undefined) $('#firstName').val(d.firstName);
    if (d.phone     !== undefined) $('#phone').val(d.phone);
    if (d.email     !== undefined) $('#email').val(d.email);
    if (d.city      !== undefined) $('#city').val(d.city);
    if (d.price     !== undefined) $('#price').val(d.price);
    if (d.termsConsent !== undefined)     $('#termsConsent').prop('checked', d.termsConsent);
    if (d.marketingConsent !== undefined) $('#marketingConsent').prop('checked', d.marketingConsent);
  } catch {}
}

// ===== PERSISTENCJA PUNKTÓW =====
function persistSelectedPoints() {
  localStorage.setItem(POINTS_KEY, JSON.stringify(selectedPoints));
}
function loadSelectedPointsFromStorage() {
  const raw = localStorage.getItem(POINTS_KEY);
  if (!raw) return;
  try {
    const arr = JSON.parse(raw);
    if (Array.isArray(arr)) {
      selectedPoints = arr;
      updateSelectedPointsList();
    }
  } catch {}
}

function restoreMarkersFromSelectedPoints() {
  if (!selectedPoints || selectedPoints.length === 0) return;
  selectedPoints.forEach(p => {
    const latLng = new google.maps.LatLng(p.lat, p.lng);
    let desktopMarker = null, mobileMarker = null;
    if (desktopMap) desktopMarker = new google.maps.Marker({ position: latLng, map: desktopMap });
    if (mobileMap)  mobileMarker  = new google.maps.Marker({ position: latLng, map: mobileMap });
    pointMarkers.push({ id: p.id, desktopMarker, mobileMarker });
  });
}

// ===== WALIDACJA =====
function validateForm() {
  if (isLoggedIn) {
    const city = $("#city").val().trim();
    if (!city) { showToast("Podaj miejscowość.", "warning"); return false; }
    return true;
  }
  const firstName = $("#firstName").val().trim();
  const phone     = $("#phone").val().trim();
  const email     = $("#email").val().trim();
  const city      = $("#city").val().trim();
  const terms     = $("#termsConsent").is(":checked");

  const phoneRegex = /^(\+48\d{9}|\d{9})$/;
  const emailValid = email.length > 0 && email.includes("@");

  if (!firstName || !phone || !emailValid || !city || !terms) return false;
  if (!phoneRegex.test(phone)) { showToast("Numer telefonu musi być w formacie 505849404 lub +48505849404", "warning"); return false; }
  return true;
}

// ===== GOOGLE MAPS (globalny callback) =====
function addWmsLayer(map, layerName) {
  const wmsUrl = "https://integracja.gugik.gov.pl/cgi-bin/KrajowaIntegracjaEwidencjiGruntow";
  const wmsMapType = new google.maps.ImageMapType({
    getTileUrl: function(coord, zoom) {
      const proj = map.getProjection();
      const zfactor = Math.pow(2, zoom);
      const ul = proj.fromPointToLatLng(new google.maps.Point(coord.x * 256 / zfactor, coord.y * 256 / zfactor));
      const lr = proj.fromPointToLatLng(new google.maps.Point((coord.x + 1) * 256 / zfactor, (coord.y + 1) * 256 / zfactor));
      const bbox = ul.lng() + "," + lr.lat() + "," + lr.lng() + "," + ul.lat();
      return wmsUrl +
        "?service=WMS&version=1.1.1&request=GetMap" +
        "&layers=" + layerName +
        "&styles=" +
        "&bbox=" + bbox +
        "&width=256&height=256" +
        "&srs=EPSG:4326" +
        "&format=image/png" +
        "&transparent=true";
    },
    tileSize: new google.maps.Size(256, 256),
    opacity: 0.7,
    name: layerName
  });
  map.overlayMapTypes.push(wmsMapType);
}

const POLAND_BOUNDS = { north: 55.0, south: 49.0, west: 14.1, east: 24.2 };
function isInPoland(latLng) {
  return (
    latLng.lat() >= POLAND_BOUNDS.south &&
    latLng.lat() <= POLAND_BOUNDS.north &&
    latLng.lng() >= POLAND_BOUNDS.west &&
    latLng.lng() <= POLAND_BOUNDS.east
  );
}

function isVisible(el) {
  if (!el) return false;
  const style = window.getComputedStyle(el);
  return style && style.display !== 'none' && style.visibility !== 'hidden';
}

let resizeTimer = null;
function handleResize() {
  const desktopEl = document.getElementById('map');
  const mobileEl  = document.getElementById('map-mobile');
  const useMobile = isVisible(mobileEl);
  const map = useMobile ? mobileMap : desktopMap;
  if (!map) return;
  map.setCenter(lastCenter);
  map.setZoom(lastZoom);
  google.maps.event.trigger(map, 'resize');
}

function addPointToSelection(latLng) {
  if (!isInPoland(latLng)) { showToast("Możesz dodać punkt tylko na terenie Polski 🇵🇱", "warning"); return; }

  const pointId = 'point_' + Date.now();
  const point = { id: pointId, lat: latLng.lat(), lng: latLng.lng(), timestamp: new Date().toISOString() };
  selectedPoints.push(point);

  let desktopMarker = null, mobileMarker = null;
  if (desktopMap) desktopMarker = new google.maps.Marker({ position: latLng, map: desktopMap });
  if (mobileMap)  mobileMarker  = new google.maps.Marker({ position: latLng, map: mobileMap });
  pointMarkers.push({ id: pointId, desktopMarker, mobileMarker });

  updateSelectedPointsList();
  persistSelectedPoints();

  // Auto-zapis: klik zapisuje i usuwa punkt
  if ($('#autoSave').is(':checked')) {
    const toSave = { lat: point.lat, lng: point.lng };
    window.removePlot(pointId);
    savePlots([toSave]);
  }
}

window.removePlot = function(pointId) {
  selectedPoints = selectedPoints.filter(p => p.id !== pointId);
  const markerObj = pointMarkers.find(m => m.id === pointId);
  if (markerObj) {
    if (markerObj.desktopMarker) markerObj.desktopMarker.setMap(null);
    if (markerObj.mobileMarker)  markerObj.mobileMarker.setMap(null);
  }
  pointMarkers = pointMarkers.filter(m => m.id !== pointId);
  updateSelectedPointsList();
  persistSelectedPoints();
};

function clearAllPoints() {
  selectedPoints = [];
  pointMarkers.forEach(m => { if (m.desktopMarker) m.desktopMarker.setMap(null); if (m.mobileMarker) m.mobileMarker.setMap(null); });
  pointMarkers = [];
  updateSelectedPointsList();
  persistSelectedPoints();
}

function updateSelectedPointsList() {
  const container = document.getElementById('selectedPlots');
  if (selectedPoints.length === 0) {
    container.innerHTML = '<p class="text-muted">Brak wskazanych działek.</p>';
    return;
  }
  let html = '';
  selectedPoints.forEach((p, i) => {
    html += `
      <div class="plot-item">
        <span>Działka nr ${i + 1}</span>
        <button onclick="removePlot('${p.id}')" aria-label="Usuń działkę ${i+1}"><i class="fas fa-trash"></i></button>
      </div>`;
  });
  container.innerHTML = html;
}

// ===== DANE DO ZAPISU =====
function buildFormData(points) {
  const user = auth.currentUser || null;

  const firstName = $('#firstName').val().trim();
  const phone     = $('#phone').val().trim();
  const email     = $('#email').val().trim() || (user ? (user.email || '') : '');
  const city      = $('#city').val().trim();
  const price     = $('#price').val().trim();
  const terms     = $('#termsConsent').is(':checked');
  const marketing = $('#marketingConsent').is(':checked');

  const base = {
    price,
    mock: true,
    plots: points.map(p => ({
      Id: "", idDzialki_uldk: "",
      lat: p.lat, lng: p.lng,
      mock: true,
      geometry_uldk: null,
      pow_dzialki_m2_uldk: null,
      price: price || "",
      termsConsent: isLoggedIn ? true : terms,
      timestamp: new Date()
    })),
    timestamp: new Date()
  };

  if (isLoggedIn) {
    base.userUid   = user?.uid   || '';
    base.userEmail = user?.email || '';
    base.city  = city;
    base.phone = phone;
  } else {
    base.city  = city;
    base.firstName = firstName;
    base.phone = phone;
    base.email = email;
    base.termsConsent     = terms;
    base.marketingConsent = marketing;
  }
  return base;
}

// ===== ZAPIS DO FIRESTORE =====
async function savePlots(points) {
  if (isSaving) return false;
  if (!points || points.length === 0) { showToast("Żadna działka nie jest zaznaczona.", "warning"); return false; }
  if (!validateForm()) { showToast("Uzupełnij wymagane pola.", "warning"); return false; }

  const formData = buildFormData(points);
  const submitBtn  = document.querySelector('#propertyForm button[type="submit"]');
  const submitText = document.getElementById('submitText');

  try {
    isSaving = true;
    if (submitBtn)  submitBtn.disabled = true;
    if (submitText) submitText.textContent = "Zapisywanie...";

    await addDoc(collection(db, "propertyListings"), formData);
    showToast("Zapisano do bazy!", "success");
    return true;
  } catch (err) {
    showToast("Błąd zapisu: " + err.message, "error");
    return false;
  } finally {
    isSaving = false;
    if (submitBtn)  submitBtn.disabled = false;
    if (submitText) submitText.textContent = "Dodaj bezpłatne ogłoszenie";
  }
}

async function saveToDatabase() {
  if (selectedPoints.length === 0) { showToast("Żadna działka nie jest zaznaczona. Dodaj co najmniej jeden punkt.", "warning"); return; }
  const ok = await savePlots([...selectedPoints]);
  if (ok) { clearAllPoints(); }
}

// ===== PREFILL TELEFONU =====
async function fetchAndPrefillPhone(user) {
  if (!user) return;
  try {
    // users/{uid}
    let snap = await getDoc(doc(db, 'users', user.uid));
    let phone = snap.exists() ? (snap.data().phone || snap.data().telefon) : '';

    // profiles/{uid}
    if (!phone) {
      snap = await getDoc(doc(db, 'profiles', user.uid));
      if (snap.exists()) phone = snap.data().phone || snap.data().telefon || '';
    }

    if (phone && !$('#phone').val()) $('#phone').val(phone);
  } catch {
    // brak profilu to nie błąd krytyczny
  }
}

// ===== TRYB LOGOWANIA – ukrywanie/wyświetlanie pól =====
function toggleFieldsForAuth(user) {
  isLoggedIn = !!user;

  const others = ['#firstName', '#email'];

  if (isLoggedIn) {
    $('#phone').prop('required', false).prop('readonly', false).closest('.mb-3').removeClass('d-none disabled-field');
    $('#city').prop('required', true).prop('readonly', false).closest('.mb-3').removeClass('d-none disabled-field');
    $('#price').prop('required', false).prop('readonly', false).closest('.mb-3').removeClass('d-none disabled-field');

    others.forEach(sel => {
      const $wrap = $(sel).closest('.mb-3');
      $(sel).prop('required', false).prop('readonly', true);
      $wrap.removeClass('d-none').addClass('disabled-field');
    });

    if (user?.email) $('#email').val(user.email);
    if (user?.displayName && !$('#firstName').val()) $('#firstName').val(user.displayName);

    $('#selectAllConsents').closest('.form-check').addClass('d-none');
    $('#termsConsent').prop('required', false).closest('.form-check').addClass('d-none');
    $('#marketingConsent').closest('.form-check').addClass('d-none');

    fetchAndPrefillPhone(user);
  } else {
    ['#firstName', '#phone', '#email', '#city', '#price'].forEach(sel => {
      const $wrap = $(sel).closest('.mb-3');
      $(sel).prop('readonly', false).prop('disabled', false).prop('required', true);
      $wrap.removeClass('d-none disabled-field');
    });
    $('#phone').prop('required', true);

    $('#selectAllConsents').closest('.form-check').removeClass('d-none');
    $('#termsConsent').prop('required', true).closest('.form-check').removeClass('d-none');
    $('#marketingConsent').closest('.form-check').removeClass('d-none');
  }
}

// ===== GLOBALNE: ładowanie i init Google Maps =====
window.loadGoogleMaps = function loadGoogleMaps() {
  const apiKey = 'AIzaSyCr5TmFxnT3enxmyr6vujF8leP995giw8I';
  const script = document.createElement("script");
  script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initMap`;
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);
};

window.initMap = function initMap() {
  const mapOptionsBase = {
    center: lastCenter,
    zoom: lastZoom,
    fullscreenControl: false,
    styles: [
      { featureType: "all", elementType: "labels", stylers: [{ visibility: "off" }] },
      { featureType: "administrative.locality", elementType: "labels.text", stylers: [{ visibility: "on" }] },
      { featureType: "water", elementType: "labels.text", stylers: [{ visibility: "on" }] },
      { featureType: "road", elementType: "labels.text", stylers: [{ visibility: "on" }] },
      { featureType: "poi", elementType: "labels.text", stylers: [{ visibility: "on" }] },
      { featureType: "address", elementType: "labels.text", stylers: [{ visibility: "on" }] }
    ]
  };

  // Desktop
  const desktopEl = document.getElementById('map');
  if (desktopEl) {
    desktopMap = new google.maps.Map(desktopEl, { ...mapOptionsBase, streetViewControl: true });
    desktopMap.addListener('click', e => addPointToSelection(e.latLng));
    desktopMap.addListener('idle', () => {
      if (isVisible(desktopEl)) {
        const c = desktopMap.getCenter(); if (c) lastCenter = c.toJSON();
        lastZoom = desktopMap.getZoom();
      }
    });
    addWmsLayer(desktopMap, "dzialki");
    addWmsLayer(desktopMap, "numery_dzialek");
  }

  // Mobile
  const mobileEl = document.getElementById('map-mobile');
  if (mobileEl) {
    mobileMap = new google.maps.Map(mobileEl, { ...mapOptionsBase, streetViewControl: false });
    mobileMap.addListener('click', e => addPointToSelection(e.latLng));
    mobileMap.addListener('idle', () => {
      if (isVisible(mobileEl)) {
        const c = mobileMap.getCenter(); if (c) lastCenter = c.toJSON();
        lastZoom = mobileMap.getZoom();
      }
    });
    addWmsLayer(mobileMap, "dzialki");
    addWmsLayer(mobileMap, "numery_dzialek");
  }

  restoreMarkersFromSelectedPoints();
  handleResize();
};

// ===== READY =====
$(function() {
  loadFormFromStorage();
  loadSelectedPointsFromStorage();

  $('#propertyForm').on('input change', 'input, textarea, select', saveFormToStorage);
  $("#propertyForm").on("submit", function(e){ e.preventDefault(); saveToDatabase(); });

  // Zgody – zaznacz wszystkie
  $("#selectAllConsents").on("change", function() {
    const checked = $(this).is(":checked");
    $("#termsConsent, #marketingConsent").prop("checked", checked);
  });
  $("#termsConsent, #marketingConsent").on("change", function() {
    if (!$("#termsConsent").is(":checked") || !$("#marketingConsent").is(":checked")) {
      $("#selectAllConsents").prop("checked", false);
    } else {
      $("#selectAllConsents").prop("checked", true);
    }
  });

  $("#autoSave").on("change", async function () {
    if ($(this).is(":checked")) {
      if (!validateForm()) { showToast("Aby włączyć Auto-zapis, najpierw uzupełnij wymagane pola!", "warning"); $(this).prop("checked", false); return; }
      if (selectedPoints.length > 0) { const ok = await savePlots([...selectedPoints]); if (ok) clearAllPoints(); }
      showToast("Auto-zapis włączony. Nowe kliknięcia będą zapisywane automatycznie.", "success");
    } else {
      showToast("Auto-zapis wyłączony.", "info");
    }
  });

  $("#clearPlotsBtn, #clearPlotsBtnMobile").on("click", function(){ clearAllPoints(); });

  // Reaguj na auth (z systemu logowania z indexu)
  onAuthStateChanged(auth, (user) => toggleFieldsForAuth(user));
  // Jednorazowy check (gdy user już zalogowany)
  toggleFieldsForAuth(auth.currentUser || null);

  // Reakcja na custom eventy z auth.js (jeśli je emitujesz na stronie)
  window.addEventListener('auth:login', (ev) => toggleFieldsForAuth(ev.detail.user));
  window.addEventListener('auth:logout', ()  => toggleFieldsForAuth(null));
});

// Resize map
window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(handleResize, 150); });
window.addEventListener('orientationchange', handleResize);
