import axios from 'axios'
import { useAuthStore } from '../stores/auth'
import router from '../router'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/',
})

// Interceptor para adicionar token nas requisições
api.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore()
    const token = authStore.getToken()

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Interceptor para tratar erros
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    const authStore = useAuthStore()

    if (error.response?.status === 401) {
      if (originalRequest && !originalRequest._retry) {
        originalRequest._retry = true
        const refreshToken = authStore.getRefresh()

        if (!refreshToken) {
          authStore.clearToken()
          router.push('/')
          return Promise.reject(error)
        }

        try {
          const res = await axios.post('/dxguild/auth/refresh', { token: refreshToken })
          const data = res.data || {}
          const newAccessToken = data.acessToken || data.accessToken || data.token || data
          const newRefreshToken = data.refreshToken || authStore.getRefresh()
          console.log(data)
          if (!newAccessToken) {
            throw new Error('Refresh failed: no access token returned')
          }

          authStore.setToken(newAccessToken, newRefreshToken)
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`

          return api(originalRequest)
        } catch (refreshError) {
          console.log(refreshError)
          authStore.clearToken()
          router.push('/')
          return Promise.reject(refreshError)
        }
      }

      authStore.clearToken()
      router.push('/')
    }

    return Promise.reject(error)
  }
)

export default api
