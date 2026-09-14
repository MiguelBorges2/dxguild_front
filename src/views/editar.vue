<template>
  <main class="coming-soon-page">
    <section class="coming-soon-card" aria-labelledby="coming-soon-title">
      <p class="eyebrow">Perfil</p>
      <h1 id="coming-soon-title">Edi&ccedil;&atilde;o de perfil</h1>
      <p>Esta funcionalidade est&aacute; por vir.</p>
      <router-link to="/perfil" class="back-link">Voltar ao perfil</router-link>
    </section>
  </main>
</template>

<style scoped>
.coming-soon-page {
  display: grid;
  min-height: calc(100vh - 3rem);
  place-items: center;
  padding: 2rem 1.25rem;
  background: radial-gradient(circle at top, #302313, #0b0a08 65%);
}

.coming-soon-card {
  width: min(100%, 34rem);
  padding: 2.5rem;
  border: 1px solid rgba(212, 175, 55, 0.45);
  border-radius: 12px;
  background: rgba(13, 11, 8, 0.88);
  box-shadow: 0 1rem 3rem rgba(0, 0, 0, 0.45);
  color: #eee4c9;
  text-align: center;
}

.eyebrow {
  margin: 0 0 0.5rem;
  color: #d4af37;
  font-family: 'Cinzel', serif;
  font-size: 0.8rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

h1 {
  margin: 0;
  color: #f0e68c;
  font-family: 'Cinzel', serif;
}

.coming-soon-card > p:not(.eyebrow) {
  margin: 1rem 0 1.75rem;
  color: #c9bea1;
}

.back-link {
  display: inline-block;
  padding: 0.65rem 1rem;
  border: 1px solid #d4af37;
  border-radius: 6px;
  color: #f0e68c;
  font-family: 'Cinzel', serif;
  text-decoration: none;
}

.back-link:hover {
  background: rgba(212, 175, 55, 0.15);
}
</style>
