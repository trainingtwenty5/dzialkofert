import { auth, db } from "./auth.js";
import {
  collection, query, where, getDocs,
  doc, getDoc, updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const userDashboard = document.getElementById("userDashboard");
const userOffers    = document.getElementById("userOffers");

// --- GLOBAL: udostępniam też w window (jeśli jednak chcesz użyć onclick gdzieś indziej)
window.deletePlot = async (offerId, plotIndex, title = "działkę") => {
  const ok = confirm(`Na pewno usunąć "${title}"?`);
  if (!ok) return;

  try {
    const ref = doc(db, "propertyListings", offerId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return alert("Oferta nie istnieje.");

    // soft-delete: dashboard filtruje plot.mock !== false
    const data  = snap.data();
    const plots = Array.isArray(data.plots) ? data.plots.slice() : [];
    if (!plots[plotIndex]) return alert("Nieprawidłowy indeks działki.");

    plots[plotIndex] = { ...(plots[plotIndex] || {}), mock: false };
    await updateDoc(ref, { plots });

    const u = auth.currentUser;
    if (u) await loadUserOffers(u.email || null, u.uid || null);
    alert("Działka została usunięta.");
  } catch (e) {
    console.error("deletePlot:", e);
    alert("Nie udało się usunąć działki.");
  }
};

async function loadUserOffers(email, uid) {
  if (!userOffers) return;
  userOffers.innerHTML = "<p>Ładuję Twoje oferty…</p>";

  try {
    const colRef = collection(db, "propertyListings");
    const queries = [];

    if (email) {
      queries.push(getDocs(query(colRef, where("email", "==", email))));
      queries.push(getDocs(query(colRef, where("userEmail", "==", email))));
    }
    if (uid) {
      queries.push(getDocs(query(colRef, where("userUid", "==", uid))));
      queries.push(getDocs(query(colRef, where("uid", "==", uid))));
      queries.push(getDocs(query(colRef, where("ownerId", "==", uid))));
    }

    const results = await Promise.allSettled(queries);
    const docsById = new Map();
    results.forEach(r => {
      if (r.status === "fulfilled") {
        r.value.forEach(docSnap => docsById.set(docSnap.id, docSnap));
      }
    });

    userOffers.innerHTML = "";

    if (docsById.size === 0) {
      userOffers.innerHTML = "<p>Nie masz jeszcze żadnych ofert.</p>";
      return;
    }

    docsById.forEach(docSnap => {
      const offer = docSnap.data();
      const offerId = docSnap.id;
      if (!Array.isArray(offer.plots) || offer.plots.length === 0) return;

      offer.plots
        .map((plot, originalIndex) => ({ plot, originalIndex }))
        .filter(({ plot }) => plot?.mock !== false)
        .forEach(({ plot, originalIndex }, visibleIdx) => {
          const el = document.createElement("div");
          el.className = "offer-card";

          const price = Number(plot.price || 0);
          const area  = Number(plot.pow_dzialki_m2_uldk || 0);
          const ppm2  = price && area ? Math.round(price / area) : 0;
          const city  = offer.city || "Nie podano";
          const phone = offer.phone || "Nie podano";
          const title = plot.Id || `Działka ${visibleIdx + 1}`;
          const detailsUrl = `oferta.html?id=${offerId}&plot=${originalIndex}`;

          // Uwaga: BEZ onclick — używamy delegacji + data-*
          el.innerHTML = `
            <h3 class="offer-title">${title}</h3>
            <div class="offer-details">
              <p><strong>Lokalizacja:</strong> ${city}</p>
              <p><strong>Telefon:</strong> ${phone}</p>
              ${area  ? `<p><strong>Powierzchnia:</strong> ${area.toLocaleString('pl-PL')} m²</p>` : ""}
              ${price ? `<p><strong>Cena całkowita:</strong> ${price.toLocaleString('pl-PL')} zł
                ${ppm2 ? `<span style="color:#888;font-size:.85em;margin-left:5px;">${ppm2.toLocaleString('pl-PL')} zł/m²</span>` : ""}
              </p>` : ""}
            </div>
            <div class="offer-actions">
              <a class="btn btn-accent btn-sm" target="_blank" href="${detailsUrl}">
                <i class="fas fa-info-circle"></i> Szczegóły
              </a>
              <button class="btn btn-primary btn-sm" data-action="edit" data-offer-id="${offerId}" data-plot-index="${originalIndex}">
                <i class="fas fa-edit"></i> Edytuj
              </button>
              <button class="btn btn-secondary btn-sm" data-action="delete" data-offer-id="${offerId}" data-plot-index="${originalIndex}" data-title="${(title||'').replace(/"/g,"&quot;")}">
                <i class="fas fa-trash"></i> Usuń
              </button>
            </div>
          `;

          el.addEventListener("click", (e) => {
            if (e.target.closest(".offer-actions")) return; // klik w przyciski – osobno obsługiwany
            if (window.focusOfferOnMap) window.focusOfferOnMap(offerId, originalIndex);
          });

          userOffers.appendChild(el);
        });
    });

    if (!userOffers.querySelector(".offer-card")) {
      userOffers.innerHTML = "<p>Nie masz jeszcze żadnych aktywnych ofert.</p>";
    }
  } catch (err) {
    console.error("loadUserOffers:", err);
    userOffers.innerHTML = "<p>Wystąpił błąd podczas ładowania ofert.</p>";
  }
}

// --- Delegacja zdarzeń dla edycji/usuwania (bez onclick)
if (userOffers) {
  userOffers.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;

    const action = btn.dataset.action;
    const offerId = btn.dataset.offerId;
    const plotIndex = Number(btn.dataset.plotIndex || 0);
    const title = btn.dataset.title || "działkę";

    if (action === "edit") {
      window.location.href = `dodaj.html?edit=${offerId}&plot=${plotIndex}`;
    } else if (action === "delete") {
      window.deletePlot(offerId, plotIndex, title);
    }
  });
}

// --- POKAŻ DASHBOARD od razu, jeśli user już jest (po refreshu)
function showDashboardForCurrentUser() {
  const u = auth.currentUser;
  if (u) {
    if (userDashboard) userDashboard.style.display = "block";
    loadUserOffers(u.email || null, u.uid || null);
  }
}

// 1) natychmiastowa próba (gdy stan już dostępny)
showDashboardForCurrentUser();

// 2) pewniak – reaguje zawsze (także gdy stan pojawi się chwilę później)
onAuthStateChanged(auth, (user) => {
  if (user) {
    if (userDashboard) userDashboard.style.display = "block";
    loadUserOffers(user.email || null, user.uid || null);
  } else {
    if (userDashboard) userDashboard.style.display = "none";
    if (userOffers) userOffers.innerHTML = "";
  }
});

// 3) zostawiamy też wsparcie dla custom eventów z auth.js (działa bez refreshu)
window.addEventListener("auth:login", (ev) => {
  const u = ev.detail.user;
  if (userDashboard) userDashboard.style.display = "block";
  loadUserOffers(u.email || null, u.uid || null);
});
window.addEventListener("auth:logout", () => {
  if (userDashboard) userDashboard.style.display = "none";
  if (userOffers) userOffers.innerHTML = "";
});
