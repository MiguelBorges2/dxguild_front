import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/services/api.js'
import { useAuthStore } from '@/stores/auth.js'
import SockJS from 'sockjs-client'
import { Client } from '@stomp/stompjs'

export const useMensagensStore = defineStore('mensagens', () => {
  const lista = ref([])
  const listaLida = ref([])
  const stompClient = ref(null)
  let connectPromise = null

  const carregarMensagens = async () => {
    try {
      const res = await api.get(`/dxguild/direct/${encodeURIComponent(useAuthStore().getUser())}`)
      res.data.forEach((message) => {
        if (message.visto === false) lista.value.push(message)
        else listaLida.value.push(message)
      })
      lista.value.sort((a, b) => new Date(b.data) - new Date(a.data))
      listaLida.value.sort((a, b) => new Date(b.data) - new Date(a.data))
    } catch (error) {
      console.error('Erro ao carregar mensagens diretas:', error)
    }
  }

  const conexao = () => {
    if (stompClient.value?.connected) return Promise.resolve(true)
    if (connectPromise) return connectPromise

    const authStore = useAuthStore()
    const usuario = authStore.getUser()
    const token = authStore.getToken()
    if (!usuario || !token) return Promise.reject(new Error('Usuario nao autenticado para mensagens diretas.'))

    lista.value = []
    listaLida.value = []
    connectPromise = new Promise((resolve, reject) => {
      stompClient.value = new Client({
        webSocketFactory: () => new SockJS('/dx-rpg'),
        connectHeaders: { Authorization: `Bearer ${token}` },
        reconnectDelay: 5000,
        connectionTimeout: 10000,
        onConnect: () => {
          stompClient.value.subscribe(`/topic/user/${encodeURIComponent(usuario)}`, (mensagemRecebida) => {
            const mensagem = JSON.parse(mensagemRecebida.body)
            lista.value.push(mensagem)
            lista.value.sort((a, b) => new Date(b.data) - new Date(a.data))
          })
          carregarMensagens()
          connectPromise = null
          resolve(true)
        },
        onStompError: (frame) => {
          connectPromise = null
          reject(new Error(frame.headers.message || 'Erro no servidor de mensagens.'))
        },
        onWebSocketError: () => {
          connectPromise = null
          reject(new Error('Nao foi possivel conectar ao servidor de mensagens.'))
        }
      })
      stompClient.value.activate()
    })
    return connectPromise
  }

  const desconectar = () => {
    if (stompClient.value) {
      stompClient.value.deactivate()
      stompClient.value = null
    }
    connectPromise = null
  }

  const enviarMensagem = async (destino, dados) => {
    try {
      if (!stompClient.value?.connected) await conexao()
      const token = useAuthStore().getToken()
      if (!stompClient.value?.connected || !token) throw new Error('WebSocket nao esta conectado.')

      stompClient.value.publish({
        destination: destino,
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(dados)
      })
      return true
    } catch (error) {
      console.error('Falha ao enviar mensagem direta:', error)
      return false
    }
  }

  const marcarComoLida = async (mesa) => {
    for (let i = 0; i < lista.value.length; i++) {
      if (lista.value[i].mesa === mesa) {
        lista.value[i].visto = true
        listaLida.value.push(lista.value.splice(i, 1)[0])
        i--
      }
    }
  }

  return { lista, listaLida, carregarMensagens, conexao, desconectar, stompClient, enviarMensagem, marcarComoLida }
})
