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
const arquivosRaizes = ref([])
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
const imagemExpandida = ref(null)
const jogadores = ref([


])

// Alterna a abertura do modal de arquivos.
function ModalArquivoAberto() {
  modalArquivo.value = !modalArquivo.value
}
const mapaArquivos = ref(new Map())
const statusJogadores = ref(new Map())
const modalArquivo = ref(false)
const arquivoImagem = ref(null)
const novoJogador = ref('')
const fichaLiberada = ref(false)
const jogadorFicha = ref('')
const avisoMestre = ref('')
const fichasJogadores = ref({})
const activeMasterTab = ref('players')
const raizes = ref([])
const arquivosMesa = ref([

])
const erroJogador = ref('')
  // Envia o arquivo selecionado e atualiza a pasta correspondente.
  async function inserearquivo(){
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
      if(itemSelecionado.value == null){
        const res = await api.post(`/dxguild/arquivo/raiz`, {
          nome: nomeArq,
          mesa: mesa.value.nome,
          arquivo: url,
          perm: podeVer.value,
        })
        arquivosRaizes.value.push(res.data)
         stompClient.value.publish({
              destination: `/app/mesas/arquivo/${route.params.nome}`, 
              body: JSON.stringify({
              criador: authStore.getUser(),
              arquivo: res.data,
              tipo: 'arquivo',
             })
          });
        return
      }
      const res = await api.post(`/dxguild/arquivo`, {
        nome: nomeArq,
        mesa: mesa.value.nome,
        arquivo: url,
        perm: podeVer.value,
        pasta: itemSelecionado.value
      })
       const index = pastas.value.findIndex(pasta => pasta.nome === itemSelecionado.value);
       pastas.value[index].arquivos.push(res.data)
      if(mapaArquivos.value.get(itemSelecionado.value) == false){
        ramifica(itemSelecionado.value)  
       }      stompClient.value.publish({
              destination: `/app/mesas/arquivo/${route.params.nome}`, 
              body: JSON.stringify({
              criador: authStore.getUser(),
              arquivo: res.data,
              tipo: 'arquivo',
              pai: itemSelecionado.value  // Define o tipo da mensagem, padrão para 'texto'
             })
          });
        
    } catch (error) {
    
      if(error.response && error.response.status === 400) {
        alert('Nome de pasta inválido. mantenha o tamanho entre 2 e 20 caracteres')
      }
    }
  }
  
  // Adiciona um jogador à mesa atual.
  async function adicionarJogador() {
    try{
      erroJogador.value = ''
      const res = await api.post(`/dxguild/mesa/usuario/adicionar`, {
        mesa: mesa.value.nome,
        nick: novoJogador.value

      })
      jogadores.value.push(res.data)
      statusJogadores.value.set(res.data.nome, false);
      arquivoSelecionado.value = null

    } catch (e) {
      console.error('Erro ao adicionar jogador:', e);
      if(e.response.status == 404){
        erroJogador.value = 'Jogador não encontrado.'
        return
      }
      if(e.response.status == 409){
        erroJogador.value = 'Jogador já está na mesa.'
        return
      }
      erroJogador.value = 'Erro ao adicionar jogador.'

    }
} 

// Retorna o estado da ficha do jogador.
function estadoFicha(jogador) {
  const nome = (jogador || '').trim()
  if (!nome) return 'sem-ficha'
  return fichasJogadores.value[nome] || 'sem-ficha'
}

// Cria o texto de status da ficha para exibição.
function textoFicha(jogador) {
  const nome = (jogador || '').trim()
  if (!nome) return 'Fichas não disponíveis.'

  const estado = estadoFicha(nome)
  if (estado === 'criada') return `Ficha criada para ${nome}.`
  if (estado === 'pegou') return `${nome} pegou a ficha.`
  return `A ficha de ${nome} ainda não foi criada.`
}

// Marca a ficha do jogador como retirada.
function pegarFicha(jogador) {
  const nome = (jogador || '').trim()
  if (!nome) {
    avisoMestre.value = 'Selecione um jogador para pegar a ficha.'
    return
  }

  fichasJogadores.value[nome] = 'pegou'
  jogadorFicha.value = nome
  fichaLiberada.value = true
  avisoMestre.value = `${nome} pegou a ficha.`
}

// Libera a ficha para o jogador selecionado.
function liberarFicha(jogador = jogadorFicha.value) {
  const nome = jogador?.trim?.() || ''
  if (!nome) {
    avisoMestre.value = 'Selecione um jogador para liberar a ficha.'
    return
  }

  fichasJogadores.value[nome] = 'pegou'
  jogadorFicha.value = nome
  fichaLiberada.value = true
  avisoMestre.value = `A ficha foi liberada para ${nome}.`
}

// Envia o arquivo escolhido no campo de seleção.
function pegaArquivo(event){
  arquivoSelecionado.value = event.target.files[0]
  inserearquivo()
}

// Recolhe a ficha e limpa o jogador selecionado.
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

// Publica uma mensagem no chat da mesa.
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
  if (campoMensagem.value) campoMensagem.value.style.height = ''
};
// Guarda o arquivo escolhido para envio ao chat.
const handleFileUpload = (event) => {

  const target = event.target

  if (target.files && target.files[0]) {

    arquivoImagem.value = target.files[0]

    enviarImagem()
  }

}
// Envia um arquivo para o serviço de armazenamento de imagens.
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
// Publica no chat a imagem enviada.
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
  if (campoMensagem.value) campoMensagem.value.style.height = ''
  } catch (e) {
    console.error('Erro ao enviar mensagem:', e)
  }
}
var page = 0
// Exibe uma mensagem de erro recebida do servidor.
function mostrarErro(mensagem) {
  alert(`Erro do servidor: ${mensagem}`)
}
// Carrega os dados da mesa e inicia o chat em tempo real.
onMounted(async () => {
    try {
        const nomeMesa = encodeURIComponent(route.params.nome || route.params.id || '')
        const res = await api.get(`/dxguild/mesa/${nomeMesa}`)
        pastas.value = res.data.pastas.arvore
        pastas.value.forEach(pasta => {
            mapaArquivos.value.set(pasta.nome, false)
            meuMapa.value[pasta.nome] = -1
            raizes.value.push(pasta.nome)
          
        }

        )
        const arquivosRaiz = res.data.arquivosRaizes
        arquivosRaiz.forEach(arquivo => {
           arquivosRaizes.value.push(arquivo  )
        })
        const dadosMesa = res.data.mesa || {}
        const players = res.data.jogadores || []
        players.forEach(player => {
          statusJogadores.value.set(player.nome, false);
          jogadores.value.push(player);
        });
        statusJogadores.value.set(dadosMesa.criador, false);
        arquivosMesa.value = res.data.arquivos || []
        const usuarioAtual = authStore.getUser()
        const criadorMesa = dadosMesa.criador || dadosMesa.mestre || dadosMesa.nomeCriador || dadosMesa.createdBy || ''
        const chat = res.data.mensaagens || []
        const chatOrdenado = chat.sort((a, b) => new Date(a.dataEnvio) - new Date(b.dataEnvio));
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

    } catch (error) {
        if(error.response && error.response.status === 403) {
            router.push('/')
        } 
    }
   

    stompClient.value = new Client({
        webSocketFactory: () => new SockJS('/dx-rpg'),
        connectHeaders: {
          Authorization: `Bearer ${authStore.getToken()}`
        },
        heartbeatIncoming: 10000, // espera receber um sinal do servidor a cada 10s
        heartbeatOutgoing: 10000, // manda um sinal pro servidor a cada 10s
        reconnectDelay: 5000,
        onConnect: () => {
            stompClient.value.subscribe(`/topic/mesa/${route.params.nome}`, (mensagemRecebida) => {
                const dados = JSON.parse(mensagemRecebida.body);
                if(dados.tipo === 'arquivo'){
                  if(dados.criador != authStore.getUser()){
                     if(dados.pai){
                        
                      alocaArquivo(dados.arquivo, pastas.value, dados.pai)
                     }
                     else{
                      arquivosRaizes.value.push(dados.arquivo)
                     }
                  }
                  return
                }
                if(dados.tipo === 'pasta'){
                  if(dados.criador != authStore.getUser()){
                    const index = pastas.value.findIndex(pasta => pasta.nome === dados.pai);  
                    const pastaCriada = dados.node
                    if(dados.raiz == true){
                      pastas.value.push(pastaCriada)
                       meuMapa.value[pastaCriada.nome] = -1
                        mapaArquivos.value.set(pastaCriada.nome, false)
                         return
                    }
                    else{
                      inserePasta(pastaCriada, pastas.value, dados.pai)
                   
                      if(!meuMapa.value[dados.pai]){
                        meuMapa.value[dados.pai] = -1
                      }

                     
                      meuMapa.value[pastaCriada.nome] = meuMapa.value[dados.pai] + 2
                      if(mapaArquivos.value.get(dados.pai) == true){
                        pastas.value.splice(index+1, 0, dados.node)
                      }
                      return
                      }
                
                     
                    }
                  return 
                }
                 
                if(dados.tipo === 'ping') {
                  const atinga = statusJogadores.value.get(dados.nick);
                  statusJogadores.value.set(dados.nick, dados.ping);
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
                  return;
                }
                else {
                  mensagens.value.push(dados);
                  setTimeout(() => {
                    chat.scrollTop = chat.scrollHeight - chat.clientHeight;
                  }, 100);
                }
                
            });
             stompClient.value.subscribe('/user/queue/errors', (msg) => {
              mostrarErro(msg.body);
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
          console.error('Erro no STOMP:', frame.headers['message']);
        },
        onWebSocketClose: (event) => {
            console.warn('WebSocket fechado. Code:', event.code, 'Reason:', event.reason);
        },
        onWebSocketError: (event) => {
            console.error('Erro no WebSocket:', event);
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
      chat.scrollTop = limite;
    }
}, 200);
    
});

// Insere um arquivo na pasta correspondente da árvore.
function alocaArquivo(arquivo, pastaOG, pai) {
  for (const pasta of pastaOG) {
    // Se encontrou a pasta correspondente
    if (pasta.nome === pai) {
      pasta.arquivos.push(arquivo);
      return true; // Encontrou e inseriu: interrompe o loop e avisa a chamada anterior
    }

    // Se a pasta atual tem filhos, busca recursivamente neles
    if (pasta.filhos && pasta.filhos.length > 0) {
      const encontrado = alocaArquivo(arquivo, pasta.filhos, pai);
      if (encontrado) {
        return true; // Se achou nos filhos, interrompe a busca nos demais irmãos
      }
    }
  }

  return false; // Não encontrou nesta ramificação
}
// Insere uma pasta no nó correspondente da árvore.
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
const fileInput = ref(null)
const uploadFichaInput = ref(null)
const jogadorUploadSelecionado = ref('')
import { nextTick } from 'vue';

// Carrega mensagens anteriores e preserva a posição do chat.
async function CarregaMais() {
  try {
    const isMobile = window.innerWidth < 900;
    const chatContainer = document.getElementById('chat');

    // 1. Captura a altura e posição do scroll ANTES de adicionar novas mensagens
    let alturaAntiga = 0;
    let scrollAtual = 0;

    if (isMobile) {
      // Quando < 900px, o scroll é na página inteira (document/body)
      alturaAntiga = document.documentElement.scrollHeight;
      scrollAtual = window.scrollY;
    } else if (chatContainer) {
      // Em telas maiores, o scroll é no elemento #chat
      alturaAntiga = chatContainer.scrollHeight;
      scrollAtual = chatContainer.scrollTop;
    }

    // 2. Busca os dados da API
    page++;
    const res = await api.get(`/dxguild/mesa/${mesa.value.nome}/mensagensPage/${page}`);
    const chat = res.data || [];

    // Se não houver novas mensagens, encerra para evitar processamento desnecessário
    if (chat.length === 0) return;

    // 3. Ordena e insere no início
    const chatOrdenado = [...chat].sort((a, b) => new Date(a.dataEnvio) - new Date(b.dataEnvio));
    mensagens.value.unshift(...chatOrdenado);

    // 4. Aguarda a atualização do DOM pelo Vue
    await nextTick();

    // 5. Ajusta o scroll com base na diferença de altura
    if (isMobile) {
      const alturaNova = document.documentElement.scrollHeight;
      const diferencaAltura = alturaNova - alturaAntiga;
      
      // Preserva a posição na página inteira
      window.scrollTo({
        top: scrollAtual + diferencaAltura,
        behavior: 'instant' // Evita animações para que não haja tremor na tela
      });
    } else if (chatContainer) {
      const alturaNova = chatContainer.scrollHeight;
      const diferencaAltura = alturaNova - alturaAntiga;

      // Preserva a posição dentro do painel do chat
      chatContainer.scrollTop = scrollAtual + diferencaAltura;
    }

  } catch (e) {
    console.error("Erro ao carregar mais mensagens:", e);
  }
}
const nomeJogadorFicha = ref('')

// Abre a ficha do jogador ou solicita o envio quando não existe.
async function ficha(nome){
    try{
      nomeJogadorFicha.value = nome
        const mesaNome = mesa.value.nome
        const res = await api(`/dxguild/mesa/ficha/${encodeURIComponent(mesaNome)}/${encodeURIComponent(nome)}`)
        window.open(res.data.ficha, '_blank', 'noopener,noreferrer');
    }catch(e){
      console.error('Erro ao pegar a ficha:', e)
      if(e.response?.status == 404){
        abrirUploadFicha(nome)
      }
    }
  }

// Inicia a criação de ficha com o arquivo selecionado.
const aoSelecionarArquivo = (event) => {
  const arquivo = event.target.files[0];
  if (arquivo) {
    criarFicha(arquivo)
  }
};

// Abre o seletor de arquivo para o jogador informado.
function abrirUploadFicha(nome) {
  jogadorUploadSelecionado.value = nome
  uploadFichaInput.value?.click()
}

// Processa o arquivo escolhido para enviar a ficha.
const aoSelecionarUploadFicha = (event) => {
  const arquivo = event.target.files?.[0]
  if (!arquivo) return

  nomeJogadorFicha.value = jogadorUploadSelecionado.value
  criarFicha(arquivo)
  event.target.value = ''
}

// Envia a ficha selecionada para armazenamento e cadastro.
async function criarFicha(arquivo){
    try{
      const url = await enviarParaCloudinary(arquivo);
      const res = await api.post(`/dxguild/mesa/ficha`, {
        ficha: url,
        mesa: mesa.value.nome,
        jogador: nomeJogadorFicha.value
      })
    }catch(e){
      console.error('Erro ao criar ficha:', e)
    }
    
    
}
let scrollAtual = 0;

// 1. Salva a posição antes de começar a mexer na tela

const mensagem = ref('')
const campoMensagem = ref(null)
const mostrarBotaoMensagensAntigas = ref(false)
const dadosSelecionados = ref([])
const bonusRolagem = ref(0)
const painelMobile = ref(null)

// Ajusta a altura do campo conforme o texto digitado.
const ajustarAlturaMensagem = (event) => {
  const campo = event.target
  campo.style.height = 'auto'
  campo.style.height = `${Math.min(campo.scrollHeight, 140)}px`
}

// Envia a mensagem ao pressionar Enter sem Shift.
const tratarTeclaMensagem = (event) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    enviarMensagem('texto')
  }
}
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

// Exibe a imagem em tamanho expandido.
function abrirImagemExpandida(src) {
  imagemExpandida.value = src
}

// Fecha a imagem expandida.
function fecharImagemExpandida() {
  imagemExpandida.value = null
}

// Fecha a imagem expandida ao pressionar Escape.
function lidarComTeclaImagem(event) {
  if (event.key === 'Escape') {
    fecharImagemExpandida()
  }
}

onMounted(() => window.addEventListener('keydown', lidarComTeclaImagem))
onUnmounted(() => window.removeEventListener('keydown', lidarComTeclaImagem))

// Abre o modal de rolagem de dados.
function abrirDiceModal() {
  diceModalOpen.value = true
}
// Fecha o modal de rolagem de dados.
function fecharDiceModal() {
  diceModalOpen.value = false
}
// Realiza a rolagem e fecha o modal.
function rolarEFechar() {
  rolarDados()
  fecharDiceModal()
}
// Abre o menu contextual para o item selecionado.
function abrirMenu(event, item) {
  event.preventDefault()
  menuX.value = event.clientX
  menuY.value = event.clientY
  itemSelecionado.value = item
  MenuVisivel.value = true

  
}

// Cria uma pasta no nível selecionado da árvore.
async function CriarPasta() {
  try {
    if(meuMapa.value[itemSelecionado.value] > 10){
      alert('Não é possível criar mais pastas nesse nível.')
      return
    }
    var eraiz = false;
    if(itemSelecionado.value == null){
      eraiz = true
    }
    const nomePasta = prompt('Digite o nome da nova pasta:')
    const res = await api.post(`/dxguild/pasta`, {
      nome: nomePasta,
      filhos: [],
      permitidos: [],
      mesa: mesa.value.nome,
      pai: itemSelecionado.value,
      raiz: eraiz
    })
    const pastaCriada = res.data.node 
    if(!res.data.raiz){
        const index = pastas.value.findIndex(pasta => pasta.nome === itemSelecionado.value);
        mapaArquivos.value.set(pastaCriada.nome, false)
        pastas.value[index].filhos.push(pastaCriada)
        
          if(!meuMapa.value[itemSelecionado.value]){
          meuMapa.value[itemSelecionado.value] = -1
        } 

          
          meuMapa.value[pastaCriada.nome] = meuMapa.value[itemSelecionado.value] + 2
           if(mapaArquivos.value.get(itemSelecionado.value) == true){
            pastas.value.splice(index+1, 0, pastaCriada)
          }else{
            ramifica(itemSelecionado.value)
          }
          stompClient.value.publish({
              destination: `/app/mesas/pasta/${route.params.nome}`, 
              body: JSON.stringify({
              criador: authStore.getUser(),
              node: pastaCriada,
              tipo: 'pasta',
              pai: itemSelecionado.value,
              raiz: false
             })
          });
        
    }else {
          raizes.value.push(pastaCriada)
          meuMapa.value[pastaCriada.nome] = -1
          mapaArquivos.value.set(pastaCriada.nome, false)
          pastas.value.splice(0, 0, pastaCriada)
           stompClient.value.publish({
              destination: `/app/mesas/pasta/${route.params.nome}`, 
              body: JSON.stringify({
              criador: authStore.getUser(),
              node: pastaCriada,
              tipo: 'pasta',
              pai: 'raiz',
              raiz: true  // Define o tipo da mensagem, padrão para 'texto'
             })
          });
        

    }
   
  } catch (error) {
    console.error('Erro ao criar pasta:', error)
    if(error.response && error.response.status === 409) {
      alert('Já existe uma pasta com esse nome.')
    } 
    if(error.response.status === 400) {
      alert('Nome de pasta inválido. mantenha o tamanho entre 2 e 20 caracteres')
    }
  }
}
onMounted(() => window.addEventListener('click', fecharMenu))
onUnmounted(() => window.removeEventListener('click', fecharMenu))
// Fecha o menu contextual.
const fecharMenu = () => {
  MenuVisivel.value = false
}

// Exibe o atalho de mensagens antigas ao aproximar o ponteiro do topo.
const onChatMouseMove = (event) => {
  const chatElement = event.currentTarget
  const rect = chatElement.getBoundingClientRect()
  const distanceFromTop = event.clientY - rect.top
  mostrarBotaoMensagensAntigas.value = distanceFromTop <= 110
}

// Oculta o atalho de mensagens antigas ao sair do chat.
const onChatMouseLeave = () => {
  mostrarBotaoMensagensAntigas.value = false
}

// Fecha o menu após selecionar uma ação contextual.
const acaoExibirItem = () => {
  fecharMenu()
}
// Abre o modal de envio de arquivo.
function abrirModalArquivo() {
  document.getElementById('modal2').showModal()
}

// Fecha o modal e limpa os dados do arquivo selecionado.
function fecharModalArquivo() {
  modalArquivoAberto.value = false
  arquivoSelecionado.value = null
  nomeArquivoCustom.value = ''
}
const controlador = ref(false)
// Registra o arquivo e sugere seu nome no formulário.
function handleArquivoSelecionado(event) {
  const file = event.target.files?.[0]
  if (!file) return
  arquivoSelecionado.value = file
  nomeArquivoCustom.value = file.name.replace(/\.[^/.]+$/, '')
}

// Envia o arquivo do modal e atualiza a lista da mesa.
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
    const res = await api.post(`/dxguild/mesa/arquivo/adicionar`, {
      mesa: mesa.value.nome,
      arquivo: url,
      nome: nomeFinal
    })

    arquivosMesa.value.push(res.data ?? { nome: nomeFinal, tipo: 'Arquivo' })
  } catch (error) {
    console.error('Erro ao enviar arquivo para o Cloudinary:', error)
    if(error.response && error.response.status === 400) {
      alert('Erro ao enviar arquivo. Verifique o tamanho e o tipo do arquivo. o Nome do arquivo não pode ser vazio ou maior que 20 caracteres')
    }
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
// Recolhe as pastas já inseridas na lista visível.
function PastaAbertaJa(novo){
 
  novo.forEach(fio => {

      if(pastas.value.find(pasta => pasta.nome === fio.nome)){
        mapaArquivos.value.set(fio.nome, false)
        if(novo){
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
// Abre o painel escolhido na visualização mobile.
function abrirPainelMobile(painel) {
  painelMobile.value = painel
  painelMobileAberto.value = true
}
// Expande ou recolhe uma pasta e atualiza sua árvore visível.
function ramifica(nome){
  
  const index = pastas.value.findIndex(pasta => pasta.nome === nome);
  const novo = pastas.value.find(pasta => pasta.nome === nome)?.filhos
  if(mapaArquivos.value.get(nome) == true){
       PastaAbertaJa(novo)
        mapaArquivos.value.set(nome, false)
       return
  }
  
  if(mapaArquivos.value.has(nome)){
    
     
  
      mapaArquivos.value.set(nome, true)
 
    
  }
  else{
    mapaArquivos.value.set(nome, true)
  }
  if(!meuMapa.value[nome]){
    meuMapa.value[nome] = -1
  }
  if(novo){
    for (const filho of novo) {
    if(pastasSet.value.has(filho.nome)) {
      continue
    }else {
        mapaArquivos.value.set(filho.nome, false)
        meuMapa.value[filho.nome] = meuMapa.value[nome] + 2
        pastasSet.value.add(filho.nome)
        pastas.value.splice(index+1, 0, filho)
        
    }
   
  }
  }
}
// Fecha o painel mobile ativo.
function fecharPainelMobile() {
  painelMobileAberto.value = false
  painelMobile.value = null
}

// Resolve a imagem disponível para o participante.
const participanteFoto = (participante) => participante?.foto || participante?.imagem || participante?.image || participante?.avatar || ''
// Verifica se o participante está marcado como online.
const participanteOnline = (participante) => participante?.online === true || participante?.online === 'true' || participante?.status === 'online' || participante?.conectado === true
// Obtém até duas iniciais para identificar o participante.
const iniciaisParticipante = (nome) => (nome || '?').split(' ').map((parte) => parte[0]).slice(0, 2).join('').toUpperCase()

// Adiciona um dado à rolagem atual.
function adicionarDado(lados) {
  dadosSelecionados.value.push(lados)
}

// Remove um dado da rolagem atual.
function removerDado(indice) {
  dadosSelecionados.value.splice(indice, 1)
}

// Ajusta o bônus da rolagem dentro do limite permitido.
function alterarBonus(valor) {
  const bonusAtual = Number(bonusRolagem.value) || 0
  bonusRolagem.value = Math.max(-99, Math.min(99, bonusAtual + valor))
}

// Normaliza o bônus da rolagem dentro do limite permitido.
function limitarBonus() {
  const bonusAtual = Number(bonusRolagem.value) || 0
  bonusRolagem.value = Math.max(-99, Math.min(99, Math.trunc(bonusAtual)))
}

// Rola os dados selecionados e publica o resultado no chat.
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
    <input
      ref="uploadFichaInput"
      class="input-escondido"
      type="file"
      accept=".pdf,image/*"
      @change="aoSelecionarUploadFicha"
    />
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
        <div class="folder" @contextmenu.prevent="abrirMenu($event, null)">🗂️ Documentos e Links</div>
          <!-- Menu de Contexto -->
          
            <ul class="file-list">
              <li v-for="arquivo in arquivosRaizes" class="lista" >
                <div >
              
                    <img  src="../assets/imgs/pdficon.svg" height="20">
                    <a :href="arquivo.link" target="_blank"><span>{{ arquivo.nome }}</span></a>
                  
                  
                </div>
              </li>
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
          </div>

          <div v-if="activeMasterTab === 'players'" class="master-controls">
            <label class="master-label" for="player-name">Adicionar jogador</label>
            <div class=" d-flex flex-column">
              <div class="input-row">
                <input id="player-name" v-model="novoJogador" type="text" placeholder="Nome do jogador" @keyup.enter="adicionarJogador" />
                <button type="button" class="small-btn" @click="adicionarJogador">Add</button>
              </div>
              
              <p class="error">{{ erroJogador }}</p>
            </div>

            <div class="players-box">
              <div class="players-box-title">Jogadores na mesa</div>
              <ul class="players-list">
                <li v-for="jogador in jogadores" :key="jogador.nome" class="player-ficha-row">
                  <span>{{ jogador.nome }} - Player</span>
                  <div class="ficha-actions-block ficha-actions-block--stacked">
                    <button type="button" class="ficha-label ficha-master-btn" @click="ficha(jogador.nome)">
                      <span class="ficha-button-icon" aria-hidden="true">✦</span>
                      <span>Abrir ficha</span>
                    </button>
                    <button type="button" class="ficha-label ficha-upload-btn" @click="abrirUploadFicha(jogador.nome)">
                      <span class="ficha-button-icon" aria-hidden="true">↑</span>
                      <span>Enviar ficha</span>
                    </button>
                   
                  </div>
                </li>
                <input ref="fileInput" id="ficha" class="input-escondido" type="file" @change="aoSelecionarArquivo">
              </ul>
            </div>

            <p class="helper-text">{{ avisoMestre || 'Controle as fichas dos jogadores da mesa.' }}</p>
          </div>
        </section>

        <section v-else class="panel master-panel">
          <div class="panel-title">Seu painel de ficha</div>
          <p class="panel-subtitle">Gerencie sua ficha na mesa.</p>

          <div class="master-controls">
            <div class="players-box">
              <div class="players-box-title">{{ authStore.getUser() || 'Você' }}</div>
              <div class="ficha-actions-block compact">
         
                <div class="player-ficha-actions compact">
                  <button type="button" class="small-btn secondary ficha-action-btn" @click="ficha(authStore.getUser())">
                    <span class="ficha-button-icon" aria-hidden="true">✦</span>
                    <span>Minha ficha</span>
                  </button>
                  <input ref="fileInput" id="ficha" class="input-escondido" type="file" @change="aoSelecionarArquivo">
                </div>
              </div>
            </div>

            <p class="helper-text">{{ textoFicha(authStore.getUser()) || avisoMestre }}</p>
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
    <div class="panel-title">Arquivos</div>
    
    <!-- Grupo de arquivos dinâmico -->
    <div class="folder-group" >
        <div class="folder" @contextmenu.prevent="abrirMenu($event, null)">🗂️ Documentos e Links</div>
          <!-- Menu de Contexto -->
          
            <ul class="file-list">
              <li v-for="arquivo in arquivosRaizes" class="lista" >
                <div >
              
                    <img  src="../assets/imgs/pdficon.svg" height="20">
                    <a :href="arquivo.link" target="_blank"><span>{{ arquivo.nome }}</span></a>
                  
                  
                </div>
              </li>
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
            <section v-if="painelMobile === 'files'" class="panel mobile-file-panel">
              <div class="panel-title">Arquivos</div>

              <div v-if="mestre" class="mobile-file-tools">
                <button type="button" class="mobile-upload-trigger" @click.prevent="abrirModalArquivo">
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
                  <span class="mobile-upload-label">Adicionar arquivo</span>
                </button>
              </div>

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

            </section>

            <section v-else class="panel">
              <div class="panel-title" v-if="mestre">Painel do Mestre</div>
              <div class="panel-title" v-else>Seu painel de ficha</div>
              
            <label class="master-label" for="player-name">Adicionar jogador</label>
            <div class=" d-flex flex-column">
              <div class="input-row">
                <input id="player-name" v-model="novoJogador" type="text" placeholder="Nome do jogador" @keyup.enter="adicionarJogador" />
                <button type="button" class="small-btn" @click="adicionarJogador">Add</button>
              </div>
              
              <p class="error">{{ erroJogador }}</p>
            </div>  
            
            <div class="players-box">
              <div class="players-box-title">Jogadores na mesa</div>
              <ul class="players-list">
                <li v-for="jogador in jogadores" :key="jogador.nome" class="player-ficha-row">
                  <span>{{ jogador.nome }} - Player</span>
                  <div class="ficha-actions-block ficha-actions-block--stacked">
                    <button type="button" class="ficha-label ficha-master-btn" @click="ficha(jogador.nome)">
                      <span class="ficha-button-icon" aria-hidden="true">✦</span>
                      <span>Abrir ficha</span>
                    </button>
                    <button type="button" class="ficha-label ficha-upload-btn" @click="abrirUploadFicha(jogador.nome)">
                      <span class="ficha-button-icon" aria-hidden="true">↑</span>
                      <span>Enviar ficha</span>
                    </button>
                   
                  </div>
                </li>
                <input ref="fileInput" id="ficha" class="input-escondido" type="file" @change="aoSelecionarArquivo">
              </ul>
            </div>

              <div v-if="mestre" class="master-controls">
                <div class="master-tabs">
                  <button class="master-tab" :class="{ active: activeMasterTab === 'players' }" @click="activeMasterTab = 'players'">Jogadores</button>
                </div>

                <div class="players-box  d-flex flex-column">
                  <div class="players-box-title">Jogadores na mesa</div>
                  <ul class="players-list flex-grow">
                    <li v-for="jogador in jogadores"  :key ="jogador.nome" class="player-ficha-row">
                      <span>{{ jogador.nome }} - Player</span>
                      <div class="ficha-actions-block">
                        <button type="button" class="ficha-label ficha-master-btn" @click="ficha(jogador.nome)">
                          <span class="ficha-button-icon" aria-hidden="true">✦</span>
                          <span>Abrir ficha</span>
                        </button>
                        <button type="button" class="ficha-label ficha-upload-btn" @click="abrirUploadFicha(jogador.nome)">
                          <span class="ficha-button-icon" aria-hidden="true">↑</span>
                          <span>Enviar ficha</span>
                        </button>

                      </div>
                    </li>
                      <input ref="fileInput" id="ficha" class="input-escondido" type="file" @change="aoSelecionarArquivo">
                  </ul>
                </div>

                <p class="helper-text">{{ avisoMestre || 'Controle as fichas dos jogadores da mesa.' }}</p>
              </div>

              <div v-else class="master-controls">
                <div class="players-box">
                  <div class="players-box-title">{{ authStore.getUser() || 'Você' }}</div>
                  <div class="ficha-actions-block player-ficha-block compact">
                    <span class="ficha-section-label">Sua ficha</span>
                    <div class="player-ficha-actions compact">
                      <button type="button" class="small-btn ficha-action-btn" @click="criarFicha(authStore.getUser())">Criar</button>
                      <button type="button" class="small-btn secondary ficha-action-btn" @click="pegarFicha(authStore.getUser())">Baixar</button>
                    </div>
                  </div>
                </div>

                <p class="helper-text">{{ textoFicha(authStore.getUser()) || avisoMestre }}</p>
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
          <div
             
            id="chat"
            class="messages-content"
            @mousemove="onChatMouseMove"
            @mouseleave="onChatMouseLeave"
          >
            <div 
              @click="CarregaMais()"
              class="oldest-scroll-indicator"
              :class="{ visible: mostrarBotaoMensagensAntigas }"
              aria-hidden="true"
              tabindex="-1"
            >
              <svg  class="oldest-scroll-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 6v12" />
                <path d="m6 12 6-6 6 6" />
              </svg>
          </div>
            <div v-for="msg in mensagens" :key="msg.id" class="message-item  d-flex justify-content-start align-items-center">
             
              <div class="w-100 d-flex justify-content-start flex-column align-items-start message-bubble" :class="{ 'message-own': msg.criador === authStore.getUser() }">
                <div class="message-head">
                  <div class="d-flex">
                    <img :src="msg.image" alt="Avatar" class="rounded-circle me-2" width="40" height="40">
                    <strong>{{ msg.criador }}</strong>
                  </div>
                  <span>{{ new Date(msg.dataEnvio).toLocaleTimeString() }} : {{ new Date(msg.dataEnvio).toLocaleDateString() }}</span>
                </div>
                <p v-if="!msg.tipo || msg.tipo === 'texto'" class="break">{{ msg.message ?? msg.input ?? msg.mensagem }}</p>
                <img
                  v-else-if="msg.tipo === 'imagem'"
                  :src="msg.message ?? msg.input ?? msg.mensagem"
                  alt="Imagem enviada no chat"
                  class="message-image"
                  tabindex="0"
                  role="button"
                  @click="abrirImagemExpandida(msg.message ?? msg.input ?? msg.mensagem)"
                  @keydown.enter="abrirImagemExpandida(msg.message ?? msg.input ?? msg.mensagem)"
                  @keydown.space.prevent="abrirImagemExpandida(msg.message ?? msg.input ?? msg.mensagem)"
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

          </div>

          <Teleport to="body">
            <div v-if="diceModalOpen" class="dice-modal-overlay" @click.self="fecharDiceModal">
              <div class="dice-modal" role="dialog" aria-modal="true" aria-label="Rolagem de dados">
              <div class="dice-modal-header">
                <h4>Escolher dados</h4>
                <button type="button" class="ghost-btn" @click="fecharDiceModal">✕</button>
              </div>

              <div class="dice-modal-body">
                <div class="dice-options">
                  <div v-for="lados in [4, 6, 8, 10, 12, 20, 100]" :key="lados" class="dice-option">
                    <span class="dice-shape" :class="`d${lados}`">d{{ lados }}</span>
                    <div class="dice-counter">
                      <button type="button" class="counter-button" :aria-label="`Remover d${lados}`" :disabled="!dadosSelecionados.filter((dado) => dado === lados).length" @click="removerDado(dadosSelecionados.lastIndexOf(lados))">-</button>
                      <span class="dice-count">{{ dadosSelecionados.filter((dado) => dado === lados).length }}</span>
                      <button type="button" class="counter-button" :aria-label="`Adicionar d${lados}`" @click="adicionarDado(lados)">+</button>
                      </div>
                    </div>
                </div>

                <div class="roll-builder modal-roll-builder" aria-label="Dados selecionados">
                  <div class="roll-builder-title">Rolagem</div>
                  <div class="roll-summary" aria-live="polite">
                    <template v-for="(lados, indice) in [4, 6, 8, 10, 12, 20, 100]" :key="lados">
                      <span v-if="dadosSelecionados.filter((dado) => dado === lados).length" class="summary-part">
                        <span v-if="indice > 0 && dadosSelecionados.filter((dado) => dado < lados).length"> + </span>{{ dadosSelecionados.filter((dado) => dado === lados).length }}d{{ lados }}
                      </span>
                    </template>
                    <span v-if="!dadosSelecionados.length" class="summary-empty">Nenhum dado selecionado</span>
                  </div>

                </div>
              </div>

              <div class="roll-bonus">
                <span class="roll-bonus-label">Modificador</span>
                <div class="bonus-controls">
                  <button type="button" class="counter-button" aria-label="Diminuir modificador" @click="alterarBonus(-1)">-</button>
                  <input v-model.number="bonusRolagem" type="number" min="-99" max="99" step="1" aria-label="Modificador da rolagem" @change="limitarBonus" />
                  <button type="button" class="counter-button" aria-label="Aumentar modificador" @click="alterarBonus(1)">+</button>
                </div>
                <output class="bonus-formatted" aria-live="polite">{{ bonusRolagem >= 0 ? '+' : '' }}{{ bonusRolagem || 0 }}</output>
              </div>

              <div class="dice-modal-actions">
                <button type="button" class="secondary-btn" @click="fecharDiceModal">Cancelar</button>
                <button type="button" class="primary-btn" @click="rolarEFechar">Rolar</button>
              </div>
            </div>
          </div>
          </Teleport>
          <textarea
            maxlength="2000"
            ref="campoMensagem"
            v-model="mensagem"
            rows="1"
            placeholder="Escreva uma mensagem..."
            @input="ajustarAlturaMensagem"
            @keydown="tratarTeclaMensagem"
          ></textarea>
          <button type="submit" class="composer-send-btn">
            <span>Enviar</span>
            <span class="send-button-icon" aria-hidden="true">➤</span>
          </button>
        </form>
      </section>
    </div>

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
  <Teleport to="body">
    <div
      v-if="imagemExpandida"
      class="image-modal-overlay"
      @click.self="fecharImagemExpandida"
    >
      <div class="image-modal" role="dialog" aria-modal="true" aria-label="Imagem ampliada">
        <button
          type="button"
          class="image-modal-close"
          aria-label="Fechar imagem"
          @click="fecharImagemExpandida"
        >
          ✕
        </button>
        <img :src="imagemExpandida" alt="Imagem ampliada da mensagem" />
      </div>
    </div>
  </Teleport>
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
  background-color: #101211;
  border: 1px solid rgba(226,186,97, 0.25);
  border-radius: 8px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
}

.jogador-checkbox-card:hover {
  background-color: #191c1a;
  border-color: rgba(226,186,97, 0.6);
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
  color: #f4f2eb;
  font-size: 14px;
  user-select: none;
}

/* Caixinha de seleção customizada */
.custom-checkbox {
  width: 18px;
  height: 18px;
  border: 1px solid rgba(226,186,97, 0.4);
  border-radius: 4px;
  background-color: #101211;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

/* O "Check" (ícone ou fundo) que aparece quando o input estámarcado (:checked) */
.input-escondido:checked + .jogador-label .custom-checkbox {
  background-color: #e2ba61;
  border-color: #e2ba61;
  box-shadow: 0 0 8px rgba(226,186,97, 0.4);
}

/* Mudança visual no card inteiro quando selecionado */
.input-escondido:checked + .jogador-label {
  color: #e2ba61;
  font-weight: 500;
}

.input-escondido:checked ~ .jogador-checkbox-card, /* suporte estrutural */
.jogador-checkbox-card:has(.input-escondido:checked) {
  background: linear-gradient(135deg, #242620 0%, #191c1a 100%);
  border-color: #e2ba61;
}

/* Destaque opcional para o card do Mestre */
.mestre-card {
  border-color: rgba(226,186,97, 0.4);
}
.mesa-page {
  min-height: 100%;
  padding: 0.75rem 0.85rem 0.75rem;
  background:
    radial-gradient(circle at top left, rgba(226,186,97,0.15), transparent 28%),
    linear-gradient(135deg, #101211 0%, #101211 45%, #101211 100%);
  color: #f4f2eb;
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
  background: linear-gradient(135deg, rgba(226,186,97,0.14), rgba(16,18,17,0.72));
  border: 1px solid rgba(226,186,97,0.22);
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
  
  background: linear-gradient(135deg, #242620 0%, #101211 100%);
  border: 1px solid rgba(226,186,97, 0.4);
  border-radius: 8px;
  
  color: #e2ba61; /* Tom amarelado/dourado dos botões da sua interface */
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

/* Efeito ao passar o mouse por cima */
.file-custom-button:hover {
  background: linear-gradient(135deg, #292d26 0%, #191c1a 100%);
  border-color: #e2ba61;
  box-shadow: 0 0 10px rgba(226,186,97, 0.15);
}

/* Tamanho e cor do SVG */
.file-icon {
  width: 20px;
  height: 20px;
  stroke: #e2ba61; /* Mantém o ícone combinando com o texto */
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
  background: linear-gradient(135deg, rgba(226,186,97,0.18), rgba(15,15,15,0.82));  
  height: 90vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #191c1a 0%, #101211 100%);
  border: 1px solid rgba(226,186,97, 0.35);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.8), 
              0 0 15px rgba(226,186,97, 0.05);
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
  border: 1px solid rgba(226,186,97,0.42);
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(226,186,97,0.18), rgba(15,15,15,0.82));
  color: #f3dfb4;
  cursor: pointer;
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.04);
}

.mobile-upload-trigger:hover {
  transform: translateY(-1px);
  border-color: rgba(240,205,129,0.8);
  box-shadow: 0 10px 20px rgba(226,186,97,0.16);
}

.mobile-upload-icon {
  display: block;
  width: 1.05rem;
  height: 1.05rem;
  color: #edcc85;
  flex-shrink: 0;
}

.mobile-upload-label {
  font-size: 0.74rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  line-height: 1;
  text-transform: uppercase;
  color: #f3dfb4;
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
  background: linear-gradient(180deg, rgba(25,28,26,0.98), rgba(16,18,17,0.98));
  border: 1px solid rgba(226,186,97,0.2);
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
  border-bottom: 1px solid rgba(226,186,97,0.12);
}

.file-modal-header h4 {
  margin: 0;
  color: #f3dfb4;
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
  border: 1px dashed rgba(226,186,97,0.5);
  border-radius: 12px;
  background: rgba(255,255,255,0.02);
  color: #e0e2da;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  outline: none;
}

.file-modal-trigger:hover {
  border-color: rgba(226,186,97,0.9);
  background: rgba(226,186,97,0.08);
  color: #edcc85;
}

.file-modal-selected {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.65rem 0.75rem;
  border-radius: 10px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(226,186,97,0.14);
  color: #c4c8c0;
  font-size: 0.76rem;
  word-break: break-word;
  overflow-wrap: anywhere;
}

.file-modal-label,
.file-modal-field-label {
  color: #f3dfb4;
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
  border: 1px solid rgba(226,186,97,0.28);
  background: rgba(0,0,0,0.38);
  color: #f4f2eb;
}

.file-modal-actions {
  border-top: 1px solid rgba(226,186,97,0.12);
  border-bottom: none;
  justify-content: flex-end;
}

.header-image-wrap {
  width: 34px;
  min-width: 34px;
  height: 34px;
  border-radius: 50%;
  overflow: hidden;
  border: 1px solid rgba(226,186,97,0.24);
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
  background: rgba(226,186,97,0.18);
  color: #f3dfb4;
  font-size: 0.54rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  border: 1px solid rgba(226,186,97,0.24);
}

.status-pill.subtle {
  background: rgba(255,255,255,0.06);
}

.eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #c4c8c0;
  font-size: 0.54rem;
  margin: 0;
}

.mesa-title {
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: clamp(0.95rem, 1.8vw, 1.25rem);
  line-height: 1.1;
  color: #f3dfb4;
  margin: 0;
}

.header-divider {
  color: #ad8e52;
  opacity: 0.85;
  font-size: 0.8rem;
}
.meu-menu-flutuante {
  position: fixed;        /* Faz flutuar na tela exatamente onde o mouse clicou */
  top: 0;                 /* Valor base, será sobrescrito pelo :style do Vue */
  left: 0;                /* Valor base, será sobrescrito pelo :style do Vue */
  z-index: 9999999 ;          /* Garante que fique por cima de tudo */
  background-color: #191c1a; /* Cor de fundo escura (estilo dark) */
  color: #fff;            /* Cor do texto */
  border: 1px solid #343831; /* Bordinha discreta */
  border-radius: 6px;     /* Cantos arredondados */
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3); /* Sombra elegante */
  list-style: none;       /* Remove as bolinhas da lista */
  padding: 4px 0;         /* Espaçamento interno */
  min-width: 160px;       /* Largura mínima */
  margin: 0;
   /* Posição horizontal baseada no clique */
}
.header-meta {
  color: #c4c8c0;
  font-size: 0.67rem;
  white-space: nowrap;
}

.description {
  color: #b5b9b3;
  max-width: 720px;
}

.ghost-btn {
  border: 1px solid rgba(226,186,97,0.3);
  background: rgba(255,255,255,0.04);
  color: #f3dfb4;
  padding: 0.36rem 0.6rem;
  border-radius: 999px;
  font-size: 0.72rem;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.ghost-btn:hover {
  transform: translateY(-1px);
  border-color: rgba(226,186,97,0.6);
  box-shadow: 0 8px 20px rgba(226,186,97,0.16);
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
  background: linear-gradient(180deg, rgba(25,28,26,0.96), rgba(16,18,17,0.96));
  border: 1px solid rgba(226,186,97,0.16);
  border-radius: 16px;
  padding: 1rem;
  box-shadow: 0 10px 24px rgba(0,0,0,0.28);
  animation: fadeInUp 0.35s ease both;
  backdrop-filter: blur(8px);
}

.panel-title {
  font-family: 'Cormorant Garamond', Georgia, serif;
  color: #f3dfb4;
  margin-bottom: 0.7rem;
}

.master-panel {
  background: linear-gradient(135deg, rgba(226,186,97,0.16), rgba(16,18,17,0.92));
  border: 1px solid rgba(226,186,97,0.24);
}

.panel-subtitle {
  color: #b5b9b3;
  font-size: 0.9rem;
  margin-bottom: 0.7rem;
  line-height: 1.4;
}

.panel-description {
  color: #c4c8c0;
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
  background: rgba(226,186,97,0.12);
  color: #f3dfb4;
  font-size: 0.78rem;
  border: 1px solid rgba(226,186,97,0.18);
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
  border: 1px solid rgba(226,186,97,0.2);
  border-radius: 999px;
  background: rgba(255,255,255,0.03);
  color: #b5b9b3;
  padding: 0.45rem 0.6rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.master-tab.active {
  background: linear-gradient(135deg, #e2ba61, #f0cd81);
  color: #000;
  font-weight: 700;
}

.master-label {
  color: #f3dfb4;
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
  border: 1px solid rgba(226,186,97,0.25);
  background: rgba(0,0,0,0.45);
  color: #f4f2eb;
}

.small-btn,
.master-action-btn {
  border: none;
  border-radius: 8px;
  padding: 0.7rem 0.85rem;
  background: linear-gradient(135deg, #e2ba61, #f0cd81);
  color: #000;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.small-btn.secondary {
  background: rgba(255,255,255,0.06);
  color: #f3dfb4;
  border: 1px solid rgba(226,186,97,0.2);
}

.small-btn:hover,
.master-action-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 18px rgba(226,186,97,0.22);
}

.master-action-btn.secondary {
  background: rgba(255,255,255,0.06);
  color: #f3dfb4;
  border: 1px solid rgba(226,186,97,0.2);
}

.select-row {
  display: flex;
  gap: 0.5rem;
}

.player-select {
  flex: 1;
  padding: 0.7rem 0.75rem;
  border-radius: 8px;
  border: 1px solid rgba(226,186,97,0.25);
  background: rgba(0,0,0,0.45);
  color: #f4f2eb;
}

.master-action-btn {
  width: 100%;
}

.players-box {
  border: 1px solid rgba(226,186,97,0.14);
  border-radius: 12px;
  padding: 0.7rem;
  background: rgba(255,255,255,0.04);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.03);
}

.players-box-title {
  font-size: 0.85rem;
  font-weight: 700;
  color: #f3dfb4;
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
  color: #c4c8c0;
  border: 1px solid rgba(255,255,255,0.04);
}

.player-ficha-row {
  display: flex;
  align-items: flex-start;
  flex-direction: column;
  gap: 0.6rem;
}

.ficha-master-btn {
  align-self: stretch;
}

.ficha-actions-block--stacked {
  width: min(100%, 260px);
  align-items: center;
  margin: 0 auto;
}

.ficha-actions-block--stacked .ficha-label {
  width: 100%;
  min-height: 2.35rem;
}

.ficha-actions-block--stacked .ficha-upload-btn {
  margin-left: 0;
}

.ficha-actions-block {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 0.35rem;
  min-width: 180px;
}

.ficha-actions-block.compact {
  min-width: 0;
}

.ficha-label {
  font-family: inherit;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  justify-content: center;
  padding: 0.45rem 0.7rem;
  border: 1px solid rgba(226,186,97,0.35);
  border-radius: 999px;
  background: linear-gradient(135deg, rgba(226,186,97,0.2), rgba(240,205,129,0.08));
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #f3dfb4;
  cursor: pointer;
  transition: transform 0.2s ease, border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease, color 0.2s ease;
}

.ficha-label:hover,
.ficha-label:focus-visible {
  transform: translateY(-2px);
  border-color: #f0cd81;
  background: linear-gradient(135deg, rgba(226,186,97,0.5), rgba(240,205,129,0.2));
  color: #f3dfb4;
  box-shadow: 0 8px 18px rgba(226,186,97,0.28), 0 0 0 3px rgba(226,186,97,0.1);
  outline: none;
}

.ficha-button-icon {
  color: #f0cd81;
  font-size: 0.8rem;
  line-height: 1;
  transition: transform 0.2s ease;
}

.ficha-section-label {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  color: #f0cd81;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.ficha-label:hover .ficha-button-icon,
.ficha-label:focus-visible .ficha-button-icon {
  transform: rotate(18deg) scale(1.15);
}

.player-ficha-actions {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  flex-wrap: wrap;
  width: 100%;
}

.player-ficha-actions.compact {
  justify-content: center;
}

.ficha-action-btn {
  flex: 1 1 90px;
  min-width: 88px;
  min-height: 2.6rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  border: 1px solid rgba(240,205,129,0.45);
  background: linear-gradient(135deg, #b7954f, #e2ba61 55%, #f0cd81);
  color: #171106;
  box-shadow: 0 10px 18px rgba(226,186,97, 0.24);
}

.ficha-action-btn:hover,
.ficha-action-btn:focus-visible {
  transform: translateY(-3px) scale(1.02);
  border-color: #f0cd81;
  background: linear-gradient(135deg, #e2ba61, #edcc85 55%, #f3dfb4);
  box-shadow: 0 14px 28px rgba(226,186,97, 0.38), 0 0 0 3px rgba(226,186,97,0.12);
  outline: none;
}

.link-btn {
  border: none;
  background: transparent;
  color: #e2ba61;
  cursor: pointer;
  font-weight: 700;
  padding: 0;
}

.file-pill {
  font-size: 0.78rem;
  color: #e2ba61;
  font-weight: 700;
}

.helper-text {
  color: #b5b9b3;
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
  border: 1px solid rgba(226,186,97,0.12);
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
  border: 1px solid rgba(226,186,97,0.3);
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(226,186,97,0.3), rgba(40,40,40,0.9));
  color: #f3dfb4;
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
  color: #f3dfb4;
  font-size: 0.78rem;
}

.member-info span {
  color: #b5b9b3;
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
  color: #c4c8c0;
  margin-bottom: 0.25rem;
}
.meu-menu-item {
  padding: 8px 16px;
  cursor: pointer;
  white-space: nowrap;
  z-index:9999;
}

.meu-menu-item:hover {
  background-color: #292d26; /* Cor ao passar o mouse */
}
ul {
  list-style: none;
  padding-left: 0.25rem;
  color: #b5b9b3;
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
  background: linear-gradient(180deg, rgba(25,28,26,0.96), rgba(16,18,17,0.98));
  border: 1px solid rgba(226,186,97,0.16);
  border-radius: 14px;
  width: 100% !important;
  min-height: 0;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.04);
  overflow: hidden;
}
.error{
  color: red;
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
  overflow-y: auto;
}

.oldest-scroll-indicator {
  position: sticky;
  top: 0;
  left: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 2.7rem;
  background: transparent;
  opacity: 0;
  visibility: hidden;
  transform: translateY(-10px);
  transition: opacity 0.2s ease, visibility 0.2s ease, transform 0.2s ease;
  user-select: none;
}

.oldest-scroll-indicator.visible {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
}

.oldest-scroll-icon {
  width: 1.25rem;
  height: 1.25rem;
  stroke: rgba(240,205,129, 0.9);
  fill: none;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
  filter: drop-shadow(0 0 8px rgba(226,186,97, 0.25));
}

/* Dice modal styles */
.dice-modal-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  box-sizing: border-box;
  background: rgba(0,0,0,0.45);
  z-index: 2100; /* above drawer/composer */
}

.dice-modal {
  box-sizing: border-box;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  background: linear-gradient(180deg, rgba(25,28,26,0.98), rgba(16,18,17,0.98));
  border: 1px solid rgba(226,186,97,0.16);
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
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.dice-options {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.5rem;
  width: 100%;
  box-sizing: border-box;
}

.dice-modal .dice-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  gap: 0.55rem;
  min-width: 0;
  min-height: 7rem;
  padding: 0.65rem 0.35rem;
  border-radius: 10px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(226,186,97,0.16);
  color: #f4f2eb;
}

.dice-modal .dice-option:hover {
  border-color: rgba(226,186,97,0.65);
  background: rgba(226,186,97,0.08);
}

.dice-counter {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  width: 100%;
  box-sizing: border-box;
}

.counter-button {
  width: 2rem;
  height: 2rem;
  min-width: 2rem;
  border: 1px solid rgba(226,186,97,0.35);
  border-radius: 8px;
  background: #191c1a;
  color: #e2ba61;
  font-size: 1.35rem;
  line-height: 1;
  cursor: pointer;
}

.counter-button:hover:not(:disabled),
.counter-button:focus-visible {
  background: rgba(226,186,97,0.16);
  border-color: #e2ba61;
}

.counter-button:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.dice-count {
  color: #f4f2eb;
  font-weight: 800;
  text-align: center;
}

.modal-roll-builder {
  position: static;
  width: 100%;
  min-width: 0;
}

.roll-summary {
  position: static;
  width: 100%;
  box-sizing: border-box;
  min-height: 2.4rem;
  margin-bottom: 0.7rem;
  padding: 0.65rem 0.75rem;
  border: 1px solid rgba(226,186,97,0.18);
  border-radius: 8px;
  background: #101211;
  color: #e2ba61;
  font-weight: 700;
}

.summary-part + .summary-part::before {
  content: ' + ';
  color: #b5b9b3;
}

.summary-empty {
  color: #939a94;
  font-weight: 500;
}

.dice-modal-actions { display:flex; justify-content:flex-end; gap:0.5rem; }
.primary-btn { background:linear-gradient(90deg,#e2ba61,#edcc85); border:0; padding:0.5rem 0.8rem; border-radius:8px; color:#0a0a0a; font-weight:700; }
.secondary-btn { background:transparent; border:1px solid rgba(226,186,97,0.12); padding:0.45rem 0.65rem; border-radius:8px; color:#f4f2eb; }

@media (max-width:900px) {
  .dice-modal-overlay {
    padding: 0;
  }

  .dice-modal {
    width: 100%;
    max-width: none;
    max-height: 100vh;
    min-height: 100vh;
    border-radius: 0;
    padding: 1rem 0.85rem;
    justify-content: center;
  }
  .dice-modal-header,
  .dice-modal-body,
  .roll-bonus,
  .dice-modal-actions {
    width: 100%;
    box-sizing: border-box;
  }
  .dice-modal-body {
    gap: 0.7rem;
  }
  .dice-options {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.4rem;
  }
  .dice-modal .dice-option {
    min-height: 6.2rem;
    padding: 0.5rem 0.25rem;
  }
  .counter-button,
  .bonus-controls .counter-button {
    width: 2.75rem;
    height: 2.75rem;
    min-width: 2.75rem;
  }
  .dice-modal-actions {
    padding-bottom: calc(env(safe-area-inset-bottom,0px) + 0.5rem);
  }
  .dice-modal-actions > button {
    flex: 1;
    min-height: 2.75rem;
  }
}

@media (max-width: 480px) {
  .dice-options {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .dice-modal {
    padding: 0.75rem;
    gap: 0.55rem;
  }
  .dice-modal .dice-option {
    min-height: 5.7rem;
  }
}

@media (max-width: 639px) {
  .dice-options {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
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
  background: rgba(226,186,97,0.35); /* subtle dark gold */
  border-radius: 999px;
  border: 1px solid rgba(0,0,0,0.18);
}

.messages-content::-webkit-scrollbar-thumb:hover {
  background: rgba(226,186,97,0.7);
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
  background: rgba(226,186,97,0.35);
  border-radius: 999px;
  border: 1px solid rgba(0,0,0,0.18);
}

.sidebar::-webkit-scrollbar-thumb:hover,
.mobile-panel-sheet::-webkit-scrollbar-thumb:hover {
  background: rgba(226,186,97,0.7);
}

/* Firefox */
.messages-content,
.sidebar,
.mobile-panel-sheet {
  scrollbar-width: thin;
  scrollbar-color: rgba(226,186,97,0.45) transparent;
}

.message-item {
  width: 100%;
  position: relative;
  z-index: 1;
}
    
.message-item {
  padding: 0.68rem 0.8rem;
  border-bottom: 1px solid rgba(226,186,97,0.08);
  transition: background 0.2s ease;
  position: relative;
  z-index: 1;
}

.message-item:hover {
  background: rgba(226,186,97,0.04);
  transform: translateX(2px);
}

.message-head {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.18rem;
  color: #f3dfb4;
}

.message-head span {
  color: #939a94;
  font-size: 0.72rem;
}

.message-item p {
  color: #c4c8c0;
  line-height: 1.4;
  font-size: 0.92rem;
}

.message-image {
  display: block;
  width: min(100%, 360px);
  height: 220px;
  max-width: 100%;
  margin-top: 0.35rem;
  border: 1px solid rgba(226,186,97,0.24);
  border-radius: 10px;
  object-fit: cover;
  background: rgba(0,0,0,0.3);
  cursor: zoom-in;
  transition: filter 0.2s ease, transform 0.2s ease;
}

.message-image:hover,
.message-image:focus-visible {
  filter: brightness(1.12);
  outline: none;
  transform: scale(1.01);
}

.image-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 2200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: rgba(0, 0, 0, 0.86);
}

.image-modal {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: min(100%, 1100px);
  height: min(100%, 850px);
}

.image-modal > img {
  display: block;
  max-width: 100%;
  max-height: 100%;
  border: 1px solid rgba(226,186,97, 0.4);
  border-radius: 10px;
  object-fit: contain;
  box-shadow: 0 1rem 3rem rgba(0, 0, 0, 0.7);
}

.image-modal-close {
  position: absolute;
  top: -0.75rem;
  right: -0.75rem;
  z-index: 1;
  display: grid;
  width: 2.25rem;
  height: 2.25rem;
  place-items: center;
  border: 1px solid rgba(226,186,97, 0.5);
  border-radius: 50%;
  background: #191c1a;
  color: #f0cd81;
  cursor: pointer;
  font-size: 1rem;
}

.image-modal-close:hover,
.image-modal-close:focus-visible {
  background: #292d26;
  outline: none;
}

.roll-message {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  max-width: 100%;
  padding: 0.55rem 0.75rem;
  border: 1px solid rgba(226,186,97,0.32);
  border-radius: 10px;
  background: linear-gradient(135deg, rgba(226,186,97,0.18), rgba(0,0,0,0.24));
  color: #f3dfb4;
  font-weight: 700;
}

.roll-message-icon {
  display: inline-grid;
  flex: 0 0 auto;
  place-items: center;
  width: 1.6rem;
  height: 1.6rem;
  color: #f0cd81;
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
  border: 1px solid rgba(226,186,97,0.16);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.03);
}

.composer > textarea {
  flex: 1 1 auto;
  min-width: 0;
  box-sizing: border-box;
  max-height: 140px;
  min-height: 42px;
  padding: 0.7rem 0.8rem;
  border-radius: 1.25rem;
  border: 1px solid rgba(226,186,97,0.2);
  background: rgba(0,0,0,0.45);
  color: #f4f2eb;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.04);
  font-size: 0.9rem;
  line-height: 1.4;
  resize: none;
  overflow-y: auto;
  overflow-wrap: anywhere;
  scrollbar-width: thin;
  scrollbar-color: rgba(226,186,97,0.7) rgba(0,0,0,0.35);
}

.composer > textarea::-webkit-scrollbar {
  width: 6px;
}

.composer > textarea::-webkit-scrollbar-track {
  margin-block: 0.65rem;
  border-radius: 999px;
  background: rgba(0,0,0,0.35);
}

.composer > textarea::-webkit-scrollbar-thumb {
  border: 1px solid rgba(240,205,129,0.35);
  border-radius: 999px;
  background: linear-gradient(180deg, #e2ba61, #b7954f);
}

.composer > textarea::-webkit-scrollbar-thumb:hover {
  background: #f0cd81;
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
  border: 1px solid rgba(226,186,97,0.24);
  border-radius: 50%;
  background: rgba(0,0,0,0.32);
  color: #f0cd81;
  cursor: pointer;
  transition: all 0.2s ease;
}

.composer-icon-btn:hover,
.dice-picker:focus-within .dice-trigger {
  border-color: rgba(240,205,129,0.7);
  background: rgba(226,186,97,0.14);
  box-shadow: 0 0 16px rgba(226,186,97,0.18);
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
  border: 1px solid rgba(226,186,97,0.34);
  border-radius: 12px;
  background: rgba(16,18,17,0.98);
  box-shadow: 0 12px 30px rgba(0,0,0,0.48);
}

.roll-builder-title {
  margin-bottom: 0.5rem;
  color: #f0cd81;
  font-family: 'Cormorant Garamond', Georgia, serif;
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
  border: 1px solid rgba(226,186,97,0.28);
  border-radius: 999px;
  background: rgba(226,186,97,0.12);
  color: #f3dfb4;
  font-size: 0.76rem;
  font-weight: 700;
  cursor: pointer;
}

.selected-die:hover {
  border-color: rgba(240,205,129,0.7);
  background: rgba(226,186,97,0.22);
}

.selected-die span {
  margin-left: 0.2rem;
  color: #f0cd81;
}

.roll-bonus {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 0.6rem;
  margin: 0;
  padding: 0.65rem 0.75rem;
  border: 1px solid rgba(226,186,97,0.18);
  border-radius: 8px;
  background: #191c1a;
  color: #b5b9b3;
  font-size: 0.78rem;
  font-weight: 700;
}

.roll-bonus-label {
  color: #e2ba61;
  white-space: nowrap;
}

.bonus-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.bonus-controls input {
  box-sizing: border-box;
  width: 4.25rem;
  min-height: 2rem;
  padding: 0.35rem 0.45rem;
  border: 1px solid rgba(226,186,97,0.28);
  border-radius: 7px;
  background: rgba(0,0,0,0.38);
  color: #f3dfb4;
  text-align: center;
}

.bonus-controls .counter-button {
  width: 2rem;
  height: 2rem;
  min-width: 2rem;
}

.bonus-formatted {
  min-width: 2.25rem;
  color: #e2ba61;
  text-align: right;
}

.roll-button {
  width: 100%;
  padding: 0.48rem 0.6rem;
  border: 0;
  border-radius: 8px;
  background: linear-gradient(135deg, #e2ba61, #f0cd81);
  color: #000;
  font-weight: 800;
  cursor: pointer;
}

.roll-button:hover {
  box-shadow: 0 6px 16px rgba(226,186,97,0.24);
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
  border: 1px solid rgba(226,186,97,0.28);
  border-radius: 12px;
  background: rgba(16,18,17,0.98);
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
  color: #c4c8c0;
  font-size: 0.76rem;
  font-weight: 700;
  cursor: pointer;
}

.dice-option:hover,
.dice-option:focus-visible {
  border-color: rgba(226,186,97,0.34);
  background: rgba(226,186,97,0.13);
  outline: none;
}

.dice-shape {
  color: #f0cd81;
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
  background: linear-gradient(135deg, #e2ba61, #f0cd81);
  color: #000;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 10px 24px rgba(226,186,97,0.18);
  transition: transform 0.2s ease;
  font-size: 0.82rem;
}

.composer > button:hover {
  transform: translateY(-1px);
  box-shadow: 0 12px 24px rgba(226,186,97,0.24);
}

.composer-send-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  min-width: 6.2rem;
  border: 1px solid rgba(255,248,190,0.6);
  background: linear-gradient(135deg, #b7954f, #e2ba61 52%, #edcc85);
  box-shadow: 0 10px 24px rgba(226,186,97,0.3), inset 0 1px 0 rgba(255,255,255,0.35);
  transition: transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease;
}

.composer-send-btn:hover,
.composer-send-btn:focus-visible {
  transform: translateY(-3px) scale(1.03);
  filter: brightness(1.1);
  box-shadow: 0 15px 30px rgba(226,186,97,0.42), 0 0 0 3px rgba(226,186,97,0.14), inset 0 1px 0 rgba(255,255,255,0.5);
  outline: none;
}

.send-button-icon {
  font-size: 1rem;
  transition: transform 0.2s ease;
}

.composer-send-btn:hover .send-button-icon,
.composer-send-btn:focus-visible .send-button-icon {
  transform: translateX(3px) rotate(-8deg);
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

  .messages {
    background: #000;
  }

  .messages-backdrop,
  .messages::after {
    display: none;
  }

  /* Composer fixed at bottom on mobile */
  /* Use a CSS variable to keep composer height in sync with messages padding without JS. */
  .composer {
    --composer-height: 176px;
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
    height: auto;
    min-height: 56px;
    max-height: var(--composer-height);
    align-items: flex-end;
    box-sizing: border-box;
  }

  .composer > textarea {
    min-height: 3.5rem;
    padding-block: 0.5rem;
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
    border: 1px solid rgba(226,186,97,0.14);
    background: rgba(0,0,0,0.18);
    color: #f3dfb4;
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
    color: #c4c8c0;
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
    color: #b5b9b3;
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
    border: 1px solid rgba(226,186,97,0.18);
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
    background: linear-gradient(180deg, rgba(25,28,26,0.98), rgba(16,18,17,0.98));
    border-left: 1px solid rgba(226,186,97,0.18);
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
    color: #f3dfb4;
    font-family: 'Cormorant Garamond', Georgia, serif;
  }

  .mobile-panel-content {
    color: #c4c8c0;
  }

  .mobile-panel-content .player-ficha-row {
    align-items: flex-start;
    flex-direction: column;
    gap: 0.25rem;
  }

  .mobile-panel-content .player-ficha-row > span:first-child {
    display: block;
    width: 100%;
    min-width: 0;
    overflow-wrap: anywhere;
  }

  .mobile-panel-content .player-ficha-row .ficha-actions-block {
    align-items: flex-start;
    min-width: 0;
    width: 100%;
  }

  .mobile-panel-content .player-ficha-row .ficha-label {
    justify-content: flex-start;
  }

  .mobile-file-panel {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .mobile-file-tools {
    margin-top: -0.15rem;
    margin-bottom: 0.15rem;
  }

  .mobile-folder-group {
    margin: 0;
  }

  .mobile-file-list {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    padding: 0;
    margin: 0;
  }

  .mobile-file-item {
    list-style: none;
    margin: 0;
  }

  .mobile-file-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    min-height: 1.8rem;
    color: #c4c8c0;
  }

  .mobile-file-icon {
    width: 1.05rem;
    height: 1.05rem;
    flex-shrink: 0;
  }

  .mobile-file-link {
    color: #c4c8c0;
    text-decoration: none;
    word-break: break-word;
    overflow-wrap: anywhere;
  }

  .mobile-folder-row {
    display: flex;
    align-items: center;
    min-height: 1.8rem;
    color: #c4c8c0;
  }

  .mobile-folder-content {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    margin-top: 0.2rem;
    padding-left: 0.2rem;
  }

  .mobile-child-file {
    margin-left: 0.2rem;
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
    background: linear-gradient(90deg, #ebcb7d 0%, #d6ae55 100%);
    border: 1px solid rgba(226,186,97,0.18);
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
    color: #c4c8c0;
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

/* Fontes locais compartilhadas com a home; medidas e layout preservados. */
.mesa-page, .file-modal, .dice-modal, .mobile-panel-sheet,
.meu-menu-flutuante, .arquivo-modal {
  font-family: 'Manrope', 'Segoe UI', system-ui, sans-serif;
}
button, input, select, textarea {
  font-family: 'Manrope', 'Segoe UI', system-ui, sans-serif;
}
</style>
