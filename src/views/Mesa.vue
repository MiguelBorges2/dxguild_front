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
const podeVer = ref([])
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

function ModalArquivoAberto() {
  modalArquivo.value = !modalArquivo.value
  console.log("ta indo", modalArquivo.value)

}
const mapaArquivos = ref(new Map())
const statusJogadores = ref(new Map())
const modalArquivo = ref(false)
const arquivoImagem = ref(null)
const novoJogador = ref('')
const fichaLiberada = ref(false)
const jogadorFicha = ref('')
const avisoMestre = ref('')
const activeMasterTab = ref('players')
const arquivosMesa = ref([

])
  async function calculaPad( pasta){
    return  (((meuMapa[pasta.nome]) + 1) * 6)
    
  }
  async function inserearquivo(){
    console.log('podeVer:', podeVer.value)
    try { 
      const formData = new FormData()
      formData.append('file', arquivoSelecionado.value)
      formData.append('upload_preset', 'dxguild')

      const cloudName = 'dwt6xjnmh'
      const cloudinaryRes = await axios.post(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        formData
      )

      const nomeArq = prompt('Digite o nome do arquivo:')
    const url =  cloudinaryRes.data.secure_url

      const res = await api.post(`http://localhost:8080/dxguild/arquivo`, {
        nome: nomeArq,
        mesa: mesa.value.nome,
        arquivo: url,
        perm: podeVer.value,
        pasta: itemSelecionado.value
      })
      console.log("pastas", pastas.value)
       const index = pastas.value.findIndex(pasta => pasta.nome === itemSelecionado.value);
       console.log("ta aqui o", pastas.value[index])
       pastas.value[index].arquivos.push(res.data)
      if(mapaArquivos.value.get(itemSelecionado.value) == false){
        ramifica(itemSelecionado.value)  
       }
      stompClient.value.publish({
              destination: `/app/mesas/arquivo/${route.params.nome}`, 
              body: JSON.stringify({
              criador: authStore.getUser(),
              arquivo: res.data,
              tipo: 'arquivo',
              pai: itemSelecionado.value  // Define o tipo da mensagem, padrão para 'texto'
             })
          });
        
    } catch (error) {
      console.error('Erro ao enviar imagem para o Cloudinary:', error)
      throw error
    }
  }
  async function adicionarJogador() {
  console.log('Adicionando jogador:', mesa.value.id)
    try{
      const res = await api.post(`http://localhost:8080/dxguild/mesa/usuario/adicionar`, {
        idMesa: mesa.value.id,
        nick: novoJogador.value

      })
      jogadores.value.push(res.data)
      statusJogadores.value.set(res.data.nome, false);
      arquivoSelecionado.value = null

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
function pegaArquivo(event){
  arquivoSelecionado.value = event.target.files[0]
  inserearquivo()
}

function recolherFicha() {
  fichaLiberada.value = false
  jogadorFicha.value = ''
  avisoMestre.value = 'A ficha foi recolhida e ficou restrita ao mestre.'
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
        pastas.value = res.data.pastas.arvore
        pastas.value.forEach(pasta => {
            mapaArquivos.value.set(pasta.nome, false)
            meuMapa.value[pasta.nome] = -1
          
        }

        )
        console.log(mapaArquivos.value.get("hahahahahaha"))
        const dadosMesa = res.data.mesa || {}
        const players = res.data.jogadores || []
        players.forEach(player => {
          statusJogadores.value.set(player.nome, false);
          jogadores.value.push(player);
        });
        statusJogadores.value.set(dadosMesa.criador, false);
        console.log('Status:', statusJogadores.value)
        
        console.log(dadosMesa)
        arquivosMesa.value = res.data.arquivos || []
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
                console.log(dados)
                if(dados.tipo === 'arquivo'){
                  if(dados.criador != authStore.getUser()){
                     console.log("pastas", pastas.value)
                      
                      alocaArquivo(dados.arquivo, pastas.value, dados.pai)
                      console.log("a arvore inteira", pastas.value)
                      
                      
                     
                  }
                  return
                }
                if(dados.tipo === 'pasta'){
                  if(dados.criador != authStore.getUser()){
                    const index = pastas.value.findIndex(pasta => pasta.nome === dados.pai);  
                    const pastaCriada = dados.node
                    inserePasta(pastaCriada, pastas.value, dados.pai)
                    console.log("OLHA A PASTA NOVA", pastaCriada)
                    console.log("INDEX", index)
                    console.log('Pasta criada:', pastaCriada)
                    mapaArquivos.value.set(pastaCriada.nome, false)
                    console.log("aqui oh" + pastas.value[index])
                    if(!meuMapa.value[dados.pai]){
                        meuMapa.value[dados.pai] = -1
                    }

                     
                      meuMapa.value[pastaCriada.nome] = meuMapa.value[dados.pai] + 2
                      if(mapaArquivos.value.get(dados.pai) == true){
                        pastas.value.splice(index+1, 0, dados.node)
                      }
                    }
                
                    return
                }
                 
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
                if(window.innerWidth<900) {
                  mensagens.value.push(dados);
                  console.log(mensagens.value)
                  if(window.scrollY  >= document.documentElement.scrollHeight - window.innerHeight - 100) {
                    setTimeout(() => {
                      window.scrollTo(0, document.documentElement.scrollHeight);
                    }, 100);
                  }
                  
                  return;
                }
                const chat = document.getElementById('chat');
                const limite = chat.scrollHeight - chat.clientHeight;
                if(chat.scrollTop < limite - 300) {
                  mensagens.value.push(dados);
                  console.log(mensagens.value)
                  return;
                }
                else {
                  mensagens.value.push(dados);
                  console.log(mensagens.value)
                  setTimeout(() => {
                    chat.scrollTop = chat.scrollHeight - chat.clientHeight;
                  }, 100);
                }
                
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
  setTimeout(() => {
    const larguraTela = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
    if(larguraTela < 900) {
      window.scrollTo(0, document.documentElement.scrollHeight);
    }
    else {
      const chat = document.getElementById('chat');
      const limite = chat.scrollHeight - chat.clientHeight;
      console.log("Agora o limite é:", limite);
      chat.scrollTop = limite;
    }
}, 200);
    
});

function alocaArquivo(arquivo, pasta, pai){
    pasta.forEach(pasta => {
      if(pasta.nome === pai){
        pasta.arquivos.push(arquivo)
        return
      }else{
        if(pasta.filhos){
          alocaArquivo(arquivo, pasta.filhos, pai)
        }
        
      }
     
   }
   ) 
}
function inserePasta(nome, pasta, pai){
  
   pasta.forEach(pasta => {
      if(pasta.nome === pai){
        pasta.filhos.push(nome)
        return
      }else{
        if(pasta.filhos){
          inserePasta(nome, pasta.filhos, pai)
        }
        
      }
     
   }
   ) 
}



let scrollAtual = 0;

// 1. Salva a posição antes de começar a mexer na tela

const mensagem = ref('')
const dadosSelecionados = ref([])
const bonusRolagem = ref(0)
const painelMobile = ref(null)
const painelMobileAberto = ref(false)
const diceModalOpen = ref(false)
const modalArquivoAberto = ref(false)
const arquivoSelecionado = ref(null)
const nomeArquivoCustom = ref('')
const pastasSet = ref(new Set())
const pastas = ref(null)
const meuMapa = ref({})
const MenuVisivel = ref(false)
const menuX = ref(0)
const menuY = ref(0)
const itemSelecionado = ref('')
function abrirDiceModal() {
  diceModalOpen.value = true
}
function fecharDiceModal() {
  diceModalOpen.value = false
}
function rolarEFechar() {
  rolarDados()
  fecharDiceModal()
}
function abrirMenu(event, item) {
  event.preventDefault()
  menuX.value = event.clientX
  menuY.value = event.clientY
  console.log(menuX.value)
  itemSelecionado.value = item
  MenuVisivel.value = true

  
}
async function CriarPasta() {
  try {
    const nomePasta = prompt('Digite o nome da nova pasta:')
    const res = await api.post(`http://localhost:8080/dxguild/pasta`, {
      nome: nomePasta,
      filhos: [],
      permitidos: [],
      mesa: mesa.value.nome,
      pai: itemSelecionado.value
    })
    const pastaCriada = res.data
    if(itemSelecionado.value != "raiz"){
        const index = pastas.value.findIndex(pasta => pasta.nome === itemSelecionado.value);
        const pastaCriada = res.data
        console.log
        console.log('Pasta criada:', pastaCriada)
        mapaArquivos.value.set(pastaCriada.nome, false)
        pastas.value[index].filhos.push(res.data)
        console.log("CARALHO QUE SACO", mapaArquivos.value.get(itemSelecionado.value))
       
        console.log(pastas.value)
        
          if(!meuMapa.value[itemSelecionado.value]){
          meuMapa.value[itemSelecionado.value] = -1
        } 

          
          meuMapa.value[pastaCriada.nome] = meuMapa.value[itemSelecionado.value] + 2
           if(mapaArquivos.value.get(itemSelecionado.value) == true){
            pastas.value.splice(index+1, 0, res.data)
          }else{
            ramifica(itemSelecionado.value)
          }
          stompClient.value.publish({
              destination: `/app/mesas/pasta/${route.params.nome}`, 
              body: JSON.stringify({
              criador: authStore.getUser(),
              node: res.data,
              tipo: 'pasta',
              pai: itemSelecionado.value  // Define o tipo da mensagem, padrão para 'texto'
             })
          });
        
        console.log('Criando pasta:', nomePasta)
    }else {
         const pastaCriada = res.data
          meuMapa.value[pastaCriada.nome] = -1

          console.log
          console.log('Pasta criada:', pastaCriada)
          pastas.value.splice(0, 0, pastaCriada)
          console.log(pastas.value)

    }
   
  } catch (error) {
    console.error('Erro ao criar pasta:', error)
  }
}
onMounted(() => window.addEventListener('click', fecharMenu))
onUnmounted(() => window.removeEventListener('click', fecharMenu))
const fecharMenu = () => {
  MenuVisivel.value = false
}

const acaoExibirItem = () => {
  console.log('Você clicou com o botão direito no item:', itemSelecionado.value)
  fecharMenu()
}
function abrirModalArquivo() {
  document.getElementById('modal2').showModal()
}

function fecharModalArquivo() {
  modalArquivoAberto.value = false
  arquivoSelecionado.value = null
  nomeArquivoCustom.value = ''
}
const controlador = ref(false)
function handleArquivoSelecionado(event) {
  const file = event.target.files?.[0]
  if (!file) return
  arquivoSelecionado.value = file
  nomeArquivoCustom.value = file.name.replace(/\.[^/.]+$/, '')
}

async function confirmarArquivoModal() {
  if (!arquivoSelecionado.value) return

  const nomeFinal = (nomeArquivoCustom.value || arquivoSelecionado.value.name).trim() || arquivoSelecionado.value.name

  try {
    const formData = new FormData()
    formData.append('file', arquivoSelecionado.value)
    formData.append('upload_preset', 'dxguild')

    const cloudName = 'dwt6xjnmh'
    const cloudinaryRes = await axios.post(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      formData
    )

    const url = cloudinaryRes.data.secure_url
    const res = await api.post(`http://localhost:8080/dxguild/mesa/arquivo/adicionar`, {
      mesa: mesa.value.nome,
      arquivo: url,
      nome: nomeFinal
    })

    arquivosMesa.value.push(res.data ?? { nome: nomeFinal, tipo: 'Arquivo' })
  } catch (error) {
    console.error('Erro ao enviar arquivo para o Cloudinary:', error)
  } finally {
    fecharModalArquivo()
  }
}

const chatBackgroundStyle = computed(() => ({
  backgroundImage: mesa.value.imagem ? `url(${mesa.value.imagem})` : 'none',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat'
}))
function PastaAbertaJa(novo){
 
  novo.forEach(fio => {

    console.log("CARAI")
    
      if(pastas.value.find(pasta => pasta.nome === fio.nome)){
        mapaArquivos.value.set(fio.nome, false)
        if(novo){
          console.log(fio.filhos)
          PastaAbertaJa(fio.filhos)
          pastas.value = pastas.value.filter(pasta => pasta.nome !== fio.nome);
          pastasSet.value.delete(fio.nome)  
          controlador.value = true
           
        }
        else{
          return
        }
        
      }
  });
}
function abrirPainelMobile(painel) {
  painelMobile.value = painel
  painelMobileAberto.value = true
}
function ramifica(nome){
  
  const index = pastas.value.findIndex(pasta => pasta.nome === nome);
  const novo = pastas.value.find(pasta => pasta.nome === nome)?.filhos
  if(mapaArquivos.value.get(nome) == true){
       PastaAbertaJa(novo)
        mapaArquivos.value.set(nome, false)
       return
  }
  
  if(mapaArquivos.value.has(nome)){
    if(mapaArquivos.value.get(nome) == true){
     
    }
    else {
      mapaArquivos.value.set(nome, true)
    }
    
  }
  else{
    mapaArquivos.value.set(nome, true)
  }
  if(!meuMapa.value[nome]){
    meuMapa.value[nome] = -1
  }
  if(novo){
    for (const filho of novo) {
    console.log("tá aqui inclusive")
    if(pastasSet.value.has(filho.nome)) {
      console.log("aqui")
      continue
    }else {
        mapaArquivos.value.set(filho.nome, false)
        console.log("acabou de seta essa merda" + mapaArquivos.value.set(filho.nome, false) )
        meuMapa.value[filho.nome] = meuMapa.value[nome] + 2
        pastasSet.value.add(filho.nome)
        pastas.value.splice(index+1, 0, filho)
        
    }
   
  }
  }
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
      <div class="header-topbar">
        <div class="top-left">
          <button class="ghost-btn header-back" @click="router.back()">←</button>
        </div>
        <div class="top-right">
          <button class="mobile-drawer-toggle" @click="abrirPainelMobile('participants')" aria-label="Abrir painel">☰</button>
        </div>
      </div>

      <div class="header-main-row">
        <div class="header-context">
          <div class="header-topline">
            <span class="eyebrow">Mesa #{{ mesa.id }}</span>
            <span class="status-pill subtle">{{ mesa.meio }}</span>
          </div>

          <div class="header-title-row">
            <h1 class="mesa-title break">{{ mesa.nome }}</h1>
          </div>

          <div class="header-sub">
            <span class="header-meta">{{ mesa.sistema }}</span>
            <span class="header-divider">•</span>
            <span class="header-meta">Mestre {{ mesa.mestre }}</span>
          </div>
        </div>

        <div v-if="mesa.imagem" class="header-image-wrap" aria-label="Imagem da mesa">
          <img :src="mesa.imagem" alt="Imagem da mesa" class="header-image" />
        </div>
      </div>
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
    
    <!-- Grupo de arquivos dinâmico -->
    <div class="folder-group" >
        <div class="folder" @contextmenu.prevent="abrirMenu($event, 'raiz')">🗂️ Documentos e Links</div>
          <!-- Menu de Contexto -->
          
            <ul class="file-list">
            
              <li v-for="pasta in pastas" class="lista"  @contextmenu.prevent="abrirMenu($event, pasta.nome)" >
                <div :style="{ paddingLeft: (((meuMapa[pasta.nome]) + 1) * 6) + 'px'}">
                    <span  @click="ramifica(pasta.nome)" class="file-name" >-📁 {{ pasta.nome }}</span>
                </div> 
                <div v-if="mapaArquivos.get(pasta.nome) === true" >
                  <div v-for="arquivo in pasta.arquivos" class="lista" :style="{ paddingLeft: ((meuMapa[pasta.nome] + 4) * 6) + 'px' }" >
                    <img  src="../assets/imgs/pdficon.svg" height="20">
                    <a :href="arquivo.link" target="_blank"><span>{{ arquivo.nome }}</span></a>
                  </div>
                  
                </div>
              </li>
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
                <li v-for="jogador in jogadores" :key="jogador.nome" class="d-flex justify-content-between">
                  <span>{{ jogador.nome }} - Player</span>
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
        
            <div class="file-picker">
              <button class="file-modal-trigger"  @click="abrirModalArquivo()"aria-label="Adicionar arquivo">
                <svg class="file-modal-icon" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
                  <path d="M12 15v-6m-5 3h10" fill="none" nestroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span>Selecionar Arquivo</span>
              </button>
            </div>


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
              <span v-if="statusJogadores.get(mesa.mestre) === true" class="online" ></span>
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

          <div class="mobile-panel-content">
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
              <div class="panel-title">Arquivos & Painel do Mestre</div>

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
                      <li v-for="jogador in jogadores" :key="jogador.nome" class="d-flex justify-content-center">
                        <span>{{ jogador.nome }} - Player</span>
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
                  <label class="mobile-upload-trigger" aria-label="Adicionar arquivo" @click.prevent="abrirModalArquivo">
                    <svg class="mobile-upload-icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
                      <defs>
                        <linearGradient id="upload-gold" x1="0%" x2="100%" y1="0%" y2="100%">
                          <stop offset="0%" stop-color="#f7e7b9" />
                          <stop offset="100%" stop-color="#d4af37" />
                        </linearGradient>
                      </defs>
                      <path d="M12 15V4m0 0 4 4m-4-4-4 4" fill="none" stroke="url(#upload-gold)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
                      <path d="M4 15.5v3.5a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3.5" fill="none" stroke="url(#upload-gold)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <span class="mobile-upload-label">Arquivo</span>
                  </label>

                  <div v-if="modalArquivoAberto" class="file-modal-overlay" @click.self="fecharModalArquivo">
                    <div class="file-modal" role="dialog" aria-modal="true" aria-label="Adicionar arquivo à mesa">
                      <div class="file-modal-header">
                        <h4>Adicionar arquivo</h4>
                        <button type="button" class="ghost-btn" @click="fecharModalArquivo">✕</button>
                      </div>

                      <div class="file-modal-body">
                        <label class="file-modal-trigger" for="mobile-file-upload-modal">Escolher arquivo</label>
                        <input id="mobile-file-upload-modal" type="file" class="input-escondido" @change="handleArquivoSelecionado" />

                        <div v-if="arquivoSelecionado" class="file-modal-selected">
                          <span class="file-modal-label">Arquivo:</span>
                          <strong>{{ arquivoSelecionado.name }}</strong>
                        </div>

                        <label class="file-modal-field-label" for="arquivo-nome-custom">Nome do arquivo</label>
                        <input id="arquivo-nome-custom" v-model="nomeArquivoCustom" type="text" class="file-modal-input" placeholder="Ex.: Mapa da vila" />
                      </div>

                      <div class="file-modal-actions">
                        <button type="button" class="secondary-btn" @click="fecharModalArquivo">Cancelar</button>
                        <button type="button" class="primary-btn" @click="confirmarArquivoModal">OK</button>
                      </div>
                    </div>
                  </div>

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
                  <span v-if="statusJogadores.get(mesa.mestre) === false" class="presence-dot"></span>
                  <span v-if="statusJogadores.get(mesa.mestre) === true" class="online" ></span>
                </div>

                <div v-for="jogador in jogadores" :key="jogador.nome" class="member-card">
                  <div class="member-avatar">
                    <img v-if="participanteFoto(jogador)" :src="participanteFoto(jogador)" :alt="`Foto de ${jogador.nome}`" />
                    <span v-else>{{ iniciaisParticipante(jogador.nome) }}</span>
                  </div>
                  <div class="member-info"><strong>{{ jogador.nome }}</strong><span>{{ jogador.papel || 'Player' }}</span></div>
                  <span v-if="statusJogadores.get(jogador.nome) === false" class="presence-dot"></span>
                  <span v-if="statusJogadores.get(jogador.nome) === true" class="online"></span>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>

      <section    class="chat-panel">
        <div class="messages">
          <div class="messages-backdrop" :style="chatBackgroundStyle"></div>
          <div id="chat" class="messages-content">
            <div v-for="msg in mensagens" :key="msg.id" class="message-item  d-flex justify-content-start align-items-center">
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
            <button type="button" class="composer-icon-btn dice-trigger" title="Abrir rolagem" aria-label="Abrir rolagem" @click="abrirDiceModal">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="m12 2 8 5v10l-8 5-8-5V7l8-5Z" />
                <circle cx="9" cy="9" r="1" />
                <circle cx="15" cy="15" r="1" />
                <circle cx="9" cy="15" r="1" />
                <circle cx="15" cy="9" r="1" />
              </svg>
            </button>

            <!-- compact indicator of selected dice; still clickable to open modal -->
            <div v-if="dadosSelecionados.length" class="roll-preview" @click="abrirDiceModal" aria-hidden="false">
              <div class="selected-dice-inline">
                <span v-for="(lados, idx) in dadosSelecionados" :key="`${lados}-${idx}`" class="selected-die-inline">d{{ lados }}</span>
              </div>
              <span class="bonus-preview" v-if="bonusRolagem">+{{ bonusRolagem }}</span>
            </div>
          </div>

          <!-- Dice modal (desktop centered, mobile full screen) -->
          <div v-if="diceModalOpen" class="dice-modal-overlay" @click.self="fecharDiceModal">
            <div class="dice-modal" role="dialog" aria-modal="true" aria-label="Rolagem de dados">
              <div class="dice-modal-header">
                <h4>Escolher dados</h4>
                <button type="button" class="ghost-btn" @click="fecharDiceModal">✕</button>
              </div>

              <div class="dice-modal-body">
                <div class="dice-options">
                  <button type="button" class="dice-option" @click="adicionarDado(4)"><span class="dice-shape d4">△</span>d4</button>
                  <button type="button" class="dice-option" @click="adicionarDado(6)"><span class="dice-shape d6">⬡</span>d6</button>
                  <button type="button" class="dice-option" @click="adicionarDado(8)"><span class="dice-shape d8">◆</span>d8</button>
                  <button type="button" class="dice-option" @click="adicionarDado(10)"><span class="dice-shape d10">⬟</span>d10</button>
                  <button type="button" class="dice-option" @click="adicionarDado(100)"><span class="dice-shape d100">◈</span>d100</button>
                </div>

                <div class="roll-builder modal-roll-builder" aria-label="Dados selecionados">
                  <div class="roll-builder-title">Rolagem</div>
                  <div class="selected-dice">
                    <button v-for="(lados, indice) in dadosSelecionados" :key="`${lados}-${indice}`" type="button" class="selected-die" :title="`Remover d${lados}`" @click="removerDado(indice)">
                      {{ lados }} <span aria-hidden="true">×</span>
                    </button>
                  </div>

                  <label class="roll-bonus">Bônus <input v-model.number="bonusRolagem" type="number" step="1" aria-label="Bônus da rolagem" /></label>
                </div>
              </div>

              <div class="dice-modal-actions">
                <button type="button" class="secondary-btn" @click="fecharDiceModal">Cancelar</button>
                <button type="button" class="primary-btn" @click="rolarEFechar">Rolar</button>
              </div>
            </div>
          </div>
          <input v-model="mensagem" type="text" placeholder="Escreva uma mensagem..." />
          <button type="submit">Enviar</button>
        </form>
      </section>
    </div>
    <dialog id="modal2"  >
      <div class="arquivo-modal ">
        <h2 class="panel-title">Inserir Arquivo</h2>
        <div class="inputs">
           <label class="file-modal-field-label" for="arquivo-nome-custom">Nome do arquivo</label>
            <input id="arquivo-nome-custom" v-model="nomeArquivoCustom" type="text" class="file-modal-input" placeholder="Ex.: Mapa da vila" />
            <label class="file-custom-button" for="arquivo-Link-custom">
              <!-- Ícone SVG de Download -->
              <svg class="file-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              
              <span>Escolher Arquivo</span>
              
            </label>
            <input id="arquivo-Link-custom"  type="file" class="input-escondido" @change="pegaArquivo" placeholder="Ex.: https://example.com/arquivo.pdf" />
            <div class="box-jogadores-container">
            <label class="panel-title" for="lista-jogadores">Quem pode ver o arquivo?</label>
            <div 
            v-for="jogador in jogadores" 
            :key="jogador.id"
            class="jogador-checkbox-card"
            id="lista-jogadores"
          >
            <input 
              type="checkbox" 
              :id="`jogador-${jogador.id}`" 
              :value="jogador.nome"
              class="input-escondido"
              v-model="podeVer"
            />
            <label class="jogador-label" :for="`jogador-${jogador.id}`">
              <span class="custom-checkbox"></span>
              <span class="nome-texto">{{ jogador.nome }}</span>
            </label>
          </div>


  

           </div>
          </div>
        <button type="button" class="primary-btn" @click="inserearquivo()">Confirmar</button>
      </div>
      </dialog>
  </div>
  <ul 
            v-if="MenuVisivel" 
            class="meu-menu-flutuante"
            :style="{ top: menuY + 'px', left: menuX + 'px' }"
                    >
            <li class="meu-menu-item" @click="CriarPasta()">
              Nova Pasta
            </li>
                <li class="meu-menu-item">
        <label class="file-custom-button">
          <!-- Ícone SVG de Download -->
          <svg class="file-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          
          <span>Adicionar arquivo</span>

          <!-- O input fica dentro da label, eliminando a necessidade do atributo "for" -->
          <input type="file" class="input-escondido" @change="pegaArquivo" />
        </label>
      </li>
          </ul>
</template>

<style scoped>
/* Container que organiza os checkboxes em grade flexível */
.box-jogadores-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  max-height: 220px;
  overflow-y: auto;
  padding: 4px;
}

/* O card de cada jogador */
.jogador-checkbox-card {
  background-color: #12100e;
  border: 1px solid rgba(212, 175, 55, 0.25);
  border-radius: 8px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
}

.jogador-checkbox-card:hover {
  background-color: #1a1714;
  border-color: rgba(212, 175, 55, 0.6);
}

/* Esconde o checkbox nativo do navegador */
.input-escondido {
  position: absolute;
  opacity: 0;
  cursor: pointer;
}

/* A label que ocupa todo o espaço do card para ser clicável inteira */
.jogador-label {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 10px 14px;
  cursor: pointer;
  color: #e5e7eb;
  font-size: 14px;
  user-select: none;
}

/* Caixinha de seleção customizada */
.custom-checkbox {
  width: 18px;
  height: 18px;
  border: 1px solid rgba(212, 175, 55, 0.4);
  border-radius: 4px;
  background-color: #0d0c0a;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

/* O "Check" (ícone ou fundo) que aparece quando o input estámarcado (:checked) */
.input-escondido:checked + .jogador-label .custom-checkbox {
  background-color: #fde047;
  border-color: #fde047;
  box-shadow: 0 0 8px rgba(212, 175, 55, 0.4);
}

/* Mudança visual no card inteiro quando selecionado */
.input-escondido:checked + .jogador-label {
  color: #fde047;
  font-weight: 500;
}

.input-escondido:checked ~ .jogador-checkbox-card, /* suporte estrutural */
.jogador-checkbox-card:has(.input-escondido:checked) {
  background: linear-gradient(135deg, #24201b 0%, #1c1815 100%);
  border-color: #fde047;
}

/* Destaque opcional para o card do Mestre */
.mestre-card {
  border-color: rgba(212, 175, 55, 0.4);
}
.mesa-page {
  min-height: 100%;
  padding: 0.75rem 0.85rem 0.75rem;
  background:
    radial-gradient(circle at top left, rgba(212,175,55,0.15), transparent 28%),
    linear-gradient(135deg, #080808 0%, #121212 45%, #050505 100%);
  color: #f5e9d0;
}

.mesa-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  min-height: 52px;
  padding: 0.38rem 0.7rem;
  border-radius: 12px;
  margin-bottom: 0.6rem;
  background: linear-gradient(135deg, rgba(212,175,55,0.14), rgba(8,8,8,0.72));
  border: 1px solid rgba(212,175,55,0.22);
  box-shadow: 0 10px 26px rgba(0,0,0,0.24);
  backdrop-filter: blur(10px);
}
.inputs {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
  flex: 1;
}
.file-modal-input-hidden {
  display: none;
}

/* Transforma a label em um botão customizado combinando com a sua mesa de RPG */
.file-custom-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  
  width: 100%;
  padding: 12px 16px;
  
  background: linear-gradient(135deg, #24201b 0%, #151210 100%);
  border: 1px solid rgba(212, 175, 55, 0.4);
  border-radius: 8px;
  
  color: #fde047; /* Tom amarelado/dourado dos botões da sua interface */
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

/* Efeito ao passar o mouse por cima */
.file-custom-button:hover {
  background: linear-gradient(135deg, #2d2822 0%, #1c1815 100%);
  border-color: #fde047;
  box-shadow: 0 0 10px rgba(212, 175, 55, 0.15);
}

/* Tamanho e cor do SVG */
.file-icon {
  width: 20px;
  height: 20px;
  stroke: #fde047; /* Mantém o ícone combinando com o texto */
}
/* mobile drawer toggle hidden by default (desktop) */
.mobile-drawer-toggle {
  display: none;
}

.header-context {
  display: flex;
  flex-direction: column;
  gap: 0.12rem;
  min-width: 0;
  flex: 1;
}

.header-topline,
.header-title-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.25rem;
  min-width: 0;
}
.input-escondido {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
  opacity: 0;
}
dialog {
  outline: none;
  margin: auto;
 
}
.arquivo-modal {
  margin: 0;
  flex-direction: column;
  padding: 0;
  width: 50vw;
  background: linear-gradient(135deg, rgba(212,175,55,0.18), rgba(15,15,15,0.82));  
  height: 90vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #181512 0%, #0d0c0a 100%);
  border: 1px solid rgba(212, 175, 55, 0.35);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.8), 
              0 0 15px rgba(212, 175, 55, 0.05);
  gap: 2rem;
}
.mobile-upload-trigger {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  width: 100%;
  min-height: 2.7rem;
  padding: 0.6rem 0.8rem;
  border: 1px solid rgba(212,175,55,0.42);
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(212,175,55,0.18), rgba(15,15,15,0.82));
  color: #f7e7b9;
  cursor: pointer;
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.04);
}

.mobile-upload-trigger:hover {
  transform: translateY(-1px);
  border-color: rgba(240,230,140,0.8);
  box-shadow: 0 10px 20px rgba(212,175,55,0.16);
}

.mobile-upload-icon {
  display: block;
  width: 1.05rem;
  height: 1.05rem;
  color: #f0d57a;
  flex-shrink: 0;
}

.mobile-upload-label {
  font-size: 0.74rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  line-height: 1;
  text-transform: uppercase;
  color: #f7e7b9;
}

.file-modal-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba(8, 8, 8, 0.7);
  z-index: 2100;
}

.file-modal {
  width: min(420px, 100%);
  background: linear-gradient(180deg, rgba(19,19,19,0.98), rgba(9,9,9,0.98));
  border: 1px solid rgba(212,175,55,0.2);
  border-radius: 16px;
  box-shadow: 0 18px 38px rgba(0,0,0,0.5);
  overflow: hidden;
}

.file-modal-header,
.file-modal-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.8rem 1rem;
  border-bottom: 1px solid rgba(212,175,55,0.12);
}

.file-modal-header h4 {
  margin: 0;
  color: #f7e7b9;
  font-size: 1rem;
}

.file-modal-body {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
}

.file-modal-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 2.85rem;
  padding: 0.7rem 0.9rem;
  border: 1px dashed rgba(212,175,55,0.5);
  border-radius: 12px;
  background: rgba(255,255,255,0.02);
  color: #e5d9aa;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  outline: none;
}

.file-modal-trigger:hover {
  border-color: rgba(212,175,55,0.9);
  background: rgba(212,175,55,0.08);
  color: #f0d57a;
}

.file-modal-selected {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.65rem 0.75rem;
  border-radius: 10px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(212,175,55,0.14);
  color: #d9c88a;
  font-size: 0.76rem;
  word-break: break-word;
  overflow-wrap: anywhere;
}

.file-modal-label,
.file-modal-field-label {
  color: #f7e7b9;
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.file-modal-input {
  width: 100%;
  min-height: 2.5rem;
  padding: 0.65rem 0.75rem;
  border-radius: 10px;
  border: 1px solid rgba(212,175,55,0.28);
  background: rgba(0,0,0,0.38);
  color: #f5e9d0;
}

.file-modal-actions {
  border-top: 1px solid rgba(212,175,55,0.12);
  border-bottom: none;
  justify-content: flex-end;
}

.header-image-wrap {
  width: 34px;
  min-width: 34px;
  height: 34px;
  border-radius: 50%;
  overflow: hidden;
  border: 1px solid rgba(212,175,55,0.24);
  box-shadow: 0 8px 16px rgba(0,0,0,0.18);
}

.header-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  padding: 0.16rem 0.42rem;
  border-radius: 999px;
  background: rgba(212,175,55,0.18);
  color: #f7e7b9;
  font-size: 0.54rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  border: 1px solid rgba(212,175,55,0.24);
}

.status-pill.subtle {
  background: rgba(255,255,255,0.06);
}

.eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #d9c88a;
  font-size: 0.54rem;
  margin: 0;
}

.mesa-title {
  font-family: 'TheWildBreathOfZelda', serif;
  font-size: clamp(0.95rem, 1.8vw, 1.25rem);
  line-height: 1.1;
  color: #f7e7b9;
  margin: 0;
}

.header-divider {
  color: #a58c42;
  opacity: 0.85;
  font-size: 0.8rem;
}
.meu-menu-flutuante {
  position: fixed;        /* Faz flutuar na tela exatamente onde o mouse clicou */
  top: 0;                 /* Valor base, será sobrescrito pelo :style do Vue */
  left: 0;                /* Valor base, será sobrescrito pelo :style do Vue */
  z-index: 9999999 ;          /* Garante que fique por cima de tudo */
  background-color: #212529; /* Cor de fundo escura (estilo dark) */
  color: #fff;            /* Cor do texto */
  border: 1px solid #444; /* Bordinha discreta */
  border-radius: 6px;     /* Cantos arredondados */
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3); /* Sombra elegante */
  list-style: none;       /* Remove as bolinhas da lista */
  padding: 4px 0;         /* Espaçamento interno */
  min-width: 160px;       /* Largura mínima */
  margin: 0;
   /* Posição horizontal baseada no clique */
}
.header-meta {
  color: #d9c88a;
  font-size: 0.67rem;
  white-space: nowrap;
}

.description {
  color: #cbbb80;
  max-width: 720px;
}

.ghost-btn {
  border: 1px solid rgba(212,175,55,0.3);
  background: rgba(255,255,255,0.04);
  color: #f7e7b9;
  padding: 0.36rem 0.6rem;
  border-radius: 999px;
  font-size: 0.72rem;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.ghost-btn:hover {
  transform: translateY(-1px);
  border-color: rgba(212,175,55,0.6);
  box-shadow: 0 8px 20px rgba(212,175,55,0.16);
}

.header-back {
  flex-shrink: 0;
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
  grid-template-columns: minmax(300px, 340px) minmax(0, 1fr);
  gap: 1rem;
  width: 100%;
  max-width: 100%;
  min-height: 0;
}

.sidebar {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-height: 0;
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
.meu-menu-item {
  padding: 8px 16px;
  cursor: pointer;
  white-space: nowrap;
  z-index:9999;
}

.meu-menu-item:hover {
  background-color: #343a40; /* Cor ao passar o mouse */
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
  gap: 0.45rem;
  min-height: 0;
  height: 100%;
  overflow-x: hidden !important;
}

.messages {
  flex: 1 1 auto;
  position: relative;
  background: linear-gradient(180deg, rgba(18,18,18,0.96), rgba(8,8,8,0.98));
  border: 1px solid rgba(212,175,55,0.16);
  border-radius: 14px;
  width: 100% !important;
  min-height: 0;
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
.lista {
  list-style: circle
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
  
  overflow-x: hidden;
/* scrollbar styling for WebKit (Chrome, Edge, Safari) */
}

/* Dice modal styles */
.dice-modal-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0,0,0,0.45);
  z-index: 2100; /* above drawer/composer */
}

.dice-modal {
  width: min(520px, 94%);
  max-width: 520px;
  background: linear-gradient(180deg, rgba(18,18,18,0.98), rgba(8,8,8,0.98));
  border: 1px solid rgba(212,175,55,0.16);
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 10px 40px rgba(0,0,0,0.6);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.dice-modal-header {
  display:flex;
  justify-content:space-between;
  align-items:center;
}

.dice-modal-body {
  display:flex;
  gap:1rem;
  align-items:flex-start;
  flex-wrap:wrap;
}

.dice-options { display:flex; gap:0.5rem; flex-wrap:wrap; }
.dice-option { padding:0.45rem 0.5rem; border-radius:8px; background:rgba(255,255,255,0.03); border:1px solid rgba(212,175,55,0.08); color:#f6e9c9; cursor:pointer; }

.modal-roll-builder { flex:1; min-width:160px; }

.dice-modal-actions { display:flex; justify-content:flex-end; gap:0.5rem; }
.primary-btn { background:linear-gradient(90deg,#d4af37,#f0d57a); border:0; padding:0.5rem 0.8rem; border-radius:8px; color:#0a0a0a; font-weight:700; }
.secondary-btn { background:transparent; border:1px solid rgba(212,175,55,0.12); padding:0.45rem 0.65rem; border-radius:8px; color:#f6e9c9; }

/* Mobile: make modal full-screen drawer style */
@media (max-width:900px) {
  .dice-modal { width:100%; height:100%; border-radius:0; max-width:100%; padding:1rem 0.85rem; }
  .dice-modal-body { flex-direction:column; }
  .dice-modal-actions { padding-bottom:calc(env(safe-area-inset-bottom,0px) + 0.5rem); }
}

/* WebKit browsers for messages */
.messages-content::-webkit-scrollbar {
  width: 5px;
  height: 5px;
}

.messages-content::-webkit-scrollbar-track {
  background: transparent;
}

.messages-content::-webkit-scrollbar-thumb {
  background: rgba(212,175,55,0.35); /* subtle dark gold */
  border-radius: 999px;
  border: 1px solid rgba(0,0,0,0.18);
}

.messages-content::-webkit-scrollbar-thumb:hover {
  background: rgba(212,175,55,0.7);
}

/* WebKit browsers for sidebar and mobile panel */
.sidebar::-webkit-scrollbar,
.mobile-panel-sheet::-webkit-scrollbar {
  width: 5px;
  height: 5px;
}

.sidebar::-webkit-scrollbar-track,
.mobile-panel-sheet::-webkit-scrollbar-track {
  background: transparent;
}

.sidebar::-webkit-scrollbar-thumb,
.mobile-panel-sheet::-webkit-scrollbar-thumb {
  background: rgba(212,175,55,0.35);
  border-radius: 999px;
  border: 1px solid rgba(0,0,0,0.18);
}

.sidebar::-webkit-scrollbar-thumb:hover,
.mobile-panel-sheet::-webkit-scrollbar-thumb:hover {
  background: rgba(212,175,55,0.7);
}

/* Firefox */
.messages-content,
.sidebar,
.mobile-panel-sheet {
  scrollbar-width: thin;
  scrollbar-color: rgba(212,175,55,0.45) transparent;
}

.message-item {
  width: 100%;
  position: relative;
  z-index: 1;
}
    
.message-item {
  padding: 0.68rem 0.8rem;
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
  margin-bottom: 0.18rem;
  color: #f7e7b9;
}

.message-head span {
  color: #9a8b4f;
  font-size: 0.72rem;
}

.message-item p {
  color: #e3d6b0;
  line-height: 1.4;
  font-size: 0.92rem;
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
  gap: 0.38rem;
  padding: 0.32rem 0.38rem;
  border-radius: 999px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(212,175,55,0.16);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.03);
}

.composer > input:not(.chat-image-input) {
  padding: 0.7rem 0.8rem;
  border-radius: 999px;
  border: 1px solid rgba(212,175,55,0.2);
  background: rgba(0,0,0,0.45);
  color: #f5e9d0;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.04);
  width: 100%;
  min-height: 42px;
  font-size: 0.9rem;
}

.modal-arquivo {
  
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  outline: none;
}
.composer-icon-btn {
  flex: 0 0 auto;
  display: inline-grid;
  place-items: center;
  width: 2.4rem;
  height: 2.4rem;
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
  padding: 0.68rem 0.9rem;
  border: none;
  border-radius: 999px;
  background: linear-gradient(135deg, #d4af37, #f0e68c);
  color: #000;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 10px 24px rgba(212,175,55,0.18);
  transition: transform 0.2s ease;
  font-size: 0.82rem;
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
    padding: 0.7rem;
  }

  .mesa-header {
    flex-direction: column;
    align-items: stretch;
    padding: 0.5rem 0.65rem;
    margin-bottom: 0.55rem;
  }

  .header-left {
    width: 100%;
    align-items: flex-start;
  }

  .header-context {
    width: 100%;
  }

  .ghost-btn {
    align-self: flex-start;
  }

  .header-meta {
    white-space: normal;
  }

  .mesa-layout {
    grid-template-columns: 1fr;
    max-width: 100%;
  }

  .sidebar {
    display: none;
  }

  /* hide top mobile action buttons — replaced by a drawer toggle in the header */
  .mobile-actions {
    display: none !important;
  }

  .mobile-action-btn { display: none !important; }

  .chat-panel {
    min-height: 70vh;
  }

  /* Composer fixed at bottom on mobile */
  /* Use a CSS variable to keep composer height in sync with messages padding without JS. */
  .composer {
    --composer-height: 76px; /* fallback; tune if composer contents change */
    position: fixed;
    left: 0.7rem;
    right: 0.7rem;
    bottom: calc(env(safe-area-inset-bottom, 0px) + 0.6rem);
    z-index: 1400;
    max-width: calc(100% - 1.4rem);
    margin: 0 auto;
    box-shadow: 0 12px 30px rgba(0,0,0,0.6);
    border-radius: 999px;
    backdrop-filter: blur(6px);

    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.56rem 0.9rem; /* control visual height */
    height: var(--composer-height);
    min-height: 56px;
    box-sizing: border-box;
  }

  /* Ensure messages area has space so last messages are not hidden by fixed composer */
  .messages-content {
    /* use same composer height + safe-area so last message is visible above composer */
    padding-bottom: calc(var(--composer-height, 76px) + env(safe-area-inset-bottom, 0px) + 8px);
  }

  /* mobile drawer toggle (in header) */
  .mobile-drawer-toggle {
    display: inline-grid;
    place-items: center;
    width: 2.4rem;
    height: 2.4rem;
    margin-left: 0.5rem;
    border-radius: 8px;
    border: 1px solid rgba(212,175,55,0.14);
    background: rgba(0,0,0,0.18);
    color: #f7e7b9;
    font-weight: 700;
    cursor: pointer;
    flex-shrink: 0;
  }

  /* Mobile header layout refinements (compact, clear hierarchy) */
  .mesa-header {
    padding: 0.45rem 0.6rem;
    min-height: auto;
  }

  .header-topbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
  }

  .header-main-row {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    width: 100%;
    margin-top: 0.35rem;
  }

  .header-context {
    display: flex;
    flex-direction: column;
    gap: 0.08rem;
    min-width: 0;
    flex: 1;
  }

  .header-topline {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    color: #dcd0a3;
    font-size: 0.75rem;
  }

  .header-title-row {
    display: flex;
    align-items: baseline;
    gap: 0.5rem;
  }

  .mesa-title {
    font-size: 1.05rem;
    font-weight: 600;
    margin: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .header-sub {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    color: #d7caa0;
    font-size: 0.78rem;
    margin-top: 0.18rem;
  }

  .header-image-wrap {
    width: 40px;
    height: 40px;
    min-width: 40px;
    border-radius: 50%;
    overflow: hidden;
    flex-shrink: 0;
    margin-left: 0.4rem;
    align-self: center;
    border: 1px solid rgba(212,175,55,0.18);
  }

  .header-image {
    width:100%;
    height:100%;
    object-fit:cover;
    display:block;
  }

  .ghost-btn.header-back {
    padding: 0.18rem 0.5rem;
    font-size: 0.95rem;
  }

  /* overlay changed to support a side drawer */
  .mobile-panel-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.42);
    z-index: 2000; /* must be above fixed composer (1400) */
    display: flex;
    align-items: stretch;
    justify-content: flex-end; /* drawer comes from the right */
    padding: 0;
  }

  /* mobile sheet becomes a right-side drawer */
  .mobile-panel-sheet {
    width: min(360px, 84%);
    max-width: 360px;
    height: 100%;
    background: linear-gradient(180deg, rgba(18,18,18,0.98), rgba(5,5,5,0.98));
    border-left: 1px solid rgba(212,175,55,0.18);
    padding: 1rem;
    overflow-y: auto;
    box-shadow: -12px 0 30px rgba(0,0,0,0.6);
    transform: translateX(100%);
    animation: slideIn 260ms ease forwards;
    z-index: 2010; /* above overlay and composer */
    position: relative;
  }

  @keyframes slideIn {
    from { transform: translateX(100%); }
    to { transform: translateX(0); }
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

  /* Master panel file picker styling (shared desktop/mobile) */
  .file-picker {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    margin: 0.6rem 0 1rem 0;
    flex-wrap: nowrap;
    min-width: 0;
  }

  .file-input-hidden {
    position: absolute;
    opacity: 0;
    left: -9999px;
    width: 1px;
    height: 1px;
    pointer-events: none;
  }

  .file-choose-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.48rem 0.9rem;
    border-radius: 10px;
    background: linear-gradient(90deg, #e7cf7a 0%, #cfb256 100%);
    border: 1px solid rgba(212,175,55,0.18);
    color: #0b0b0b;
    font-weight: 800;
    cursor: pointer;
    box-shadow: 0 8px 20px rgba(0,0,0,0.45);
    transition: transform 140ms ease, box-shadow 140ms ease, filter 180ms ease;
    user-select: none;
    font-size: 0.95rem;
  }

  .file-choose-btn .file-choose-icon {
    width: 18px;
    height: 18px;
    color: rgba(0,0,0,0.9);
  }

  .file-choose-btn:hover {
    transform: translateY(-3px);
    box-shadow: 0 14px 30px rgba(0,0,0,0.55);
    filter: brightness(1.02);
  }

  .file-selected-text {
    color: #e3d6b0;
    font-size: 0.88rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: calc(100% - 140px);
    min-width: 0;
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

  /* Desktop: hide the mobile topbar and render the header-main-row as a single horizontal bar
     to preserve the previous compact/designed header layout. */
  .header-topbar {
    display: none;
  }

  .header-main-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    width: 100%;
  }

  .header-context {
    display: flex;
    flex-direction: row; /* title and meta aligned horizontally on desktop */
    align-items: center;
    gap: 0.6rem;
    min-width: 0;
    flex: 1;
  }

  .header-topline {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  .header-title-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .mesa-title {
    font-size: 1.15rem; /* restore slightly larger desktop title */
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
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
