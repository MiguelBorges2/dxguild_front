<script setup>
import NavBar from '@/components/NavBar.vue'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth.js'
import { useMensagensStore } from '@/stores/DmStore.js'
import { watch } from 'vue'
import { onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
const route = useRoute()
const authStore = useAuthStore()
const mensagensStore = useMensagensStore()
const router = useRouter()

const useAuthenticatedNav = computed(() => (
  Boolean(authStore.Navcontroller) &&
  (route.path === '/perfil' || route.path === '/buscar' || route.path.startsWith('/mesa/'))
))

// Inicia as mensagens diretas quando a sessão está autenticada.
onMounted(async () => {
   await router.isReady() 
  if (authStore.getToken() && authStore.getUser() && route.path !== '/perfil') {
    mensagensStore.conexao().catch((error) => console.error('Erro ao iniciar mensagens diretas:', error))
  }
})

// Encerra a conexão de mensagens ao desmontar o aplicativo.
onUnmounted(() => mensagensStore.desconectar())

</script>

<template>
  <NavBar :authenticated-nav="useAuthenticatedNav" />
  <main class="main-content">
    <router-view />
  </main>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body, #app {
  width: 100%;
  height: 100%;
  z-index:1;
}

body {
  background-color: black;
  color: #ffffff;
 
}

.main-content {
  width: 100%;
  padding: 0;
  margin: 0;
  background-color: black;
  z-index:1;
   width: 100%;
  height: 100%; 
}
</style>
