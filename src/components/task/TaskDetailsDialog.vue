<!-- src/components/task/TaskDetailsDialog.vue -->
<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    max-width="800px"
    scrollable
  >
    <v-card v-if="task">
      <v-card-title class="d-flex align-center justify-space-between">
        <div class="d-flex align-center">
          <v-icon class="mr-2">mdi-clipboard-text</v-icon>
          <span class="text-h6">{{ isEditing ? 'Edit Task' : 'Task Details' }}</span>
        </div>
        
        <div class="d-flex align-center">
          <v-btn
            v-if="!isEditing"
            variant="text"
            size="small"
            prepend-icon="mdi-pencil"
            @click="startEditing"
          >
            Edit
          </v-btn>
          
          <v-btn
            variant="text"
            size="small"
            icon="mdi-close"
            @click="$emit('update:modelValue', false)"
          />
        </div>
      </v-card-title>
      
      <v-divider />
      
      <v-card-text class="pa-6">
        <v-form v-if="isEditing" ref="form" v-model="valid">
          <!-- Edit Mode -->
          <v-text-field
            v-model="editTask.title"
            label="Task Title"
            variant="outlined"
            :rules="[rules.required]"
            class="mb-4"
          />

          <div class="mb-4">
            <v-label class="text-subtitle-2 font-weight-medium mb-2 d-block">
              Description
            </v-label>
            <RichTextEditor
              v-model="editTask.description"
              placeholder="Enter task description..."
              min-height="120px"
            />
          </div>

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
              >
                <template #item="{ props, item }">
                  <v-list-item v-bind="props">
                    <template #prepend>
                      <v-icon :color="getPriorityColor(item.value)">
                        {{ getPriorityIcon(item.value) }}
                      </v-icon>
                    </template>
                  </v-list-item>
                </template>
              </v-select>
            </v-col>
            
            <v-col cols="12" md="4">
              <v-select
                v-model="editTask.assigneeIds"
                :items="assigneeOptions"
                label="Assignees"
                variant="outlined"
                multiple
                chips
                closable-chips
                clearable
                :menu-props="{ maxHeight: 300 }"
              >
                <template #chip="{ props, item }">
                  <v-chip
                    v-bind="props"
                    size="small"
                    color="primary"
                    variant="flat"
                  >
                    <v-avatar start size="20">
                      <v-img
                        v-if="item.raw.avatar"
                        :src="item.raw.avatar"
                        :alt="item.raw.name"
                      />
                      <span v-else class="text-caption">
                        {{ item.raw.name?.charAt(0) }}
                      </span>
                    </v-avatar>
                    {{ item.raw.name }}
                  </v-chip>
                </template>
                
                <template #item="{ props, item }">
                  <v-list-item v-bind="props">
                    <template #prepend>
                      <v-avatar size="32">
                        <v-img
                          v-if="item.raw.avatar"
                          :src="item.raw.avatar"
                          :alt="item.raw.name"
                        />
                        <span v-else class="text-caption">
                          {{ item.raw.name?.charAt(0) }}
                        </span>
                      </v-avatar>
                    </template>
                    <v-list-item-title>{{ item.raw.name }}</v-list-item-title>
                    <v-list-item-subtitle>{{ item.raw.role }}</v-list-item-subtitle>
                  </v-list-item>
                </template>
              </v-select>
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
            <h3 class="text-h6 mb-2">{{ currentTask.title }}</h3>
            <div class="d-flex align-center mb-2">
              <v-chip
                size="x-small"
                variant="tonal"
                color="grey"
                class="mr-2"
              >
                #{{ currentTask.id.split('-')[1] }}
              </v-chip>
              <span class="text-caption text-medium-emphasis">
                Created {{ formatTimeAgo(currentTask.createdAt) }}
              </span>
            </div>
          </div>

          <div class="mb-4">
            <h4 class="text-subtitle-1 mb-2">Description</h4>
            <div v-if="currentTask.description" class="task-description-content">
              <RichTextEditor
                :model-value="currentTask.description"
                readonly
                min-height="auto"
              />
            </div>
            <p v-else class="text-body-2 text-medium-emphasis">
              No description provided
            </p>
          </div>

          <v-row class="mb-4">
            <v-col cols="12" md="6">
              <div class="mb-3">
                <h4 class="text-subtitle-1 mb-1">Status</h4>
                <v-chip
                  :color="getColumnColor(currentTask.columnId)"
                  size="small"
                  variant="flat"
                >
                  {{ getColumnTitle(currentTask.columnId) }}
                </v-chip>
              </div>
              
              <div class="mb-3">
                <h4 class="text-subtitle-1 mb-1">Priority</h4>
                <v-chip
                  :color="getPriorityColor(currentTask.priority)"
                  size="small"
                  variant="flat"
                >
                  <v-icon start :icon="getPriorityIcon(currentTask.priority)" size="16" />
                  {{ currentTask.priority }}
                </v-chip>
              </div>
            </v-col>
            
            <v-col cols="12" md="6">
              <div class="mb-3">
                <h4 class="text-subtitle-1 mb-1">Assignees</h4>
                <div v-if="taskAssignees.length > 0" class="d-flex align-center flex-wrap ga-2">
                  <v-chip
                    v-for="assignee in taskAssignees"
                    :key="assignee.id"
                    size="small"
                    variant="outlined"
                    color="primary"
                  >
                    <v-avatar start size="20">
                      <v-img
                        v-if="assignee.avatar"
                        :src="assignee.avatar"
                        :alt="assignee.name"
                      />
                      <span v-else class="text-caption">
                        {{ assignee.name?.charAt(0) }}
                      </span>
                    </v-avatar>
                    {{ assignee.name }}
                  </v-chip>
                </div>
                <span v-else class="text-body-2 text-medium-emphasis">
                  No assignees
                </span>
              </div>
              
              <div class="mb-3" v-if="currentTask.dueDate">
                <h4 class="text-subtitle-1 mb-1">Due Date</h4>
                <div class="d-flex align-center">
                  <v-icon 
                    :color="isOverdue(currentTask.dueDate) ? 'error' : 'grey'"
                    class="mr-1"
                  >
                    mdi-calendar
                  </v-icon>
                  <span 
                    class="text-body-2"
                    :class="isOverdue(currentTask.dueDate) ? 'text-error' : ''"
                  >
                    {{ formatDate(currentTask.dueDate) }}
                  </span>
                  <v-chip
                    v-if="isOverdue(currentTask.dueDate)"
                    color="error"
                    size="x-small"
                    variant="flat"
                    class="ml-2"
                  >
                    Overdue
                  </v-chip>
                </div>
              </div>
            </v-col>
          </v-row>

          <!-- Tags -->
          <div v-if="currentTask.tags && currentTask.tags.length > 0" class="mb-4">
            <h4 class="text-subtitle-1 mb-2">Tags</h4>
            <div class="d-flex flex-wrap ga-1">
              <v-chip
                v-for="tag in currentTask.tags"
                :key="tag"
                size="small"
                variant="outlined"
              >
                {{ tag }}
              </v-chip>
            </div>
          </div>

          <!-- Task Stats -->
          <div class="mb-4">
            <h4 class="text-subtitle-1 mb-2">Task Statistics</h4>
            <v-row>
              <v-col cols="6" md="3">
                <div class="text-center pa-2 border rounded">
                  <div class="text-h6">{{ currentTask.commentsCount || 0 }}</div>
                  <div class="text-caption text-medium-emphasis">Comments</div>
                </div>
              </v-col>
              <v-col cols="6" md="3">
                <div class="text-center pa-2 border rounded">
                  <div class="text-h6">{{ currentTask.attachmentsCount || 0 }}</div>
                  <div class="text-caption text-medium-emphasis">Attachments</div>
                </div>
              </v-col>
              <v-col cols="6" md="3">
                <div class="text-center pa-2 border rounded">
                  <div class="text-h6">{{ currentTask.subtasksCount || 0 }}</div>
                  <div class="text-caption text-medium-emphasis">Subtasks</div>
                </div>
              </v-col>
              <v-col cols="6" md="3">
                <div class="text-center pa-2 border rounded">
                  <div class="text-h6">{{ Math.round(((currentTask.completedSubtasks || 0) / Math.max(currentTask.subtasksCount || 1, 1)) * 100) }}%</div>
                  <div class="text-caption text-medium-emphasis">Progress</div>
                </div>
              </v-col>
            </v-row>
          </div>
        </div>
      </v-card-text>
      
      <v-divider />
      
      <v-card-actions class="pa-4">
        <div v-if="isEditing" class="d-flex align-center w-100">
          <v-btn
            variant="text"
            @click="cancelEditing"
          >
            Cancel
          </v-btn>
          <v-spacer />
          <v-btn
            color="primary"
            :loading="saving"
            :disabled="!valid"
            @click="saveChanges"
          >
            Save Changes
          </v-btn>
        </div>
        
        <div v-else class="d-flex align-center w-100">
          <v-btn
            variant="text"
            color="error"
            prepend-icon="mdi-delete"
            @click="confirmDelete"
          >
            Delete Task
          </v-btn>
          <v-spacer />
          <v-btn
            variant="text"
            @click="$emit('update:modelValue', false)"
          >
            Close
          </v-btn>
        </div>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch, inject } from 'vue'
import { useTasksStore } from '@/stores/tasks'
import { useProjectsStore } from '@/stores/projects'
import { useUIStore } from '@/stores/ui'
import RichTextEditor from '@/components/editor/RichTextEditor.vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  task: {
    type: Object,
    default: null
  },
  columns: {
    type: Array,
    default: () => []
  },
  users: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue', 'task-updated', 'task-deleted'])

const tasksStore = useTasksStore()
const projectsStore = useProjectsStore()
const uiStore = useUIStore()

// Local state
const form = ref(null)
const valid = ref(false)
const saving = ref(false)
const isEditing = ref(false)
const showDatePicker = ref(false)
const editTask = ref({})

// Get reactive task data from store
const currentTask = computed(() => {
  if (!props.task?.id) return props.task
  return tasksStore.getTaskById(props.task.id) || props.task
})

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
  props.users.map(user => ({
    title: user.name,
    value: user.id,
    avatar: user.avatar,
    name: user.name,
    role: user.role
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

const taskAssignees = computed(() => {
  if (!currentTask.value) return []
  
  const assigneeIds = currentTask.value.assigneeIds && currentTask.value.assigneeIds.length > 0 
    ? currentTask.value.assigneeIds 
    : (currentTask.value.assigneeId ? [currentTask.value.assigneeId] : [])
  
  return assigneeIds
    .map(id => props.users.find(user => user.id === id))
    .filter(Boolean)
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

const getPriorityIcon = (priority) => {
  const icons = {
    critical: 'mdi-alert-circle',
    high: 'mdi-arrow-up-bold',
    medium: 'mdi-minus',
    low: 'mdi-arrow-down-bold'
  }
  return icons[priority] || 'mdi-circle'
}

const getColumnColor = (columnId) => {
  const column = props.columns.find(c => c.id === columnId)
  return column?.color || 'primary'
}

const getColumnTitle = (columnId) => {
  const column = props.columns.find(c => c.id === columnId)
  return column?.title || 'Unknown'
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString()
}

const formatTimeAgo = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now - date
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return 'today'
  if (diffDays === 1) return 'yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  return `${Math.floor(diffDays / 30)} months ago`
}

const isOverdue = (dueDate) => {
  if (!dueDate) return false
  return new Date(dueDate) < new Date()
}

const startEditing = () => {
  if (!currentTask.value) return
  
  editTask.value = {
    title: currentTask.value.title || '',
    description: currentTask.value.description || '',
    columnId: currentTask.value.columnId || '',
    priority: currentTask.value.priority || 'medium',
    assigneeIds: currentTask.value.assigneeIds && currentTask.value.assigneeIds.length > 0 
      ? [...currentTask.value.assigneeIds] 
      : (currentTask.value.assigneeId ? [currentTask.value.assigneeId] : []),
    dueDate: currentTask.value.dueDate || null,
    tags: currentTask.value.tags ? [...currentTask.value.tags] : []
  }
  
  isEditing.value = true
}

const cancelEditing = () => {
  isEditing.value = false
  editTask.value = {}
}

const saveChanges = async () => {
  if (!form.value || !currentTask.value) return
  
  const { valid: isValid } = await form.value.validate()
  if (!isValid) return

  saving.value = true
  
  try {
    const updatedTask = await tasksStore.updateTask(currentTask.value.id, editTask.value)
    
    uiStore.showSuccess('Task updated successfully')
    emit('task-updated', updatedTask)
    isEditing.value = false
  } catch (error) {
    console.error('Error updating task:', error)
    uiStore.showError('Failed to update task: ' + error.message)
  } finally {
    saving.value = false
  }
}

const confirmDelete = () => {
  if (confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
    deleteTask()
  }
}

const deleteTask = async () => {
  if (!currentTask.value) return
  
  try {
    await tasksStore.deleteTask(currentTask.value.id)
    
    uiStore.showSuccess('Task deleted successfully')
    emit('task-deleted', currentTask.value.id)
    emit('update:modelValue', false)
  } catch (error) {
    console.error('Error deleting task:', error)
    uiStore.showError('Failed to delete task: ' + error.message)
  }
}

// Watch for dialog open/close
watch(() => props.modelValue, (isOpen) => {
  if (!isOpen) {
    isEditing.value = false
    editTask.value = {}
  }
})
</script>

<style scoped>
:deep(.v-text-field .v-input__control) {
  min-height: 56px;
}

:deep(.v-textarea .v-input__control) {
  min-height: auto;
}

:deep(.v-select .v-input__control) {
  min-height: 56px;
}

.border {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.rounded {
  border-radius: 4px;
}

@media (max-width: 600px) {
  :deep(.v-dialog .v-card) {
    margin: 12px;
  }
}
</style>