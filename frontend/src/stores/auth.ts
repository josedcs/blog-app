import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
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
  const isAuthenticated = computed(() => !!token.value)

  const { mutate: loginMutation } = useMutation(LOGIN_MUTATION)
  const { mutate: registerMutation } = useMutation(REGISTER_MUTATION)
  const { result: meResult } = useQuery(ME_QUERY, null, () => ({
    enabled: !!token.value
  }))

  const login = async (email: string, password: string) => {
    try {
      const result = await loginMutation({ input: { email, password } })
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

  // Watch for me query result
  if (meResult.value?.me) {
    user.value = meResult.value.me
  }

  return {
    user,
    token,
    isAuthenticated,
    login,
    register,
    logout
  }
})
