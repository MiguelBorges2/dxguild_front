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

function changePage(page) {
  currentPage.value = Math.min(Math.max(page, 1), totalPages.value)
}

function previousPage() {
  changePage(currentPage.value - 1)
}

function nextPage() {
  changePage(currentPage.value + 1)
}

function resetSearch() {
  searchQuery.value = ''
  searchResults.value = []
  hasSearched.value = false
  noResults.value = false
  currentPage.value = 1
}
async function checaJogador(mesaNome, criador) {
  try {
    const res = await api.get(`http://localhost:8080/dxguild/mesa/checaJogador/${encodeURIComponent(mesaNome)}`)
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
async function sendInterestMessage() {
    // Usa o método da store que já valida e envia pela conexão global ativa
    mensagensStore.enviarMensagem(
        `/app/user/${encodeURIComponent(interestTableCreator.value)}/${encodeURIComponent(useAuthStore().getUser())}`,
        {
            criador: interestTableCreator.value,
            mesa: interestTableName.value,
            mensagem: interestMessage.value,
            visto: false,
        }
    );

    // Fecha o modal ou atualiza o estado de enviado
    interestMessageSent.value = true;
}
function closeInterestModal() {
  showInterestModal.value = false
  interestTableName.value = ''
  interestMessage.value = ''
  interestMessageSent.value = false
}


const noResults = ref(false)
const empty = ref(true)
const mesasRecente = ref([])
onMounted(async () => {
  try {
    const response = await axios.get('http://localhost:8080/dxguild/mesa/recente')
    mesasRecente.value = response.data
    
  } catch (error) {
    console.error('Erro ao buscar mesas:', error)
  }
})
watch([searchQuery, searchBySystem], () => {
  currentPage.value = 1
})
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
      const response = await axios.get(`http://localhost:8080/dxguild/search/${encodeURIComponent(newQuery)}/${encodeURIComponent("sistema")}`)
      results = response.data
     
    }else {
       const response = await axios.get(`http://localhost:8080/dxguild/search/${encodeURIComponent(newQuery)}/${encodeURIComponent("mesa")}`)
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
    console.log(searchResults.value)
  },
  { debounce: 400 } 
)

</script>

<template>
  <main class="search-page">
    <section class="search-hero">
      <div class="hero-copy">
        <span class="eyebrow"><span class="eyebrow-mark">✦</span> Encontre sua próxima aventura</span>
        <h1>Buscar mesas</h1>
        <p>Explore campanhas, encontre seu grupo e prepare-se para rolar os dados.</p>
      </div>

      <div class="hero-emblem" aria-hidden="true">
        <span>⚔</span>
      </div>
    </section>

    <section class="search-card" aria-labelledby="search-title">
      <div class="search-card-heading">
        <div class="heading-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <circle cx="10.8" cy="10.8" r="6.5" />
            <path d="m16 16 5 5" />
          </svg>
        </div>
        <div>
          <h2 id="search-title">Qual aventura você procura?</h2>
          <p>Combine os filtros para encontrar uma mesa com a sua cara.</p>
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
          <span class="eyebrow">Aventureiros reunidos</span>
          <h2 id="results-title">Mesas em destaque</h2>
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
          <div class="card-topline">
            <span class="system-badge">{{ table.sistema }}</span>
            <span class="status-badge" :class="table.statusClass">
              <span class="status-dot"></span>
              {{ table.status }}
            </span>
          </div>

          <div class="table-image" v-if="table.imagem || table.image">
            <img :src="table.imagem || table.image" :alt="`Imagem da mesa ${table.nome}`" />
            <span class="table-image-mask" aria-hidden="true"></span>
          </div>

          <h3>{{ table.nome }}</h3>
          <p class="table-description">{{ table.descricao }}</p>

          <div class="table-details">
            <div class="detail">
              <span class="detail-icon" aria-hidden="true">♟</span>
              <div>
                <small>Mestre</small>
                <strong>
                  {{ table.criador.nome || table.criador }}
                  <span class="detail-meio">· {{ table.meio }}</span>
                </strong>
              </div>
            </div>
          </div>

          <div class="card-footer">
            <span v-if="table.vaga" class="slots">Vagas disponíveis</span>
            <span v-else class="slots unavailable">Sem vagas no momento</span>
            <button @click="checaJogador(table.nome, table.criador)" type="button" class="join-button" :class="{ disabled: !table.vaga }" :disabled="!table.vaga">
              {{ table.vaga ? 'Entrar na mesa' : 'Mesa cheia' }}
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </article>
          <article v-if="empty" v-for="table in mesasRecente" :key="table.id" class="table-card">
          <div class="card-topline">
            <span class="system-badge">{{ table.sistema }}</span>
            <span class="status-badge" :class="table.statusClass">
              <span class="status-dot"></span>
              {{ table.status }}
            </span>
          </div>

          <div class="table-image" v-if="table.imagem || table.image">
            <img :src="table.imagem || table.image" :alt="`Imagem da mesa ${table.nome}`" />
            <span class="table-image-mask" aria-hidden="true"></span>
          </div>

          <h3>{{ table.nome }}</h3>
          <p class="table-description">{{ table.descricao }}</p>

          <div class="table-details">
            <div class="detail">
              <span class="detail-icon" aria-hidden="true">♟</span>
              <div>
                <small>Mestre</small>
                <strong>
                  {{ table.criador.nome || table.criador }}
                  <span class="detail-meio">· {{ table.meio }}</span>
                </strong>
              </div>
            </div>
          </div>

          <div class="card-footer">
            <span v-if="table.vaga" class="slots">Vagas disponíveis</span>
            <span v-else class="slots unavailable">Sem vagas no momento</span>
            <button  @click="checaJogador(table.nome, table.criador.nome)" type="button" class="join-button" :class="{ disabled: !table.vaga }" :disabled="!table.vaga">
              {{ table.vaga ? 'Entrar na mesa' : 'Mesa cheia' }}
              <span aria-hidden="true">→</span>
            </button>
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
.search-page {
  min-height: calc(100vh - 4rem);
  padding: 3.5rem clamp(1rem, 4vw, 4rem) 5rem;
  color: #f5e9d0;
  background:
    radial-gradient(circle at 12% 8%, rgba(212, 175, 55, 0.13), transparent 25rem),
    linear-gradient(135deg, #080808, #12100d 48%, #050505);
}

.search-hero,
.search-card,
.results-section {
  width: min(1120px, 100%);
  margin-inline: auto;
}

.search-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
  margin-bottom: 2rem;
}

.hero-copy h1,
.results-heading h2 {
  margin: 0.35rem 0 0.6rem;
  color: #f0e68c;
  font-family: 'Cinzel', Georgia, serif;
  font-size: clamp(2rem, 4vw, 3rem);
  line-height: 1.1;
}

.hero-copy p,
.search-card-heading p {
  margin: 0;
  color: #cdbf90;
  line-height: 1.6;
}

.eyebrow {
  color: #d4af37;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.eyebrow-mark {
  margin-right: 0.35rem;
  color: #f0e68c;
}

.hero-emblem {
  display: grid;
  place-items: center;
  width: 5.7rem;
  height: 5.7rem;
  flex: 0 0 auto;
  border: 1px solid rgba(212, 175, 55, 0.36);
  border-radius: 50%;
  background: radial-gradient(circle, rgba(212, 175, 55, 0.2), rgba(10, 10, 10, 0.4) 68%);
  color: #f0e68c;
  font-size: 2.7rem;
  box-shadow: 0 0 35px rgba(212, 175, 55, 0.12);
}

.search-card {
  margin-bottom: 3.5rem;
  padding: clamp(1.1rem, 3vw, 1.8rem);
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: 18px;
  background: linear-gradient(135deg, rgba(212, 175, 55, 0.14), rgba(14, 14, 14, 0.95) 42%);
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.34), inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

.search-card-heading {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  margin-bottom: 1.3rem;
}

.heading-icon {
  display: grid;
  place-items: center;
  width: 2.7rem;
  height: 2.7rem;
  flex: 0 0 auto;
  border: 1px solid rgba(240, 230, 140, 0.3);
  border-radius: 10px;
  background: rgba(212, 175, 55, 0.16);
  color: #f0e68c;
}

.heading-icon svg,
.input-shell svg,
.search-submit svg {
  width: 1.15rem;
  height: 1.15rem;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.7;
}

.search-card h2 {
  margin: 0 0 0.25rem;
  color: #f7e7b9;
  font-family: 'Cinzel', Georgia, serif;
  font-size: 1.15rem;
}

.search-form {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(12rem, auto) auto auto;
  align-items: end;
  gap: 0.75rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.field > span {
  color: #d9c88a;
  font-size: 0.73rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.input-shell {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  min-height: 2.8rem;
  padding: 0 0.8rem;
  border: 1px solid rgba(212, 175, 55, 0.25);
  border-radius: 9px;
  background: rgba(0, 0, 0, 0.45);
  color: #d4af37;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.input-shell:focus-within {
  border-color: rgba(240, 230, 140, 0.8);
  box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.11);
}

.input-shell input {
  width: 100%;
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: #f5e9d0;
  font: inherit;
}

.search-mode {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  min-height: 2.8rem;
  padding: 0.45rem 0.7rem;
  border: 1px solid rgba(212, 175, 55, 0.2);
  border-radius: 9px;
  background: rgba(0, 0, 0, 0.3);
  color: #d9c88a;
  cursor: pointer;
}

.search-mode input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.checkbox-mark {
  display: grid;
  place-items: center;
  width: 1.2rem;
  height: 1.2rem;
  flex: 0 0 auto;
  border: 1px solid rgba(212, 175, 55, 0.55);
  border-radius: 4px;
  color: transparent;
  font-size: 0.78rem;
  font-weight: 900;
  transition: background 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
}

.search-mode input:checked + .checkbox-mark {
  background: linear-gradient(135deg, #d4af37, #f0e68c);
  color: #120e05;
  box-shadow: 0 0 12px rgba(212, 175, 55, 0.25);
}

.search-mode > span:last-child {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.search-mode strong {
  color: #f0e68c;
  font-size: 0.74rem;
  white-space: nowrap;
}

.search-mode small {
  color: #8e8468;
  font-size: 0.65rem;
  white-space: nowrap;
}

.search-mode:has(input:focus-visible) {
  border-color: rgba(240, 230, 140, 0.8);
  box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.11);
}

.search-submit,
.clear-button,
.join-button {
  border-radius: 9px;
  font-weight: 800;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease, filter 0.2s ease;
}

.search-submit {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  min-height: 2.8rem;
  padding: 0.65rem 1rem;
  border: 1px solid rgba(255, 248, 190, 0.55);
  background: linear-gradient(135deg, #b88a16, #f0e68c);
  color: #120e05;
  white-space: nowrap;
}

.search-submit:hover,
.search-submit:focus-visible,
.join-button:hover:not(:disabled),
.join-button:focus-visible {
  transform: translateY(-2px);
  filter: brightness(1.08);
  box-shadow: 0 10px 22px rgba(212, 175, 55, 0.3);
  outline: none;
}

.clear-button {
  min-height: 2.8rem;
  padding: 0.65rem 0.75rem;
  border: 1px solid rgba(212, 175, 55, 0.25);
  background: transparent;
  color: #cdbf90;
}

.clear-button:hover,
.clear-button:focus-visible {
  border-color: rgba(240, 230, 140, 0.7);
  color: #f0e68c;
  outline: none;
}

.results-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.15rem;
}

.results-heading h2 {
  margin-top: 0.25rem;
  font-size: clamp(1.5rem, 3vw, 2rem);
}

.result-count {
  padding: 0.4rem 0.7rem;
  border: 1px solid rgba(212, 175, 55, 0.18);
  border-radius: 999px;
  color: #cdbf90;
  font-size: 0.78rem;
}

.results-pager {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin: 0 auto 1.15rem;
}

.pager-arrow {
  display: grid;
  place-items: center;
  width: 2.25rem;
  height: 2.25rem;
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: 50%;
  background: rgba(212, 175, 55, 0.1);
  color: #f0e68c;
  cursor: pointer;
  font-size: 1.25rem;
  line-height: 1;
  transition: transform 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
}

.pager-arrow:hover:not(:disabled),
.pager-arrow:focus-visible:not(:disabled) {
  transform: translateY(-2px);
  background: rgba(212, 175, 55, 0.25);
  box-shadow: 0 8px 18px rgba(212, 175, 55, 0.22);
  outline: none;
}

.pager-arrow:disabled {
  cursor: not-allowed;
  opacity: 0.32;
}

.pager-page {
  min-width: 4.5rem;
  color: #f7e7b9;
  font-family: 'Cinzel', Georgia, serif;
  font-size: 1.05rem;
  font-weight: 700;
  text-align: center;
}

.pager-page small {
  color: #8e8468;
  font-family: inherit;
  font-size: 0.75rem;
  font-weight: 400;
}

.tables-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.no-results-message {
  margin: 1.5rem 0 0;
  padding: 1rem;
  border: 1px solid rgba(186, 119, 112, 0.35);
  border-radius: 10px;
  background: rgba(186, 119, 112, 0.08);
  color: #d89a94;
  font-size: 0.95rem;
  text-align: center;
}

.table-card {
  display: flex;
  flex-direction: column;
  min-height: 285px;
  padding: 1.15rem;
  border: 1px solid rgba(212, 175, 55, 0.17);
  border-radius: 15px;
  background: linear-gradient(155deg, rgba(28, 25, 19, 0.92), rgba(10, 10, 10, 0.98));
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.26);
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}

.table-image {
  position: relative;
  height: 135px;
  margin: 0.85rem 0 0.1rem;
  overflow: hidden;
  border: 1px solid rgba(212, 175, 55, 0.22);
  border-radius: 10px;
  background: #15120d;
}

.table-image img,
.table-image-mask {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.table-image img {
  display: block;
  object-fit: cover;
  filter: saturate(0.72) brightness(0.72) contrast(1.05);
  transition: transform 0.35s ease, filter 0.35s ease;
}

.table-image-mask {
  background:
    linear-gradient(180deg, rgba(8, 8, 8, 0.08), rgba(8, 8, 8, 0.74)),
    linear-gradient(135deg, rgba(212, 175, 55, 0.16), transparent 58%);
  pointer-events: none;
}

.table-card:hover .table-image img {
  transform: scale(1.05);
  filter: saturate(0.9) brightness(0.82) contrast(1.05);
}

.table-card:hover {
  transform: translateY(-4px);
  border-color: rgba(212, 175, 55, 0.48);
  box-shadow: 0 16px 30px rgba(0, 0, 0, 0.38), 0 0 24px rgba(212, 175, 55, 0.07);
}

.card-topline,
.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.65rem;
}

.system-badge,
.status-badge {
  border-radius: 999px;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.system-badge {
  padding: 0.35rem 0.6rem;
  border: 1px solid rgba(212, 175, 55, 0.22);
  background: rgba(212, 175, 55, 0.12);
  color: #f0e68c;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  color: #cdbf90;
}

.status-dot {
  width: 0.42rem;
  height: 0.42rem;
  border-radius: 50%;
  background: currentColor;
  box-shadow: 0 0 8px currentColor;
}

.status-badge.open { color: #9ed18a; }
.status-badge.limited { color: #e5c158; }
.status-badge.full { color: #ba7770; }

.table-card h3 {
  margin: 1.2rem 0 0.5rem;
  color: #f7e7b9;
  font-family: 'Cinzel', Georgia, serif;
  font-size: 1.2rem;
}

.table-description {
  min-height: 3.2rem;
  margin: 0;
  color: #b9ad8c;
  font-size: 0.88rem;
  line-height: 1.55;
}

.table-details {
  display: flex;
  gap: 1rem;
  margin: 1.15rem 0;
  padding: 0.85rem 0;
  border-top: 1px solid rgba(212, 175, 55, 0.12);
  border-bottom: 1px solid rgba(212, 175, 55, 0.12);
}

.detail {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  min-width: 0;
}

.detail-icon {
  color: #d4af37;
  font-size: 1.15rem;
}

.detail div {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.detail small {
  color: #8e8468;
  font-size: 0.74rem;
}

.detail strong {
  overflow: hidden;
  color: #e5d9aa;
  font-size: 0.95rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.detail-meio {
  color: #b9ad8c;
  font-size: 0.82rem;
  font-weight: 400;
}

.card-footer {
  margin-top: auto;
}

.slots {
  color: #a8c994;
  font-size: 0.73rem;
  font-weight: 700;
}

.slots.unavailable {
  color: #c36b66;
}

.join-button {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.55rem 0.75rem;
  border: 1px solid rgba(212, 175, 55, 0.38);
  background: rgba(212, 175, 55, 0.12);
  color: #f0e68c;
  font-size: 0.75rem;
}

.join-button.disabled {
  border-color: rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.04);
  color: #77705d;
  cursor: not-allowed;
}

.interest-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.78);
}

.interest-modal {
  position: relative;
  width: min(100%, 520px);
  padding: 2rem;
  border: 1px solid rgba(212, 175, 55, 0.35);
  border-radius: 16px;
  background: linear-gradient(145deg, #17130e, #090909);
  box-shadow: 0 1.5rem 4rem rgba(0, 0, 0, 0.65);
}

.interest-modal h2 {
  margin: 0.55rem 0 0.8rem;
  color: #f0e68c;
  font-family: 'Cinzel', Georgia, serif;
  font-size: clamp(1.35rem, 3vw, 1.8rem);
}

.interest-modal p {
  margin: 0 0 1.25rem;
  color: #d9c88a;
  line-height: 1.6;
}

.interest-modal p strong {
  color: #f5e9d0;
}

.interest-modal-close {
  position: absolute;
  top: 0.8rem;
  right: 0.8rem;
  border: 0;
  background: transparent;
  color: #d9c88a;
  cursor: pointer;
  font-size: 1.1rem;
}

.interest-modal form {
  display: grid;
  gap: 0.55rem;
}

.interest-modal label {
  color: #f5e9d0;
  font-size: 0.85rem;
  font-weight: 700;
}

.interest-modal textarea {
  width: 100%;
  min-height: 8rem;
  padding: 0.8rem;
  border: 1px solid rgba(212, 175, 55, 0.25);
  border-radius: 8px;
  outline: none;
  resize: vertical;
  background: rgba(0, 0, 0, 0.45);
  color: #f5e9d0;
  font: inherit;
}

.interest-modal textarea:focus {
  border-color: rgba(240, 230, 140, 0.75);
  box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.12);
}

.interest-submit {
  margin-top: 0.45rem;
  padding: 0.75rem 1rem;
  border: 0;
  border-radius: 8px;
  background: linear-gradient(135deg, #d4af37, #f0e68c);
  color: #080808;
  cursor: pointer;
  font-weight: 700;
}

.interest-submit:hover {
  box-shadow: 0 8px 20px rgba(212, 175, 55, 0.25);
  transform: translateY(-1px);
}

.interest-success {
  padding: 1rem;
  border: 1px solid rgba(142, 231, 165, 0.25);
  border-radius: 8px;
  background: rgba(142, 231, 165, 0.08);
  color: #8ee7a5;
}

@media (max-width: 800px) {
  .search-page {
    padding: 2.3rem 1rem 3rem;
  }

  .search-hero {
    align-items: flex-start;
  }

  .hero-emblem {
    width: 4rem;
    height: 4rem;
    font-size: 1.8rem;
  }

  .search-form {
    grid-template-columns: 1fr 1fr;
  }

  .search-query-field,
  .search-mode {
    grid-column: span 2;
  }

  .search-submit {
    grid-column: span 1;
  }

  .clear-button {
    grid-column: span 1;
  }
}

@media (max-width: 560px) {
  .search-hero {
    gap: 1rem;
  }

  .hero-emblem {
    display: none;
  }

  .search-form,
  .tables-grid {
    grid-template-columns: 1fr;
  }

  .search-submit,
  .clear-button {
    width: 100%;
  }

  .results-heading {
    align-items: flex-start;
    flex-direction: column;
  }

  .table-card {
    min-height: 0;
  }

  .table-details {
    flex-wrap: wrap;
  }

  .card-footer {
    align-items: flex-start;
    flex-direction: column;
  }

  .join-button {
    width: 100%;
    justify-content: center;
  }
}
</style>
