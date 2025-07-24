<!-- src/components/kanban/FilterPanel.vue -->
<template>
  <v-card min-width="320" max-width="400" elevation="8">
    <v-card-title class="text-h6 d-flex align-center justify-space-between bg-primary text-white">
      <div class="d-flex align-center">
        <v-icon class="mr-2">mdi-filter</v-icon>
        <span>Filters</span>
      </div>
      <v-btn
        variant="text"
        size="small"
        color="white"
        @click="clearAllFilters"
      >
        Clear All
      </v-btn>
    </v-card-title>
    
    <v-divider />
    
    <v-card-text class="pa-4">
      <!-- Search -->
      <div class="mb-4">
        <v-text-field
          v-model="localFilters.search"
          label="Search tasks..."
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          density="compact"
          hide-details
          clearable
          @update:model-value="updateFilters"
        />
      </div>

      <!-- Assignee Filter -->
      <div class="mb-4">
        <v-label class="text-subtitle-2 font-weight-bold mb-2 d-block">
          <v-icon class="mr-1" size="16">mdi-account-group</v-icon>
          Assignees
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
          @update:model-value="updateFilters"
        >
          <template #chip="{ props, item }">
            <v-chip
              v-bind="props"
              size="small"
              color="primary"
              variant="flat"
            >
              <v-avatar start size="16">
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
                    {{ item.raw.name?.charAt(0) }}
                  </span>
                </v-avatar>
              </template>
            </v-list-item>
          </template>
        </v-select>
      </div>

      <!-- Priority Filter -->
      <div class="mb-4">
        <v-label class="text-subtitle-2 font-weight-bold mb-2 d-block">
          <v-icon class="mr-1" size="16">mdi-flag</v-icon>
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
          @update:model-value="updateFilters"
        >
          <template #chip="{ props, item }">
            <v-chip
              v-bind="props"
              size="small"
              :color="getPriorityColor(item.value)"
              variant="flat"
            >
              <v-icon start size="12">{{ getPriorityIcon(item.value) }}</v-icon>
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

      <!-- Status Filter -->
      <div class="mb-4">
        <v-label class="text-subtitle-2 font-weight-bold mb-2 d-block">
          <v-icon class="mr-1" size="16">mdi-clipboard-check</v-icon>
          Status
        </v-label>
        <v-select
          v-model="localFilters.status"
          :items="statusOptions"
          multiple
          chips
          closable-chips
          placeholder="Select statuses..."
          variant="outlined"
          density="compact"
          hide-details
          @update:model-value="updateFilters"
        >
          <template #chip="{ props, item }">
            <v-chip
              v-bind="props"
              size="small"
              :color="item.raw.color"
              variant="flat"
            >
              {{ item.title }}
            </v-chip>
          </template>
        </v-select>
      </div>

      <!-- Tags Filter -->
      <div class="mb-4">
        <v-label class="text-subtitle-2 font-weight-bold mb-2 d-block">
          <v-icon class="mr-1" size="16">mdi-tag-multiple</v-icon>
          Tags
        </v-label>
        <v-combobox
          v-model="localFilters.tags"
          :items="availableTags"
          multiple
          chips
          closable-chips
          placeholder="Select or type tags..."
          variant="outlined"
          density="compact"
          hide-details
          @update:model-value="updateFilters"
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
      </div>

      <!-- Due Date Filter -->
      <div class="mb-4">
        <v-label class="text-subtitle-2 font-weight-bold mb-2 d-block">
          <v-icon class="mr-1" size="16">mdi-calendar</v-icon>
          Due Date
        </v-label>
        <v-select
          v-model="localFilters.dueDate"
          :items="dueDateOptions"
          placeholder="Select due date range..."
          variant="outlined"
          density="compact"
          hide-details
          clearable
          @update:model-value="updateFilters"
        >
          <template #item="{ props, item }">
            <v-list-item v-bind="props">
              <template #prepend>
                <v-icon :color="item.raw.color">
                  {{ item.raw.icon }}
                </v-icon>
              </template>
            </v-list-item>
          </template>
        </v-select>
      </div>

      <!-- Quick Filters -->
      <div class="mb-3">
        <v-label class="text-subtitle-2 font-weight-bold mb-2 d-block">
          <v-icon class="mr-1" size="16">mdi-lightning-bolt</v-icon>
          Quick Filters
        </v-label>
        <div class="d-flex flex-wrap ga-2">
          <v-chip
            :variant="localFilters.myTasks ? 'flat' : 'outlined'"
            :color="localFilters.myTasks ? 'primary' : 'default'"
            size="small"
            @click="toggleMyTasks"
          >
            <v-icon start size="16">mdi-account</v-icon>
            My Tasks
          </v-chip>
          
          <v-chip
            :variant="localFilters.overdue ? 'flat' : 'outlined'"
            :color="localFilters.overdue ? 'error' : 'default'"
            size="small"
            @click="toggleOverdue"
          >
            <v-icon start size="16">mdi-clock-alert</v-icon>
            Overdue
          </v-chip>
          
          <v-chip
            :variant="localFilters.unassigned ? 'flat' : 'outlined'"
            :color="localFilters.unassigned ? 'warning' : 'default'"
            size="small"
            @click="toggleUnassigned"
          >
            <v-icon start size="16">mdi-account-off</v-icon>
            Unassigned
          </v-chip>
        </div>
      </div>
    </v-card-text>
    
    <v-divider />
    
    <!-- Filter Summary -->
    <v-card-actions class="pa-4">
      <div class="w-100">
        <div class="d-flex align-center justify-space-between mb-2">
          <span class="text-body-2 text-medium-emphasis">
            Active Filters: {{ activeFilterCount }}
          </span>
          <v-btn
            v-if="activeFilterCount > 0"
            variant="text"
            size="small"
            color="primary"
            @click="clearAllFilters"
          >
            Reset
          </v-btn>
        </div>
        
        <!-- Active filter chips -->
        <div v-if="activeFilterCount > 0" class="d-flex flex-wrap ga-1">
          <v-chip
            v-for="filter in activeFilterChips"
            :key="filter.key"
            size="x-small"
            variant="flat"
            color="primary"
            closable
            @click:close="removeFilter(filter.key)"
          >
            {{ filter.label }}
          </v-chip>
        </div>
      </div>
    </v-card-actions>
  </v-card>
</template>

<script setup>
import { ref, computed, watch, inject } from 'vue'

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({})
  },
  users: {
    type: Array,
    default: () => []
  },
  columns: {
    type: Array,
    default: () => []
  },
  availableTags: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue', 'clear'])

// Get current user from somewhere (inject, store, etc.)
const currentUser = inject('currentUser', { id: 'user-1' })

// Local state
const localFilters = ref({
  search: '',
  assignee: [],
  priority: [],
  status: [],
  tags: [],
  dueDate: null,
  myTasks: false,
  overdue: false,
  unassigned: false,
  ...props.modelValue
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

const statusOptions = computed(() =>
  props.columns.map(column => ({
    title: column.title,
    value: column.id,
    color: column.color || 'primary'
  }))
)

const dueDateOptions = computed(() => [
  { 
    title: 'Overdue', 
    value: 'overdue',
    icon: 'mdi-clock-alert',
    color: 'error'
  },
  { 
    title: 'Today', 
    value: 'today',
    icon: 'mdi-today',
    color: 'primary'
  },
  { 
    title: 'This Week', 
    value: 'thisWeek',
    icon: 'mdi-calendar-week',
    color: 'info'
  },
  { 
    title: 'Next Week', 
    value: 'nextWeek',
    icon: 'mdi-calendar-month',
    color: 'success'
  },
  { 
    title: 'This Month', 
    value: 'thisMonth',
    icon: 'mdi-calendar-month-outline',
    color: 'warning'
  }
])

const activeFilterCount = computed(() => {
  let count = 0
  if (localFilters.value.search) count++
  if (localFilters.value.assignee?.length) count++
  if (localFilters.value.priority?.length) count++
  if (localFilters.value.status?.length) count++
  if (localFilters.value.tags?.length) count++
  if (localFilters.value.dueDate) count++
  if (localFilters.value.myTasks) count++
  if (localFilters.value.overdue) count++
  if (localFilters.value.unassigned) count++
  return count
})

const activeFilterChips = computed(() => {
  const chips = []
  
  if (localFilters.value.search) {
    chips.push({ key: 'search', label: `Search: ${localFilters.value.search}` })
  }
  
  if (localFilters.value.assignee?.length) {
    const names = localFilters.value.assignee
      .map(id => props.users.find(u => u.id === id)?.name)
      .filter(Boolean)
    chips.push({ key: 'assignee', label: `Assignees: ${names.join(', ')}` })
  }
  
  if (localFilters.value.priority?.length) {
    chips.push({ key: 'priority', label: `Priority: ${localFilters.value.priority.join(', ')}` })
  }
  
  if (localFilters.value.status?.length) {
    const statuses = localFilters.value.status
      .map(id => props.columns.find(c => c.id === id)?.title)
      .filter(Boolean)
    chips.push({ key: 'status', label: `Status: ${statuses.join(', ')}` })
  }
  
  if (localFilters.value.tags?.length) {
    chips.push({ key: 'tags', label: `Tags: ${localFilters.value.tags.join(', ')}` })
  }
  
  if (localFilters.value.dueDate) {
    const option = dueDateOptions.value.find(o => o.value === localFilters.value.dueDate)
    chips.push({ key: 'dueDate', label: `Due: ${option?.title}` })
  }
  
  if (localFilters.value.myTasks) {
    chips.push({ key: 'myTasks', label: 'My Tasks' })
  }
  
  if (localFilters.value.overdue) {
    chips.push({ key: 'overdue', label: 'Overdue' })
  }
  
  if (localFilters.value.unassigned) {
    chips.push({ key: 'unassigned', label: 'Unassigned' })
  }
  
  return chips
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

const updateFilters = () => {
  emit('update:modelValue', { ...localFilters.value })
}

const clearAllFilters = () => {
  localFilters.value = {
    search: '',
    assignee: [],
    priority: [],
    status: [],
    tags: [],
    dueDate: null,
    myTasks: false,
    overdue: false,
    unassigned: false
  }
  updateFilters()
  emit('clear')
}

const removeFilter = (filterKey) => {
  switch (filterKey) {
    case 'search':
      localFilters.value.search = ''
      break
    case 'assignee':
      localFilters.value.assignee = []
      break
    case 'priority':
      localFilters.value.priority = []
      break
    case 'status':
      localFilters.value.status = []
      break
    case 'tags':
      localFilters.value.tags = []
      break
    case 'dueDate':
      localFilters.value.dueDate = null
      break
    case 'myTasks':
      localFilters.value.myTasks = false
      break
    case 'overdue':
      localFilters.value.overdue = false
      break
    case 'unassigned':
      localFilters.value.unassigned = false
      break
  }
  updateFilters()
}

const toggleMyTasks = () => {
  localFilters.value.myTasks = !localFilters.value.myTasks
  if (localFilters.value.myTasks) {
    // Add current user to assignee filter
    if (!localFilters.value.assignee.includes(currentUser.id)) {
      localFilters.value.assignee.push(currentUser.id)
    }
  } else {
    // Remove current user from assignee filter
    const index = localFilters.value.assignee.indexOf(currentUser.id)
    if (index !== -1) {
      localFilters.value.assignee.splice(index, 1)
    }
  }
  updateFilters()
}

const toggleOverdue = () => {
  localFilters.value.overdue = !localFilters.value.overdue
  if (localFilters.value.overdue) {
    localFilters.value.dueDate = 'overdue'
  } else if (localFilters.value.dueDate === 'overdue') {
    localFilters.value.dueDate = null
  }
  updateFilters()
}

const toggleUnassigned = () => {
  localFilters.value.unassigned = !localFilters.value.unassigned
  updateFilters()
}

// Watch for external changes
watch(() => props.modelValue, (newFilters) => {
  localFilters.value = { ...localFilters.value, ...newFilters }
}, { deep: true })
</script>

<style scoped>
:deep(.v-select .v-field__input) {
  min-height: 40px;
}

:deep(.v-text-field .v-field__input) {
  min-height: 40px;
}

:deep(.v-chip-group .v-chip) {
  margin: 2px;
}

.v-card {
  border-radius: 12px;
}

.v-card-title {
  border-radius: 12px 12px 0 0 !important;
}

@media (max-width: 600px) {
  :deep(.v-dialog .v-card) {
    margin: 12px;
  }
}
</style>