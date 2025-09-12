// assets/js/bootstrap.js
import './partials-loader.js';

// Gdy partiale są w DOM, ładujemy resztę modułów, które zakładają ich istnienie
(window.partialsReady || Promise.resolve()).then(function () {
  return Promise.all([
    import('./auth.js'),            // tu masz Firebase + modale
    import('./user-dashboard.js'),  // dashboard
    import('./index.js')            // hamburger, FAQ itd.
  ]);
}).catch(function (e) {
  console.error('[bootstrap] error', e);
});
