<script setup>
import { onMounted, ref } from 'vue'
import api from '../services/api'
import axios from 'axios'
import {useAuthStore} from '@/stores/auth.js'
import { useRouter } from 'vue-router'
import { useMensagensStore } from '@/stores/DmStore.js'
const mensagensStore = useMensagensStore()
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
  description: '',
  mode: 'online',
  image: null
})
const createTableError = ref('')

// Carrega os dados do perfil e as mesas relacionadas ao usuário.
async function loadDashboard() {
  loading.value = true
  error.value = null
  successMessage.value = ''
  try {
    const res = await api.get('/dxguild/user/dash')
    const data = res.data || {}
    user.value = data
    const authStore = useAuthStore()
    authStore.setUsuario(data.nome, data.imagem)
    const mesas = await api.get(`/dxguild/mesa/usuario/${user.value?.nome}`)
    const data2 = mesas.data.Criadas || {}
    createdTables.value = data2 || []
    participatingTables.value = mesas.data.Participa || []
  } catch (e) {
    error.value = e.message || 'Erro ao carregar dashboard'
  } finally {
    loading.value = false
  }
}

// Fecha e limpa o formulário de criação de mesa.
function closeCreateTableModal() {
  showCreateTableModal.value = false
  createTableError.value = ''
  createTableForm.value = {
    name: '',
    system: '',
    description: '',
    mode: 'online',
    image: null
  }
}
// Abre a mesa selecionada.
function entraMesa(mesa) {
  const nomeMesa = encodeURIComponent(mesa.nome);
  if(mesa.criador === user.value?.nome){
    router.push(`/mesa/${nomeMesa}`)
  } else {
    router.push(`/mesa/${nomeMesa}`)
  }

}
// Atualiza a imagem selecionada para a nova mesa.
function handleCreateTableImageUpload(event) {
  const file = event.target.files?.[0]
  if (!file) return

  createTableForm.value.image = file
}

// Valida os dados e cria uma mesa.
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
    const descricao = createTableForm.value.description.trim();
    const criador = user.value?.nome;
    const meio = createTableForm.value.mode;

      let res = await api.post('/dxguild/mesa', {
        nome: nome,
        sistema: sistema,
        descricao: descricao,
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
      if (!firstError.response || !firstError.response.data || firstError.response?.status === 404 || firstError.response?.status === 405  ) {
          createTableError.value = "Servidor fora do ar ou sem conexão";
          return; 
      } else {
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
        createTableError.value = "Erro ao criar mesa: " + ( firstError.response?.data?.mensagem  || firstError.response?.data || "Erro desconhecido.");
      return;
     }
     
    
        
    } 
    

  
  } finally {
    loading.value = false
  }
}

// Carrega o painel assim que a página é montada.
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
        <router-link to="/buscar" class="btn-link">
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
                <strong>{{ mesa.nome }}</strong>
                <div class="meta">{{ mesa.sistema }} • {{ mesa.players }} jogadores</div>
                <div v-if="mesa.vaga !== false" class="vacancy-badge success">temos vaga</div>
                <div v-else class="vacancy-badge danger">sem vagas</div>
              </div>
            </div>
            <div class="table-actions">
              <button @click="entraMesa(mesa)">Entrar</button>
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
            <label for="table-description">Descrição da Mesa</label>
            <textarea
              id="table-description"
              v-model="createTableForm.description"
              placeholder="Conte um pouco sobre a aventura e o estilo da mesa"
              rows="4"
            ></textarea>
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
                <span v-if="!createTableForm.image">📷 Escolher Imagem</span>
                <span v-else>✓ Imagem selecionada</span>
              </label>
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
.page-container {
  --profile-bg: #101211;
  --profile-surface: #191c1a;
  --profile-text: #f4f2eb;
  --profile-muted: #b5b9b3;
  --profile-gold: #e2ba61;
  --profile-line: #343831;
  min-height: calc(100vh - 60px);
  padding: 44px max(48px, calc((100% - 1200px) / 2)) 64px;
  background: var(--profile-bg);
  color: var(--profile-text);
  font-family: 'Manrope', 'Segoe UI', system-ui, sans-serif;
  font-size: 1rem;
  line-height: 1.6;
  color-scheme: dark;
}
.page-container *,
.page-container *::before,
.page-container *::after { box-sizing: border-box; }
.page-container ::selection { background: var(--profile-gold); color: var(--profile-bg); }
.page-container button,
.page-container input,
.page-container select,
.page-container textarea { font-family: inherit; }
.page-container button { cursor: pointer; }
.page-container button:focus-visible,
.page-container a:focus-visible,
.page-container input:focus-visible,
.page-container select:focus-visible,
.page-container textarea:focus-visible {
  outline: 2px solid var(--profile-gold);
  outline-offset: 4px;
}
.page-title {
  margin: 0 0 28px;
  color: var(--profile-text);
  font-size: clamp(2.75rem, 4vw, 3.5rem);
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-weight: 600;
  letter-spacing: -0.035em;
  line-height: 1.15;
}
.profile-header {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 32px;
  padding: 28px;
  border: 1px solid #5b503a;
  border-top: 2px solid #bd9b56;
  border-radius: 8px;
  background: radial-gradient(ellipse at top right, rgba(194,153,75,.12), transparent 65%), linear-gradient(135deg, #232720, #171b18);
  box-shadow: 0 12px 32px rgba(0,0,0,.2);
}
.avatar { flex: 0 0 auto; }
.avatar img {
  display: block;
  width: 96px;
  height: 96px;
  border: 2px solid #cfac64;
  padding: 4px;
  box-shadow: 0 0 0 4px rgba(207,172,100,.08), 0 6px 18px rgba(0,0,0,.25);
  border-radius: 50%;
  object-fit: cover;
  background: #252a25;
}
.profile-info { flex: 1; min-width: 0; }
.user-name {
  margin: 0;
  color: #f3dfb4;
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: clamp(2rem, 3vw, 2.75rem);
  font-weight: 600;
  letter-spacing: -0.025em;
  line-height: 1.25;
  overflow-wrap: anywhere;
}
.user-meta { margin: 6px 0 0; color: var(--profile-muted); font-size: 0.875rem; }
.stats { display: flex; flex-wrap: wrap; gap: 18px 24px; margin-top: 20px; }
.stat { min-width: 0; }
.stat + .stat { padding-left: 24px; border-left: 1px solid var(--profile-line); }
.stat .num { color: #edcc85; font-size: 1.625rem; font-weight: 700; line-height: 1.3; font-variant-numeric: tabular-nums; }
.stat .label { margin-top: 3px; color: var(--profile-muted); font-size: 0.75rem; }
.header-actions { display: flex; flex-wrap: wrap; align-items: center; justify-content: flex-end; gap: 10px; max-width: 420px; }
.btn-secondary,
.btn-primary,
.btn-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 44px;
  padding: 10px 16px;
  border: 1px solid var(--profile-line);
  border-radius: 5px;
  background: transparent;
  color: var(--profile-text);
  font-size: 0.875rem;
  font-weight: 600;
  line-height: 1.4;
  text-decoration: none;
  transition: background-color 180ms ease, border-color 180ms ease, color 180ms ease;
}
.btn-secondary { background: var(--profile-gold); border-color: var(--profile-gold); color: #19170f; }
.btn-secondary:hover { background: #f0cd81; border-color: #f0cd81; color: #19170f; }
.btn-primary:hover,
.btn-link:hover { background: #252921; border-color: #8e7c50; color: var(--profile-text); }
.search-icon { position: relative; width: 16px; height: 16px; flex: 0 0 16px; font-size: 0; }
.search-icon::before { content: ''; position: absolute; top: 1px; left: 1px; width: 10px; height: 10px; border: 1.5px solid currentColor; border-radius: 50%; }
.search-icon::after { content: ''; position: absolute; top: 11px; left: 10px; width: 6px; height: 1.5px; background: currentColor; transform: rotate(45deg); transform-origin: left center; }
.profile-grid { display: grid; grid-template-columns: minmax(0, 2fr) minmax(0, 1fr); gap: 24px; align-items: start; }
.card { min-width: 0; padding: 24px; border: 1px solid #484235; border-radius: 8px; background: linear-gradient(155deg, #22251f, #191c1a 65%); color: var(--profile-text); box-shadow: 0 8px 24px rgba(0,0,0,.2), inset 0 1px 0 rgba(238,214,163,.05); }
.card h2 { margin: 0 0 8px; padding-left: 12px; border-left: 3px solid #cda85b; color: var(--profile-text); font-family: 'Cormorant Garamond', Georgia, serif; font-size: 1.875rem; font-weight: 600; line-height: 1.3; letter-spacing: -0.02em; }
.muted { margin: 0 0 20px; color: var(--profile-muted); font-size: 0.875rem; }
.empty { margin-top: 20px; padding: 24px 18px; border: 1px dashed #485044; border-radius: 6px; color: var(--profile-muted); font-size: 0.875rem; line-height: 1.6; }
.table-list { list-style: none; margin: 0; padding: 0; }
.table-item { display: flex; align-items: center; justify-content: space-between; gap: 14px; padding: 20px 0; border-top: 1px solid var(--profile-line); }
.table-item:last-child { padding-bottom: 0; }
.table-main { display: flex; flex: 1; min-width: 0; align-items: center; gap: 14px; }
.table-thumb { display: block; flex: 0 0 64px; width: 64px; height: 72px; object-fit: cover; border: 1px solid #74603e; box-shadow: 0 4px 12px rgba(0,0,0,.25); border-radius: 5px; background: #252a25; }
.table-left { display: flex; flex: 1; min-width: 0; flex-direction: column; align-items: flex-start; }
.table-left strong { display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; width: 100%; overflow: hidden; overflow-wrap: anywhere; color: #f3dfb4; font-family: 'Cormorant Garamond', Georgia, serif; font-size: 1.5rem; font-weight: 600; line-height: 1.2; }
.meta { width: 100%; margin-top: 7px; color: var(--profile-muted); font-size: 0.8125rem; line-height: 1.5; overflow-wrap: anywhere; }
.vacancy-badge { display: inline-flex; align-items: center; gap: 7px; margin-top: 8px; padding: 3px 7px; border: 1px solid rgba(170,180,167,.18); border-radius: 4px; background: rgba(170,180,167,.06); color: var(--profile-muted); font-size: 0.6875rem; font-weight: 600; line-height: 1.5; }
.vacancy-badge::before { content: ''; flex: 0 0 6px; width: 6px; height: 6px; border-radius: 50%; }
.vacancy-badge.success::before { background: #59bf91; }
.vacancy-badge.danger::before { background: #939a94; }
.table-actions { flex: 0 0 auto; }
.table-actions button { display: inline-flex; align-items: center; justify-content: center; min-height: 44px; padding: 8px 14px; border: 1px solid #79623c; border-radius: 5px; background: linear-gradient(180deg, rgba(226,186,97,.08), rgba(226,186,97,.02)); color: var(--profile-gold); font-size: 0.8125rem; font-weight: 600; line-height: 1.4; transition: background-color 180ms ease, border-color 180ms ease; }
.table-actions button:hover { border-color: #65583b; background: #28271f; }
.error,
.success-message { margin-top: 20px; padding: 14px 16px; border: 1px solid var(--profile-line); border-radius: 6px; background: var(--profile-surface); font-size: 0.875rem; overflow-wrap: anywhere; }
.error { color: #ffa7a0; }
.success-message { color: #8dd9af; }
.modal-overlay { position: fixed; z-index: 2000; inset: 0; display: flex; align-items: center; justify-content: center; overflow-y: auto; padding: 24px; background: rgb(0 0 0 / 80%); }
.modal2 { position: relative; width: 100%; max-width: 480px; max-height: calc(100dvh - 48px); overflow-y: auto; padding: 32px; border: 1px solid #65583b; border-radius: 8px; background: var(--profile-surface); color: var(--profile-text); scrollbar-width: thin; scrollbar-color: #65583b var(--profile-surface); }
.modal-close { position: absolute; top: 12px; right: 12px; display: grid; place-items: center; width: 44px; height: 44px; padding: 0; border: 0; border-radius: 4px; background: transparent; color: var(--profile-muted); font-size: 1.125rem; }
.modal-close:hover { background: #292d26; color: var(--profile-text); }
.modal2 h2 { margin: 0 36px 28px 0; font-family: 'Cormorant Garamond', Georgia, serif; font-size: 2rem; font-weight: 600; line-height: 1.25; letter-spacing: -0.025em; color: var(--profile-text); }
.form-group { display: flex; flex-direction: column; gap: 8px; margin-bottom: 18px; }
.form-group label { color: var(--profile-text); font-size: 0.875rem; font-weight: 500; }
.form-group input,
.form-group select,
.form-group textarea { width: 100%; min-width: 0; min-height: 46px; padding: 10px 12px; border: 1px solid #555c50; border-radius: 5px; background: var(--profile-bg); color: var(--profile-text); caret-color: var(--profile-gold); font-size: 0.9375rem; line-height: 1.5; }
.form-group input::placeholder,
.form-group textarea::placeholder { color: #a5ada1; opacity: 1; }
.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus { border-color: var(--profile-gold); }
.form-group textarea { min-height: 104px; resize: vertical; }
.image-upload-section { display: flex; flex-direction: column; gap: 8px; }
.image-input { display: none; }
.form-group .image-upload-label { display: inline-flex; align-items: center; justify-content: center; min-height: 48px; margin: 0; padding: 12px; border: 1px dashed #8e7c50; border-radius: 5px; color: var(--profile-gold); text-align: center; cursor: pointer; }
.image-upload-label:hover { background: #28271f; }
.btn-submit { width: 100%; min-height: 48px; margin-top: 6px; padding: 12px 18px; border: 1px solid var(--profile-gold); border-radius: 5px; background: var(--profile-gold); color: #19170f; font-weight: 600; line-height: 1.4; }
.btn-submit:hover { background: #f0cd81; border-color: #f0cd81; }
.erro { margin: 16px 0 0; color: #ffa7a0; font-size: 0.875rem; line-height: 1.5; overflow-wrap: anywhere; }
@media (max-width: 1100px) {
  .header-actions { max-width: 230px; }
  .profile-header { gap: 20px; }
  .profile-grid { gap: 20px; }
  .card { padding: 20px; }
  .table-main { gap: 10px; }
  .table-thumb { flex-basis: 56px; width: 56px; height: 64px; }
}
@media (max-width: 900px) {
  .page-container { padding: 32px 24px 48px; }
  .profile-header { flex-wrap: wrap; }
  .header-actions { width: 100%; max-width: none; justify-content: flex-start; padding-top: 20px; border-top: 1px solid var(--profile-line); }
  .profile-grid { grid-template-columns: minmax(0, 1fr); }
  .table-thumb { flex-basis: 72px; width: 72px; height: 72px; }
  .table-main { gap: 16px; }
}
@media (max-width: 640px) {
  .page-container { padding: 28px 20px 40px; }
  .page-title { margin-bottom: 22px; }
  .profile-header { align-items: flex-start; gap: 16px; padding: 20px; margin-bottom: 24px; }
  .avatar img { width: 64px; height: 64px; }
  .user-name { font-size: 2rem; }
  .user-meta { font-size: 0.75rem; }
  .stats { gap: 12px 16px; margin-top: 16px; }
  .stat + .stat { padding-left: 16px; }
  .stat .num { font-size: 1.375rem; }
  .stat .label { font-size: 0.6875rem; }
  .header-actions { gap: 10px; padding-top: 16px; }
  .header-actions > * { flex: 1 1 100%; width: 100%; }
  .card { padding: 20px 16px; }
  .card h2 { font-size: 1.75rem; }
  .table-item { align-items: flex-start; flex-wrap: wrap; gap: 10px; padding-top: 18px; padding-bottom: 18px; }
  .table-main { width: 100%; flex-basis: 100%; align-items: flex-start; gap: 12px; }
  .table-thumb { width: 64px; height: 72px; flex-basis: 64px; }
  .table-actions { display: flex; justify-content: flex-end; width: 100%; }
  .table-actions button { min-width: 84px; }
  .modal-overlay { padding: 16px; }
  .modal2 { max-height: calc(100dvh - 32px); padding: 28px 20px; }
}
@media (max-width: 360px) {
  .profile-header { gap: 12px; padding: 16px; }
  .avatar img { width: 52px; height: 52px; }
  .stats { gap: 12px; }
  .stat + .stat { padding-left: 12px; }
}
@media (prefers-reduced-motion: reduce) {
  .btn-primary, .btn-secondary, .btn-link, .table-actions button { transition: none; }
}

/* Acabamento alinhado à home, sem alterar a estrutura. */
.page-title::after {
  content: '';
  display: block;
  width: 56px;
  height: 2px;
  margin-top: 16px;
  background: #cda85b;
}
.btn-secondary, .btn-submit {
  background: linear-gradient(180deg, #ebcb7d, #d6ae55);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.2), 0 3px 10px rgba(0,0,0,.18);
  font-weight: 700;
}
.btn-primary { border-color: #79623c; color: #ecd29b; }
.vacancy-badge.success { color: #a9dbbe; border-color: rgba(89,191,145,.22); background: rgba(89,191,145,.07); }
.table-item { transition: border-color 180ms ease; }
.table-item:hover { border-top-color: #887146; }
.empty { background: rgba(226,186,97,.025); }
@media (min-width: 901px) {
  .profile-grid > .card:last-child .table-item { flex-wrap: wrap; }
  .profile-grid > .card:last-child .table-main { flex-basis: 100%; }
  .profile-grid > .card:last-child .table-actions { margin-left: auto; }
}
@media (prefers-reduced-motion: reduce) {
  .table-item { transition: none; }
}
</style>
