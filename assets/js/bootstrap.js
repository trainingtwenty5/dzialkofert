// assets/js/bootstrap.js
import './partials-loader.js';

// poczekaj aż header/footer będą w DOM,
// a potem doładuj Twoje moduły (auth, dashboard, index)
(window.partialsReady || Promise.resolve()).then(function(){
  return Promise.all([
    import('./auth.js'),
    import('./user-dashboard.js'),
    import('./index.js'),
  ]);
}).catch(function(e){
  console.error('[bootstrap] error', e);
});
