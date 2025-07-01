<template>
  <div class="roadmap-view">
    <!-- Header Controls -->
    <div class="roadmap-header mb-4">
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
                {{ roadmapItems.length }} milestone{{ roadmapItems.length !== 1 ? 's' : '' }} • 
                {{ linkedTasks.length }} linked tasks
              </p>
            </div>
          </div>
        </v-col>
        
        <v-col cols="12" md="6" class="text-md-right">
          <div class="d-flex align-center justify-end flex-wrap ga-2">
            <!-- View Controls -->
            <v-btn-toggle
              v-model="viewMode"
              variant="outlined"
              size="small"
              mandatory
            >
              <v-btn value="timeline" prepend-icon="mdi-timeline">
                Timeline
              </v-btn>
              <v-btn value="gantt" prepend-icon="mdi-chart-gantt">
                Gantt
              </v-btn>
              <v-btn value="list" prepend-icon="mdi-format-list-bulleted">
                List
              </v-btn>
            </v-btn-toggle>
            
            <!-- Time Range -->
            <v-menu offset-y>
              <template #activator="{ props }">
                <v-btn
                  v-bind="props"
                  variant="outlined"
                  size="small"
                  prepend-icon="mdi-calendar-range"
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
            
            <!-- Add Milestone -->
            <v-btn
              color="primary"
              size="small"
              prepend-icon="mdi-plus"
              @click="showCreateDialog = true"
            >
              Add Milestone
            </v-btn>
            
            <!-- Roadmap Settings -->
            <v-menu offset-y>
              <template #activator="{ props }">
                <v-btn
                  v-bind="props"
                  icon="mdi-cog"
                  variant="text"
                  size="small"
                />
              </template>
              
              <RoadmapSettings
                v-model:show-tasks="showLinkedTasks"
                v-model:show-dependencies="showDependencies"
                v-model:group-by="groupBy"
                @export="exportRoadmap"
              />
            </v-menu>
          </div>
        </v-col>
      </v-row>
    </div>

    <!-- Timeline Container -->
    <div v-if="viewMode === 'timeline' || viewMode === 'gantt'" class="timeline-container">
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
        :tasks="linkedTasks"
        @edit-item="editRoadmapItem"
        @delete-item="deleteRoadmapItem"
        @add-task="linkTaskToItem"
        @remove-task="unlinkTaskFromItem"
      />
    </div>

    <!-- Quick Stats -->
    <v-row class="mt-6">
      <v-col cols="12" md="4">
        <v-card>
          <v-card-text class="text-center pa-4">
            <div class="d-flex align-center justify-center mb-2">
              <v-icon color="primary" size="24" class="mr-2">mdi-flag-checkered</v-icon>
              <span class="text-h4 font-weight-bold">{{ completedMilestones }}</span>
            </div>
            <p class="text-body-2 text-medium-emphasis mb-0">Completed Milestones</p>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="12" md="4">
        <v-card>
          <v-card-text class="text-center pa-4">
            <div class="d-flex align-center justify-center mb-2">
              <v-icon color="warning" size="24" class="mr-2">mdi-clock-outline</v-icon>
              <span class="text-h4 font-weight-bold">{{ activeMilestones }}</span>
            </div>
            <p class="text-body-2 text-medium-emphasis mb-0">Active Milestones</p>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="12" md="4">
        <v-card>
          <v-card-text class="text-center pa-4">
            <div class="d-flex align-center justify-center mb-2">
              <v-icon color="success" size="24" class="mr-2">mdi-chart-line</v-icon>
              <span class="text-h4 font-weight-bold">{{ projectProgress }}%</span>
            </div>
            <p class="text-body-2 text-medium-emphasis mb-0">Overall Progress</p>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Create/Edit Milestone Dialog -->
    <MilestoneDialog
      v-model="showCreateDialog"
      :milestone="editingMilestone"
      :project-id="currentProjectId"
      @milestone-saved="handleMilestoneSaved"
      @close="handleDialogClose"
    />

    <!-- Milestone Details Dialog -->
    <MilestoneDetailsDialog
      v-model="showDetailsDialog"
      :milestone="selectedMilestone"
      :linked-tasks="getLinkedTasks(selectedMilestone?.id)"
      @milestone-updated="handleMilestoneUpdated"
      @milestone-deleted="handleMilestoneDeleted"
      @task-linked="linkTaskToItem"
      @task-unlinked="unlinkTaskFromItem"
    />

    <!-- Task Link Dialog -->
    <TaskLinkDialog
      v-model="showTaskLinkDialog"
      :milestone="selectedMilestone"
      :available-tasks="availableTasks"
      @tasks-linked="handleTasksLinked"
    />

    <!-- Loading Overlay -->
    <v-overlay
      v-model="loading"
      class="align-center justify-center"
      contained
    >
      <v-progress-circular
        color="primary"
        indeterminate
        size="64"
      />
    </v-overlay>

    <!-- Empty State -->
    <v-card
      v-if="!loading && roadmapItems.length === 0"
      class="text-center pa-8 mt-8"
    >
      <v-icon size="64" color="medium-emphasis" class="mb-4">
        mdi-map-outline
      </v-icon>
      <h3 class="text-h6 mb-2">No Roadmap Items</h3>
      <p class="text-body-2 text-medium-emphasis mb-4">
        Start planning your project by creating milestones and linking tasks.
      </p>
      <v-btn
        color="primary"
        prepend-icon="mdi-plus"
        @click="showCreateDialog = true"
      >
        Create First Milestone
      </v-btn>
    </v-card>
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
import RoadmapSettings from '@/components/roadmap/RoadmapSettings.vue'
import MilestoneDialog from '@/components/roadmap/MilestoneDialog.vue'
import MilestoneDetailsDialog from '@/components/roadmap/MilestoneDetailsDialog.vue'
import TaskLinkDialog from '@/components/roadmap/TaskLinkDialog.vue'

// Composables
const route = useRoute()
const router = useRouter()
const projectsStore = useProjectsStore()
const tasksStore = useTasksStore()
const uiStore = useUIStore()

// Refs
const timelineRef = ref(null)

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

// Store getters
const currentProject = computed(() => projectsStore.currentProject)
const currentProjectId = computed(() => projectsStore.currentProjectId)
const roadmapItems = computed(() => tasksStore.getRoadmapByProject(currentProjectId.value))
const projectTasks = computed(() => tasksStore.getTasksByProject(currentProjectId.value))

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
    const endDate = new Date(item.end)
    const now = new Date()
    return endDate < now && getMilestoneProgress(item.id) === 100
  }).length
)

const activeMilestones = computed(() => 
  roadmapItems.value.filter(item => {
    const startDate = new Date(item.start)
    const endDate = new Date(item.end)
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

const timelineData = computed(() => {
  return roadmapItems.value.map(item => ({
    id: item.id,
    content: item.title,
    start: item.start,
    end: item.end,
    type: item.type || 'range',
    group: getItemGroup(item),
    className: `milestone-${item.type || 'milestone'}`,
    style: `background-color: ${currentProject.value?.color || '#1976D2'}`,
    title: item.content,
    editable: true,
    data: item
  }))
})

const timelineGroups = computed(() => {
  if (groupBy.value === 'none') return null
  
  if (groupBy.value === 'type') {
    return [
      { id: 'milestone', content: 'Milestones' },
      { id: 'task', content: 'Tasks' },
      { id: 'release', content: 'Releases' }
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

const timelineOptions = computed(() => ({
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
  format: {
    minorLabels: {
      millisecond: 'SSS',
      second: 's',
      minute: 'HH:mm',
      hour: 'HH:mm',
      weekday: 'ddd D',
      day: 'D',
      week: 'w',
      month: 'MMM',
      year: 'YYYY'
    },
    majorLabels: {
      millisecond: 'HH:mm:ss',
      second: 'D MMMM HH:mm',
      minute: 'ddd D MMMM',
      hour: 'ddd D MMMM',
      weekday: 'MMMM YYYY',
      day: 'MMMM YYYY',
      week: 'MMMM YYYY',
      month: 'YYYY',
      year: ''
    }
  },
  ...getTimeRangeOptions()
}))

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
      return {}
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
  if (!milestone || !milestone.taskIds?.length) return 0
  
  const milestoneTasks = projectTasks.value.filter(task => 
    milestone.taskIds.includes(task.id)
  )
  
  if (milestoneTasks.length === 0) return 0
  
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
const handleItemMoved = async (item, callback) => {
  try {
    loading.value = true
    
    await tasksStore.updateRoadmapItem(item.id, {
      start: item.start,
      end: item.end,
      group: item.group
    })
    
    uiStore.showSuccess('Milestone updated successfully')
    callback(null) // Accept the changes
  } catch (error) {
    uiStore.showError('Failed to update milestone: ' + error.message)
    callback(error) // Reject the changes
  } finally {
    loading.value = false
  }
}

const handleItemUpdated = async (item) => {
  try {
    await tasksStore.updateRoadmapItem(item.id, item.data)
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

const linkTaskToItem = async (milestoneId, taskId) => {
  try {
    await tasksStore.linkTaskToRoadmap(taskId, milestoneId)
    uiStore.showSuccess('Task linked to milestone')
  } catch (error) {
    uiStore.showError('Failed to link task: ' + error.message)
  }
}

const unlinkTaskFromItem = async (milestoneId, taskId) => {
  try {
    await tasksStore.unlinkTaskFromRoadmap(taskId, milestoneId)
    uiStore.showSuccess('Task unlinked from milestone')
  } catch (error) {
    uiStore.showError('Failed to unlink task: ' + error.message)
  }
}

const handleMilestoneSaved = (milestone) => {
  uiStore.showSuccess(editingMilestone.value ? 'Milestone updated' : 'Milestone created')
  showCreateDialog.value = false
  editingMilestone.value = null
}

const handleMilestoneUpdated = (milestone) => {
  uiStore.showSuccess('Milestone updated successfully')
  showDetailsDialog.value = false
  selectedMilestone.value = null
}

const handleMilestoneDeleted = (milestoneId) => {
  uiStore.showSuccess('Milestone deleted successfully')
  showDetailsDialog.value = false
  selectedMilestone.value = null
}

const handleTasksLinked = (milestoneId, taskIds) => {
  uiStore.showSuccess(`${taskIds.length} task(s) linked to milestone`)
  showTaskLinkDialog.value = false
}

const handleDialogClose = () => {
  showCreateDialog.value = false
  editingMilestone.value = null
}

const exportRoadmap = (format) => {
  console.log('Export roadmap:', format)
  uiStore.showInfo('Export feature coming soon')
}

// Initialize project from route
const initializeProject = () => {
  const projectId = route.params.projectId
  if (projectId && projectId !== currentProjectId.value) {
    projectsStore.setCurrentProject(projectId)
  }
}

// Lifecycle
onMounted(() => {
  initializeProject()
})

// Watchers
watch(() => route.params.projectId, (newProjectId) => {
  if (newProjectId && newProjectId !== currentProjectId.value) {
    projectsStore.setCurrentProject(newProjectId)
  }
})
</script>

<style scoped>
.roadmap-view {
  height: 100%;
  overflow: hidden;
}

.timeline-container {
  height: calc(100vh - 300px);
  min-height: 400px;
}

.timeline-card {
  height: 100%;
  overflow: hidden;
}

.list-container {
  height: calc(100vh - 300px);
  overflow-y: auto;
}

.roadmap-header {
  flex-shrink: 0;
}

@media (max-width: 960px) {
  .timeline-container {
    height: calc(100vh - 220px);
    min-height: 300px;
  }
  
  .roadmap-header .v-row > .v-col {
    margin-bottom: 8px;
  }
}

@media (max-width: 600px) {
  .timeline-container {
    height: calc(100vh - 180px);
    min-height: 250px;
  }
}
</style>