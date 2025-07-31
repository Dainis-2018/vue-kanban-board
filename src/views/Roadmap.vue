<!-- src/views/Roadmap.vue -->
<template>
  <div class="roadmap-view pa-4">
    <!-- Header -->
    <div class="roadmap-header mb-4">
      <v-row align="center">
        <v-col cols="12" md="6">
          <div class="d-flex align-center">
            <v-icon size="28" class="mr-3">mdi-map</v-icon>
            <div>
              <h1 class="text-h5 font-weight-bold">Roadmap</h1>
              <p class="text-body-2 text-medium-emphasis mb-0">
                {{ currentProject?.name || 'Project Timeline' }}
              </p>
            </div>
          </div>
        </v-col>
        
        <v-col cols="12" md="6">
          <div class="d-flex align-center justify-end ga-2">
            <!-- View Mode Toggle -->
            <v-btn-toggle
              v-model="viewMode"
              mandatory
              variant="outlined"
              divided
            >
              <v-btn value="timeline" icon="mdi-timeline" />
              <v-btn value="list" icon="mdi-format-list-bulleted" />
            </v-btn-toggle>
            
            <!-- Time Range (for timeline view) -->
            <v-menu v-if="viewMode === 'timeline'">
              <template #activator="{ props }">
                <v-btn v-bind="props" variant="outlined" prepend-icon="mdi-calendar">
                  {{ timeRange }}
                </v-btn>
              </template>
              <v-list>
                <v-list-item @click="setTimeRange('3months')">3 Months</v-list-item>
                <v-list-item @click="setTimeRange('6months')">6 Months</v-list-item>
                <v-list-item @click="setTimeRange('1year')">1 Year</v-list-item>
                <v-list-item @click="setTimeRange('custom')">Custom</v-list-item>
              </v-list>
            </v-menu>
            
            <!-- Options Menu -->
            <v-menu>
              <template #activator="{ props }">
                <v-btn v-bind="props" icon="mdi-dots-vertical" variant="outlined" />
              </template>
              <v-list>
                <v-list-item @click="showLinkedTasks = !showLinkedTasks">
                  <template #prepend>
                    <v-icon>{{ showLinkedTasks ? 'mdi-eye' : 'mdi-eye-off' }}</v-icon>
                  </template>
                  <v-list-item-title>Show Linked Tasks</v-list-item-title>
                </v-list-item>
                
                <v-list-item @click="showDependencies = !showDependencies">
                  <template #prepend>
                    <v-icon>{{ showDependencies ? 'mdi-eye' : 'mdi-eye-off' }}</v-icon>
                  </template>
                  <v-list-item-title>Show Dependencies</v-list-item-title>
                </v-list-item>
                
                <v-divider />
                
                <v-list-subheader>Group By</v-list-subheader>
                <v-list-item @click="groupBy = 'none'">
                  <template #prepend>
                    <v-icon>{{ groupBy === 'none' ? 'mdi-radiobox-marked' : 'mdi-radiobox-blank' }}</v-icon>
                  </template>
                  <v-list-item-title>None</v-list-item-title>
                </v-list-item>
                
                <v-list-item @click="groupBy = 'type'">
                  <template #prepend>
                    <v-icon>{{ groupBy === 'type' ? 'mdi-radiobox-marked' : 'mdi-radiobox-blank' }}</v-icon>
                  </template>
                  <v-list-item-title>Type</v-list-item-title>
                </v-list-item>
                
                <v-list-item @click="groupBy = 'team'">
                  <template #prepend>
                    <v-icon>{{ groupBy === 'team' ? 'mdi-radiobox-marked' : 'mdi-radiobox-blank' }}</v-icon>
                  </template>
                  <v-list-item-title>Team</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
            
            <!-- Create Button -->
            <v-btn
              color="primary"
              prepend-icon="mdi-plus"
              @click="showCreateDialog = true"
            >
              Create Milestone
            </v-btn>
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
          <v-form ref="milestoneFormRef" v-model="milestoneFormValid" :key="formKey">
            <v-text-field
              v-model="formTitle"
              label="Title"
              variant="outlined"
              :rules="[v => !!v || 'Title is required']"
              required
            />
            
            <v-textarea
              v-model="formDescription"
              label="Description"
              variant="outlined"
              rows="3"
            />

            <v-row>
              <v-col cols="6">
                <v-select
                  v-model="formType"
                  label="Type"
                  variant="outlined"
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
                  v-model="formStatus"
                  label="Status"
                  variant="outlined"
                  :items="[
                    { title: 'Planned', value: 'planned' },
                    { title: 'In Progress', value: 'in-progress' },
                    { title: 'In Progress', value: 'inprogress' },
                    { title: 'Completed', value: 'completed' },
                    { title: 'On Hold', value: 'on-hold' }
                  ]"
                />
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="6">
                <v-text-field
                  v-model="formStartDate"
                  label="Start Date"
                  type="date"
                  variant="outlined"
                  :rules="[v => !!v || 'Start date is required']"
                  required
                />
              </v-col>
              
              <v-col cols="6">
                <v-text-field
                  v-model="formEndDate"
                  label="End Date"
                  type="date"
                  variant="outlined"
                  :rules="[
                    v => !!v || 'End date is required',
                    v => !formStartDate || new Date(v) > new Date(formStartDate) || 'End date must be after start date'
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
          <v-btn @click="cancelMilestoneEdit">Cancel</v-btn>
          <v-btn
            color="primary"
            :loading="saving"
            :disabled="!milestoneFormValid"
            @click="saveMilestone"
          >
            {{ editingMilestone ? 'Update' : 'Create' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Milestone Details Dialog -->
    <MilestoneDetailsDialog
      v-model="showDetailsDialog"
      :milestone="selectedMilestone"
      :linked-tasks="linkedTasks"
      @milestone-edit="handleMilestoneEdit"
      @milestone-updated="handleMilestoneUpdated"
      @milestone-deleted="handleMilestoneDeleted"
      @task-unlinked="handleTaskUnlinked"
      @link-tasks="openTaskLinkDialog"
    />

    <!-- Task Link Dialog -->
    <v-dialog
      v-model="showTaskLinkDialog"
      max-width="700"
      scrollable
    >
      <v-card v-if="selectedMilestone">
        <v-card-title>
          Link Tasks to {{ selectedMilestone.title }}
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
                  <div class="d-flex align-center ga-2">
                    <v-checkbox
                      :model-value="isTaskLinked(task.id)"
                      @update:model-value="toggleTaskLink(task.id)"
                    />
                    <v-chip size="x-small" :color="getPriorityColor(task.priority)">
                      {{ task.priority }}
                    </v-chip>
                  </div>
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
import { ref, computed, watch, onMounted, nextTick, triggerRef, reactive } from 'vue'
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
const formKey = ref(0) // Add key to force form re-render

// Form data - back to ref for template compatibility
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

// Get project tasks
const projectTasks = computed(() => {
  if (!currentProjectId.value) return []
  return tasksStore.getTasksByProject(currentProjectId.value)
})

// Timeline data computed properties
const timelineData = computed(() => {
  return roadmapItems.value.map(item => ({
    id: item.id,
    content: item.title,
    start: item.startDate || item.start,
    end: item.endDate || item.end,
    type: 'range',
    className: `milestone-${item.status}`,
    group: getItemGroup(item),
    style: `background-color: ${getMilestoneTypeColor(item.type)};`,
    title: `${item.title}\n${item.description || ''}\nProgress: ${getMilestoneProgress(item.id)}%`
  }))
})

const timelineGroups = computed(() => {
  if (groupBy.value === 'none') return null
  
  const groups = new Set()
  roadmapItems.value.forEach(item => {
    const group = getItemGroup(item)
    if (group) groups.add(group)
  })
  
  return Array.from(groups).map(group => ({
    id: group,
    content: group,
    order: group === 'unassigned' ? 999 : 0
  }))
})

const timelineOptions = computed(() => ({
  ...getTimeRangeOptions(),
  orientation: 'top',
  stack: true,
  showCurrentTime: true,
  format: {
    minorLabels: {
      month: 'MMM',
      week: 'w'
    }
  },
  margin: {
    item: 10,
    axis: 5
  },
  editable: {
    add: false,
    updateTime: true,
    updateGroup: false,
    remove: false
  }
}))

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

// Computed properties for form fields to ensure reactivity
const formTitle = computed({
  get: () => milestoneForm.title,
  set: (value) => milestoneForm.title = value
})

const formDescription = computed({
  get: () => milestoneForm.description,
  set: (value) => milestoneForm.description = value
})

const formType = computed({
  get: () => milestoneForm.type,
  set: (value) => milestoneForm.type = value
})

const formStatus = computed({
  get: () => milestoneForm.status,
  set: (value) => milestoneForm.status = value
})

const formStartDate = computed({
  get: () => milestoneForm.startDate,
  set: (value) => milestoneForm.startDate = value
})

const formEndDate = computed({
  get: () => milestoneForm.endDate,
  set: (value) => milestoneForm.endDate = value
})

// Helper functions
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
  const milestone = roadmapItems.value.find(i => i.id === item.id)
  selectedMilestone.value = milestone
  showDetailsDialog.value = true
}

const handleGroupSelected = (group) => {
  console.log('Group selected:', group)
}

// Milestone editing functions
const handleMilestoneEdit = (milestone) => {
  console.log('Edit milestone:', milestone?.title) // Minimal debug
  
  if (!milestone) {
    console.error('No milestone data provided for editing')
    uiStore.showError('No milestone data available for editing')
    return
  }
  
  // Set the milestone as the editing target
  editingMilestone.value = { ...milestone }
  
  // Populate the form with milestone data - handle both date formats
  const formData = {
    title: milestone.title || '',
    description: milestone.description || '',
    type: milestone.type || 'milestone',
    status: milestone.status || 'planned',
    startDate: milestone.startDate || milestone.start || '',
    endDate: milestone.endDate || milestone.end || '',
    taskIds: milestone.taskIds || []
  }
  
  console.log('Setting form data:', formData.title, formData.type) // Minimal debug
  
  // Use Object.assign to update reactive object
  Object.assign(milestoneForm, formData)
  
  console.log('Form after set:', milestoneForm.title) // Minimal debug
  
  // Show the create/edit dialog
  showCreateDialog.value = true
  
  // Force update after dialog is shown
  nextTick(() => {
    console.log('nextTick - Form title:', milestoneForm.title)
    formKey.value++ // Force form re-render
  })
  
  // Show the create/edit dialog
  showCreateDialog.value = true
  
  // Close the details dialog
  showDetailsDialog.value = false
}

const editRoadmapItem = (item) => {
  handleMilestoneEdit(item)
}

const cancelMilestoneEdit = () => {
  showCreateDialog.value = false
  editingMilestone.value = null
  
  // Reset form data using Object.assign
  Object.assign(milestoneForm, {
    title: '',
    description: '',
    type: 'milestone',
    status: 'planned',
    startDate: '',
    endDate: '',
    taskIds: []
  })
  
  // Reset form validation
  nextTick(() => {
    if (milestoneForm) {
      milestoneForm.resetValidation?.()
    }
  })
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

// Watch for dialog opening to ensure form is populated
watch(showCreateDialog, (isOpen, wasOpen) => {
  if (isOpen && editingMilestone.value) {
    // Ensure the form is populated when dialog opens
    nextTick(() => {
      const formData = {
        title: editingMilestone.value.title || '',
        description: editingMilestone.value.description || '',
        type: editingMilestone.value.type || 'milestone',
        status: editingMilestone.value.status || 'planned',
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