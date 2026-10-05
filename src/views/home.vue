<script setup>

import { useRouter } from 'vue-router'

import { ref } from 'vue'

import ShieldLogo from '@/components/ShieldLogo.vue'

import NavBar from '@/components/NavBar.vue'

import axios from 'axios'

import {useAuthStore} from '@/stores/auth.js'

import { useMensagensStore } from '@/stores/DmStore.js'

import { onMounted } from 'vue'

const router = useRouter()

const showLoginModal = ref(false)

const showRegisterModal = ref(false)

const loginEmail = ref('')

const loginPassword = ref('')

const registerEmail = ref('')

const registerPassword = ref('')

const registerConfirmPassword = ref('')

const registerNickname = ref('')

const registerImage = ref(null)

const registerImagePreview = ref(null)

const recentTables = ref([])

const DmStore = useMensagensStore()

// Atualiza a imagem selecionada e sua pré-visualização.
const handleImageUpload = (event) => {

  const file = event.target.files[0]

  if (file) {

    registerImage.value = file

    const reader = new FileReader()

    // Atualiza a pré-visualização após a leitura da imagem.
    reader.onload = (e) => {

      registerImagePreview.value = e.target.result

    }

    reader.readAsDataURL(file)

  }

}

const erroCriar = ref('')

const erroLog = ref('')

// Carrega as mesas recentes ao abrir a página inicial.
onMounted(async () => {

    try {

        const res = await axios.get('/dxguild/mesa/recente')

        recentTables.value = res.data

    } catch (e) {

        console.error("Erro ao buscar mesas recentes:", e)

    }

})

  // Autentica o usuário e apresenta erros no formulário.
  async function handleLogin(){

      try { 

        const res = await axios.post('/dxguild/auth/login', {

          email: loginEmail.value,

          password: loginPassword.value

        })  

        const userData = res.data;

        const authStore = useAuthStore();

        authStore.setToken(userData.acessToken, userData.refreshToken);

        router.push('/perfil');

      } catch (e) {

        console.error("Erro completo:", e);

        if (e.response && e.response.data) {

          const data = e.response.data;

          if(Array.isArray(data)){

            erroLog.value = "Erro no login " + ( data[0] || "Erro desconhecido.");

            return;

          }

          else {

            erroLog.value = "Erro no Login: " + ( e.response?.data?.error?.message  || e.response?.data?.erro ||e.response?.data || "Erro desconhecido.");

            return;

          }

        }else{

             erroLog.value = "Erro ao fazer login, servidor fora do ar ou inacessível.";

             return

        }

      }

  }

// Fecha os modais de login e cadastro.
const closeModals = () => {

  showLoginModal.value = false

  showRegisterModal.value = false

}

// Cria a conta e envia a imagem de perfil selecionada.
async function handleRegister(){

    if(registerPassword.value !== registerConfirmPassword.value){

        alert("As senhas não coincidem!")

        return

    }

    try {

        const formData = new FormData()

        formData.append('file', registerImagePreview.value)

        formData.append('upload_preset', 'dxguild')

        const cloudName = 'dwt6xjnmh';

    const cloudinaryRes = await axios.post(

        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, 

        formData

      );

      const urlDaImagemFinal = cloudinaryRes.data.secure_url;

      const res = await axios.post('/dxguild/user', {

        email: registerEmail.value,

        password: registerPassword.value,

        nome: registerNickname.value,

        imagem: urlDaImagemFinal

      })

       showRegisterModal.value = false;

    }catch (e) {

  console.error("Erro completo:", e)

  if (e.response && e.response.data && e.response.status != 500 && e.code != 'ERR_NETWORK' ) {

    if(e.config?.url?.includes('cloudinary.com')){

        erroCriar.value = "Erro ao fazer upload da imagem";

        return;

      }

     const data = e.response.data;

     if(Array.isArray(data)){

        erroCriar.value = "Erro ao criar conta: " + ( data[0] || "Erro desconhecido.");

        return;

     }

     else {

     erroCriar.value = "Erro ao criar conta: " + ( e.response?.data?.error?.mensagem  || e.response?.data || "Erro desconhecido.");

       return;

     }

  }

  else{

    erroCriar.value = "Erro ao criar conta, servidor fora do ar ou inacessível.";

      return;

  }

  // 2. Se cair aqui, é porque nem conseguiu falar com o servidor (Ex: rede caiu ou deu 500 sem corpo)

}

}

</script>

<template>

  <div class="home">

      <section class="hero-section" aria-labelledby="home-title">

        <div class="hero-content">

          <div class="hero-text">

            <p class="hero-intro">Seu grupo. Sua história.</p>

            <h1 id="home-title" class="title">Sua próxima mesa começa aqui.</h1>

            <p class="description">Encontre seu grupo e descubra sua próxima aventura de RPG na DX Guild.</p>

            <div class="auth-buttons">

              <button class="btn btn-login" @click="showLoginModal = true">

                Entrar

              </button>

              <button class="btn btn-register" @click="showRegisterModal = true">

                Criar uma conta

              </button>

            </div>

          </div>

          <figure class="hero-art">

            <img class="hero-scene" src="../assets/imgs/dxguild-hero-preview.svg"

              alt="Prévia ilustrativa de uma mesa DX Guild com chat, dados e arquivos."

              width="1120" height="720" fetchpriority="high" decoding="async" />

            <figcaption class="preview-caption">Prévia ilustrativa da experiência de uma mesa.</figcaption>

          </figure>

        </div>

      </section>

      <!-- Recent Tables Section -->

      <section class="recent-tables-section" aria-labelledby="recent-tables-title">

        <div class="tables-container">

          <div class="section-heading">

            <div>

              <h2 id="recent-tables-title" class="section-title">Encontre seu próximo grupo</h2>

              <p class="section-subtitle">Conheça as mesas mais recentes da comunidade.</p>

            </div>

            <button class="find-tables-button" type="button" @click="router.push('/buscar')">

              Encontrar mesa

              <span aria-hidden="true">→</span>

            </button>

          </div>

          <div class="tables-grid">
            <div v-for="table in recentTables" :key="table.id" class="table-card" @click="router.push(`/mesa/${encodeURIComponent(table.nome)}`)">
              <div class="table-image">
                <img :src="table.imagem" :alt="table.nome" loading="lazy" />
              </div>

              <div class="table-content">
                <span class="table-system">{{ table.sistema }}</span>
                <h3 class="table-name">{{ table.nome }}</h3>
                <p class="table-description">{{ table.descricao }}</p>

                <div class="table-meta">
                  <div class="table-creator">
                    <img class="table-creator-avatar" :src="table.imagemCriador"
                      alt="Foto do criador da mesa" width="32" height="32" loading="lazy" />
                    <span class="table-creator-label">Criador da mesa: {{ table.criador }}</span>
                  </div>
                  <span v-if="table.vaga === true" class="vacancy-badge vacancy-badge--open">
                    <span class="vacancy-dot" aria-hidden="true"></span>Com vagas
                  </span>
                  <span v-else-if="table.vaga === false" class="vacancy-badge vacancy-badge--full">
                    <span class="vacancy-dot" aria-hidden="true"></span>Mesa cheia
                  </span>
                </div>

                <div class="table-footer">
                  <button class="btn-join" type="button" @click.stop="router.push(`/mesa/${encodeURIComponent(table.nome)}`)">
                    Ver mesa <span aria-hidden="true">→</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

            <section class="session-section" aria-labelledby="session-title">

        <div class="session-container">

          <div class="session-preview">

            <h2 id="session-title" class="section-title">Tudo pronto para a sua próxima sessão.</h2>

            <figure class="session-figure">

              <img src="../assets/imgs/dxguild-session-preview.svg"

                alt="Exemplo ilustrativo de conversa entre jogadores e uma rolagem de dado."

                width="960" height="600" loading="lazy" decoding="async" />

              <figcaption class="preview-caption">Seu grupo, a história e os dados no mesmo lugar.</figcaption>

            </figure>

          </div>

          <ul class="session-benefits">

            <li class="session-benefit">

              <span class="session-icon" aria-hidden="true">

                <svg viewBox="0 0 24 24"><path d="M4 3h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1h-9l-6 5v-5H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" /></svg>

              </span>

              <div><h3>Converse com seu grupo</h3><p>Mantenha a conversa e a história no mesmo lugar.</p></div>

            </li>

            <li class="session-benefit">

              <span class="session-icon" aria-hidden="true">

                <svg viewBox="0 0 24 24"><path d="m12 1 10 6v11l-10 5-10-5V7Z M12 1 7 9h10Z M7 9l5 10 5-10 M2 18l10 1 10-1" /></svg>

              </span>

              <div><h3>Role os dados</h3><p>Faça suas rolagens durante a sessão.</p></div>

            </li>

            <li class="session-benefit">

              <span class="session-icon" aria-hidden="true">

                <svg viewBox="0 0 24 24"><path d="M2 7V4a1 1 0 0 1 1-1h6l3 3h9a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V7Zm0 1h20" /></svg>

              </span>

              <div><h3>Organize sua campanha</h3><p>Reúna arquivos e materiais da mesa.</p></div>

            </li>

          </ul>

        </div>

      </section>

      <section id="como-funciona" class="features-section" aria-labelledby="features-title">

        <div class="features-container">

          <h2 id="features-title" class="section-title">Da primeira ideia à próxima aventura.</h2>

          <ol class="features-grid">

            <li class="feature-item">

              <span class="feature-number" aria-hidden="true">01</span>

              <div>

                <h3>Crie sua conta</h3>

                <p>Escolha seu apelido e entre para a comunidade.</p>

              </div>

            </li>

            <li class="feature-item">

              <span class="feature-number" aria-hidden="true">02</span>

              <div>

                <h3>Encontre seu grupo</h3>

                <p>Explore as mesas e encontre uma aventura para você.</p>

              </div>

            </li>

            <li class="feature-item">

              <span class="feature-number" aria-hidden="true">03</span>

              <div>

                <h3>Conheça a mesa</h3>

                <p>Confira os detalhes da campanha antes de participar.</p>

              </div>

            </li>

          </ol>

        </div>

      </section>

      <section class="closing-section" aria-labelledby="closing-title">

        <img class="closing-image" src="../assets/imgs/dxguild-castle.png" alt="" loading="lazy" />

        <div class="closing-content">

          <div>

            <h2 id="closing-title" class="section-title">Toda grande história começa com um grupo.</h2>

            <p class="section-subtitle">O próximo capítulo pode ser o seu.</p>

            <button type="button" class="btn btn-login closing-cta" @click="showRegisterModal = true">Criar uma conta</button>

          </div>

          <img class="closing-mark" src="../assets/imgs/dxguild-mark.svg" alt="" loading="lazy" width="160" height="160" />

        </div>

      </section>

            <footer class="home-footer" aria-label="Rodapé DX Guild">

        <div class="home-footer-container">

          <div class="footer-main">

            <div class="footer-brand">

              <img src="../assets/imgs/dxguild-mark.svg" alt="" width="46" height="51" loading="lazy" />

              <div><span class="footer-brand-name">DX Guild</span><p>Crie. Jogue. Imagine.</p></div>

            </div>

            <nav class="footer-nav" aria-label="Links da plataforma">

              <h2>Plataforma</h2>

              <button type="button" @click="router.push('/buscar')">Explorar mesas</button>

              <button type="button" @click="showRegisterModal = true">Criar conta</button>

              <button type="button" @click="showLoginModal = true">Entrar</button>

            </nav>

            <nav class="footer-nav" aria-label="Conheça a DX Guild">

              <h2>DX Guild</h2>

              <a href="#como-funciona">Como funciona</a>

              <a href="#session-title">Recursos da mesa</a>

              <a href="#home-title">Voltar ao início ↑</a>

            </nav>

          </div>

          <div class="footer-bottom"><p>© 2026 DX Guild</p><p>Um encontro. Muitas aventuras.</p></div>

        </div>

      </footer>

      <!-- Login Modal -->

      <div v-if="showLoginModal" class="modal-overlay" @click.self="closeModals">

        <div class="modal2">

          <button class="modal-close" @click="closeModals">✕</button>

          <h2>Entrar na Guilda</h2>

          <form @submit.prevent="handleLogin">

            <div class="form-group">

              <label for="login-email">Email</label>

              <input

                id="login-email"

                v-model="loginEmail"

                type="email"

                placeholder="seu@email.com"

                required

              />

            </div>

            <div class="form-group">

              <label for="login-password">Senha</label>

              <input

                id="login-password"

                v-model="loginPassword"

                type="password"

                placeholder="••••••••"

                required

              />

            </div>

            <button type="submit" class="btn btn-submit">Entrar</button>

          </form>

          <p v-if="erroLog" class="erro">{{ erroLog }}</p>

          <p class="modal-footer">

            Não tem conta?

            <button class="link-btn" @click="showLoginModal = false; showRegisterModal = true">Cadastre-se</button>

          </p>

        </div>

      </div>

      <!-- Register Modal -->

      <div v-if="showRegisterModal" class="modal-overlay" @click.self="closeModals">

        <div class="modal2">

          <button class="modal-close" @click="closeModals">✕</button>

          <h2>Criar Conta</h2>

          <form @submit.prevent="handleRegister">

            <div class="form-group">

              <label for="register-nickname">Apelido (Nickname)</label>

              <input

                id="register-nickname"

                v-model="registerNickname"

                type="text"

                placeholder="Seu nick na guilda"

                required

              />

            </div>

            <div class="form-group">

              <label for="register-image">Foto de Perfil</label>

              <div class="image-upload-section">

                <input

                  id="register-image"

                  type="file"

                  accept="image/*"

                  class="image-input"

                  @change="handleImageUpload"

                />

                <label for="register-image" class="image-upload-label">

                  <span v-if="!registerImagePreview">📷 Escolher Imagem</span>

                  <span v-else>✓ Imagem selecionada</span>

                </label>

              </div>

            </div>

            <div class="form-group">

              <label for="register-email">Email</label>

              <input

                id="register-email"

                v-model="registerEmail"

                type="email"

                placeholder="seu@email.com"

                required

              />

            </div>

            <div class="form-group">

              <label for="register-password">Senha</label>

              <input

                id="register-password"

                v-model="registerPassword"

                type="password"

                placeholder="••••••••"

                required

              />

            </div>

            <div class="form-group">

              <label for="register-confirm">Confirmar Senha</label>

              <input

                id="register-confirm"

                v-model="registerConfirmPassword"

                type="password"

                placeholder="••••••••"

                required

              />

            </div>

            <button type="submit" class="btn btn-submit">Criar Conta</button>

          </form>

          <p class="erro">{{ erroCriar }}</p>

          <p class="modal-footer">

            Já tem conta?

            <button class="link-btn" @click="showRegisterModal = false; showLoginModal = true">Faça login</button>

          </p>

        </div>

      </div>

    </div>

</template>

<style scoped>

@font-face {
  font-family: 'Cormorant Garamond';
  font-style: normal;
  font-weight: 600;
  font-display: swap;
  src: url('../assets/fonts/cormorant-garamond-600.ttf') format('truetype');
}
@font-face {
  font-family: 'Manrope';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url('../assets/fonts/manrope-400.ttf') format('truetype');
}
@font-face {
  font-family: 'Manrope';
  font-style: normal;
  font-weight: 600;
  font-display: swap;
  src: url('../assets/fonts/manrope-600.ttf') format('truetype');
}
@font-face {
  font-family: 'Manrope';
  font-style: normal;
  font-weight: 700;
  font-display: swap;
  src: url('../assets/fonts/manrope-700.ttf') format('truetype');
}

.home {

  --home-bg: #101211;

  --home-surface: #191c1a;

  --home-text: #f4f2eb;

  --home-muted: #b5b9b3;

  --home-gold: #e2ba61;

  --home-line: #343831;

  width: 100%;

  min-height: calc(100vh - 60px);

  background: var(--home-bg);

  color: var(--home-text);

  font-family: 'Manrope', 'Segoe UI', system-ui, sans-serif;

  font-size: 1rem;

  line-height: 1.6;

  color-scheme: dark;

}

.home *,

.home *::before,

.home *::after {

  box-sizing: border-box;

}

.home ::selection {

  background: var(--home-gold);

  color: var(--home-bg);

}

.home button,

.home input {

  font: inherit;

}

.home button {

  cursor: pointer;

}

.home button:focus-visible,

.home input:focus-visible {

  outline: 2px solid var(--home-gold);

  outline-offset: 4px;

}

.hero-content,

.tables-container,

.features-container,

.closing-content {

  width: min(1200px, calc(100% - 96px));

  margin-inline: auto;

}

.hero-content {

  display: grid;

  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);

  align-items: center;

  gap: clamp(32px, 4vw, 64px);

  padding-block: 56px;

}

.hero-text {

  min-width: 0;

}

.hero-intro {

  margin: 0 0 16px;

  color: var(--home-gold);

  font-size: 0.75rem;

  font-weight: 600;

  letter-spacing: 0.12em;

  text-transform: uppercase;

}

.title {

  max-width: 13ch;

  margin: 0;

  font-size: clamp(2.5rem, 4.2vw, 3.75rem);

  line-height: 1.08;

  font-weight: 750;

  letter-spacing: -0.035em;

  text-wrap: balance;

}

.description {

  max-width: 40ch;

  margin: 24px 0 0;

  color: var(--home-muted);

  font-size: 1.125rem;

  line-height: 1.6;

}

.auth-buttons {

  display: flex;

  flex-wrap: wrap;

  gap: 16px;

  margin-top: 30px;

}

.btn,

.find-tables-button {

  display: inline-flex;

  align-items: center;

  justify-content: center;

  min-height: 48px;

  padding: 11px 26px;

  border: 1px solid var(--home-gold);

  border-radius: 5px;

  font-weight: 600;

  line-height: 1.4;

  transition: background-color 180ms ease, color 180ms ease, border-color 180ms ease;

}

.btn-login,

.btn-submit {

  background: var(--home-gold);

  color: #19170f;

}

.btn-login {

  min-width: 154px;

}

.btn-register {

  background: transparent;

  color: var(--home-text);

}

.btn-login:hover,

.btn-submit:hover {

  background: #f0cd81;

  border-color: #f0cd81;

}

.btn-register:hover,

.find-tables-button:hover {

  background: #28271f;

  border-color: #f0cd81;

}

.hero-art {

  position: relative;

  min-width: 0;

  overflow: hidden;

  aspect-ratio: 1.4;

  border: 1px solid var(--home-line);

  border-radius: 8px;

  background: var(--home-surface);

}

.hero-scene {

  display: block;

  width: 100%;

  height: 100%;

  object-fit: cover;

  object-position: center 46%;

}

.hero-art-caption {

  position: absolute;

  inset: auto 0 0;

  display: flex;

  align-items: center;

  gap: 12px;

  padding: 20px 24px;

  background: linear-gradient(transparent, rgb(10 13 11 / 95%) 38%);

}

.hero-art-caption img {

  flex: 0 0 auto;

  object-fit: contain;

}

.hero-art-brand {

  font-size: 1.125rem;

  font-weight: 700;

}

.hero-art-caption p {

  margin: 2px 0 0;

  color: #d2d3cb;

  font-size: 0.8125rem;

}

.tables-container,

.features-container {

  border-top: 1px solid var(--home-line);

  padding-block: 40px 48px;

}

.section-heading {

  display: flex;

  align-items: center;

  justify-content: space-between;

  gap: 24px;

  margin-bottom: 28px;

}

.section-title {

  margin: 0;

  font-size: clamp(1.625rem, 2.5vw, 2.25rem);

  font-weight: 700;

  line-height: 1.2;

  letter-spacing: -0.025em;

  text-wrap: balance;

}

.section-subtitle {

  margin: 10px 0 0;

  color: var(--home-muted);

  font-size: 1rem;

  line-height: 1.6;

}

.find-tables-button {

  flex-shrink: 0;

  gap: 16px;

  padding-inline: 20px;

  background: transparent;

  color: var(--home-gold);

  font-size: 0.875rem;

}

.find-tables-button span,

.btn-join span {

  font-size: 1.25rem;

  line-height: 1;

}

.tables-grid {

  display: grid;

  grid-template-columns: repeat(3, minmax(0, 1fr));

  gap: 20px;

}

.table-card {
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
  border: 1px solid var(--home-line);
  border-radius: 8px;
  background: var(--home-surface);
  cursor: pointer;
  transition: border-color 180ms ease, background-color 180ms ease;
}
.table-card:hover,
.table-card:focus-within {
  border-color: #8e7c50;
  background: #20231f;
}
.table-image {
  aspect-ratio: 1.9;
  overflow: hidden;
  background: #252a25;
}
.table-image img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.table-content {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: flex-start;
  min-width: 0;
  padding: 20px 20px 8px;
}
.table-system {
  display: inline-block;
  max-width: 100%;
  margin-bottom: 12px;
  padding: 4px 9px;
  border: 1px solid #555c50;
  border-radius: 5px;
  color: var(--home-text);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: .025em;
  line-height: 1.5;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.table-name {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  width: 100%;
  min-height: 2.4em;
  margin: 0;
  overflow: hidden;
  overflow-wrap: anywhere;
  padding-left: 12px;
  border-left: 3px solid #cda85b;
  color: #f3dfb4;
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 1.75rem;
  font-weight: 600;
  line-height: 1.2;
}
.table-description {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  width: 100%;
  min-height: 4.65em;
  margin: 12px 0 20px;
  overflow: hidden;
  overflow-wrap: anywhere;
  color: #c4c8c0;
  font-size: 0.875rem;
  line-height: 1.55;
}
.table-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px 14px;
  width: 100%;
  margin-top: auto;
  padding-top: 16px;
  border-top: 1px solid rgba(226,186,97,.14);
}
.table-creator {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.table-creator-avatar {
  display: block;
  flex: 0 0 32px;
  width: 32px;
  height: 32px;
  object-fit: cover;
  border: 1px solid var(--home-line);
  border-radius: 50%;
  background: #252a25;
}
.table-creator-label {
  color: #e0e2da;
  font-size: 0.8125rem;
  font-weight: 600;
  line-height: 1.4;
}
.vacancy-badge {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 7px;
  color: #c8cec5;
  padding: 5px 8px;
  border: 1px solid rgba(170,180,167,.18);
  border-radius: 5px;
  background: rgba(170,180,167,.06);
  font-size: 0.75rem;
  font-weight: 600;
  line-height: 1.4;
  white-space: nowrap;
}
.vacancy-dot {
  flex: 0 0 7px;
  width: 7px;
  height: 7px;
  border-radius: 50%;
}
.vacancy-badge--open { color: #a9dbbe; border-color: rgba(89,191,145,.22); background: rgba(89,191,145,.07); }
.vacancy-badge--open .vacancy-dot { background: #59bf91; }
.vacancy-badge--full .vacancy-dot { background: #939a94; }
.table-footer {
  display: flex;
  justify-content: flex-end;
  width: 100%;
  margin-top: 16px;
}
.btn-join {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 44px;
  padding: 8px 0 8px 10px;
  border: 0;
  border-radius: 3px;
  background: transparent;
  color: var(--home-gold);
  font-size: 0.8125rem;
  font-weight: 600;
}
.btn-join:hover {
  color: #f0cd81;
  text-decoration: underline;
  text-underline-offset: 4px;
}

.features-container {

  padding-block: 44px 52px;

}

.features-grid {

  display: grid;

  grid-template-columns: repeat(3, minmax(0, 1fr));

  gap: 28px;

  margin: 32px 0 0;

  padding: 0;

  list-style: none;

}

.feature-item {

  display: flex;

  align-items: flex-start;

  gap: 18px;

  min-width: 0;

}

.feature-item + .feature-item {

  padding-left: 28px;

  border-left: 1px solid var(--home-line);

}

.feature-number {

  display: grid;

  flex: 0 0 42px;

  place-items: center;

  height: 42px;

  border: 1px solid #8e7c50;

  border-radius: 50%;

  color: var(--home-gold);

  font-size: 0.875rem;

  font-weight: 600;

  font-variant-numeric: tabular-nums;

}

.feature-item h3 {

  margin: 0 0 8px;

  font-size: 1.0625rem;

  line-height: 1.4;

  font-weight: 650;

}

.feature-item p {

  max-width: 28ch;

  margin: 0;

  color: var(--home-muted);

  font-size: 0.9375rem;

  line-height: 1.6;

}

.closing-section {

  position: relative;

  isolation: isolate;

  overflow: hidden;

  border-block: 1px solid var(--home-line);

  background: #101814;

}

.closing-image {

  position: absolute;

  z-index: -2;

  width: 100%;

  height: 100%;

  object-fit: cover;

  object-position: center 38%;

}

.closing-section::before {

  content: '';

  position: absolute;

  z-index: -1;

  inset: 0;

  background: linear-gradient(90deg, #101211 5%, rgb(16 18 17 / 88%) 48%, rgb(16 18 17 / 35%));

}

.closing-content {

  display: flex;

  align-items: center;

  justify-content: space-between;

  gap: 32px;

  min-height: 256px;

  padding-block: 48px;

}

.closing-content .section-title {

  max-width: 24ch;

}

.closing-mark {

  flex: 0 0 auto;

  width: 160px;

  height: auto;

  object-fit: contain;

}

/* Authentication: the existing forms and states share the home's palette. */

.modal-overlay {

  position: fixed;

  z-index: 2000;

  inset: 0;

  display: flex;

  align-items: center;

  justify-content: center;

  overflow-y: auto;

  padding: 24px;

  background: rgb(0 0 0 / 80%);

}

.modal2 {

  position: relative;

  width: 100%;

  max-width: 460px;

  max-height: calc(100dvh - 48px);

  overflow-y: auto;

  padding: 36px;

  border: 1px solid #8e7c50;

  border-radius: 8px;

  background: var(--home-surface);

  scrollbar-width: thin;

  scrollbar-color: #8e7c50 var(--home-surface);

}

.modal-close {

  position: absolute;

  top: 12px;

  right: 12px;

  display: grid;

  place-items: center;

  width: 44px;

  height: 44px;

  padding: 0;

  border: 0;

  border-radius: 4px;

  background: transparent;

  color: var(--home-muted);

}

.modal-close:hover {

  background: #292d26;

  color: var(--home-text);

}

.modal2 h2 {

  margin: 0 28px 28px 0;

  color: var(--home-text);

  font-size: 1.625rem;

  line-height: 1.25;

  letter-spacing: -0.025em;

}

.form-group {

  margin-bottom: 20px;

}

.form-group label {

  display: block;

  margin-bottom: 8px;

  color: var(--home-text);

  font-size: 0.875rem;

  font-weight: 500;

}

.form-group input {

  width: 100%;

  min-height: 46px;

  padding: 10px 12px;

  border: 1px solid #555c50;

  border-radius: 4px;

  background: var(--home-bg);

  color: var(--home-text);

  caret-color: var(--home-gold);

}

.form-group input::placeholder {

  color: #a5ada1;

  opacity: 1;

}

.form-group input:focus {

  border-color: var(--home-gold);

}

.image-input {

  display: none;

}

.form-group .image-upload-label {

  margin: 0;

  padding: 14px;

  border: 1px dashed #8e7c50;

  border-radius: 4px;

  color: var(--home-gold);

  text-align: center;

  cursor: pointer;

}

.image-upload-label:hover {

  background: #28271f;

}

.btn-submit {

  width: 100%;

  margin-top: 4px;

}

.erro {

  margin-top: 12px;

  color: #ffa7a0;

  font-size: 0.875rem;

  line-height: 1.5;

  text-align: center;

  overflow-wrap: anywhere;

}

.modal-footer {

  margin-top: 20px;

  color: var(--home-muted);

  font-size: 0.875rem;

  text-align: center;

}

.link-btn {

  min-height: 44px;

  padding: 4px;

  border: 0;

  background: transparent;

  color: var(--home-gold);

  text-decoration: underline;

  text-underline-offset: 4px;

}

.link-btn:hover {

  color: #f0cd81;

}

@media (max-width: 1023px) {

  .hero-content,

  .tables-container,

  .features-container,

  .closing-content {

    width: calc(100% - 48px);

  }

  .hero-content {

    gap: 28px;

    padding-block: 40px;

  }

  .title {

    font-size: clamp(2rem, 4.5vw, 2.75rem);

  }

  .description {

    font-size: 1rem;

  }

  .hero-art {

    aspect-ratio: 0.9;

  }

  .hero-art-caption {

    padding: 16px;

  }

  .auth-buttons {

    gap: 12px;

  }

  .btn-login {

    min-width: 120px;

  }

  .auth-buttons .btn {

    padding-inline: 20px;

  }

  .tables-grid {

    grid-template-columns: repeat(2, minmax(0, 1fr));

  }

  .features-grid {

    gap: 20px;

  }

  .feature-item {

    flex-direction: column;

    gap: 14px;

  }

  .feature-number {

    flex-basis: auto;

    width: 42px;

  }

  .feature-item + .feature-item {

    padding-left: 20px;

  }

}

@media (max-width: 640px) {

  .hero-content,

  .tables-container,

  .features-container,

  .closing-content {

    width: calc(100% - 40px);

  }

  .hero-content {

    grid-template-columns: minmax(0, 1fr);

    gap: 32px;

    padding-block: 36px;

  }

  .hero-text .title {
    width: 100%;
    max-width: none;
    font-size: clamp(2.5rem, 10.5vw, 3rem);
    line-height: 1.12;
    text-wrap: wrap;
    overflow-wrap: break-word;
  }

  .hero-text .description {
    max-width: none;
    margin-top: 20px;
    font-size: 1.0625rem;
    line-height: 1.6;
  }

  .auth-buttons {

    margin-top: 24px;

  }

  .auth-buttons .btn {

    flex: 1 1 140px;

  }

  .hero-art {

    aspect-ratio: 1.4;

  }

  .section-heading {

    align-items: flex-start;

    flex-direction: column;

    gap: 20px;

    margin-bottom: 24px;

  }

  .tables-container,

  .features-container {

    padding-block: 32px 36px;

  }

  .tables-grid {

    grid-template-columns: minmax(0, 1fr);

    gap: 20px;

  }

  .features-grid {

    grid-template-columns: minmax(0, 1fr);

    gap: 24px;

    margin-top: 28px;

  }

  .feature-item {

    flex-direction: row;

    gap: 18px;

  }

  .feature-number {

    flex: 0 0 42px;

  }

  .feature-item + .feature-item {

    border-left: 0;

    border-top: 1px solid var(--home-line);

    padding: 24px 0 0;

  }

  .feature-item p {

    max-width: 34ch;

  }

  .closing-content {

    min-height: 240px;

    padding-block: 36px;

  }

  .closing-mark {

    display: none;

  }

  .closing-section::before {

    background: rgb(16 18 17 / 82%);

  }

  .modal-overlay {

    padding: 16px;

  }

  .modal2 {

    max-height: calc(100dvh - 32px);

    padding: 28px 20px;

  }

}

@media (prefers-reduced-motion: reduce) {

  .btn,

  .find-tables-button,

  .table-card {

    transition: none;

  }

}

/* Home additions: static previews, session section and footer. */

.hero-art {

  margin: 0;

  aspect-ratio: auto;

  overflow: visible;

  border: 0;

  border-radius: 0;

  background: transparent;

}

.hero-scene {

  display: block;

  width: 100%;

  height: auto;

  object-fit: contain;

  border-radius: 8px;

}

.preview-caption {

  margin-top: 10px;

  color: var(--home-muted);

  font-size: 0.75rem;

  line-height: 1.5;

}

.session-container,

.home-footer-container {

  width: min(1200px, calc(100% - 96px));

  margin-inline: auto;

}

.session-container {

  display: grid;

  grid-template-columns: minmax(0, 1.3fr) minmax(0, 1fr);

  align-items: center;

  gap: clamp(32px, 5vw, 72px);

  border-top: 1px solid var(--home-line);

  padding-block: 52px;

}

.session-preview,

.session-benefit > div { min-width: 0; }

.session-preview .section-title { max-width: 24ch; }

.session-figure { margin: 28px 0 0; }

.session-figure img { display: block; width: 100%; height: auto; border-radius: 8px; }

.session-benefits { list-style: none; margin: 0; padding: 0; }

.session-benefit { display: flex; align-items: flex-start; gap: 22px; padding-block: 26px; }

.session-benefit + .session-benefit { border-top: 1px solid var(--home-line); }

.session-icon {

  display: grid;

  flex: 0 0 64px;

  place-items: center;

  width: 64px;

  height: 64px;

  border: 1px solid #65583b;

  border-radius: 50%;

  color: var(--home-gold);

}

.session-icon svg { width: 30px; height: 30px; fill: none; stroke: currentColor; stroke-width: 1.5; stroke-linejoin: round; stroke-linecap: round; }

.session-benefit h3 { margin: 3px 0 8px; font-size: 1.125rem; line-height: 1.4; font-weight: 650; }

.session-benefit p { margin: 0; color: var(--home-muted); font-size: 0.9375rem; max-width: 33ch; }

.closing-cta { margin-top: 24px; }

.closing-mark { opacity: 0.7; }

.home-footer { background: var(--home-bg); }

.home-footer-container { padding-block: 44px 24px; }

.footer-main { display: grid; grid-template-columns: minmax(0, 1.6fr) repeat(2, minmax(0, 1fr)); gap: 48px; }

.footer-brand { display: flex; align-items: flex-start; gap: 14px; }

.footer-brand img { flex: 0 0 46px; margin-top: 4px; }

.footer-brand-name { font-size: 1.5rem; font-weight: 750; letter-spacing: -0.03em; }

.footer-brand p { color: var(--home-muted); margin: 2px 0 0; font-size: 0.875rem; }

.footer-nav { display: flex; flex-direction: column; align-items: flex-start; border-left: 1px solid var(--home-line); padding-left: 28px; }

.footer-nav h2 { font-size: 0.875rem; font-weight: 650; margin: 0 0 10px; }

.footer-nav a,

.footer-nav button { display: inline-flex; align-items: center; min-height: 44px; border: 0; padding: 8px 0; background: transparent; color: var(--home-muted); font: inherit; font-size: 0.875rem; text-align: left; text-decoration: none; }

.footer-nav a:hover,

.footer-nav button:hover { color: var(--home-gold); text-decoration: underline; text-underline-offset: 4px; }

.footer-nav a:focus-visible { outline: 2px solid var(--home-gold); outline-offset: 4px; }

.footer-bottom { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 8px 24px; border-top: 1px solid var(--home-line); padding-top: 20px; margin-top: 32px; color: var(--home-muted); font-size: 0.75rem; }

.footer-bottom p { margin: 0; }

#como-funciona, #session-title, #home-title { scroll-margin-top: 90px; }

@media (max-width: 1023px) {

  .session-container, .home-footer-container { width: calc(100% - 48px); }

  .session-container { grid-template-columns: minmax(0, 1fr); gap: 24px; padding-block: 40px; }

  .session-preview { max-width: 680px; }

  .session-benefits { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 24px; }

  .session-benefit { flex-direction: column; gap: 16px; padding-block: 0; }

  .session-benefit + .session-benefit { border-top: 0; }

  .footer-main { gap: 28px; }

}

@media (max-width: 640px) {

  .session-container, .home-footer-container { width: calc(100% - 40px); }

  .session-container { padding-block: 32px 36px; }

  .session-benefits { grid-template-columns: minmax(0, 1fr); gap: 0; }

  .session-benefit { flex-direction: row; gap: 18px; padding-block: 22px; }

  .session-benefit + .session-benefit { border-top: 1px solid var(--home-line); }

  .session-icon { flex-basis: 52px; width: 52px; height: 52px; }

  .session-icon svg { width: 26px; height: 26px; }

  .footer-main { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 28px 20px; }

  .footer-brand { grid-column: 1 / -1; }

  .footer-nav { border-left: 0; padding-left: 0; }

  .footer-bottom { flex-direction: column; }

  .home-footer-container { padding-top: 32px; }

}


/* Acabamento visual: hero, tipografia e cards. */
.hero-section {
  position: relative;
  isolation: isolate;
  background:
    linear-gradient(180deg, rgba(16,18,17,.12) 55%, #101211 100%),
    linear-gradient(90deg, rgba(16,18,17,.87), rgba(16,18,17,.34)),
    url('../assets/imgs/dxguild-hero-background.png') center / cover no-repeat;
}
.hero-section::before {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  width: min(1200px, calc(100% - 40px));
  height: 1px;
  transform: translateX(-50%);
  background: linear-gradient(90deg, transparent, #78633e 25%, #ad8e52 50%, #78633e 75%, transparent);
  pointer-events: none;
}
.hero-section::after {
  content: '';
  position: absolute;
  bottom: -20px;
  left: calc(50% - 22px);
  width: 44px;
  height: 40px;
  background: #101211 url('../assets/imgs/dxguild-mark.svg') center / 28px 28px no-repeat;
  pointer-events: none;
}
.title, .section-title {
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-weight: 600;
  letter-spacing: -.015em;
}
.hero-intro { letter-spacing: .14em; }
.tables-container { border-top: 0; }
.table-card {
  border-color: #484235;
  background: linear-gradient(160deg, #242620, #191c1a 65%);
  box-shadow: 0 8px 24px rgba(0,0,0,.2), inset 0 1px 0 rgba(238,214,163,.04);
}
.table-card:hover {
  border-color: #927849;
  box-shadow: 0 12px 30px rgba(0,0,0,.28);
}
.table-image { border-bottom: 1px solid #484235; }
.table-system {
  border-color: #674c43;
  background: #342925;
  color: #e6cbb1;
}
.table-name { letter-spacing: -.015em; }
.table-creator { max-width: 100%; }
.table-creator-label {
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.table-creator-avatar { border-color: #716043; }
.table-footer { padding-bottom: 10px; }
.home .btn-join {
  width: 100%;
  padding: 10px 16px;
  border: 1px solid #79623c;
  border-radius: 5px;
  background: linear-gradient(180deg, rgba(226,186,97,.08), rgba(226,186,97,.02));
  box-shadow: inset 0 1px 0 rgba(255,236,188,.05);
  font-size: .8125rem;
  font-weight: 700;
}
.home .btn-join:hover {
  border-color: var(--home-gold);
  background: rgba(226,186,97,.11);
  text-decoration: none;
}

</style>
