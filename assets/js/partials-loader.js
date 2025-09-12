// assets/js/partials-loader.js
console.log('[partials-loader] init');

function inject(selector, html) {
  var slot = document.querySelector(selector);
  if (slot) slot.innerHTML = html;
}

function fetchPartial(pathFromPage) {
  // próba pobrania pliku HTML (zadziała na http/https)
  return fetch(pathFromPage, { cache: 'no-store' }).then(function (r) {
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.text();
  });
}

function loadWithFallback(slotSelector, htmlPathFromPage, jsModuleRelativeToThisFile) {
  return fetchPartial(htmlPathFromPage).then(function (html) {
    inject(slotSelector, html);
  }).catch(function (err) {
    console.warn('[partials-loader] fetch failed -> fallback', htmlPathFromPage, err);
    // dynamiczny import licząc ścieżkę od TEGO pliku (assets/js/partials-loader.js)
    var url = new URL(jsModuleRelativeToThisFile, import.meta.url).href;
    return import(url).then(function (mod) {
      inject(slotSelector, mod.default || '');
    });
  });
}

// publiczna obietnica
window.partialsReady = Promise.all([
  // Uwaga na ścieżki:
  // htmlPathFromPage: relative od strony (np. szablon.html leży w root → "partials/*.html")
  // jsModuleRelativeToThisFile: relative od pliku "assets/js/partials-loader.js"
  loadWithFallback('#headerSlot', 'partials/header.html', '../../partials/header.js'),
  loadWithFallback('#footerSlot', 'partials/footer.html', '../../partials/footer.js')
]).then(function () {
  document.dispatchEvent(new CustomEvent('partials:ready'));
  console.log('[partials-loader] ready');
});
