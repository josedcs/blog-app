<template>
  <div class="modal-overlay" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2>Create New Blog Post</h2>
        <button @click="$emit('close')" class="close-btn">&times;</button>
      </div>
      
      <form @submit.prevent="handleSubmit" class="create-form">
        <div class="form-group">
          <label for="title">Title</label>
          <input
            id="title"
            v-model="form.title"
            type="text"
            required
            placeholder="Enter post title"
          />
        </div>
        
        <div class="form-group">
          <label for="content">Content</label>
          <textarea
            id="content"
            v-model="form.content"
            required
            placeholder="Write your blog post content..."
            rows="10"
          ></textarea>
        </div>
        
        <div class="form-actions">
          <button type="button" @click="$emit('close')" class="cancel-btn">
            Cancel
          </button>
          <button type="submit" :disabled="loading" class="submit-btn">
            {{ loading ? 'Creating...' : 'Create Post' }}
          </button>
        </div>
      </form>
      
      <div v-if="error" class="error-message">
        {{ error }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useMutation } from '@vue/apollo-composable'
import gql from 'graphql-tag'

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

const emit = defineEmits(['close', 'post-created'])

const loading = ref(false)
const error = ref('')

const form = reactive({
  title: '',
  content: ''
})

const { mutate: createPostMutation } = useMutation(CREATE_BLOG_POST)

const handleSubmit = async () => {
  loading.value = true
  error.value = ''
  
  try {
    const result = await createPostMutation({ 
      input: { title: form.title, content: form.content, published: true } 
    })
    
    if (result?.data?.createBlogPost) {
      form.title = ''
      form.content = ''
      emit('post-created')
    } else {
      error.value = 'Failed to create post'
    }
  } catch (err) {
    error.value = err.message || 'An error occurred. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.modal-header h2 {
  margin: 0;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
}

.close-btn:hover {
  color: #333;
}

.create-form {
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

.form-group input,
.form-group textarea {
  padding: 0.75rem;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s ease;
  font-family: inherit;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #667eea;
}

.form-group textarea {
  resize: vertical;
  min-height: 200px;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1rem;
}

.cancel-btn {
  background: #f5f5f5;
  color: #333;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.cancel-btn:hover {
  background: #e0e0e0;
}

.submit-btn {
  background: #667eea;
  color: white;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
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

.error-message {
  background: #fee;
  color: #c33;
  padding: 0.75rem;
  border-radius: 8px;
  margin-top: 1rem;
  text-align: center;
}
</style>
