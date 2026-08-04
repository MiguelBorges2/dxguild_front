<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {  onMounted, onUnmounted } from 'vue';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import {useAuthStore} from '@/stores/auth.js'
import api from '../services/api.js'
const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()
const stompClient = ref(null);
const mestre = ref(false)
const mesaInfo = ref({
  id: route.params.id,
  nome: 'Mesa da Guilda',
  sistema: 'D&D 5e',
  meio: 'Online',
  mestre: 'Caio',
  descricao: 'Reino em guerra, segredos antigos e decisões que mudam o destino do grupo.',
  imagem: '',
  vaga: true
})

const mesa = computed(() => ({
  id: mesaInfo.value.id || route.params.id,
  nome: mesaInfo.value.nome,
  sistema: mesaInfo.value.sistema,
  meio: mesaInfo.value.meio,
  mestre: mesaInfo.value.mestre,
  descricao: mesaInfo.value.descricao,
  imagem: mesaInfo.value.imagem,
  vaga: mesaInfo.value.vaga
}))

const mensagens = ref([])
const jogadores = ref([
  { nome: 'Ana', papel: 'Jogadora' },
  { nome: 'Bruno', papel: 'Jogador' }
])
const novoJogador = ref('')
const fichaLiberada = ref(false)
const jogadorFicha = ref('')
const avisoMestre = ref('')
const activeMasterTab = ref('players')
const arquivosMesa = ref([
  { nome: 'Mapa da cidade', tipo: 'Mapa' },
  { nome: 'Mapa do templo', tipo: 'Mapa' }
])

const isMasterFlag = (value) => value === true || value === 'true' || value === 1 || value === '1'

function adicionarJogador() {
  const nome = novoJogador.value.trim()
  if (!nome) return

  jogadores.value.push({ nome, papel: 'Jogador' })
  avisoMestre.value = `Jogador ${nome} adicionado à mesa.`
  novoJogador.value = ''
}

function liberarFicha(jogador = jogadorFicha.value) {
  const nome = jogador?.trim?.() || ''
  if (!nome) {
    avisoMestre.value = 'Selecione um jogador para liberar a ficha.'
    return
  }

  fichaLiberada.value = true
  jogadorFicha.value = nome
  avisoMestre.value = `A ficha foi liberada para ${nome}.`
}

function recolherFicha() {
  fichaLiberada.value = false
  jogadorFicha.value = ''
  avisoMestre.value = 'A ficha foi recolhida e ficou restrita ao mestre.'
}

function adicionarArquivo(event) {
  const arquivo = event.target.files?.[0]
  if (!arquivo) return

  arquivosMesa.value.push({ nome: arquivo.name, tipo: 'Arquivo' })
  avisoMestre.value = `Arquivo ${arquivo.name} adicionado à mesa.`
  event.target.value = ''
}
onUnmounted(() => {

  if (stompClient.value) {
    stompClient.value.deactivate();
  }
});

const enviarMensagem = () => {
  // Valida se a mensagem não está vazia e se o cliente está conectado
  if (!mensagem.value.trim() || !stompClient.value.connected) return;
    
  stompClient.value.publish({
   
    destination: `/app/mesas/${route.params.id}`, 
    body: JSON.stringify({
      input: mensagem.value,
      jogador: authStore.getUser(), // Obtém o nome do usuário do store
      imagem: authStore.getImagem() // Obtém a imagem do usuário do store

    })
  });

  mensagem.value = '';
};
onMounted(async () => {
    try {
        const nomeMesa = encodeURIComponent(route.params.nome || route.params.id || '')
        const res = await api.get(`http://localhost:8080/dxguild/mesa/${nomeMesa}`)
        const dadosMesa = res.data || {}
        const usuarioAtual = authStore.getUser()
        const criadorMesa = dadosMesa.criador || dadosMesa.mestre || dadosMesa.nomeCriador || dadosMesa.createdBy || ''

        mestre.value = Boolean(
          dadosMesa.mestre === true ||
          dadosMesa.mestre === 'true' ||
          dadosMesa.mestre === 1 ||
          dadosMesa.mestre === '1' ||
          criadorMesa === usuarioAtual
        )

        mesaInfo.value = {
          id: dadosMesa.id || route.params.id,
          nome: dadosMesa.nome || 'Mesa da Guilda',
          sistema: dadosMesa.sistema || 'D&D 5e',
          meio: dadosMesa.meio || 'Online',
          mestre: dadosMesa.criador || dadosMesa.mestreNome || 'Mestre',
          descricao: dadosMesa.descricao || 'Reino em guerra, segredos antigos e decisões que mudam o destino do grupo.',
          imagem: dadosMesa.imagem || dadosMesa.image || '',
          vaga: dadosMesa.vaga !== false
        }

        console.log('Dados da mesa:', dadosMesa, 'mestre:', mestre.value)

    } catch (error) {
        console.error('Erro ao verificar se o usuário é mestre:', error);
    }
    const socket = new SockJS('http://localhost:8080/dx-rpg');

    stompClient.value = new Client({
        webSocketFactory: () => socket,
        onConnect: () => {
            console.log('Conectado ao WebSocket!');
            console.log(route.params.id)
            stompClient.value.subscribe(`/topic/mesa/${route.params.id}`, (mensagemRecebida) => {
                const dados = JSON.parse(mensagemRecebida.body);
                mensagens.value.push(dados);
                console.log(mensagens.value)
            });
        },
        onStompError: (frame) => {
            console.error('Erro no STOMP: ' + frame.headers['message']);
        }
    });

    stompClient.value.activate();
});
const mensagem = ref('')
const painelMobile = ref(null)
const painelMobileAberto = ref(false)

const chatBackgroundStyle = computed(() => ({
  backgroundImage: mesa.value.imagem ? `url(${mesa.value.imagem})` : 'none',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat'
}))

function abrirPainelMobile(painel) {
  painelMobile.value = painel
  painelMobileAberto.value = true
}

function fecharPainelMobile() {
  painelMobileAberto.value = false
  painelMobile.value = null
}


</script>

<template>
  <div class="mesa-page">
    <header class="mesa-header">
      <div class="header-info">
        <div class="header-badges">
          <span class="status-pill">{{ mestre ? 'Mesa do Mestre' : 'Mesa em andamento' }}</span>
          <span class="status-pill subtle">{{ mesa.meio }}</span>
          <span v-if="mesa.vaga" class="status-pill subtle">Vaga disponível</span>
        </div>
        <p class="eyebrow">Mesa #{{ mesa.id }}</p>
        <h1 class="break">{{ mesa.nome }}</h1>
        <p class="meta">{{ mesa.sistema }} • {{ mesa.meio }} • Mestre {{ mesa.mestre }}</p>
      </div>
      <div v-if="mesa.imagem" class="header-image-wrap">
        <img :src="mesa.imagem" alt="Imagem da mesa" class="header-image" />
      </div>
      <button class="ghost-btn" @click="router.back()">Voltar</button>
    </header>

    <div class="mesa-layout">
      <div class="mobile-actions">
        <button class="mobile-action-btn" @click="abrirPainelMobile('files')">Arquivos</button>
        <button class="mobile-action-btn" @click="abrirPainelMobile('participants')">Participantes</button>
      </div>

      <aside class="sidebar">
        <section class="panel">
          <div class="panel-title">Sobre a mesa</div>
          <p class="panel-description">{{ mesa.descricao }}</p>
          <div class="meta-row">
            <span class="meta-chip">Sistema: {{ mesa.sistema }}</span>
            <span class="meta-chip">Meio: {{ mesa.meio }}</span>
            <span class="meta-chip">Criador: {{ mesa.mestre }}</span>
          </div>
        </section>

        <section class="panel">
          <div class="panel-title">Arquivos</div>
          <div class="folder-group">
            <div class="folder">🗂️ Mapas</div>
            <ul>
              <li>Mapa da cidade</li>
              <li>Mapa do templo</li>
            </ul>
          </div>
          <div class="folder-group">
            <div class="folder">🗂️ Fichas</div>
            <ul>
              <li>Ficha do Arthur</li>
              <li>Ficha da Lysa</li>
            </ul>
          </div>
        </section>

        <section v-if="mestre" class="panel master-panel">
          <div class="panel-title">Painel do Mestre</div>
          <p class="panel-subtitle">Gerencie jogadores, fichas e arquivos da mesa.</p>

          <div class="master-tabs">
            <button class="master-tab" :class="{ active: activeMasterTab === 'players' }" @click="activeMasterTab = 'players'">Jogadores</button>
            <button class="master-tab" :class="{ active: activeMasterTab === 'files' }" @click="activeMasterTab = 'files'">Arquivos</button>
          </div>

          <div v-if="activeMasterTab === 'players'" class="master-controls">
            <label class="master-label" for="player-name">Adicionar jogador</label>
            <div class="input-row">
              <input id="player-name" v-model="novoJogador" type="text" placeholder="Nome do jogador" @keyup.enter="adicionarJogador" />
              <button type="button" class="small-btn" @click="adicionarJogador">Add</button>
            </div>

            <div class="players-box">
              <div class="players-box-title">Jogadores na mesa</div>
              <ul class="players-list">
                <li v-for="jogador in jogadores" :key="jogador.nome">
                  <span>{{ jogador.nome }} — {{ jogador.papel }}</span>
                  <button type="button" class="link-btn" @click="liberarFicha(jogador.nome)">
                    {{ jogadorFicha === jogador.nome && fichaLiberada ? 'Liberada' : 'Liberar ficha' }}
                  </button>
                </li>
              </ul>
            </div>

            <div class="select-row">
              <select v-model="jogadorFicha" class="player-select">
                <option value="">Selecione um jogador</option>
                <option v-for="jogador in jogadores" :key="jogador.nome" :value="jogador.nome">
                  {{ jogador.nome }}
                </option>
              </select>
              <button type="button" class="small-btn" @click="liberarFicha(jogadorFicha)">Liberar</button>
            </div>

            <button v-if="fichaLiberada" type="button" class="master-action-btn secondary" @click="recolherFicha">
              Recolher ficha
            </button>

            <p class="helper-text">{{ avisoMestre || (fichaLiberada ? `A ficha está liberada para ${jogadorFicha}.` : 'Selecione um jogador para liberar a ficha.') }}</p>
          </div>

          <div v-else class="master-controls">
            <label class="master-label" for="file-upload">Adicionar mapa ou arquivo</label>
            <input id="file-upload" type="file" @change="adicionarArquivo" />

            <div class="players-box">
              <div class="players-box-title">Arquivos da mesa</div>
              <ul class="players-list">
                <li v-for="arquivo in arquivosMesa" :key="arquivo.nome">
                  <span>{{ arquivo.nome }}</span>
                  <span class="file-pill">{{ arquivo.tipo }}</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section class="panel">
          <div class="panel-title">Participantes</div>
          <ul class="members-list">
            <li>Caio — Mestre</li>
            <li v-for="jogador in jogadores" :key="jogador.nome">{{ jogador.nome }} — {{ jogador.papel }}</li>
          </ul>
        </section>
      </aside>

      <div v-if="painelMobileAberto" class="mobile-panel-overlay " @click.self="fecharPainelMobile">
        <div class="mobile-panel-sheet">
          <div class="mobile-panel-header ">
            <h3>{{ painelMobile === 'files' ? 'Arquivos' : 'Participantes' }}</h3>
            <button class="ghost-btn" @click="fecharPainelMobile">✕</button>
          </div>

          <div v-if="painelMobile === 'files'" class="mobile-panel-content">
            <div class="folder-group">
              <div class="folder">🗂️ Mapas</div>
              <ul>
                <li>Mapa da cidade</li>
                <li>Mapa do templo</li>
              </ul>
            </div>
            <div class="folder-group">
              <div class="folder">🗂️ Fichas</div>
              <ul>
                <li>Ficha do Arthur</li>
                <li>Ficha da Lysa</li>
              </ul>
            </div>
          </div>

          <div v-else class="mobile-panel-content">
            <div v-if="mestre" class="master-controls">
              <div class="master-tabs">
                <button class="master-tab" :class="{ active: activeMasterTab === 'players' }" @click="activeMasterTab = 'players'">Jogadores</button>
                <button class="master-tab" :class="{ active: activeMasterTab === 'files' }" @click="activeMasterTab = 'files'">Arquivos</button>
              </div>

              <div v-if="activeMasterTab === 'players'">
                <label class="master-label" for="mobile-player-name">Adicionar jogador</label>
                <div class="input-row">
                  <input id="mobile-player-name" v-model="novoJogador" type="text" placeholder="Nome do jogador" @keyup.enter="adicionarJogador" />
                  <button type="button" class="small-btn" @click="adicionarJogador">Add</button>
                </div>

                <div class="players-box">
                  <div class="players-box-title">Jogadores na mesa</div>
                  <ul class="players-list">
                    <li v-for="jogador in jogadores" :key="jogador.nome">
                      <span>{{ jogador.nome }} — {{ jogador.papel }}</span>
                      <button type="button" class="link-btn" @click="liberarFicha(jogador.nome)">
                        {{ jogadorFicha === jogador.nome && fichaLiberada ? 'Liberada' : 'Liberar ficha' }}
                      </button>
                    </li>
                  </ul>
                </div>

                <div class="select-row">
                  <select v-model="jogadorFicha" class="player-select">
                    <option value="">Selecione um jogador</option>
                    <option v-for="jogador in jogadores" :key="jogador.nome" :value="jogador.nome">
                      {{ jogador.nome }}
                    </option>
                  </select>
                  <button type="button" class="small-btn" @click="liberarFicha(jogadorFicha)">Liberar</button>
                </div>

                <button v-if="fichaLiberada" type="button" class="master-action-btn secondary" @click="recolherFicha">
                  Recolher ficha
                </button>
              </div>

              <div v-else>
                <label class="master-label" for="mobile-file-upload">Adicionar mapa ou arquivo</label>
                <input id="mobile-file-upload" type="file" @change="adicionarArquivo" />

                <div class="players-box">
                  <div class="players-box-title">Arquivos da mesa</div>
                  <ul class="players-list">
                    <li v-for="arquivo in arquivosMesa" :key="arquivo.nome">
                      <span>{{ arquivo.nome }}</span>
                      <span class="file-pill">{{ arquivo.tipo }}</span>
                    </li>
                  </ul>
                </div>
              </div>

              <p class="helper-text">{{ avisoMestre || (fichaLiberada ? 'A ficha já está liberada para o grupo.' : 'As fichas permanecem restritas até você liberar.') }}</p>
            </div>

            <ul class="members-list">
              <li>Caio — Mestre</li>
              <li v-for="jogador in jogadores" :key="jogador.nome">{{ jogador.nome }} — {{ jogador.papel }}</li>
            </ul>
          </div>
        </div>
      </div>

      <section class="chat-panel">
        <div class="messages">
          <div class="messages-backdrop" :style="chatBackgroundStyle"></div>
          <div class="messages-content">
            <div v-for="msg in mensagens" :key="msg.id" class="message-item d-flex justify-content-start align-items-center">
              <img :src="msg.image" alt="Avatar" class="rounded-circle me-2" width="40" height="40">
              <div>
                <div class="message-head">
                  <strong>{{ msg.criador }}</strong>
                  <span>{{ new Date(msg.dataEnvio).toLocaleTimeString() }}</span>
                </div>
                <p class="break">{{ msg.message }}</p>
              </div>
            </div>
          </div>
        </div>
        <form class="composer" @submit.prevent="enviarMensagem">
          <input v-model="mensagem" type="text" placeholder="Escreva uma mensagem..." />
          <button type="submit">Enviar</button>
        </form>
      </section>
    </div>
  </div>
</template>

<style scoped>
.mesa-page {
  min-height: 100%;
  padding: 1.25rem;
  background:
    radial-gradient(circle at top left, rgba(212,175,55,0.15), transparent 28%),
    linear-gradient(135deg, #080808 0%, #121212 45%, #050505 100%);
  color: #f5e9d0;
}

.mesa-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  padding: 1.2rem 1.25rem;
  border-radius: 18px;
  margin-bottom: 1rem;
  background: linear-gradient(135deg, rgba(212,175,55,0.16), rgba(8,8,8,0.72));
  border: 1px solid rgba(212,175,55,0.24);
  box-shadow: 0 16px 40px rgba(0,0,0,0.35);
  backdrop-filter: blur(10px);
}

.header-info {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.header-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.header-image-wrap {
  width: 140px;
  min-width: 140px;
  height: 92px;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid rgba(212,175,55,0.24);
  box-shadow: 0 10px 24px rgba(0,0,0,0.2);
}

.header-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  padding: 0.3rem 0.6rem;
  border-radius: 999px;
  background: rgba(212,175,55,0.18);
  color: #f7e7b9;
  font-size: 0.76rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  border: 1px solid rgba(212,175,55,0.24);
}

.status-pill.subtle {
  background: rgba(255,255,255,0.06);
}

.eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.18em;
  color: #d9c88a;
  font-size: 0.78rem;
  margin-bottom: 0.25rem;
}

.mesa-header h1 {
  font-family: 'TheWildBreathOfZelda', serif;
  font-size: 1.8rem;
  color: #f7e7b9;
  margin-bottom: 0.3rem;
}

.meta {
  color: #d9c88a;
  font-size: 0.95rem;
  margin-bottom: 0.25rem;
}

.description {
  color: #cbbb80;
  max-width: 720px;
}

.ghost-btn {
  border: 1px solid rgba(212,175,55,0.3);
  background: rgba(255,255,255,0.04);
  color: #f7e7b9;
  padding: 0.7rem 0.95rem;
  border-radius: 999px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.ghost-btn:hover {
  transform: translateY(-1px);
  border-color: rgba(212,175,55,0.6);
  box-shadow: 0 8px 20px rgba(212,175,55,0.16);
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.mesa-layout {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 1rem;
  max-width: 100vw !important;  
}

.sidebar {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.panel {
  background: linear-gradient(180deg, rgba(18,18,18,0.96), rgba(9,9,9,0.96));
  border: 1px solid rgba(212,175,55,0.16);
  border-radius: 16px;
  padding: 1rem;
  box-shadow: 0 10px 24px rgba(0,0,0,0.28);
  animation: fadeInUp 0.35s ease both;
  backdrop-filter: blur(8px);
}

.panel-title {
  font-family: 'Cinzel', serif;
  color: #f0e6b8;
  margin-bottom: 0.7rem;
}

.master-panel {
  background: linear-gradient(135deg, rgba(212,175,55,0.16), rgba(10,10,10,0.92));
  border: 1px solid rgba(212,175,55,0.24);
}

.panel-subtitle {
  color: #cdbf90;
  font-size: 0.9rem;
  margin-bottom: 0.7rem;
  line-height: 1.4;
}

.panel-description {
  color: #e3d6b0;
  font-size: 0.95rem;
  line-height: 1.5;
  margin-bottom: 0.7rem;
}

.meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.meta-chip {
  display: inline-flex;
  align-items: center;
  padding: 0.3rem 0.55rem;
  border-radius: 999px;
  background: rgba(212,175,55,0.12);
  color: #f7e7b9;
  font-size: 0.78rem;
  border: 1px solid rgba(212,175,55,0.18);
}

.master-controls {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
}

.master-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.3rem;
}

.master-tab {
  flex: 1;
  border: 1px solid rgba(212,175,55,0.2);
  border-radius: 999px;
  background: rgba(255,255,255,0.03);
  color: #cdbf90;
  padding: 0.45rem 0.6rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.master-tab.active {
  background: linear-gradient(135deg, #d4af37, #f0e68c);
  color: #000;
  font-weight: 700;
}

.master-label {
  color: #f7e7b9;
  font-size: 0.95rem;
  font-weight: 600;
}

.input-row {
  display: flex;
  gap: 0.5rem;
}

.input-row input {
  flex: 1;
  padding: 0.7rem 0.75rem;
  border-radius: 8px;
  border: 1px solid rgba(212,175,55,0.25);
  background: rgba(0,0,0,0.45);
  color: #f5e9d0;
}

.small-btn,
.master-action-btn {
  border: none;
  border-radius: 8px;
  padding: 0.7rem 0.85rem;
  background: linear-gradient(135deg, #d4af37, #f0e68c);
  color: #000;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.small-btn:hover,
.master-action-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 18px rgba(212,175,55,0.22);
}

.master-action-btn.secondary {
  background: rgba(255,255,255,0.06);
  color: #f7e7b9;
  border: 1px solid rgba(212,175,55,0.2);
}

.select-row {
  display: flex;
  gap: 0.5rem;
}

.player-select {
  flex: 1;
  padding: 0.7rem 0.75rem;
  border-radius: 8px;
  border: 1px solid rgba(212,175,55,0.25);
  background: rgba(0,0,0,0.45);
  color: #f5e9d0;
}

.master-action-btn {
  width: 100%;
}

.players-box {
  border: 1px solid rgba(212,175,55,0.14);
  border-radius: 12px;
  padding: 0.7rem;
  background: rgba(255,255,255,0.04);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.03);
}

.players-box-title {
  font-size: 0.85rem;
  font-weight: 700;
  color: #f0e6b8;
  margin-bottom: 0.4rem;
}

.players-list {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.players-list li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.6rem;
  border-radius: 10px;
  background: linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02));
  color: #e3d6b0;
  border: 1px solid rgba(255,255,255,0.04);
}

.link-btn {
  border: none;
  background: transparent;
  color: #d4af37;
  cursor: pointer;
  font-weight: 700;
  padding: 0;
}

.file-pill {
  font-size: 0.78rem;
  color: #d4af37;
  font-weight: 700;
}

.helper-text {
  color: #dccb86;
  font-size: 0.84rem;
  margin: 0;
}

.folder-group {
  margin-bottom: 0.75rem;
}

.folder {
  font-weight: 700;
  color: #d9c88a;
  margin-bottom: 0.25rem;
}

ul {
  list-style: none;
  padding-left: 0.25rem;
  color: #cdbf90;
}

li {
  margin-bottom: 0.3rem;
}

.chat-panel {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-height: 560px;
}

.messages {
  flex: 1;
  position: relative;
  background: linear-gradient(180deg, rgba(18,18,18,0.96), rgba(8,8,8,0.98));
  border: 1px solid rgba(212,175,55,0.16);
  border-radius: 16px;
  width: 100% !important;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.04);
  overflow: hidden;
}

.messages-backdrop {
  position: absolute;
  inset: 0;
  opacity: 0.22;
  filter: blur(2px) saturate(1.1);
  transform: scale(1.03);
  pointer-events: none;
}

.messages::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(0,0,0,0.22), rgba(0,0,0,0.52));
  pointer-events: none;
}

.messages-content {
  position: relative;
  z-index: 1;
  height: 100%;
  overflow-y: auto;
}

.message-item {
  position: relative;
  z-index: 1;
}
    
.message-item {
  padding: 0.85rem 0.9rem;
  border-bottom: 1px solid rgba(212,175,55,0.08);
  transition: background 0.2s ease;
  position: relative;
  z-index: 1;
}

.message-item:hover {
  background: rgba(212,175,55,0.04);
  transform: translateX(2px);
}

.message-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.25rem;
  color: #f7e7b9;
}

.message-head span {
  color: #9a8b4f;
  font-size: 0.8rem;
}

.message-item p {
  color: #e3d6b0;
  line-height: 1.45;
}

.composer {
  display: flex;
  gap: 0.5rem;
  padding: 0.45rem;
  border-radius: 999px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(212,175,55,0.16);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.03);
}

.composer input {
  padding: 0.85rem 0.95rem;
  border-radius: 999px;
  border: 1px solid rgba(212,175,55,0.2);
  background: rgba(0,0,0,0.45);
  color: #f5e9d0;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.04);
  width: 100%;
}

.composer button {
  padding: 0.8rem 1rem;
  border: none;
  border-radius: 999px;
  background: linear-gradient(135deg, #d4af37, #f0e68c);
  color: #000;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 10px 24px rgba(212,175,55,0.18);
  transition: transform 0.2s ease;
}

.composer button:hover {
  transform: translateY(-1px);
  box-shadow: 0 12px 24px rgba(212,175,55,0.24);
}
.break {
  line-break: anywhere;
}
@media (max-width: 900px) {
  .mesa-page {
    padding: 0.8rem;
  }

  .mesa-header {
    flex-direction: column;
    align-items: flex-start;
    padding: 0.85rem;
    margin-bottom: 0.75rem;
  }

  .header-info {
    width: 100%;
  }

  .ghost-btn {
    align-self: flex-end;
  }

  .mesa-layout {
    grid-template-columns: 1fr;
    max-width: 100%;
  }

  .sidebar {
    display: none;
  }

  .mobile-actions {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
    
  }

  .mobile-action-btn {
    flex: 1;
    width:80%;
    padding: 0.8rem 0rem;
    border-radius: 999px;
    border: 1px solid rgba(212,175,55,0.25);
    background: linear-gradient(180deg, rgba(212,175,55,0.12), rgba(0,0,0,0.2));
    color: #f7e7b9;
    font-weight: 700;
    cursor: pointer;
  
  }

  .chat-panel {
    min-height: 70vh;
    
  }

  .mobile-panel-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.86);
    z-index: 1200;
    display: flex;
    align-items: stretch;
    justify-content: center;
    padding: 0;
  }

  .mobile-panel-sheet {
    width: 100%;
    max-width: 100%;
    height: 100%;
    background: linear-gradient(180deg, rgba(18,18,18,0.98), rgba(5,5,5,0.98));
    border-left: 1px solid rgba(212,175,55,0.18);
    border-right: 1px solid rgba(212,175,55,0.18);
    padding: 1rem;
    overflow-y: auto;
  }

  .mobile-panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .mobile-panel-header h3 {
    color: #f0e6b8;
    font-family: 'Cinzel', serif;
  }

  .mobile-panel-content {
    color: #e3d6b0;
  }
}

@media (min-width: 901px) {
  .mobile-actions,
  .mobile-panel-overlay {
    display: none;
  }
}
</style>
