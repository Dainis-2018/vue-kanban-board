<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    max-width="800px"
    scrollable
  >
    <v-card v-if="task">
      <v-card-title class="text-h6 d-flex align-center justify-space-between">
        <div class="d-flex align-center">
          <v-chip
            :color="getPriorityColor(task.priority)"
            size="small"
            variant="flat"
            class="mr-2"
          >
            {{ task.priority }}
          </v-chip>
          <span>{{ task.title }}</span>
        </div>
        
        <div class="d-flex align-center">
          <v-btn
            icon="mdi-pencil"
            variant="text"
            size="small"
            @click="editMode = !editMode"
          />
          <v-btn
            icon="mdi-close"
            variant="text"
            size="small"
            @click="$emit('update:modelValue', false)"
          />
        </div>
      </v-card-title>
      
      <v-divider />
      
      <v-card-text class="pa-6">
        <v-form v-if="editMode" ref="form" v-model="valid">
          <!-- Edit Mode -->
          <v-text-field
            v-model="editTask.title"
            label="Task Title"
            variant="outlined"
            :rules="[rules.required]"
            class="mb-4"
          />

          <v-textarea
            v-model="editTask.description"
            label="Description"
            variant="outlined"
            rows="4"
            class="mb-4"
          />

          <v-row class="mb-4">
            <v-col cols="12" md="4">
              <v-select
                v-model="editTask.columnId"
                :items="columnOptions"
                label="Status"
                variant="outlined"
              />
            </v-col>
            
            <v-col cols="12" md="4">
              <v-select
                v-model="editTask.priority"
                :items="priorityOptions"
                label="Priority"
                variant="outlined"
              />
            </v-col>
            
            <v-col cols="12" md="4">
              <v-select
                v-model="editTask.assigneeId"
                :items="assigneeOptions"
                label="Assignee"
                variant="outlined"
                clearable
              />
            </v-col>
          </v-row>

          <v-row class="mb-4">
            <v-col cols="12" md="6">
              <v-menu
                v-model="showDatePicker"
                :close-on-content-click="false"
                transition="scale-transition"
                offset-y
                min-width="auto"
              >
                <template #activator="{ props }">
                  <v-text-field
                    v-bind="props"
                    v-model="formattedDueDate"
                    label="Due Date"
                    prepend-inner-icon="mdi-calendar"
                    variant="outlined"
                    readonly
                    clearable
                    @click:clear="editTask.dueDate = null"
                  />
                </template>
                
                <v-date-picker
                  v-model="editTask.dueDate"
                  @update:model-value="showDatePicker = false"
                />
              </v-menu>
            </v-col>
            
            <v-col cols="12" md="6">
              <v-combobox
                v-model="editTask.tags"
                label="Tags"
                variant="outlined"
                multiple
                chips
                closable-chips
                :items="availableTags"
              />
            </v-col>
          </v-row>
        </v-form>
        
        <div v-else>
          <!-- View Mode -->
          <div class="mb-4">
            <h3 class="text-h6 mb-2">Description</h3>
            <p class="text-body-1" v-if="task.description">
              {{ task.description }}
            </p>
            <p class="text-body-2 text-medium-emphasis" v-else>
              No description provided
            </p>
          </div>

          <v-row class="mb-4">
            <v-col cols="12" md="6">
              <div class="mb-3">
                <h4 class="text-subtitle-1 mb-1">Status</h4>
                <v-chip
                  :color="getColumnColor(task.columnId)"
                  size="small"
                  variant="flat"
                >
                  {{ getColumnTitle(task.columnId) }}
                </v-chip>
              </div>
              
              <div class="mb-3">
                <h4 class="text-subtitle-1 mb-1">Priority</h4>
                <v-chip
                  :color="getPriorityColor(task.priority)"
                  size="small"
                  variant="flat"
                >
                  {{ task.priority }}
                </v-chip>
              </div>
            </v-col>
            
            <v-col cols="12" md="6">
              <div class="mb-3" v-if="task.assigneeId">
                <h4 class="text-subtitle-1 mb-1">Assignee</h4>
                <div class="d-flex align-center">
                  <v-avatar size="32" class="mr-2">
                    <v-img
                      v-if="getAssigneeAvatar(task.assigneeId)"
                      :src="getAssigneeAvatar(task.assigneeId)"
                      :alt="getAssigneeName(task.assigneeId)"
                    />
                    <span v-else class="text-caption">
                      {{ getAssigneeName(task.assigneeId)?.charAt(0) }}
                    </span>
                  </v-avatar>
                  <span>{{ getAssigneeName(task.assigneeId) }}</span>
                </div>
              </div>
              
              <div class="mb-3" v-if="task.dueDate">
                <h4 class="text-subtitle-1 mb-1">Due Date</h4>
                <div class="d-flex align-center">
                  <v-icon 
                    :color="isOverdue(task.dueDate) ? 'error' : 'grey'"
                    class="mr-1"
                  >
                    mdi-calendar
                  </v-icon>
                  <span :class="isOverdue(task.dueDate) ? 'text-error' : ''">
                    {{ formatDate(task.dueDate) }}
                  </span>
                </div>
              </div>
            </v-col>
          </v-row>

          <!-- Tags -->
          <div class="mb-4" v-if="task.tags && task.tags.length > 0">
            <h4 class="text-subtitle-1 mb-2">Tags</h4>
            <div class="d-flex flex-wrap ga-2">
              <v-chip
                v-for="tag in task.tags"
                :key="tag"
                size="small"
                variant="outlined"
              >
                {{ tag }}
              </v-chip>
            </div>
          </div>

          <!-- Timestamps -->
          <div class="mb-4">
            <h4 class="text-subtitle-1 mb-2">Details</h4>
            <v-row>
              <v-col cols="12" md="6">
                <p class="text-body-2">
                  <strong>Created:</strong> {{ formatDateTime(task.createdAt) }}
                </p>
              </v-col>
              <v-col cols="12" md="6">
                <p class="text-body-2">
                  <strong>Updated:</strong> {{ formatDateTime(task.updatedAt) }}
                </p>
              </v-col>
            </v-row>
          </div>
        </div>
      </v-card-text>
      
      <v-card-actions v-if="editMode" class="px-6 pb-4">
        <v-spacer />
        <v-btn
          variant="text"
          @click="cancelEdit"
        >
          Cancel
        </v-btn>
        <v-btn
          color="primary"
          :loading="loading"
          @click="saveTask"
        >
          Save Changes
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useTasksStore } from '@/stores/tasks'
import { useProjectsStore } from '@/stores/projects'
import { useUIStore } from '@/stores/ui'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  task: {
    type: Object,
    default: null
  },
  projectUsers: {
    type: Array,
    default: () => []
  },
  columns: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue'])

const tasksStore = useTasksStore()
const projectsStore = useProjectsStore()
const uiStore = useUIStore()

// Local state
const editMode = ref(false)
const form = ref(null)
const valid = ref(false)
const loading = ref(false)
const showDatePicker = ref(false)
const editTask = ref({})

// Validation rules
const rules = {
  required: (value) => !!value || 'This field is required'
}

// Computed properties
const columnOptions = computed(() =>
  props.columns.map(column => ({
    title: column.title,
    value: column.id
  }))
)

const priorityOptions = computed(() => [
  { title: 'Critical', value: 'critical' },
  { title: 'High', value: 'high' },
  { title: 'Medium', value: 'medium' },
  { title: 'Low', value: 'low' }
])

const assigneeOptions = computed(() =>
  props.projectUsers.map(user => ({
    title: user.name,
    value: user.id
  }))
)

const availableTags = computed(() => [
  'frontend', 'backend', 'ui', 'ux', 'api', 'database',
  'security', 'performance', 'bug', 'feature', 'improvement',
  'testing', 'documentation', 'deployment', 'optimization'
])

const formattedDueDate = computed(() => {
  if (!editTask.value.dueDate) return ''
  return new Date(editTask.value.dueDate).toLocaleDateString()
})

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

const getColumnColor = (columnId) => {
  const column = props.columns.find(col => col.id === columnId)
  return column?.color || 'grey'
}

const getColumnTitle = (columnId) => {
  const column = props.columns.find(col => col.id === columnId)
  return column?.title || 'Unknown'
}

const getAssigneeAvatar = (userId) => {
  const user = projectsStore.getUserById(userId)
  return user?.avatar || ''
}

const getAssigneeName = (userId) => {
  const user = projectsStore.getUserById(userId)
  return user?.name || 'Unknown User'
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const formatDateTime = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const isOverdue = (dueDate) => {
  if (!dueDate) return false
  return new Date(dueDate) < new Date()
}

const startEdit = () => {
  editTask.value = { ...props.task }
  editMode.value = true
}

const cancelEdit = () => {
  editMode.value = false
  editTask.value = {}
}

const saveTask = async () => {
  if (!form.value.validate()) return

  loading.value = true
  
  try {
    const updatedTask = {
      ...editTask.value,
      updatedAt: new Date().toISOString()
    }

    await tasksStore.updateTask(props.task.id, updatedTask)
    
    uiStore.showSuccess('Task updated successfully')
    editMode.value = false
  } catch (error) {
    uiStore.showError('Failed to update task: ' + error.message)
  } finally {
    loading.value = false
  }
}

// Watchers
watch(() => props.task, (newTask) => {
  if (newTask) {
    editTask.value = { ...newTask }
  }
}, { immediate: true })

watch(() => props.modelValue, (isOpen) => {
  if (!isOpen) {
    editMode.value = false
  }
})
</script>

<style scoped>
:deep(.v-card-text) {
  max-height: 70vh;
  overflow-y: auto;
}
</style>