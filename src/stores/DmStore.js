import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '@/services/api.js';
import { useAuthStore } from '@/stores/auth.js';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
export const useMensagensStore = defineStore('mensagens', () => {
  const lista = ref([]);
  const listaLida = ref([]);
  const stompClient = ref(null);
  const carregarMensagens = async () => {
    try{
        const res = await api.get(`http://localhost:8080/dxguild/direct/${encodeURIComponent(useAuthStore().getUser())}`);
        const messages = res.data;
        messages.forEach((message) => {
            if(message.visto === false) {
                lista.value.push(message);
            }
            else{
                listaLida.value.push(message);
            }
        })
        lista.value = lista.value.sort((a, b) => new Date(b.data) - new Date(a.data));
        listaLida.value = listaLida.value.sort((a, b) => new Date(b.data) - new Date(a.data));
    }catch(e){
        console.log(e)
    }
  };
  const conexao = () => {
    // Se já existe um cliente e ele está ativo/conectado, não faz nada
    if (stompClient.value && stompClient.value.connected) {
        return;
    }
    
    const socket = new SockJS('http://localhost:8080/dx-rpg');

    stompClient.value = new Client({
        webSocketFactory: () => socket,
        onConnect: () => {
            stompClient.value.subscribe(`/topic/user/${encodeURIComponent(useAuthStore().getUser())}`, (mensagemRecebida) => {
                const mensagem = JSON.parse(mensagemRecebida.body);
                lista.value.push(mensagem);
                lista.value.sort((a, b) => new Date(b.data) - new Date(a.data));
            });
        }    
    });

    stompClient.value.activate();
}
   
    const desconectar = () => {
        if (stompClient.value) {
            stompClient.value.deactivate();
            stompClient.value = null;
        }
    };
    const enviarMensagem = (destino, dados) => {
    if (!stompClient.value || !stompClient.value.connected) {
      console.error("WebSocket não está conectado!");
      return;
    }

    stompClient.value.publish({
      destination: destino,
      body: JSON.stringify(dados)
    });
  };
   const marcarComoLida = async (mesa) => { 
        for(let i = 0; i < lista.value.length; i++) {
            console.log("aqui o" + lista.value[i].mesa, mesa)
            if(lista.value[i].mesa === mesa) {
                console.log("entrou" + lista.value[i].lida)
                lista.value[i].visto = true;
                let removido = lista.value.splice(i, 1)[0]; // Remove a mensagem da lista de não lidas
                listaLida.value.push(removido);
                i--;
            }
    } 
   }   

  // Não se esqueça de incluir 'enviarMensagem' no return da store!
  return { lista, listaLida, carregarMensagens, conexao, desconectar, stompClient, enviarMensagem, marcarComoLida };

});
  