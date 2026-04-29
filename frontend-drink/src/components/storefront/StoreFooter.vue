<template>
  <footer class="site-footer">
    <div class="footer-grid">
      <section class="footer-brand">
        <p class="eyebrow">La Cantina</p>
        <h2>Una portada nueva para tu storefront</h2>
        <p>
          Este frontend ya no depende del HTML estatico. Ahora vive como una interfaz Vue
          mantenible, conectada a categorias, productos y carrito reales.
        </p>
      </section>

      <section>
        <h3>Navegacion</h3>
        <ul>
          <li><a href="#top">Inicio</a></li>
          <li><a href="#catalogo">Catalogo</a></li>
          <li><a href="#top">Categorias</a></li>
        </ul>
      </section>

      <section>
        <h3>Infraestructura</h3>
        <ul>
          <li>Vue 3 + Vite</li>
          <li>Pinia para storefront</li>
          <li>Backend NestJS multi-store</li>
        </ul>
      </section>
    </div>

    <div class="footer-bottom">
      <span>Frontend Drink · La Cantina</span>
      <span>Integrado con API storefront</span>
    </div>
  </footer>
</template>

<style scoped>
.site-footer {
  display: grid;
  gap: 18px;
  padding: 36px 0 10px;
}

.footer-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) repeat(2, minmax(180px, 0.75fr));
  gap: 24px;
  padding-top: 24px;
  border-top: 1px solid rgba(18, 16, 15, 0.08);
}

.eyebrow {
  margin: 0 0 12px;
  color: #7b1f2c;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.24em;
  text-transform: uppercase;
}

.footer-brand h2 {
  margin: 0;
  color: #12100f;
  font-family: 'Georgia', serif;
  font-size: 38px;
  letter-spacing: -0.05em;
}

.footer-brand p:last-child {
  margin: 14px 0 0;
  max-width: 48ch;
  color: #5a514c;
  line-height: 1.7;
}

section h3 {
  margin: 0 0 14px;
  color: #12100f;
  font-size: 13px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

ul {
  display: grid;
  gap: 10px;
  padding: 0;
  margin: 0;
  list-style: none;
}

li,
a {
  color: #5a514c;
  text-decoration: none;
}

.footer-bottom {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 0 10px;
  color: #7d736d;
  font-size: 12px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

@media (max-width: 900px) {
  .footer-grid,
  .footer-bottom {
    grid-template-columns: 1fr;
  }

  .footer-bottom {
    flex-direction: column;
  }
}
</style>
