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

  try {
    if (headerSlot) {
      headerSlot.innerHTML = await fetchText("partials/header.html");
    }
  } catch (e) {
    console.error("[partials] header failed:", e);
  }

  try {
    if (footerSlot) {
      footerSlot.innerHTML = await fetchText("partials/footer.html");
    }
  } catch (e) {
    console.error("[partials] footer failed:", e);
  }

  document.dispatchEvent(new CustomEvent("partials:ready"));
}

(async () => {
  try {
    await injectPartials();

    // Importy po wstrzyknięciu header/footer (podbijam ?v=5, żeby wyczyścić cache)
    const v = "v=5";
    const [{ initAuthUI }, { initUserDashboard }, { initIndexUI }] = await Promise.all([
      import(`./auth.js?${v}`),
      import(`./user-dashboard.js?${v}`),
      import(`./index.js?${v}`),
    ]);

    await initAuthUI?.();
    initUserDashboard?.();
    initIndexUI?.();

    console.log("[bootstrap] ready");
  } catch (e) {
    console.error("[bootstrap] failed", e);
  }
})();
