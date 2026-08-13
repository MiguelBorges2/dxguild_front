<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {  onMounted, onUnmounted } from 'vue';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import {useAuthStore} from '@/stores/auth.js'
import api from '../services/api.js'
import axios from 'axios'
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

])
const statusJogadores = ref(new Map())
const arquivoImagem = ref(null)
const novoJogador = ref('')
const fichaLiberada = ref(false)
const jogadorFicha = ref('')
const avisoMestre = ref('')
const activeMasterTab = ref('players')
const arquivosMesa = ref([
  { nome: 'Mapa da cidade', tipo: 'Mapa' },
  { nome: 'Mapa do templo', tipo: 'Mapa' }
])

async function adicionarJogador() {
  console.log('Adicionando jogador:', mesa.value.id)
    try{
      const res = await api.post(`http://localhost:8080/dxguild/mesa/usuario/adicionar`, {
        idMesa: mesa.value.id,
        nick: novoJogador.value

      })
    } catch (e) {
      console.error('Erro ao adicionar jogador:', e);
    }
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

const enviarMensagem = (type) => {
  // Valida se a mensagem não está vazia e se o cliente está conectado
  if (!mensagem.value.trim() || !stompClient.value.connected) return;
    
  stompClient.value.publish({
   
    destination: `/app/mesas/${route.params.nome}`, 
    body: JSON.stringify({
      input: mensagem.value,
      jogador: authStore.getUser(), // Obtém o nome do usuário do store
      imagem: authStore.getImagem(), // Obtém a imagem do usuário do store
      tipo: type   // Define o tipo da mensagem, padrão para 'texto'
    })
  });

  mensagem.value = '';
};
const handleFileUpload = (event) => {

  const target = event.target

  if (target.files && target.files[0]) {

    arquivoImagem.value = target.files[0]

    enviarImagem()
  }

}
const enviarParaCloudinary = async (file) => {
  try {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', 'dxguild')

    const cloudName = 'dwt6xjnmh'
    const cloudinaryRes = await axios.post(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      formData
    )

    // Retorna apenas a string da URL segura
    return cloudinaryRes.data.secure_url
  } catch (error) {
    console.error('Erro ao enviar imagem para o Cloudinary:', error)
    throw error
  }
}
const enviarImagem = async () => {
  try {
    let urlImagemFinal = null

    // Se o usuário selecionou uma imagem, faz o upload primeiro
    if (arquivoImagem.value) {
      urlImagemFinal = await enviarParaCloudinary(arquivoImagem.value)
    }

    // Monta o objeto para enviar ao seu backend (Spring Boot)
    stompClient.value.publish({
   
    destination: `/app/mesas/${route.params.nome}`, 
    body: JSON.stringify({
      input: urlImagemFinal,
      jogador: authStore.getUser(), // Obtém o nome do usuário do store
      imagem: authStore.getImagem(), // Obtém a imagem do usuário do store
      tipo: 'imagem'  // Define o tipo da mensagem, padrão para 'texto'
    })
  }); 

  mensagem.value = '';
  } catch (e) {
    console.error('Erro ao enviar mensagem:', e)
  }
}
onMounted(async () => {
    try {
        const nomeMesa = encodeURIComponent(route.params.nome || route.params.id || '')
        const res = await api.get(`http://localhost:8080/dxguild/mesa/${nomeMesa}`)
        const dadosMesa = res.data.mesa || {}
        const players = res.data.jogadores || []
        players.forEach(player => {
          statusJogadores.value.set(player.nome, false);
          jogadores.value.push(player);
        });
        statusJogadores.value.set(dadosMesa.criador, false);
        console.log('Status:', statusJogadores.value)
        
        console.log(dadosMesa)
        const usuarioAtual = authStore.getUser()
        const criadorMesa = dadosMesa.criador || dadosMesa.mestre || dadosMesa.nomeCriador || dadosMesa.createdBy || ''
        const chat = res.data.mensaagens || []
        const chatOrdenado = chat.sort((a, b) => new Date(a.dataEnvio) - new Date(b.dataEnvio));
        console.log(chatOrdenado)
        chatOrdenado.forEach(element => {
          mensagens.value.push(element);
        });
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
            stompClient.value.subscribe(`/topic/mesa/${route.params.nome}`, (mensagemRecebida) => {
                const dados = JSON.parse(mensagemRecebida.body);
                console.log("Mensagem recebida:", dados);
                if(dados.tipo === 'ping') {
                  const atinga = statusJogadores.value.get(dados.nick);
                  statusJogadores.value.set(dados.nick, dados.ping);
                  console.log("status parte 2", statusJogadores.value);
                  if(dados.nick != authStore.getUser() && dados.ping === true && atinga == false) {
                    
                    stompClient.value.publish({
                      destination: `/app/mesas/ping/${route.params.nome}`, 
                      body: JSON.stringify({
                        nick: authStore.getUser(), // Obtém o nome do usuário do store
                        ping: true,
                        tipo: 'ping'  // Define o tipo da mensagem, padrão para 'texto'
                      })
                    });
                  }
                  return;
                }
                mensagens.value.push(dados);
                console.log(mensagens.value)
            });
            stompClient.value.publish({
          
            destination: `/app/mesas/ping/${route.params.nome}`, 
            body: JSON.stringify({
          
              nick: authStore.getUser(), // Obtém o nome do usuário do store
              ping: true,
              tipo: 'ping'  // Define o tipo da mensagem, padrão para 'texto'
            })
          });
        },
        onStompError: (frame) => {
            console.error('Erro no STOMP: ' + frame.headers['message']);
        }
    });

    stompClient.value.activate();
    
    
});

const mensagem = ref('')
const dadosSelecionados = ref([])
const bonusRolagem = ref(0)
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

const participanteFoto = (participante) => participante?.foto || participante?.imagem || participante?.image || participante?.avatar || ''
const participanteOnline = (participante) => participante?.online === true || participante?.online === 'true' || participante?.status === 'online' || participante?.conectado === true
const iniciaisParticipante = (nome) => (nome || '?').split(' ').map((parte) => parte[0]).slice(0, 2).join('').toUpperCase()

function adicionarDado(lados) {
  dadosSelecionados.value.push(lados)
}

function removerDado(indice) {
  dadosSelecionados.value.splice(indice, 1)
}

function rolarDados() {
  if (!dadosSelecionados.value.length || !stompClient.value?.connected) return

  const resultados = dadosSelecionados.value.map((lados) => Math.floor(Math.random() * lados) + 1)
  const bonus = Number(bonusRolagem.value) || 0
  const total = resultados.reduce((soma, valor) => soma + valor, bonus)
  const detalhes = dadosSelecionados.value.map((lados, indice) => `d${lados} (${resultados[indice]})`).join(' + ')
  const resultadoRolagem = `${detalhes}${bonus ? ` ${bonus > 0 ? '+' : '-'} ${Math.abs(bonus)}` : ''} = ${total}`

  stompClient.value.publish({
    destination: `/app/mesas/${route.params.nome}`,
    body: JSON.stringify({ input: resultadoRolagem, jogador: authStore.getUser(), imagem: authStore.getImagem(), tipo: 'rolagem' })
  })

  dadosSelecionados.value = []
  bonusRolagem.value = 0
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
                  <li class="d-flex justify-content-center " v-for="jogador in jogadores" :key="jogador.nome">
                     <span>{{ jogador.nome }} - Player</span>
                  </li>
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
          <div class="members-list">
            <div class="member-card">
              <div class="member-avatar">
                <img v-if="mesa.imagem" :src="mesa.imagem" alt="Foto do mestre" />
                <span v-else>{{ iniciaisParticipante(mesa.mestre) }}</span>
              </div>
              <div class="member-info"><strong>{{ mesa.mestre }}</strong><span>Mestre</span></div>
              <span v-if="statusJogadores.get(mesa.mestre) === false" class="presence-dot" ></span>
              <span v-if="statusJogadores.get(mesa.mestre) === true" class="online" :class="online"></span>
            </div>
            <div v-for="jogador in jogadores" :key="jogador.nome" class="member-card">
              <div class="member-avatar">
                <img v-if="participanteFoto(jogador)" :src="participanteFoto(jogador)" :alt="`Foto de ${jogador.nome}`" />
                
              </div>
              <div class="member-info"><strong>{{ jogador.nome }}</strong><span>{{ jogador.papel || 'Player' }}</span></div>
              <span v-if="statusJogadores.get(jogador.nome) === false" class="presence-dot" ></span>
              <span v-if="statusJogadores.get(jogador.nome) === true" class="online"></span>
            </div>
          </div>
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
                      <li v-for="jogador in jogadores" :key="jogador.nome">
                      {{ jogador.nome }} — <span>player</span>
                    </li>
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

            <div class="members-list">
              <div class="member-card">
                <div class="member-avatar"><img v-if="mesa.imagem" :src="mesa.imagem" alt="Foto do mestre" /><span v-else>{{ iniciaisParticipante(mesa.mestre) }}</span></div>
                <div class="member-info"><strong>{{ mesa.mestre }}</strong><span>Mestre</span></div>
                <span v-if="statusJogadores.get(jogador.nome)" class="presence-dot" :class="online"></span>
              </div>
              <div v-for="jogador in jogadores" :key="jogador.nome" class="member-card">
                <div class="member-avatar"><img v-if="participanteFoto(jogador)" :src="participanteFoto(jogador)" :alt="`Foto de ${jogador.nome}`" /><span v-else>{{ iniciaisParticipante(jogador.nome) }}</span></div>
                <div class="member-info"><strong>{{ jogador.nome }}</strong><span>{{ jogador.papel || 'Player' }}</span></div>
                <span v-if="statusJogadores.get(jogador.nome)" class="presence-dot" :class="online"></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section class="chat-panel">
        <div class="messages">
          <div class="messages-backdrop" :style="chatBackgroundStyle"></div>
          <div class="messages-content">
            <div v-for="msg in mensagens" :key="msg.id" class="message-item d-flex justify-content-start align-items-center">
              <img :src="msg.image" alt="Avatar" class="rounded-circle me-2" width="40" height="40">
              <div class="w-100">
                <div class="message-head">
                  <strong>{{ msg.criador }}</strong>
                  <span>{{ new Date(msg.dataEnvio).toLocaleTimeString() }} : {{ new Date(msg.dataEnvio).toLocaleDateString() }}</span>
                </div>
                <p v-if="!msg.tipo || msg.tipo === 'texto'" class="break">{{ msg.message ?? msg.input ?? msg.mensagem }}</p>
                <img
                  v-else-if="msg.tipo === 'imagem'"
                  :src="msg.message ?? msg.input ?? msg.mensagem"
                  alt="Imagem enviada no chat"
                  class="message-image"
                />
                <div v-else-if="msg.tipo === 'rolagem'" class="roll-message">
                  <span class="roll-message-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24">
                      <path d="m12 2 8 5v10l-8 5-8-5V7l8-5Z" />
                      <circle cx="9" cy="9" r="1" />
                      <circle cx="15" cy="15" r="1" />
                      <circle cx="9" cy="15" r="1" />
                      <circle cx="15" cy="9" r="1" />
                    </svg>
                  </span>
                  <span class="break">{{ msg.message ?? msg.input ?? msg.mensagem }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <form class="composer" @submit.prevent="enviarMensagem('texto')">
          <label class="composer-icon-btn" for="chat-image" title="Selecionar imagem">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <rect x="3" y="4" width="18" height="16" rx="2" />
              <circle cx="8.5" cy="9" r="1.5" />
              <path d="m4 17 5-5 3.5 3.5 2.5-2.5 5 5" />
            </svg>
            <span class="sr-only">Selecionar imagem</span>
          </label>
          <input id="chat-image" class="chat-image-input" type="file" accept="image/*" @change="handleFileUpload"/>

          <div class="dice-picker">
            <button type="button" class="composer-icon-btn dice-trigger" title="Selecionar dado" aria-label="Selecionar dado">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="m12 2 8 5v10l-8 5-8-5V7l8-5Z" />
                <circle cx="9" cy="9" r="1" />
                <circle cx="15" cy="15" r="1" />
                <circle cx="9" cy="15" r="1" />
                <circle cx="15" cy="9" r="1" />
              </svg>
            </button>
            <div v-if="dadosSelecionados.length" class="roll-builder" aria-label="Dados selecionados">
              <div class="roll-builder-title">Rolagem</div>
              <div class="selected-dice">
                <button v-for="(lados, indice) in dadosSelecionados" :key="`${lados}-${indice}`" type="button" class="selected-die" :title="`Remover d${lados}`" @click="removerDado(indice)">
                  {{ lados }} <span aria-hidden="true">×</span>
                </button>
              </div>
              <label class="roll-bonus">Bônus <input v-model.number="bonusRolagem" type="number" step="1" aria-label="Bônus da rolagem" /></label>
              <button type="button" class="roll-button" @click="rolarDados">Rolar</button>
            </div>
            <div class="dice-menu" role="menu" aria-label="Escolher dado">
              <button type="button" class="dice-option" role="menuitem" @click="adicionarDado(4)"><span class="dice-shape d4">△</span>d4</button>
              <button type="button" class="dice-option" role="menuitem" @click="adicionarDado(6)"><span class="dice-shape d6">⬡</span>d6</button>
              <button type="button" class="dice-option" role="menuitem" @click="adicionarDado(8)"><span class="dice-shape d8">◆</span>d8</button>
              <button type="button" class="dice-option" role="menuitem" @click="adicionarDado(10)"><span class="dice-shape d10">⬟</span>d10</button>
              <button type="button" class="dice-option" role="menuitem" @click="adicionarDado(100)"><span class="dice-shape d100">◈</span>d100</button>
            </div>
          </div>
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

.members-list {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.member-card {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  min-width: 0;
  padding: 0.35rem 0.45rem;
  border: 1px solid rgba(212,175,55,0.12);
  border-radius: 12px;
  background: rgba(255,255,255,0.035);
}

.member-avatar {
  display: grid;
  flex: 0 0 auto;
  place-items: center;
  width: 1.9rem;
  height: 1.9rem;
  overflow: hidden;
  border: 1px solid rgba(212,175,55,0.3);
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(212,175,55,0.3), rgba(40,40,40,0.9));
  color: #f7e7b9;
  font-size: 0.62rem;
  font-weight: 800;
}

.member-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.member-info {
  display: flex;
  flex: 1 1 auto;
  min-width: 0;
  flex-direction: column;
  gap: 0.08rem;
}

.member-info strong,
.member-info span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.member-info strong {
  color: #f7e7b9;
  font-size: 0.78rem;
}

.member-info span {
  color: #b9aa76;
  font-size: 0.66rem;
  text-transform: capitalize;
}

.presence-dot {
  width: 0.52rem;
  height: 0.52rem;
  flex: 0 0 auto;
  border: 2px solid rgba(0,0,0,0.35);
  border-radius: 50%;
  background: #777;
  box-shadow: 0 0 0 2px rgba(119,119,119,0.12);
}

.online {
   width: 0.52rem;
  height: 0.52rem;
  flex: 0 0 auto;
  border: 2px solid rgba(0,0,0,0.35);
  border-radius: 50%;
  background: #777;
  box-shadow: 0 0 0 2px rgba(119,119,119,0.12);
  background: #39d477;
  box-shadow: 0 0 0 2px rgba(57,212,119,0.16), 0 0 10px rgba(57,212,119,0.55);
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
  width: 100%;
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

.message-image {
  display: block;
  width: min(100%, 360px);
  height: 220px;
  max-width: 100%;
  margin-top: 0.35rem;
  border: 1px solid rgba(212,175,55,0.24);
  border-radius: 10px;
  object-fit: cover;
  background: rgba(0,0,0,0.3);
}

.roll-message {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  max-width: 100%;
  padding: 0.55rem 0.75rem;
  border: 1px solid rgba(212,175,55,0.32);
  border-radius: 10px;
  background: linear-gradient(135deg, rgba(212,175,55,0.18), rgba(0,0,0,0.24));
  color: #f7e7b9;
  font-weight: 700;
}

.roll-message-icon {
  display: inline-grid;
  flex: 0 0 auto;
  place-items: center;
  width: 1.6rem;
  height: 1.6rem;
  color: #f0e68c;
}

.roll-message-icon svg {
  width: 100%;
  height: 100%;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.7;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.composer {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.45rem;
  border-radius: 999px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(212,175,55,0.16);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.03);
}

.composer > input:not(.chat-image-input) {
  padding: 0.85rem 0.95rem;
  border-radius: 999px;
  border: 1px solid rgba(212,175,55,0.2);
  background: rgba(0,0,0,0.45);
  color: #f5e9d0;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.04);
  width: 100%;
}

.composer-icon-btn {
  flex: 0 0 auto;
  display: inline-grid;
  place-items: center;
  width: 2.85rem;
  height: 2.85rem;
  padding: 0;
  border: 1px solid rgba(212,175,55,0.24);
  border-radius: 50%;
  background: rgba(0,0,0,0.32);
  color: #f0e68c;
  cursor: pointer;
  transition: all 0.2s ease;
}

.composer-icon-btn:hover,
.dice-picker:focus-within .dice-trigger {
  border-color: rgba(240,230,140,0.7);
  background: rgba(212,175,55,0.14);
  box-shadow: 0 0 16px rgba(212,175,55,0.18);
}

.composer-icon-btn svg {
  width: 1.25rem;
  height: 1.25rem;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.7;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.composer .chat-image-input {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.dice-picker {
  position: relative;
  flex: 0 0 auto;
}

.roll-builder {
  position: absolute;
  z-index: 6;
  right: 0;
  bottom: calc(100% + 5.65rem);
  width: 15.5rem;
  padding: 0.7rem;
  border: 1px solid rgba(212,175,55,0.34);
  border-radius: 12px;
  background: rgba(12,12,12,0.98);
  box-shadow: 0 12px 30px rgba(0,0,0,0.48);
}

.roll-builder-title {
  margin-bottom: 0.5rem;
  color: #f0e68c;
  font-family: 'Cinzel', serif;
  font-size: 0.82rem;
  font-weight: 700;
}

.selected-dice {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-bottom: 0.6rem;
}

.selected-die {
  padding: 0.28rem 0.45rem;
  border: 1px solid rgba(212,175,55,0.28);
  border-radius: 999px;
  background: rgba(212,175,55,0.12);
  color: #f7e7b9;
  font-size: 0.76rem;
  font-weight: 700;
  cursor: pointer;
}

.selected-die:hover {
  border-color: rgba(240,230,140,0.7);
  background: rgba(212,175,55,0.22);
}

.selected-die span {
  margin-left: 0.2rem;
  color: #f0e68c;
}

.roll-bonus {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
  margin-bottom: 0.55rem;
  color: #cdbf90;
  font-size: 0.78rem;
  font-weight: 700;
}

.roll-bonus input {
  width: 4.25rem;
  padding: 0.35rem 0.45rem;
  border: 1px solid rgba(212,175,55,0.28);
  border-radius: 7px;
  background: rgba(0,0,0,0.38);
  color: #f7e7b9;
  text-align: center;
}

.roll-button {
  width: 100%;
  padding: 0.48rem 0.6rem;
  border: 0;
  border-radius: 8px;
  background: linear-gradient(135deg, #d4af37, #f0e68c);
  color: #000;
  font-weight: 800;
  cursor: pointer;
}

.roll-button:hover {
  box-shadow: 0 6px 16px rgba(212,175,55,0.24);
}

.dice-menu {
  position: absolute;
  z-index: 5;
  right: 0;
  bottom: calc(100% + 0.65rem);
  display: grid;
  grid-template-columns: repeat(5, minmax(3.4rem, 1fr));
  gap: 0.35rem;
  width: max-content;
  padding: 0.45rem;
  border: 1px solid rgba(212,175,55,0.28);
  border-radius: 12px;
  background: rgba(12,12,12,0.98);
  box-shadow: 0 12px 30px rgba(0,0,0,0.48);
  opacity: 0;
  pointer-events: none;
  transform: translateY(0.35rem);
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.dice-picker:hover .dice-menu,
.dice-picker:focus-within .dice-menu {
  opacity: 1;
  pointer-events: auto;
  transform: translateY(0);
}

.dice-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.1rem;
  min-width: 3.4rem;
  padding: 0.38rem 0.3rem;
  border: 1px solid transparent;
  border-radius: 8px;
  background: transparent;
  color: #e3d6b0;
  font-size: 0.76rem;
  font-weight: 700;
  cursor: pointer;
}

.dice-option:hover,
.dice-option:focus-visible {
  border-color: rgba(212,175,55,0.34);
  background: rgba(212,175,55,0.13);
  outline: none;
}

.dice-shape {
  color: #f0e68c;
  font-size: 1.3rem;
  line-height: 1;
}

.d4 { transform: scaleX(1.12); }
.d10 { transform: scaleY(1.12); }
.d100 { font-size: 1.45rem; }

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.composer > button {
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

.composer > button:hover {
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
  .mesa-page {
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    height: 100dvh;
    overflow: hidden;
  }

  .mesa-header {
    flex: 0 0 auto;
  }

  .mesa-layout {
    flex: 1 1 auto;
    min-height: 0;
  }

  .sidebar {
    min-height: 0;
    overflow-y: auto;
    padding-right: 0.25rem;
  }

  .chat-panel {
    min-height: 0;
  }

  .messages {
    min-height: 0;
  }

  .mobile-actions,
  .mobile-panel-overlay {
    display: none;
  }
}
</style>
