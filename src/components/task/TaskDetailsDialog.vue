<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    max-width="800"
    scrollable
  >
    <v-card v-if="task">
      <v-card-title class="d-flex align-center justify-space-between">
        <span class="text-h6">{{ task.title }}</span>
        <div class="d-flex align-center ga-2">
          <v-chip
            :color="getPriorityColor(task.priority)"
            size="small"
            variant="flat"
          >
            {{ task.priority.toUpperCase() }}
          </v-chip>
          <v-btn
            icon="mdi-close"
            variant="text"
            @click="$emit('update:modelValue', false)"
          />
        </div>
      </v-card-title>
      
      <v-divider />
      
      <v-card-text class="pa-6">
        <v-row>
          <v-col cols="12" md="8">
            <!-- Task Description -->
            <div class="mb-4">
              <h4 class="text-subtitle-1 mb-2">Description</h4>
              <div v-if="task.description" v-html="task.description" class="task-description"></div>
              <p v-else class="text-medium-emphasis">No description provided.</p>
            </div>
            
            <!-- Comments Section -->
            <div class="mb-4">
              <h4 class="text-subtitle-1 mb-2">Comments</h4>
              <p class="text-medium-emphasis">Comments feature coming soon...</p>
            </div>
          </v-col>
          
          <v-col cols="12" md="4">
            <!-- Task Metadata -->
            <div class="task-metadata">
              <div class="mb-3">
                <span class="text-caption font-weight-bold">Status:</span>
                <v-chip size="small" class="ml-2">{{ getColumnTitle(task.columnId) }}</v-chip>
              </div>
              
              <div class="mb-3">
                <span class="text-caption font-weight-bold">Assignees:</span>
                <div class="mt-1 d-flex align-center">
                  <div v-if="assignees.length > 0" class="avatar-group">
                    <v-avatar
                      v-for="user in assignees.slice(0, 3)"
                      :key="user.id"
                      size="24"
                      class="avatar-group-item"
                    >
                      <v-img :src="user.avatar" :alt="user.name" />
                    </v-avatar>
                  </div>
                  <span v-if="assignees.length > 3" class="text-caption ml-2">
                    +{{ assignees.length - 3 }}
                  </span>
                  <span v-if="assignees.length === 0" class="text-medium-emphasis">
                    Unassigned
                  </span>
                </div>
              </div>
              
              <div class="mb-3" v-if="task.dueDate">
                <span class="text-caption font-weight-bold">Due Date:</span>
                <div class="mt-1">{{ formatDate(task.dueDate) }}</div>
              </div>
              
              <div class="mb-3" v-if="task.tags?.length">
                <span class="text-caption font-weight-bold">Tags:</span>
                <div class="mt-1 d-flex flex-wrap ga-1">
                  <v-chip
                    v-for="tag in task.tags"
                    :key="tag"
                    size="x-small"
                    variant="outlined"
                  >
                    {{ tag }}
                  </v-chip>
                </div>
              </div>
            </div>
          </v-col>
        </v-row>
      </v-card-text>
      
      <v-divider />
      
      <v-card-actions class="pa-4">
        <v-btn
          prepend-icon="mdi-pencil"
          variant="outlined"
        >
          Edit Task
        </v-btn>
        
        <v-spacer />
        
        <v-btn
          color="error"
          prepend-icon="mdi-delete"
          variant="outlined"
          @click="handleDelete"
        >
          Delete
        </v-btn>
        
        <v-btn @click="$emit('update:modelValue', false)">
          Close
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed } from 'vue'
import { useProjectsStore } from '@/stores/projects'
import { useTasksStore } from '@/stores/tasks'

const props = defineProps({
  modelValue: Boolean,
  task: Object
})

const emit = defineEmits(['update:modelValue', 'task-updated', 'task-deleted'])

const projectsStore = useProjectsStore()
const tasksStore = useTasksStore()

const assignees = computed(() => {
  if (!props.task?.assigneeIds) return []
  return props.task.assigneeIds
    .map(id => projectsStore.getUserById(id))
    .filter(Boolean)
})

const getPriorityColor = (priority) => {
  const colors = {
    critical: 'error',
    high: 'warning', 
    medium: 'info',
    low: 'success'
  }
  return colors[priority] || 'grey'
}

const getColumnTitle = (columnId) => {
  const column = tasksStore.kanbanColumns.find(col => col.id === columnId)
  return column?.title || columnId
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString()
}

const handleDelete = () => {
  if (confirm('Are you sure you want to delete this task?')) {
    emit('task-deleted', props.task.id)
  }
}
</script>

<style scoped>
.task-description {
  line-height: 1.6;
}

.task-metadata {
  background: rgba(var(--v-theme-surface-variant), 0.3);
  padding: 16px;
  border-radius: 8px;
}

.avatar-group {
  display: flex;
}

.avatar-group-item {
  margin-left: -8px;
  border: 2px solid rgb(var(--v-theme-surface));
  transition: transform 0.2s ease-in-out;
}

.avatar-group-item:first-child {
  margin-left: 0;
}
</style>