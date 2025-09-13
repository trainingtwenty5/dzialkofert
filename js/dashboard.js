// js/dashboard.js
// Placeholder – jeśli masz własne pobieranie ofert, możesz je tu wkleić.

// Prosty renderer „Moje oferty” – pokaże info, że brak, jeśli nie podmienisz.
window.loadUserOffers = async function(email, uid){
  const grid = document.getElementById('userOffers');
  if (!grid) return;

  // TODO: podmień na swoje pobieranie z Firestore jeśli chcesz.
  grid.innerHTML = `
    <div class="offer-card">
      <h3 class="offer-title">Twoje oferty pojawią się tutaj</h3>
      <div class="offer-details">
        <p>Zalogowano jako: <strong>${email || '(brak e-maila)'}</strong></p>
        <p>UID: <code>${uid || '(brak UID)'}</code></p>
      </div>
      <div class="offer-actions">
        <a class="btn btn-accent btn-sm" href="dodaj.html"><i class="fas fa-plus"></i> Dodaj pierwszą ofertę</a>
      </div>
    </div>`;
};
