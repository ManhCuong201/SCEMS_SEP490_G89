import axios, { AxiosInstance } from 'axios'

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'
const timeout = parseInt(import.meta.env.VITE_API_TIMEOUT || '10000', 10)

const api: AxiosInstance = axios.create({
  baseURL,
  timeout
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Don't redirect if it's a failed login attempt OR we are already on the login page
      const isLoginRequest = error.config && (error.config.url?.includes('/auth/login') || error.config.url?.includes('auth'));
      const isOnLoginPage = window.location.pathname.includes('/auth/login');

      if (!isLoginRequest && !isOnLoginPage) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        
        // Show Vietnamese message
        const message = error.response?.data?.message || 'Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.';
        import('react-hot-toast').then(({ toast }) => {
          toast.error(message);
        });

        setTimeout(() => {
          window.location.href = '/auth/login'
        }, 2000);
      }
    }
    return Promise.reject(error)
  }
)

export default api
