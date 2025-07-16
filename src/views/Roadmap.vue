<template>
  <div class="roadmap-view">
    <!-- Header Controls -->
    <div class="roadmap-header mb-6">
      <v-row align="center">
        <v-col cols="12" md="6">
          <div class="d-flex align-center">
            <v-avatar
              v-if="currentProject"
              :color="currentProject.color"
              size="40"
              class="mr-3"
            >
              <span class="text-white text-h6">
                {{ currentProject.name.charAt(0) }}
              </span>
            </v-avatar>
            
            <div>
              <h1 class="text-h5 font-weight-bold">
                {{ currentProject?.name || 'Project' }} Roadmap
              </h1>
              <p class="text-body-2 text-medium-emphasis mb-0">
                {{ activeMilestones }} active • {{ completedMilestones }} completed • {{ projectProgress }}% overall progress
              </p>
            </div>
          </div>
        </v-col>
        
        <v-col cols="12" md="6" class="text-md-right">
          <div class="d-flex align-center justify-end flex-wrap ga-2">
            <!-- View Mode Toggle -->
            <v-btn-toggle
              v-model="viewMode"
              variant="outlined"
              size="small"
              mandatory
            >
              <v-btn value="timeline" icon="mdi-timeline" />
              <v-btn value="list" icon="mdi-format-list-bulleted" />
            </v-btn-toggle>
            
            <!-- Time Range Selector -->
            <v-menu v-if="viewMode === 'timeline'">
              <template #activator="{ props }">
                <v-btn
                  v-bind="props"
                  variant="outlined"
                  size="small"
                  append-icon="mdi-chevron-down"
                >
                  {{ timeRangeLabel }}
                </v-btn>
              </template>
              <v-list>
                <v-list-item
                  v-for="range in timeRanges"
                  :key="range.value"
                  @click="setTimeRange(range.value)"
                >
                  <v-list-item-title>{{ range.label }}</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
            
            <!-- Add Milestone Button -->
            <v-btn
              color="primary"
              size="small"
              prepend-icon="mdi-plus"
              @click="showCreateDialog = true"
            >
              Add Milestone
            </v-btn>
            
            <!-- Settings Menu -->
            <v-menu offset-y>
              <template #activator="{ props }">
                <v-btn
                  v-bind="props"
                  icon="mdi-cog"
                  variant="text"
                  size="small"
                />
              </template>
              
              <v-card min-width="250">
                <v-card-title>Roadmap Settings</v-card-title>
                <v-card-text>
                  <v-switch
                    v-model="showLinkedTasks"
                    label="Show linked tasks"
                    density="compact"
                  />
                  <v-switch
                    v-model="showDependencies"
                    label="Show dependencies"
                    density="compact"
                  />
                  <v-select
                    v-model="groupBy"
                    label="Group by"
                    :items="[
                      { title: 'None', value: 'none' },
                      { title: 'Type', value: 'type' },
                      { title: 'Team', value: 'team' }
                    ]"
                    density="compact"
                  />
                </v-card-text>
              </v-card>
            </v-menu>
          </div>
        </v-col>
      </v-row>
    </div>

    <!-- Timeline Container -->
    <div v-if="viewMode === 'timeline'" class="timeline-container">
      <v-card class="timeline-card">
        <v-card-text class="pa-0">
          <RoadmapTimeline
            ref="timelineRef"
            :items="timelineData"
            :groups="timelineGroups"
            :options="timelineOptions"
            :view-mode="viewMode"
            @item-moved="handleItemMoved"
            @item-updated="handleItemUpdated"
            @item-selected="handleItemSelected"
            @item-double-click="handleItemDoubleClick"
            @group-selected="handleGroupSelected"
          />
        </v-card-text>
      </v-card>
    </div>

    <!-- List View -->
    <div v-else-if="viewMode === 'list'" class="list-container">
      <RoadmapList
        :items="roadmapItems"
        :tasks="projectTasks"
        @edit="editRoadmapItem"
        @delete="deleteRoadmapItem"
        @duplicate="duplicateRoadmapItem"
        @link-tasks="openTaskLinkDialog"
      />
    </div>

    <!-- Empty State -->
    <div v-if="roadmapItems.length === 0" class="empty-state text-center py-12">
      <v-icon size="80" color="grey-lighten-1" class="mb-4">mdi-map-outline</v-icon>
      <h2 class="text-h5 mb-2">No roadmap items yet</h2>
      <p class="text-body-1 text-medium-emphasis mb-4">
        Create milestones and releases to visualize your project timeline
      </p>
      <v-btn
        color="primary"
        prepend-icon="mdi-plus"
        @click="showCreateDialog = true"
      >
        Create First Milestone
      </v-btn>
    </div>

    <!-- Create/Edit Milestone Dialog -->
    <v-dialog
      v-model="showCreateDialog"
      max-width="600"
      scrollable
    >
      <v-card>
        <v-card-title>
          {{ editingMilestone ? 'Edit Milestone' : 'Create New Milestone' }}
        </v-card-title>

        <v-divider />

        <v-card-text class="pa-4">
          <v-form ref="milestoneForm" v-model="milestoneFormValid">
            <v-text-field
              v-model="milestoneForm.title"
              label="Title"
              :rules="[v => !!v || 'Title is required']"
              required
            />
            
            <v-textarea
              v-model="milestoneForm.description"
              label="Description"
              rows="3"
            />

            <v-row>
              <v-col cols="6">
                <v-select
                  v-model="milestoneForm.type"
                  label="Type"
                  :items="[
                    { title: 'Milestone', value: 'milestone' },
                    { title: 'Release', value: 'release' },
                    { title: 'Phase', value: 'phase' },
                    { title: 'Deadline', value: 'deadline' }
                  ]"
                />
              </v-col>
              
              <v-col cols="6">
                <v-select
                  v-model="milestoneForm.status"
                  label="Status"
                  :items="[
                    { title: 'Planned', value: 'planned' },
                    { title: 'In Progress', value: 'in-progress' },
                    { title: 'Completed', value: 'completed' },
                    { title: 'On Hold', value: 'on-hold' }
                  ]"
                />
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="6">
                <v-text-field
                  v-model="milestoneForm.startDate"
                  label="Start Date"
                  type="date"
                  :rules="[v => !!v || 'Start date is required']"
                  required
                />
              </v-col>
              
              <v-col cols="6">
                <v-text-field
                  v-model="milestoneForm.endDate"
                  label="End Date"
                  type="date"
                  :rules="[
                    v => !!v || 'End date is required',
                    v => !milestoneForm.startDate || new Date(v) > new Date(milestoneForm.startDate) || 'End date must be after start date'
                  ]"
                  required
                />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-divider />

        <v-card-actions>
          <v-spacer />
          <v-btn @click="showCreateDialog = false">Cancel</v-btn>
          <v-btn
            color="primary"
            :loading="saving"
            @click="saveMilestone"
          >
            {{ editingMilestone ? 'Update' : 'Create' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Milestone Details Dialog -->
    <v-dialog
      v-model="showDetailsDialog"
      max-width="800"
      scrollable
    >
      <v-card v-if="selectedMilestone">
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2">{{ getMilestoneTypeIcon(selectedMilestone.type) }}</v-icon>
          {{ selectedMilestone.title }}
          <v-spacer />
          <v-btn
            icon="mdi-close"
            variant="text"
            @click="showDetailsDialog = false"
          />
        </v-card-title>

        <v-divider />

        <v-card-text>
          <div class="mb-4">
            <h3 class="text-h6 mb-2">Details</h3>
            <p>{{ selectedMilestone.description || 'No description' }}</p>
            
            <div class="d-flex align-center mb-2">
              <v-chip :color="getMilestoneTypeColor(selectedMilestone.type)" size="small" class="mr-2">
                {{ selectedMilestone.type }}
              </v-chip>
              <v-chip :color="getStatusColor(selectedMilestone.status)" size="small">
                {{ selectedMilestone.status }}
              </v-chip>
            </div>
            
            <p class="text-body-2">
              <v-icon size="16" class="mr-1">mdi-calendar</v-icon>
              {{ formatDateRange(selectedMilestone.startDate, selectedMilestone.endDate) }}
            </p>
          </div>

          <div v-if="getLinkedTasks(selectedMilestone.id).length > 0">
            <h3 class="text-h6 mb-2">Linked Tasks ({{ getLinkedTasks(selectedMilestone.id).length }})</h3>
            <v-list density="compact">
              <v-list-item
                v-for="task in getLinkedTasks(selectedMilestone.id)"
                :key="task.id"
                :to="`/kanban/${task.projectId}?task=${task.id}`"
              >
                <template #prepend>
                  <v-chip size="x-small" :color="getPriorityColor(task.priority)">
                    {{ task.priority }}
                  </v-chip>
                </template>
                
                <v-list-item-title>{{ task.title }}</v-list-item-title>
                
                <template #append>
                  <v-chip size="x-small" :color="getTaskStatusColor(task.columnId)">
                    {{ getTaskStatusLabel(task.columnId) }}
                  </v-chip>
                </template>
              </v-list-item>
            </v-list>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProjectsStore } from '@/stores/projects'
import { useTasksStore } from '@/stores/tasks'
import { useUIStore } from '@/stores/ui'
import RoadmapTimeline from '@/components/roadmap/RoadmapTimeline.vue'
import RoadmapList from '@/components/roadmap/RoadmapList.vue'

// Composables
const route = useRoute()
const router = useRouter()
const projectsStore = useProjectsStore()
const tasksStore = useTasksStore()
const uiStore = useUIStore()

// Refs
const timelineRef = ref(null)
//const milestoneForm = ref(null)

// Local state
const loading = ref(false)
const viewMode = ref('timeline')
const timeRange = ref('6months')
const showLinkedTasks = ref(true)
const showDependencies = ref(false)
const groupBy = ref('none')
const showCreateDialog = ref(false)
const showDetailsDialog = ref(false)
const showTaskLinkDialog = ref(false)
const editingMilestone = ref(null)
const selectedMilestone = ref(null)
const milestoneFormValid = ref(false)
const saving = ref(false)

// Form data
const milestoneForm = ref({
  title: '',
  description: '',
  type: 'milestone',
  status: 'planned',
  startDate: '',
  endDate: '',
  taskIds: []
})

// Store getters
const currentProject = computed(() => projectsStore.currentProject)
const currentProjectId = computed(() => {
  return route.params.projectId || projectsStore.currentProjectId
})

// Get roadmap items for current project
const roadmapItems = computed(() => {
  if (!currentProjectId.value) return []
  console.log('Getting roadmap items for project:', currentProjectId.value)
  const items = tasksStore.getRoadmapByProject(currentProjectId.value)
  console.log('Found roadmap items:', items)
  return items
})

const projectTasks = computed(() => {
  if (!currentProjectId.value) return []
  return tasksStore.getTasksByProject(currentProjectId.value)
})

// Computed
const linkedTasks = computed(() => {
  const linkedTaskIds = roadmapItems.value.flatMap(item => item.taskIds || [])
  return projectTasks.value.filter(task => linkedTaskIds.includes(task.id))
})

const availableTasks = computed(() => {
  const linkedTaskIds = roadmapItems.value.flatMap(item => item.taskIds || [])
  return projectTasks.value.filter(task => !linkedTaskIds.includes(task.id))
})

const completedMilestones = computed(() => 
  roadmapItems.value.filter(item => {
    const endDate = new Date(item.endDate || item.end)
    const now = new Date()
    return endDate < now && getMilestoneProgress(item.id) === 100
  }).length
)

const activeMilestones = computed(() => 
  roadmapItems.value.filter(item => {
    const startDate = new Date(item.startDate || item.start)
    const endDate = new Date(item.endDate || item.end)
    const now = new Date()
    return startDate <= now && endDate >= now
  }).length
)

const projectProgress = computed(() => {
  if (roadmapItems.value.length === 0) return 0
  const totalProgress = roadmapItems.value.reduce((sum, item) => 
    sum + getMilestoneProgress(item.id), 0
  )
  return Math.round(totalProgress / roadmapItems.value.length)
})

const timeRanges = [
  { label: '3 Months', value: '3months' },
  { label: '6 Months', value: '6months' },
  { label: '1 Year', value: '1year' },
  { label: '2 Years', value: '2years' },
  { label: 'Custom', value: 'custom' }
]

const timeRangeLabel = computed(() => 
  timeRanges.find(r => r.value === timeRange.value)?.label || '6 Months'
)

// Fix: Map the data correctly for the timeline component
const timelineData = computed(() => {
  console.log('Processing timeline data from roadmap items:', roadmapItems.value)
  
  return roadmapItems.value.map(item => {
    // Map the properties correctly - the sample data uses startDate/endDate
    const mappedItem = {
      id: item.id,
      title: item.title,
      content: item.title,
      // Use startDate/endDate from sample data, fallback to start/end
      startDate: item.startDate || item.start,
      endDate: item.endDate || item.end,
      start: item.startDate || item.start,
      end: item.endDate || item.end,
      type: item.type || 'milestone',
      status: item.status || 'planned',
      progress: item.progress || 0,
      group: getItemGroup(item),
      className: `milestone-${item.status || 'planned'}`,
      taskIds: item.taskIds || []
    }
    
    console.log('Mapped timeline item:', mappedItem)
    return mappedItem
  })
})

const timelineGroups = computed(() => {
  if (groupBy.value === 'none') return null
  
  if (groupBy.value === 'type') {
    return [
      { id: 'milestone', content: 'Milestones' },
      { id: 'release', content: 'Releases' },
      { id: 'phase', content: 'Phases' },
      { id: 'deadline', content: 'Deadlines' }
    ]
  }
  
  if (groupBy.value === 'team') {
    return projectsStore.projectTeams.map(team => ({
      id: team.id,
      content: team.name,
      style: `background-color: ${team.color}20`
    }))
  }
  
  return null
})

const timelineOptions = computed(() => {
  const options = {
    stack: true,
    showCurrentTime: true,
    zoomable: true,
    moveable: true,
    selectable: true,
    multiselect: false,
    editable: {
      updateTime: true,
      updateGroup: groupBy.value !== 'none',
      add: false,
      remove: false
    },
    orientation: 'top',
    margin: {
      item: 10,
      axis: 5
    },
    ...getTimeRangeOptions()
  }
  
  console.log('Timeline options:', options)
  return options
})

// Methods
const getTimeRangeOptions = () => {
  const now = new Date()
  let start = new Date(now)
  let end = new Date(now)
  
  switch (timeRange.value) {
    case '3months':
      start.setMonth(now.getMonth() - 1)
      end.setMonth(now.getMonth() + 3)
      break
    case '6months':
      start.setMonth(now.getMonth() - 2)
      end.setMonth(now.getMonth() + 6)
      break
    case '1year':
      start.setMonth(now.getMonth() - 3)
      end.setFullYear(now.getFullYear() + 1)
      break
    case '2years':
      start.setMonth(now.getMonth() - 6)
      end.setFullYear(now.getFullYear() + 2)
      break
    default:
      // When 'custom' is selected, vis-timeline will 'fit' the data.
      if (roadmapItems.value.length > 0) {
        return {}
      }
      // Fallback for custom range with no items to prevent crash.
      start.setMonth(now.getMonth() - 2)
      end.setMonth(now.getMonth() + 6)
      break
  }
  
  return { start, end }
}

const getItemGroup = (item) => {
  if (groupBy.value === 'type') {
    return item.type || 'milestone'
  }
  if (groupBy.value === 'team') {
    // Find team from linked tasks
    const itemTasks = projectTasks.value.filter(task => 
      item.taskIds?.includes(task.id)
    )
    return itemTasks[0]?.teamId || 'unassigned'
  }
  return null
}

const getMilestoneProgress = (milestoneId) => {
  const milestone = roadmapItems.value.find(item => item.id === milestoneId)
  if (!milestone) return milestone?.progress || 0
  
  if (!milestone.taskIds?.length) return milestone.progress || 0
  
  const milestoneTasks = projectTasks.value.filter(task => 
    milestone.taskIds.includes(task.id)
  )
  
  if (milestoneTasks.length === 0) return milestone.progress || 0
  
  const completedTasks = milestoneTasks.filter(task => task.columnId === 'done')
  return Math.round((completedTasks.length / milestoneTasks.length) * 100)
}

const getLinkedTasks = (milestoneId) => {
  if (!milestoneId) return []
  const milestone = roadmapItems.value.find(item => item.id === milestoneId)
  if (!milestone || !milestone.taskIds) return []
  
  return projectTasks.value.filter(task => milestone.taskIds.includes(task.id))
}

const setTimeRange = (range) => {
  timeRange.value = range
  nextTick(() => {
    timelineRef.value?.setWindow(getTimeRangeOptions())
  })
}

// Event handlers
const handleItemMoved = async (item) => {
  try {
    loading.value = true
    
    // Update the roadmap item with new dates
    await tasksStore.updateRoadmapItem(item.id, {
      startDate: item.startDate || item.start,
      endDate: item.endDate || item.end
    })
    
    uiStore.showSuccess('Milestone updated successfully')
  } catch (error) {
    uiStore.showError('Failed to update milestone: ' + error.message)
  } finally {
    loading.value = false
  }
}

const handleItemUpdated = async (item) => {
  try {
    await tasksStore.updateRoadmapItem(item.id, item)
    uiStore.showSuccess('Milestone updated successfully')
  } catch (error) {
    uiStore.showError('Failed to update milestone: ' + error.message)
  }
}

const handleItemSelected = (item) => {
  selectedMilestone.value = roadmapItems.value.find(i => i.id === item.id)
}

const handleItemDoubleClick = (item) => {
  selectedMilestone.value = roadmapItems.value.find(i => i.id === item.id)
  showDetailsDialog.value = true
}

const handleGroupSelected = (group) => {
  console.log('Group selected:', group)
}

const editRoadmapItem = (item) => {
  editingMilestone.value = { ...item }
  milestoneForm.value = {
    title: item.title || '',
    description: item.description || '',
    type: item.type || 'milestone',
    status: item.status || 'planned',
    startDate: item.startDate || item.start || '',
    endDate: item.endDate || item.end || '',
    taskIds: item.taskIds || []
  }
  showCreateDialog.value = true
}

const deleteRoadmapItem = async (itemId) => {
  if (confirm('Are you sure you want to delete this milestone?')) {
    try {
      await tasksStore.deleteRoadmapItem(itemId)
      uiStore.showSuccess('Milestone deleted successfully')
    } catch (error) {
      uiStore.showError('Failed to delete milestone: ' + error.message)
    }
  }
}

const duplicateRoadmapItem = async (item) => {
  try {
    const startDate = new Date(item.startDate || item.start)
    const endDate = new Date(item.endDate || item.end)
    const duration = endDate - startDate
    
    // Create new dates starting from the end of the original item
    const newStart = new Date(endDate)
    const newEnd = new Date(newStart.getTime() + duration)
    
    const newItem = {
      ...item,
      id: undefined, // Let the store generate a new ID
      title: `${item.title} (Copy)`,
      startDate: newStart.toISOString().split('T')[0],
      endDate: newEnd.toISOString().split('T')[0],
      status: 'planned',
      taskIds: [] // Don't copy linked tasks
    }
    
    await tasksStore.createRoadmapItem(newItem)
    uiStore.showSuccess('Milestone duplicated successfully')
  } catch (error) {
    uiStore.showError('Failed to duplicate milestone: ' + error.message)
  }
}

const saveMilestone = async () => {
  if (!milestoneForm.value) return
  
  saving.value = true
  try {
    const milestoneData = {
      ...milestoneForm.value,
      projectId: currentProjectId.value
    }
    
    if (editingMilestone.value) {
      await tasksStore.updateRoadmapItem(editingMilestone.value.id, milestoneData)
      uiStore.showSuccess('Milestone updated successfully')
    } else {
      await tasksStore.createRoadmapItem(milestoneData)
      uiStore.showSuccess('Milestone created successfully')
    }
    
    showCreateDialog.value = false
    editingMilestone.value = null
    milestoneForm.value = {
      title: '',
      description: '',
      type: 'milestone',
      status: 'planned',
      startDate: '',
      endDate: '',
      taskIds: []
    }
  } catch (error) {
    uiStore.showError('Failed to save milestone: ' + error.message)
  } finally {
    saving.value = false
  }
}

const openTaskLinkDialog = (milestone) => {
  selectedMilestone.value = milestone
  showTaskLinkDialog.value = true
}

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

const formatDateRange = (start, end) => {
  const startDate = new Date(start).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
  const endDate = new Date(end).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
  return `${startDate} - ${endDate}`
}

// Lifecycle
onMounted(() => {
  // Set current project if provided in route
  if (route.params.projectId && route.params.projectId !== projectsStore.currentProjectId) {
    projectsStore.setCurrentProject(route.params.projectId)
  }
  
  // Initialize data
  tasksStore.initializeData()
  
  console.log('Roadmap mounted. Current project:', currentProjectId.value)
  console.log('Roadmap items:', roadmapItems.value)
})

// Watch for project changes
watch(currentProjectId, (newProjectId) => {
  if (newProjectId) {
    console.log('Project changed to:', newProjectId)
  }
})
</script>

<style scoped>
.roadmap-view {
  height: 100%;
}

.timeline-container {
  height: 500px;
}

.timeline-card {
  min-height: 500px;
}

.empty-state {
  min-height: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.roadmap-header {
  background: rgba(var(--v-theme-surface), 0.8);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.list-container {
  min-height: 400px;
}
</style>