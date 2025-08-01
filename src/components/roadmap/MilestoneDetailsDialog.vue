<!-- src/components/roadmap/MilestoneDetailsDialog.vue -->
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
                  <v-chip
                    :color="getProgressColor(milestoneProgress)"
                    size="small"
                    variant="flat"
                  >
                    {{ milestoneProgress }}% Complete
                  </v-chip>
                </div>
                
                <v-progress-linear
                  :model-value="milestoneProgress"
                  :color="getProgressColor(milestoneProgress)"
                  height="8"
                  rounded
                  class="mb-3"
                />
                
                <div class="stats-grid">
                  <v-card class="stat-item pa-3" variant="outlined">
                    <div class="d-flex align-center justify-space-between">
                      <div>
                        <div class="text-h6 font-weight-bold">{{ totalTasks }}</div>
                        <div class="text-caption text-medium-emphasis">Total Tasks</div>
                      </div>
                      <v-icon color="primary">mdi-format-list-checks</v-icon>
                    </div>
                  </v-card>
                  
                  <v-card class="stat-item pa-3" variant="outlined">
                    <div class="d-flex align-center justify-space-between">
                      <div>
                        <div class="text-h6 font-weight-bold text-success">{{ completedTasks }}</div>
                        <div class="text-caption text-medium-emphasis">Completed</div>
                      </div>
                      <v-icon color="success">mdi-check-circle</v-icon>
                    </div>
                  </v-card>
                  
                  <v-card class="stat-item pa-3" variant="outlined">
                    <div class="d-flex align-center justify-space-between">
                      <div>
                        <div class="text-h6 font-weight-bold text-warning">{{ inProgressTasks }}</div>
                        <div class="text-caption text-medium-emphasis">In Progress</div>
                      </div>
                      <v-icon color="warning">mdi-clock</v-icon>
                    </div>
                  </v-card>
                  
                  <v-card class="stat-item pa-3" variant="outlined">
                    <div class="d-flex align-center justify-space-between">
                      <div>
                        <div class="text-h6 font-weight-bold">{{ remainingTasks }}</div>
                        <div class="text-caption text-medium-emphasis">Remaining</div>
                      </div>
                      <v-icon color="grey">mdi-minus-circle</v-icon>
                    </div>
                  </v-card>
                </div>
              </div>

              <!-- Milestone Details -->
              <div class="mb-6">
                <h3 class="text-h6 mb-3">Details</h3>
                
                <div class="detail-item mb-3">
                  <span class="text-body-2 text-medium-emphasis">Duration</span>
                  <span class="text-body-1 font-weight-medium">
                    {{ getMilestoneDuration(milestone) }} days
                  </span>
                </div>
                
                <div class="detail-item mb-3">
                  <span class="text-body-2 text-medium-emphasis">Start Date</span>
                  <span class="text-body-1 font-weight-medium">
                    {{ formatDate(milestone.start || milestone.startDate) }}
                  </span>
                </div>
                
                <div class="detail-item mb-3">
                  <span class="text-body-2 text-medium-emphasis">End Date</span>
                  <span class="text-body-1 font-weight-medium">
                    {{ formatDate(milestone.end || milestone.endDate) }}
                  </span>
                </div>
                
                <div v-if="milestone.description" class="detail-item mb-3">
                  <span class="text-body-2 text-medium-emphasis">Description</span>
                  <span class="text-body-1">{{ milestone.description }}</span>
                </div>
              </div>

              <!-- Linked Tasks -->
              <div class="mb-4">
                <div class="d-flex align-center justify-space-between mb-3">
                  <h3 class="text-h6">Linked Tasks ({{ linkedTasks.length }})</h3>
                  <v-btn
                    size="small"
                    variant="outlined"
                    prepend-icon="mdi-link"
                    @click="$emit('link-tasks', milestone)"
                  >
                    Link Tasks
                  </v-btn>
                </div>
                
                <div v-if="linkedTasks.length > 0" class="tasks-container">
                  <v-card
                    v-for="task in linkedTasks"
                    :key="task.id"
                    class="task-card mb-2"
                    variant="outlined"
                  >
                    <v-card-text class="pa-3">
                      <div class="d-flex align-center justify-space-between mb-2">
                        <div class="d-flex align-center">
                          <v-chip
                            :color="getPriorityColor(task.priority)"
                            size="x-small"
                            variant="flat"
                            class="mr-2"
                          >
                            {{ task.priority }}
                          </v-chip>
                          
                          <span class="text-subtitle-2 font-weight-medium">
                            {{ task.title }}
                          </span>
                        </div>
                        
                        <div class="d-flex align-center ga-1">
                          <v-chip
                            :color="getTaskStatusColor(task.columnId)"
                            size="x-small"
                            variant="tonal"
                          >
                            {{ getTaskStatusLabel(task.columnId) }}
                          </v-chip>
                          
                          <v-btn
                            icon="mdi-close"
                            size="x-small"
                            variant="text"
                            @click="unlinkTask(task.id)"
                          />
                        </div>
                      </div>
                      
                      <div class="d-flex align-center justify-space-between">
                        <div class="d-flex align-center">
                          <!-- Assignees -->
                          <div 
                            v-if="task.assigneeIds && task.assigneeIds.length > 0" 
                            class="d-flex align-center mr-3"
                          >
                            <v-avatar
                              v-for="userId in task.assigneeIds.slice(0, 3)"
                              :key="userId"
                              size="24"
                              class="assignee-avatar"
                            >
                              <v-img :src="getUserById(userId)?.avatar" :alt="getUserById(userId)?.name" />
                              <v-tooltip activator="parent" location="top">{{ getUserById(userId)?.name }}</v-tooltip>
                            </v-avatar>
                            <v-avatar v-if="task.assigneeIds.length > 3" size="24" color="grey-lighten-1" class="assignee-avatar">
                              <span class="text-caption text-white">+{{ task.assigneeIds.length - 3 }}</span>
                            </v-avatar>
                          </div>
                          
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
                    </v-card-text>
                  </v-card>
                </div>
                
                <div v-else class="text-center py-8">
                  <v-icon size="48" color="grey-lighten-1" class="mb-2">mdi-link-off</v-icon>
                  <p class="text-body-2 text-medium-emphasis">No tasks linked to this milestone</p>
                  <v-btn
                    size="small"
                    variant="text"
                    prepend-icon="mdi-link"
                    @click="$emit('link-tasks', milestone)"
                  >
                    Link Tasks
                  </v-btn>
                </div>
              </div>
            </div>
          </v-col>
          
          <!-- Right Column - Timeline -->
          <v-col cols="12" md="4">
            <v-card class="h-100" variant="flat">
              <v-card-text class="pa-4">
                <h3 class="text-h6 mb-3">Timeline</h3>
                
                <div class="timeline-bar mb-2">
                  <div 
                    class="timeline-progress bg-primary"
                    :style="{ width: `${milestoneProgress}%` }"
                  />
                </div>
                
                <div class="d-flex justify-space-between text-caption text-medium-emphasis mb-4">
                  <span>{{ formatDate(milestone.start || milestone.startDate) }}</span>
                  <span>{{ formatDate(milestone.end || milestone.endDate) }}</span>
                </div>
                
                <!-- Team Assignment -->
                <div v-if="milestone.teamId" class="mb-4">
                  <h4 class="text-subtitle-2 mb-2">Assigned Team</h4>
                  <v-chip size="small" variant="outlined">
                    {{ getTeamName(milestone.teamId) }}
                  </v-chip>
                </div>
                
                <!-- Dependencies -->
                <div v-if="milestone.dependencies?.length" class="mb-4">
                  <h4 class="text-subtitle-2 mb-2">Dependencies</h4>
                  <v-chip
                    v-for="dep in milestone.dependencies"
                    :key="dep"
                    size="small"
                    variant="outlined"
                    class="mr-1 mb-1"
                  >
                    {{ dep }}
                  </v-chip>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-card-text>
      
      <v-divider />
      
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
  'milestone-edit',
  'milestone-updated',
  'milestone-deleted',
  'task-linked',
  'task-unlinked',
  'link-tasks'
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

// Helper methods
const getMilestoneTypeColor = (type) => {
  const colors = {
    milestone: 'primary',
    release: 'success',
    phase: 'info',
    deadline: 'warning'
  }
  return colors[type] || 'primary'
}

const getMilestoneTypeIcon = (type) => {
  const icons = {
    milestone: 'mdi-flag',
    release: 'mdi-rocket-launch',
    phase: 'mdi-timeline',
    deadline: 'mdi-clock-alert'
  }
  return icons[type] || 'mdi-flag'
}

const getMilestoneStatus = (milestone) => {
  if (!milestone) return { label: 'Unknown', color: 'grey' }
  
  const status = milestone.status || 'planned'
  const statusMap = {
    planned: { label: 'Planned', color: 'grey' },
    'in-progress': { label: 'In Progress', color: 'primary' },
    completed: { label: 'Completed', color: 'success' },
    'on-hold': { label: 'On Hold', color: 'warning' },
    overdue: { label: 'Overdue', color: 'error' }
  }
  
  return statusMap[status] || { label: status, color: 'grey' }
}

const getProgressColor = (progress) => {
  if (progress >= 100) return 'success'
  if (progress >= 75) return 'primary'
  if (progress >= 50) return 'info'
  if (progress >= 25) return 'warning'
  return 'error'
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
  const start = new Date(milestone.start || milestone.startDate)
  const end = new Date(milestone.end || milestone.endDate)
  const diffTime = Math.abs(end - start)
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

const formatDate = (dateString) => {
  if (!dateString) return 'Not set'
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

const editMilestone = () => {
  console.log('Edit milestone clicked:', props.milestone)
  // Emit milestone-edit event to trigger the edit form in parent
  emit('milestone-edit', props.milestone)
  // Close the details dialog
  emit('update:modelValue', false)
}

const duplicateMilestone = () => {
  const newMilestone = {
    ...props.milestone,
    title: `${props.milestone.title} (Copy)`,
    start: new Date(new Date(props.milestone.start || props.milestone.startDate).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date(new Date(props.milestone.end || props.milestone.endDate).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    startDate: new Date(new Date(props.milestone.start || props.milestone.startDate).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date(new Date(props.milestone.end || props.milestone.endDate).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'planned',
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
.assignee-avatar {
  margin-left: -8px;
  border: 2px solid white;
}

.assignee-avatar:first-child {
  margin-left: 0;
}

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