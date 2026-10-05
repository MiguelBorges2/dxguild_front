import { ref } from 'vue'
import { defineStore } from 'pinia'
import { useMensagensStore } from '@/stores/DmStore.js'
export const useAuthStore = defineStore('auth', () => {
  const mensagensStore = useMensagensStore()
  const token = ref(localStorage.getItem('token') || null)
  const refresh = ref(localStorage.getItem('refresh') || null)
  const Navcontroller = ref(Boolean(token.value))
  const user = ref(localStorage.getItem('chat_nome') || null);
  const imagem = ref(localStorage.getItem('chat_imagem') || null);

  // Atualiza o nome do usuário em memória.
  function setUser(newUser) {
    user.value = newUser
  }
  // Retorna o nome do usuário atual.
  function getUser() {
    return user.value
  }

  // Retorna a imagem do usuário atual.
  function getImagem() {
    return imagem.value
  }
 // Atualiza os dados do usuário e reconecta as mensagens diretas.
 const setUsuario = (novoNome, novaImagem) => {
        user.value = novoNome;
        imagem.value = novaImagem; 
        localStorage.setItem('chat_nome', novoNome);
        localStorage.setItem('chat_imagem', novaImagem);
        mensagensStore.desconectar();
        mensagensStore.conexao();
       
    };
  // Salva ou remove os tokens de autenticação.
  function setToken(newToken, newRefresh) {
    token.value = newToken
    Navcontroller.value = Boolean(newToken)
    if (newToken) {
      localStorage.setItem('token', newToken)
    } else {
      localStorage.removeItem('token')
    }
    refresh.value = newRefresh
    if (newRefresh) {
      localStorage.setItem('refresh', newRefresh)
    } else {
      localStorage.removeItem('refresh')
    }
  }

 

  // Limpa os tokens de autenticação.
  function clearToken() {
    token.value = null
    Navcontroller.value = false
    localStorage.removeItem('token')
    refresh.value = null
    localStorage.removeItem('refresh')
  }

  // Retorna o token de acesso.
  function getToken() {
    return token.value
  }
  // Retorna o token de renovação.
  function getRefresh(){
    return refresh.value
  }
  return {
  token,
  refresh,
  Navcontroller,
  user,        // <- adicionado
  imagem,      // <- adicionado, já que você usa authStore.getImagem() também, mas o ref cru é útil expor
  setToken,
  clearToken,
  getToken,
  getRefresh,
  getUser,
  setUser,
  getImagem,
  setUsuario
}
})
