<template>
  <v-card class="kanban-column" elevation="2">
    <!-- Column Header -->
    <v-card-title class="d-flex align-center justify-space-between pa-3">
      <div class="d-flex align-center">
        <v-icon :color="column.color" class="mr-2">
          {{ column.icon }}
        </v-icon>
        <span class="text-subtitle-1 font-weight-bold">
          {{ column.title }}
        </span>
        <v-chip
          size="small"
          variant="outlined"
          class="ml-2"
        >
          {{ tasks.length }}
        </v-chip>
        <v-chip
          v-if="column.wipLimit && tasks.length > column.wipLimit"
          size="small"
          color="warning"
          class="ml-2"
        >
          Limit: {{ column.wipLimit }}
        </v-chip>
      </div>
      
      <v-menu offset-y>
        <template #activator="{ props }">
          <v-btn
            v-bind="props"
            icon="mdi-dots-vertical"
            variant="text"
            size="small"
          />
        </template>
        <v-list density="compact">
          <v-list-item @click="$emit('add-task', column.id)">
            <template #prepend>
              <v-icon>mdi-plus</v-icon>
            </template>
            <v-list-item-title>Add Task</v-list-item-title>
          </v-list-item>
          <v-list-item @click="$emit('edit-column', column)">
            <template #prepend>
              <v-icon>mdi-pencil</v-icon>
            </template>
            <v-list-item-title>Edit Column</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </v-card-title>
    
    <v-divider />

    <!-- Tasks Container -->
    <div class="tasks-container pa-2">
      <!-- Task List -->
      <div
        v-if="tasks.length > 0"
        class="tasks-list"
      >
        <v-card
          v-for="task in tasks"
          :key="task.id"
          class="task-card mb-2"
          elevation="1"
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
                {{ task.priority }}
              </v-chip>
              
              <v-menu offset-y>
                <template #activator="{ props }">
                  <v-btn
                    v-bind="props"
                    icon="mdi-dots-horizontal"
                    variant="text"
                    size="x-small"
                    @click.stop
                  />
                </template>
                <v-list density="compact">
                  <v-list-item @click="$emit('edit-task', task)">
                    <template #prepend>
                      <v-icon>mdi-pencil</v-icon>
                    </template>
                    <v-list-item-title>Edit Task</v-list-item-title>
                  </v-list-item>
                  <v-list-item @click="moveTaskToColumn(task, 'todo')">
                    <template #prepend>
                      <v-icon>mdi-arrow-right</v-icon>
                    </template>
                    <v-list-item-title>Move to Next</v-list-item-title>
                  </v-list-item>
                  <v-list-item @click="$emit('delete-task', task)">
                    <template #prepend>
                      <v-icon>mdi-delete</v-icon>
                    </template>
                    <v-list-item-title>Delete</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-menu>
            </div>

            <!-- Task Title -->
            <h4 class="text-subtitle-2 font-weight-bold mb-2">
              {{ task.title }}
            </h4>

            <!-- Task Description -->
            <p 
              v-if="task.description && !compact"
              class="text-body-2 text-medium-emphasis mb-2"
            >
              {{ task.description.length > 100 ? 
                task.description.substring(0, 100) + '...' : 
                task.description 
              }}
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
              <v-chip
                v-if="task.tags.length > 3"
                size="x-small"
                variant="outlined"
                class="mr-1 mb-1"
              >
                +{{ task.tags.length - 3 }}
              </v-chip>
            </div>

            <!-- Task Footer -->
            <div class="d-flex align-center justify-space-between">
              <!-- Due Date -->
              <div v-if="task.dueDate" class="d-flex align-center">
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
              
              <!-- Assignee -->
              <v-avatar
                v-if="task.assigneeId"
                size="24"
                :image="getAssigneeAvatar(task.assigneeId)"
              >
                <span v-if="!getAssigneeAvatar(task.assigneeId)" class="text-caption">
                  {{ getAssigneeName(task.assigneeId)?.charAt(0) }}
                </span>
              </v-avatar>
            </div>
          </v-card-text>
        </v-card>
      </div>

      <!-- Empty State -->
      <div v-else class="empty-column">
        <div class="empty-content">
          <v-icon size="48" color="grey-lighten-2" class="mb-2">
            mdi-clipboard-text-outline
          </v-icon>
          <p class="text-body-2 text-medium-emphasis mb-3">
            No tasks in {{ column.title.toLowerCase() }}
          </p>
        </div>
      </div>

      <!-- Add Task Button -->
      <div class="add-task-section">
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
  compact: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits([
  'task-move', 
  'task-click', 
  'add-task', 
  'edit-task', 
  'delete-task', 
  'edit-column'
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

const getAssigneeAvatar = (userId) => {
  const user = projectsStore.getUserById(userId)
  return user?.avatar || ''
}

const getAssigneeName = (userId) => {
  const user = projectsStore.getUserById(userId)
  return user?.name || ''
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  })
}

const isOverdue = (dueDate) => {
  if (!dueDate) return false
  return new Date(dueDate) < new Date()
}

const moveTaskToColumn = (task, targetColumnId) => {
  emit('task-move', {
    taskId: task.id,
    newColumnId: targetColumnId,
    newIndex: 0
  })
}
</script>

<style scoped>
.kanban-column {
  min-width: 300px;
  max-width: 350px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.tasks-container {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.tasks-list {
  flex-grow: 1;
  overflow-y: auto;
  padding-right: 4px;
}

.tasks-list::-webkit-scrollbar {
  width: 4px;
}

.tasks-list::-webkit-scrollbar-track {
  background: transparent;
}

.tasks-list::-webkit-scrollbar-thumb {
  background: rgba(var(--v-theme-on-surface), 0.2);
  border-radius: 2px;
}

.task-card {
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
}

.task-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  border-color: rgba(var(--v-theme-primary), 0.3);
}

.empty-column {
  flex-grow: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  min-height: 120px;
}

.empty-content {
  text-align: center;
  opacity: 0.6;
}

.add-task-section {
  flex-shrink: 0;
  margin-top: 8px;
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  padding-top: 8px;
  background: rgba(var(--v-theme-surface-variant), 0.1);
}

.add-task-btn {
  opacity: 0.7;
  transition: opacity 0.2s ease;
}

.kanban-column:hover .add-task-btn {
  opacity: 1;
}

/* Responsive Design */
@media (max-width: 1200px) {
  .kanban-column {
    min-width: 250px;
    max-width: 300px;
  }
}

@media (max-width: 960px) {
  .kanban-column {
    min-width: 220px;
    max-width: 280px;
  }
}

@media (max-width: 600px) {
  .kanban-column {
    min-width: 280px;
    max-width: 100%;
  }
}
</style>