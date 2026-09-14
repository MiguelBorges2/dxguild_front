<template>
  <main class="about-page">
    <section class="about-hero">
      <div class="hero-content">
        <span class="eyebrow"><span aria-hidden="true">✦</span> A guilda por trás das aventuras</span>
        <h1>Sobre o <strong>DXGuild</strong></h1>
        <p class="hero-lead">
          Um espaço feito para transformar a busca por uma mesa de RPG em parte da própria aventura.
          Conectamos mestres e jogadores para que cada grupo encontre seu próximo mundo.
        </p>
        <div class="hero-actions">
          <router-link to="/buscar" class="primary-button">
            Encontrar uma mesa <span aria-hidden="true">→</span>
          </router-link>
          <span class="hero-note"><span class="note-dot"></span> Feito para aventureiros</span>
        </div>
      </div>

      <div class="hero-crest" aria-hidden="true">
        <div class="crest-ring"></div>
        <span class="crest-sword">⚔</span>
        <span class="crest-star">✦</span>
      </div>
    </section>

    <section class="mission-section section-shell" aria-labelledby="mission-title">
      <div class="section-heading">
        <span class="eyebrow">Nossa missão</span>
        <h2 id="mission-title">Toda grande história começa com um grupo.</h2>
      </div>
      <div class="mission-copy">
        <p>
          O DXGuild nasceu para aproximar pessoas que compartilham a paixão por RPG. Seja você um mestre
          construindo um novo reino ou um jogador procurando sua próxima campanha, a plataforma reúne tudo
          o que você precisa para jogar com mais praticidade.
        </p>
        <p>
          Organizamos mesas, conversas e recursos em um só lugar, deixando o foco onde ele deve estar:
          nas decisões inesperadas, nas amizades e nas histórias que só acontecem ao redor da mesa.
        </p>
      </div>
    </section>

    <section class="features-section section-shell" aria-labelledby="features-title">
      <div class="section-heading centered">
        <span class="eyebrow">Feito para a sua campanha</span>
        <h2 id="features-title">Tudo para a jornada continuar</h2>
        <p>Ferramentas simples para organizar a mesa e dar espaço para a imaginação.</p>
      </div>

      <div class="feature-grid">
        <article class="feature-card">
          <div class="feature-icon">♟</div>
          <h3>Encontre seu grupo</h3>
          <p>Pesquise mesas por nome ou sistema e descubra campanhas que combinam com seu estilo de jogo.</p>
          <span class="card-number">01</span>
        </article>
        <article class="feature-card">
          <div class="feature-icon">⌂</div>
          <h3>Crie sua mesa</h3>
          <p>Apresente sua aventura, convide jogadores e construa uma comunidade em torno da sua campanha.</p>
          <span class="card-number">02</span>
        </article>
        <article class="feature-card">
          <div class="feature-icon">✎</div>
          <h3>Gerencie fichas</h3>
          <p>Mantenha fichas e materiais importantes organizados para consultar quando a aventura chamar.</p>
          <span class="card-number">03</span>
        </article>
        <article class="feature-card">
          <div class="feature-icon">◈</div>
          <h3>Converse em tempo real</h3>
          <p>Troque mensagens, compartilhe imagens e role dados junto do seu grupo dentro da mesa.</p>
          <span class="card-number">04</span>
        </article>
      </div>
    </section>

    <section class="security-section section-shell" aria-labelledby="security-title">
      <div class="security-icon" aria-hidden="true">⌾</div>
      <div>
        <span class="eyebrow">Compromisso com a segurança</span>
        <h2 id="security-title">Sua aventura merece um espaço confiável.</h2>
        <p>
          Privacidade e segurança fazem parte da experiência desde o primeiro acesso. O DXGuild foi pensado
          para manter suas informações protegidas, com autenticação de conta, acesso controlado às mesas e
          materiais compartilhados apenas com quem deve vê-los.
        </p>
        <div class="security-points">
          <span><b>✓</b> Acesso autenticado</span>
          <span><b>✓</b> Fichas sob controle</span>
          <span><b>✓</b> Comunidade respeitosa</span>
        </div>
      </div>
    </section>

    <section class="closing-section section-shell">
      <span class="closing-mark" aria-hidden="true">✦</span>
      <h2>Seu próximo capítulo começa agora.</h2>
      <p>Reúna o grupo. Prepare os dados. A aventura espera por você.</p>
      <router-link to="/buscar" class="primary-button">Explorar mesas <span aria-hidden="true">→</span></router-link>
    </section>
  </main>
</template>

<style scoped>
.about-page {
  min-height: calc(100vh - 4rem);
  padding: 3.5rem clamp(1rem, 5vw, 5rem) 5rem;
  color: #f5e9d0;
  background:
    radial-gradient(circle at 88% 10%, rgba(212, 175, 55, 0.12), transparent 24rem),
    radial-gradient(circle at 5% 42%, rgba(212, 175, 55, 0.07), transparent 20rem),
    linear-gradient(135deg, #080808 0%, #12100d 50%, #050505 100%);
}

.section-shell,
.about-hero {
  width: min(1120px, 100%);
  margin-inline: auto;
}

.about-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 3rem;
  min-height: 330px;
  padding-bottom: 4rem;
  border-bottom: 1px solid rgba(212, 175, 55, 0.16);
}

.hero-content {
  max-width: 700px;
}

.eyebrow {
  color: #d4af37;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.eyebrow > span {
  margin-right: 0.35rem;
  color: #f0e68c;
}

h1,
h2,
h3 {
  font-family: 'Cinzel', Georgia, serif;
}

h1 {
  margin: 0.55rem 0 1rem;
  color: #f0e68c;
  font-size: clamp(2.4rem, 6vw, 4.5rem);
  line-height: 1.05;
}

h1 strong {
  background: linear-gradient(135deg, #d4af37, #fff0a3);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.hero-lead {
  max-width: 650px;
  margin: 0;
  color: #cdbf90;
  font-size: 1.05rem;
  line-height: 1.75;
}

.hero-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 1.2rem;
  margin-top: 1.5rem;
}

.primary-button {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.78rem 1.15rem;
  border: 1px solid rgba(255, 248, 190, 0.55);
  border-radius: 9px;
  background: linear-gradient(135deg, #b88a16, #f0e68c);
  color: #120e05;
  font-weight: 800;
  text-decoration: none;
  transition: transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease;
}

.primary-button:hover,
.primary-button:focus-visible {
  transform: translateY(-3px);
  filter: brightness(1.08);
  box-shadow: 0 12px 25px rgba(212, 175, 55, 0.32);
  outline: none;
}

.hero-note {
  color: #8e8468;
  font-size: 0.78rem;
}

.note-dot {
  display: inline-block;
  width: 0.45rem;
  height: 0.45rem;
  margin-right: 0.35rem;
  border-radius: 50%;
  background: #9ed18a;
  box-shadow: 0 0 8px #9ed18a;
}

.hero-crest {
  position: relative;
  display: grid;
  place-items: center;
  width: 12rem;
  height: 12rem;
  flex: 0 0 auto;
  border: 1px solid rgba(212, 175, 55, 0.28);
  border-radius: 50%;
  background: radial-gradient(circle, rgba(212, 175, 55, 0.2), rgba(10, 10, 10, 0.28) 67%);
  color: #f0e68c;
  box-shadow: 0 0 45px rgba(212, 175, 55, 0.11), inset 0 0 25px rgba(212, 175, 55, 0.08);
}

.crest-ring {
  position: absolute;
  inset: 0.7rem;
  border: 1px dashed rgba(240, 230, 140, 0.42);
  border-radius: 50%;
}

.crest-sword {
  font-size: 4.5rem;
  filter: drop-shadow(0 0 13px rgba(240, 230, 140, 0.3));
}

.crest-star {
  position: absolute;
  right: 1.4rem;
  top: 1.5rem;
  font-size: 1.2rem;
}

.mission-section {
  display: grid;
  grid-template-columns: minmax(220px, 0.8fr) minmax(0, 1.2fr);
  gap: 4rem;
  padding: 4.5rem 0;
}

.section-heading h2,
.security-section h2,
.closing-section h2 {
  margin: 0.45rem 0 0;
  color: #f0e68c;
  font-size: clamp(1.6rem, 3vw, 2.45rem);
  line-height: 1.2;
}

.mission-copy {
  padding-left: 2rem;
  border-left: 1px solid rgba(212, 175, 55, 0.25);
}

.mission-copy p,
.security-section p {
  margin: 0 0 1rem;
  color: #b9ad8c;
  line-height: 1.75;
}

.mission-copy p:last-child {
  margin-bottom: 0;
}

.features-section {
  padding: 1rem 0 4.5rem;
}

.centered {
  text-align: center;
}

.centered > p {
  margin: 0.65rem 0 2rem;
  color: #8e8468;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.85rem;
}

.feature-card {
  position: relative;
  min-height: 245px;
  padding: 1.2rem;
  overflow: hidden;
  border: 1px solid rgba(212, 175, 55, 0.17);
  border-radius: 14px;
  background: linear-gradient(155deg, rgba(28, 25, 19, 0.92), rgba(10, 10, 10, 0.98));
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.25);
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}

.feature-card:hover {
  transform: translateY(-5px);
  border-color: rgba(212, 175, 55, 0.48);
  box-shadow: 0 16px 30px rgba(0, 0, 0, 0.38), 0 0 20px rgba(212, 175, 55, 0.07);
}

.feature-icon {
  display: grid;
  place-items: center;
  width: 2.7rem;
  height: 2.7rem;
  margin-bottom: 1.15rem;
  border: 1px solid rgba(240, 230, 140, 0.28);
  border-radius: 10px;
  background: rgba(212, 175, 55, 0.13);
  color: #f0e68c;
  font-size: 1.35rem;
}

.feature-card h3 {
  margin: 0 0 0.55rem;
  color: #f7e7b9;
  font-size: 1.05rem;
}

.feature-card p {
  margin: 0;
  color: #a99d7e;
  font-size: 0.83rem;
  line-height: 1.6;
}

.card-number {
  position: absolute;
  right: 1rem;
  bottom: 0.8rem;
  color: rgba(212, 175, 55, 0.32);
  font-family: 'Cinzel', Georgia, serif;
  font-size: 1.4rem;
  font-weight: 700;
}

.security-section {
  display: flex;
  align-items: flex-start;
  gap: 1.4rem;
  margin-bottom: 4.5rem;
  padding: 2rem;
  border: 1px solid rgba(212, 175, 55, 0.24);
  border-radius: 16px;
  background: linear-gradient(135deg, rgba(212, 175, 55, 0.13), rgba(10, 10, 10, 0.9) 45%);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

.security-icon {
  display: grid;
  place-items: center;
  width: 3.4rem;
  height: 3.4rem;
  flex: 0 0 auto;
  border: 1px solid rgba(240, 230, 140, 0.35);
  border-radius: 50%;
  color: #f0e68c;
  font-size: 1.8rem;
}

.security-section h2 {
  margin-bottom: 0.7rem;
}

.security-section p {
  max-width: 800px;
  margin-bottom: 1.2rem;
}

.security-points {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem 1.5rem;
  color: #d9c88a;
  font-size: 0.78rem;
  font-weight: 700;
}

.security-points b {
  margin-right: 0.25rem;
  color: #9ed18a;
}

.closing-section {
  padding: 1rem 1rem 2rem;
  text-align: center;
}

.closing-mark {
  color: #d4af37;
  font-size: 1.7rem;
}

.closing-section h2 {
  margin-top: 0.35rem;
}

.closing-section p {
  margin: 0.6rem 0 1.3rem;
  color: #a99d7e;
}

@media (max-width: 800px) {
  .about-page {
    padding-top: 2.3rem;
  }

  .about-hero {
    align-items: flex-start;
    min-height: 0;
    padding-bottom: 3rem;
  }

  .hero-crest {
    width: 7rem;
    height: 7rem;
  }

  .crest-sword {
    font-size: 2.5rem;
  }

  .crest-star {
    right: 0.7rem;
    top: 0.7rem;
    font-size: 0.8rem;
  }

  .mission-section {
    grid-template-columns: 1fr;
    gap: 1.5rem;
    padding: 3rem 0;
  }

  .mission-copy {
    padding-left: 1rem;
  }

  .feature-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 520px) {
  .about-hero {
    display: block;
  }

  .hero-crest {
    display: none;
  }

  .hero-lead {
    font-size: 0.95rem;
  }

  .hero-actions {
    align-items: flex-start;
    flex-direction: column;
    gap: 0.8rem;
  }

  .feature-grid {
    grid-template-columns: 1fr;
  }

  .security-section {
    flex-direction: column;
    padding: 1.3rem;
  }

  .security-points {
    flex-direction: column;
    gap: 0.55rem;
  }
}
</style>
