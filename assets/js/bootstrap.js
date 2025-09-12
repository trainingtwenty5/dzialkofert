// assets/js/bootstrap.js
import './partials-loader.js';

(window.partialsReady || Promise.resolve()).then(() => {
  return Promise.all([
    import('./auth.js'),
    import('./user-dashboard.js'),
    import('./index.js'),
  ]);
}).catch(e => console.error('[bootstrap] error', e));
