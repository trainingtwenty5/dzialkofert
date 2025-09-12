// assets/js/partials-loader.js
console.log('[partials-loader] init');

function inject(selector, html) {
  var slot = document.querySelector(selector);
  if (slot) slot.innerHTML = html;
}

function fetchPartial(url) {
  return fetch(url, { cache: 'no-store' }).then(function(r){
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.text();
  });
}

// Uwaga: fetch działa z pliku tylko w niektórych przeglądarkach.
// Robimy fallback do modułów JS.
function loadWithFallback(slotSelector, htmlPath, jsModulePathFromThisFile) {
  return fetchPartial(htmlPath).then(function(html){
    inject(slotSelector, html);
  }).catch(function(err){
    console.warn('[partials-loader] fetch failed for', htmlPath, err);
    // dynamiczny import względem lokalizacji TEGO pliku
    var url = new URL(jsModulePathFromThisFile, import.meta.url).href;
    return import(url).then(function(mod){
      inject(slotSelector, mod.default || '');
    });
  });
}

// Publiczna obietnica gotowości
window.partialsReady = Promise.all([
  loadWithFallback('#headerSlot', 'partials/header.html', '../../partials/header.js'),
  loadWithFallback('#footerSlot', 'partials/footer.html', '../../partials/footer.js'),
]).then(function(){
  document.dispatchEvent(new CustomEvent('partials:ready'));
  console.log('[partials-loader] ready');
});
