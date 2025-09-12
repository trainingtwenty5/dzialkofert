// assets/js/index.js
export function initIndexUI() {
  // Hamburger
  const mobileMenuBtn = document.querySelector(".mobile-menu-btn");
  const navMenu = document.querySelector(".nav-menu");
  const mobileAuth = document.getElementById("mobileAuth");

  if (mobileMenuBtn && navMenu) {
    mobileMenuBtn.addEventListener("click", () => {
      navMenu.classList.toggle("active");
      if (mobileAuth) {
        mobileAuth.style.display = navMenu.classList.contains("active") ? "flex" : "none";
      }
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 768) {
        navMenu.classList.remove("active");
        if (mobileAuth) mobileAuth.style.display = "none";
      }
    });
  }

  // FAQ akordeon (opcjonalnie, jeśli masz takie elementy)
  document.querySelectorAll(".faq-item .faq-question")?.forEach(q => {
    q.addEventListener("click", () => q.parentElement.classList.toggle("active"));
  });

  console.log("[index.js] UI bound");
}
