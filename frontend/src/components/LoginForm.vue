<template>
    <div class="login-container">
      <div class="login-card">
        <h2>{{ isLogin ? 'Login' : 'Register' }}</h2>
        
        <form @submit.prevent="handleSubmit" class="login-form">
          <div class="form-group">
            <label for="username" v-if="!isLogin">Username</label>
            <input
              v-if="!isLogin"
              id="username"
              v-model="form.username"
              type="text"
              required
              placeholder="Username"
            />
          </div>
          
          <div class="form-group">
            <label for="email">Email</label>
            <input
              id="email"
              v-model="form.email"
              type="email"
              required
              placeholder="Email"
            />
          </div>
          
          <div class="form-group">
            <label for="password">Password</label>
            <input
              id="password"
              v-model="form.password"
              type="password"
              required
              placeholder="Password"
            />
          </div>
          
          <button type="submit" :disabled="loading" class="submit-btn">
            {{ loading ? 'Loading...' : (isLogin ? 'Login' : 'Register') }}
          </button>
        </form>
        
        <div class="toggle-form">
          <p>
            {{ isLogin ? "Don't have an account?" : "Already have an account?" }}
            <button @click="toggleForm" class="toggle-btn">
              {{ isLogin ? 'Register' : 'Login' }}
            </button>
          </p>
        </div>
        
        <div v-if="error" class="error-message">
          {{ error }}
        </div>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, reactive } from 'vue'
  import { useAuthStore } from '@/stores/auth'
  import { useRouter } from 'vue-router'
  
  const authStore = useAuthStore()
  const router = useRouter()
  
  const isLogin = ref(true)
  const loading = ref(false)
  const error = ref('')
  
  const form = reactive({
    username: '',
    email: '',
    password: ''
  })
  
  const handleSubmit = async () => {
    loading.value = true
    error.value = ''
    
    try {
      let result
      if (isLogin.value) {
        result = await authStore.login(form.email, form.password)
      } else {
        result = await authStore.register(form.username, form.email, form.password)
      }
      
      if (result.success) {
        router.push('/blog')
      } else {
        error.value = result.error
      }
    } catch (err) {
      error.value = 'An error occurred. Please try again.'
    } finally {
      loading.value = false
    }
  }
  
  const toggleForm = () => {
    isLogin.value = !isLogin.value
    error.value = ''
    form.username = ''
    form.email = ''
    form.password = ''
  }
  </script>
  
  <style scoped>
  .login-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }
  
  .login-card {
    background: white;
    padding: 2rem;
    border-radius: 12px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    width: 100%;
    max-width: 400px;
  }
  
  .login-card h2 {
    text-align: center;
    margin-bottom: 2rem;
    color: #333;
  }
  
  .login-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  
  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .form-group label {
    font-weight: 500;
    color: #555;
  }
  
  .form-group input {
    padding: 0.75rem;
    border: 2px solid #e1e5e9;
    border-radius: 8px;
    font-size: 1rem;
    transition: border-color 0.3s ease;
  }
  
  .form-group input:focus {
    outline: none;
    border-color: #667eea;
  }
  
  .submit-btn {
    background: #667eea;
    color: white;
    padding: 0.75rem;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.3s ease;
  }
  
  .submit-btn:hover:not(:disabled) {
    background: #5a6fd8;
  }
  
  .submit-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  .toggle-form {
    text-align: center;
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid #e1e5e9;
  }
  
  .toggle-btn {
    background: none;
    border: none;
    color: #667eea;
    cursor: pointer;
    font-weight: 500;
    text-decoration: underline;
  }
  
  .toggle-btn:hover {
    color: #5a6fd8;
  }
  
  .error-message {
    background: #fee;
    color: #c33;
    padding: 0.75rem;
    border-radius: 8px;
    margin-top: 1rem;
    text-align: center;
  }
  </style>


