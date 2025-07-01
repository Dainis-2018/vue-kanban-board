<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    max-width="700"
    scrollable
  >
    <v-card>
      <v-card-title class="d-flex align-center justify-space-between">
        <div class="d-flex align-center">
          <v-icon class="mr-2">mdi-link</v-icon>
          <span class="text-h6">Link Tasks to Milestone</span>
        </div>
        <v-btn
          icon="mdi-close"
          variant="text"
          @click="$emit('update:modelValue', false)"
        />
      </v-card-title>
      
      <v-divider />
      
      <!-- Milestone Info -->
      <div v-if="milestone" class="pa-4 bg-surface-variant">
        <div class="d-flex align-center">
          <v-avatar
            :color="getMilestoneTypeColor(milestone.type)"
            size="32"
            class="mr-3"
          >
            <v-icon size="16" color="white">
              {{ getMilestoneTypeIcon(milestone.type) }}
            </v-icon>
          </v-avatar>
          
          <div>
            <h3 class="text-subtitle-1 font-weight-bold">{{ milestone.title }}</h3>
            <p class="text-caption text-medium-emphasis mb-0">
              {{ formatDateRange(milestone.start, milestone.end) }}
            </p>
          </div>
        </div>
      </div>
      
      <v-divider />
      
      <!-- Search and Filters -->
      <div class="pa-4">
        <v-row>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="searchQuery"
              placeholder="Search tasks..."
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="compact"
              hide-details
              clearable
            />
          </v-col>
          
          <v-col cols="12" md="3">
            <v-select
              v-model="statusFilter"
              :items="statusOptions"
              label="Status"
              variant="outlined"
              density="compact"
              hide-details
              clearable
            />
          </v-col>
          
          <v-col cols="12" md="3">
            <v-select
              v-model="priorityFilter"
              :items="priorityOptions"
              label="Priority"
              variant="outlined"
              density="compact"
              hide-details
              clearable
            />
          </v-col>
        </v-row>
      </div>
      
      <v-divider />
      
      <!-- Task Selection -->
      <v-card-text class="pa-0" style="height: 400px;">
        <div class="pa-4">
          <div class="d-flex align-center justify-space-between mb-3">
            <h4 class="text-subtitle-1">
              Available Tasks ({{ filteredTasks.length }})
            </h4>
            
            <div class="d-flex align-center ga-2">
              <v-btn
                size="small"
                variant="outlined"
                @click="selectAll"
                :disabled="filteredTasks.length === 0"
              >
                Select All
              </v-btn>
              
              <v-btn
                size="small"
                variant="outlined"
                @click="clearSelection"
                :disabled="selectedTasks.length === 0"
              >
                Clear
              </v-btn>
            </div>
          </div>
          
          <!-- Task List -->
          <div v-if="filteredTasks.length > 0" class="task-list">
            <v-card
              v-for="task in filteredTasks"
              :key="task.id"
              variant="outlined"
              class="task-item mb-2"
              :class="{ 'task-item--selected': selectedTasks.includes(task.id) }"
              @click="toggleTaskSelection(task.id)"
            >
              <v-card-text class="pa-3">
                <div class="d-flex align-center">
                  <!-- Selection Checkbox -->
                  <v-checkbox
                    :model-value="selectedTasks.includes(task.id)"
                    @click.stop="toggleTaskSelection(task.id)"
                    hide-details
                    class="mr-3"
                  />
                  
                  <!-- Task Info -->
                  <div class="flex-grow-1">
                    <div class="d-flex align-center mb-2">
                      <!-- Status and Priority -->
                      <v-chip
                        :color="getTaskStatusColor(task.columnId)"
                        size="x-small"
                        variant="flat"
                        class="mr-2"
                      >
                        {{ getTaskStatusLabel(task.columnId) }}
                      </v-chip>
                      
                      <v-chip
                        :color="getPriorityColor(task.priority)"
                        size="x-small"
                        variant="outlined"
                        class="mr-2"
                      >
                        {{ task.priority?.toUpperCase() }}
                      </v-chip>
                      
                      <!-- Task ID -->
                      <v-chip
                        size="x-small"
                        variant="tonal"
                        color="grey"
                      >
                        #{{ task.id.split('-')[1] }}
                      </v-chip>
                    </div>
                    
                    <!-- Task Title -->
                    <h5 class="text-body-1 font-weight-medium mb-1">
                      {{ task.title }}
                    </h5>
                    
                    <!-- Task Details -->
                    <div class="d-flex align-center justify-space-between">
                      <div class="d-flex align-center">
                        <!-- Assignees -->
                        <v-avatar-group
                          v-if="task.assigneeIds?.length"
                          max="3"
                          size="24"
                          class="mr-3"
                        >
                          <v-avatar
                            v-for="userId in task.assigneeIds"
                            :key="userId"
                            size="24"
                          >
                            <v-img :src="getUserById(userId)?.avatar" />
                          </v-avatar>
                        </v-avatar-group>
                        
                        <!-- Tags -->
                        <div v-if="task.tags?.length" class="d-flex align-center ga-1">
                          <v-chip
                            v-for="tag in task.tags.slice(0, 2)"
                            :key="tag"
                            size="x-small"
                            variant="outlined"
                          >
                            {{ tag }}
                          </v-chip>
                          <span v-if="task.tags.length > 2" class="text-caption text-medium-emphasis">
                            +{{ task.tags.length - 2 }}
                          </span>
                        </div>
                      </div>
                      
                      <!-- Due Date -->
                      <div v-if="task.dueDate" class="text-caption text-medium-emphasis">
                        Due {{ formatDate(task.dueDate) }}
                      </div>
                    </div>
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </div>
          
          <!-- Empty State -->
          <div v-else class="text-center pa-8">
            <v-icon size="48" color="medium-emphasis" class="mb-2">
              mdi-clipboard-search-outline
            </v-icon>
            <p class="text-body-2 text-medium-emphasis">
              {{ searchQuery || statusFilter || priorityFilter ? 'No tasks match your filters.' : 'No available tasks to link.' }}
            </p>
          </div>
        </div>
      </v-card-text>
      
      <v-divider />
      
      <!-- Actions -->
      <v-card-actions class="pa-4">
        <div class="d-flex align-center w-100">
          <div class="text-body-2 text-medium-emphasis">
            {{ selectedTasks.length }} task{{ selectedTasks.length !== 1 ? 's' : '' }} selected
          </div>
          
          <v-spacer />
          
          <v-btn
            @click="$emit('update:modelValue', false)"
            variant="outlined"
          >
            Cancel
          </v-btn>
          
          <v-btn
            color="primary"
            @click="handleLinkTasks"
            :disabled="selectedTasks.length === 0"
            :loading="linking"
            class="ml-2"
          >
            Link {{ selectedTasks.length }} Task{{ selectedTasks.length !== 1 ? 's' : '' }}
          </v-btn>
        </div>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useProjectsStore } from '@/stores/projects'

// Props
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  milestone: {
    type: Object,
    default: null
  },
  availableTasks: {
    type: Array,
    default: () => []
  }
})

// Emits
const emit = defineEmits(['update:modelValue', 'tasks-linked'])

// Composables
const projectsStore = useProjectsStore()

// Local state
const searchQuery = ref('')
const statusFilter = ref('')
const priorityFilter = ref('')
const selectedTasks = ref([])
const linking = ref(false)

// Filter options
const statusOptions = [
  { title: 'Backlog', value: 'backlog' },
  { title: 'To Do', value: 'todo' },
  { title: 'In Progress', value: 'in-progress' },
  { title: 'Review', value: 'review' },
  { title: 'Done', value: 'done' }
]

const priorityOptions = [
  { title: 'Critical', value: 'critical' },
  { title: 'High', value: 'high' },
  { title: 'Medium', value: 'medium' },
  { title: 'Low', value: 'low' }
]

// Computed
const filteredTasks = computed(() => {
  let filtered = props.availableTasks

  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(task =>
      task.title.toLowerCase().includes(query) ||
      task.description?.toLowerCase().includes(query) ||
      task.tags?.some(tag => tag.toLowerCase().includes(query))
    )
  }

  // Status filter
  if (statusFilter.value) {
    filtered = filtered.filter(task => task.columnId === statusFilter.value)
  }

  // Priority filter
  if (priorityFilter.value) {
    filtered = filtered.filter(task => task.priority === priorityFilter.value)
  }

  return filtered.sort((a, b) => {
    // Sort by priority, then by due date
    const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
    const aPriority = priorityOrder[a.priority] || 0
    const bPriority = priorityOrder[b.priority] || 0
    
    if (aPriority !== bPriority) {
      return bPriority - aPriority
    }
    
    if (a.dueDate && b.dueDate) {
      return new Date(a.dueDate) - new Date(b.dueDate)
    }
    
    return a.dueDate ? -1 : 1
  })
})

// Methods
const getMilestoneTypeColor = (type) => {
  const colors = {
    milestone: 'primary',
    release: 'success',
    phase: 'info',
    deadline: 'warning',
    review: 'purple'
  }
  return colors[type] || 'primary'
}

const getMilestoneTypeIcon = (type) => {
  const icons = {
    milestone: 'mdi-flag',
    release: 'mdi-rocket-launch',
    phase: 'mdi-timeline',
    deadline: 'mdi-clock-alert',
    review: 'mdi-eye'
  }
  return icons[type] || 'mdi-flag'
}

const getTaskStatusColor = (columnId) => {
  const colors = {
    'backlog': 'grey',
    'todo': 'blue',
    'in-progress': 'orange',
    'review': 'purple',
    'done': 'green'
  }
  return colors[columnId] || 'grey'
}

const getTaskStatusLabel = (columnId) => {
  const labels = {
    'backlog': 'Backlog',
    'todo': 'To Do',
    'in-progress': 'In Progress',
    'review': 'Review',
    'done': 'Done'
  }
  return labels[columnId] || columnId
}

const getPriorityColor = (priority) => {
  const colors = {
    critical: 'error',
    high: 'warning',
    medium: 'info',
    low: 'success'
  }
  return colors[priority] || 'info'
}

const getUserById = (userId) => {
  return projectsStore.getUserById(userId)
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  })
}

const formatDateRange = (start, end) => {
  const startDate = formatDate(start)
  const endDate = formatDate(end)
  return `${startDate} - ${endDate}`
}

const toggleTaskSelection = (taskId) => {
  const index = selectedTasks.value.indexOf(taskId)
  if (index > -1) {
    selectedTasks.value.splice(index, 1)
  } else {
    selectedTasks.value.push(taskId)
  }
}

const selectAll = () => {
  selectedTasks.value = [...filteredTasks.value.map(task => task.id)]
}

const clearSelection = () => {
  selectedTasks.value = []
}

const handleLinkTasks = async () => {
  if (!props.milestone || selectedTasks.value.length === 0) return
  
  try {
    linking.value = true
    emit('tasks-linked', props.milestone.id, selectedTasks.value)
    selectedTasks.value = []
  } catch (error) {
    console.error('Error linking tasks:', error)
  } finally {
    linking.value = false
  }
}

// Watchers
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    selectedTasks.value = []
    searchQuery.value = ''
    statusFilter.value = ''
    priorityFilter.value = ''
  }
})
</script>

<style scoped>
.task-item {
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid transparent;
}

.task-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.task-item--selected {
  border-color: rgb(var(--v-theme-primary));
  background-color: rgba(var(--v-theme-primary), 0.05);
}

.task-list {
  max-height: 300px;
  overflow-y: auto;
}

.task-list::-webkit-scrollbar {
  width: 6px;
}

.task-list::-webkit-scrollbar-track {
  background: rgba(var(--v-theme-surface-variant), 0.5);
  border-radius: 3px;
}

.task-list::-webkit-scrollbar-thumb {
  background: rgba(var(--v-theme-on-surface), 0.3);
  border-radius: 3px;
}

.task-list::-webkit-scrollbar-thumb:hover {
  background: rgba(var(--v-theme-on-surface), 0.5);
}

@media (max-width: 600px) {
  :deep(.v-dialog .v-card) {
    margin: 12px;
  }
}
</style>