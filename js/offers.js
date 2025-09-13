// js/offers.js
import { auth, db } from './auth.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { collection, query, where, getDocs } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

// --- DOM ---
const userDashboard = document.getElementById('userDashboard');
const userOffersEl  = document.getElementById('userOffers');
const myOffersTitle = document.getElementById('myOffersTitle');

function setMyOffersVisibility(show) {
  if (userDashboard) userDashboard.style.display = show ? 'block' : 'none';
  if (myOffersTitle) myOffersTitle.style.display = show ? 'block' : 'none';
}

function centerTitles() {
  try {
    document.querySelectorAll('.section-title h2, .user-header h2').forEach(h => {
      h.style.textAlign = 'center';
      h.style.marginLeft = 'auto';
      h.style.marginRight = 'auto';
    });
  } catch {}
}
centerTitles();

// --- GŁÓWNA FUNKCJA: wczytaj oferty zalogowanego ---
async function loadUserOffers(email, uid) {
  if (!userOffersEl) return;

  userOffersEl.innerHTML = '<p>Ładuję Twoje oferty…</p>';

  const results = new Map(); // id -> snap
  const emailFields = ['email','userEmail','ownerEmail','createdByEmail','contactEmail'];
  const uidFields   = ['userUid','uid','userId','ownerId','createdBy'];

  try {
    // po e-mailu (różne pola + lowercase)
    if (email) {
      const variants = [...new Set([email, email.toLowerCase()])];
      for (const field of emailFields) {
        for (const val of variants) {
          try {
            const snap = await getDocs(query(collection(db, 'propertyListings'), where(field, '==', val)));
            snap.forEach(d => results.set(d.id, d));
          } catch {/* ignoruj pojedyncze błędy pól */}
        }
      }
    }

    // po UID (różne pola)
    if (uid) {
      for (const field of uidFields) {
        try {
          const snap = await getDocs(query(collection(db, 'propertyListings'), where(field, '==', uid)));
          snap.forEach(d => results.set(d.id, d));
        } catch {}
      }
    }
  } catch (e) {
    console.error('loadUserOffers error:', e);
  }

  userOffersEl.innerHTML = '';
  if (results.size === 0) {
    userOffersEl.innerHTML = '<p>Nie znaleziono Twoich ofert.</p>';
    setMyOffersVisibility(true);
    return;
  }

  for (const docSnap of results.values()) {
    const offer   = docSnap.data();
    const offerId = docSnap.id;
    if (!Array.isArray(offer.plots) || offer.plots.length === 0) continue;

    const activePlots = offer.plots
      .map((plot, originalIndex) => ({ plot, originalIndex }))
      .filter(({ plot }) => plot?.mock !== false);

    for (const { plot, originalIndex } of activePlots) {
      const price = Number(plot.price || 0);
      const area  = Number(plot.pow_dzialki_m2_uldk || plot.area || plot.areaM2 || 0);
      const ppm2  = price && area ? Math.round(price/area) : 0;
      const detailsUrl = `oferta.html?id=${offerId}&plot=${originalIndex}`;

      const card = document.createElement('div');
      card.className = 'offer-card';
      card.innerHTML = `
        <h3 class="offer-title">${plot.Id || 'Działka'}</h3>
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
          <button class="btn btn-primary btn-sm" onclick="location.href='dodaj.html?edit=${offerId}&plot=${originalIndex}'">
            <i class="fas fa-edit"></i> Edytuj
          </button>
          <button class="btn btn-secondary btn-sm"
            ${'deletePlot' in window
              ? `onclick="deletePlot('${offerId}', ${originalIndex}, '${(plot.Id||'Działka').replace(/'/g,"\\'")}')"`
              : 'disabled title="Usuwanie niedostępne na tej stronie"'}>
            <i class="fas fa-trash"></i> Usuń
          </button>
        </div>
      `;

      // Kliknięcie karty = fokus na mapie (jeśli funkcja istnieje na tej stronie)
      card.addEventListener('click', (e) => {
        if (e.target.closest('.offer-actions')) return;
        if (typeof window.focusOfferOnMap === 'function') {
          window.focusOfferOnMap(offerId, originalIndex);
        }
      });

      userOffersEl.appendChild(card);
    }
  }

  setMyOffersVisibility(true);
}

// Udostępnij dla auth.js (ten plik jest ładowany PO auth.js, ale auth ma retry)
window.loadUserOffers = loadUserOffers;

// Lokalny nasłuch na wypadek, gdyby auth.js nie zdążył
onAuthStateChanged(auth, (user) => {
  if (user) loadUserOffers(user.email || null, user.uid || null);
  else setMyOffersVisibility(false);
});
