<template>
  <div class="blog-container">
    <div class="header">
      <h1>Blog Posts</h1>
      <button @click="showCreateForm = true" class="create-btn">
        Create New Post
      </button>
    </div>
    
    <!-- Real-time notifications -->
    <div v-if="notifications.length > 0" class="notifications">
      <div
        v-for="notification in notifications"
        :key="notification.id"
        class="notification"
        @click="removeNotification(notification.id)"
      >
        <span class="notification-icon">📢</span>
        {{ notification.message }}
        <button class="notification-close">&times;</button>
      </div>
    </div>
    
    <!-- Loading state -->
    <div v-if="loading" class="loading-state">
      <p>Loading blog posts...</p>
    </div>
    
    <!-- Error state -->
    <div v-else-if="error" class="error-state">
      <p>Error loading blog posts: {{ error.message }}</p>
      <button @click="() => refetch()" class="retry-btn">Retry</button>
    </div>
    
    <!-- Empty state -->
    <div v-else-if="!allPosts.length" class="empty-state">
      <p>No blog posts yet. Be the first to create one!</p>
    </div>
    
    <!-- Posts grid -->
    <div v-else class="posts-grid">
      <div
        v-for="(post, index) in allPosts"
        :key="post.id"
        class="post-card"
        :class="{ 
          'new-post': post.isNew,
          'my-post': post.isMyPost,
          'unpublished': !post.published
        }"
        :style="{ animationDelay: `${index * 0.1}s` }"
        @click="viewPost(post.id)"
      >
        <div class="post-header">
          <h3>{{ post.title }}</h3>
          <span class="author">by {{ post.author?.username || 'Unknown' }}</span>
        </div>
        <div class="post-content">
          {{ truncateContent(post.content) }}
        </div>
        <div class="post-footer">
          <span class="date">{{ formatDate(post.createdAt) }}</span>
          <div class="status-container">
            <span v-if="post.published" class="status published">Published</span>
            <span v-else class="status draft">Draft</span>
            <span v-if="post.isMyPost && !post.published" class="status my-draft">My Draft</span>
          </div>
        </div>
      </div>
    </div>
    
    <CreatePostForm
      v-if="showCreateForm"
      @close="showCreateForm = false"
      @post-created="handlePostCreated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useQuery, useMutation } from '@vue/apollo-composable'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import gql from 'graphql-tag'
import CreatePostForm from './CreatePostForm.vue'

const router = useRouter()
const authStore = useAuthStore()

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

const GET_MY_POSTS = gql`
  query GetMyPosts {
    myBlogPosts {
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

const showCreateForm = ref(false)
const notifications = ref<Array<{id: number, message: string, timestamp: Date}>>([])
const previousPosts = ref<any[]>([])
const currentUser = ref<any>(null)

// Get current user from localStorage or auth store
const getCurrentUser = () => {
  try {
    const token = localStorage.getItem('authToken')
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]))
      return payload
    }
  } catch (error) {
    console.error('Error parsing user token:', error)
  }
  return null
}

// Use polling instead of subscriptions
const { result: publicPostsResult, loading: publicLoading, error: publicError, refetch: refetchPublic } = useQuery(GET_BLOG_POSTS, null, {
  pollInterval: 3000,
  fetchPolicy: 'cache-and-network'
})

const { result: myPostsResult, loading: myLoading, error: myError, refetch: refetchMy } = useQuery(GET_MY_POSTS, null, {
  pollInterval: 3000,
  fetchPolicy: 'cache-and-network',
  enabled: !!authStore.isAuthenticated
})

const { mutate: createPostMutation } = useMutation(CREATE_BLOG_POST)

// Computed properties
const loading = computed(() => publicLoading.value || (authStore.isAuthenticated && myLoading.value))
const error = computed(() => publicError.value || myError.value)

const publicPosts = computed(() => publicPostsResult.value?.blogPosts || [])
const myPosts = computed(() => myPostsResult.value?.myBlogPosts || [])

// Combine and deduplicate posts
const allPosts = computed(() => {
  const publicPostsList = publicPosts.value
  const myPostsList = myPosts.value
  
  // Create a map of all posts by ID
  const postsMap = new Map()
  
  // Add public posts
  publicPostsList.forEach((post: any) => {
    postsMap.set(post.id, {
      ...post,
      isMyPost: false,
      isNew: !previousPosts.value.find((p: any) => p.id === post.id)
    })
  })
  
  // Add my posts (this will override public posts if they exist)
  myPostsList.forEach((post: any) => {
    postsMap.set(post.id, {
      ...post,
      isMyPost: true,
      isNew: !previousPosts.value.find((p: any) => p.id === post.id)
    })
  })
  
  // Convert map back to array and sort by creation date
  return Array.from(postsMap.values()).sort((a: any, b: any) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
})

// Watch for new posts and show notifications
watch(allPosts, (newPosts, oldPosts) => {
  if (oldPosts && oldPosts.length > 0) {
    const newPostIds = newPosts.map((p: any) => p.id)
    const oldPostIds = oldPosts.map((p: any) => p.id)
    
    const actualNewPosts = newPosts.filter((post: any) => 
      !oldPostIds.includes(post.id) && newPostIds.includes(post.id)
    )
    
    if (!currentUser.value) {
      currentUser.value = getCurrentUser()
    }
    
    actualNewPosts.forEach((post: any) => {
      const isMyPost = currentUser.value && 
        (post.author.id === currentUser.value.userId || 
         post.author.email === currentUser.value.email)
      
      if (!isMyPost && post.published) {
        addNotification(`New post: "${post.title}" by ${post.author.username}`)
      }
      
      setTimeout(() => {
        const postIndex = newPosts.findIndex((p: any) => p.id === post.id)
        if (postIndex !== -1) {
          newPosts[postIndex].isNew = false
        }
      }, 5000)
    })
  }
  
  previousPosts.value = [...newPosts]
}, { deep: true })

const truncateContent = (content: string) => {
  return content.length > 150 ? content.substring(0, 150) + '...' : content
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString()
}

const addNotification = (message: string) => {
  const notification = {
    id: Date.now(),
    message,
    timestamp: new Date()
  }
  notifications.value.unshift(notification)
  
  setTimeout(() => {
    removeNotification(notification.id)
  }, 8000)
}

const removeNotification = (id: number) => {
  const index = notifications.value.findIndex(n => n.id === id)
  if (index > -1) {
    notifications.value.splice(index, 1)
  }
}

const handlePostCreated = () => {
  showCreateForm.value = false
  refetchPublic()
  refetchMy()
}

const viewPost = (postId: string) => {
  router.push(`/post/${postId}`)
}

const createPost = async (title: string, content: string) => {
  try {
    const result = await createPostMutation({ 
      input: { title, content, published: false } // Default to unpublished
    })
    
    if (result?.data?.createBlogPost) {
      await refetchPublic()
      await refetchMy()
      return { success: true }
    } else {
      return { success: false, error: 'Failed to create post' }
    }
  } catch (error: any) {
    return { success: false, error: error.message || 'An error occurred' }
  }
}

defineExpose({ createPost })
</script>

<style scoped>
.blog-container {
  max-width: none; /* Remove max-width constraint */
  margin: 0 auto;
  padding: 2rem;
  width: 100%;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  max-width: 1400px; /* Optional: limit header width */
  margin-left: auto;
  margin-right: auto;
}

.header h1 {
  color: #333;
  margin: 0;
}

.create-btn {
  background: #667eea;
  color: white;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.create-btn:hover {
  background: #5a6fd8;
}

.notifications {
  margin-bottom: 1rem;
  max-width: 1400px; /* Optional: limit notifications width */
  margin-left: auto;
  margin-right: auto;
}

.notification {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  animation: slideIn 0.3s ease;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease;
}

.notification:hover {
  transform: translateY(-1px);
}

.notification-icon {
  font-size: 1.2rem;
}

.notification-close {
  background: none;
  border: none;
  color: white;
  font-size: 1.2rem;
  cursor: pointer;
  margin-left: auto;
  opacity: 0.7;
  transition: opacity 0.2s ease;
}

.notification-close:hover {
  opacity: 1;
}

@keyframes slideIn {
  from {
    transform: translateX(-100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.loading-state {
  text-align: center;
  padding: 3rem;
  color: #666;
}

.error-state {
  text-align: center;
  padding: 3rem;
  color: #c33;
}

.retry-btn {
  background: #667eea;
  color: white;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  margin-top: 1rem;
}

.retry-btn:hover {
  background: #5a6fd8;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: #666;
}

.posts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 1.5rem;
  max-width: 1400px; /* Optional: limit grid width */
  margin: 0 auto;
}

/* Responsive breakpoints */
@media (min-width: 768px) {
  .posts-grid {
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: 2rem;
  }
}

@media (min-width: 1024px) {
  .posts-grid {
    grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
    gap: 2.5rem;
  }
}

@media (min-width: 1440px) {
  .posts-grid {
    grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
    gap: 3rem;
  }
}

.post-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  animation: fadeInUp 0.6s ease forwards;
  opacity: 0;
  transform: translateY(20px);
  cursor: pointer;
}

.post-card.new-post {
  animation: newPostSlideIn 0.8s ease forwards;
  border: 2px solid #667eea;
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
}

.post-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 15px rgba(0, 0, 0, 0.1);
}

.post-card.new-post:hover {
  box-shadow: 0 12px 30px rgba(102, 126, 234, 0.4);
}

@keyframes fadeInUp {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes newPostSlideIn {
  0% {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  50% {
    opacity: 1;
    transform: translateY(5px) scale(1.02);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.post-header {
  margin-bottom: 1rem;
}

.post-header h3 {
  margin: 0 0 0.5rem 0;
  color: #333;
}

.author {
  color: #666;
  font-size: 0.9rem;
}

.post-content {
  color: #555;
  line-height: 1.6;
  margin-bottom: 1rem;
}

.post-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85rem;
}

.date {
  color: #888;
}

.status {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

.status.published {
  background: #e8f5e8;
  color: #2e7d32;
}

.status.draft {
  background: #fff3e0;
  color: #f57c00;
}

.post-card.my-post {
  border-left: 4px solid #667eea;
}

.post-card.unpublished {
  opacity: 0.8;
  background: #fafafa;
}

.post-card.unpublished:hover {
  opacity: 1;
  background: white;
}

.status-container {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.status.my-draft {
  background: #e3f2fd;
  color: #1976d2;
  font-weight: 600;
}
</style>
