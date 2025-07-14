<template>
  <div class="kanban-view">
    <!-- Header Controls -->
    <div class="kanban-header mb-4">
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
                {{ currentProject?.name || 'Kanban Board' }}
              </h1>
              <p class="text-body-2 text-medium-emphasis mb-0">
                {{ activeTasks.length }} active tasks • {{ completedTasks.length }} completed
              </p>
            </div>
          </div>
        </v-col>
        
        <v-col cols="12" md="6" class="text-md-right">
          <div class="d-flex align-center justify-end flex-wrap ga-2">
            <!-- Simple Add Task Button -->
            <v-btn
              color="primary"
              prepend-icon="mdi-plus"
              size="small"
              @click="handleAddTask(null)"
            >
              Add Task
            </v-btn>
          </div>
        </v-col>
      </v-row>
      
      <!-- Search -->
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
            class="search-field"
          />
        </v-col>
      </v-row>
    </div>

    <!-- Kanban Board Container -->
    <div class="kanban-container">
      <!-- Column View with Simple Cards -->
      <div class="kanban-board">
        <div
          v-for="column in visibleColumns"
          :key="column.id"
          class="kanban-column"
        >
          <!-- Column Header -->
          <v-card elevation="2" class="column-card">
            <v-card-title class="d-flex align-center justify-space-between pa-3">
              <div class="d-flex align-center">
                <v-icon :color="column.color" class="mr-2">
                  {{ column.icon }}
                </v-icon>
                <span class="text-subtitle-1 font-weight-bold">
                  {{ column.title }}
                </span>
                <v-chip
                  size="small"
                  variant="outlined"
                  class="ml-2"
                >
                  {{ (tasksByColumn.get(column.id) || []).length }}
                </v-chip>
              </div>
            </v-card-title>
            
            <v-divider />

            <!-- Tasks Container -->
            <div class="tasks-container pa-2">
              <!-- Task List -->
              <div class="tasks-list">
                <!-- Draggable Task List -->
                <draggable
                  :list="tasksByColumn.get(column.id) || []"
                  :key="column.id"
                  group="tasks"
                  item-key="id"
                  class="task-dropzone"
                  ghost-class="task-ghost"
                  chosen-class="task-chosen"
                  drag-class="task-drag"
                  :animation="200"
                  @change="(event) => handleTaskChange(event, column.id)"
                >
                  <template #item="{ element: task }">
                    <v-card
                      class="task-card mb-2"
                      elevation="1"
                      @click="openTaskDetails(task)"
                    >
                      <v-card-text class="pa-3">
                        <!-- Task Header -->
                        <div class="d-flex align-center justify-space-between mb-2">
                          <v-chip
                            :color="getPriorityColor(task.priority)"
                            size="x-small"
                            variant="flat"
                          >
                            {{ task.priority }}
                          </v-chip>
                        </div>

                        <!-- Task Title -->
                        <h4 class="text-subtitle-2 font-weight-bold mb-2">
                          {{ task.title }}
                        </h4>

                        <!-- Task Description -->
                        <p 
                          v-if="task.description"
                          class="text-body-2 text-medium-emphasis mb-2"
                        >
                          {{ task.description.length > 100 ? 
                            task.description.substring(0, 100) + '...' : 
                            task.description 
                          }}
                        </p>

                        <!-- Task Tags -->
                        <div v-if="task.tags && task.tags.length > 0" class="mb-2">
                          <v-chip
                            v-for="tag in task.tags.slice(0, 3)"
                            :key="tag"
                            size="x-small"
                            variant="outlined"
                            class="mr-1 mb-1"
                          >
                            {{ tag }}
                          </v-chip>
                        </div>

                        <!-- Task Footer -->
                        <div class="d-flex align-center justify-space-between">
                          <!-- Due Date -->
                          <div v-if="task.dueDate" class="d-flex align-center">
                            <v-icon 
                              size="16" 
                              :color="isOverdue(task.dueDate) ? 'error' : 'grey'"
                              class="mr-1"
                            >
                              mdi-calendar
                            </v-icon>
                            <span 
                              class="text-caption"
                              :class="isOverdue(task.dueDate) ? 'text-error' : ''"
                            >
                              {{ formatDate(task.dueDate) }}
                            </span>
                          </div>
                          
                          <!-- Assignee -->
                          <v-avatar
                            v-if="task.assigneeId"
                            size="24"
                          >
                            <span class="text-caption">
                              {{ getAssigneeName(task.assigneeId)?.charAt(0) }}
                            </span>
                          </v-avatar>
                        </div>
                      </v-card-text>
                    </v-card>
                  </template>
                  <template #footer>
                    <div v-if="(tasksByColumn.get(column.id) || []).length === 0" class="empty-column">
                      <div class="empty-content">
                        <v-icon size="48" color="grey-lighten-2" class="mb-2">
                          mdi-clipboard-text-outline
                        </v-icon>
                        <p class="text-body-2 text-medium-emphasis mb-3">
                          No tasks in {{ column.title.toLowerCase() }}
                        </p>
                      </div>
                    </div>
                  </template>
                </draggable>
              </div>

              <!-- Add Task Button -->
              <div class="add-task-section">
                <v-btn
                  variant="outlined"
                  block
                  size="small"
                  prepend-icon="mdi-plus"
                  class="add-task-btn"
                  @click="handleAddTask(column.id)"
                >
                  Add Task
                </v-btn>
              </div>
            </div>
          </v-card>
        </div>
      </div>
    </div>

    <!-- Empty State for No Tasks -->
    <v-card v-if="allTasks.length === 0" class="text-center pa-8 ma-4">
      <v-icon size="64" color="grey-lighten-2" class="mb-4">
        mdi-clipboard-text-outline
      </v-icon>
      <h3 class="text-h6 mb-2">No tasks found</h3>
      <p class="text-body-2 text-medium-emphasis mb-4">
        Get started by creating your first task.
      </p>
      <v-btn
        color="primary"
        prepend-icon="mdi-plus"
        @click="handleAddTask(null)"
      >
        Create First Task
      </v-btn>
    </v-card>

    <!-- Simple Task Creation Dialog -->
    <QuickTaskDialog
      v-model="showQuickAdd"
      :project-id="currentProjectId"
      :columns="kanbanColumns"
      :users="projectUsers"
      :default-column-id="quickAddDefaultColumnId"
    />

    <!-- Task Details Dialog -->
    <TaskDetailsDialog
      v-model="showTaskDetails"
      :task="selectedTask"
      :project-users="projectUsers"
      :columns="kanbanColumns"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProjectsStore } from '@/stores/projects'
import { useTasksStore } from '@/stores/tasks'
import { useUIStore } from '@/stores/ui'
import draggable from 'vuedraggable'
import QuickTaskDialog from '@/components/task/QuickTaskDialog.vue'
import TaskDetailsDialog from '@/components/task/TaskDetailsDialog.vue'

// Composables
const route = useRoute()
const router = useRouter()
const projectsStore = useProjectsStore()
const tasksStore = useTasksStore()
const uiStore = useUIStore()

// Local state
const loading = ref(false)
const searchQuery = ref('')
const showQuickAdd = ref(false)
const showTaskDetails = ref(false)
const selectedTask = ref(null)
const quickAddDefaultColumnId = ref(null)

// Store getters
const currentProject = computed(() => projectsStore.currentProject)
const currentProjectId = computed(() => projectsStore.currentProjectId)
const projectUsers = computed(() => projectsStore.projectUsers)
const kanbanColumns = computed(() => tasksStore.kanbanColumns || [])
const allTasks = computed(() => {
  const projectId = currentProjectId.value
  if (!projectId) return []
  return tasksStore.getTasksByProject(projectId) || []
})

// Computed properties
const visibleColumns = computed(() => 
  kanbanColumns.value
    .filter(col => !col.collapsed)
    .sort((a, b) => a.order - b.order)
)

const filteredTasks = computed(() => {
  let tasks = allTasks.value

  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    tasks = tasks.filter(task =>
      task.title.toLowerCase().includes(query) ||
      task.description?.toLowerCase().includes(query) ||
      task.tags?.some(tag => tag.toLowerCase().includes(query))
    )
  }

  return tasks
})

const activeTasks = computed(() => 
  filteredTasks.value.filter(task => task.columnId !== 'done')
)

const completedTasks = computed(() => 
  filteredTasks.value.filter(task => task.columnId === 'done')
)

const columnOptions = computed(() =>
  kanbanColumns.value.map(column => ({
    title: column.title,
    value: column.id
  }))
)

// Methods
const tasksByColumn = computed(() => {
  const map = new Map()
  // Initialize map with all visible columns to ensure reactivity
  visibleColumns.value.forEach(column => {
    map.set(column.id, [])
  })

  // Distribute filtered tasks into columns
  filteredTasks.value.forEach(task => {
    if (map.has(task.columnId)) {
      map.get(task.columnId).push(task)
    }
  })

  // Sort tasks within each column
  map.forEach((tasks) => {
    tasks.sort((a, b) => (a.order || 0) - (b.order || 0))
  })

  return map
})


const openTaskDetails = (task) => {
  selectedTask.value = task
  showTaskDetails.value = true
}

const handleAddTask = (columnId) => {
  quickAddDefaultColumnId.value = columnId
  showQuickAdd.value = true
}

const handleTaskChange = async (event, columnId) => {
  // Handle task added to this column (from another column)
  if (event.added) {
    const { element: task, newIndex } = event.added
    await handleTaskMove(task.id, columnId, newIndex)
  }
  
  // Handle task reordered within the same column
  if (event.moved) {
    const { element: task, newIndex } = event.moved
    await handleTaskReorder(task.id, newIndex)
  }
}

const handleTaskMove = async (taskId, newColumnId, newIndex = 0) => {
  try {
    await tasksStore.moveTask(taskId, newColumnId, newIndex)
    uiStore.showSuccess('Task moved successfully')
  } catch (error) {
    uiStore.showError('Failed to move task: ' + error.message)
  }
}

const handleTaskReorder = async (taskId, newIndex) => {
  try {
    await tasksStore.reorderTask(taskId, newIndex)
  } catch (error) {
    uiStore.showError('Failed to reorder task: ' + error.message)
  }
}

// Helper methods
const getPriorityColor = (priority) => {
  const colors = {
    critical: 'error',
    high: 'warning',
    medium: 'info',
    low: 'success'
  }
  return colors[priority] || 'grey'
}

const getAssigneeName = (userId) => {
  const user = projectsStore.getUserById(userId)
  return user?.name || 'Unknown User'
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  })
}

const isOverdue = (dueDate) => {
  if (!dueDate) return false
  return new Date(dueDate) < new Date()
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
  // Initialize stores if needed
  if (!projectsStore.currentProjectId) {
    projectsStore.initializeCurrentProject()
  }
})

// Watchers
watch(() => route.params.projectId, (newProjectId) => {
  if (newProjectId && newProjectId !== currentProjectId.value) {
    projectsStore.setCurrentProject(newProjectId)
  }
})
</script>

<style scoped>
.kanban-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.kanban-container {
  overflow: hidden;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.kanban-board {
  display: flex;
  gap: 16px;
  flex-grow: 1;
  overflow-x: auto;
  overflow-y: hidden;
  padding: 0 8px 16px 8px;
}

.kanban-column {
  min-width: 300px;
  max-width: 350px;
  display: flex;
  flex-direction: column;
}

.column-card {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.tasks-container {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
}

.tasks-list {
  flex-grow: 1;
  overflow-y: auto;
  padding-right: 4px;
}

.task-dropzone {
  min-height: 100px;
}

.task-card {
  cursor: pointer;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  background: rgb(var(--v-theme-surface));
}

.task-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  border-color: rgba(var(--v-theme-primary), 0.3);
}

.empty-column {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  min-height: 120px;
}

.empty-content {
  text-align: center;
  opacity: 0.6;
}

.add-task-section {
  flex-shrink: 0;
  margin-top: 8px;
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  padding-top: 8px;
  background: rgba(var(--v-theme-surface-variant), 0.1);
}

.add-task-btn {
  opacity: 0.7;
  transition: opacity 0.2s ease;
}

.kanban-column:hover .add-task-btn {
  opacity: 1;
}

/* Drag & Drop Styles */
.task-ghost {
  opacity: 0.5;
  transform: rotate(2deg);
  background: rgba(var(--v-theme-primary), 0.1) !important;
  border: 2px dashed rgba(var(--v-theme-primary), 0.3) !important;
}

.task-chosen {
  transform: scale(1.02);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2) !important;
  z-index: 1000;
}

.task-drag {
  transform: rotate(2deg);
  z-index: 1000;
  opacity: 0.9;
}

.search-field {
  max-width: 400px;
}

/* Custom scrollbar */
.tasks-list::-webkit-scrollbar {
  width: 4px;
}

.tasks-list::-webkit-scrollbar-track {
  background: transparent;
}

.tasks-list::-webkit-scrollbar-thumb {
  background: rgba(var(--v-theme-on-surface), 0.2);
  border-radius: 2px;
}

.kanban-board::-webkit-scrollbar {
  height: 8px;
}

.kanban-board::-webkit-scrollbar-track {
  background: rgb(var(--v-theme-surface-variant));
  border-radius: 4px;
}

.kanban-board::-webkit-scrollbar-thumb {
  background: rgba(var(--v-theme-on-surface), 0.3);
  border-radius: 4px;
}

@media (max-width: 960px) {
  .kanban-container {
  }
  
  .kanban-board {
    gap: 12px;
    padding: 0 4px 12px 4px;
  }
  
  .kanban-column {
    min-width: 250px;
    max-width: 300px;
  }
}

@media (max-width: 600px) {
  .kanban-column {
    min-width: 280px;
    max-width: 100%;
  }
}
</style>