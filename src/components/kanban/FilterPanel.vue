<template>
  <v-card min-width="320" max-width="400">
    <v-card-title class="text-h6 d-flex align-center justify-space-between">
      <span>Filters</span>
      <v-btn
        variant="text"
        size="small"
        @click="$emit('clear')"
      >
        Clear All
      </v-btn>
    </v-card-title>
    
    <v-divider />
    
    <v-card-text class="pa-4">
      <!-- Assignee Filter -->
      <div class="mb-4">
        <v-label class="text-subtitle-2 font-weight-bold mb-2">
          Assignee
        </v-label>
        <v-select
          v-model="localFilters.assignee"
          :items="assigneeOptions"
          item-title="name"
          item-value="id"
          multiple
          chips
          closable-chips
          placeholder="Select assignees..."
          variant="outlined"
          density="compact"
          hide-details
        >
          <template #chip="{ props, item }">
            <v-chip
              v-bind="props"
              size="small"
            >
              <v-avatar start size="20">
                <v-img
                  v-if="item.raw.avatar"
                  :src="item.raw.avatar"
                  :alt="item.raw.name"
                />
                <span v-else class="text-caption">
                  {{ item.raw.name.charAt(0) }}
                </span>
              </v-avatar>
              {{ item.raw.name }}
            </v-chip>
          </template>
          
          <template #item="{ props, item }">
            <v-list-item
              v-bind="props"
              :title="item.raw.name"
              :subtitle="item.raw.role"
            >
              <template #prepend>
                <v-avatar size="32">
                  <v-img
                    v-if="item.raw.avatar"
                    :src="item.raw.avatar"
                    :alt="item.raw.name"
                  />
                  <span v-else class="text-caption">
                    {{ item.raw.name.charAt(0) }}
                  </span>
                </v-avatar>
              </template>
            </v-list-item>
          </template>
        </v-select>
      </div>

      <!-- Priority Filter -->
      <div class="mb-4">
        <v-label class="text-subtitle-2 font-weight-bold mb-2">
          Priority
        </v-label>
        <v-select
          v-model="localFilters.priority"
          :items="priorityOptions"
          multiple
          chips
          closable-chips
          placeholder="Select priorities..."
          variant="outlined"
          density="compact"
          hide-details
        >
          <template #chip="{ props, item }">
            <v-chip
              v-bind="props"
              :color="getPriorityColor(item.value)"
              size="small"
            >
              {{ item.title }}
            </v-chip>
          </template>
          
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
      </div>

      <!-- Tags Filter -->
      <div class="mb-4">
        <v-label class="text-subtitle-2 font-weight-bold mb-2">
          Tags
        </v-label>
        <v-select
          v-model="localFilters.tags"
          :items="availableTags"
          multiple
          chips
          closable-chips
          placeholder="Select tags..."
          variant="outlined"
          density="compact"
          hide-details
        >
          <template #chip="{ props, item }">
            <v-chip
              v-bind="props"
              size="small"
              variant="outlined"
            >
              {{ item.value }}
            </v-chip>
          </template>
        </v-select>
      </div>

      <!-- Due Date Filter -->
      <div class="mb-4">
        <v-label class="text-subtitle-2 font-weight-bold mb-2">
          Due Date
        </v-label>
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
              placeholder="Select due date..."
              prepend-inner-icon="mdi-calendar"
              variant="outlined"
              density="compact"
              readonly
              hide-details
              clearable
              @click:clear="localFilters.dueDate = null"
            />
          </template>
          
          <v-date-picker
            v-model="localFilters.dueDate"
            @update:model-value="showDatePicker = false"
          />
        </v-menu>
        
        <div class="mt-2">
          <v-btn-toggle
            v-model="dueDatePreset"
            variant="outlined"
            size="small"
            density="compact"
            class="w-100"
          >
            <v-btn value="today" size="small">Today</v-btn>
            <v-btn value="week" size="small">This Week</v-btn>
            <v-btn value="month" size="small">This Month</v-btn>
          </v-btn-toggle>
        </div>
      </div>

      <!-- Filter Summary -->
      <div v-if="hasActiveFilters" class="mt-4 pt-4 border-t">
        <v-label class="text-subtitle-2 font-weight-bold mb-2">
          Active Filters
        </v-label>
        <div class="d-flex flex-wrap ga-2">
          <v-chip
            v-if="localFilters.assignee.length > 0"
            size="small"
            closable
            @click:close="localFilters.assignee = []"
          >
            Assignee ({{ localFilters.assignee.length }})
          </v-chip>
          
          <v-chip
            v-if="localFilters.priority.length > 0"
            size="small"
            closable
            @click:close="localFilters.priority = []"
          >
            Priority ({{ localFilters.priority.length }})
          </v-chip>
          
          <v-chip
            v-if="localFilters.tags.length > 0"
            size="small"
            closable
            @click:close="localFilters.tags = []"
          >
            Tags ({{ localFilters.tags.length }})
          </v-chip>
          
          <v-chip
            v-if="localFilters.dueDate"
            size="small"
            closable
            @click:close="localFilters.dueDate = null"
          >
            Due Date
          </v-chip>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref, computed, watch, inject } from 'vue'

const props = defineProps({
  filters: {
    type: Object,
    required: true
  },
  users: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:filters', 'clear'])

// Get available tags from tasks store
const tasksStore = inject('tasksStore', null)

// Local state
const showDatePicker = ref(false)
const dueDatePreset = ref(null)

// Local filters for v-model
const localFilters = computed({
  get: () => props.filters,
  set: (value) => emit('update:filters', value)
})

// Computed properties
const assigneeOptions = computed(() => 
  props.users.map(user => ({
    id: user.id,
    name: user.name,
    role: user.role,
    avatar: user.avatar
  }))
)

const priorityOptions = computed(() => [
  { title: 'Critical', value: 'critical' },
  { title: 'High', value: 'high' },
  { title: 'Medium', value: 'medium' },
  { title: 'Low', value: 'low' }
])

const availableTags = computed(() => {
  // Get unique tags from all tasks
  const allTags = tasksStore?.getAllTags() || [
    'frontend', 'backend', 'ui', 'ux', 'api', 'database', 
    'security', 'performance', 'bug', 'feature', 'improvement'
  ]
  
  return allTags.map(tag => ({
    title: tag,
    value: tag
  }))
})

const formattedDueDate = computed(() => {
  if (!localFilters.value.dueDate) return ''
  return new Date(localFilters.value.dueDate).toLocaleDateString()
})

const hasActiveFilters = computed(() => 
  localFilters.value.assignee.length > 0 ||
  localFilters.value.priority.length > 0 ||
  localFilters.value.tags.length > 0 ||
  localFilters.value.dueDate !== null
)

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

// Watch for due date preset changes
watch(dueDatePreset, (preset) => {
  if (!preset) return

  const today = new Date()
  let dueDate = null

  switch (preset) {
    case 'today':
      dueDate = today
      break
    case 'week':
      dueDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
      break
    case 'month':
      dueDate = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate())
      break
  }

  if (dueDate) {
    localFilters.value.dueDate = dueDate.toISOString().split('T')[0]
  }
})

// Clear preset when due date is manually changed
watch(() => localFilters.value.dueDate, () => {
  dueDatePreset.value = null
})
</script>

<style scoped>
.border-t {
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.12);
}
</style>