<!-- src/components/kanban/TaskCard.vue -->
<template>
  <v-card
    class="task-card ma-2"
    variant="outlined"
    @click="$emit('click', task)"
  >
    <v-card-text class="pa-3">
      <!-- Task Header -->
      <div class="d-flex align-center justify-space-between mb-2">
        <v-chip
          :color="getPriorityColor(task.priority)"
          size="x-small"
          variant="flat"
        >
          <v-icon start size="12">{{ getPriorityIcon(task.priority) }}</v-icon>
          {{ task.priority }}
        </v-chip>
        
        <v-chip
          size="x-small"
          variant="tonal"
          color="grey"
        >
          #{{ task.id.split('-')[1] }}
        </v-chip>
      </div>

      <!-- Task Title -->
      <h4 class="text-body-1 font-weight-medium mb-2 task-title">
        {{ task.title }}
      </h4>

      <!-- Task Description (truncated) -->
      <div v-if="task.description" class="text-body-2 text-medium-emphasis mb-2 task-description">
        {{ stripHtmlAndTruncate(task.description, 100) }}
      </div>

      <!-- Task Tags -->
      <div v-if="task.tags && task.tags.length > 0" class="mb-2">
        <v-chip
          v-for="tag in task.tags.slice(0, 3)"
          :key="tag"
          size="x-small"
          variant="outlined"
          class="mr-1 mb-1"
        >
          {{ tag }}
        </v-chip>
        <span v-if="task.tags.length > 3" class="text-caption text-medium-emphasis">
          +{{ task.tags.length - 3 }} more
        </span>
      </div>

      <!-- Task Footer -->
      <div class="d-flex align-center justify-space-between">
        <!-- Left side: Due date, Comments, Attachments -->
        <div class="d-flex align-center">
          <!-- Due Date -->
          <div v-if="task.dueDate" class="d-flex align-center mr-3">
            <v-icon 
              size="16"
              :color="isOverdue(task.dueDate) ? 'error' : 'grey'"
              class="mr-1"
            >
              mdi-calendar
            </v-icon>
            <span 
              class="text-caption"
              :class="isOverdue(task.dueDate) ? 'text-error' : ''"
            >
              {{ formatDate(task.dueDate) }}
            </span>
          </div>

          <!-- Comments -->
          <div v-if="task.commentsCount > 0" class="d-flex align-center mr-2">
            <v-icon size="16" color="grey" class="mr-1">
              mdi-comment-outline
            </v-icon>
            <span class="text-caption">{{ task.commentsCount }}</span>
          </div>

          <!-- Attachments -->
          <div v-if="task.attachmentsCount > 0" class="d-flex align-center mr-2">
            <v-icon size="16" color="grey" class="mr-1">
              mdi-paperclip
            </v-icon>
            <span class="text-caption">{{ task.attachmentsCount }}</span>
          </div>
        </div>
        
        <!-- Right side: Assignees -->
        <div class="d-flex align-center">
          <!-- Multiple Assignees -->
          <div v-if="assignees.length > 0" class="assignee-avatars">
            <v-tooltip
              v-for="(assignee, index) in assignees.slice(0, 3)"
              :key="assignee.id"
              :text="assignee.name"
              location="top"
            >
              <template #activator="{ props }">
                <v-avatar
                  v-bind="props"
                  size="24"
                  :class="{ 'ml-n2': index > 0 }"
                  class="assignee-avatar"
                >
                  <v-img
                    v-if="assignee.avatar"
                    :src="assignee.avatar"
                    :alt="assignee.name"
                  />
                  <span v-else class="text-caption">
                    {{ assignee.name?.charAt(0) }}
                  </span>
                </v-avatar>
              </template>
            </v-tooltip>
            
            <!-- Show count if more than 3 assignees -->
            <v-avatar
              v-if="assignees.length > 3"
              size="24"
              color="grey-lighten-1"
              class="assignee-avatar ml-n2"
            >
              <span class="text-caption text-white">
                +{{ assignees.length - 3 }}
              </span>
              <v-tooltip activator="parent" location="top">
                {{ assignees.slice(3).map(a => a.name).join(', ') }}
              </v-tooltip>
            </v-avatar>
          </div>
          
          <!-- No assignees placeholder -->
          <v-avatar
            v-else
            size="24"
            color="grey-lighten-3"
            class="assignee-avatar"
          >
            <v-icon size="16" color="grey">
              mdi-account-plus
            </v-icon>
            <v-tooltip activator="parent" location="top">
              No assignees
            </v-tooltip>
          </v-avatar>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
const props = defineProps({
  task: {
    type: Object,
    required: true
  },
  assignees: {
    type: Array,
    default: () => []
  }
})

defineEmits(['click'])

// Methods
const getPriorityColor = (priority) => {
  const colors = {
    critical: 'error',
    high: 'warning',
    medium: 'info',
    low: 'success'
  }
  return colors[priority] || 'grey'
}

const getPriorityIcon = (priority) => {
  const icons = {
    critical: 'mdi-alert-circle',
    high: 'mdi-arrow-up-bold',
    medium: 'mdi-minus',
    low: 'mdi-arrow-down-bold'
  }
  return icons[priority] || 'mdi-circle'
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = date.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Tomorrow'
  if (diffDays === -1) return 'Yesterday'
  if (diffDays > 0 && diffDays <= 7) return `${diffDays} days`
  if (diffDays < 0 && diffDays >= -7) return `${Math.abs(diffDays)} days ago`
  
  return date.toLocaleDateString()
}

const isOverdue = (dueDate) => {
  if (!dueDate) return false
  return new Date(dueDate) < new Date()
}

const truncateText = (text, maxLength) => {
  if (!text || text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

const stripHtmlAndTruncate = (html, maxLength) => {
  if (!html) return ''
  
  // Create a temporary element to strip HTML tags
  const temp = document.createElement('div')
  temp.innerHTML = html
  const text = temp.textContent || temp.innerText || ''
  
  return truncateText(text, maxLength)
}
</script>

<style scoped>
.task-card {
  cursor: pointer;
  transition: all 0.2s ease;
  border-radius: 8px;
}

.task-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.task-title {
  line-height: 1.2;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.task-description {
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.assignee-avatars {
  display: flex;
  align-items: center;
}

.assignee-avatar {
  border: 2px solid white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.assignee-avatar:first-child {
  margin-left: 0;
}
</style>