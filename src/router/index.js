import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/home.vue'
import Sobre from '../views/Sobre.vue'
import Perfil from '../views/Perfil.vue'
import Configuracoes from '../views/Configuracoes.vue'
import Editar from '../views/editar.vue'
import Mesa from '../views/Mesa.vue'
import Search from '../views/search.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home,
    },
    {
      path: '/buscar',
      name: 'search',
      component: Search,
    },
    {
      path: '/sobre',
      name: 'sobre',
      component: Sobre,
    },
    {
      path: '/perfil',
      name: 'perfil',
      component: Perfil,
    },
    {
      path: '/configuracoes',
      name: 'configuracoes',
      component: Configuracoes,
    },
    {
      path: '/meu-perfil/editar',
      name: 'editar-perfil',
      component: Editar,
    },
    {
      path: '/mesa/:nome', // <--- Mudou de :id para :nome
      name: 'mesa',
      component: Mesa,
    },
  ],
})

export default router
