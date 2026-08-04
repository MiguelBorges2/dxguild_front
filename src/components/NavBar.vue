<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const isMenuOpen = ref(false)
const isUserMenuOpen = ref(false)
const loginEmail = ref('')
const loginPassword = ref('')

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value
}

const toggleUserMenu = () => {
  isUserMenuOpen.value = !isUserMenuOpen.value
}

const navigateTo = (path) => {
  router.push(path)
  isMenuOpen.value = false
}

const logout = () => {
  // Implementar logout aqui
  isUserMenuOpen.value = false
}
</script>

<template>
  <nav class="navbar">
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
            <router-link to="/salas" class="nav-link" @click="navigateTo('/salas')">
              Salas de Chat
            </router-link>
          </li>
          <li>
            <router-link to="/dados" class="nav-link" @click="navigateTo('/dados')">
               Dados
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
</template>

<style>
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
  background: black;
  padding: 0;
  box-shadow: 0 2px 15px rgba(212, 175, 55, 0.2);
  position: sticky;
  top: 0;
  z-index: 1;
  border-bottom: 1px solid rgba(212, 175, 55, 0.3);
}

.navbar-container {
  width: 100%;
  margin: 0 auto;
  padding: 0.6rem 1.5rem;
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
  color: #d4af37;
  font-weight: bold;
  font-size: 1rem;
  transition: all 0.3s ease;
  font-family: 'thewildbreathofzelda', sans-serif;
  letter-spacing: 1px;
}

.brand-link:hover {
  color: #f0e68c;
  text-shadow: 0 0 10px rgba(212, 175, 55, 0.5);
}

.brand-icon {
  font-size: 1.8rem;
}

.brand-text {
  background: linear-gradient(135deg, #d4af37, #f0e68c);
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
  background-color: #d4af37;
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
  color: #d4af37;
  list-style: none;
  display: flex;
  gap: 2rem;
  margin: 0;
  padding: 0;
}

.nav-link {
  color: #ccc;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.3s ease;
  padding: 0.3rem 0.75rem;
  border-radius: 4px;
  position: relative;
  font-family: 'Cinzel', serif;
  font-size: 0.95rem;
}

.nav-link:hover {
  color: #d4af37;
  text-shadow: 0 0 8px rgba(212, 175, 55, 0.4);
}

.nav-link::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 1rem;
  width: 0;
  height: 2px;
  background: linear-gradient(90deg, #d4af37, #f0e68c);
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
  border: none;
  color: #d4af37;
  padding: 0;
  cursor: pointer;
  text-align: center;
  transition: all 0.3s ease;
  font-weight: 500;
  font-family: 'Cinzel', serif;
  font-size: 0.95rem;
}

.user-button:hover {
  background: rgba(212, 175, 55, 0.2);
  border-color: #f0e68c;
  color: #f0e68c;
  box-shadow: 0 0 12px rgba(212, 175, 55, 0.3);
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
  background: linear-gradient(180deg, #2d1f1a 0%, #1c120e 100%);
  border: 1px solid #d4af37;
  border-radius: 0 0 8px 8px;
  margin-top: 0;
  box-shadow: 0 6px 18px rgba(212, 175, 55, 0.2);
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
  color: #f0e6b8;
  font-family: 'Cinzel', serif;
  font-size: 1rem;
}

.login-label {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  color: #d4af37;
  font-size: 0.8rem;
}

.login-label input {
  padding: 0.5rem 0.6rem;
  border: 1px solid rgba(212, 175, 55, 0.25);
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.45);
  color: #fff;
}

.login-submit {
  margin-top: 0.25rem;
  padding: 0.55rem 0.7rem;
  border: none;
  border-radius: 6px;
  background: linear-gradient(135deg, #d4af37, #f0e68c);
  color: #000;
  font-weight: 700;
  cursor: pointer;
}

/* Responsive Design */
@media (max-width: 768px) {
  .navbar-brand {
    display: none;
  }
 
  .navbar-container {
    padding: 0.2rem 0.45rem;
    min-height: 34px;
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
    background: #2d1f1a;
    border-bottom: 1px solid rgba(212, 175, 55, 0.2);
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
    background: rgba(212, 175, 55, 0.1);
  }

  .brand-text {
    display: none;
  }
}

@media (max-width: 480px) {
  .navbar-container {
    padding: 0.15rem 0.4rem;
    min-height: 30px;
  }

  .brand-link {
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
}
</style>
