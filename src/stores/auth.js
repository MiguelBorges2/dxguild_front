import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || null)
  const refresh = ref(localStorage.getItem('refresh') || null)
  const Navcontroller = ref(Boolean(token.value))
  const user = ref(localStorage.getItem('chat_nome') || null);
  const imagem = ref(localStorage.getItem('chat_imagem') || null);
  function setUser(newUser) {
    user.value = newUser
  }
  function getUser() {
    return user.value
  }

  function getImagem() {
    return imagem.value
  }
 const setUsuario = (novoNome, novaImagem) => {
        user.value = novoNome;
        imagem.value = novaImagem; // <--- Atualiza a variável reativa da imagem também

        // Salva no navegador usando as mesmas chaves
        localStorage.setItem('chat_nome', novoNome);
        localStorage.setItem('chat_imagem', novaImagem);
    };
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

 

  function clearToken() {
    token.value = null
    Navcontroller.value = false
    localStorage.removeItem('token')
    refresh.value = null
    localStorage.removeItem('refresh')
  }

  function getToken() {
    return token.value
  }
  function getRefresh(){
    return refresh.value
  }
  return { token, refresh, Navcontroller, setToken, clearToken, getToken, getRefresh, getUser, setUser, getImagem, setUsuario }
})
