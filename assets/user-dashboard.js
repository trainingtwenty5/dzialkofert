import { auth, db } from './auth.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { collection, getDocs, query, where, getDoc, doc, updateDoc } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

const userDashboard = document.getElementById('userDashboard');
const userOffers = document.getElementById('userOffers');

async function loadUserOffers(email, uid) {
  if (!userOffers) return;
  userOffers.innerHTML = '<p>Ładuję Twoje oferty…</p>';

  try {
    const colRef = collection(db, 'propertyListings');
    const queries = [];

    if (email) {
      queries.push(getDocs(query(colRef, where('email', '==', email))));
      queries.push(getDocs(query(colRef, where('userEmail', '==', email))));
    }
    if (uid) {
      queries.push(getDocs(query(colRef, where('userUid', '==', uid))));
      queries.push(getDocs(query(colRef, where('uid', '==', uid))));
      queries.push(getDocs(query(colRef, where('ownerId', '==', uid))));
    }

    const results = await Promise.allSettled(queries);
    const docsById = new Map();
    results.forEach(r => {
      if (r.status === 'fulfilled') {
        r.value.forEach(docSnap => docsById.set(docSnap.id, docSnap));
      }
    });

    userOffers.innerHTML = '';

    if (docsById.size === 0) {
      userOffers.innerHTML = '<p>Nie masz jeszcze żadnych ofert.</p>';
      return;
    }

    docsById.forEach(docSnap => {
      const offer = docSnap.data();
      const offerId = docSnap.id;
      if (!Array.isArray(offer.plots) || offer.plots.length === 0) return;

      offer.plots
        .map((plot, originalIndex) => ({ plot, originalIndex }))
        .filter(({ plot }) => plot?.mock !== false)
        .forEach(({ plot, originalIndex }, i) => {
          const el = document.createElement('div');
          el.className = 'offer-card';

          const price = Number(plot.price || 0);
          const area  = Number(plot.pow_dzialki_m2_uldk || 0);
          const ppm2  = price && area ? Math.round(price / area) : 0;
          const city  = offer.city || 'Nie podano';
          const phone = offer.phone || 'Nie podano';
          const title = plot.Id || `Działka ${i + 1}`;
          const detailsUrl = `oferta.html?id=${offerId}&plot=${originalIndex}`;

          el.innerHTML = `
                <h3 class="offer-title">${title}</h3>
                <div class="offer-details">
                  <p><strong>Lokalizacja:</strong> ${city}</p>
                  <p><strong>Telefon:</strong> ${phone}</p>
                  ${area  ? `<p><strong>Powierzchnia:</strong> ${area.toLocaleString('pl-PL')} m²</p>` : ''}
                  ${price ? `<p><strong>Cena całkowita:</strong> ${price.toLocaleString('pl-PL')} zł${ppm2 ? `<span style="color:#888;font-size:.85em;margin-left:5px;">${ppm2.toLocaleString('pl-PL')} zł/m²</span>` : ''}</p>` : ''}
                </div>
                <div class="offer-actions">
                  <a class="btn btn-accent btn-sm" target="_blank" href="${detailsUrl}">
                    <i class="fas fa-info-circle"></i> Szczegóły
                  </a>
                  <button class="btn btn-primary btn-sm" onclick="window.location.href='dodaj.html?edit=${offerId}&plot=${originalIndex}'">
                    <i class="fas fa-edit"></i> Edytuj
                  </button>
                  <button class="btn btn-secondary btn-sm" onclick="deletePlot && deletePlot('${offerId}', ${originalIndex}, '${(title||'').replace(/'/g,"\\'")}')">
                    <i class="fas fa-trash"></i> Usuń
                  </button>
                </div>
          `;

          el.addEventListener('click', (e) => {
            if (e.target.closest('.offer-actions')) return;
            if (window.focusOfferOnMap) window.focusOfferOnMap(offerId, originalIndex);
          });

          userOffers.appendChild(el);
        });
    });

    if (!userOffers.querySelector('.offer-card')) {
      userOffers.innerHTML = '<p>Nie masz jeszcze żadnych aktywnych ofert.</p>';
    }
  } catch (err) {
    console.error('loadUserOffers:', err);
    userOffers.innerHTML = '<p>Wystąpił błąd podczas ładowania ofert.</p>';
  }
}

window.deletePlot = async function(offerId, plotIndex, plotTitle) {
  const ok = confirm(`Czy na pewno chcesz usunąć ofertę „${plotTitle}”?`);
  if (!ok) return;
  try {
    const offerDoc = await getDoc(doc(db, 'propertyListings', offerId));
    if (!offerDoc.exists()) return alert('Oferta nie istnieje.');
    const offerData = offerDoc.data();
    if (!Array.isArray(offerData.plots) || plotIndex >= offerData.plots.length) return alert('Wybrana działka nie istnieje.');
    const updated = [...offerData.plots];
    updated[plotIndex] = { ...updated[plotIndex], mock: false };
    await updateDoc(doc(db, 'propertyListings', offerId), { plots: updated });
    const user = auth.currentUser;
    if (user) await loadUserOffers(user.email || null, user.uid || null);
    alert(`Oferta „${plotTitle}” została usunięta.`);
  } catch (err) {
    console.error('deletePlot:', err);
    alert('Wystąpił błąd podczas usuwania oferty.');
  }
};

onAuthStateChanged(auth, (user) => {
  if (user) {
    userDashboard && (userDashboard.style.display = 'block');
    loadUserOffers(user.email || null, user.uid || null);
  } else {
    userDashboard && (userDashboard.style.display = 'none');
    if (userOffers) userOffers.innerHTML = '';
  }
});

export { loadUserOffers };
