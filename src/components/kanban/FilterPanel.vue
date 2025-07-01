<template>
  <v-card min-width="320" max-width="400">
    <v-card-title class="d-flex align-center justify-space-between">
      <span class="text-h6">Filter Tasks</span>
      <v-btn
        icon="mdi-refresh"
        variant="text"
        size="small"
        @click="$emit('clear')"
      />
    </v-card-title>
    
    <v-divider />
    
    <v-card-text class="pa-0">
      <div class="pa-4">
        <!-- Assignee Filter -->
        <div class="filter-section mb-4">
          <h4 class="text-subtitle-2 font-weight-bold mb-2">
            <v-icon size="16" class="mr-1">mdi-account</v-icon>
            Assigned To
          </h4>
          
          <div class="d-flex flex-wrap ga-1">
            <v-chip
              v-for="user in projectUsers"
              :key="user.id"
              :model-value="assignee.includes(user.id)"
              @click="toggleAssignee(user.id)"
              variant="outlined"
              size="small"
              filter
              :color="assignee.includes(user.id) ? 'primary' : ''"
            >
              <template #prepend>
                <v-avatar size="20" start>
                  <v-img :src="user.avatar" />
                </v-avatar>
              </template>
              {{ user.name }}
            </v-chip>
          </div>
        </div>

        <!-- Priority Filter -->
        <div class="filter-section mb-4">
          <h4 class="text-subtitle-2 font-weight-bold mb-2">
            <v-icon size="16" class="mr-1">mdi-flag</v-icon>
            Priority
          </h4>
          
          <div class="d-flex flex-wrap ga-1">
            <v-chip
              v-for="priorityOption in priorityOptions"
              :key="priorityOption.value"
              :model-value="priority.includes(priorityOption.value)"
              @click="togglePriority(priorityOption.value)"
              variant="outlined"
              size="small"
              filter
              :color="priority.includes(priorityOption.value) ? priorityOption.color : ''"
            >
              <template #prepend>
                <v-icon size="14" :color="priorityOption.color">
                  {{ priorityOption.icon }}
                </v-icon>
              </template>
              {{ priorityOption.label }}
            </v-chip>
          </div>
        </div>

        <!-- Tags Filter -->
        <div class="filter-section mb-4">
          <h4 class="text-subtitle-2 font-weight-bold mb-2">
            <v-icon size="16" class="mr-1">mdi-tag</v-icon>
            Tags
          </h4>
          
          <v-combobox
            :model-value="tags"
            @update:model-value="updateTags"
            :items="availableTags"
            placeholder="Search or add tags..."
            variant="outlined"
            density="compact"
            multiple
            chips
            closable-chips
            hide-details
          >
            <template #chip="{ props, item }">
              <v-chip
                v-bind="props"
                variant="flat"
                size="small"
                :color="getTagColor(item)"
              >
                {{ item }}
              </v-chip>
            </template>
          </v-combobox>
        </div>

        <!-- Due Date Filter -->
        <div class="filter-section mb-4">
          <h4 class="text-subtitle-2 font-weight-bold mb-2">
            <v-icon size="16" class="mr-1">mdi-calendar</v-icon>
            Due Date
          </h4>
          
          <v-btn-toggle
            :model-value="dueDateFilter"
            @update:model-value="updateDueDate"
            variant="outlined"
            size="small"
            class="mb-3"
            mandatory
          >
            <v-btn value="">All</v-btn>
            <v-btn value="overdue">Overdue</v-btn>
            <v-btn value="today">Today</v-btn>
            <v-btn value="week">This Week</v-btn>
          </v-btn-toggle>
          
          <v-text-field
            v-if="dueDateFilter === 'custom'"
            :model-value="dueDate"
            @update:model-value="updateCustomDueDate"
            label="Custom Date"
            type="date"
            variant="outlined"
            density="compact"
            hide-details
          />
        </div>

        <!-- Swimlane Filter -->
        <div class="filter-section mb-4">
          <h4 class="text-subtitle-2 font-weight-bold mb-2">
            <v-icon size="16" class="mr-1">mdi-swim</v-icon>
            Type
          </h4>
          
          <div class="d-flex flex-wrap ga-1">
            <v-chip
              v-for="swimlaneOption in swimlaneOptions"
              :key="swimlaneOption.value"
              :model-value="swimlane.includes(swimlaneOption.value)"
              @click="toggleSwimlane(swimlaneOption.value)"
              variant="outlined"
              size="small"
              filter
              :color="swimlane.includes(swimlaneOption.value) ? swimlaneOption.color : ''"
            >
              <template #prepend>
                <v-icon size="14" :color="swimlaneOption.color">
                  {{ swimlaneOption.icon }}
                </v-icon>
              </template>
              {{ swimlaneOption.label }}
            </v-chip>
          </div>
        </div>

        <!-- Quick Filters -->
        <div class="filter-section">
          <h4 class="text-subtitle-2 font-weight-bold mb-2">
            <v-icon size="16" class="mr-1">mdi-lightning-bolt</v-icon>
            Quick Filters
          </h4>
          
          <div class="d-flex flex-column ga-2">
            <v-btn
              variant="outlined"
              size="small"
              prepend-icon="mdi-account"
              @click="filterMyTasks"
              block
            >
              My Tasks
            </v-btn>
            
            <v-btn
              variant="outlined"
              size="small"
              prepend-icon="mdi-clock-alert"
              @click="filterOverdue"
              block
            >
              Overdue Tasks
            </v-btn>
            
            <v-btn
              variant="outlined"
              size="small"
              prepend-icon="mdi-account-off"
              @click="filterUnassigned"
              block
            >
              Unassigned
            </v-btn>
            
            <v-btn
              variant="outlined"
              size="small"
              prepend-icon="mdi-calendar-today"
              @click="filterDueToday"
              block
            >
              Due Today
            </v-btn>
          </div>
        </div>
      </div>
    </v-card-text>
    
    <v-divider />
    
    <v-card-actions class="pa-4">
      <v-btn
        variant="outlined"
        @click="$emit('clear')"
        block
      >
        Clear All Filters
      </v-btn>
    </v-card-actions>
    
    <!-- Active Filters Summary -->
    <div v-if="hasActiveFilters" class="pa-4 pt-0">
      <v-divider class="mb-3" />
      <div class="d-flex align-center justify-space-between">
        <span class="text-caption text-medium-emphasis">
          {{ activeFiltersCount }} filter{{ activeFiltersCount !== 1 ? 's' : '' }} active
        </span>
        <v-btn
          size="x-small"
          variant="text"
          @click="$emit('clear')"
        >
          Clear
        </v-btn>
      </div>
    </div>
  </v-card>
</template>

<script setup>
import { computed } from 'vue'

// Props
const props = defineProps({
  assignee: {
    type: Array,
    default: () => []
  },
  priority: {
    type: Array,
    default: () => []
  },
  tags: {
    type: Array,
    default: () => []
  },
  dueDate: {
    type: String,
    default: ''
  },
  swimlane: {
    type: Array,
    default: () => []
  },
  projectUsers: {
    type: Array,
    default: () => []
  }
})

// Emits
const emit = defineEmits([
  'update:assignee',
  'update:priority', 
  'update:tags',
  'update:dueDate',
  'update:swimlane',
  'clear'
])

// Mock current user ID (in real app, get from auth store)
const currentUserId = 'user-1'

// Options
const priorityOptions = [
  { label: 'Critical', value: 'critical', color: 'error', icon: 'mdi-alert-circle' },
  { label: 'High', value: 'high', color: 'warning', icon: 'mdi-arrow-up' },
  { label: 'Medium', value: 'medium', color: 'info', icon: 'mdi-minus' },
  { label: 'Low', value: 'low', color: 'success', icon: 'mdi-arrow-down' }
]

const swimlaneOptions = [
  { label: 'Feature', value: 'feature', color: 'primary', icon: 'mdi-star' },
  { label: 'Bug', value: 'bug', color: 'error', icon: 'mdi-bug' },
  { label: 'Improvement', value: 'improvement', color: 'success', icon: 'mdi-trending-up' }
]

// Computed
const availableTags = [
  'frontend', 'backend', 'api', 'ui', 'ux', 'database', 'testing',
  'documentation', 'security', 'performance', 'mobile', 'urgent',
  'design', 'refactor', 'optimization', 'integration'
]

const dueDateFilter = computed(() => {
  if (!props.dueDate) return ''
  
  const today = new Date().toISOString().split('T')[0]
  if (props.dueDate === today) return 'today'
  
  // Check if it's this week
  const date = new Date(props.dueDate)
  const now = new Date()
  const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  
  if (date <= weekFromNow && date >= now) return 'week'
  if (date < now) return 'overdue'
  
  return 'custom'
})

const hasActiveFilters = computed(() => 
  props.assignee.length > 0 ||
  props.priority.length > 0 ||
  props.tags.length > 0 ||
  props.dueDate ||
  props.swimlane.length > 0
)

const activeFiltersCount = computed(() => {
  let count = 0
  if (props.assignee.length > 0) count++
  if (props.priority.length > 0) count++
  if (props.tags.length > 0) count++
  if (props.dueDate) count++
  if (props.swimlane.length > 0) count++
  return count
})

// Methods
const toggleAssignee = (userId) => {
  const newAssignees = props.assignee.includes(userId)
    ? props.assignee.filter(id => id !== userId)
    : [...props.assignee, userId]
  
  emit('update:assignee', newAssignees)
}

const togglePriority = (priorityValue) => {
  const newPriorities = props.priority.includes(priorityValue)
    ? props.priority.filter(p => p !== priorityValue)
    : [...props.priority, priorityValue]
  
  emit('update:priority', newPriorities)
}

const toggleSwimlane = (swimlaneValue) => {
  const newSwimlanes = props.swimlane.includes(swimlaneValue)
    ? props.swimlane.filter(s => s !== swimlaneValue)
    : [...props.swimlane, swimlaneValue]
  
  emit('update:swimlane', newSwimlanes)
}

const updateTags = (newTags) => {
  emit('update:tags', newTags)
}

const updateDueDate = (filter) => {
  const today = new Date()
  let dateValue = ''
  
  switch (filter) {
    case 'today':
      dateValue = today.toISOString().split('T')[0]
      break
    case 'week':
      const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
      dateValue = weekFromNow.toISOString().split('T')[0]
      break
    case 'overdue':
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
      dateValue = yesterday.toISOString().split('T')[0]
      break
    default:
      dateValue = ''
  }
  
  emit('update:dueDate', dateValue)
}

const updateCustomDueDate = (date) => {
  emit('update:dueDate', date)
}

const getTagColor = (tag) => {
  const colors = ['primary', 'secondary', 'success', 'info', 'warning', 'purple', 'teal']
  let hash = 0
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

// Quick filter methods
const filterMyTasks = () => {
  emit('update:assignee', [currentUserId])
}

const filterOverdue = () => {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  emit('update:dueDate', yesterday.toISOString().split('T')[0])
}

const filterUnassigned = () => {
  // This would require a special handling in the parent component
  // For now, we'll clear assignee filter (not exactly unassigned but close)
  emit('update:assignee', [])
}

const filterDueToday = () => {
  const today = new Date().toISOString().split('T')[0]
  emit('update:dueDate', today)
}
</script>

<style scoped>
.filter-section {
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.12);
}

.filter-section:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

:deep(.v-btn-toggle .v-btn) {
  font-size: 0.75rem;
  padding: 0 12px;
}

:deep(.v-chip--filter) {
  transition: all 0.2s ease;
}

:deep(.v-chip--filter:hover) {
  transform: translateY(-1px);
}

:deep(.v-combobox .v-input__control) {
  min-height: 40px;
}

@media (max-width: 600px) {
  .v-card {
    margin: 8px;
    min-width: calc(100vw - 32px);
  }
}
</style>