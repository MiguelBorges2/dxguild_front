<script setup>
import { computed, ref, watch } from 'vue'
import { watchDebounced } from '@vueuse/core'
import axios from 'axios'
import api from '../services/api'
import {  onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.js'
import { useMensagensStore } from '@/stores/DmStore.js'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
const mensagensStore = useMensagensStore()
const userAuthStore = useAuthStore()
const router = useRouter()
const showInterestModal = ref(false)
const interestTableName = ref('')
const interestMessage = ref('')
const interestMessageSent = ref(false)
const stompClient = ref(null)

const tables = [
  {
    id: 1,
    name: 'As Ruínas de Valdora',
    system: 'D&D 5e',
    description: 'Uma expedição por ruínas ancestrais onde cada escolha desperta um novo perigo.',
    players: 3,
    slots: 2,
    gm: 'Lívia Storm',
    status: 'Aberta',
    statusClass: 'open',
  },
  {
    id: 2,
    name: 'O Eco do Abismo',
    system: 'Call of Cthulhu',
    description: 'Investigadores seguem pistas impossíveis em uma cidade tomada por segredos.',
    players: 4,
    slots: 0,
    gm: 'Rafael Nogueira',
    status: 'Cheia',
    statusClass: 'full',
  },
  {
    id: 3,
    name: 'Além das Montanhas',
    system: 'Pathfinder 2e',
    description: 'Heróis iniciantes atravessam terras selvagens em busca de uma lenda esquecida.',
    players: 2,
    slots: 4,
    gm: 'Maya Ferreira',
    status: 'Aberta',
    statusClass: 'open',
  },
  {
    id: 4,
    name: 'Sombras de Miralume',
    system: 'D&D 5e',
    description: 'Uma fantasia urbana de intriga, alianças frágeis e magia escondida.',
    players: 5,
    slots: 1,
    gm: 'Caio Martins',
    status: 'Últimas vagas',
    statusClass: 'limited',
  },
]
const interestTableCreator = ref('')
const searchBySystem = ref(false)
const searchResults = ref([])
const searchQuery = ref('')
const currentPage = ref(1)
const resultsPerPage = 4
const hasSearched = ref(false)
const mapaPagina = ref(new Map())
const displayedResults = computed(() => {
  const results = hasSearched.value ? searchResults.value : tables
  return Array.isArray(results) ? results.flat(Infinity) : []
})
const totalPages = computed(() => Math.max(1, Math.ceil(displayedResults.value.length / resultsPerPage)))
const paginatedResults = computed(() => {
  const start = (currentPage.value - 1) * resultsPerPage
  return displayedResults.value.slice(start, start + resultsPerPage)
})

// Atualiza a página atual respeitando os limites dos resultados.
function changePage(page) {
  currentPage.value = Math.min(Math.max(page, 1), totalPages.value)
}

// Exibe a página anterior.
function previousPage() {
  changePage(currentPage.value - 1)
}

// Exibe a próxima página.
function nextPage() {
  changePage(currentPage.value + 1)
}

// Limpa os filtros e reinicia os resultados.
function resetSearch() {
  searchQuery.value = ''
  searchResults.value = []
  hasSearched.value = false
  noResults.value = false
  currentPage.value = 1
}
// Verifica a participação do usuário ou abre o pedido de interesse.
async function checaJogador(mesaNome, criador) {
  try {
    const res = await api.get(`/dxguild/mesa/checaJogador/${encodeURIComponent(mesaNome)}`)
    if (res.data === true) {
      router.push(`/mesa/${encodeURIComponent(mesaNome)}`)
    } 
  } catch (error) {
    if (error.response?.status === 403) {
      interestTableCreator.value = criador
      interestTableName.value = mesaNome
      interestMessage.value = ''
      interestMessageSent.value = false
      showInterestModal.value = true
    }
    else {
      console.error('Erro ao verificar se o usuário é jogador:', error)
    }
  }
}
// Envia uma mensagem de interesse para o criador da mesa.
async function sendInterestMessage() {
    // Usa o método da store que já valida e envia pela conexão global ativa
    const enviado = await mensagensStore.enviarMensagem(
        `/app/user/${encodeURIComponent(interestTableCreator.value)}/${encodeURIComponent(useAuthStore().getUser())}`,
        {
            criador: interestTableCreator.value,
            mesa: interestTableName.value,
            mensagem: interestMessage.value,
            visto: false,
        }
    );

    // Fecha o modal ou atualiza o estado de enviado
    if (enviado) interestMessageSent.value = true;
}
// Fecha e reinicia o modal de interesse.
function closeInterestModal() {
  showInterestModal.value = false
  interestTableName.value = ''
  interestMessage.value = ''
  interestMessageSent.value = false
}


const noResults = ref(false)
const empty = ref(true)
const mesasRecente = ref([])
// Carrega as mesas recentes ao abrir a busca.
onMounted(async () => {
  try {
    const response = await axios.get('/dxguild/mesa/recente')
    mesasRecente.value = response.data
    
  } catch (error) {
    console.error('Erro ao buscar mesas:', error)
  }
})
// Reinicia a paginação quando os filtros mudam.
watch([searchQuery, searchBySystem], () => {
  currentPage.value = 1
})
// Busca mesas após uma pausa na digitação.
watchDebounced(
  [searchQuery, searchBySystem],
  async ([newQuery]) => {
    mapaPagina.value.clear()
    searchResults.value = []
    if (newQuery.trim().length < 3) {
      searchResults.value = []
      empty.value = true
      noResults.value = false
      return
    }
    empty.value = false 
    hasSearched.value = true
     var results = []
    if(searchBySystem.value) {
      const response = await axios.get(`/dxguild/search/${encodeURIComponent(newQuery)}/${encodeURIComponent("sistema")}`)
      results = response.data
     
    }else {
       const response = await axios.get(`/dxguild/search/${encodeURIComponent(newQuery)}/${encodeURIComponent("mesa")}`)
       results = response.data
   
    }
    if(results.length === 0) {
      noResults.value = true
    } else {
      noResults.value = false
    }
    var lista = []
    var contador = 0
    var mapeamento = 0
    for(var i = 0; i < results.length; i++) {
        if(contador < 5) {
          lista.push(results[i])
          contador++
        }
        else {
          contador = 1
          searchResults.value.push(lista)
          mapeamento++
          mapaPagina.value.set(mapeamento, lista)
          lista = []
          lista.push(results[i])
        }
    }
    if(lista.length > 0) {
      searchResults.value.push(lista)
      mapeamento++
      mapaPagina.value.set(mapeamento, lista)
    }
  },
  { debounce: 400 } 
)

</script>

<template>
  <main class="search-page">
    <section class="search-hero">
      <div class="hero-copy">
        <span class="eyebrow">Encontre seu próximo grupo</span>
        <h1>Buscar mesas</h1>
        <p>Explore campanhas, encontre seu grupo e prepare-se para rolar os dados.</p>
      </div>
    </section>

    <section class="search-card" aria-labelledby="search-title">
      <div class="search-card-heading">
        <div>
          <h2 id="search-title">Qual aventura você procura?</h2>
          <p>Busque pelo nome da mesa ou pelo sistema.</p>
        </div>
      </div>

      <form class="search-form">
        <label class="field search-query-field">
          <span>Nome ou sistema da mesa</span>
          <div class="input-shell">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H12l-4.5 4v-4h-1A2.5 2.5 0 0 1 4 13.5v-8Z" />
            </svg>
            <input type="search" v-model="searchQuery" placeholder="Ex.: As Ruínas de Valdora ou D&D 5e" />
          </div>
        </label>

        <label class="search-mode">
          <input v-model="searchBySystem" type="checkbox" />
          <span class="checkbox-mark" aria-hidden="true">✓</span>
          <span>
            <strong>Pesquisar por sistema</strong>
            <small>Desmarcado: buscar pelo nome da mesa</small>
          </span>
        </label>

        <button type="button" class="search-submit">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="10.8" cy="10.8" r="6.5" />
            <path d="m16 16 5 5" />
          </svg>
          Buscar mesas
        </button>
        <button type="reset" class="clear-button" @click="resetSearch">Limpar</button>
      </form>
    </section>

    <section class="results-section" aria-labelledby="results-title">
      <div class="results-heading">
        <div>
          
          <h2 id="results-title">Mesas encontradas</h2>
        </div>
        <span class="result-count">{{ displayedResults.length }} mesas encontradas</span>
      </div>

      <div class="results-pager" aria-label="Paginação das mesas">
        <button type="button" class="pager-arrow" :disabled="currentPage === 1" aria-label="Página anterior" @click="previousPage">←</button>
        <span class="pager-page">{{ currentPage }} <small>de {{ searchResults.length }}</small></span>
        <button type="button" class="pager-arrow" :disabled="currentPage === totalPages" aria-label="Próxima página" @click="nextPage">→</button>
      </div>

      <div class="tables-grid">
        <article v-if="!empty" v-for="table in mapaPagina.get(currentPage)" :key="table.id" class="table-card">
          <div class="table-image" v-if="table.imagem || table.image">
            <img :src="table.imagem || table.image" :alt="`Imagem da mesa ${table.nome}`" loading="lazy" />
          </div>
          <div class="table-content">
            <span class="system-badge">{{ table.sistema }}</span>
            <h3>{{ table.nome }}</h3>
            <p class="table-description">{{ table.descricao }}</p>
            <div class="table-details">
              <div class="detail">
                <img class="creator-avatar" :src="table.imagemCriador" alt="Foto do criador da mesa" width="36" height="36" loading="lazy" />
                <strong>{{ table.criador.nome || table.criador }}</strong>
              </div>
              <span v-if="table.vaga === true" class="status-badge open">
                <span class="status-dot" aria-hidden="true"></span>Com vagas
              </span>
              <span v-else-if="table.vaga === false" class="status-badge full">
                <span class="status-dot" aria-hidden="true"></span>Mesa cheia
              </span>
            </div>
            <div class="card-footer">
              <button @click="checaJogador(table.nome, table.criador)" type="button" class="join-button" :class="{ disabled: !table.vaga }" :disabled="!table.vaga">
              {{ table.vaga ? 'Entrar na mesa' : 'Mesa cheia' }}
              <span aria-hidden="true">→</span>
            </button>
            </div>
          </div>
        </article>
          <article v-if="empty" v-for="table in mesasRecente" :key="table.id" class="table-card">
          <div class="table-image" v-if="table.imagem || table.image">
            <img :src="table.imagem || table.image" :alt="`Imagem da mesa ${table.nome}`" loading="lazy" />
          </div>
          <div class="table-content">
            <span class="system-badge">{{ table.sistema }}</span>
            <h3>{{ table.nome }}</h3>
            <p class="table-description">{{ table.descricao }}</p>
            <div class="table-details">
              <div class="detail">
                <img class="creator-avatar" :src="table.imagemCriador" alt="Foto do criador da mesa" width="36" height="36" loading="lazy" />
                <strong>{{ table.criador.nome || table.criador }}</strong>
              </div>
              <span v-if="table.vaga === true" class="status-badge open">
                <span class="status-dot" aria-hidden="true"></span>Com vagas
              </span>
              <span v-else-if="table.vaga === false" class="status-badge full">
                <span class="status-dot" aria-hidden="true"></span>Mesa cheia
              </span>
            </div>
            <div class="card-footer">
              <button  @click="checaJogador(table.nome, table.criador)" type="button" class="join-button" :class="{ disabled: !table.vaga }" :disabled="!table.vaga">
              {{ table.vaga ? 'Entrar na mesa' : 'Mesa cheia' }}
              <span aria-hidden="true">→</span>
            </button>
            </div>
          </div>
        </article>
        
      </div>
      <p v-if="noResults" class="no-results-message">
        Nenhuma mesa encontrada.
      </p>
    </section>

    <div v-if="showInterestModal" class="interest-modal-overlay" @click.self="closeInterestModal">
      <section class="interest-modal" role="dialog" aria-modal="true" aria-labelledby="interest-modal-title">
        <button type="button" class="interest-modal-close" aria-label="Fechar modal" @click="closeInterestModal">✕</button>
        <span class="eyebrow">Interesse na aventura</span>
        <h2 id="interest-modal-title">Você não participa da mesa ainda!</h2>
        <p>
          Que tal escrever uma mensagem para o mestre de <strong>{{ interestTableName }}</strong>
          dizendo que você tem interesse?
        </p>

        <form v-if="!interestMessageSent" @submit.prevent="sendInterestMessage">
          <label for="interest-message">Mensagem para o mestre</label>
          <textarea
            id="interest-message"
            v-model="interestMessage"
            rows="5"
            placeholder="Escreva uma mensagem para o mestre..."
            required
          ></textarea>
          <button  type="submit" class="interest-submit">Enviar mensagem</button>
        </form>
        <div v-else class="interest-success">
          Sua mensagem foi enviada ao mestre!
        </div>
      </section>
    </div>
  </main>
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
.search-page {
  --search-bg: #101211;
  --search-surface: #191c1a;
  --search-text: #f4f2eb;
  --search-muted: #b5b9b3;
  --search-gold: #e2ba61;
  --search-line: #343831;
  min-height: calc(100vh - 4rem);
  padding: 44px 48px 64px;
  background: var(--search-bg);
  color: var(--search-text);
  font-family: 'Manrope', 'Segoe UI', system-ui, sans-serif;
  font-size: 1rem;
  line-height: 1.6;
  color-scheme: dark;
}
.search-page *, .search-page *::before, .search-page *::after { box-sizing: border-box; }
.search-page button, .search-page input, .search-page textarea { font-family: inherit; }
.search-page button { cursor: pointer; }
.search-page button:focus-visible, .search-page textarea:focus-visible { outline: 2px solid var(--search-gold); outline-offset: 4px; }
.search-page ::selection { background: var(--search-gold); color: var(--search-bg); }
.search-hero, .search-card, .results-section { width: min(1200px, 100%); margin-inline: auto; }
.search-hero { margin-bottom: 28px; }
.eyebrow { color: var(--search-gold); font-size: 0.6875rem; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; }
.hero-copy h1 { margin: 8px 0 10px; color: var(--search-text); font-family: 'Cormorant Garamond', Georgia, serif; font-size: clamp(2.75rem, 4vw, 3.5rem); font-weight: 600; line-height: 1.1; letter-spacing: -0.035em; }
.hero-copy p { margin: 0; color: var(--search-muted); font-size: 1rem; }
.search-card { margin-bottom: 40px; padding: 26px; border: 1px solid #5b503a; border-top: 2px solid #bd9b56; border-radius: 8px; background: radial-gradient(ellipse at top right, rgba(194,153,75,.1), transparent 65%), linear-gradient(135deg, #232720, #191c1a); box-shadow: 0 8px 24px rgba(0,0,0,.2); }
.search-card-heading { margin-bottom: 24px; }
.search-card h2 { margin: 0 0 5px; color: var(--search-text); font-family: 'Cormorant Garamond', Georgia, serif; font-size: 1.875rem; font-weight: 600; line-height: 1.3; letter-spacing: -0.02em; }
.search-card-heading p { margin: 0; color: var(--search-muted); font-size: 0.875rem; }
.search-form { display: grid; grid-template-columns: minmax(0, 1fr) auto auto auto; align-items: end; gap: 16px; }
.field { display: flex; flex-direction: column; gap: 8px; min-width: 0; }
.field > span { color: var(--search-text); font-size: 0.8125rem; font-weight: 500; }
.input-shell { display: flex; align-items: center; gap: 10px; min-height: 48px; padding: 0 14px; border: 1px solid #555c50; border-radius: 5px; background: var(--search-bg); color: var(--search-muted); }
.input-shell:focus-within { border-color: var(--search-gold); outline: 2px solid var(--search-gold); outline-offset: 3px; }
.input-shell svg, .search-submit svg { flex: 0 0 18px; width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; }
.input-shell input { width: 100%; min-width: 0; min-height: 46px; border: 0; outline: 0; background: transparent; color: var(--search-text); font-size: 0.875rem; }
.input-shell input::placeholder { color: #a5ada1; opacity: 1; }
.search-mode { position: relative; display: flex; align-items: center; gap: 10px; min-height: 48px; margin: 0; cursor: pointer; }
.search-mode input { position: absolute; opacity: 0; width: 20px; height: 20px; }
.checkbox-mark { display: grid; place-items: center; flex: 0 0 20px; width: 20px; height: 20px; border: 1px solid #858e81; border-radius: 4px; color: transparent; font-size: 0.8125rem; }
.search-mode input:checked + .checkbox-mark { background: var(--search-gold); border-color: var(--search-gold); color: #19170f; }
.search-mode input:focus-visible + .checkbox-mark { outline: 2px solid var(--search-gold); outline-offset: 4px; }
.search-mode > span:last-child { display: flex; flex-direction: column; gap: 3px; }
.search-mode strong { color: var(--search-text); font-size: 0.8125rem; font-weight: 500; }
.search-mode small { color: var(--search-muted); font-size: 0.625rem; }
.search-submit, .clear-button { display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 48px; padding: 10px 18px; border: 1px solid var(--search-gold); border-radius: 5px; font-size: 0.8125rem; font-weight: 600; white-space: nowrap; transition: background-color 180ms ease, border-color 180ms ease; }
.search-submit { background: var(--search-gold); color: #19170f; }
.search-submit:hover { background: #f0cd81; border-color: #f0cd81; }
.clear-button { border-color: #555c50; background: transparent; color: var(--search-text); }
.clear-button:hover { border-color: #8e7c50; background: #28271f; }
.results-heading { display: flex; align-items: baseline; justify-content: space-between; gap: 16px; margin-bottom: 18px; }
.results-heading h2 { margin: 0; color: var(--search-text); font-family: 'Cormorant Garamond', Georgia, serif; font-size: clamp(1.875rem, 2.8vw, 2.25rem); font-weight: 600; letter-spacing: -0.025em; line-height: 1.25; }
.result-count { color: var(--search-muted); font-size: 0.8125rem; }
.results-pager { display: flex; align-items: center; justify-content: flex-start; gap: 16px; margin-bottom: 22px; }
.pager-arrow { display: grid; place-items: center; width: 44px; height: 44px; border: 1px solid #555c50; border-radius: 5px; background: transparent; color: var(--search-text); font-size: 1.125rem; line-height: 1; }
.pager-arrow:hover:not(:disabled) { background: #28271f; border-color: #8e7c50; }
.pager-arrow:disabled { opacity: 0.4; cursor: not-allowed; }
.pager-page { color: var(--search-text); font-size: 0.875rem; font-variant-numeric: tabular-nums; }
.pager-page small { color: var(--search-muted); font-size: inherit; }
.tables-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 24px; }
.table-card { display: flex; flex-direction: column; min-width: 0; overflow: hidden; border: 1px solid #484235; border-radius: 8px; background: linear-gradient(160deg, #242620, #191c1a 65%); box-shadow: 0 8px 24px rgba(0,0,0,.2), inset 0 1px 0 rgba(238,214,163,.04); transition: border-color 180ms ease; }
.table-card:hover, .table-card:focus-within { border-color: #8e7c50; }
.table-image { aspect-ratio: 2.8; overflow: hidden; background: #252a25; border-bottom: 1px solid #484235; }
.table-image img { display: block; width: 100%; height: 100%; object-fit: cover; }
.table-content { display: flex; flex: 1; flex-direction: column; align-items: flex-start; min-width: 0; padding: 18px 22px 10px; }
.system-badge { display: inline-block; max-width: 100%; margin-bottom: 10px; padding: 4px 9px; overflow: hidden; border: 1px solid #674c43; background: #342925; border-radius: 5px; color: #e6cbb1; font-size: 0.75rem; font-weight: 700; letter-spacing: .025em; line-height: 1.5; white-space: nowrap; text-overflow: ellipsis; }
.table-card h3 { display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; width: 100%; min-height: 2.4em; margin: 0 0 12px; padding-left: 12px; border-left: 3px solid #cda85b; overflow: hidden; overflow-wrap: anywhere; color: #f3dfb4; font-family: 'Cormorant Garamond', Georgia, serif; font-size: 1.75rem; font-weight: 600; line-height: 1.2; letter-spacing: -0.015em; }
.table-description { display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 3; width: 100%; min-height: 4.65em; margin: 0 0 20px; overflow: hidden; overflow-wrap: anywhere; color: #c4c8c0; font-size: 0.875rem; line-height: 1.55; }
.table-details { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px 18px; width: 100%; margin-top: auto; padding-top: 16px; border-top: 1px solid rgba(226,186,97,.14); }
.detail { display: flex; flex: 1 1 120px; align-items: center; min-width: 0; gap: 10px; }
.creator-avatar { display: block; flex: 0 0 36px; width: 36px; height: 36px; border: 1px solid #716043; border-radius: 50%; object-fit: cover; background: #252a25; }
.detail strong { overflow: hidden; color: var(--search-text); font-size: 0.8125rem; font-weight: 600; text-overflow: ellipsis; white-space: nowrap; }
.status-badge { display: inline-flex; flex-shrink: 0; align-items: center; gap: 8px; padding: 5px 8px; border: 1px solid rgba(170,180,167,.18); border-radius: 5px; background: rgba(170,180,167,.06); color: #c8cec5; font-weight: 600; font-size: 0.75rem; white-space: nowrap; }
.status-dot { flex: 0 0 7px; width: 7px; height: 7px; border-radius: 50%; background: #939a94; }
.status-badge.open .status-dot { background: #59bf91; }
.card-footer { display: flex; justify-content: flex-end; width: 100%; margin-top: 16px; padding-bottom: 10px; }
.join-button { display: inline-flex; align-items: center; justify-content: center; gap: 10px; min-height: 44px; width: 100%; padding: 10px 16px; border: 1px solid #79623c; border-radius: 4px; background: linear-gradient(180deg, rgba(226,186,97,.08), rgba(226,186,97,.02)); color: var(--search-gold); font-size: 0.8125rem; font-weight: 700; }
.join-button:hover:not(:disabled) { color: #f0cd81; text-decoration: underline; text-underline-offset: 4px; }
.join-button:disabled, .join-button.disabled { color: #939a94; cursor: not-allowed; }
.no-results-message { margin: 24px 0 0; padding: 24px; border: 1px dashed #555c50; border-radius: 6px; color: var(--search-muted); text-align: center; }
.interest-modal-overlay { position: fixed; inset: 0; z-index: 2000; display: flex; align-items: center; justify-content: center; overflow-y: auto; padding: 24px; background: rgb(0 0 0 / 80%); }
.interest-modal { position: relative; width: 100%; max-width: 520px; max-height: calc(100dvh - 48px); overflow-y: auto; padding: 32px; border: 1px solid #65583b; border-radius: 8px; background: var(--search-surface); scrollbar-width: thin; scrollbar-color: #65583b var(--search-surface); }
.interest-modal > .eyebrow { display: block; padding-right: 32px; }
.interest-modal h2 { margin: 14px 24px 14px 0; color: var(--search-text); font-family: 'Cormorant Garamond', Georgia, serif; font-size: 2rem; line-height: 1.25; font-weight: 600; letter-spacing: -0.025em; }
.interest-modal p { margin: 0 0 24px; color: var(--search-muted); font-size: 0.9375rem; overflow-wrap: anywhere; }
.interest-modal p strong { color: var(--search-text); }
.interest-modal-close { position: absolute; top: 12px; right: 12px; display: grid; place-items: center; width: 44px; height: 44px; padding: 0; border: 0; border-radius: 4px; background: transparent; color: var(--search-muted); font-size: 1.125rem; }
.interest-modal-close:hover { color: var(--search-text); background: #292d26; }
.interest-modal form { display: grid; gap: 10px; }
.interest-modal label { color: var(--search-text); font-size: 0.875rem; font-weight: 500; }
.interest-modal textarea { width: 100%; min-height: 128px; padding: 12px; border: 1px solid #555c50; border-radius: 5px; background: var(--search-bg); color: var(--search-text); font-size: 0.9375rem; line-height: 1.5; resize: vertical; }
.interest-modal textarea::placeholder { color: #a5ada1; opacity: 1; }
.interest-submit { min-height: 48px; margin-top: 8px; padding: 12px 18px; border: 1px solid var(--search-gold); border-radius: 5px; background: var(--search-gold); color: #19170f; font-size: 0.875rem; font-weight: 600; }
.interest-submit:hover { background: #f0cd81; border-color: #f0cd81; }
.interest-success { padding: 16px; border: 1px solid #365444; border-radius: 6px; background: #18271e; color: #8dd9af; }
@media (max-width: 1050px) {
  .search-page { padding: 36px 24px 48px; }
  .search-form { grid-template-columns: minmax(0, 1fr) auto auto; }
  .search-query-field { grid-column: 1 / -1; }
}
@media (max-width: 640px) {
  .search-page { padding: 28px 20px 40px; }
  .search-card { padding: 20px 16px; margin-bottom: 32px; }
  .search-form { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 16px 12px; }
  .search-query-field, .search-mode { grid-column: 1 / -1; }
  .search-submit, .clear-button { width: 100%; padding-inline: 10px; }
  .results-heading { align-items: flex-start; flex-direction: column; gap: 8px; }
  .tables-grid { grid-template-columns: minmax(0, 1fr); gap: 20px; }
  .table-image { aspect-ratio: 2.1; }
  .table-content { padding: 16px 16px 8px; }
  .table-card h3 { font-size: 1.75rem; }
  .interest-modal-overlay { padding: 16px; }
  .interest-modal { max-height: calc(100dvh - 32px); padding: 28px 20px; }
}
@media (prefers-reduced-motion: reduce) {
  .search-submit, .clear-button, .table-card { transition: none; }
}

/* Detalhes visuais alinhados à home e ao perfil. */
.search-submit, .interest-submit {
  background: linear-gradient(180deg, #ebcb7d, #d6ae55);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.2), 0 3px 10px rgba(0,0,0,.18);
  font-weight: 700;
}
.input-shell { box-shadow: inset 0 2px 5px rgba(0,0,0,.18); }
.field > span, .search-mode strong { font-weight: 600; }
.status-badge.open { color: #a9dbbe; border-color: rgba(89,191,145,.22); background: rgba(89,191,145,.07); }
.join-button:hover:not(:disabled) { border-color: var(--search-gold); background: rgba(226,186,97,.11); text-decoration: none; }
.join-button:disabled, .join-button.disabled { border-color: #454a43; background: rgba(147,154,148,.04); box-shadow: none; }
@media (max-width: 640px) {
  .input-shell input, .interest-modal textarea { font-size: 1rem; }
}
</style>