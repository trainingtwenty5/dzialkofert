// partials/footer.js
export default `
<footer id="contact">
  <div class="container">
    <div class="footer-container">
      <div class="footer-about">
        <a href="index.html" class="footer-logo" aria-label="Działkofert">
          <img src="brand-assets/android-chrome-192x192.png"
               srcset="brand-assets/android-chrome-192x192.png 1x, brand-assets/android-chrome-512x512.png 2x"
               alt="Działkofert" width="40" height="40" loading="eager" decoding="async" fetchpriority="high" />
          <span>Działkofert</span>
        </a>
        <p>Bezpłatne ogłoszenia nieruchomości. Szybka sprzedaż działek bez zbędnych kosztów i formalności.</p>
      </div>

      <div class="footer-links">
        <h3>Przydatne linki</h3>
        <ul>
          <li><a href="index.html">Strona główna</a></li>
          <li><a href="oferty.html">Oferty</a></li>
          <li><a href="dodaj.html">Dodaj ofertę</a></li>
          <li><a href="#contact">Kontakt</a></li>
        </ul>
      </div>

      <div class="footer-contact">
        <h3>Kontakt</h3>
        <p><i class="fas fa-envelope"></i> info@dzialkofert.pl</p>
        <p><i class="fas fa-phone"></i> +48 123 456 789</p>
      </div>
    </div>
    <div class="footer-bottom">© 2025 Działkofert. Wszelkie prawa zastrzeżone.</div>
  </div>
</footer>
`;
