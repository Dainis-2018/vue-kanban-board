<template>
  <div class="roadmap-list">
    <v-row>
      <v-col
        v-for="item in items"
        :key="item.id"
        cols="12"
        md="6"
        lg="4"
      >
        <v-card
          elevation="2"
          class="milestone-card h-100"
          @click="$emit('view', item.id)"
        >
          <v-card-title class="d-flex align-center justify-space-between">
            <div class="d-flex align-center">
              <v-icon
                :color="getMilestoneTypeColor(item.type)"
                size="24"
                class="mr-2"
              >
                {{ getMilestoneTypeIcon(item.type) }}
              </v-icon>
              <span class="text-truncate">{{ item.title }}</span>
            </div>
            
            <v-menu>
              <template #activator="{ props }">
                <v-btn
                  v-bind="props"
                  icon="mdi-dots-vertical"
                  size="small"
                  variant="text"
                  @click.stop
                />
              </template>
              <v-list>
                <v-list-item @click="$emit('view', item.id)">
                  <template #prepend>
                    <v-icon>mdi-eye</v-icon>
                  </template>
                  <v-list-item-title>View Details</v-list-item-title>
                </v-list-item>
                <v-list-item @click="$emit('edit', item)">
                  <template #prepend>
                    <v-icon>mdi-pencil</v-icon>
                  </template>
                  <v-list-item-title>Edit</v-list-item-title>
                </v-list-item>
                <v-list-item @click="$emit('duplicate', item)">
                  <template #prepend>
                    <v-icon>mdi-content-copy</v-icon>
                  </template>
                  <v-list-item-title>Duplicate</v-list-item-title>
                </v-list-item>
                <v-list-item @click="$emit('link-tasks', item)">
                  <template #prepend>
                    <v-icon>mdi-link</v-icon>
                  </template>
                  <v-list-item-title>Link Tasks</v-list-item-title>
                </v-list-item>
                <v-divider />
                <v-list-item @click="$emit('delete', item.id)" class="text-error">
                  <template #prepend>
                    <v-icon>mdi-delete</v-icon>
                  </template>
                  <v-list-item-title>Delete</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </v-card-title>

          <v-card-text>
            <!-- Status and Type -->
            <div class="d-flex align-center mb-3">
              <v-chip
                :color="getMilestoneTypeColor(item.type)"
                size="small"
                variant="flat"
                class="mr-2"
              >
                {{ item.type }}
              </v-chip>
              <v-chip
                :color="getStatusColor(item.status)"
                size="small"
                variant="tonal"
              >
                {{ item.status }}
              </v-chip>
            </div>

            <!-- Description -->
            <p class="text-body-2 mb-3">
              {{ item.description || 'No description' }}
            </p>

            <!-- Date Range -->
            <div class="d-flex align-center mb-3">
              <v-icon size="16" class="mr-1">mdi-calendar</v-icon>
              <span class="text-caption">
                {{ formatDateRange(item.startDate || item.start, item.endDate || item.end) }}
              </span>
            </div>

            <!-- Duration -->
            <div class="d-flex align-center mb-3">
              <v-icon size="16" class="mr-1">mdi-clock-outline</v-icon>
              <span class="text-caption">
                {{ getMilestoneDuration(item) }} days
              </span>
            </div>

            <!-- Progress -->
            <div class="mb-3">
              <div class="d-flex justify-space-between align-center mb-1">
                <span class="text-caption">Progress</span>
                <span class="text-caption font-weight-bold">
                  {{ getMilestoneProgress(item.id) }}%
                </span>
              </div>
              <v-progress-linear
                :model-value="getMilestoneProgress(item.id)"
                :color="getProgressColor(getMilestoneProgress(item.id))"
                height="6"
                rounded
              />
            </div>

            <!-- Linked Tasks -->
            <div class="mb-3">
              <div class="d-flex align-center justify-space-between mb-2">
                <span class="text-caption">Linked Tasks</span>
                <v-chip size="x-small" variant="outlined">
                  {{ getLinkedTasksCount(item.id) }} tasks
                </v-chip>
              </div>
              
              <div v-if="getLinkedTasksCount(item.id) > 0" class="linked-tasks">
                <div class="d-flex flex-wrap gap-1">
                  <v-chip
                    v-for="task in getLinkedTasks(item.id).slice(0, 3)"
                    :key="task.id"
                    :color="getTaskStatusColor(task.columnId)"
                    size="x-small"
                    variant="outlined"
                  >
                    {{ task.title }}
                  </v-chip>
                  <v-chip
                    v-if="getLinkedTasksCount(item.id) > 3"
                    size="x-small"
                    variant="outlined"
                  >
                    +{{ getLinkedTasksCount(item.id) - 3 }} more
                  </v-chip>
                </div>
              </div>
              
              <div v-else class="text-caption text-medium-emphasis">
                No tasks linked
              </div>
            </div>

            <!-- Status Summary -->
            <div class="status-summary">
              <div class="d-flex align-center justify-space-between">
                <div class="d-flex align-center">
                  <v-icon
                    :color="getStatusIcon(item).color"
                    size="16"
                    class="mr-1"
                  >
                    {{ getStatusIcon(item).icon }}
                  </v-icon>
                  <span class="text-caption">{{ getStatusIcon(item).label }}</span>
                </div>
                
                <div class="d-flex align-center">
                  <v-icon size="14" class="mr-1">mdi-target</v-icon>
                  <span class="text-caption">
                    {{ formatDate(item.endDate || item.end) }}
                  </span>
                </div>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    
    <!-- Empty State -->
    <div v-if="items.length === 0" class="text-center py-12">
      <v-icon size="64" color="grey-lighten-2" class="mb-4">mdi-timeline-outline</v-icon>
      <h3 class="text-h6 mb-2">No roadmap items</h3>
      <p class="text-body-2 text-medium-emphasis">
        Create milestones and releases to see them here
      </p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useProjectsStore } from '@/stores/projects'

const props = defineProps({
  items: {
    type: Array,
    default: () => []
  },
  tasks: {
    type: Array,
    default: () => []
  }
})

defineEmits(['edit', 'view', 'delete', 'duplicate', 'link-tasks'])

const projectsStore = useProjectsStore()

// Helper methods
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

const getStatusColor = (status) => {
  const colors = {
    planned: 'grey',
    'in-progress': 'primary',
    completed: 'success',
    'on-hold': 'warning',
    overdue: 'error'
  }
  return colors[status] || 'grey'
}

const getMilestoneProgress = (milestoneId) => {
  const milestone = props.items.find(item => item.id === milestoneId)
  if (!milestone) return 0
  
  // If progress is explicitly set, use it
  if (milestone.progress !== undefined) return milestone.progress
  
  // Otherwise calculate from linked tasks
  if (!milestone.taskIds?.length) return 0
  
  const milestoneTasks = props.tasks.filter(task => 
    milestone.taskIds.includes(task.id)
  )
  
  if (milestoneTasks.length === 0) return 0
  
  const completedTasks = milestoneTasks.filter(task => task.columnId === 'done')
  return Math.round((completedTasks.length / milestoneTasks.length) * 100)
}

const getProgressColor = (progress) => {
  if (progress >= 100) return 'success'
  if (progress >= 75) return 'info'
  if (progress >= 50) return 'warning'
  if (progress >= 25) return 'orange'
  return 'error'
}

const getStatusIcon = (milestone) => {
  const now = new Date()
  
  // Handle both property formats
  const startDateStr = milestone.startDate || milestone.start
  const endDateStr = milestone.endDate || milestone.end
  
  if (!startDateStr || !endDateStr) {
    return { label: 'No Dates', icon: 'mdi-calendar-blank', color: 'grey' }
  }
  
  const start = new Date(startDateStr)
  const end = new Date(endDateStr)
  
  // Validate dates
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return { label: 'Invalid Dates', icon: 'mdi-calendar-alert', color: 'error' }
  }
  
  const progress = getMilestoneProgress(milestone.id)
  
  if (progress === 100) {
    return { label: 'Completed', icon: 'mdi-check-circle', color: 'success' }
  }
  
  if (end < now) {
    return { label: 'Overdue', icon: 'mdi-clock-alert', color: 'error' }
  }
  
  if (start <= now && end >= now) {
    return { label: 'In Progress', icon: 'mdi-play-circle', color: 'info' }
  }
  
  return { label: 'Not Started', icon: 'mdi-pause-circle', color: 'grey' }
}

const getLinkedTasksCount = (milestoneId) => {
  const milestone = props.items.find(item => item.id === milestoneId)
  return milestone?.taskIds?.length || 0
}

const getLinkedTasks = (milestoneId) => {
  const milestone = props.items.find(item => item.id === milestoneId)
  if (!milestone || !milestone.taskIds) return []
  
  return props.tasks.filter(task => milestone.taskIds.includes(task.id))
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

const getMilestoneDuration = (milestone) => {
  // Handle both startDate/endDate and start/end properties
  const startDateStr = milestone.startDate || milestone.start
  const endDateStr = milestone.endDate || milestone.end
  
  if (!startDateStr || !endDateStr) {
    console.warn('Missing start or end date for milestone:', milestone)
    return 0
  }
  
  const start = new Date(startDateStr)
  const end = new Date(endDateStr)
  
  // Validate dates
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    console.warn('Invalid dates for milestone:', milestone, { start: startDateStr, end: endDateStr })
    return 0
  }
  
  const diffTime = Math.abs(end - start)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  return diffDays
}

const formatDate = (dateString) => {
  if (!dateString) {
    return 'No date'
  }
  
  const date = new Date(dateString)
  
  // Validate date
  if (isNaN(date.getTime())) {
    console.warn('Invalid date string:', dateString)
    return 'Invalid date'
  }
  
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

const formatDateRange = (start, end) => {
  if (!start || !end) {
    console.warn('Missing start or end date:', { start, end })
    return 'No dates set'
  }
  
  const startDate = formatDate(start)
  const endDate = formatDate(end)
  
  // Check if formatting failed
  if (startDate === 'Invalid date' || endDate === 'Invalid date') {
    return 'Invalid dates'
  }
  
  return `${startDate} - ${endDate}`
}
</script>

<style scoped>
.milestone-card {
  cursor: pointer;
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
}

.milestone-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
}

.linked-tasks {
  max-height: 60px;
  overflow: hidden;
}

.status-summary {
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  padding-top: 8px;
  margin-top: 8px;
}

.text-truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>