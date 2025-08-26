<template>
  <div class="post-detail-container">
    <div class="post-detail-card">
      <div class="post-header">
        <h1>{{ post?.title }}</h1>
        <div class="post-meta">
          <span class="author">by {{ post?.author?.username }}</span>
          <span class="date">{{ formatDate(post?.createdAt) }}</span>
          <span 
            :class="['status', post?.published ? 'published' : 'draft']"
          >
            {{ post?.published ? 'Published' : 'Draft' }}
          </span>
        </div>
      </div>
      
      <div class="post-content">
        {{ post?.content }}
      </div>
      
      <!-- Author actions -->
      <div v-if="isAuthor" class="author-actions">
        <button 
          @click="togglePublishStatus" 
          :disabled="loading"
          :class="['toggle-btn', post?.published ? 'unpublish' : 'publish']"
        >
          {{ loading ? 'Updating...' : (post?.published ? 'Unpublish' : 'Publish') }}
        </button>
        <button @click="editPost" class="edit-btn">Edit</button>
        <button @click="deletePost" class="delete-btn">Delete</button>
      </div>
      
      <div class="back-link">
        <button @click="$router.push('/')" class="back-btn">
          ← Back to Posts
        </button>
      </div>
    </div>
    
    <!-- Loading state -->
    <div v-if="loading && !post" class="loading-state">
      <p>Loading post...</p>
    </div>
    
    <!-- Error state -->
    <div v-if="error" class="error-state">
      <p>Error loading post: {{ error.message }}</p>
      <button @click="refetch" class="retry-btn">Retry</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuery, useMutation } from '@vue/apollo-composable'
import { useAuthStore } from '@/stores/auth'
import gql from 'graphql-tag'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const GET_BLOG_POST = gql`
  query GetBlogPost($id: String!) {
    blogPost(id: $id) {
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

const UPDATE_BLOG_POST = gql`
  mutation UpdateBlogPost($id: String!, $input: UpdateBlogPostInput!) {
    updateBlogPost(id: $id, input: $input) {
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

const DELETE_BLOG_POST = gql`
  mutation DeleteBlogPost($id: String!) {
    deleteBlogPost(id: $id)
  }
`

const { result, loading, error, refetch } = useQuery(
  GET_BLOG_POST, 
  () => ({ id: route.params.id as string }),
  () => ({ enabled: !!route.params.id })
)

const { mutate: updatePostMutation, loading: updateLoading } = useMutation(UPDATE_BLOG_POST)
const { mutate: deletePostMutation, loading: deleteLoading } = useMutation(DELETE_BLOG_POST)

const post = computed(() => result.value?.blogPost)
const isAuthor = computed(() => {
  return authStore.user?.id === post.value?.author?.id
})

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const togglePublishStatus = async () => {
  if (!post.value) return
  
  try {
    const result = await updatePostMutation({
      id: post.value.id,
      input: {
        title: post.value.title,
        content: post.value.content,
        published: !post.value.published
      }
    })
    
    if (result?.data?.updateBlogPost) {
      // The query will automatically update due to Apollo cache
      console.log('Post status updated successfully')
    }
  } catch (error) {
    console.error('Error updating post:', error)
  }
}

const editPost = () => {
  // Navigate to edit page or open edit modal
  router.push(`/post/${post.value?.id}/edit`)
}

const deletePost = async () => {
  if (!post.value || !confirm('Are you sure you want to delete this post?')) return
  
  try {
    const result = await deletePostMutation({ id: post.value.id })
    
    if (result?.data?.deleteBlogPost) {
      router.push('/')
    }
  } catch (error) {
    console.error('Error deleting post:', error)
  }
}
</script>

<style scoped>
.post-detail-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.post-detail-card {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.post-header {
  margin-bottom: 2rem;
  border-bottom: 1px solid #eee;
  padding-bottom: 1rem;
}

.post-header h1 {
  color: #333;
  margin: 0 0 1rem 0;
  font-size: 2.5rem;
  line-height: 1.2;
}

.post-meta {
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
}

.author {
  color: #666;
  font-weight: 500;
}

.date {
  color: #888;
  font-size: 0.9rem;
}

.status {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
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

.post-content {
  color: #333;
  line-height: 1.8;
  font-size: 1.1rem;
  margin-bottom: 2rem;
  white-space: pre-wrap;
}

.author-actions {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  padding-top: 1rem;
  border-top: 1px solid #eee;
}

.toggle-btn, .edit-btn, .delete-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.toggle-btn.publish {
  background: #4caf50;
  color: white;
}

.toggle-btn.publish:hover {
  background: #45a049;
}

.toggle-btn.unpublish {
  background: #ff9800;
  color: white;
}

.toggle-btn.unpublish:hover {
  background: #f57c00;
}

.edit-btn {
  background: #2196f3;
  color: white;
}

.edit-btn:hover {
  background: #1976d2;
}

.delete-btn {
  background: #f44336;
  color: white;
}

.delete-btn:hover {
  background: #d32f2f;
}

.toggle-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.back-link {
  text-align: center;
}

.back-btn {
  background: #667eea;
  color: white;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.back-btn:hover {
  background: #5a6fd8;
}

.loading-state, .error-state {
  text-align: center;
  padding: 3rem;
  color: #666;
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

@media (max-width: 768px) {
  .post-detail-container {
    padding: 1rem;
  }
  
  .post-detail-card {
    padding: 1.5rem;
  }
  
  .post-header h1 {
    font-size: 2rem;
  }
  
  .post-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .author-actions {
    flex-direction: column;
  }
}
</style>
