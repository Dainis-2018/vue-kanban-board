<!-- src/components/kanban/ColumnDialog.vue -->
<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    max-width="500px"
    persistent
  >
    <v-card>
      <v-card-title class="text-h6 d-flex align-center">
        <v-icon class="mr-2" :color="isEditing ? 'warning' : 'primary'">
          {{ isEditing ? 'mdi-pencil' : 'mdi-plus' }}
        </v-icon>
        {{ isEditing ? 'Edit Column' : 'Add New Column' }}
      </v-card-title>
      
      <v-divider />
      
      <v-card-text class="pt-4">
        <v-form ref="form" v-model="valid" @submit.prevent="handleSubmit">
          <!-- Column Title -->
          <v-text-field
            v-model="columnForm.title"
            label="Column Title"
            placeholder="e.g., To Do, In Progress, Done"
            variant="outlined"
            :rules="[rules.required, rules.unique]"
            autofocus
            class="mb-4"
          />

          <!-- Column Color -->
          <div class="mb-4">
            <v-label class="text-subtitle-2 font-weight-bold mb-2 d-block">
              Column Color
            </v-label>
            <div class="d-flex flex-wrap ga-2">
              <v-btn
                v-for="color in colorOptions"
                :key="color.value"
                :color="color.value"
                :variant="columnForm.color === color.value ? 'flat' : 'outlined'"
                size="small"
                class="color-btn"
                @click="columnForm.color = color.value"
              >
                {{ color.name }}
              </v-btn>
            </div>
          </div>

          <!-- Column Position -->
          <v-select
            v-model="columnForm.position"
            :items="positionOptions"
            label="Position"
            variant="outlined"
            class="mb-4"
          />

          <!-- Column Settings -->
          <div class="mb-4">
            <v-label class="text-subtitle-2 font-weight-bold mb-2 d-block">
              Column Settings
            </v-label>
            
            <v-checkbox
              v-model="columnForm.allowDrop"
              label="Allow dropping tasks into this column"
              density="compact"
              hide-details
              class="mb-2"
            />
            
            <v-checkbox
              v-model="columnForm.autoSort"
              label="Auto-sort tasks by priority"
              density="compact"
              hide-details
              class="mb-2"
            />
            
            <v-text-field
              v-model.number="columnForm.taskLimit"
              label="Task Limit (optional)"
              type="number"
              variant="outlined"
              density="compact"
              placeholder="No limit"
              min="0"
              class="mt-2"
            />
          </div>

          <!-- Column Description -->
          <v-textarea
            v-model="columnForm.description"
            label="Description (optional)"
            placeholder="Describe the purpose of this column..."
            variant="outlined"
            rows="3"
            class="mb-4"
          />
        </v-form>
      </v-card-text>
      
      <v-divider />
      
      <v-card-actions class="pa-4">
        <v-btn
          variant="text"
          @click="handleCancel"
        >
          Cancel
        </v-btn>
        
        <v-spacer />
        
        <v-btn
          v-if="isEditing"
          variant="text"
          color="error"
          prepend-icon="mdi-delete"
          @click="handleDelete"
          class="mr-2"
        >
          Delete Column
        </v-btn>
        
        <v-btn
          color="primary"
          :loading="saving"
          :disabled="!valid"
          @click="handleSubmit"
        >
          {{ isEditing ? 'Update Column' : 'Create Column' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  column: {
    type: Object,
    default: null
  },
  existingColumns: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue', 'save', 'delete'])

// Local state
const form = ref(null)
const valid = ref(false)
const saving = ref(false)

const columnForm = ref({
  title: '',
  color: 'primary',
  position: 'end',
  allowDrop: true,
  autoSort: false,
  taskLimit: null,
  description: ''
})

// Computed
const isEditing = computed(() => !!props.column)

const colorOptions = computed(() => [
  { name: 'Blue', value: 'primary' },
  { name: 'Green', value: 'success' },
  { name: 'Orange', value: 'warning' },
  { name: 'Red', value: 'error' },
  { name: 'Purple', value: 'purple' },
  { name: 'Teal', value: 'teal' },
  { name: 'Pink', value: 'pink' },
  { name: 'Grey', value: 'grey' }
])

const positionOptions = computed(() => {
  const options = [
    { title: 'At the beginning', value: 'start' },
    { title: 'At the end', value: 'end' }
  ]
  
  // Add "After [Column]" options for existing columns
  if (props.existingColumns.length > 0) {
    props.existingColumns.forEach((col, index) => {
      options.splice(-1, 0, {
        title: `After "${col.title}"`,
        value: `after-${col.id}`
      })
    })
  }
  
  return options
})

// Validation rules
const rules = {
  required: (value) => !!value || 'This field is required',
  unique: (value) => {
    if (!value) return true
    const existing = props.existingColumns.find(col => 
      col.title.toLowerCase() === value.toLowerCase() && 
      (!props.column || col.id !== props.column.id)
    )
    return !existing || 'A column with this title already exists'
  }
}

// Methods
const resetForm = () => {
  columnForm.value = {
    title: '',
    color: 'primary',
    position: 'end',
    allowDrop: true,
    autoSort: false,
    taskLimit: null,
    description: ''
  }
  
  if (form.value) {
    form.value.resetValidation()
  }
}

const loadColumnData = () => {
  if (props.column) {
    columnForm.value = {
      title: props.column.title || '',
      color: props.column.color || 'primary',
      position: 'end', // Position not applicable when editing
      allowDrop: props.column.allowDrop ?? true,
      autoSort: props.column.autoSort ?? false,
      taskLimit: props.column.taskLimit || null,
      description: props.column.description || ''
    }
  } else {
    resetForm()
  }
}

const handleSubmit = async () => {
  const { valid: isValid } = await form.value.validate()
  if (!isValid) return

  saving.value = true
  
  try {
    const columnData = {
      ...columnForm.value,
      id: props.column?.id || `column-${Date.now()}`,
      order: calculateOrder(),
      collapsed: props.column?.collapsed || false,
      createdAt: props.column?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    emit('save', columnData)
    emit('update:modelValue', false)
    resetForm()
  } catch (error) {
    console.error('Error saving column:', error)
  } finally {
    saving.value = false
  }
}

const calculateOrder = () => {
  if (isEditing.value) {
    return props.column.order
  }
  
  const position = columnForm.value.position
  
  if (position === 'start') {
    return 0
  } else if (position === 'end') {
    return props.existingColumns.length
  } else if (position.startsWith('after-')) {
    const afterColumnId = position.replace('after-', '')
    const afterColumn = props.existingColumns.find(col => col.id === afterColumnId)
    return afterColumn ? afterColumn.order + 1 : props.existingColumns.length
  }
  
  return props.existingColumns.length
}

const handleCancel = () => {
  emit('update:modelValue', false)
  resetForm()
}

const handleDelete = () => {
  if (confirm(`Are you sure you want to delete the "${props.column.title}" column? All tasks in this column will be moved to the backlog.`)) {
    emit('delete', props.column.id)
    emit('update:modelValue', false)
  }
}

// Watchers
watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    loadColumnData()
    nextTick(() => {
      if (form.value) {
        form.value.resetValidation()
      }
    })
  }
})

watch(() => props.column, () => {
  if (props.modelValue) {
    loadColumnData()
  }
})
</script>

<style scoped>
.color-btn {
  min-width: 80px;
  margin: 2px;
}

:deep(.v-text-field .v-input__control) {
  min-height: 56px;
}

:deep(.v-textarea .v-input__control) {
  min-height: auto;
}

:deep(.v-select .v-input__control) {
  min-height: 56px;
}

@media (max-width: 600px) {
  :deep(.v-dialog .v-card) {
    margin: 12px;
  }
  
  .color-btn {
    min-width: 70px;
    font-size: 0.75rem;
  }
}
</style>