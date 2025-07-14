<template>
  <v-card 
    class="kanban-card" 
    elevation="2"
    :class="{ 'kanban-card--dragging': isDragging }"
    @click="$emit('click', task)"
  >
    <v-card-text class="pa-3">
      <!-- Header with Priority and ID -->
      <div class="d-flex align-center justify-space-between mb-2">
        <v-chip 
          :color="getPriorityColor(task.priority)" 
          size="x-small" 
          variant="flat"
          class="font-weight-medium"
        >
          {{ task.priority }}
        </v-chip>
        <span class="text-caption text-medium-emphasis">
          #{{ task.id.toString().slice(-6) }}
        </span>
      </div>
      
      <!-- Title -->
      <h6 class="text-subtitle-2 mb-2 task-title">{{ task.title }}</h6>
      
      <!-- Description -->
      <p v-if="task.description" class="text-body-2 text-medium-emphasis mb-2 task-description">
        {{ task.description }}
      </p>
      
      <!-- Tags -->
      <div v-if="task.tags && task.tags.length" class="mb-3">
        <v-chip
          v-for="tag in task.tags.slice(0, 3)"
          :key="tag"
          size="x-small"
          variant="outlined"
          class="mr-1 mb-1"
        >
          {{ tag }}
        </v-chip>
        <v-chip
          v-if="task.tags.length > 3"
          size="x-small"
          variant="outlined"
          color="grey"
          class="mr-1 mb-1"
        >
          +{{ task.tags.length - 3 }}
        </v-chip>
      </div>
      
      <!-- Footer -->
      <div class="d-flex align-center justify-space-between">
        <!-- Left side: Assignee and Due Date -->
        <div class="d-flex align-center">
          <v-avatar 
            v-if="task.assigneeId"
            size="20"
            class="mr-2"
          >
            <v-img 
              :src="getAssigneeAvatar(task.assigneeId)" 
              :alt="getAssigneeName(task.assigneeId)"
            />
          </v-avatar>
          
          <div v-if="task.dueDate" class="d-flex align-center">
            <v-icon size="12" class="mr-1" :color="getDueDateColor(task.dueDate)">
              mdi-calendar
            </v-icon>
            <span class="text-caption" :class="getDueDateClass(task.dueDate)">
              {{ formatDate(task.dueDate) }}
            </span>
          </div>
        </div>
        
        <!-- Right side: Metadata icons -->
        <div class="d-flex align-center">
          <v-tooltip v-if="task.commentsCount > 0" location="top">
            <template #activator="{ props }">
              <div v-bind="props" class="d-flex align-center mr-2">
                <v-icon size="12" class="mr-1">mdi-comment-outline</v-icon>
                <span class="text-caption">{{ task.commentsCount }}</span>
              </div>
            </template>
            <span>{{ task.commentsCount }} comment{{ task.commentsCount !== 1 ? 's' : '' }}</span>
          </v-tooltip>
          
          <v-tooltip v-if="task.attachmentsCount > 0" location="top">
            <template #activator="{ props }">
              <div v-bind="props" class="d-flex align-center mr-2">
                <v-icon size="12" class="mr-1">mdi-paperclip</v-icon>
                <span class="text-caption">{{ task.attachmentsCount }}</span>
              </div>
            </template>
            <span>{{ task.attachmentsCount }} attachment{{ task.attachmentsCount !== 1 ? 's' : '' }}</span>
          </v-tooltip>
          
          <v-tooltip v-if="task.subtasksCount > 0" location="top">
            <template #activator="{ props }">
              <div v-bind="props" class="d-flex align-center">
                <v-icon size="12" class="mr-1">mdi-format-list-checks</v-icon>
                <span class="text-caption">
                  {{ task.completedSubtasks || 0 }}/{{ task.subtasksCount }}
                </span>
              </div>
            </template>
            <span>{{ task.completedSubtasks || 0 }} of {{ task.subtasksCount }} subtasks completed</span>
          </v-tooltip>
        </div>
      </div>
      
      <!-- Progress bar for subtasks -->
      <v-progress-linear
        v-if="task.subtasksCount > 0"
        :model-value="getSubtaskProgress(task)"
        height="3"
        rounded
        class="mt-2"
        :color="getSubtaskProgress(task) === 100 ? 'success' : 'primary'"
      />
    </v-card-text>
  </v-card>
</template>

<script setup>
import { computed } from 'vue'
import { useProjectsStore } from '@/stores/projects'

const props = defineProps({
  task: {
    type: Object,
    required: true
  },
  isDragging: {
    type: Boolean,
    default: false
  }
})

defineEmits(['click'])

const projectsStore = useProjectsStore()

const getPriorityColor = (priority) => {
  const colors = {
    critical: 'error',
    high: 'warning', 
    medium: 'info',
    low: 'success'
  }
  return colors[priority] || 'grey'
}

const getAssigneeAvatar = (userId) => {
  const user = projectsStore.getUserById(userId)
  return user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${userId}`
}

const getAssigneeName = (userId) => {
  const user = projectsStore.getUserById(userId)
  return user?.name || userId
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  const today = new Date()
  const diffTime = date - today
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Tomorrow'
  if (diffDays === -1) return 'Yesterday'
  if (diffDays > 1 && diffDays <= 7) return `${diffDays} days`
  if (diffDays < -1 && diffDays >= -7) return `${Math.abs(diffDays)} days ago`
  
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  })
}

const getDueDateColor = (dateString) => {
  const date = new Date(dateString)
  const today = new Date()
  const diffTime = date - today
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays < 0) return 'error' // Overdue
  if (diffDays <= 1) return 'warning' // Due soon
  return 'success' // Future
}

const getDueDateClass = (dateString) => {
  const date = new Date(dateString)
  const today = new Date()
  const diffTime = date - today
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays < 0) return 'text-error' // Overdue
  if (diffDays <= 1) return 'text-warning' // Due soon
  return '' // Normal
}

const getSubtaskProgress = (task) => {
  if (!task.subtasksCount || task.subtasksCount === 0) return 0
  return Math.round(((task.completedSubtasks || 0) / task.subtasksCount) * 100)
}
</script>

<style scoped>
.kanban-card {
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  max-width: 100%;
}

.kanban-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.kanban-card--dragging {
  transform: rotate(3deg);
  opacity: 0.9;
  z-index: 1000;
}

.task-title {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
}

.task-description {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.4;
}

.v-chip {
  font-size: 0.7rem;
}

@media (max-width: 600px) {
  .kanban-card {
    font-size: 0.9rem;
  }
  
  .task-title {
    font-size: 0.95rem;
  }
  
  .task-description {
    -webkit-line-clamp: 1;
  }
}
</style>