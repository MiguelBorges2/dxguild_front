<script setup>
import { useRouter } from 'vue-router'
import { ref } from 'vue'
import ShieldLogo from '@/components/ShieldLogo.vue'
import NavBar from '@/components/NavBar.vue'
import axios from 'axios'
import {useAuthStore} from '@/stores/auth.js'
import { onMounted } from 'vue'
const router = useRouter()
const showLoginModal = ref(false)
const showRegisterModal = ref(false)
const loginEmail = ref('')
const loginPassword = ref('')
const registerEmail = ref('')
const registerPassword = ref('')
const registerConfirmPassword = ref('')
const registerNickname = ref('')
const registerImage = ref(null)
const registerImagePreview = ref(null)
const recentTables = ref([])
const handleImageUpload = (event) => {
  const file = event.target.files[0]
  if (file) {
    registerImage.value = file
    const reader = new FileReader()
    reader.onload = (e) => {
      registerImagePreview.value = e.target.result
    }
    reader.readAsDataURL(file)
  }
}
const erroCriar = ref('')
const erroLog = ref('')
onMounted(async () => {
    try {
        const res = await axios.get('http://localhost:8080/dxguild/mesa/recente')
        recentTables.value = res.data
    } catch (e) {
        console.error("Erro ao buscar mesas recentes:", e)
    }
})


  async function handleLogin(){
      try { 
        const res = await axios.post('http://localhost:8080/dxguild/auth/login', {
          email: loginEmail.value,
          password: loginPassword.value
        })  
        const userData = res.data;
        const authStore = useAuthStore();
        authStore.setToken(userData.acessToken, userData.refreshToken);
        router.push('/perfil');
      } catch (e) {
        console.error("Erro completo:", e);
        if (e.response && e.response.data) {
          const data = e.response.data;
          if(Array.isArray(data)){
      
            erroLog.value = "Erro no login " + ( data[0] || "Erro desconhecido.");
            return;
          }
          else {
            console.log("ta aqui" + e.response.data)
            erroLog.value = "Erro no Login: " + ( e.response?.data?.error?.message  || e.response?.data?.erro ||e.response?.data || "Erro desconhecido.");
            return;
          }
        }else{
             erroLog.value = "Erro ao fazer login, servidor fora do ar ou inacessível.";
             return
        }
       
      }
  }

const closeModals = () => {
  showLoginModal.value = false
  showRegisterModal.value = false
}

async function handleRegister(){
    if(registerPassword.value !== registerConfirmPassword.value){
        alert("As senhas não coincidem!")
        return
    }
   
  
    try {
    
        const formData = new FormData()
        formData.append('file', registerImagePreview.value)
        formData.append('upload_preset', 'dxguild')
        const cloudName = 'dwt6xjnmh';
    const cloudinaryRes = await axios.post(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, 
        formData
      );
      const urlDaImagemFinal = cloudinaryRes.data.secure_url;
      const res = await axios.post('http://localhost:8080/dxguild/user', {
        email: registerEmail.value,
        password: registerPassword.value,
        nome: registerNickname.value,
        imagem: urlDaImagemFinal

       
      })
       showRegisterModal.value = false;
    }catch (e) {
  console.error("Erro completo:", e)

  
  if (e.response && e.response.data && e.response.status != 500 && e.code != 'ERR_NETWORK' ) {
    if(e.config?.url?.includes('cloudinary.com')){
        erroCriar.value = "Erro ao fazer upload da imagem";
        return;
      }
     const data = e.response.data;
     if(Array.isArray(data)){
      
        erroCriar.value = "Erro ao criar conta: " + ( data[0] || "Erro desconhecido.");
        return;
     }
     else {
        console.log("ta aqui" + e.response.data)
     erroCriar.value = "Erro ao criar conta: " + ( e.response?.data?.error?.mensagem  || e.response?.data || "Erro desconhecido.");
       return;
     }
     
    
  }
  else{
    erroCriar.value = "Erro ao criar conta, servidor fora do ar ou inacessível.";
      return;
  }
   
   
  
  // 2. Se cair aqui, é porque nem conseguiu falar com o servidor (Ex: rede caiu ou deu 500 sem corpo)
   
}
    
    

    
}
</script>

<template>
    
  <div class="home">
    
      <!-- Background Hero Section -->
      <section class="hero-section">
        <img class="fundo" src="../assets/imgs/fundo2.png" alt="Fundo da página" />
        <div class="hero-overlay"></div>
       
        <div class="hero-content">
          <div class="hero-text">
            
            <h1 class="title">DXGuild</h1>
            <p class="subtitle">Bem-vindo ao Reino das Aventuras Épicas</p>
            <p class="description">Uma jornada aguarda você em mundos repletos de mistério, magia e glória</p>
            
            <div class="auth-buttons">
              <button class="btn btn-login" @click="showLoginModal = true">
                Entrar
              </button>
              <button class="btn btn-register" @click="showRegisterModal = true">
                Cadastrar
              </button>
            </div>

           
          </div>

          <div class="hero-dragon">
              <img src="../assets/imgs/hero.png" />
          </div>
        </div>

        <!-- Decorative Elements -->


        <!-- Fade Out to Black -->
        <div class="fade-to-black"></div>
      </section>

      <!-- Recent Tables Section -->
      <section class="recent-tables-section">
        <div class="tables-container">
          <h2 class="section-title">Mesas Recentes</h2>
          <p class="section-subtitle">Junte-se a uma aventura épica</p>
          <button class="find-tables-button" type="button" @click="router.push('/buscar')">
            <span aria-hidden="true">✦</span>
            Encontrar Mesas
          </button>
          
          <div class="tables-grid">
            <div v-for="table in recentTables" :key="table.id" class="table-card" @click="router.push(`/mesa/${encodeURIComponent(table.nome)}`)">
              <div class="table-image">
                <img :src="table.imagem" :alt="table.name" />
              </div>
              
              <div class="table-header">
                <h3 class="table-name">{{ table.nome }}</h3>
              </div>
              
              <div class="table-info">
                <div class="info-row">
                  <span class="info-label">Mestre</span>
                  <span class="info-value">{{ table.nome}}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Meio</span>
                  <span class="info-value">{{ table.meio }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Sistema</span>
                  <span class="info-value">{{ table.sistema }}</span>
                </div>
               
              </div>
              <div class="vacancy-badge">
                <span>temos vaga</span>
              </div>
              <button class="btn-join" @click.stop="router.push(`/mesa/${encodeURIComponent(table.nome)}`)">Entrar na Mesa</button>
            </div>
          </div>
        </div>
        
      </section>


      <section class="features-section">
        <div class="fade-top"></div>
        <img class="fundo2" src="../assets/imgs/fundo3.png" alt="Fundo da página" />
        <div class="info-overlay"></div>
        <div class="features-container">
          <h2 class="section-title">O que você encontra aqui</h2>
          <p class="section-subtitle">Sua jornada começa com facilidade, comunidade e aventura</p>

          <div class="features-grid">
            <div class="feature-card">
              <div class="feature-icon">✦</div>
              <h3>Inscrição Gratuita</h3>
              <p>Entre na guilda sem custo e comece a participar das mesas imediatamente.</p>
            </div>

            <div class="feature-card">
              <div class="feature-icon">⚔️</div>
              <h3>Vários Sistemas</h3>
              <p>Escolha entre diferentes sistemas e encontre a experiência ideal para você.</p>
            </div>

            <div class="feature-card">
              <div class="feature-icon">🛡️</div>
              <h3>Encontre seu Grupo</h3>
              <p>Conecte-se com outros aventureiros e monte sua equipe para a próxima campanha.</p>
            </div>

            <div class="feature-card">
              <div class="feature-icon">🎲</div>
              <h3>Jogue e Divirta-se</h3>
              <p>Desfrute de noites épicas de roleplay, estratégia e muita diversão.</p>
            </div>
          </div>
        </div>
        <div class="fade-to-black"></div>
      </section>

      <!-- Login Modal -->
      <div v-if="showLoginModal" class="modal-overlay" @click.self="closeModals">
        <div class="modal2">
          <button class="modal-close" @click="closeModals">✕</button>
          <h2>Entrar na Guilda</h2>
          
          <form @submit.prevent="handleLogin">
            <div class="form-group">
              <label for="login-email">Email</label>
              <input 
                id="login-email"
                v-model="loginEmail" 
                type="email" 
                placeholder="seu@email.com"
                required
              />
            </div>
            <div class="form-group">
              <label for="login-password">Senha</label>
              <input 
                id="login-password"
                v-model="loginPassword" 
                type="password" 
                placeholder="••••••••"
                required
              />
            </div>

            <button type="submit" class="btn btn-submit">Entrar</button>
          </form>
         <p class="erro" v-if="erroLog">{{ erroLog }}</p>>
          <p class="modal-footer">
            Não tem conta? <button class="link-btn" @click="showLoginModal = false; showRegisterModal = true">Cadastre-se</button>
          </p>
        </div>
      </div>    

      <!-- Register Modal -->
      <div v-if="showRegisterModal" class="modal-overlay" @click.self="closeModals">
        <div class="modal2">
          <button class="modal-close" @click="closeModals">✕</button>
          <h2>Criar Conta</h2>
          
          <form @submit.prevent="handleRegister">
            <div class="form-group">
              <label for="register-nickname">Apelido (Nickname)</label>
              <input 
                id="register-nickname"
                v-model="registerNickname" 
                type="text" 
                placeholder="Seu nick na guilda"
                required
              />
            </div>

            <div class="form-group">
              <label for="register-image">Foto de Perfil</label>
              <div class="image-upload-section">
                <input 
                  id="register-image"
                  type="file"
                  accept="image/*"
                  @change="handleImageUpload"
                  class="image-input"
                />
                <label for="register-image" class="image-upload-label">
                  <span v-if="!registerImagePreview">📷 Escolher Imagem</span>
                  <span v-else>✓ Imagem selecionada</span>
                </label>
               
              </div>

            </div>

            <div class="form-group">
              <label for="register-email">Email</label>
              <input 
                id="register-email"
                v-model="registerEmail" 
                type="email" 
                placeholder="seu@email.com"
                required
              />
            </div>

            <div class="form-group">
              <label for="register-password">Senha</label>
              <input 
                id="register-password"
                v-model="registerPassword" 
                type="password" 
                placeholder="••••••••"
                required
              />
            </div>

            <div class="form-group">
              <label for="register-confirm">Confirmar Senha</label>
              <input 
                id="register-confirm"
                v-model="registerConfirmPassword" 
                type="password" 
                placeholder="••••••••"
                required
              />
            </div>

            <button type="submit" class="btn btn-submit">Criar Conta</button>
          </form>
           <p class="erro" >{{ erroCriar }}</p>
          <p class="modal-footer">
            Já tem conta? <button class="link-btn" @click="showRegisterModal = false; showLoginModal = true">Faça login</button>
          </p>
        </div>
      </div>
    </div>
</template>

<style scoped>



.home {
  width: 100%;
  min-height: calc(100vh - 60px);
  overflow: hidden;
}

.hero-section {
  position: relative;
  width: 100%;
  min-height: 100vh;
  background: 
    linear-gradient(135deg, rgba(139, 69, 19, 0.3), rgba(0, 0, 0, 0.8)),
    url('https://images.unsplash.com/photo-1579546929662-711aa33e6b6f?w=1200&h=800&fit=crop') center/cover;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  z-index:0;
}

.hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    135deg,
    rgba(0, 0, 0, 0.85) 0%,
    rgba(20, 10, 0, 0.75) 50%,
    rgba(0, 0, 0, 0.9) 100%
  );
  z-index: 1;
}
.info-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    135deg,
     rgba(0, 0, 0, 0.85) 0%,
    rgba(20, 10, 0, 0.75) 50%,
    rgba(0, 0, 0, 0.9) 100%
  );
  z-index: 1;
}
.hero-content {
  position: relative;
  z-index: 2;
  display: flex;
  grid-template-columns: 1fr 1fr;
  gap: 4rem;
  justify-content:center;
  align-items:center;
  width:95%;
  text-align: left;
}

.hero-text {
  width: 50%;
  display: flex;
  justify-content:center;
  align-items: start;
  flex-direction: column;
  animation: slideInLeft 0.8s ease;
 
  

}
.fundo{
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    z-index: -1;
}
.fundo2{
    position: absolute;
   
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    z-index: -1;
}
.title {
  font-family: 'TheWildBreathOfZelda', serif ;
  font-size: 4rem;
  font-weight: 900;
  margin-bottom: 1rem;
  background: linear-gradient(135deg, #d4af37 0%, #f0e68c 50%, #8b7500 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
  letter-spacing: 2px;
}


.subtitle {
  font-family: 'TheWildBreathOfZelda', serif;
  font-size: 1.8rem;
  color: #d4af37;
  margin-bottom: 1rem;
  font-weight: 600;
  letter-spacing: 1px;
}
.campo {
    width: 100%;
    border-radius: 18px;
    padding: 1%;
    background-color: black;
    overflow-wrap: break-word !important; /* Padrão moderno */
    word-wrap: break-word;
    min-width: 0;
    word-break: break-all;
} 

.description {
  font-size: 1.1rem;
  color: #ccc;
  margin-bottom: 2.5rem;
  line-height: 1.6;
  max-width: 500px;
   font-family: 'Cinzel', serif;
}

.auth-buttons {
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.btn {
  font-family: 'Cinzel', serif;
  padding: 0.9rem 2.5rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.btn-login {
  background: linear-gradient(135deg, #d4af37 0%, #f0e68c 100%);
  color: #000;
  box-shadow: 0 0 20px rgba(212, 175, 55, 0.4);
  border: 2px solid #d4af37;
}

.btn-login:hover {
  box-shadow: 0 0 30px rgba(212, 175, 55, 0.6);
  transform: translateY(-3px);
  background: linear-gradient(135deg, #f0e68c 0%, #d4af37 100%);
}

.btn-register {
  background: transparent;
  color: #d4af37;
  border: 2px solid #d4af37;
  box-shadow: inset 0 0 20px rgba(212, 175, 55, 0.1);
}

.btn-register:hover {
  background: rgba(212, 175, 55, 0.1);
  box-shadow: 0 0 20px rgba(212, 175, 55, 0.3), inset 0 0 20px rgba(212, 175, 55, 0.1);
  transform: translateY(-3px);
}

.hero-dragon {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 50%;
  height: 100%;
}

.hero-dragon img {
  max-width: 40%;
  min-width: 300px;
  height: auto;
  transition: all 0.4s ease;
  filter: drop-shadow(0 0 20px rgba(212, 175, 55, 0.3));
  animation: float 4s ease-in-out infinite;
}

.hero-dragon img:hover {
  transform: scale(1.08) translateY(-10px);
  filter: drop-shadow(0 10px 40px rgba(212, 175, 55, 0.6)) 
          drop-shadow(0 0 30px rgba(139, 69, 19, 0.4));
  animation: none;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-15px);
  }
}

.vacancy-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  color: #ffffff;
  padding: 0.5rem 0.7rem;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  box-shadow: 0 4px 10px rgba(34, 197, 94, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.2);
  margin: 0.25rem 0 0.85rem;
}

@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-50px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* Decorative Elements */
.decorative-top-left {
  position: absolute;
  top: 20px;
  left: 20px;
  width: 200px;
  height: 200px;
  border: 2px solid rgba(212, 175, 55, 0.2);
  border-right: none;
  border-bottom: none;
  z-index: 0;
}

.decorative-top-right {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 200px;
  height: 200px;
  border: 2px solid rgba(212, 175, 55, 0.2);
  border-left: none;
  border-bottom: none;
  z-index: 0;
}

.decorative-bottom {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  width: 300px;
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.4), transparent);
  z-index: 0;
}

.fade-to-black {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 200px;
  background: linear-gradient(to bottom, transparent, black);
  z-index: 10;
  pointer-events: none;
}
.fade-top {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 40px; /* Aumentamos um pouco para o degradê ficar ainda mais suave */
  /* Faz o degradê ir do PRETO sólido no topo até o TRANSPARENTE na imagem */
  background: linear-gradient(to bottom, #000000 0%, rgba(0, 0, 0, 0.8) 20%, transparent 100%);
  z-index: 5;
  pointer-events: none;
}
.fade2 {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 200px;
  background: linear-gradient(to top, transparent, black);
  z-index: 10;
  pointer-events: none;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index:999;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.modal2 {
  background: linear-gradient(135deg, #1a1410 0%, #2d1f1a 100%);
  border: 2px solid #d4af37;
  border-radius: 8px;
  padding: 1rem;
  max-width: 400px;
  width: 90%;
  position: relative;
  z-index: 1000;
  box-shadow: 0 0 40px rgba(212, 175, 55, 0.2), inset 0 0 20px rgba(212, 175, 55, 0.05);
  animation: slideUp 0.3s ease;

}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(50px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  color: #d4af37;
  font-size: 1.5rem;
  cursor: pointer;
  transition: color 0.3s ease;
}

.modal-close:hover {
  color: #f0e68c;
}

.modal2 h2 {
  font-family: 'Cinzel', serif;
  color: #d4af37;
  margin-bottom: 1.5rem;
  font-size: 1.8rem;
  letter-spacing: 1px;
  text-align: center;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  font-family: 'Cinzel', serif;
  color: #d4af37;
  margin-bottom: 0.5rem;
  font-size: 0.95rem;
  letter-spacing: 0.5px;
}

.form-group input {
  width: 100%;
  padding: 0.75rem;
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid #d4af37;
  color: #fff;
  border-radius: 4px;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.form-group input::placeholder {
  color: #999;
}

.form-group input:focus {
  outline: none;
  background: rgba(0, 0, 0, 0.7);
  border-color: #f0e68c;
  box-shadow: 0 0 10px rgba(212, 175, 55, 0.3);
}

.image-upload-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.image-input {
  display: none;
}

.image-upload-label {
  display: block;
  padding: 1rem;
  background: rgba(212, 175, 55, 0.1);
  border: 2px dashed #d4af37;
  border-radius: 4px;
  text-align: center;
  color: #d4af37;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.image-upload-label:hover {
  background: rgba(212, 175, 55, 0.2);
  border-color: #f0e68c;
  color: #f0e68c;
}

.image-preview {
  display: flex;
  justify-content: center;
  padding: 0.5rem;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
  border: 1px solid #d4af37;
}

.image-preview img {
  max-width: 150px;
  max-height: 150px;
  border-radius: 4px;
}

.btn-submit {
  width: 100%;
  background: linear-gradient(135deg, #d4af37 0%, #f0e68c 100%);
  color: #000;
  margin-top: 1rem;
}

.btn-submit:hover {
  box-shadow: 0 0 20px rgba(212, 175, 55, 0.5);
}

.modal2-footer {
  text-align: center;
  color: #999;
  margin-top: 1.5rem;
  font-size: 0.95rem;
}

.link-btn {
  background: none;
  border: none;
  color: #d4af37;
  cursor: pointer;
  text-decoration: underline;
  font-size: inherit;
  transition: color 0.3s ease;
}

.link-btn:hover {
  color: #f0e68c;
}

/* Recent Tables Section */
.recent-tables-section {
  background: linear-gradient(180deg, black);
  padding: 4rem 2rem;
  min-height: 600px;
}

.features-section {
  position: relative;

  padding: 4rem 2rem 5rem;
}

.tables-container,
.features-container {
  margin-top: 5%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: relative;
  z-index: 2 !important;
  min-height: 100vh;
  max-width: 1200px;
  margin: 0 auto;
}

.section-title {
  font-family: 'Cinzel', serif;
  font-size: 2.5rem;
  color: #d4af37;
  text-align: center;
  margin-bottom: 0.5rem;
  letter-spacing: 2px;
}

.section-subtitle {
  font-size: 1.1rem;
  color: #ccc;
  text-align: center;
  margin-bottom: 3rem;
  font-style: italic;
}

.tables-grid,
.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 2rem;
}

.table-card,
.feature-card {
  background: linear-gradient(135deg, #2d1f1a 0%, #1a1410 100%);
  border: 2px solid #d4af37;
  border-radius: 8px;
  padding: 1.5rem;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(212, 175, 55, 0.1);
  display: flex;
  flex-direction: column;
}

.table-card:hover,
.feature-card:hover {
  transform: translateY(-8px);
  border-color: #f0e68c;
  box-shadow: 0 8px 30px rgba(212, 175, 55, 0.3);
  background: linear-gradient(135deg, #3d2f26 0%, #2a1f18 100%);
}

.feature-card {
  text-align: center;
  padding: 2rem 1.5rem;
}

.feature-icon {
  font-size: 2rem;
  margin-bottom: 1rem;
  color: #d4af37;
}

.feature-card h3 {
  font-family: 'Cinzel', serif;
  color: #d4af37;
  margin-bottom: 0.75rem;
  font-size: 1.2rem;
}

.feature-card p {
  color: #ccc;
  line-height: 1.6;
  margin: 0;
}

.table-image {
  width: 100%;
  height: 150px;
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 1rem;
  border: 1px solid rgba(212, 175, 55, 0.3);
  background: rgba(0, 0, 0, 0.3);
}
.erro {
  color: red;
  font-size: 0.9rem;
  margin-top: 0.5rem;
  text-align: center;
}
.table-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.table-card:hover .table-image img {
  transform: scale(1.05);
}

.table-header {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 1.2rem;
  text-align: center;
}

.table-name {
  font-family: 'Cinzel', serif;
  font-size: 1.35rem;
  color: #f7e7b9;
  margin: 0;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  text-shadow: 0 0 8px rgba(212, 175, 55, 0.25);
} 

.players-badge {
  background: rgba(212, 175, 55, 0.2);
  border: 1px solid #d4af37;
  color: #d4af37;
  padding: 0.3rem 0.8rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  white-space: nowrap;
}

.table-info {
  flex: 1;
  margin-bottom: 1.5rem;
}

.info-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.8rem;
  font-size: 0.95rem;
}

.info-label {
  color: #8b7500;
  font-weight: 600;
}

.info-value {
  color: #ccc;
}

.btn-join {
  width: 100%;
  align-self: stretch;
  background: linear-gradient(135deg, #d4af37 0%, #f0e68c 100%);
  color: #000;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: 'Cinzel', serif;
  letter-spacing: 0.5px;
}

.find-tables-button {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  margin: 0.4rem auto 1.5rem;
  padding: 0.7rem 1.25rem;
  border: 1px solid rgba(212, 175, 55, 0.55);
  border-radius: 999px;
  background: rgba(212, 175, 55, 0.12);
  color: #f0e68c;
  cursor: pointer;
  font-family: 'Cinzel', serif;
  font-weight: 700;
  transition: transform 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
}

.find-tables-button:hover,
.find-tables-button:focus-visible {
  transform: translateY(-2px);
  background: rgba(212, 175, 55, 0.24);
  box-shadow: 0 8px 20px rgba(212, 175, 55, 0.25);
  outline: none;
}

.btn-join:hover {
  box-shadow: 0 0 20px rgba(212, 175, 55, 0.5);
  transform: translateY(-2px);
}

/* Responsive */
@media( max-width: 1000px){
   .hero-text {
        width: 100%;
        align-items: center;
        text-align: center;
    }
  .hero-dragon {
    display: none;
  }
   .title {
    font-size: 3rem;
  }

  .subtitle {
    font-size: 1.6rem;
  }

  .description {
    font-size: 1.1rem;
  }
}
@media (max-width: 768px) {
  
  .hero-content {
    grid-template-columns: 1fr;
    gap: 2rem;
    width: 95%;
  }

  
  .auth-buttons {
    flex-direction: column;
  }

  .btn {
    width: 100%;
  }

  .modal2 {
    padding: 2rem;
  }

  .modal2 h2 {
    font-size: 1.5rem;
  }

  .decorative-top-left,
  .decorative-top-right {
    display: none;
  }

  .section-title {
    font-size: 1.8rem;
  }

  .tables-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
  
   .title {
    font-size: 2.8rem;
  }

  .subtitle {
    font-size: 1.4rem;
  }

  .description {
    font-size: 1rem;
  }
  .section-title {
    font-size: 1.5rem;
  }

  .section-subtitle {
    font-size: 1rem;
  }

  .recent-tables-section {
    padding: 2rem 1rem;
  }

  .table-card {
    padding: 1rem;
  }

  .table-name {
    font-size: 1.1rem;
  }

  .table-image {
    height: 120px;
  }
}
@media (max-width: 320px) {
  
   .title {
    font-size: 2rem;
  }

  .subtitle {
    font-size: 1rem;
  }

  .description {
    font-size: .8rem;
  }
  .section-title {
    font-size: 1.5rem;
  }

  .section-subtitle {
    font-size: 1rem;
  }

  .recent-tables-section {
    padding: 2rem 1rem;
  }

  .table-card {
    padding: 1rem;
  }

  .table-name {
    font-size: 1.1rem;
  }

  .table-image {
    height: 120px;
  }
  .btn {
  font-family: 'Cinzel', serif;
  padding: 0.9rem 1.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
 
}


.fade-to-black {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 100px;
  background: linear-gradient(to bottom, transparent, black);
  z-index: 10;
  pointer-events: none;
}
}

</style>
