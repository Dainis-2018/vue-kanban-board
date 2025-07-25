<!-- src/components/task/QuickTaskDialog.vue -->
<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    max-width="600px"
    persistent
  >
    <v-card>
      <v-card-title class="text-h6">
        <v-icon class="mr-2">mdi-plus</v-icon>
        Create New Task
      </v-card-title>
      
      <v-divider />
      
      <v-card-text class="pt-4">
        <v-form ref="form" v-model="valid" @submit.prevent="handleSubmit">
          <!-- Task Title -->
          <v-text-field
            v-model="task.title"
            label="Task Title"
            placeholder="Enter task title..."
            variant="outlined"
            :rules="[rules.required]"
            autofocus
            class="mb-3"
          />

          <!-- Task Description -->
          <div class="mb-3">
            <v-label class="text-subtitle-2 font-weight-medium mb-2 d-block">
              Description
            </v-label>
            <RichTextEditor
              v-model="task.description"
              placeholder="Enter task description..."
              min-height="100px"
            />
          </div>

          <v-row>
            <!-- Column -->
            <v-col cols="12" md="6">
              <v-select
                v-model="task.columnId"
                :items="columnOptions"
                label="Column"
                variant="outlined"
                :rules="[rules.required]"
              />
            </v-col>

            <!-- Priority -->
            <v-col cols="12" md="6">
              <v-select
                v-model="task.priority"
                :items="priorityOptions"
                label="Priority"
                variant="outlined"
                :rules="[rules.required]"
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

          <v-row>
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

            <!-- Due Date -->
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

          <!-- Tags -->
          <v-combobox
            v-model="task.tags"
            :items="availableTags"
            label="Tags"
            variant="outlined"
            multiple
            chips
            closable-chips
            class="mb-3"
          >
            <template #chip="{ props, item }">
              <v-chip
                v-bind="props"
                size="small"
                variant="outlined"
              >
                {{ item }}
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
    high: 'mdi-arrow-up-bold',
    medium: 'mdi-minus',
    low: 'mdi-arrow-down-bold'
  }
  return icons[priority] || 'mdi-circle'
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

const handleSubmit = async () => {
  const { valid: isValid } = await form.value.validate()
  if (!isValid) return

  loading.value = true
  
  try {
    const taskData = {
      ...task.value,
      projectId: props.projectId,
      id: `task-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      order: 0 // Will be set by the store
    }

    const createdTask = await tasksStore.createTask(taskData)
    
    uiStore.showSuccess('Task created successfully')
    emit('task-created', createdTask)
    emit('update:modelValue', false)
    resetForm()
  } catch (error) {
    console.error('Error creating task:', error)
    uiStore.showError('Failed to create task: ' + error.message)
  } finally {
    loading.value = false
  }
}

const handleCancel = () => {
  emit('update:modelValue', false)
  resetForm()
}

// Watch for dialog open/close
watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    resetForm()
    nextTick(() => {
      if (form.value) {
        form.value.resetValidation()
      }
    })
  }
})

// Set default column when columns change
watch(() => props.columns, (newColumns) => {
  if (newColumns.length > 0 && !task.value.columnId) {
    task.value.columnId = props.defaultColumnId || newColumns[0].id
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

:deep(.v-chip-group .v-chip) {
  margin: 2px;
}

.v-select :deep(.v-field__input) {
  min-height: 40px;
}

@media (max-width: 600px) {
  :deep(.v-dialog .v-card) {
    margin: 12px;
  }
}
</style>