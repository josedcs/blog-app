import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { useMutation, useQuery } from '@vue/apollo-composable'
import gql from 'graphql-tag'

const LOGIN_MUTATION = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      token
      user {
        id
        email
        username
      }
    }
  }
`

const REGISTER_MUTATION = gql`
  mutation Register($input: CreateUserInput!) {
    register(input: $input) {
      token
      user {
        id
        email
        username
      }
    }
  }
`

const ME_QUERY = gql`
  query Me {
    me {
      id
      email
      username
    }
  }
`

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const token = ref(localStorage.getItem('authToken') || null)
  const isAuthenticated = computed(() => !!token.value && !!user.value)

  const { mutate: loginMutation } = useMutation(LOGIN_MUTATION)
  const { mutate: registerMutation } = useMutation(REGISTER_MUTATION)
  const { result: meResult, error: meError, refetch: refetchMe } = useQuery(ME_QUERY, null, () => ({
    enabled: !!token.value,
    fetchPolicy: 'cache-and-network'
  }))

  // Watch for me query result and update user
  watch(meResult, (newResult) => {
    if (newResult?.me) {
      user.value = newResult.me
    }
  }, { immediate: true })

  // Watch for me query errors and clear auth if token is invalid
  watch(meError, (error) => {
    if (error && token.value) {
      console.error('Auth error:', error)
      logout()
    }
  })

  // Initialize user data on app load if token exists
  const initializeAuth = async () => {
    if (token.value && !user.value) {
      try {
        await refetchMe()
      } catch (error) {
        console.error('Failed to initialize auth:', error)
        logout()
      }
    }
  }

  const login = async (email: string, password: string) => {
    try {
      const result = await loginMutation({ 
        input: { email, password } 
      })
      if (result?.data?.login) {
        token.value = result.data.login.token
        user.value = result.data.login.user
        localStorage.setItem('authToken', result.data.login.token)
        return { success: true }
      }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const register = async (username: string, email: string, password: string) => {
    try {
      const result = await registerMutation({ input: { username, email, password } })
      if (result?.data?.register) {
        token.value = result.data.register.token
        user.value = result.data.register.user
        localStorage.setItem('authToken', result.data.register.token)
        return { success: true }
      }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const logout = () => {
    token.value = null
    user.value = null
    localStorage.removeItem('authToken')
  }

  // Initialize auth when store is created
  initializeAuth()

  return {
    user,
    token,
    isAuthenticated,
    login,
    register,
    logout,
    initializeAuth
  }
})
