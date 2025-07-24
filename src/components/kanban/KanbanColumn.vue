<!-- src/components/kanban/KanbanColumn.vue -->
<template>
  <v-card
    :color="column.color || 'surface'"
    variant="outlined"
    class="kanban-column"
    :class="{ 'column-collapsed': column.collapsed }"
  >
    <!-- Column Header -->
    <v-card-title class="column-header d-flex align-center justify-space-between">
      <div class="d-flex align-center">
        <v-btn
          variant="text"
          size="small"
          :icon="column.collapsed ? 'mdi-chevron-right' : 'mdi-chevron-down'"
          @click="$emit('toggle-collapse', column.id)"
        />
        <span class="text-subtitle-1 font-weight-bold">{{ column.title }}</span>
        <v-chip
          size="small"
          variant="flat"
          color="primary"
          class="ml-2"
        >
          {{ tasks.length }}
        </v-chip>
      </div>
      
      <v-menu>
        <template #activator="{ props }">
          <v-btn
            v-bind="props"
            variant="text"
            size="small"
            icon="mdi-dots-vertical"
          />
        </template>
        
        <v-list density="compact">
          <v-list-item @click="$emit('edit-column', column)">
            <template #prepend>
              <v-icon>mdi-pencil</v-icon>
            </template>
            <v-list-item-title>Edit Column</v-list-item-title>
          </v-list-item>
          
          <v-list-item @click="$emit('delete-column', column.id)">
            <template #prepend>
              <v-icon color="error">mdi-delete</v-icon>
            </template>
            <v-list-item-title class="text-error">Delete Column</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </v-card-title>

    <v-divider />

    <!-- Column Content -->
    <div v-if="!column.collapsed" class="column-content">
      <!-- Tasks -->
      <div v-if="tasks.length > 0" class="tasks-container">
        <v-card
          v-for="task in tasks"
          :key="task.id"
          class="task-card ma-2"
          variant="outlined"
          @click="$emit('task-click', task)"
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
            <p v-if="task.description" class="text-body-2 text-medium-emphasis mb-2 task-description">
              {{ truncateText(task.description, 100) }}
            </p>

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

                <!-- Subtasks Progress -->
                <div v-if="task.subtasksCount > 0" class="d-flex align-center mr-2">
                  <v-icon size="16" color="grey" class="mr-1">
                    mdi-checkbox-marked-circle-outline
                  </v-icon>
                  <span class="text-caption">
                    {{ task.completedSubtasks || 0 }}/{{ task.subtasksCount }}
                  </span>
                </div>
              </div>
              
              <!-- Right side: Assignees -->
              <div class="d-flex align-center">
                <!-- Multiple Assignees -->
                <div v-if="taskAssignees(task).length > 0" class="assignee-avatars">
                  <v-tooltip
                    v-for="(assignee, index) in taskAssignees(task).slice(0, 3)"
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
                    v-if="taskAssignees(task).length > 3"
                    size="24"
                    color="grey-lighten-1"
                    class="assignee-avatar ml-n2"
                  >
                    <span class="text-caption text-white">
                      +{{ taskAssignees(task).length - 3 }}
                    </span>
                    <v-tooltip activator="parent" location="top">
                      {{ taskAssignees(task).slice(3).map(a => a.name).join(', ') }}
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
      </div>

      <!-- Empty State -->
      <div v-else class="empty-column">
        <div class="empty-content text-center pa-4">
          <v-icon size="48" color="grey-lighten-2" class="mb-2">
            mdi-clipboard-text-outline
          </v-icon>
          <p class="text-body-2 text-medium-emphasis mb-3">
            No tasks in {{ column.title.toLowerCase() }}
          </p>
        </div>
      </div>

      <!-- Add Task Button -->
      <div class="add-task-section pa-2">
        <v-btn
          variant="outlined"
          block
          size="small"
          prepend-icon="mdi-plus"
          class="add-task-btn"
          @click="$emit('add-task', column.id)"
        >
          Add Task
        </v-btn>
      </div>
    </div>
  </v-card>
</template>

<script setup>
import { computed } from 'vue'
import { useProjectsStore } from '@/stores/projects'

const props = defineProps({
  column: {
    type: Object,
    required: true
  },
  tasks: {
    type: Array,
    default: () => []
  },
  users: {
    type: Array,
    default: () => []
  }
})

defineEmits([
  'task-click',
  'add-task',
  'toggle-collapse',
  'edit-column',
  'delete-column'
])

const projectsStore = useProjectsStore()

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

const taskAssignees = (task) => {
  if (!task) return []
  
  // Support both multiple assignees (assigneeIds) and single assignee (assigneeId)
  const assigneeIds = task.assigneeIds && task.assigneeIds.length > 0 
    ? task.assigneeIds 
    : (task.assigneeId ? [task.assigneeId] : [])
  
  return assigneeIds
    .map(id => props.users.find(user => user.id === id))
    .filter(Boolean)
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
</script>

<style scoped>
.kanban-column {
  min-height: 200px;
  width: 300px;
  display: flex;
  flex-direction: column;
}

.column-collapsed {
  width: 60px;
}

.column-header {
  flex-shrink: 0;
  min-height: 64px;
  padding: 12px 16px;
}

.column-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.tasks-container {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

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

.empty-column {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 120px;
}

.add-task-section {
  flex-shrink: 0;
}

.add-task-btn {
  border-style: dashed !important;
  transition: all 0.2s ease;
}

.add-task-btn:hover {
  background-color: rgba(var(--v-theme-primary), 0.04);
  border-style: solid !important;
}

/* Scrollbar styling */
.tasks-container::-webkit-scrollbar {
  width: 6px;
}

.tasks-container::-webkit-scrollbar-track {
  background: rgba(var(--v-theme-surface-variant), 0.5);
  border-radius: 3px;
}

.tasks-container::-webkit-scrollbar-thumb {
  background: rgba(var(--v-theme-on-surface), 0.3);
  border-radius: 3px;
}

.tasks-container::-webkit-scrollbar-thumb:hover {
  background: rgba(var(--v-theme-on-surface), 0.5);
}

@media (max-width: 768px) {
  .kanban-column {
    width: 280px;
  }
  
  .column-collapsed {
    width: 50px;
  }
}
</style>