<template>
  <div class="roadmap-view pa-4">
    <!-- Header Card -->
    <v-card class="mb-6">
      <v-card-text class="pb-2">
        <v-row align="center">
          <v-col cols="12" md="6">
            <h1 class="text-h4 font-weight-bold">Project Roadmap</h1>
            <p class="text-body-1 text-medium-emphasis mt-1">
              Plan and track your project milestones and releases
            </p>
          </v-col>
          <v-col cols="12" md="6" class="text-md-end">
            <div class="d-flex align-center gap-2 justify-md-end">
              <v-btn-toggle
                v-model="viewMode"
                variant="outlined"
                mandatory
              >
                <v-btn value="timeline" icon="mdi-timeline" />
                <v-btn value="list" icon="mdi-view-list" />
              </v-btn-toggle>
              
              <v-btn
                color="primary"
                prepend-icon="mdi-plus"
                @click="createMilestone"
              >
                New Milestone
              </v-btn>
            </div>
          </v-col>
        </v-row>

        <v-row class="mt-4">
          <v-col cols="12" md="3">
            <v-text-field
              v-model="searchQuery"
              prepend-inner-icon="mdi-magnify"
              label="Search milestones"
              variant="outlined"
              density="compact"
              hide-details
            />
          </v-col>
          <v-col cols="12" md="2">
            <v-select
              v-model="statusFilter"
              :items="statusOptions"
              label="Status"
              variant="outlined"
              density="compact"
              clearable
              hide-details
            />
          </v-col>
          <v-col cols="12" md="2">
            <v-select
              v-model="typeFilter"
              :items="typeOptions"
              label="Type"
              variant="outlined"
              density="compact"
              clearable
              hide-details
            />
          </v-col>
          <v-col cols="12" md="2">
            <v-select
              v-model="teamFilter"
              :items="teamOptions"
              label="Team"
              variant="outlined"
              density="compact"
              clearable
              hide-details
            />
          </v-col>
          <v-col cols="12" md="2">
            <v-select
              v-if="viewMode === 'timeline'"
              v-model="timeRange"
              :items="timeRangeOptions"
              label="Time Range"
              variant="outlined"
              density="compact"
              hide-details
            />
            <v-select
              v-else
              v-model="groupBy"
              :items="groupByOptions"
              label="Group By"
              variant="outlined"
              density="compact"
              hide-details
            />
          </v-col>
          <v-col cols="12" md="1">
            <div class="d-flex align-center gap-1">
              <v-tooltip text="Show Tasks">
                <template #activator="{ props }">
                  <v-btn
                    v-bind="props"
                    :color="showLinkedTasks ? 'primary' : 'default'"
                    :variant="showLinkedTasks ? 'flat' : 'outlined'"
                    icon="mdi-checkbox-marked-circle-outline"
                    size="small"
                    @click="showLinkedTasks = !showLinkedTasks"
                  />
                </template>
              </v-tooltip>
              
              <v-tooltip v-if="viewMode === 'timeline'" text="Show Dependencies">
                <template #activator="{ props }">
                  <v-btn
                    v-bind="props"
                    :color="showDependencies ? 'primary' : 'default'"
                    :variant="showDependencies ? 'flat' : 'outlined'"
                    icon="mdi-source-branch"
                    size="small"
                    @click="showDependencies = !showDependencies"
                  />
                </template>
              </v-tooltip>
            </div>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Content Area -->
    <div class="flex-grow-1">
      <!-- Timeline View -->
      <v-card 
        v-if="viewMode === 'timeline'" 
        class="timeline-card"
        elevation="1"
      >
        <v-card-text class="pa-0">
          <div v-if="roadmapItems.length > 0" class="timeline-container">
            <RoadmapTimeline
              ref="timelineRef"
              :items="timelineItems"
              :groups="showLinkedTasks ? timelineGroups : null"
              :options="timelineOptions"
              :key="`timeline-${timeRange}-${roadmapItems.length}-${showLinkedTasks}-${showDependencies}`"
              @item-selected="showMilestoneDetails"
              @item-moved="handleItemMoved"
            />
          </div>
          
          <div v-else class="empty-state">
            <v-icon size="64" color="grey-lighten-2" class="mb-4">mdi-timeline-outline</v-icon>
            <h3 class="text-h6 mb-2">No milestones yet</h3>
            <p class="text-body-2 text-medium-emphasis mb-4">
              Create your first milestone to start planning your roadmap
            </p>
            <v-btn color="primary" @click="createMilestone" prepend-icon="mdi-plus">
              Create First Milestone
            </v-btn>
          </div>
        </v-card-text>
      </v-card>

      <!-- List View -->
      <div v-else class="list-container">
        <RoadmapList
          :items="roadmapItems"
          :tasks="projectTasks"
          :show-linked-tasks="showLinkedTasks"
          @edit="editMilestone"
          @view="showMilestoneDetails"
          @delete="deleteRoadmapItem"
          @duplicate="duplicateRoadmapItem"
          @link-tasks="openTaskLinkDialog"
        />
      </div>
    </div>

    <!-- Milestone Form Dialog -->
    <v-dialog v-model="showCreateDialog" max-width="600" persistent scrollable>
      <v-card>
        <v-card-title class="d-flex align-center justify-space-between">
          <div class="d-flex align-center">
            <v-icon class="mr-2">
              {{ editingMilestone ? 'mdi-pencil' : 'mdi-plus-circle' }}
            </v-icon>
            <span class="text-h6">
              {{ editingMilestone ? 'Edit Milestone' : 'Create New Milestone' }}
            </span>
          </div>
          
          <v-btn
            variant="text"
            size="small"
            icon="mdi-close"
            @click="cancelMilestoneEdit"
          />
        </v-card-title>

        <v-divider />

        <v-form ref="milestoneFormRef" v-model="milestoneFormValid" @submit.prevent="saveMilestone">
          <v-card-text class="pa-6">
            <v-text-field
              v-model="milestoneForm.title"
              label="Milestone Title"
              variant="outlined"
              :rules="[v => !!v || 'Title is required']"
              class="mb-4"
              required
            />
            
            <div class="mb-4">
              <v-label class="text-subtitle-2 font-weight-medium mb-2 d-block">
                Description
              </v-label>
              <v-textarea
                v-model="milestoneForm.description"
                placeholder="Enter milestone description..."
                variant="outlined"
                rows="3"
                no-resize
              />
            </div>
            
            <v-row class="mb-4">
              <v-col cols="12" md="6">
                <v-select
                  v-model="milestoneForm.type"
                  :items="milestoneTypes"
                  label="Type"
                  variant="outlined"
                  :rules="[v => !!v || 'Type is required']"
                  required
                >
                  <template #item="{ props, item }">
                    <v-list-item v-bind="props">
                      <template #prepend>
                        <v-icon :color="getMilestoneTypeColor(item.value)">
                          {{ getMilestoneTypeIcon(item.value) }}
                        </v-icon>
                      </template>
                    </v-list-item>
                  </template>
                </v-select>
              </v-col>
              
              <v-col cols="12" md="6">
                <v-select
                  v-model="milestoneForm.status"
                  :items="milestoneStatuses"
                  label="Status"
                  variant="outlined"
                  :rules="[v => !!v || 'Status is required']"
                  required
                >
                  <template #item="{ props, item }">
                    <v-list-item v-bind="props">
                      <template #prepend>
                        <v-chip
                          :color="getStatusColor(item.value)"
                          size="x-small"
                          variant="flat"
                        >
                          {{ item.title }}
                        </v-chip>
                      </template>
                    </v-list-item>
                  </template>
                </v-select>
              </v-col>
            </v-row>
            
            <v-row class="mb-3">
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="milestoneForm.startDate"
                  label="Start Date"
                  type="date"
                  variant="outlined"
                  :rules="[v => !!v || 'Start date is required']"
                  required
                />
              </v-col>
              
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="milestoneForm.endDate"
                  label="End Date"
                  type="date"
                  variant="outlined"
                  :rules="[
                    v => !!v || 'End date is required', 
                    v => !milestoneForm.startDate || v >= milestoneForm.startDate || 'End date must be after start date'
                  ]"
                  required
                />
              </v-col>
            </v-row>
          </v-card-text>

          <v-card-actions class="px-6 pb-4">
            <v-spacer />
            <v-btn
              variant="text"
              @click="cancelMilestoneEdit"
            >
              Cancel
            </v-btn>
            <v-btn
              color="primary"
              type="submit"
              :loading="saving"
              :disabled="!milestoneFormValid"
            >
              {{ editingMilestone ? 'Update Milestone' : 'Create Milestone' }}
            </v-btn>
          </v-card-actions>
        </v-form>
      </v-card>
    </v-dialog>

    <!-- Milestone Details Dialog -->
    <MilestoneDetailsDialog
      v-model="showDetailsDialog"
      :milestone="selectedMilestone"
      :linked-tasks="linkedTasks"
      @milestone-edit="editMilestone"
      @milestone-updated="handleMilestoneUpdated"
      @milestone-deleted="handleMilestoneDeleted"
      @task-unlinked="handleTaskUnlinked"
      @link-tasks="openTaskLinkDialog"
    />

    <!-- Task Link Dialog -->
    <v-dialog v-model="showTaskLinkDialog" max-width="800">
      <v-card>
        <v-card-title class="text-h5">
          Link Tasks to {{ selectedMilestone?.title }}
        </v-card-title>

        <v-divider />

        <v-card-text>
          <div v-if="availableTasksForLinking.length > 0">
            <v-list>
              <v-list-item
                v-for="task in availableTasksForLinking"
                :key="task.id"
                @click="toggleTaskLink(task.id)"
              >
                <template #prepend>
                  <v-checkbox
                    :model-value="isTaskLinked(task.id)"
                    @click.stop="toggleTaskLink(task.id)"
                  />
                </template>

                <v-list-item-title>{{ task.title }}</v-list-item-title>
                <v-list-item-subtitle>{{ task.description }}</v-list-item-subtitle>

                <template #append>
                  <v-chip
                    :color="getTaskStatusColor(task.columnId)"
                    size="small"
                    variant="flat"
                  >
                    {{ getTaskStatusLabel(task.columnId) }}
                  </v-chip>
                </template>
              </v-list-item>
            </v-list>
          </div>
          
          <div v-else class="text-center py-8">
            <v-icon size="48" color="grey-lighten-1" class="mb-2">mdi-clipboard-text-off</v-icon>
            <p class="text-body-2 text-medium-emphasis">No tasks available to link</p>
          </div>
        </v-card-text>

        <v-divider />

        <v-card-actions>
          <v-spacer />
          <v-btn @click="showTaskLinkDialog = false">Close</v-btn>
          <v-btn color="primary" @click="saveTaskLinks">Save Links</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProjectsStore } from '@/stores/projects'
import { useTasksStore } from '@/stores/tasks'
import { useUIStore } from '@/stores/ui'
import RoadmapTimeline from '@/components/roadmap/RoadmapTimeline.vue'
import RoadmapList from '@/components/roadmap/RoadmapList.vue'
import MilestoneDetailsDialog from '@/components/roadmap/MilestoneDetailsDialog.vue'

// Composables
const route = useRoute()
const router = useRouter()
const projectsStore = useProjectsStore()
const tasksStore = useTasksStore()
const uiStore = useUIStore()

// Refs
const timelineRef = ref(null)
const milestoneFormRef = ref(null)

// Local state
const loading = ref(false)
const viewMode = ref('timeline')
const timeRange = ref('6months')
const groupBy = ref('none')
const showCreateDialog = ref(false)
const showDetailsDialog = ref(false)
const showTaskLinkDialog = ref(false)
const editingMilestone = ref(null)
const selectedMilestone = ref(null)
const milestoneFormValid = ref(false)
const saving = ref(false)

// Filter state
const searchQuery = ref('')
const statusFilter = ref('')
const typeFilter = ref('')
const teamFilter = ref('')
const showLinkedTasks = ref(true)
const showDependencies = ref(false)

// Reactive form data
const milestoneForm = reactive({
  title: '',
  description: '',
  type: 'milestone',
  status: 'planning',
  startDate: '',
  endDate: '',
  taskIds: []
})

// Computed properties
const currentProjectId = computed(() => projectsStore.currentProjectId)

const allRoadmapItems = computed(() => {
  const items = tasksStore.roadmapItems.filter(item => 
    item.projectId === currentProjectId.value
  )
  
  return items
})

// Filter options
const statusOptions = computed(() => [
  { title: 'Planning', value: 'planning' },
  { title: 'In Progress', value: 'inprogress' },
  { title: 'Completed', value: 'completed' },
  { title: 'On Hold', value: 'on-hold' },
  { title: 'Overdue', value: 'overdue' }
])

const typeOptions = computed(() => [
  { title: 'Milestone', value: 'milestone' },
  { title: 'Release', value: 'release' },
  { title: 'Phase', value: 'phase' },
  { title: 'Deadline', value: 'deadline' },
  { title: 'Review', value: 'review' }
])

const teamOptions = computed(() => {
  // Get all teams from the projects store
  const allTeams = projectsStore.teams
  
  // Find teams that have members assigned to tasks linked to roadmap items
  const usedTeamIds = new Set()
  
  allRoadmapItems.value.forEach(item => {
    if (item.taskIds?.length) {
      const linkedTasks = projectTasks.value.filter(task => item.taskIds.includes(task.id))
      linkedTasks.forEach(task => {
        // Check if any assignees belong to any team
        if (task.assigneeIds?.length) {
          task.assigneeIds.forEach(assigneeId => {
            // Find which team this user belongs to
            const userTeam = allTeams.find(team => team.members.includes(assigneeId))
            if (userTeam) {
              usedTeamIds.add(userTeam.id)
            }
          })
        }
      })
    }
  })
  
  // Return teams that have members working on roadmap tasks
  return allTeams
    .filter(team => usedTeamIds.has(team.id))
    .map(team => ({
      title: team.name,
      value: team.id
    }))
})

// Apply filters to roadmap items
const roadmapItems = computed(() => {
  let items = [...allRoadmapItems.value]
  
  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    items = items.filter(item => 
      item.title?.toLowerCase().includes(query) ||
      item.description?.toLowerCase().includes(query)
    )
  }
  
  // Status filter
  if (statusFilter.value) {
    items = items.filter(item => {
      const itemStatus = item.status || 'planning'
      return itemStatus === statusFilter.value
    })
  }
  
  // Type filter
  if (typeFilter.value) {
    items = items.filter(item => {
      const itemType = item.type || 'milestone'
      return itemType === typeFilter.value
    })
  }
  
  // Team filter - check if any task assignees belong to the selected team
  if (teamFilter.value) {
    items = items.filter(item => {
      if (!item.taskIds?.length) return false
      
      const linkedTasks = projectTasks.value.filter(task => item.taskIds.includes(task.id))
      return linkedTasks.some(task => {
        // Check if any assignees belong to the filtered team
        if (task.assigneeIds?.length) {
          return task.assigneeIds.some(assigneeId => {
            // Find the team that contains this user
            const userTeam = projectsStore.teams.find(team => 
              team.members.includes(assigneeId)
            )
            return userTeam?.id === teamFilter.value
          })
        }
        
        return false
      })
    })
  }
  
  return items
})

const projectTasks = computed(() => {
  return tasksStore.tasks.filter(task => 
    task.projectId === currentProjectId.value
  )
})

// Options
const timeRangeOptions = [
  { title: '3 Months', value: '3months' },
  { title: '6 Months', value: '6months' },
  { title: '1 Year', value: '1year' },
  { title: 'Custom', value: 'custom' }
]

const groupByOptions = [
  { title: 'None', value: 'none' },
  { title: 'Type', value: 'type' },
  { title: 'Status', value: 'status' },
  { title: 'Assignee', value: 'assignee' }
]

const milestoneTypes = [
  { title: 'Milestone', value: 'milestone' },
  { title: 'Release', value: 'release' },
  { title: 'Phase', value: 'phase' },
  { title: 'Deadline', value: 'deadline' },
  { title: 'Review', value: 'review' }
]

const milestoneStatuses = [
  { title: 'Planning', value: 'planning' },
  { title: 'In Progress', value: 'inprogress' },
  { title: 'Completed', value: 'completed' },
  { title: 'On Hold', value: 'on-hold' },
  { title: 'Overdue', value: 'overdue' }
]

// Timeline items for vis.js - now includes tasks when showLinkedTasks is enabled
const timelineItems = computed(() => {
  const items = []
  
  // Add milestone items first
  roadmapItems.value.forEach((item, milestoneIndex) => {
    const timelineItem = {
      id: item.id,
      content: item.title,
      start: item.startDate || item.start,
      end: item.endDate || item.end,
      type: 'range',
      className: `milestone-${item.status || 'planning'}`,
      style: `background-color: ${getMilestoneTypeColor(item.type)}; border-color: ${getMilestoneTypeColor(item.type)}; font-weight: bold;`,
      title: `${item.title}\nType: ${item.type}\nStatus: ${item.status}\nProgress: ${getMilestoneProgress(item.id)}%`,
      group: 'milestones',
      milestone: true
    }
    items.push(timelineItem)
  })
  
  // Add linked tasks if showLinkedTasks is enabled
  if (showLinkedTasks.value) {
    roadmapItems.value.forEach((item, milestoneIndex) => {
      if (item.taskIds?.length) {
        const linkedTasks = projectTasks.value.filter(task => item.taskIds.includes(task.id))
        
        // Sort tasks by their order or creation date for consistent positioning
        linkedTasks.sort((a, b) => {
          if (a.order !== undefined && b.order !== undefined) {
            return a.order - b.order
          }
          return new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
        })
        
        linkedTasks.forEach((task, taskIndex) => {
          const taskStartDate = task.startDate || item.startDate || item.start
          const taskEndDate = task.dueDate || task.endDate || item.endDate || item.end
          
          const taskItem = {
            id: `task-${task.id}`,
            content: `📋 ${task.title}`,
            start: taskStartDate,
            end: taskEndDate,
            type: 'range',
            className: `task-${task.columnId}`,
            style: `background-color: ${getTaskStatusColor(task.columnId)}; border-color: ${getTaskStatusColor(task.columnId)}; opacity: 0.8;`,
            title: `Task: ${task.title}\nStatus: ${getTaskStatusLabel(task.columnId)}\nPriority: ${task.priority}\nMilestone: ${item.title}`,
            group: `milestone-${item.id}`, // Keep tasks in their specific milestone group
            milestone: false,
            milestoneId: item.id,
            taskId: task.id
          }
          items.push(taskItem)
        })
      }
    })
  }
  
  return items
})

// Timeline groups - create groups for milestones and their tasks
const timelineGroups = computed(() => {
  if (!showLinkedTasks.value) {
    return [{ id: 'milestones', content: 'Milestones' }]
  }
  
  const groups = [{ id: 'milestones', content: 'Milestones' }]
  
  roadmapItems.value.forEach((item, index) => {
    if (item.taskIds?.length) {
      const taskCount = item.taskIds.length
      // Calculate dynamic height: base height + space for each task
      const groupHeight = Math.max(80, taskCount * 25 + 20)
      
      groups.push({
        id: `milestone-${item.id}`,
        content: `Tasks - ${item.title} (${taskCount})`,
        className: 'task-group',
        style: `background-color: rgba(0,0,0,0.05); min-height: ${groupHeight}px; height: ${groupHeight}px;`
      })
    }
  })
  
  return groups
})

// Timeline dependencies - create dependency lines when showDependencies is enabled
const timelineDependencies = computed(() => {
  if (!showDependencies.value) return []
  
  const dependencies = []
  
  roadmapItems.value.forEach(item => {
    // Simple dependency logic - milestones depend on previous milestones
    const currentIndex = roadmapItems.value.findIndex(m => m.id === item.id)
    if (currentIndex > 0) {
      const previousItem = roadmapItems.value[currentIndex - 1]
      dependencies.push({
        from: previousItem.id,
        to: item.id,
        type: 'finish-to-start'
      })
    }
    
    // Task dependencies within milestones
    if (showLinkedTasks.value && item.taskIds?.length > 1) {
      const linkedTasks = projectTasks.value.filter(task => item.taskIds.includes(task.id))
      for (let i = 1; i < linkedTasks.length; i++) {
        dependencies.push({
          from: `task-${linkedTasks[i-1].id}`,
          to: `task-${linkedTasks[i].id}`,
          type: 'finish-to-start'
        })
      }
    }
  })
  
  return dependencies
})

const timelineOptions = computed(() => {
  const options = {
    ...getTimeRangeOptions(),
    orientation: 'top',
    stack: true,
    stackSubgroups: true,
    showCurrentTime: true,
    height: showLinkedTasks.value ? 'auto' : '400px',
    maxHeight: showLinkedTasks.value ? '800px' : '400px',
    format: {
      minorLabels: {
        month: 'MMM',
        week: 'w'
      }
    },
    margin: {
      item: {
        horizontal: 0,
        vertical: 2
      },
      axis: 5
    },
    editable: {
      add: false,
      updateTime: true,
      updateGroup: false,
      remove: false
    },
    showMajorLabels: true,
    showMinorLabels: true,
    zoomKey: 'ctrlKey',
    itemsAlwaysDraggable: false,
    verticalScroll: true,
    autoResize: true,
    throttleRedraw: 10
  }
  
  // Add dependency configuration if enabled
  if (showDependencies.value && timelineDependencies.value.length > 0) {
    options.dependencies = timelineDependencies.value
    options.plugins = ['dependencies']
  }
  
  return options
})

// Get linked tasks for selected milestone
const linkedTasks = computed(() => {
  if (!selectedMilestone.value) return []
  return getLinkedTasks(selectedMilestone.value.id)
})

// Available tasks for linking (not already linked)
const availableTasksForLinking = computed(() => {
  if (!selectedMilestone.value) return []
  const linkedTaskIds = selectedMilestone.value.taskIds || []
  return projectTasks.value.filter(task => !linkedTaskIds.includes(task.id))
})

// Helper functions
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
  const milestone = roadmapItems.value.find(item => item.id === milestoneId)
  if (!milestone) return 0
  
  // If progress is explicitly set, use it
  if (milestone.progress !== undefined) return milestone.progress
  
  // Otherwise calculate from linked tasks
  if (!milestone.taskIds?.length) return 0
  
  const milestoneTasks = projectTasks.value.filter(task => 
    milestone.taskIds.includes(task.id)
  )
  
  if (milestoneTasks.length === 0) return 0
  
  const completedTasks = milestoneTasks.filter(task => task.columnId === 'done')
  return Math.round((completedTasks.length / milestoneTasks.length) * 100)
}

const getTimeRangeOptions = () => {
  const now = new Date()
  const start = new Date()
  const end = new Date()
  
  switch (timeRange.value) {
    case '3months':
      start.setMonth(now.getMonth() - 1)
      end.setMonth(now.getMonth() + 2)
      break
    case '6months':
      start.setMonth(now.getMonth() - 2)
      end.setMonth(now.getMonth() + 4)
      break
    case '1year':
      start.setMonth(now.getMonth() - 3)
      end.setMonth(now.getMonth() + 9)
      break
    case 'custom':
      if (roadmapItems.value.length > 0) {
        // Find earliest and latest dates from milestones
        const dates = roadmapItems.value.flatMap(item => [
          new Date(item.startDate || item.start),
          new Date(item.endDate || item.end)
        ]).filter(date => !isNaN(date.getTime()))
        
        if (dates.length > 0) {
          const minDate = new Date(Math.min(...dates))
          const maxDate = new Date(Math.max(...dates))
          
          // Add some padding
          minDate.setMonth(minDate.getMonth() - 1)
          maxDate.setMonth(maxDate.getMonth() + 1)
          
          return { min: minDate, max: maxDate }
        }
      }
      // Fallback for custom range with no items
      start.setMonth(now.getMonth() - 1)
      end.setMonth(now.getMonth() + 2)
      break
    default:
      start.setMonth(now.getMonth() - 2)
      end.setMonth(now.getMonth() + 4)
      break
  }
  
  return { min: start, max: end }
}

const getLinkedTasks = (milestoneId) => {
  if (!milestoneId) return []
  const milestone = roadmapItems.value.find(item => item.id === milestoneId)
  if (!milestone || !milestone.taskIds) return []
  
  return projectTasks.value.filter(task => milestone.taskIds.includes(task.id))
}

// Methods
const createMilestone = () => {
  editingMilestone.value = null
  Object.assign(milestoneForm, {
    title: '',
    description: '',
    type: 'milestone',
    status: 'planning',
    startDate: '',
    endDate: '',
    taskIds: []
  })
  showCreateDialog.value = true
}

const editMilestone = (milestone) => {
  editingMilestone.value = milestone
  Object.assign(milestoneForm, {
    title: milestone.title || '',
    description: milestone.description || '',
    type: milestone.type || 'milestone',
    status: milestone.status || 'planning',
    startDate: milestone.startDate || milestone.start || '',
    endDate: milestone.endDate || milestone.end || '',
    taskIds: milestone.taskIds || []
  })
  showCreateDialog.value = true
}

const cancelMilestoneEdit = () => {
  showCreateDialog.value = false
  editingMilestone.value = null
  Object.assign(milestoneForm, {
    title: '',
    description: '',
    type: 'milestone',
    status: 'planning',
    startDate: '',
    endDate: '',
    taskIds: []
  })
}

const showMilestoneDetails = (itemIdOrItem) => {
  // Handle both ID (from list view) and full item object (from timeline)
  let itemId;
  let isTask = false;
  
  if (typeof itemIdOrItem === 'string') {
    itemId = itemIdOrItem;
  } else if (typeof itemIdOrItem === 'object' && itemIdOrItem.id) {
    // Check if this is a task item
    if (itemIdOrItem.id.startsWith('task-')) {
      isTask = true;
      itemId = itemIdOrItem.milestoneId; // Show the parent milestone
    } else {
      itemId = itemIdOrItem.id;
    }
  } else {
    console.error('Invalid item ID or object:', itemIdOrItem);
    return;
  }
  
  const milestone = roadmapItems.value.find(item => item.id === itemId)
  if (milestone) {
    selectedMilestone.value = milestone
    showDetailsDialog.value = true
  } else {
    console.error('Milestone not found for ID:', itemId)
  }
}

const handleItemMoved = async (itemId, newStart, newEnd) => {
  try {
    await tasksStore.updateRoadmapItem(itemId, {
      startDate: newStart.toISOString().split('T')[0],
      endDate: newEnd.toISOString().split('T')[0]
    })
    uiStore.showSuccess('Milestone updated successfully')
  } catch (error) {
    uiStore.showError('Failed to update milestone: ' + error.message)
  }
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
      status: 'planning',
      taskIds: [] // Don't copy linked tasks
    }
    
    await tasksStore.createRoadmapItem(newItem)
    uiStore.showSuccess('Milestone duplicated successfully')
  } catch (error) {
    uiStore.showError('Failed to duplicate milestone: ' + error.message)
  }
}

// Task linking functions
const openTaskLinkDialog = (milestone) => {
  selectedMilestone.value = milestone
  showTaskLinkDialog.value = true
}

const isTaskLinked = (taskId) => {
  return selectedMilestone.value?.taskIds?.includes(taskId) || false
}

const toggleTaskLink = (taskId) => {
  if (!selectedMilestone.value) return
  
  const taskIds = selectedMilestone.value.taskIds || []
  if (taskIds.includes(taskId)) {
    // Remove task
    selectedMilestone.value.taskIds = taskIds.filter(id => id !== taskId)
  } else {
    // Add task
    selectedMilestone.value.taskIds = [...taskIds, taskId]
  }
}

const saveTaskLinks = async () => {
  if (!selectedMilestone.value) return
  
  try {
    await tasksStore.updateRoadmapItem(selectedMilestone.value.id, {
      taskIds: selectedMilestone.value.taskIds || []
    })
    uiStore.showSuccess('Task links updated successfully')
    showTaskLinkDialog.value = false
  } catch (error) {
    uiStore.showError('Failed to update task links: ' + error.message)
  }
}

const saveMilestone = async () => {
  if (!milestoneFormValid.value) return
  
  saving.value = true
  try {
    const milestoneData = {
      ...milestoneForm,
      projectId: currentProjectId.value
    }
    
    if (editingMilestone.value) {
      await tasksStore.updateRoadmapItem(editingMilestone.value.id, milestoneData)
      uiStore.showSuccess('Milestone updated successfully')
    } else {
      await tasksStore.createRoadmapItem(milestoneData)
      uiStore.showSuccess('Milestone created successfully')
    }
    
    cancelMilestoneEdit()
  } catch (error) {
    uiStore.showError('Failed to save milestone: ' + error.message)
  } finally {
    saving.value = false
  }
}

const handleMilestoneUpdated = async (milestone) => {
  try {
    if (milestone.id) {
      // Update existing milestone
      await tasksStore.updateRoadmapItem(milestone.id, milestone)
      uiStore.showSuccess('Milestone updated successfully')
    } else {
      // Create new milestone (for duplicate functionality)
      await tasksStore.createRoadmapItem(milestone)
      uiStore.showSuccess('Milestone created successfully')
    }
  } catch (error) {
    uiStore.showError('Failed to update milestone: ' + error.message)
  }
}

const handleMilestoneDeleted = async (milestoneId) => {
  try {
    await tasksStore.deleteRoadmapItem(milestoneId)
    uiStore.showSuccess('Milestone deleted successfully')
    showDetailsDialog.value = false
  } catch (error) {
    uiStore.showError('Failed to delete milestone: ' + error.message)
  }
}

const handleTaskUnlinked = async (milestoneId, taskId) => {
  try {
    // Remove task from milestone's taskIds
    const milestone = roadmapItems.value.find(item => item.id === milestoneId)
    if (milestone && milestone.taskIds) {
      const updatedTaskIds = milestone.taskIds.filter(id => id !== taskId)
      await tasksStore.updateRoadmapItem(milestoneId, { taskIds: updatedTaskIds })
      uiStore.showSuccess('Task unlinked successfully')
    }
  } catch (error) {
    uiStore.showError('Failed to unlink task: ' + error.message)
  }
}

const getStatusColor = (status) => {
  const colors = {
    planning: 'grey',
    inprogress: 'primary',
    completed: 'success',
    'on-hold': 'warning',
    overdue: 'error'
  }
  return colors[status] || 'grey'
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

// Watch for project changes
watch(currentProjectId, (newProjectId) => {
  if (newProjectId) {
    console.log('Project changed to:', newProjectId)
  }
})

// Watch for timeRange changes and update timeline
watch(timeRange, (newTimeRange, oldTimeRange) => {
  console.log('Time range changed from', oldTimeRange, 'to', newTimeRange)
  // Update timeline window when time range changes
  nextTick(() => {
    if (timelineRef.value) {
      const timeRangeOptions = getTimeRangeOptions()
      console.log('Setting timeline window:', timeRangeOptions)
      timelineRef.value.setWindow(timeRangeOptions.min, timeRangeOptions.max)
    }
  })
})

// Watch for filtered items changes to update timeline
watch(roadmapItems, (newItems, oldItems) => {
  console.log('Roadmap items changed:', { 
    oldCount: oldItems?.length || 0, 
    newCount: newItems?.length || 0 
  })
  // Timeline will automatically update via timelineItems computed property
}, { deep: true })

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

// Watch for dialog opening to ensure form is populated
watch(showCreateDialog, (isOpen) => {
  if (isOpen && editingMilestone.value) {
    // Ensure the form is populated when dialog opens
    nextTick(() => {
      const formData = {
        title: editingMilestone.value.title || '',
        description: editingMilestone.value.description || '',
        type: editingMilestone.value.type || 'milestone',
        status: editingMilestone.value.status || 'planning',
        startDate: editingMilestone.value.startDate || editingMilestone.value.start || '',
        endDate: editingMilestone.value.endDate || editingMilestone.value.end || '',
        taskIds: editingMilestone.value.taskIds || []
      }
      // Use Object.assign to update reactive object
      Object.assign(milestoneForm, formData)
    })
  }
})
</script>

<style scoped>
.roadmap-view {
  min-height: 100vh;
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

.list-container {
  min-height: 400px;
}

/* Dialog styling to match task dialogs */
:deep(.v-text-field .v-input__control) {
  min-height: 56px;
}

:deep(.v-textarea .v-input__control) {
  min-height: auto;
}

:deep(.v-select .v-input__control) {
  min-height: 56px;
}

/* Override for compact filter fields to match Projects view */
:deep(.v-input--density-compact .v-field__input) {
  padding: 8px 12px !important;
  min-height: 40px !important;
}

:deep(.v-input--density-compact .v-field) {
  min-height: 40px !important;
}

:deep(.v-input--density-compact .v-input__control) {
  min-height: 40px !important;
}

/* Timeline styling enhancements */
:deep(.timeline-container) {
  transition: height 0.3s ease;
}

/* Milestone items styling */
:deep(.vis-item.milestone-planning) {
  background-color: #9E9E9E !important;
  border-color: #757575 !important;
}

:deep(.vis-item.milestone-inprogress) {
  background-color: #2196F3 !important;
  border-color: #1976D2 !important;
}

:deep(.vis-item.milestone-completed) {
  background-color: #4CAF50 !important;
  border-color: #388E3C !important;
}

:deep(.vis-item.milestone-on-hold) {
  background-color: #FF9800 !important;
  border-color: #F57C00 !important;
}

:deep(.vis-item.milestone-overdue) {
  background-color: #F44336 !important;
  border-color: #D32F2F !important;
}

/* Task items styling - with better positioning */
:deep(.vis-item.task-backlog) {
  background-color: #9E9E9E !important;
  border-color: #757575 !important;
  opacity: 0.8;
  height: 20px !important;
  margin: 2px 0 !important;
}

:deep(.vis-item.task-todo) {
  background-color: #2196F3 !important;
  border-color: #1976D2 !important;
  opacity: 0.8;
  height: 20px !important;
  margin: 2px 0 !important;
}

:deep(.vis-item.task-inprogress) {
  background-color: #FF9800 !important;
  border-color: #F57C00 !important;
  opacity: 0.8;
  height: 20px !important;
  margin: 2px 0 !important;
}

:deep(.vis-item.task-review) {
  background-color: #9C27B0 !important;
  border-color: #7B1FA2 !important;
  opacity: 0.8;
  height: 20px !important;
  margin: 2px 0 !important;
}

:deep(.vis-item.task-done) {
  background-color: #4CAF50 !important;
  border-color: #388E3C !important;
  opacity: 0.8;
  height: 20px !important;
  margin: 2px 0 !important;
}

/* Ensure task groups have proper height and show all tasks */
:deep(.vis-group[id^="milestone-"]) {
  min-height: 80px !important;
  height: auto !important;
  max-height: none !important;
  padding: 5px 0 !important;
  border: 1px solid rgba(0,0,0,0.1) !important;
  overflow: visible !important;
  display: block !important;
}

/* Task group styling with flexible height */
:deep(.vis-group.task-group) {
  background-color: rgba(0, 0, 0, 0.05) !important;
  border-left: 3px solid #1976D2 !important;
  border-top: 1px solid rgba(0,0,0,0.1) !important;
  border-bottom: 1px solid rgba(0,0,0,0.1) !important;
  min-height: 80px !important;
  height: auto !important;
  max-height: none !important;
  padding: 5px 0 !important;
  margin: 1px 0 !important;
  overflow: visible !important;
  box-sizing: border-box !important;
  display: block !important;
}

/* Force proper stacking for task items with smaller size to fit more */
:deep(.vis-item[id^="task-"]) {
  height: 18px !important;
  margin: 1px 0 !important;
  position: relative !important;
  z-index: 1 !important;
  display: block !important;
  overflow: visible !important;
}

/* Better spacing for all task items */
:deep(.vis-item.task-backlog),
:deep(.vis-item.task-todo),
:deep(.vis-item.task-inprogress),
:deep(.vis-item.task-review),
:deep(.vis-item.task-done) {
  height: 18px !important;
  margin: 1px 0 !important;
  display: block !important;
  position: relative !important;
  overflow: visible !important;
  font-size: 11px !important;
}

/* Ensure timeline container allows all content to be visible */
:deep(.vis-timeline) {
  height: auto !important;
  max-height: 800px !important;
  overflow-y: auto !important;
}

/* Group headers should be visible */
:deep(.vis-labelset .vis-vlabel) {
  height: auto !important;
  max-height: none !important;
  overflow: visible !important;
}

/* Force the timeline panel to show all content */
:deep(.vis-timeline .vis-panel.vis-center) {
  overflow-y: visible !important;
  height: auto !important;
}

/* Ensure item set shows all items */
:deep(.vis-itemset) {
  height: auto !important;
  max-height: none !important;
  overflow: visible !important;
}

/* Dependencies styling */
:deep(.vis-dependency) {
  stroke: #666 !important;
  stroke-width: 2px !important;
  marker-end: url(#arrowhead) !important;
}

:deep(.vis-dependency:hover) {
  stroke: #1976D2 !important;
  stroke-width: 3px !important;
}

/* Responsive design */
@media (max-width: 600px) {
  :deep(.v-dialog .v-card) {
    margin: 12px;
  }
  
  .timeline-container {
    height: 400px !important;
  }
}
</style>