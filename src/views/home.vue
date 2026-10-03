<script setup>
import { useRouter } from 'vue-router'
import { ref } from 'vue'
import ShieldLogo from '@/components/ShieldLogo.vue'
import NavBar from '@/components/NavBar.vue'
import axios from 'axios'
import {useAuthStore} from '@/stores/auth.js'
import { useMensagensStore } from '@/stores/DmStore.js'
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
const DmStore = useMensagensStore()
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
        const res = await axios.get('/dxguild/mesa/recente')
        recentTables.value = res.data
    } catch (e) {
        console.error("Erro ao buscar mesas recentes:", e)
    }
})


  async function handleLogin(){
      try { 
        const res = await axios.post('/dxguild/auth/login', {
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
      const res = await axios.post('/dxguild/user', {
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
        <div class="hero-ornaments" aria-hidden="true">
          <svg class="hero-ornament hero-ornament--top-left" viewBox="0 0 180 180"><path d="M10 150V10h140M10 54h34l14-14 14 14h28M10 90h24l16 16 16-16h34M32 10v28M64 10v16M28 128l20-20 20 20M76 116l12-12 12 12M105 25l11 19 22 3-16 16 4 22-21-10-20 10 4-22-16-16 22-3 10-19Z" /><circle cx="128" cy="112" r="15" /><path d="M128 97a15 15 0 1 0 0 30 11 11 0 1 1 0-30Z" /><circle cx="148" cy="69" r="3" /><circle cx="138" cy="82" r="2" /></svg>
          <svg class="hero-ornament hero-ornament--top-right" viewBox="0 0 180 180"><path d="M10 150V10h140M10 54h34l14-14 14 14h28M10 90h24l16 16 16-16h34M32 10v28M64 10v16M28 128l20-20 20 20M76 116l12-12 12 12M105 25l11 19 22 3-16 16 4 22-21-10-20 10 4-22-16-16 22-3 10-19Z" /><circle cx="128" cy="112" r="15" /><path d="M128 97a15 15 0 1 0 0 30 11 11 0 1 1 0-30Z" /><circle cx="148" cy="69" r="3" /><circle cx="138" cy="82" r="2" /></svg>
          <svg class="hero-ornament hero-ornament--bottom-left" viewBox="0 0 180 180"><path d="M10 150V10h140M10 54h34l14-14 14 14h28M10 90h24l16 16 16-16h34M32 10v28M64 10v16M28 128l20-20 20 20M76 116l12-12 12 12M105 25l11 19 22 3-16 16 4 22-21-10-20 10 4-22-16-16 22-3 10-19Z" /><circle cx="128" cy="112" r="15" /><path d="M128 97a15 15 0 1 0 0 30 11 11 0 1 1 0-30Z" /><circle cx="148" cy="69" r="3" /><circle cx="138" cy="82" r="2" /></svg>
          <svg class="hero-ornament hero-ornament--bottom-right" viewBox="0 0 180 180"><path d="M10 150V10h140M10 54h34l14-14 14 14h28M10 90h24l16 16 16-16h34M32 10v28M64 10v16M28 128l20-20 20 20M76 116l12-12 12 12M105 25l11 19 22 3-16 16 4 22-21-10-20 10 4-22-16-16 22-3 10-19Z" /><circle cx="128" cy="112" r="15" /><path d="M128 97a15 15 0 1 0 0 30 11 11 0 1 1 0-30Z" /><circle cx="148" cy="69" r="3" /><circle cx="138" cy="82" r="2" /></svg>
        </div>
       
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
              <img class="hero-logo-image" src="../assets/imgs/hero.png" alt="Emblema da DXGuild" />
          </div>
        </div>

        <!-- Decorative Elements -->


        <!-- Fade Out to Black -->
        <div class="fade-to-black"></div>
      </section>

      <!-- Recent Tables Section -->
      <section class="recent-tables-section">
        <svg class="section-ornament section-ornament--tables" viewBox="0 0 260 420" aria-hidden="true"><path d="M32 10v400M32 48h86l20-20 20 20h46M32 152h58l18 18 18-18h54M32 258h76l22 22 22-22h52M32 356h112" /><circle cx="182" cy="98" r="27" /><path d="m182 62 10 18 20 3-15 14 4 20-19-10-18 10 4-20-15-14 20-3 9-18ZM182 135v30M167 150h30" /><path d="m90 292 18 18-18 18-18-18 18-18Z" /><circle cx="62" cy="370" r="5" /></svg>
        <svg class="section-ornament section-ornament--tables-two" viewBox="0 0 220 220" aria-hidden="true"><circle cx="110" cy="110" r="72" /><path d="m110 28 16 30 34 5-25 25 6 34-31-16-30 16 6-34-25-25 34-5 15-30ZM110 80v60M80 110h60" /><circle cx="110" cy="110" r="22" /></svg>
        <div class="tables-container">
          <h2 class="section-title">Mesas Recentes</h2>
          <p class="section-subtitle">Junte-se a uma aventura épica</p>
          <button class="find-tables-button" type="button" @click="router.push('/buscar')">
            Encontrar Mesas
          </button>
          
          <div class="tables-grid">
            <div v-for="table in recentTables" :key="table.id" class="table-card" @click="router.push(`/mesa/${encodeURIComponent(table.nome)}`)">
              <div class="table-image">
                <img :src="table.imagem" :alt="table.name" />
              </div>
              
              <div class="table-header">
                <div class="table-title-row">
                  <h3 class="table-name">{{ table.nome }}</h3>
                </div>
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
        <svg class="section-ornament section-ornament--features" viewBox="0 0 260 420" aria-hidden="true"><path d="M228 10v400M228 54H150l-20-20-20 20H58M228 160h-62l-18 18-18-18H82M228 274h-90l-22 22-22-22H58M228 372H118" /><circle cx="78" cy="104" r="27" /><path d="M78 77c-9 10-9 21 0 27 9-6 9-17 0-27Zm0 27c-9 10-9 21 0 27 9-6 9-17 0-27ZM51 104h54" /><path d="m166 300 16 16-16 16-16-16 16-16Z" /><circle cx="198" cy="374" r="5" /></svg>
        <svg class="section-ornament section-ornament--features-two" viewBox="0 0 220 220" aria-hidden="true"><path d="M110 20v180M20 110h180M46 46l128 128M174 46 46 174" /><circle cx="110" cy="110" r="64" /><path d="m110 58 12 30 31 2-24 20 8 30-27-17-27 17 8-30-24-20 31-2 12-30Z" /></svg>
        <div class="fade-top"></div>
        <img class="fundo" src="../assets/imgs/fundo3.png" alt="" />
        <div class="hero-overlay"></div>
        <div class="features-container">
          <h2 class="section-title">O que você encontra aqui</h2>
          <p class="section-subtitle">Sua jornada começa com facilidade, comunidade e aventura</p>

          <div class="features-grid">
            <div class="feature-card">
              <div class="feature-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m5 20 14-14M4 21l3-6M17 3l4 4M8 17l-3-3M15 10l3 3" /></svg></div>
              <h3>Inscrição Gratuita</h3>
              <p>Entre na guilda sem custo e comece a participar das mesas imediatamente.</p>
            </div>

            <div class="feature-card">
              <div class="feature-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1L3.2 9.4l6.1-.9L12 3Z" /></svg></div>
              <h3>Vários Sistemas</h3>
              <p>Escolha entre diferentes sistemas e encontre a experiência ideal para você.</p>
            </div>

            <div class="feature-card">
              <div class="feature-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 3l7 3v5c0 4.6-2.8 8-7 10-4.2-2-7-5.4-7-10V6l7-3Z" /></svg></div>
              <h3>Encontre seu Grupo</h3>
              <p>Conecte-se com outros aventureiros e monte sua equipe para a próxima campanha.</p>
            </div>

            <div class="feature-card">
              <div class="feature-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M7 3h10l4 7-9 11L3 10l4-7ZM7 3l5 18L17 3M3 10h18" /></svg></div>
              <h3>Jogue e Divirta-se</h3>
              <p>Desfrute de noites épicas de roleplay, estratégia e muita diversão.</p>
            </div>
          </div>
        </div>
        <div class="fade-to-black"></div>
      </section>

      <section class="getting-started-section">
        <svg class="section-ornament section-ornament--start" viewBox="0 0 300 260" aria-hidden="true"><path d="M20 130h260M74 54l76 76-76 76M42 76h58M42 184h58M220 76h38M220 184h38" /><circle cx="42" cy="130" r="14" /><circle cx="276" cy="130" r="14" /><path d="m150 82 13 23 26 4-19 19 4 26-24-12-23 12 4-26-19-19 26-4 12-23ZM140 130h20" /></svg>
        <svg class="section-ornament section-ornament--start-two" viewBox="0 0 220 220" aria-hidden="true"><circle cx="110" cy="110" r="74" /><path d="M110 36v148M36 110h148M58 58l104 104M162 58 58 162M110 72l10 28 28 10-28 10-10 28-10-28-28-10 28-10 10-28Z" /></svg>
        <div class="getting-started-container">
          <h2 class="section-title">Como começar</h2>
          <p class="section-subtitle">Escolha o primeiro passo para a sua próxima aventura.</p>
          <div class="start-steps">
            <article class="start-step">
              <div class="step-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M4 20h16M6 20V8l6-4 6 4v12M9 20v-5h6v5M9 10h.01M15 10h.01" /></svg></div>
              <div>
                <h3>Crie uma mesa</h3>
                <p>Monte sua campanha e convide aventureiros para formar o grupo.</p>
              </div>
            </article>
            <article class="start-step">
              <div class="step-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6" /><path d="m16 16 4 4M8 11h6M11 8v6" /></svg></div>
              <div>
                <h3>Procure uma mesa</h3>
                <p>Explore as mesas disponíveis, encontre uma que combine com você e peça para entrar.</p>
              </div>
            </article>
          </div>
        </div>
      </section>

      <footer class="site-footer">
        <p>DXGuild</p>
        <a href="mailto:miguel.costa@ufu.br">miguel.costa@ufu.br</a>
      </footer>

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
                  <span v-if="!registerImagePreview">Escolher Imagem</span>
                  <span v-else>Imagem selecionada</span>
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
            Já tem conta?  <button class="link-btn" @click="showRegisterModal = false; showLoginModal = true">Faça login</button>
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
.title {
  font-family: 'TheWildBreathOfZelda', serif ;
  font-size: 4rem;
  font-weight: 900;
  margin-bottom: 1rem;
  color: #f0e68c;
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

.modal-footer {
  text-align: center;
  color: #d4af37;
  margin-top: 1.5rem;
  font-size: 0.95rem;
}

.link-btn {
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  text-decoration: underline;
  font-size: inherit;
}

.link-btn:hover {
  color: inherit;
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
  width: 100%;
  min-width: 0;
  margin-bottom: 1.2rem;
  text-align: center;
}

.table-name {
  width: 100%;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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

/* Refinamento visual local da Home */
@font-face {
  font-family: 'GuildDisplay';
  src: url('../assets/fonts/AncientModernTales-a7Po.ttf') format('truetype');
  font-display: swap;
}

.home {
  --guild-gold: #d4af37;
  --guild-gold-light: #f0e68c;
  --guild-ink: #090909;
  --guild-panel: #17120e;
  --guild-copy: #d5d0c6;
  background: var(--guild-ink);
  color: var(--guild-copy);
  font-family: Georgia, 'Times New Roman', serif;
}

.home ::selection { background: var(--guild-gold); color: #100d08; }
.home :focus-visible { outline: 2px solid var(--guild-gold-light); outline-offset: 4px; }
.home button, .home input { font-family: inherit; }

.hero-section { min-height: min(760px, 100svh); background: #080806; }
.hero-overlay { background: linear-gradient(105deg, rgba(0, 0, 0, .9), rgba(15, 9, 3, .72) 52%, rgba(0, 0, 0, .82)); }
.hero-content {
  width: min(1160px, 92%);
  gap: clamp(2rem, 7vw, 7rem);
  padding: 5rem 0 7rem;
}
.hero-text { max-width: 570px; }
.title {
  margin: 0 0 .7rem;
  color: var(--guild-gold-light);
  font-family: 'GuildDisplay', Georgia, serif;
  font-size: clamp(4rem, 8vw, 6rem);
  font-weight: 400;
  letter-spacing: -.02em;
  line-height: .95;
  text-shadow: 0 6px 22px rgba(0, 0, 0, .62);
}
.subtitle {
  margin: 0;
  color: var(--guild-gold);
  font-family: 'GuildDisplay', Georgia, serif;
  font-size: clamp(1.5rem, 2.6vw, 2.1rem);
  font-weight: 400;
  letter-spacing: .01em;
  line-height: 1.18;
}
.description { max-width: 48ch; margin: 1.4rem 0 2.1rem; color: #e4dfd4; font-size: 1.08rem; line-height: 1.7; }
.auth-buttons { gap: .85rem; }
.btn {
  min-height: 47px;
  padding: .75rem 1.45rem;
  border: 1px solid rgba(240, 230, 140, .65);
  border-radius: 8px;
  background: rgba(8, 8, 6, .48);
  color: var(--guild-gold-light);
  font-family: Georgia, serif;
  font-size: .83rem;
  font-weight: 700;
  letter-spacing: .055em;
  text-transform: uppercase;
  transition: transform .22s ease, background .22s ease, border-color .22s ease, color .22s ease;
}
.btn-login { background: var(--guild-gold); border-color: var(--guild-gold); color: #171109; box-shadow: none; }
.btn-register { background: rgba(0, 0, 0, .25); color: var(--guild-gold-light); }
.btn:hover, .btn-login:hover { background: var(--guild-gold-light); border-color: var(--guild-gold-light); color: #171109; box-shadow: none; transform: translateY(-2px); }
.hero-dragon { display: grid; min-height: 360px; place-items: center; padding: 2rem; border: 1px solid rgba(212, 175, 55, .42); background: rgba(8, 8, 6, .27); box-shadow: 0 24px 44px rgba(0, 0, 0, .3); }
.hero-dragon img { width: min(100%, 380px); max-height: 350px; object-fit: contain; filter: drop-shadow(0 16px 20px rgba(0, 0, 0, .48)); }

.recent-tables-section { min-height: auto; padding: clamp(4.5rem, 8vw, 7rem) 0; background: #050505; }
.tables-container, .features-container, .getting-started-container { width: min(1160px, calc(100% - 3rem)); margin: 0 auto; }
.section-title { margin: 0; color: var(--guild-gold-light); font-family: 'GuildDisplay', Georgia, serif; font-size: clamp(2.35rem, 4vw, 3.6rem); font-weight: 400; letter-spacing: -.015em; line-height: 1; }
.section-subtitle { margin: .7rem 0 1.7rem; color: #c5bcaa; font-size: 1.03rem; line-height: 1.55; }
.find-tables-button {
  min-height: 43px;
  margin: 0 0 2.2rem;
  padding: .65rem 1.1rem;
  border: 1px solid var(--guild-gold);
  border-radius: 7px;
  background: transparent;
  color: var(--guild-gold-light);
  cursor: pointer;
  font-family: Georgia, serif;
  font-size: .8rem;
  font-weight: 700;
  letter-spacing: .045em;
  transition: background .2s ease, color .2s ease, transform .2s ease;
}
.find-tables-button span { display: none; }
.find-tables-button:hover { background: var(--guild-gold); color: #171109; transform: translateY(-2px); }
.tables-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(255px, 1fr)); gap: 1.25rem; }
.table-card { display: flex; min-width: 0; flex-direction: column; padding: 0; overflow: hidden; border: 1px solid rgba(212, 175, 55, .34); border-radius: 14px; background: #11100d; box-shadow: none; transition: border-color .22s ease, transform .22s ease, background .22s ease; }
.table-card:hover { border-color: var(--guild-gold-light); background: #18150f; box-shadow: none; transform: translateY(-5px); }
.table-image { height: 185px; overflow: hidden; background: #211a10; }
.table-image::after { position: absolute; inset: 0; content: ''; background: linear-gradient(transparent 55%, rgba(0, 0, 0, .55)); pointer-events: none; }
.table-image img { width: 100%; height: 100%; object-fit: cover; transition: transform .35s ease; }
.table-card:hover .table-image img { transform: scale(1.045); }
.table-header { padding: 1.2rem 1.25rem .15rem; }
.table-name { margin: 0; color: #f0e6c8; font-family: Georgia, serif; font-size: 1.4rem; font-weight: 700; line-height: 1.2; }
.table-info { padding: .45rem 1.25rem .75rem; }
.info-row { display: flex; justify-content: space-between; gap: 1rem; padding: .56rem 0; border-bottom: 1px solid rgba(240, 230, 140, .12); }
.info-label { color: var(--guild-gold); font-family: Georgia, serif; font-size: .71rem; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; }
.info-value { overflow: hidden; color: #d9d0c0; font-size: .88rem; text-align: right; text-overflow: ellipsis; white-space: nowrap; }
.vacancy-badge { align-self: flex-start; margin: .2rem 1.25rem 1rem; padding: .28rem .58rem; border: 1px solid rgba(240, 230, 140, .3); border-radius: 999px; color: var(--guild-gold-light); font-size: .72rem; letter-spacing: .03em; }
.vacancy-badge span { display: inline-flex; align-items: center; gap: .4rem; }
.vacancy-badge span::before { width: 6px; height: 6px; border-radius: 50%; background: var(--guild-gold); content: ''; }
.btn-join { min-height: 42px; margin: 0 1.25rem 1.25rem; padding: .6rem .8rem; border: 1px solid var(--guild-gold); border-radius: 7px; background: rgba(212, 175, 55, .08); color: var(--guild-gold-light); cursor: pointer; font-family: Georgia, serif; font-size: .78rem; font-weight: 700; transition: background .2s ease, color .2s ease; }
.btn-join:hover { background: var(--guild-gold); color: #171109; }

.features-section { min-height: auto; isolation: isolate; padding: clamp(4.5rem, 8vw, 7rem) 0; }
.features-grid { gap: 1rem; margin-top: 2.1rem; }
.feature-card { min-height: 220px; padding: 1.6rem; border: 1px solid rgba(212, 175, 55, .35); border-radius: 14px; background: rgba(14, 11, 8, .68); box-shadow: none; transition: transform .22s ease, background .22s ease, border-color .22s ease; }
.feature-card:hover { border-color: var(--guild-gold-light); background: rgba(31, 23, 13, .84); box-shadow: none; transform: translateY(-4px); }
.feature-icon { display: grid; width: 38px; height: 38px; place-items: center; margin-bottom: 1.15rem; color: var(--guild-gold-light); }
.feature-icon svg, .step-icon svg { width: 100%; height: 100%; fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 1.45; }
.feature-card h3 { margin: 0; color: #fff0c8; font-family: 'GuildDisplay', Georgia, serif; font-size: 1.55rem; font-weight: 400; }
.feature-card p { margin: .7rem 0 0; color: #d7cebf; font-size: .95rem; line-height: 1.6; }

.getting-started-section { padding: clamp(4rem, 7vw, 6rem) 0; background: #050505; border-top: 1px solid rgba(212, 175, 55, .22); }
.start-steps { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1.1rem; margin-top: 2.1rem; }
.start-step { display: flex; gap: 1rem; align-items: flex-start; padding: 1.45rem; border: 1px solid rgba(212, 175, 55, .32); border-radius: 12px; background: #100f0d; }
.step-icon { display: grid; width: 42px; height: 42px; flex: 0 0 auto; place-items: center; color: var(--guild-gold-light); }
.start-step h3 { margin: .08rem 0 0; color: #fff0c8; font-family: 'GuildDisplay', Georgia, serif; font-size: 1.45rem; font-weight: 400; }
.start-step p { margin: .45rem 0 0; color: #d0c7b7; font-size: .94rem; line-height: 1.6; }
.site-footer { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 1.2rem max(1.5rem, calc((100% - 1160px) / 2)); border-top: 1px solid rgba(212, 175, 55, .2); background: #020202; color: #bcb09a; font-size: .88rem; }
.site-footer p { margin: 0; color: var(--guild-gold); font-family: 'GuildDisplay', Georgia, serif; font-size: 1.25rem; }
.site-footer a { color: #ddd1b8; text-decoration-color: rgba(212, 175, 55, .55); text-underline-offset: 3px; }
.site-footer a:hover { color: var(--guild-gold-light); }

.modal2 { border: 1px solid rgba(212, 175, 55, .65); border-radius: 14px; background: #18130e; box-shadow: 0 22px 52px rgba(0, 0, 0, .5); }
.modal2 h2 { color: var(--guild-gold-light); font-family: 'GuildDisplay', Georgia, serif; font-weight: 400; }
.modal-close { border-radius: 50%; background: rgba(0, 0, 0, .18); color: var(--guild-gold-light); }
.form-group input { border-radius: 7px; background: rgba(0, 0, 0, .3); color: #fff4d8; }
.form-group input:focus { border-color: var(--guild-gold-light); box-shadow: 0 0 0 3px rgba(212, 175, 55, .15); outline: none; }
.image-upload-label { border-radius: 7px; color: var(--guild-gold-light); }
.home ::-webkit-scrollbar { width: 10px; }
.home ::-webkit-scrollbar-track { background: #090909; }
.home ::-webkit-scrollbar-thumb { border: 2px solid #090909; border-radius: 999px; background: var(--guild-gold-dim, #8b7500); }

@media (max-width: 768px) {
  .hero-content { grid-template-columns: 1fr; width: min(92%, 620px); padding-top: 4rem; }
  .hero-text { width: 100%; }
  .hero-dragon { min-height: 280px; }
  .auth-buttons { flex-direction: row; }
  .btn { width: auto; }
  .start-steps { grid-template-columns: 1fr; }
}
@media (max-width: 540px) {
  .tables-container, .features-container, .getting-started-container { width: min(100% - 2rem, 460px); }
  .auth-buttons { flex-direction: column; width: 100%; }
  .btn { width: 100%; }
  .hero-dragon { min-height: 230px; padding: 1rem; }
  .table-image { height: 165px; }
  .site-footer { align-items: flex-start; flex-direction: column; }
}
@media (prefers-reduced-motion: reduce) {
  .home *, .home *::before, .home *::after { scroll-behavior: auto !important; transition-duration: .01ms !important; animation-duration: .01ms !important; animation-iteration-count: 1 !important; }
}
/* Ajustes pontuais: hero, mesas recentes e responsividade */
.hero-section::before {
  position: absolute;
  inset: 22px;
  z-index: 1;
  content: '';
  border-top: 1px solid rgba(240, 230, 140, .35);
  border-bottom: 1px solid rgba(240, 230, 140, .2);
  pointer-events: none;
}
.hero-section::after {
  position: absolute;
  top: 22px;
  right: 7%;
  z-index: 1;
  width: min(23vw, 260px);
  height: 1px;
  background: var(--guild-gold-light);
  box-shadow: 0 10px 0 rgba(240, 230, 140, .32), 0 20px 0 rgba(240, 230, 140, .14);
  content: '';
  pointer-events: none;
}
.hero-content { position: relative; z-index: 2; }
.hero-dragon { min-height: 0; padding: 0; border: 0; background: transparent; box-shadow: none; animation: none; }
.hero-logo { width: min(100%, 360px); height: auto; overflow: visible; filter: drop-shadow(0 22px 24px rgba(0, 0, 0, .5)); }
.hero-logo .logo-ring { fill: rgba(7, 7, 5, .18); stroke: rgba(240, 230, 140, .68); stroke-width: 1.5; }
.hero-logo .logo-shield { fill: #15120c; stroke: var(--guild-gold-light); stroke-width: 3; stroke-linejoin: round; }
.hero-logo .logo-die { fill: rgba(212, 175, 55, .14); stroke: var(--guild-gold); stroke-width: 2; stroke-linejoin: round; }
.hero-logo .logo-mark { fill: none; stroke: var(--guild-gold-light); stroke-width: 5; stroke-linecap: round; stroke-linejoin: round; }
.hero-logo .logo-sword { fill: none; stroke: #f1e8d2; stroke-width: 3; stroke-linecap: round; }

.tables-grid { margin-top: .4rem; }
.table-card { position: relative; isolation: isolate; }
.table-card::before { position: absolute; top: 0; right: 18px; left: 18px; z-index: 2; height: 2px; background: var(--guild-gold); content: ''; opacity: .72; }
.table-card::after { position: absolute; inset: 9px; z-index: -1; border: 1px solid rgba(240, 230, 140, .1); border-radius: 9px; content: ''; pointer-events: none; }
.table-image { height: 200px; margin: 9px 9px 0; border-radius: 9px 9px 0 0; }
.table-header { padding: 1.35rem 1.35rem .4rem; }
.table-title-row { display: flex; align-items: center; }
.table-name { position: relative; padding-bottom: .7rem; font-size: .9rem; }
.table-name::after { position: absolute; right: 0; bottom: 0; left: 0; height: 1px; background: linear-gradient(90deg, rgba(212, 175, 55, .55), transparent); content: ''; }
.table-info { padding: .55rem 1.35rem 1rem; }
.info-row { position: relative; padding: .72rem 0 .72rem .8rem; }
.info-row::before { position: absolute; top: 50%; left: 0; width: 3px; height: 3px; border-radius: 50%; background: var(--guild-gold); content: ''; transform: translateY(-50%); }
.vacancy-badge { margin-top: .35rem; }
.btn-join { position: relative; overflow: hidden; }
.btn-join::after { position: absolute; top: 0; bottom: 0; left: 0; width: 3px; background: var(--guild-gold-light); content: ''; }
.find-tables-button { display: flex; align-items: center; justify-content: center; min-width: 190px; margin: 2.25rem auto 0; }

@media (max-width: 900px) {
  .hero-content { grid-template-columns: 1fr; width: min(92%, 760px); padding-top: 5.5rem; }
  .hero-text { width: 100%; max-width: none; }
  .hero-dragon { display: none; }
  .auth-buttons { width: 100%; }
  .auth-buttons .btn { flex: 1; }
  .hero-section::after { right: 4%; width: 170px; }
}

/* Ornamentos vetoriais da página */
.hero-section::before,
.hero-section::after { display: none; }
.hero-ornaments { position: absolute; inset: 0; z-index: 1; pointer-events: none; }
.hero-ornament { position: absolute; width: 150px; height: 150px; fill: none; stroke: rgba(240, 230, 140, .42); stroke-linecap: round; stroke-linejoin: round; stroke-width: 1.2; }
.hero-ornament circle { fill: rgba(212, 175, 55, .12); }
.hero-ornament--top-left { top: 25px; left: 28px; }
.hero-ornament--top-right { top: 25px; right: 28px; transform: scaleX(-1); }
.hero-ornament--bottom-left { bottom: 25px; left: 28px; transform: scaleY(-1); }
.hero-ornament--bottom-right { right: 28px; bottom: 25px; transform: scale(-1); }

.recent-tables-section,
.features-section,
.getting-started-section { position: relative; overflow: hidden; }
.tables-container,
.features-container,
.getting-started-container { position: relative; z-index: 2; }
.section-ornament { position: absolute; z-index: 1; fill: none; stroke: rgba(212, 175, 55, .22); stroke-linecap: round; stroke-linejoin: round; stroke-width: 1.25; pointer-events: none; }
.section-ornament circle { fill: rgba(240, 230, 140, .08); }
.section-ornament--tables { top: 50%; left: 2.5%; width: 160px; height: 270px; transform: translateY(-50%); }
.section-ornament--features { top: 50%; right: 2.5%; width: 160px; height: 270px; transform: translateY(-50%); }
.section-ornament--start { right: 5%; bottom: 8%; width: 210px; height: 182px; opacity: .72; }

@media (max-width: 900px) {
  .hero-ornaments,
  .section-ornament { display: none; }
}

.title { font-size: clamp(4.7rem, 9vw, 6rem); }
.find-tables-button { margin: 0 0 2.25rem; }

@media (min-width: 501px) and (max-width: 900px) {
  .auth-buttons { width: auto; }
  .auth-buttons .btn { width: auto; flex: 0 0 auto; }
}
@media (max-width: 500px) {
  .auth-buttons { flex-direction: column; width: 100%; }
  .auth-buttons .btn { width: 100%; }
}

.hero-logo-image {
  display: block;
  width: min(100%, 380px);
  max-height: 365px;
  object-fit: contain;
  filter: drop-shadow(0 22px 24px rgba(0, 0, 0, .5));
}
.section-ornament--tables-two { right: 4%; bottom: 7%; width: 120px; height: 120px; opacity: .58; }
.section-ornament--features-two { top: 13%; left: 4%; width: 124px; height: 124px; opacity: .48; }
.section-ornament--start-two { top: 12%; left: 4%; width: 118px; height: 118px; opacity: .45; }

@media (max-width: 500px) {
  .table-card { min-width: 0; }
  .vacancy-badge { align-self: stretch; min-height: 34px; margin: .45rem 1rem .7rem; padding: .45rem .65rem; text-align: center; }
  .vacancy-badge span { justify-content: center; }
  .btn-join { display: block; width: calc(100% - 2rem); min-height: 44px; margin: 0 1rem 1rem; white-space: normal; }
}

.find-tables-button {
  width: auto;
  min-width: 190px;
  min-height: 48px;
  align-self: center;
  margin: .4rem 0 2.25rem;
  padding: .7rem 1.25rem;
  line-height: 1.1;
  text-align: center;
}
.vacancy-badge {
  display: flex;
  width: max-content;
  max-width: calc(100% - 2rem);
  min-height: 32px;
  align-self: flex-start;
  align-items: center;
  margin: .45rem 1rem .7rem;
  box-sizing: border-box;
  white-space: nowrap;
}
.vacancy-badge span { display: inline-flex; align-items: center; white-space: nowrap; }

@media (max-width: 500px) {
  .vacancy-badge { width: max-content; align-self: flex-start; padding: .38rem .58rem; text-align: left; }
  .vacancy-badge span { justify-content: flex-start; }
}

.vacancy-badge {
  width: min(50%, 148px);
  min-height: 32px;
  margin-right: auto;
  margin-left: auto;
  box-sizing: border-box;
  text-align: center;
}
.vacancy-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  border-color: #35de6d;
  background: rgba(53, 222, 109, .08);
  color: #77f09d;
  font-size: .63rem;
  white-space: nowrap;
}
.vacancy-badge span { justify-content: center; }
.vacancy-badge span::before { background: #35de6d; box-shadow: 0 0 8px rgba(53, 222, 109, .7); }
.btn-join {
  display: block;
  width: calc(100% - 2.7rem);
  min-height: 48px;
  align-self: center;
  margin: 0 1.35rem 1.35rem;
  padding: .7rem 1rem;
  box-sizing: border-box;
  font-size: .88rem;
  line-height: 1.25;
  white-space: normal;
}
.btn-join:focus-visible {
  outline: 2px solid var(--guild-gold-light);
  outline-offset: -4px;
}

@media (max-width: 500px) {
  .vacancy-badge { width: min(50%, 148px); margin-right: auto; margin-left: auto; }
}
</style>
