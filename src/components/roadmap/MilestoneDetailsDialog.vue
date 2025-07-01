<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    max-width="900"
    scrollable
  >
    <v-card v-if="milestone">
      <!-- Header -->
      <v-card-title class="d-flex align-center justify-space-between pa-4">
        <div class="d-flex align-center">
          <v-avatar
            :color="getMilestoneTypeColor(milestone.type)"
            size="40"
            class="mr-3"
          >
            <v-icon size="20" color="white">
              {{ getMilestoneTypeIcon(milestone.type) }}
            </v-icon>
          </v-avatar>
          
          <div>
            <h2 class="text-h6 font-weight-bold">{{ milestone.title }}</h2>
            <div class="d-flex align-center ga-2">
              <v-chip
                :color="getMilestoneTypeColor(milestone.type)"
                size="small"
                variant="outlined"
              >
                {{ milestone.type?.toUpperCase() || 'MILESTONE' }}
              </v-chip>
              
              <v-chip
                :color="getMilestoneStatus(milestone).color"
                size="small"
                variant="flat"
              >
                {{ getMilestoneStatus(milestone).label }}
              </v-chip>
            </div>
          </div>
        </div>
        
        <div class="d-flex align-center ga-2">
          <v-btn
            icon="mdi-pencil"
            variant="outlined"
            size="small"
            @click="editMilestone"
          />
          
          <v-btn
            icon="mdi-close"
            variant="text"
            @click="$emit('update:modelValue', false)"
          />
        </div>
      </v-card-title>
      
      <v-divider />
      
      <v-card-text class="pa-0">
        <v-row no-gutters>
          <!-- Left Column - Details -->
          <v-col cols="12" md="8">
            <div class="pa-4">
              <!-- Progress Overview -->
              <div class="mb-6">
                <div class="d-flex align-center justify-space-between mb-3">
                  <h3 class="text-h6">Progress Overview</h3>
                  <span class="text-h4 font-weight-bold" :class="getProgressColor(milestoneProgress)">
                    {{ milestoneProgress }}%
                  </span>
                </div>
                
                <v-progress-linear
                  :model-value="milestoneProgress"
                  :color="getProgressColor(milestoneProgress)"
                  height="12"
                  rounded
                  class="mb-3"
                />
                
                <div class="d-flex justify-space-between text-caption text-medium-emphasis">
                  <span>{{ completedTasks }} of {{ totalTasks }} tasks completed</span>
                  <span>{{ remainingDays }} days remaining</span>
                </div>
              </div>
              
              <!-- Description -->
              <div v-if="milestone.content" class="mb-6">
                <h3 class="text-h6 mb-3">Description</h3>
                <p class="text-body-1">{{ milestone.content }}</p>
              </div>
              
              <!-- Success Criteria -->
              <div v-if="milestone.successCriteria" class="mb-6">
                <h3 class="text-h6 mb-3">Success Criteria</h3>
                <p class="text-body-1">{{ milestone.successCriteria }}</p>
              </div>
              
              <!-- Linked Tasks -->
              <div class="mb-6">
                <div class="d-flex align-center justify-space-between mb-3">
                  <h3 class="text-h6">Linked Tasks ({{ linkedTasks.length }})</h3>
                  <v-btn
                    size="small"
                    color="primary"
                    variant="outlined"
                    prepend-icon="mdi-link"
                    @click="$emit('task-linked')"
                  >
                    Link Tasks
                  </v-btn>
                </div>
                
                <!-- Task List -->
                <div v-if="linkedTasks.length > 0" class="tasks-container">
                  <v-card
                    v-for="task in linkedTasks"
                    :key="task.id"
                    variant="outlined"
                    class="task-card mb-3"
                  >
                    <v-card-text class="pa-3">
                      <div class="d-flex align-center justify-space-between">
                        <div class="flex-grow-1">
                          <!-- Task Header -->
                          <div class="d-flex align-center mb-2">
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
                            
                            <v-chip
                              size="x-small"
                              variant="tonal"
                              color="grey"
                            >
                              #{{ task.id.split('-')[1] }}
                            </v-chip>
                          </div>
                          
                          <!-- Task Title -->
                          <h4 class="text-body-1 font-weight-medium mb-2">
                            {{ task.title }}
                          </h4>
                          
                          <!-- Task Meta -->
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
                        
                        <!-- Unlink Button -->
                        <v-btn
                          icon="mdi-link-off"
                          variant="text"
                          size="small"
                          color="error"
                          @click="unlinkTask(task.id)"
                        />
                      </div>
                    </v-card-text>
                  </v-card>
                </div>
                
                <!-- No Tasks State -->
                <div v-else class="text-center pa-6">
                  <v-icon size="48" color="medium-emphasis" class="mb-2">
                    mdi-link-off
                  </v-icon>
                  <p class="text-body-2 text-medium-emphasis mb-3">
                    No tasks linked to this milestone
                  </p>
                  <v-btn
                    color="primary"
                    variant="outlined"
                    prepend-icon="mdi-link"
                    @click="$emit('task-linked')"
                  >
                    Link Your First Task
                  </v-btn>
                </div>
              </div>
            </div>
          </v-col>
          
          <!-- Right Column - Metadata -->
          <v-col cols="12" md="4">
            <div class="pa-4 bg-surface-variant h-100">
              <!-- Timeline -->
              <div class="mb-6">
                <h4 class="text-subtitle-1 font-weight-bold mb-3">Timeline</h4>
                
                <div class="timeline-info">
                  <div class="d-flex align-center justify-space-between mb-2">
                    <span class="text-body-2 font-weight-medium">Start Date:</span>
                    <span class="text-body-2">{{ formatDate(milestone.start) }}</span>
                  </div>
                  
                  <div class="d-flex align-center justify-space-between mb-2">
                    <span class="text-body-2 font-weight-medium">End Date:</span>
                    <span class="text-body-2">{{ formatDate(milestone.end) }}</span>
                  </div>
                  
                  <div class="d-flex align-center justify-space-between mb-3">
                    <span class="text-body-2 font-weight-medium">Duration:</span>
                    <span class="text-body-2">{{ getMilestoneDuration(milestone) }} days</span>
                  </div>
                  
                  <!-- Timeline Bar -->
                  <div class="timeline-bar">
                    <div 
                      class="timeline-progress"
                      :style="{ 
                        width: `${milestoneProgress}%`,
                        backgroundColor: getProgressColorValue(milestoneProgress)
                      }"
                    />
                  </div>
                </div>
              </div>
              
              <!-- Details -->
              <div class="mb-6">
                <h4 class="text-subtitle-1 font-weight-bold mb-3">Details</h4>
                
                <div class="detail-list">
                  <div class="detail-item mb-3">
                    <span class="text-body-2 font-weight-medium">Priority:</span>
                    <v-chip
                      :color="getPriorityColor(milestone.priority)"
                      size="small"
                      variant="flat"
                      class="ml-2"
                    >
                      {{ milestone.priority?.toUpperCase() || 'MEDIUM' }}
                    </v-chip>
                  </div>
                  
                  <div class="detail-item mb-3">
                    <span class="text-body-2 font-weight-medium">Team:</span>
                    <span class="ml-2">{{ getTeamName(milestone.teamId) }}</span>
                  </div>
                  
                  <div v-if="milestone.budget" class="detail-item mb-3">
                    <span class="text-body-2 font-weight-medium">Budget:</span>
                    <span class="ml-2">${{ milestone.budget.toLocaleString() }}</span>
                  </div>
                  
                  <div v-if="milestone.estimatedHours" class="detail-item mb-3">
                    <span class="text-body-2 font-weight-medium">Est. Hours:</span>
                    <span class="ml-2">{{ milestone.estimatedHours }}h</span>
                  </div>
                </div>
              </div>
              
              <!-- Quick Stats -->
              <div class="mb-6">
                <h4 class="text-subtitle-1 font-weight-bold mb-3">Quick Stats</h4>
                
                <div class="stats-grid">
                  <div class="stat-item text-center pa-3 rounded border">
                    <div class="text-h5 font-weight-bold text-primary">{{ totalTasks }}</div>
                    <div class="text-caption text-medium-emphasis">Total Tasks</div>
                  </div>
                  
                  <div class="stat-item text-center pa-3 rounded border">
                    <div class="text-h5 font-weight-bold text-success">{{ completedTasks }}</div>
                    <div class="text-caption text-medium-emphasis">Completed</div>
                  </div>
                  
                  <div class="stat-item text-center pa-3 rounded border">
                    <div class="text-h5 font-weight-bold text-warning">{{ inProgressTasks }}</div>
                    <div class="text-caption text-medium-emphasis">In Progress</div>
                  </div>
                  
                  <div class="stat-item text-center pa-3 rounded border">
                    <div class="text-h5 font-weight-bold text-info">{{ remainingTasks }}</div>
                    <div class="text-caption text-medium-emphasis">Remaining</div>
                  </div>
                </div>
              </div>
            </div>
          </v-col>
        </v-row>
      </v-card-text>
      
      <v-divider />
      
      <!-- Actions -->
      <v-card-actions class="pa-4">
        <div class="d-flex align-center justify-space-between w-100">
          <div class="d-flex align-center ga-2">
            <v-btn
              prepend-icon="mdi-pencil"
              variant="outlined"
              @click="editMilestone"
            >
              Edit Milestone
            </v-btn>
            
            <v-btn
              prepend-icon="mdi-content-copy"
              variant="outlined"
              @click="duplicateMilestone"
            >
              Duplicate
            </v-btn>
          </div>
          
          <div class="d-flex align-center ga-2">
            <v-btn
              prepend-icon="mdi-delete"
              color="error"
              variant="outlined"
              @click="deleteMilestone"
            >
              Delete
            </v-btn>
            
            <v-btn @click="$emit('update:modelValue', false)">
              Close
            </v-btn>
          </div>
        </div>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed } from 'vue'
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
  linkedTasks: {
    type: Array,
    default: () => []
  }
})

// Emits
const emit = defineEmits([
  'update:modelValue',
  'milestone-updated',
  'milestone-deleted',
  'task-linked',
  'task-unlinked'
])

// Composables
const projectsStore = useProjectsStore()

// Computed
const totalTasks = computed(() => props.linkedTasks.length)

const completedTasks = computed(() => 
  props.linkedTasks.filter(task => task.columnId === 'done').length
)

const inProgressTasks = computed(() => 
  props.linkedTasks.filter(task => task.columnId === 'in-progress').length
)

const remainingTasks = computed(() => 
  props.linkedTasks.filter(task => 
    task.columnId !== 'done' && task.columnId !== 'cancelled'
  ).length
)

const milestoneProgress = computed(() => {
  if (totalTasks.value === 0) return 0
  return Math.round((completedTasks.value / totalTasks.value) * 100)
})

const remainingDays = computed(() => {
  if (!props.milestone?.end) return 0
  const endDate = new Date(props.milestone.end)
  const today = new Date()
  const diffTime = endDate.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return Math.max(0, diffDays)
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

const getMilestoneStatus = (milestone) => {
  const now = new Date()
  const start = new Date(milestone.start)
  const end = new Date(milestone.end)
  const progress = milestoneProgress.value
  
  if (progress === 100) {
    return { label: 'Completed', value: 'completed', color: 'success' }
  }
  
  if (end < now) {
    return { label: 'Overdue', value: 'overdue', color: 'error' }
  }
  
  if (start <= now && end >= now) {
    return { label: 'In Progress', value: 'in-progress', color: 'info' }
  }
  
  return { label: 'Not Started', value: 'not-started', color: 'grey' }
}

const getProgressColor = (progress) => {
  if (progress >= 100) return 'text-success'
  if (progress >= 75) return 'text-info'
  if (progress >= 50) return 'text-warning'
  if (progress >= 25) return 'text-orange'
  return 'text-error'
}

const getProgressColorValue = (progress) => {
  if (progress >= 100) return '#4CAF50'
  if (progress >= 75) return '#2196F3'
  if (progress >= 50) return '#FF9800'
  if (progress >= 25) return '#FF5722'
  return '#F44336'
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

const getTeamName = (teamId) => {
  const team = projectsStore.getTeamById(teamId)
  return team?.name || 'Unassigned'
}

const getMilestoneDuration = (milestone) => {
  const start = new Date(milestone.start)
  const end = new Date(milestone.end)
  const diffTime = Math.abs(end - start)
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

const editMilestone = () => {
  emit('milestone-updated', props.milestone)
}

const duplicateMilestone = () => {
  const newMilestone = {
    ...props.milestone,
    title: `${props.milestone.title} (Copy)`,
    start: new Date(new Date(props.milestone.start).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    end: new Date(new Date(props.milestone.end).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    taskIds: []
  }
  
  emit('milestone-updated', newMilestone)
}

const deleteMilestone = () => {
  if (confirm(`Are you sure you want to delete "${props.milestone.title}"? This action cannot be undone.`)) {
    emit('milestone-deleted', props.milestone.id)
  }
}

const unlinkTask = (taskId) => {
  if (confirm('Are you sure you want to unlink this task from the milestone?')) {
    emit('task-unlinked', props.milestone.id, taskId)
  }
}
</script>

<style scoped>
.tasks-container {
  max-height: 300px;
  overflow-y: auto;
}

.tasks-container::-webkit-scrollbar {
  width: 6px;
}

.tasks-container::-webkit-scrollbar-track {
  background: rgba(var(--v-theme-surface-variant), 0.5);
  border-radius: 3px;
}

.tasks-container::-webkit-scrollbar-thumb {
  background: rgba(var(--v-theme-on-surface), 0.3);
  border-radius: 3px;
}

.task-card {
  transition: all 0.2s ease;
}

.task-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.timeline-bar {
  position: relative;
  height: 8px;
  background: rgba(var(--v-theme-surface-variant), 0.5);
  border-radius: 4px;
  overflow: hidden;
}

.timeline-progress {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.detail-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.stat-item {
  background: rgba(var(--v-theme-surface), 0.7);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
}

@media (max-width: 960px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
  :deep(.v-dialog .v-card) {
    margin: 12px;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>