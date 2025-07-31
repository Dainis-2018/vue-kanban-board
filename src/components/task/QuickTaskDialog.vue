<!-- src/components/task/QuickTaskDialog.vue -->
<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    max-width="600px"
    scrollable
  >
    <v-card>
      <v-card-title class="d-flex align-center justify-space-between">
        <div class="d-flex align-center">
          <v-icon class="mr-2">mdi-plus-circle</v-icon>
          <span class="text-h6">Create New Task</span>
        </div>
        
        <v-btn
          variant="text"
          size="small"
          icon="mdi-close"
          @click="handleCancel"
        />
      </v-card-title>
      
      <v-divider />
      
      <v-card-text class="pa-6">
        <v-form ref="form" v-model="valid">
          <v-text-field
            v-model="task.title"
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
              v-model="task.description"
              placeholder="Enter task description..."
              min-height="120px"
            />
          </div>

          <v-row class="mb-3">
            <v-col cols="12" md="6">
              <v-select
                v-model="task.columnId"
                :items="columnOptions"
                label="Status"
                variant="outlined"
              />
            </v-col>
            
            <v-col cols="12" md="6">
              <v-select
                v-model="task.priority"
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
          </v-row>

          <v-row class="mb-3">
            <!-- Multiple Assignees -->
            <v-col cols="12" md="6">
              <v-select
                v-model="task.assigneeIds"
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
                    class="assignee-chip"
                  >
                    <v-avatar size="20" class="mr-1">
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
                  </v-list-item>
                </template>
              </v-select>
            </v-col>
            
            <v-col cols="12" md="6">
              <v-menu v-model="showDatePicker" :close-on-content-click="false">
                <template #activator="{ props }">
                  <v-text-field
                    v-bind="props"
                    :model-value="formattedDueDate"
                    label="Due Date"
                    variant="outlined"
                    readonly
                    append-inner-icon="mdi-calendar"
                    clearable
                    @click:clear="task.dueDate = null"
                  />
                </template>
                <v-date-picker
                  v-model="task.dueDate"
                  @update:model-value="showDatePicker = false"
                />
              </v-menu>
            </v-col>
          </v-row>

          <v-combobox
            v-model="task.tags"
            :items="availableTags"
            label="Tags"
            variant="outlined"
            multiple
            chips
            closable-chips
            class="mb-3"
            @update:model-value="updateTags"
          >
            <template #chip="{ props, item }">
              <v-chip
                v-bind="props"
                size="small"
                variant="outlined"
              >
                {{ getTagText(item) }}
              </v-chip>
            </template>
          </v-combobox>
        </v-form>
      </v-card-text>
      
      <v-card-actions class="px-6 pb-4">
        <v-spacer />
        <v-btn
          variant="text"
          @click="handleCancel"
        >
          Cancel
        </v-btn>
        <v-btn
          color="primary"
          :loading="loading"
          :disabled="!valid"
          @click="handleSubmit"
        >
          Create Task
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useTasksStore } from '@/stores/tasks'
import { useUIStore } from '@/stores/ui'
import RichTextEditor from '@/components/editor/RichTextEditor.vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  projectId: {
    type: String,
    required: true
  },
  columns: {
    type: Array,
    default: () => []
  },
  users: {
    type: Array,
    default: () => []
  },
  defaultColumnId: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'task-created'])

const tasksStore = useTasksStore()
const uiStore = useUIStore()

// Local state
const form = ref(null)
const valid = ref(false)
const loading = ref(false)
const showDatePicker = ref(false)

const task = ref({
  title: '',
  description: '',
  columnId: '',
  priority: 'medium',
  assigneeIds: [], // Multiple assignees
  dueDate: null,
  tags: []
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
  if (!task.value.dueDate) return ''
  return new Date(task.value.dueDate).toLocaleDateString()
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
    high: 'mdi-chevron-up',
    medium: 'mdi-minus',
    low: 'mdi-chevron-down'
  }
  return icons[priority] || 'mdi-minus'
}

const resetForm = () => {
  task.value = {
    title: '',
    description: '',
    columnId: props.defaultColumnId || (props.columns[0]?.id || ''),
    priority: 'medium',
    assigneeIds: [],
    dueDate: null,
    tags: []
  }
  
  if (form.value) {
    form.value.resetValidation()
  }
}

const addTag = (tagItem) => {
  const tagValue = typeof tagItem === 'string' ? tagItem : tagItem.title || tagItem.value || tagItem
  if (tagValue && !task.value.tags.includes(tagValue)) {
    task.value.tags.push(tagValue)
  }
}

const removeTag = (tagItem) => {
  const tagValue = typeof tagItem === 'string' ? tagItem : tagItem.title || tagItem.value || tagItem
  const index = task.value.tags.indexOf(tagValue)
  if (index > -1) {
    task.value.tags.splice(index, 1)
  }
}

const getTagText = (item) => {
  return typeof item === 'string' ? item : item.title || item.value || String(item)
}

const updateTags = (newTags) => {
  // Ensure all tags are simple strings
  task.value.tags = newTags.map(tag => getTagText(tag))
}

const handleCancel = () => {
  emit('update:modelValue', false)
}

const handleSubmit = async () => {
  if (!form.value) return
  
  const { valid: isValid } = await form.value.validate()
  if (!isValid) return

  loading.value = true
  
  try {
    const taskData = {
      ...task.value,
      projectId: props.projectId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    const newTask = await tasksStore.createTask(taskData)
    
    uiStore.showSuccess('Task created successfully')
    emit('task-created', newTask)
    emit('update:modelValue', false)
    
    // Reset form after successful creation
    await nextTick()
    resetForm()
  } catch (error) {
    console.error('Error creating task:', error)
    uiStore.showError('Failed to create task: ' + error.message)
  } finally {
    loading.value = false
  }
}

// Watch for dialog open/close
watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    resetForm()
  }
})

// Initialize default column
watch(() => props.defaultColumnId, (newValue) => {
  if (newValue && task.value.columnId === '') {
    task.value.columnId = newValue
  }
}, { immediate: true })
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

/* Fix for assignee avatar cutting issue */
.assignee-chip {
  padding-left: 8px !important;
}

.assignee-chip .v-avatar {
  margin-left: 0 !important;
  margin-right: 4px !important;
}

@media (max-width: 600px) {
  :deep(.v-dialog .v-card) {
    margin: 12px;
  }
}
</style>