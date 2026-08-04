<script setup>
import { onMounted, ref } from 'vue'
import api from '../services/api'
import axios from 'axios'
import {useAuthStore} from '@/stores/auth.js'
import { useRouter } from 'vue-router'
const user = ref(null)
const createdTables = ref([])
const participatingTables = ref([])
const loading = ref(false)
const error = ref(null)
const successMessage = ref('')
const erroMesa = ref('')
const showCreateTableModal = ref(false)
const router = useRouter()
const createTableForm = ref({
  name: '',
  system: '',
  mode: 'online',
  image: null,
  imagePreview: ''
})
const createTableError = ref('')

async function loadDashboard() {
  loading.value = true
  error.value = null
  successMessage.value = ''
  try {
    const res = await api.get('http://localhost:8080/dxguild/user/dash')
    const data = res.data || {}
    user.value = data
    const authStore = useAuthStore()
    authStore.setUsuario(data.nome, data.imagem)
    const mesas = await api.get(`http://localhost:8080/dxguild/mesa/usuario/${user.value?.id}`)
    const data2 = mesas.data.Criadas || {}
    createdTables.value = data2 || []
  } catch (e) {
    error.value = e.message || 'Erro ao carregar dashboard'
  } finally {
    loading.value = false
  }
}

function closeCreateTableModal() {
  showCreateTableModal.value = false
  createTableError.value = ''
  createTableForm.value = {
    name: '',
    system: '',
    mode: 'online',
    image: null,
    imagePreview: ''
  }
}
function entraMesa(mesa) {
  console.log("mesa", mesa.criador, "user", user.value?.nome)
  if(mesa.criador === user.value?.nome){
    router.push(`/mesa/${mesa.nome}`)
  } else {
    router.push(`/mesa/${mesa.nome}`)
  }

}
function handleCreateTableImageUpload(event) {
  const file = event.target.files?.[0]
  if (!file) return

  createTableForm.value.image = file
  createTableForm.value.imagePreview = URL.createObjectURL(file)
}

async function createTable() {
  if (!createTableForm.value.name || !createTableForm.value.system) {
    createTableError.value = 'Preencha o nome e o sistema da mesa.'
    return
  }

  loading.value = true
  createTableError.value = ''
  successMessage.value = ''

  
    
    try {
      const formData = new FormData()
    formData.append('file', createTableForm.value.image)
    formData.append('upload_preset', 'dxguild')
    const cloudName = 'dwt6xjnmh';
    const cloudinaryRes = await axios.post(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, 
        formData    
      );
    const urlDaImagemFinal = cloudinaryRes.data.secure_url; 
    const nome  = createTableForm.value.name.trim();
    const sistema = createTableForm.value.system.trim();
    const criador = user.value?.nome;
    const meio = createTableForm.value.mode;

    console.log(urlDaImagemFinal)
    
      let res = await api.post('http://localhost:8080/dxguild/mesa', {
        nome: nome,
        sistema: sistema,
        criador: criador,
        meio: meio,
        imagem: urlDaImagemFinal,
        vaga: true,
        mestre: true
      })
      
    const createdMesa = res.data || {}
    createdTables.value.unshift({
      ...createdMesa,
      id: createdMesa.id || Date.now(),
      name: createdMesa.name || createTableForm.value.name,
      system: createdMesa.system || createTableForm.value.system,
      players: createdMesa.players || 0
    })

    successMessage.value = 'Mesa criada com sucesso!'
    closeCreateTableModal()
    await loadDashboard()
     } catch (firstError) {
      console.log("opa")
      if (!firstError.response || !firstError.response.data || firstError.response?.status === 404 || firstError.response?.status === 405  ) {
          createTableError.value = "Servidor fora do ar ou sem conexão";
          return; 
      } else {
        console.log("aqui o")
        if(firstError.config?.url?.includes('cloudinary.com')){
        createTableError.value = "Erro ao fazer upload da imagem";
        return;
      }
     const data = firstError.response.data;
     if(Array.isArray(data)){
      
        createTableError.value = "Erro ao criar mesa: " + ( data[0] || "Erro desconhecido.");
        return;
     }
     else {
        console.log("ta aqui" + firstError.response.data)
        createTableError.value = "Erro ao criar mesa: " + ( firstError.response?.data?.mensagem  || firstError.response?.data || "Erro desconhecido.");
      return;
     }
     
    
        
    } 
    

  
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadDashboard()
})
</script>

<template>
  <div class="page-container">
    <h1 class="page-title">Meu Perfil</h1>

    <div class="profile-header">
      <div class="avatar">
        <img :src="user?.imagem || '/src/assets/imgs/avatar-default.png'" alt="avatar" />
      </div>
      <div class="profile-info">
        <h2 class="user-name">{{ user?.nome || 'Aventureiro' }}</h2>
        <p class="user-meta">Membro da Guilda • Nível 5</p>
        <div class="stats">
          <div class="stat">
            <div class="num">{{ createdTables.length }}</div>
            <div class="label">Mesas criadas</div>
          </div>
          <div class="stat">
            <div class="num">{{ participatingTables.length }}</div>
            <div class="label">Participações</div>
          </div>
        </div>
      </div>
      <div class="header-actions">
        <button class="btn-secondary" @click="showCreateTableModal = true">Criar Mesa</button>
        <router-link to="/mesas" class="btn-link">
          <span class="search-icon">🔍</span>
          Encontrar Mesas
        </router-link>
        <button class="btn-primary" @click="$router.push('/meu-perfil/editar')">Editar Perfil</button>
      </div>
    </div>

    <section class="profile-grid">
      <div class="card">
        <h2>Minhas Mesas</h2>
        <p class="muted">Mesas criadas por você</p>
        <div v-if="loading" class="muted">Carregando...</div>
        <div v-if="!loading && createdTables.length === 0" class="empty">Você ainda não criou nenhuma mesa.</div>
        <ul class="table-list">
          <li v-for="mesa in createdTables" :key="mesa.id" class="table-item">
            <div class="table-main">
              <img :src="mesa.imagem || mesa.image || '/src/assets/imgs/fundo2.png'" alt="Imagem da mesa" class="table-thumb" />
              <div class="table-left">
                <strong>{{ mesa.nome }}</strong>
                <div class="meta">{{ mesa.sistema }} - {{ mesa.meio }}</div>
                <div v-if="mesa.vaga !== false" class="vacancy-badge success">temos vaga</div>
                <div v-else class="vacancy-badge danger">sem vagas</div>
              </div>  
            </div>
            <div class="table-actions">
              <button @click="entraMesa(mesa)">Ver</button>
            </div>
          </li>
        </ul>
      </div>

      <div class="card">
        <h2>Mesas que Participo</h2>
        <p class="muted">Mesas em que você está inscrito</p>
        <div v-if="loading" class="muted">Carregando...</div>
        <div v-if="!loading && participatingTables.length === 0" class="empty">Você não participa de mesas no momento.</div>
        <ul class="table-list">
          <li v-for="mesa in participatingTables" :key="mesa.id" class="table-item">
            <div class="table-main">
              <img :src="mesa.imagem || mesa.image || '/src/assets/imgs/fundo2.png'" alt="Imagem da mesa" class="table-thumb" />
              <div class="table-left">
                <strong>{{ mesa.name }}</strong>
                <div class="meta">{{ mesa.system }} • {{ mesa.players }} jogadores</div>
                <div v-if="mesa.vaga !== false" class="vacancy-badge success">temos vaga</div>
                <div v-else class="vacancy-badge danger">sem vagas</div>
              </div>
            </div>
            <div class="table-actions">
              <button @click="$router.push(`/mesa/${mesa.id}`)">Entrar</button>
            </div>
          </li>
        </ul>
      </div>

    </section>

    <div v-if="error" class="error">{{ error }}</div>
    <div v-if="successMessage" class="success-message">{{ successMessage }}</div>

    <div v-if="showCreateTableModal" class="modal-overlay" @click.self="closeCreateTableModal">
      <div class="modal2">
        <button class="modal-close" @click="closeCreateTableModal">✕</button>
        <h2>Criar Mesa</h2>

        <form @submit.prevent="createTable">
          <div class="form-group">
            <label for="table-name">Nome da Mesa</label>
            <input id="table-name" v-model="createTableForm.name" type="text" placeholder="Nome da sua mesa" required />
          </div>

          <div class="form-group">
            <label for="table-system">Sistema</label>
            <input id="table-system" v-model="createTableForm.system" type="text" placeholder="D&D 5e, Tormenta, etc." required />
          </div>

          <div class="form-group">
            <label for="table-mode">Meio</label>
            <select id="table-mode" v-model="createTableForm.mode">
              <option value="online">Online</option>
              <option value="presencial">Presencial</option>
            </select>
          </div>

          <div class="form-group">
            <label for="table-image">Imagem da Mesa</label>
            <div class="image-upload-section">
              <input id="table-image" type="file" accept="image/*" @change="handleCreateTableImageUpload" class="image-input" />
              <label for="table-image" class="image-upload-label">
                <span v-if="!createTableForm.imagePreview">📷 Escolher Imagem</span>
                <span v-else>✓ Imagem selecionada</span>
              </label>
              <img v-if="createTableForm.imagePreview" :src="createTableForm.imagePreview" alt="Pré-visualização da mesa" class="preview-image" />
            </div>
          </div>

          <button type="submit" class="btn-submit">Criar Mesa</button>
        </form>
      
        
        <p v-if="createTableError" class="erro">{{ createTableError }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-container {
  min-height: 70vh;
  padding: 1.25rem;
  background: linear-gradient(180deg, #0b0b0b 0%, #050505 100%);
  color: #f5e9d0;
}

.page-title {
  font-family: 'TheWildBreathOfZelda', serif;
  font-size: 2.4rem;
  margin-bottom: 1rem;
  background: linear-gradient(135deg, #d4af37 0%, #f0e68c 50%, #8b7500 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.6);
}

.profile-header {
  display: flex;
  gap: 1rem;
  align-items: center;
  background: linear-gradient(180deg, rgba(212,175,55,0.03), rgba(0,0,0,0.2));
  border: 1px solid rgba(212,175,55,0.15);
  padding: 1rem;
  border-radius: 10px;
  margin-bottom: 1rem;
}

.avatar img { width: 96px; height:96px; border-radius:12px; object-fit:cover; border:3px solid rgba(212,175,55,0.9); box-shadow:0 6px 18px rgba(0,0,0,0.6) }
.profile-info { flex:1 }
.user-name { margin:0; font-family: 'TheWildBreathOfZelda', serif; line-break: anywhere; font-size:1.6rem; color:#f7e7b9 }
.user-meta { margin:0.25rem 0 0; color:#d9c88a; font-family: 'Cinzel', serif }
.stats { display:flex; gap:1rem; margin-top:0.6rem }
.stat { background:linear-gradient(180deg, rgba(0,0,0,0.25), rgba(0,0,0,0.45)); padding:0.5rem 0.75rem; border-radius:8px; border:1px solid rgba(212,175,55,0.12) }
.stat .num { font-weight:700; font-size:1.1rem; color:#fff }
.stat .label { font-size:0.8rem; color:#d9c88a }
.header-actions { display:flex; gap:0.5rem; flex-wrap:wrap }

.btn-link {
  display:inline-flex;
  align-items:center;
  gap:0.4rem;
  text-decoration:none;
  color:#f7e7b9;
  border:1px solid rgba(212,175,55,0.35);
  padding:8px 14px;
  border-radius:8px;
  font-family: 'Cinzel', serif;
  font-weight:700;
}

.search-icon {
  font-size:0.95rem;
}

.profile-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1rem;
  align-items: start;
}

.card {
  background: linear-gradient(180deg, #0f0f0f, #090707);
  border-radius: 10px;
  padding: 1rem;
  box-shadow: 0 8px 30px rgba(0,0,0,0.6), inset 0 -2px 6px rgba(212,175,55,0.02);
  border: 1px solid rgba(212,175,55,0.12);
}

.card h2 { font-family: 'Cinzel', serif; color: #f0e6b8; margin-bottom:0.25rem }
.muted { color: #cdbf90; font-size: 0.95rem; }
.empty { color: #9f8f59; padding: .5rem 0 }
.error { color: #ffb4a2; margin-top: 1rem }

.table-list { list-style: none; padding: 0; margin: 0.5rem 0 0 0 }
.table-item { display:flex; align-items:center; justify-content:space-between; gap:0.75rem; padding:0.75rem 0; border-bottom: 1px solid rgba(212,175,55,0.06) }
.table-main { display:flex; align-items:center; gap:0.75rem; flex:1 }
.table-thumb { width: 56px; height: 56px; object-fit: cover; border-radius: 8px; border: 1px solid rgba(212,175,55,0.2); flex-shrink: 0 }
.table-left { display:flex; flex-direction:column }
.table-left strong { font-family: 'Cinzel', serif; color:#f7e7b9 }
.meta { font-size: 0.85rem; color:#cdbf90 }
.vacancy-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-top: 0.35rem;
  width: fit-content;
  color: #fff;
  padding: 0.35rem 0.65rem;
  border-radius: 8px;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
}

.vacancy-badge.success {
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
}

.vacancy-badge.danger {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
}
.table-actions button { background:linear-gradient(135deg,#d4af37,#f0e68c); color:#000; border: none; padding:8px 12px; border-radius:6px; cursor:pointer; font-weight:700 }
.table-actions button:hover { box-shadow: 0 6px 18px rgba(212,175,55,0.25); transform:translateY(-2px) }

.btn-primary { background: linear-gradient(135deg,#d4af37,#f0e68c); color:#000; border:none; padding:8px 14px; border-radius:8px; font-family: 'Cinzel', serif; font-weight:700 }
.btn-secondary { background: transparent; color:#f7e7b9; border:1px solid rgba(212,175,55,0.35); padding:8px 14px; border-radius:8px; font-family: 'Cinzel', serif; font-weight:700; cursor:pointer }
.success-message { color:#8ee7a5; margin-top:1rem }

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}
.modal2 {
  position: relative;
  width: min(100%, 480px);
  background: linear-gradient(180deg, #14110d 0%, #0b0b0b 100%);
  border: 1px solid rgba(212,175,55,0.25);
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 16px 40px rgba(0,0,0,0.7);
}
.modal-close {
  position: absolute;
  top: 0.85rem;
  right: 0.85rem;
  border: none;
  background: transparent;
  color: #f0e6b8;
  font-size: 1.2rem;
  cursor: pointer;
}
.modal2 h2 {
  margin: 0 0 1rem;
  font-family: 'Cinzel', serif;
  color: #f0e6b8;
}
.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  margin-bottom: 0.85rem;
}
.form-group label {
  color: #d9c88a;
  font-size: 0.95rem;
}
.form-group input,
.form-group select {
  padding: 0.7rem 0.8rem;
  border-radius: 8px;
  border: 1px solid rgba(212,175,55,0.2);
  background: rgba(0,0,0,0.45);
  color: #f5e9d0;
}
.image-upload-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.image-input {
  display: none;
}
.image-upload-label {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.7rem 0.8rem;
  border-radius: 8px;
  border: 1px dashed rgba(212,175,55,0.35);
  color: #f0e6b8;
  cursor: pointer;
}
.preview-image {
  width: 100%;
  max-height: 180px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid rgba(212,175,55,0.2);
}
.btn-submit {
  width: 100%;
  margin-top: 0.4rem;
  padding: 0.8rem 1rem;
  border: none;
  border-radius: 8px;
  background: linear-gradient(135deg,#d4af37,#f0e68c);
  color: #000;
  font-weight: 700;
  cursor: pointer;
}
.erro {
  margin-top: 0.75rem;
  color: #ffb4a2;
}

@media (max-width:900px) {
  .profile-grid { grid-template-columns: 1fr }
  .profile-header { flex-direction:column; align-items:flex-start }
  .header-actions { width:100%; display:flex; justify-content:flex-end; gap:0.5rem; flex-wrap:wrap }
}

@media (max-width:640px) {
  .header-actions {
    flex-direction: column;
    align-items: center;
    gap: 0.7rem;
  }

  .header-actions > * {
    width: 100%;
    max-width: 240px;
    justify-content: center;
    text-align: center;
    box-sizing: border-box;
  }

  .btn-primary,
  .btn-secondary,
  .btn-link {
    display: inline-flex;
    justify-content: center;
    align-items: center;
    min-height: 44px;
  }

  .table-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.6rem;
  }

  .table-main {
    width: 100%;
    align-items: flex-start;
  }

  .table-left {
    min-width: 0;
    flex: 1;
  }

  .table-actions {
    width: 100%;
  }

  .table-actions button {
    width: 100%;
  }
}
</style>
