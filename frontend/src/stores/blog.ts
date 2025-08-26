import { defineStore } from 'pinia'
import { ref } from 'vue'
import gql from 'graphql-tag'

const GET_BLOG_POSTS = gql`
  query GetBlogPosts {
    blogPosts {
      id
      title
      content
      published
      createdAt
      updatedAt
      author {
        id
        username
      }
    }
  }
`

const CREATE_BLOG_POST = gql`
  mutation CreateBlogPost($input: CreateBlogPostInput!) {
    createBlogPost(input: $input) {
      id
      title
      content
      published
      createdAt
      updatedAt
      author {
        id
        username
      }
    }
  }
`

interface BlogPost {
  id: string
  title: string
  content: string
  published: boolean
  createdAt: string
  updatedAt: string
  author: {
    id: string
    username: string
  }
}

interface Notification {
  id: number
  message: string
  timestamp: Date
}

export const useBlogStore = defineStore('blog', () => {
  const posts = ref<BlogPost[]>([])
  const notifications = ref<Notification[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchPosts = async () => {
    loading.value = true
    error.value = null
    
    try {
      // We'll use the Apollo client directly
      const { defaultClient } = await import('@/apollo/client')
      const result = await defaultClient.query({
        query: GET_BLOG_POSTS
      })
      
      if (result.data?.blogPosts) {
        console.log('Posts loaded:', result.data.blogPosts)
        posts.value = result.data.blogPosts
      }
    } catch (err) {
      console.error('Error fetching posts:', err)
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  const createPost = async (title: string, content: string) => {
    try {
      console.log('Creating post with:', { title, content })
      
      const { defaultClient } = await import('@/apollo/client')
      const result = await defaultClient.mutate({
        mutation: CREATE_BLOG_POST,
        variables: { 
          input: { title, content, published: true } 
        }
      })
      
      console.log('Create post result:', result)
      
      if (result.data?.createBlogPost) {
        console.log('Post created successfully:', result.data.createBlogPost)
        // Add the new post to the local state immediately
        posts.value.unshift(result.data.createBlogPost)
        
        // Add notification
        notifications.value.unshift({
          id: Date.now(),
          message: `New post: ${result.data.createBlogPost.title} by ${result.data.createBlogPost.author.username}`,
          timestamp: new Date()
        })
        
        // Remove notification after 5 seconds
        setTimeout(() => {
          const index = notifications.value.findIndex(n => n.id === Date.now())
          if (index > -1) {
            notifications.value.splice(index, 1)
          }
        }, 5000)
        
        return { success: true }
      } else {
        return { success: false, error: 'Failed to create post' }
      }
    } catch (err) {
      console.error('Create post error:', err)
      return { success: false, error: err.message || 'An error occurred' }
    }
  }

  const clearNotifications = () => {
    notifications.value = []
  }

  return {
    posts,
    notifications,
    loading,
    error,
    createPost,
    clearNotifications,
    fetchPosts
  }
})
