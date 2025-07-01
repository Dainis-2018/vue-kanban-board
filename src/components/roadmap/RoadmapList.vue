<template>
  <div class="roadmap-list">
    <!-- List Header -->
    <v-card class="mb-4">
      <v-card-text class="pa-4">
        <v-row align="center">
          <v-col cols="12" md="6">
            <v-text-field
              v-model="searchQuery"
              placeholder="Search milestones..."
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
              v-model="typeFilter"
              :items="typeOptions"
              label="Type"
              variant="outlined"
              density="compact"
              hide-details
              clearable
            />
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Milestones List -->
    <div class="milestones-list">
      <v-expansion-panels
        v-model="expandedPanels"
        multiple
        variant="accordion"
      >
        <v-expansion-panel
          v-for="milestone in filteredMilestones"
          :key="milestone.id"
          :value="milestone.id"
          class="milestone-panel mb-3"
        >
          <!-- Panel Header -->
          <v-expansion-panel-title class="pa-4">
            <div class="d-flex align-center w-100">
              <!-- Milestone Icon and Type -->
              <div class="d-flex align-center mr-4">
                <v-avatar
                  size="32"
                  :color="getMilestoneTypeColor(milestone.type)"
                  class="mr-3"
                >
                  <v-icon size="16" color="white">
                    {{ getMilestoneTypeIcon(milestone.type) }}
                  </v-icon>
                </v-avatar>
                
                <div>
                  <h3 class="text-subtitle-1 font-weight-bold mb-0">
                    {{ milestone.title }}
                  </h3>
                  <p class="text-caption text-medium-emphasis mb-0">
                    {{ milestone.type?.toUpperCase() || 'MILESTONE' }}
                  </p>
                </div>
              </div>
              
              <v-spacer />
              
              <!-- Progress and Status -->
              <div class="d-flex align-center mr-4">
                <div class="text-right mr-3">
                  <div class="text-body-2 font-weight-medium">
                    {{ getMilestoneProgress(milestone.id) }}% Complete
                  </div>
                  <div class="text-caption text-medium-emphasis">
                    {{ getLinkedTasksCount(milestone.id) }} tasks
                  </div>
                </div>
                
                <v-progress-circular
                  :model-value="getMilestoneProgress(milestone.id)"
                  :color="getProgressColor(getMilestoneProgress(milestone.id))"
                  size="32"
                  width="3"
                >
                  <span class="text-caption">
                    {{ getMilestoneProgress(milestone.id) }}%
                  </span>
                </v-progress-circular>
              </div>
              
              <!-- Dates and Status -->
              <div class="d-flex align-center mr-4">
                <div class="text-right">
                  <v-chip
                    :color="getMilestoneStatus(milestone).color"
                    size="small"
                    variant="flat"
                    class="mb-1"
                  >
                    {{ getMilestoneStatus(milestone).label }}
                  </v-chip>
                  <div class="text-caption text-medium-emphasis">
                    {{ formatDateRange(milestone.start, milestone.end) }}
                  </div>
                </div>
              </div>
              
              <!-- Actions -->
              <div class="d-flex align-center" @click.stop>
                <v-menu offset-y>
                  <template #activator="{ props }">
                    <v-btn
                      v-bind="props"
                      icon="mdi-dots-vertical"
                      variant="text"
                      size="small"
                    />
                  </template>
                  
                  <v-list density="compact">
                    <v-list-item
                      prepend-icon="mdi-pencil"
                      title="Edit"
                      @click="$emit('edit-item', milestone)"
                    />
                    <v-list-item
                      prepend-icon="mdi-link"
                      title="Link Tasks"
                      @click="showTaskLinkDialog(milestone)"
                    />
                    <v-list-item
                      prepend-icon="mdi-content-copy"
                      title="Duplicate"
                      @click="duplicateMilestone(milestone)"
                    />
                    <v-divider />
                    <v-list-item
                      prepend-icon="mdi-delete"
                      title="Delete"
                      @click="$emit('delete-item', milestone.id)"
                    />
                  </v-list>
                </v-menu>
              </div>
            </div>
          </v-expansion-panel-title>
          
          <!-- Panel Content -->
          <v-expansion-panel-text class="pa-0">
            <v-divider />
            
            <div class="pa-4">
              <!-- Milestone Description -->
              <div v-if="milestone.content" class="mb-4">
                <h4 class="text-subtitle-2 mb-2">Description</h4>
                <p class="text-body-2">{{ milestone.content }}</p>
              </div>
              
              <!-- Milestone Details -->
              <div class="mb-4">
                <h4 class="text-subtitle-2 mb-2">Details</h4>
                <v-row>
                  <v-col cols="12" md="3">
                    <div class="detail-item">
                      <span class="text-caption font-weight-bold">Priority:</span>
                      <v-chip
                        :color="getPriorityColor(milestone.priority)"
                        size="x-small"
                        variant="flat"
                        class="ml-2"
                      >
                        {{ milestone.priority?.toUpperCase() || 'MEDIUM' }}
                      </v-chip>
                    </div>
                  </v-col>
                  
                  <v-col cols="12" md="3">
                    <div class="detail-item">
                      <span class="text-caption font-weight-bold">Team:</span>
                      <span class="ml-2">{{ getTeamName(milestone.teamId) }}</span>
                    </div>
                  </v-col>
                  
                  <v-col cols="12" md="3">
                    <div class="detail-item">
                      <span class="text-caption font-weight-bold">Duration:</span>
                      <span class="ml-2">{{ getMilestoneDuration(milestone) }} days</span>
                    </div>
                  </v-col>
                  
                  <v-col cols="12" md="3">
                    <div class="detail-item">
                      <span class="text-caption font-weight-bold">Budget:</span>
                      <span class="ml-2">
                        {{ milestone.budget ? `${milestone.budget.toLocaleString()}` : 'Not set' }}
                      </span>
                    </div>
                  </v-col>
                </v-row>
              </div>
              
              <!-- Success Criteria -->
              <div v-if="milestone.successCriteria" class="mb-4">
                <h4 class="text-subtitle-2 mb-2">Success Criteria</h4>
                <p class="text-body-2">{{ milestone.successCriteria }}</p>
              </div>
              
              <!-- Linked Tasks -->
              <div class="mb-4">
                <div class="d-flex align-center justify-space-between mb-2">
                  <h4 class="text-subtitle-2">Linked Tasks ({{ getLinkedTasks(milestone.id).length }})</h4>
                  <v-btn
                    size="small"
                    variant="outlined"
                    prepend-icon="mdi-plus"
                    @click="$emit('add-task', milestone.id)"
                  >
                    Link Task
                  </v-btn>
                </div>
                
                <div v-if="getLinkedTasks(milestone.id).length > 0" class="tasks-grid">
                  <v-card
                    v-for="task in getLinkedTasks(milestone.id)"
                    :key="task.id"
                    variant="outlined"
                    class="task-card pa-3"
                  >
                    <div class="d-flex align-center justify-space-between">
                      <div class="flex-grow-1">
                        <div class="d-flex align-center mb-1">
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
                          >
                            {{ task.priority?.toUpperCase() }}
                          </v-chip>
                        </div>
                        
                        <h5 class="text-body-2 font-weight-medium mb-1">
                          {{ task.title }}
                        </h5>
                        
                        <div class="d-flex align-center">
                          <v-avatar-group v-if="task.assigneeIds?.length" max="3" size="20">
                            <v-avatar
                              v-for="userId in task.assigneeIds"
                              :key="userId"
                              size="20"
                            >
                              <v-img :src="getUserById(userId)?.avatar" />
                            </v-avatar>
                          </v-avatar-group>
                          
                          <span v-if="task.dueDate" class="text-caption text-medium-emphasis ml-2">
                            Due {{ formatDate(task.dueDate) }}
                          </span>
                        </div>
                      </div>
                      
                      <v-btn
                        icon="mdi-close"
                        variant="text"
                        size="x-small"
                        @click="$emit('remove-task', milestone.id, task.id)"
                      />
                    </div>
                  </v-card>
                </div>
                
                <div v-else class="text-center pa-4">
                  <v-icon size="48" color="medium-emphasis" class="mb-2">
                    mdi-link-off
                  </v-icon>
                  <p class="text-body-2 text-medium-emphasis">
                    No tasks linked to this milestone
                  </p>
                </div>
              </div>
              
              <!-- Timeline Visualization -->
              <div class="mb-4">
                <h4 class="text-subtitle-2 mb-2">Timeline</h4>
                <div class="timeline-bar">
                  <div 
                    class="timeline-progress"
                    :style="{ 
                      width: `${getMilestoneProgress(milestone.id)}%`,
                      backgroundColor: getProgressColor(getMilestoneProgress(milestone.id))
                    }"
                  />
                  <div class="timeline-markers">
                    <div class="timeline-start">
                      <span class="text-caption">{{ formatDate(milestone.start) }}</span>
                    </div>
                    <div class="timeline-end">
                      <span class="text-caption">{{ formatDate(milestone.end) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </div>

    <!-- Empty State -->
    <v-card v-if="filteredMilestones.length === 0" class="text-center pa-8">
      <v-icon size="64" color="medium-emphasis" class="mb-4">
        mdi-clipboard-list-outline
      </v-icon>
      <h3 class="text-h6 mb-2">No Milestones Found</h3>
      <p class="text-body-2 text-medium-emphasis">
        {{ searchQuery || statusFilter || typeFilter ? 'Try adjusting your filters.' : 'Create your first milestone to get started.' }}
      </p>
    </v-card>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useProjectsStore } from '@/stores/projects'

// Props
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

// Emits
const emit = defineEmits(['edit-item', 'delete-item', 'add-task', 'remove-task'])

// Composables
const projectsStore = useProjectsStore()

// Local state
const searchQuery = ref('')
const statusFilter = ref('')
const typeFilter = ref('')
const expandedPanels = ref([])

// Filter options
const statusOptions = [
  { title: 'Not Started', value: 'not-started' },
  { title: 'In Progress', value: 'in-progress' },
  { title: 'Completed', value: 'completed' },
  { title: 'Overdue', value: 'overdue' }
]

const typeOptions = [
  { title: 'Milestone', value: 'milestone' },
  { title: 'Release', value: 'release' },
  { title: 'Phase', value: 'phase' },
  { title: 'Deadline', value: 'deadline' },
  { title: 'Review', value: 'review' }
]

// Computed
const filteredMilestones = computed(() => {
  let filtered = props.items

  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(milestone =>
      milestone.title.toLowerCase().includes(query) ||
      milestone.content?.toLowerCase().includes(query)
    )
  }

  // Status filter
  if (statusFilter.value) {
    filtered = filtered.filter(milestone => {
      const status = getMilestoneStatus(milestone).value
      return status === statusFilter.value
    })
  }

  // Type filter
  if (typeFilter.value) {
    filtered = filtered.filter(milestone =>
      milestone.type === typeFilter.value
    )
  }

  return filtered.sort((a, b) => new Date(a.start) - new Date(b.start))
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

const getMilestoneProgress = (milestoneId) => {
  const milestone = props.items.find(item => item.id === milestoneId)
  if (!milestone || !milestone.taskIds?.length) return 0
  
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

const getMilestoneStatus = (milestone) => {
  const now = new Date()
  const start = new Date(milestone.start)
  const end = new Date(milestone.end)
  const progress = getMilestoneProgress(milestone.id)
  
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

const getTeamName = (teamId) => {
  const team = projectsStore.getTeamById(teamId)
  return team?.name || 'Unassigned'
}

const getUserById = (userId) => {
  return projectsStore.getUserById(userId)
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

const formatDateRange = (start, end) => {
  const startDate = formatDate(start)
  const endDate = formatDate(end)
  return `${startDate} - ${endDate}`
}

const duplicateMilestone = (milestone) => {
  const newMilestone = {
    ...milestone,
    title: `${milestone.title} (Copy)`,
    start: new Date(new Date(milestone.start).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    end: new Date(new Date(milestone.end).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    taskIds: []
  }
  
  emit('edit-item', newMilestone)
}

const showTaskLinkDialog = (milestone) => {
  emit('add-task', milestone.id)
}
</script>

<style scoped>
.roadmap-list {
  height: 100%;
  overflow-y: auto;
}

.milestone-panel {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  border-radius: 12px;
  overflow: hidden;
}

.milestone-panel:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.detail-item {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.tasks-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
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
  height: 24px;
  background: rgba(var(--v-theme-surface-variant), 0.5);
  border-radius: 12px;
  overflow: hidden;
}

.timeline-progress {
  height: 100%;
  border-radius: 12px;
  transition: width 0.3s ease;
}

.timeline-markers {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 8px;
  pointer-events: none;
}

.timeline-start,
.timeline-end {
  background: rgba(var(--v-theme-surface), 0.9);
  padding: 2px 6px;
  border-radius: 4px;
  backdrop-filter: blur(4px);
}

:deep(.v-expansion-panel-title) {
  min-height: 64px;
}

:deep(.v-expansion-panel-text__wrapper) {
  padding: 0;
}

@media (max-width: 960px) {
  .tasks-grid {
    grid-template-columns: 1fr;
  }
  
  .timeline-markers {
    flex-direction: column;
    justify-content: center;
    gap: 4px;
  }
}
</style>