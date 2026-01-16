<template>
  <footer class="footer">
    <div class="container footer-inner">
      <div>
        <div class="footer-title">E-Shop Atelier</div>
        <p class="footer-copy">
          Disenado para marcas que venden con calma. API y frontends listos para
          crecer.
        </p>
      </div>
      <div class="footer-links">
        <span class="tag">Envios 48h</span>
        <span class="tag">Pagos seguros</span>
        <span class="tag">Stock en vivo</span>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  border-top: 1px solid rgba(214, 75, 42, 0.12);
  padding: 40px 0 60px;
}

.footer-inner {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  align-items: center;
  justify-content: space-between;
}

.footer-title {
  font-family: 'Fraunces', serif;
  font-size: 18px;
  margin-bottom: 6px;
}

.footer-copy {
  margin: 0;
  color: var(--muted);
  max-width: 420px;
}

.footer-links {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
</style>
