// assets/js/bootstrap.js
const repoBase = new URL("../..", import.meta.url); // => https://user.github.io/REPO/

async function fetchText(relPath) {
  const url = new URL(relPath, repoBase);
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

async function injectPartials() {
  const headerSlot = document.getElementById("headerSlot");
  const footerSlot = document.getElementById("footerSlot");
  if (headerSlot) headerSlot.innerHTML = await fetchText("partials/header.html");
  if (footerSlot) footerSlot.innerHTML = await fetchText("partials/footer.html");
  document.dispatchEvent(new CustomEvent("partials:ready"));
}
