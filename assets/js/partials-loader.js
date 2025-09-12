// assets/js/partials-loader.js
console.log('[partials-loader] init');

function inject(selector, html) {
  const slot = document.querySelector(selector);
  if (!slot) return console.error('[partials-loader] slot not found:', selector);
  slot.innerHTML = html;
}

function fetchPartial(pathFromPage) {
  return fetch(pathFromPage, { cache: 'no-store' }).then(r => {
    if (!r.ok) throw new Error('HTTP ' + r.status + ' ' + pathFromPage);
    return r.text();
  });
}

function loadWithFallback(slotSelector, htmlPathFromPage, jsModuleRelativeToThisFile) {
  return fetchPartial(htmlPathFromPage).then(html => {
    console.log('[partials-loader] fetched', htmlPathFromPage);
    inject(slotSelector, html);
  }).catch(err => {
    console.warn('[partials-loader] fetch failed → fallback to JS module', err.message);
    const url = new URL(jsModuleRelativeToThisFile, import.meta.url).href;
    return import(url).then(mod => {
      console.log('[partials-loader] imported', url);
      inject(slotSelector, mod.default || '');
    }).catch(e => {
      console.error('[partials-loader] fallback import failed', e);
      throw e;
    });
  });
}

window.partialsReady = Promise.all([
  // htmlPathFromPage → względem strony (szablon.html w root → "partials/...").
  // jsModuleRelativeToThisFile → względem TEGO pliku (assets/js/ → ../../partials/...).
  loadWithFallback('#headerSlot', 'partials/header.html', '../../partials/header.js'),
  loadWithFallback('#footerSlot', 'partials/footer.html', '../../partials/footer.js'),
]).then(() => {
  document.dispatchEvent(new CustomEvent('partials:ready'));
  console.log('[partials-loader] ready');
});
