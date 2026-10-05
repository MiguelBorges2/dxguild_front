<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.js'
import { useMensagensStore } from '@/stores/DmStore.js'
import api from '@/services/api.js'
const router = useRouter()
const authStore = useAuthStore()
const mensagensStore = useMensagensStore()
const props = defineProps({
  authenticatedNav: {
    type: Boolean,
    default: false
  }
})
const isMenuOpen = ref(false)
const isUserMenuOpen = ref(false)
const isMessagesOpen = ref(false)
const messagesContainer = ref(null)
const loginEmail = ref('')
const loginPassword = ref('')
const mensagensNaoLidas = computed(() =>
  mensagensStore.lista.filter((mensagem) => mensagem.visto === false).length
)

// Formata a data da mensagem para exibição.
const formatarDataHora = (data) => {
  if (!data) return 'Data não disponível'

  const dataMensagem = new Date(data)
  if (Number.isNaN(dataMensagem.getTime())) return 'Data não disponível'

  return dataMensagem.toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short'
  })
}

// Alterna a navegação principal.
const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value
}

// Alterna o menu do usuário.
const toggleUserMenu = () => {
  isUserMenuOpen.value = !isUserMenuOpen.value
}

// Alterna o painel de mensagens.
const toggleMessages = () => {
  isMessagesOpen.value = !isMessagesOpen.value
}

// Fecha o painel de mensagens ao clicar fora dele.
const closeMessagesOnOutsideClick = (event) => {
  if (isMessagesOpen.value && !messagesContainer.value?.contains(event.target)) {
    isMessagesOpen.value = false
  }
}
// Aceita o pedido de entrada e marca a mensagem como lida.
const aceitarJogador = async (mensagem) => {
  // Implementar lógica para aceitar jogador
  try{
    const res = await api.post(`/dxguild/direct/aceitar`, {
        criador: authStore.getUser()  ,
        sender: mensagem.nome,
        mesa: mensagem.mesa
    }
    
    )
    mensagensStore.marcarComoLida(res.data.mesa);

    
  }catch(error){
    if(error.response && error.response.status === 409) {
         mensagensStore.marcarComoLida(mensagem.mesa);

    }
      console.error('Erro ao aceitar jogador:', error)
  }
}

  
  // Recusa o pedido de entrada e marca a mensagem como lida.
  const recusarJogador = async (mensagem) => {
    // Implementar lógica para recusar jogador
    try{
      const res = await api.post(`/dxguild/direct/rejeitar`, {
          criador: authStore.getUser()  ,
          sender: mensagem.nome,
          mesa: mensagem.mesa
      }
      
      )
      mensagensStore.marcarComoLida(res.data.mesa);
  
      
    }catch(error){
        console.error('Erro ao recusar jogador:', error)
      }
  }

// Navega para a rota escolhida e fecha o menu.
const navigateTo = (path) => {
  router.push(path)
  isMenuOpen.value = false
}

// Fecha o menu do usuário.
const logout = () => {
  // Implementar logout aqui
  isUserMenuOpen.value = false
}



// Registra o clique externo enquanto a navegação está montada.
onMounted(() => {
  document.addEventListener('click', closeMessagesOnOutsideClick)
})



// Remove o listener de clique ao desmontar a navegação.
onBeforeUnmount(() => {
  document.removeEventListener('click', closeMessagesOnOutsideClick)
})
</script>

<template>
  <nav v-if="!authenticatedNav" class="navbar">
    <div class="navbar-container">

      <div class="navbar-brand">
        <router-link to="/" class="brand-link">
          <span class="brand-text">DXGuild</span>
        </router-link>
      </div>

      <!-- Menu Toggle (Mobile) -->
      <button class="menu-toggle" @click="toggleMenu" :class="{ active: isMenuOpen }">
        <span></span>
        <span></span>
        <span></span>
      </button>

      <!-- Navigation Links -->
      <div class="navbar-menu" :class="{ active: isMenuOpen }">
        <ul class="nav-links">
          <li>
            <router-link to="/" class="nav-link" @click="navigateTo('/')">
              Início
            </router-link>
          </li>
          <li>
            <router-link to="/buscar" class="nav-link" @click="navigateTo('/buscar')">
              Procurar mesa
            </router-link>
          </li>
          <li>
            <router-link to="/sobre" class="nav-link" @click="navigateTo('/sobre')">
              Sobre
            </router-link>
          </li>
        </ul>
      </div>

      <!-- User Menu -->
      <div class="user-section">
        <div class="user-menu-container">
          <button class="user-button" @click="toggleUserMenu">
            Iniciar sessão
          </button>

          <div class="user-dropdown" v-if="isUserMenuOpen">
            <div class="login-card">
              <h3>Entrar</h3>
              <label class="login-label">
                <span>Email</span>
                <input v-model="loginEmail" type="email" placeholder="seu@email.com" />
              </label>
              <label class="login-label">
                <span>Senha</span>
                <input v-model="loginPassword" type="password" placeholder="••••••••" />
              </label>
              <button class="login-submit">Entrar</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </nav>
  <nav v-else class="navbar authenticated-navbar">
    <div class="navbar-container">
      <router-link to="/" class="brand-link">
        <span class="brand-text">DXGuild</span>
      </router-link>

      <button class="menu-toggle" @click="toggleMenu" :class="{ active: isMenuOpen }">
        <span></span>
        <span></span>
        <span></span>
      </button>

      <div class="navbar-menu" :class="{ active: isMenuOpen }">
        <ul class="nav-links">
          <li>
            <router-link to="/" class="nav-link" @click="navigateTo('/')">
              In&iacute;cio
            </router-link>
          </li>
          <li>
            <router-link to="/buscar" class="nav-link" @click="navigateTo('/buscar')">
              Procurar mesa
            </router-link>
          </li>
          <li>
            <router-link to="/sobre" class="nav-link" @click="navigateTo('/sobre')">
              Sobre
            </router-link>
          </li>
        </ul>
      </div>

      <div class="authenticated-actions">
        <div ref="messagesContainer" class="messages-container">
          <button
            type="button"
            class="dm-button"
            :aria-expanded="isMessagesOpen"
            aria-controls="direct-messages-panel"
            aria-label="Mensagens diretas"
            title="Mensagens diretas"
            @click="toggleMessages"
          >
            <span aria-hidden="true">✉</span>
            <span v-if="mensagensNaoLidas > 0" class="messages-count">
              {{ mensagensNaoLidas }}
            </span>
          </button>
          <section
            v-if="isMessagesOpen"
            id="direct-messages-panel"
            class="direct-messages-panel"
            role="dialog"
            aria-labelledby="direct-messages-title"
          >
            <header class="direct-messages-header">
              <h2 id="direct-messages-title">Mensagens</h2>
              <button 
                type="button"
                class="messages-close"
                aria-label="Fechar mensagens"
                @click="isMessagesOpen = false"
              >
                ✕
              </button>
            </header>

            <div class="direct-messages-content">
              <p v-if="mensagensStore.lista.length === 0 && mensagensStore.listaLida.length === 0" class="messages-empty">
                Você ainda não recebeu mensagens.
              </p>
              <ul v-else class="messages-list">
                <li
                  v-for="(mensagem, index) in mensagensStore.lista"
                  :key="mensagem.id ?? index"
                  class="message-card"
                  :class="mensagem.visto === false ? 'message-card--unread' : 'message-card--read'"
                >
                  <img
                    class="message-avatar"
                    :src="mensagem.image || '/src/assets/imgs/avatar-default.png'"
                    :alt="`Foto de ${mensagem.nome || 'usuário'}`"
                  />
                  <div class="message-card-body">
                    <div class="message-card-heading">
                      <strong>{{ mensagem.nome || 'Usuário' }}</strong>
                      <span class="message-status">
                        {{ mensagem.visto === false ? 'Não lida' : 'Lida' }}
                      </span>
                    </div>
                    <span class="message-table">A respeito da mesa: {{ mensagem.mesa || 'Mesa' }}</span>
                    <time class="message-date" :datetime="mensagem.data">
                      {{ formatarDataHora(mensagem.data) }}
                    </time>
                    <p>{{ mensagem.message }}</p>
                    <div class="message-actions">
                      <button @click="aceitarJogador(mensagem)" type="button" class="message-action message-action--accept">
                        Aceitar
                      </button>
                      <button @click="recusarJogador(mensagem)" type="button" class="message-action message-action--decline">
                        Recusar
                      </button>
                    </div>
                  </div>
                </li>
                <li
                  v-for="(mensagem, index) in mensagensStore.listaLida"
                  :key="`lida-${mensagem.id ?? index}`"
                  class="message-card message-card--read"
                >
                  <img
                    class="message-avatar"
                    :src="mensagem.image || '/src/assets/imgs/avatar-default.png'"
                    :alt="`Foto de ${mensagem.nome || 'usuário'}`"
                  />
                  <div class="message-card-body">
                    <div class="message-card-heading">
                      <strong>{{ mensagem.nome || 'Usuário' }}</strong>
                      <span class="message-status">Lida</span>
                    </div>
                    <span class="message-table">A respeito da mesa: {{ mensagem.mesa || 'Mesa' }}</span>
                    <time class="message-date" :datetime="mensagem.data">
                      {{ formatarDataHora(mensagem.data) }}
                    </time>
                    <p>{{ mensagem.message }}</p>
                    <div class="message-actions">
                      <button @click="aceitarJogador(mensagem)" type="button" class="message-action message-action--accept">
                        Aceitar
                      </button>
                      <button @click="recusarJogador(mensagem)" type="button" class="message-action message-action--decline">
                        Recusar
                      </button>
                    </div>
                  </div>
                </li>
              </ul>
            </div>
          </section>
        </div>
        <router-link to="/perfil" class="authenticated-profile" aria-label="Abrir perfil">
          <img
            :src="authStore.getImagem() || '/src/assets/imgs/avatar-default.png'"
            :alt="`Foto de ${authStore.getUser() || 'jogador'}`"
          />
          <span>{{ authStore.getUser() || 'Meu perfil' }}</span>
        </router-link>
      </div>
    </div>
  </nav>
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

* {
  box-sizing: border-box;
}
@font-face {
  font-family: 'TheWildBreathOfZelda';
src: url('@/assets/fonts/EightBitDragon-anqx.ttf') ;
  font-weight: normal;
  font-style: normal;
}   
@font-face {
  font-family: 'ancient';
src: url('@/assets/fonts/EightBitDragon-anqx.ttf') ;
  font-weight: normal;
  font-style: normal;
}   
.navbar {
  background: #101211;
  color: #f4f2eb;
  font-family: 'Manrope', 'Segoe UI', system-ui, sans-serif;
  padding: 0;
  box-shadow: 0 3px 16px rgba(0, 0, 0, 0.22);
  position: sticky;
  top: 0;
  z-index: 100;
  border-bottom: 1px solid rgba(226, 186, 97, 0.3);
}

.authenticated-navbar .navbar-container {
  min-height: 2.8rem;
}

.authenticated-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.messages-container {
  position: relative;
}

.dm-button {
  position: relative;
  display: grid;
  width: 2rem;
  height: 2rem;
  place-items: center;
  border: 1px solid rgba(226, 186, 97, 0.35);
  border-radius: 50%;
  background: rgba(226, 186, 97, 0.08);
  color: #edcc85;
  cursor: pointer;
  font-size: 1.2rem;
  transition: 0.25s ease;
}

.dm-button:hover {
  background: rgba(226, 186, 97, 0.2);
  box-shadow: 0 3px 10px rgba(0,0,0,.2);
  transform: translateY(-1px);
}

.messages-count {
  position: absolute;
  top: -0.35rem;
  right: -0.4rem;
  display: grid;
  min-width: 1.15rem;
  height: 1.15rem;
  padding: 0 0.2rem;
  place-items: center;
  border: 2px solid #101211;
  border-radius: 999px;
  background: #c0392b;
  color: #fff;
  font-size: 0.65rem;
  font-weight: 700;
  line-height: 1;
}

.direct-messages-panel {
  position: absolute;
  top: calc(100% + 0.65rem);
  right: 0;
  z-index: 10;
  display: flex;
  flex-direction: column;
  width: min(400px, calc(100vw - 2rem));
  max-height: min(480px, calc(100vh - 5rem));
  overflow: hidden;
  border: 1px solid rgba(226, 186, 97, 0.45);
  border-radius: 12px;
  background: linear-gradient(145deg, #22251f, #101211);
  box-shadow: 0 1rem 2.5rem rgba(0, 0, 0, 0.65);
}

.direct-messages-header {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.1rem;
  border-bottom: 1px solid rgba(226, 186, 97, 0.2);
}

.direct-messages-header h2 {
  margin: 0;
  color: #edcc85;
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-weight: 600;
  font-size: 1.75rem;
}

.messages-close {
  border: 0;
  background: transparent;
  color: #c4c8c0;
  cursor: pointer;
  font-size: 1rem;
}

.messages-close:hover {
  color: #fff3b0;
}

.direct-messages-content {
  min-height: 0;
  overflow-y: auto;
  padding: 1rem;
}

.messages-empty {
  margin: 0;
  color: #b5b9b3;
  font-size: 0.85rem;
  line-height: 1.5;
  text-align: center;
}

.messages-list {
  display: grid;
  gap: 0.7rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.message-card {
  display: flex;
  align-items: flex-start;
  gap: 0.7rem;
  padding: 0.75rem;
  border: 1px solid rgba(226, 186, 97, 0.16);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.03);
}

.message-card--unread {
  border-color: rgba(226, 186, 97, 0.55);
  background: rgba(226, 186, 97, 0.1);
}

.message-card--read {
  opacity: 0.72;
}

.message-avatar {
  width: 2.35rem;
  height: 2.35rem;
  flex: 0 0 auto;
  border: 1px solid rgba(226, 186, 97, 0.4);
  border-radius: 50%;
  object-fit: cover;
}

.message-card-body {
  min-width: 0;
  flex: 1;
}

.message-card-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.message-card strong {
  display: block;
  margin-bottom: 0.3rem;
  color: #edcc85;
  font-size: 0.82rem;
}

.message-status {
  flex: 0 0 auto;
  color: #a8c994;
  font-size: 0.65rem;
}

.message-card--unread .message-status {
  color: #edcc85;
  font-weight: 700;
}

.message-table {
  display: block;
  margin-bottom: 0.35rem;
  color: #b5b9b3;
  font-size: 0.72rem;
}

.message-date {
  display: block;
  margin-bottom: 0.35rem;
  color: #939a94;
  font-size: 0.68rem;
}

.message-card p {
  margin: 0;
  color: #c4c8c0;
  font-size: 0.82rem;
  line-height: 1.45;
  overflow-wrap: anywhere;
}

.message-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.message-action {
  flex: 1;
  padding: 0.45rem 0.6rem;
  border: 1px solid transparent;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.72rem;
  font-weight: 700;
}

.message-action--accept {
  border-color: rgba(142, 231, 165, 0.4);
  background: rgba(142, 231, 165, 0.12);
  color: #8ee7a5;
}

.message-action--accept:hover {
  background: rgba(142, 231, 165, 0.22);
}

.message-action--decline {
  border-color: rgba(195, 107, 102, 0.4);
  background: rgba(195, 107, 102, 0.1);
  color: #d98982;
}

.message-action--decline:hover {
  background: rgba(195, 107, 102, 0.2);
}

.authenticated-profile {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  color: #f4f2eb;
  font-family: 'Manrope', 'Segoe UI', system-ui, sans-serif;
  font-size: 0.85rem;
  text-decoration: none;
}

.authenticated-profile img {
  width: 2rem;
  height: 2rem;
  border: 2px solid #e2ba61;
  border-radius: 50%;
  object-fit: cover;
}

.authenticated-profile:hover {
  color: #edcc85;
}

.navbar-container {
  width: 100%;
  margin: 0 auto;
  padding: 0.35rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

/* Brand */
.navbar-brand {
  display: flex;
  align-items: center;
}

.brand-link {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  text-decoration: none;
  color: #e2ba61;
  font-weight: bold;
  font-size: 1.75rem;
  transition: all 0.3s ease;
  font-family: 'Cormorant Garamond', Georgia, serif;
  letter-spacing: -0.025em;
}

.brand-link:hover {
  color: #edcc85;
  text-shadow: none;
}

.brand-icon {
  font-size: 1.8rem;
}

.brand-text {
  background: linear-gradient(135deg, #e2ba61, #edcc85);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Menu Toggle (Hamburger) */
.menu-toggle {
  display: none;
  flex-direction: column;
  background: none;
  border: none;
  cursor: pointer;
  gap: 5px;
}

.menu-toggle span {
  width: 20px;
  height: 3px;
  background-color: #e2ba61;
  border-radius: 2px;
  transition: all 0.3s ease;
}

.menu-toggle.active span:nth-child(1) {
  transform: rotate(45deg) translate(8px, 8px);
}

.menu-toggle.active span:nth-child(2) {
  opacity: 0;
}

.menu-toggle.active span:nth-child(3) {
  transform: rotate(-45deg) translate(7px, -7px);
}

/* Navigation Links */
.navbar-menu {
  display: flex;
  flex: 1;
  justify-content: center;
}

.nav-links {
  color: #e2ba61;
  list-style: none;
  display: flex;
  gap: 2rem;
  margin: 0;
  padding: 0;
}

.nav-link {
  color: #c4c8c0;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.3s ease;
  padding: 0.3rem 0.75rem;
  border-radius: 4px;
  position: relative;
  font-family: 'Manrope', 'Segoe UI', system-ui, sans-serif;
  font-size: 0.95rem;
}

.nav-link:hover {
  color: #e2ba61;
  text-shadow: none;
}

.nav-link::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 1rem;
  width: 0;
  height: 2px;
  background: linear-gradient(90deg, #e2ba61, #edcc85);
  transition: width 0.3s ease;
}

.nav-link:hover::after {
  width: calc(100% - 2rem);
}

/* User Section */
.user-section {
  
  
  display: flex;
  align-items: center;
}

.user-menu-container {
  position: relative;
  width: 100%;
}

.user-button {
  background: transparent;
  border: 1px solid #79623c;
  border-radius: 5px;
  color: #e2ba61;
  padding: 8px 14px;
  cursor: pointer;
  text-align: center;
  transition: all 0.3s ease;
  font-weight: 600;
  font-family: 'Manrope', 'Segoe UI', system-ui, sans-serif;
  font-size: 0.95rem;
}

.user-button:hover {
  background: rgba(226, 186, 97, 0.2);
  border-color: #edcc85;
  color: #edcc85;
  box-shadow: inset 0 1px 0 rgba(255,236,188,.06);
}

.user-avatar {
  font-size: 1rem;
}

.user-dropdown-icon {
  font-size: 0.8rem;
  transition: transform 0.3s ease;
}

.user-button:has(~ .user-dropdown.active) .user-dropdown-icon {
  transform: rotate(180deg);
}

/* User Dropdown */
.user-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  background: linear-gradient(180deg, #191c1a 0%, #101211 100%);
  border: 1px solid #e2ba61;
  border-radius: 8px;
  margin-top: 8px;
  box-shadow: 0 12px 32px rgba(0,0,0,.4);
  animation: slideDown 0.3s ease;
  overflow: hidden;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.login-card {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
  width: 280px;
  background: transparent;
}

.login-card h3 {
  margin: 0;
  color: #f3dfb4;
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-weight: 600;
  font-size: 1.75rem;
}

.login-label {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  color: #e2ba61;
  font-size: 0.8rem;
}

.login-label input {
  padding: 0.5rem 0.6rem;
  border: 1px solid rgba(226, 186, 97, 0.25);
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.45);
  color: #fff;
}

.login-submit {
  margin-top: 0.25rem;
  padding: 0.55rem 0.7rem;
  border: none;
  border-radius: 6px;
  background: linear-gradient(135deg, #e2ba61, #edcc85);
  color: #000;
  font-weight: 700;
  cursor: pointer;
}

/* Responsive Design */
@media (max-width: 768px) {
   .brand-link {
    display: none;
    font-size: 1.2rem;
  }
  .direct-messages-panel {
    position: fixed;
    inset: 0;
    z-index: 20;
    width: 100vw;
    max-height: none;
    border: 0;
    border-radius: 0;
  }

  .direct-messages-header {
    padding: 1.1rem 1rem;
  }

  .direct-messages-content {
    flex: 1;
    padding: 1.25rem 1rem;
  }

  .navbar-brand {
    display: none;
  }
 
  .navbar-container {
    padding: 0.15rem 0.45rem;
    min-height: 30px;
  }

  .menu-toggle {
    display: flex;
  }

  .navbar-menu {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    flex-direction: column;
    background: #191c1a;
    border-bottom: 1px solid rgba(226, 186, 97, 0.2);
    max-height: 0;
    overflow: hidden;
    transition: max-height 0.3s ease;
  }

  .navbar-menu.active {
    max-height: 400px;
  }

  .nav-links {
    flex-direction: column;
    gap: 0;
    padding: 0.35rem 0;
  }

  .nav-link {
    padding: 0.35rem 0.7rem;
    border-radius: 0;
    font-size: 0.8rem;
  }

  .nav-link::after {
    display: none;
  }

  .nav-link:hover {
    background: rgba(226, 186, 97, 0.1);
  }

  .brand-text {
    display: none;
  }
}

@media (max-width: 480px) {
  
  .navbar-container {
    padding: 0.1rem 0.4rem;
    min-height: 27px;
  }

  .brand-link {
    display: none;
    font-size: 1.2rem;
  }

  .brand-icon {
    font-size: 1.5rem;
  }

  .user-button {
    padding: 0.15rem 0.35rem;
    font-size: 0.8rem;
  }

  .user-button span:last-child {
    display: none;
  }

  .authenticated-profile span {
    display: none;
  }

  .authenticated-actions {
    gap: 0.5rem;
  }
}

/* Acabamento compartilhado com a home e o perfil. */
.navbar button, .navbar input { font-family: 'Manrope', 'Segoe UI', system-ui, sans-serif; }
.navbar a:focus-visible, .navbar button:focus-visible, .navbar input:focus-visible {
  outline: 2px solid #e2ba61;
  outline-offset: 3px;
}
.navbar .nav-link { font-weight: 600; }
.navbar .nav-link.router-link-exact-active { color: #edcc85; background: rgba(226,186,97,.06); }
.navbar .nav-link.router-link-exact-active::after { width: calc(100% - 2rem); }
.navbar .authenticated-profile { min-width: 0; font-weight: 600; }
.navbar .authenticated-profile span { max-width: 160px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.navbar .authenticated-profile img { box-shadow: 0 0 0 3px rgba(226,186,97,.07); }
.navbar .login-submit { background: linear-gradient(180deg, #ebcb7d, #d6ae55); color: #19170f; }
.navbar .login-label { color: #c4c8c0; font-weight: 600; }
.navbar .login-label input { background: #101211; border-color: #555c50; }
.navbar .message-card-heading strong { overflow-wrap: anywhere; }
.navbar .message-table { overflow-wrap: anywhere; }
.navbar .direct-messages-content { scrollbar-width: thin; scrollbar-color: #79623c #191c1a; }
@media (max-width: 768px) {
  .navbar .navbar-container { min-height: 48px; padding: 4px 12px; }
  .navbar .menu-toggle { align-items: center; justify-content: center; width: 40px; height: 40px; }
  .navbar .menu-toggle.active span:nth-child(1) { transform: translateY(8px) rotate(45deg); }
  .navbar .menu-toggle.active span:nth-child(3) { transform: translateY(-8px) rotate(-45deg); }
  .navbar .nav-link { display: flex; align-items: center; min-height: 44px; padding: 10px 20px; font-size: .875rem; }
  .navbar .user-button { padding: 8px 12px; }
  .navbar .login-card { width: min(280px, calc(100vw - 26px)); }
  .navbar .login-label input { font-size: 1rem; }
}
@media (prefers-reduced-motion: reduce) {
  .navbar *, .navbar *::after { animation: none; transition: none; }
}
</style>
