// user-dashboard.js
import { auth, db } from './auth.js';
import {
  collection, query, where, getDocs, doc, getDoc, updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

console.log('[user-dashboard.js] start');

var userDashboard = document.getElementById('userDashboard');
var userOffers    = document.getElementById('userOffers');

export function deletePlot(offerId, plotIndex, title){
  var msg = 'Usunąć działkę "' + (title || ('#'+plotIndex)) + '" z oferty?';
  if (!confirm(msg)) return;

  var ref = doc(db, 'propertyListings', offerId);
  getDoc(ref).then(function(snap){
    if (!snap.exists()) { alert('Ogłoszenie nie istnieje.'); return; }
    var data = snap.data() || {};
    var plots = Array.isArray(data.plots) ? data.plots.slice() : [];
    if (plotIndex < 0 || plotIndex >= plots.length) { alert('Nieprawidłowy indeks działki.'); return; }
    plots.splice(plotIndex, 1);
    return updateDoc(ref, { plots: plots });
  }).then(function(){
    var u = auth.currentUser;
    if (u) loadUserOffers(u.email || null, u.uid || null);
    alert('Działka została usunięta.');
  }).catch(function(e){
    if (e) { console.error('deletePlot:', e); alert('Nie udało się usunąć działki.'); }
  });
}
window.deletePlot = deletePlot; // dla onclick w kartach

export function loadUserOffers(email, uid){
  if (!userOffers) return;
  userOffers.innerHTML = '<p>Ładuję Twoje oferty…</p>';

  var colRef = collection(db, "propertyListings");
  var requests = [];

  if (email) {
    requests.push(getDocs(query(colRef, where("email", "==", email))));
    requests.push(getDocs(query(colRef, where("userEmail", "==", email))));
  }
  if (uid) {
    requests.push(getDocs(query(colRef, where("userUid", "==", uid))));
    requests.push(getDocs(query(colRef, where("uid", "==", uid))));
    requests.push(getDocs(query(colRef, where("ownerId", "==", uid))));
  }

  Promise.allSettled(requests).then(function(results){
    var docsById = new Map();
    for (var i=0;i<results.length;i++){
      var r = results[i];
      if (r.status === 'fulfilled') {
        r.value.forEach(function(docSnap){ docsById.set(docSnap.id, docSnap); });
      }
    }

    userOffers.innerHTML = '';
    if (docsById.size === 0) {
      userOffers.innerHTML = '<p>Nie masz jeszcze żadnych ofert.</p>';
      return;
    }

    docsById.forEach(function(docSnap){
      var offer = docSnap.data();
      var offerId = docSnap.id;
      if (!Array.isArray(offer.plots) || offer.plots.length === 0) return;

      offer.plots
        .map(function(plot, originalIndex){ return { plot: plot, originalIndex: originalIndex }; })
        .filter(function(o){ return o.plot && o.plot.mock !== false; })
        .forEach(function(o, visibleIdx){
          var plot = o.plot;
          var originalIndex = o.originalIndex;

          var el = document.createElement('div');
          el.className = 'offer-card';

          var price = Number(plot.price || 0);
          var area  = Number(plot.pow_dzialki_m2_uldk || 0);
          var ppm2  = (price && area) ? Math.round(price / area) : 0;
          var city  = offer.city || 'Nie podano';
          var phone = offer.phone || 'Nie podano';
          var title = plot.Id || ('Działka ' + (visibleIdx + 1));
          var detailsUrl = 'oferta.html?id=' + offerId + '&plot=' + originalIndex;

          el.innerHTML =
            '<h3 class="offer-title">' + title + '</h3>' +
            '<div class="offer-details">' +
              '<p><strong>Lokalizacja:</strong> ' + city + '</p>' +
              '<p><strong>Telefon:</strong> ' + phone + '</p>' +
              (area  ? '<p><strong>Powierzchnia:</strong> ' + area.toLocaleString('pl-PL') + ' m²</p>' : '') +
              (price ? '<p><strong>Cena całkowita:</strong> ' + price.toLocaleString('pl-PL') + ' zł' +
                (ppm2 ? '<span style="color:#888;font-size:.85em;margin-left:5px;">' + ppm2.toLocaleString('pl-PL') + ' zł/m²</span>' : '') +
              '</p>' : '') +
            '</div>' +
            '<div class="offer-actions">' +
              '<a class="btn btn-accent btn-sm" target="_blank" href="' + detailsUrl + '">' +
                '<i class="fas fa-info-circle"></i> Szczegóły' +
              '</a>' +
              '<button class="btn btn-primary btn-sm" onclick="window.location.href=\'dodaj.html?edit=' + offerId + '&plot=' + originalIndex + '\'">' +
                '<i class="fas fa-edit"></i> Edytuj' +
              '</button>' +
              '<button class="btn btn-secondary btn-sm" onclick="deletePlot(\'' + offerId + '\',' + originalIndex + ', \'' + (String(title).replace(/'/g,"\\'")) + '\')">' +
                '<i class="fas fa-trash"></i> Usuń' +
              '</button>' +
            '</div>';

          el.addEventListener('click', function(e){
            if (e.target && e.target.closest && e.target.closest('.offer-actions')) return;
            if (window.focusOfferOnMap) window.focusOfferOnMap(offerId, originalIndex);
          });

          userOffers.appendChild(el);
        });
    });

    if (!userOffers.querySelector('.offer-card')) {
      userOffers.innerHTML = '<p>Nie masz jeszcze żadnych aktywnych ofert.</p>';
    }
  }).catch(function(err){
    console.error('loadUserOffers:', err);
    userOffers.innerHTML = '<p>Wystąpił błąd podczas ładowania ofert.</p>';
  });
}

// Słuchaj stanu auth
document.addEventListener('auth:state', function(e){
  var user = e.detail && e.detail.user ? e.detail.user : null;
  if (userDashboard) userDashboard.style.display = user ? 'block' : 'none';
  if (user) loadUserOffers(user.email || null, user.uid || null);
  else if (userOffers) userOffers.innerHTML = '';
});

// Na wszelki wypadek: gdy już zalogowany przed załadowaniem
document.addEventListener('DOMContentLoaded', function(){
  if (auth && auth.currentUser) {
    if (userDashboard) userDashboard.style.display = 'block';
    loadUserOffers(auth.currentUser.email || null, auth.currentUser.uid || null);
  }
});
