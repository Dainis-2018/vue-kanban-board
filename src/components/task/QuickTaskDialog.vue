<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    max-width="500"
    persistent
  >
    <v-card>
      <v-card-title class="text-h6 pa-4">
        <v-icon class="mr-2">mdi-lightning-bolt</v-icon>
        Quick Add Task
      </v-card-title>
      
      <v-divider />
      
      <v-form ref="form" @submit.prevent="handleSubmit">
        <v-card-text class="pa-4">
          <!-- Task Title -->
          <v-text-field
            v-model="formData.title"
            label="Task Title"
            :rules="[rules.required]"
            variant="outlined"
            autofocus
            placeholder="What needs to be done?"
            prepend-inner-icon="mdi-format-title"
            class="mb-3"
          />
          
          <!-- Task Description -->
          <v-textarea
            v-model="formData.description"
            label="Description (Optional)"
            variant="outlined"
            placeholder="Add more details..."
            prepend-inner-icon="mdi-text"
            rows="3"
            auto-grow
            class="mb-3"
          />
          
          <!-- Quick Settings Row 1 -->
          <v-row class="mb-3">
            <v-col cols="6">
              <v-select
                v-model="formData.columnId"
                :items="columnOptions"
                label="Status"
                variant="outlined"
                prepend-inner-icon="mdi-view-column"
              >
                <template #item="{ props, item }">
                  <v-list-item v-bind="props">
                    <template #prepend>
                      <v-icon :color="item.raw.color" size="16">
                        {{ item.raw.icon }}
                      </v-icon>
                    </template>
                  </v-list-item>
                </template>
                
                <template #selection="{ item }">
                  <div class="d-flex align-center">
                    <v-icon :color="item.raw.color" size="16" class="mr-2">
                      {{ item.raw.icon }}
                    </v-icon>
                    <span>{{ item.title }}</span>
                  </div>
                </template>
              </v-select>
            </v-col>
            
            <v-col cols="6">
              <v-select
                v-model="formData.priority"
                :items="priorityOptions"
                label="Priority"
                variant="outlined"
                prepend-inner-icon="mdi-flag"
              >
                <template #item="{ props, item }">
                  <v-list-item v-bind="props">
                    <template #prepend>
                      <v-icon :color="item.raw.color" size="16">
                        {{ item.raw.icon }}
                      </v-icon>
                    </template>
                  </v-list-item>
                </template>
                
                <template #selection="{ item }">
                  <div class="d-flex align-center">
                    <v-icon :color="item.raw.color" size="16" class="mr-2">
                      {{ item.raw.icon }}
                    </v-icon>
                    <span>{{ item.title }}</span>
                  </div>
                </template>
              </v-select>
            </v-col>
          </v-row>
          
          <!-- Quick Settings Row 2 -->
          <v-row class="mb-3">
            <v-col cols="6">
              <v-select
                v-model="formData.swimlane"
                :items="swimlaneOptions"
                label="Type"
                variant="outlined"
                prepend-inner-icon="mdi-swim"
              >
                <template #item="{ props, item }">
                  <v-list-item v-bind="props">
                    <template #prepend>
                      <v-icon :color="item.raw.color" size="16">
                        {{ item.raw.icon }}
                      </v-icon>
                    </template>
                  </v-list-item>
                </template>
                
                <template #selection="{ item }">
                  <div class="d-flex align-center">
                    <v-icon :color="item.raw.color" size="16" class="mr-2">
                      {{ item.raw.icon }}
                    </v-icon>
                    <span>{{ item.title }}</span>
                  </div>
                </template>
              </v-select>
            </v-col>
            
            <v-col cols="6">
              <v-text-field
                v-model="formData.dueDate"
                label="Due Date (Optional)"
                type="date"
                variant="outlined"
                prepend-inner-icon="mdi-calendar"
              />
            </v-col>
          </v-row>
          
          <!-- Assignees -->
          <v-select
            v-model="formData.assigneeIds"
            :items="userOptions"
            label="Assign To"
            variant="outlined"
            prepend-inner-icon="mdi-account"
            multiple
            chips
            closable-chips
            class="mb-3"
          >
            <template #item="{ props, item }">
              <v-list-item v-bind="props">
                <template #prepend>
                  <v-avatar size="24">
                    <v-img :src="item.raw.avatar" />
                  </v-avatar>
                </template>
                <v-list-item-title>{{ item.title }}</v-list-item-title>
                <v-list-item-subtitle>{{ item.raw.role }}</v-list-item-subtitle>
              </v-list-item>
            </template>
            
            <template #chip="{ props, item }">
              <v-chip v-bind="props" variant="outlined">
                <template #prepend>
                  <v-avatar size="20" start>
                    <v-img :src="item.raw.avatar" />
                  </v-avatar>
                </template>
                {{ item.title }}
              </v-chip>
            </template>
          </v-select>
          
          <!-- Tags -->
          <v-combobox
            v-model="formData.tags"
            label="Tags (Optional)"
            variant="outlined"
            prepend-inner-icon="mdi-tag"
            multiple
            chips
            closable-chips
            placeholder="Type and press Enter to add tags"
            :items="suggestedTags"
          >
            <template #chip="{ props, item }">
              <v-chip
                v-bind="props"
                variant="outlined"
                :color="getTagColor(item)"
              >
                {{ item }}
              </v-chip>
            </template>
          </v-combobox>
          
          <!-- Story Points (for features) -->
          <v-text-field
            v-if="formData.swimlane === 'feature'"
            v-model.number="formData.storyPoints"
            label="Story Points"
            type="number"
            variant="outlined"
            prepend-inner-icon="mdi-numeric"
            min="1"
            max="21"
            class="mt-3"
          />
        </v-card-text>
        
        <v-divider />
        
        <v-card-actions class="pa-4">
          <v-btn
            @click="handleCancel"
            variant="outlined"
          >
            Cancel
          </v-btn>
          
          <v-spacer />
          
          <v-btn
            color="secondary"
            variant="outlined"
            @click="handleCreateAnother"
            :loading="saving"
          >
            Create & Add Another
          </v-btn>
          
          <v-btn
            color="primary"
            type="submit"
            :loading="saving"
          >
            Create Task
          </v-btn>
        </v-card-actions>
      </v-form>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useProjectsStore } from '@/stores/projects'
import { useTasksStore } from '@/stores/tasks'

// Props
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  projectId: {
    type: String,
    required: true
  },
  defaultColumn: {
    type: String,
    default: 'todo'
  },
  defaultSwimlane: {
    type: String,
    default: 'feature'
  }
})

// Emits
const emit = defineEmits(['update:modelValue', 'task-created'])

// Composables
const projectsStore = useProjectsStore()
const tasksStore = useTasksStore()

// Refs
const form = ref(null)
const saving = ref(false)

// Local state
const formData = ref({
  title: '',
  description: '',
  columnId: props.defaultColumn,
  priority: 'medium',
  swimlane: props.defaultSwimlane,
  assigneeIds: [],
  tags: [],
  dueDate: '',
  storyPoints: 3
})

// Computed
const columnOptions = computed(() => 
  tasksStore.kanbanColumns.map(column => ({
    title: column.title,
    value: column.id,
    color: column.color,
    icon: getColumnIcon(column.id)
  }))
)

const priorityOptions = [
  { title: 'Critical', value: 'critical', color: 'error', icon: 'mdi-alert-circle' },
  { title: 'High', value: 'high', color: 'warning', icon: 'mdi-arrow-up' },
  { title: 'Medium', value: 'medium', color: 'info', icon: 'mdi-minus' },
  { title: 'Low', value: 'low', color: 'success', icon: 'mdi-arrow-down' }
]

const swimlaneOptions = [
  { title: 'Feature', value: 'feature', color: 'primary', icon: 'mdi-star' },
  { title: 'Bug', value: 'bug', color: 'error', icon: 'mdi-bug' },
  { title: 'Improvement', value: 'improvement', color: 'success', icon: 'mdi-trending-up' }
]

const userOptions = computed(() => 
  projectsStore.projectUsers.map(user => ({
    title: user.name,
    value: user.id,
    avatar: user.avatar,
    role: user.role
  }))
)

const suggestedTags = [
  'frontend', 'backend', 'api', 'ui', 'ux', 'database', 'testing',
  'documentation', 'security', 'performance', 'mobile', 'urgent'
]

// Validation rules
const rules = {
  required: value => !!value || 'This field is required'
}

// Methods
const getColumnIcon = (columnId) => {
  const icons = {
    'backlog': 'mdi-inbox',
    'todo': 'mdi-format-list-checks',
    'in-progress': 'mdi-clock',
    'review': 'mdi-eye',
    'done': 'mdi-check-circle'
  }
  return icons[columnId] || 'mdi-circle'
}

const getTagColor = (tag) => {
  const colors = ['primary', 'secondary', 'success', 'info', 'warning', 'purple', 'teal']
  let hash = 0
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

const resetForm = () => {
  formData.value = {
    title: '',
    description: '',
    columnId: props.defaultColumn,
    priority: 'medium',
    swimlane: props.defaultSwimlane,
    assigneeIds: [],
    tags: [],
    dueDate: '',
    storyPoints: 3
  }
}

const handleSubmit = async () => {
  const { valid } = await form.value.validate()
  if (!valid) return
  
  try {
    saving.value = true
    
    const taskData = {
      ...formData.value,
      projectId: props.projectId,
      teamId: projectsStore.projectTeams[0]?.id || null
    }
    
    const newTask = await tasksStore.createTask(taskData)
    emit('task-created', newTask)
    handleClose()
  } catch (error) {
    console.error('Error creating task:', error)
  } finally {
    saving.value = false
  }
}

const handleCreateAnother = async () => {
  const { valid } = await form.value.validate()
  if (!valid) return
  
  try {
    saving.value = true
    
    const taskData = {
      ...formData.value,
      projectId: props.projectId,
      teamId: projectsStore.projectTeams[0]?.id || null
    }
    
    const newTask = await tasksStore.createTask(taskData)
    emit('task-created', newTask)
    
    // Reset form but keep some values
    const preservedValues = {
      columnId: formData.value.columnId,
      priority: formData.value.priority,
      swimlane: formData.value.swimlane
    }
    
    resetForm()
    Object.assign(formData.value, preservedValues)
    
    await nextTick()
    form.value?.resetValidation()
  } catch (error) {
    console.error('Error creating task:', error)
  } finally {
    saving.value = false
  }
}

const handleCancel = () => {
  handleClose()
}

const handleClose = () => {
  emit('update:modelValue', false)
  setTimeout(() => {
    resetForm()
    if (form.value) {
      form.value.resetValidation()
    }
  }, 300)
}

// Watchers
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    resetForm()
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

.v-card-title {
  background: rgba(var(--v-theme-primary), 0.1);
  color: rgb(var(--v-theme-primary));
}

@media (max-width: 600px) {
  :deep(.v-dialog .v-card) {
    margin: 12px;
  }
}
</style>