// assets/js/bootstrap.js
const repoBase = new URL("https://trainingtwenty5.github.io/dzialkofert/");

async function fetchText(relPath) {
  const url = new URL(relPath, repoBase);
  console.log("[partials] fetch:", url.toString());
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

(async () => {
  try {
    await injectPartials();
    const [{ initAuthUI }, { initUserDashboard }, { initIndexUI }] = await Promise.all([
      import("./auth.js?v=2"),
      import("./user-dashboard.js?v=2"),
      import("./index.js?v=2"),
    ]);
    await initAuthUI();
    initUserDashboard?.();
    initIndexUI?.();
    console.log("[bootstrap] ready");
  } catch (e) {
    console.error("[bootstrap] failed", e);
  }
})();
