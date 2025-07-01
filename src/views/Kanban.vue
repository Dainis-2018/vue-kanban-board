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
            <!-- View Controls -->
            <v-btn-toggle
              v-model="viewOptions.showSwimlanes"
              variant="outlined"
              size="small"
            >
              <v-btn :value="false" prepend-icon="mdi-view-column">
                Columns
              </v-btn>
              <v-btn :value="true" prepend-icon="mdi-view-stream">
                Swimlanes
              </v-btn>
            </v-btn-toggle>
            
            <!-- Filters -->
            <v-menu offset-y>
              <template #activator="{ props }">
                <v-btn
                  v-bind="props"
                  variant="outlined"
                  size="small"
                  prepend-icon="mdi-filter"
                  :color="hasActiveFilters ? 'primary' : ''"
                >
                  Filter
                  <v-badge
                    v-if="activeFilterCount > 0"
                    :content="activeFilterCount"
                    color="primary"
                    inline
                    class="ml-1"
                  />
                </v-btn>
              </template>
              
              <FilterPanel
                v-model:assignee="filters.assignee"
                v-model:priority="filters.priority"
                v-model:tags="filters.tags"
                v-model:dueDate="filters.dueDate"
                :project-users="projectUsers"
                @clear="clearFilters"
              />
            </v-menu>
            
            <!-- Quick Add -->
            <v-btn
              color="primary"
              size="small"
              prepend-icon="mdi-plus"
              @click="showQuickAdd = true"
            >
              Add Task
            </v-btn>
            
            <!-- Board Settings -->
            <v-menu offset-y>
              <template #activator="{ props }">
                <v-btn
                  v-bind="props"
                  icon="mdi-cog"
                  variant="text"
                  size="small"
                />
              </template>
              
              <BoardSettings
                :columns="kanbanColumns"
                @update-column="updateColumn"
                @reorder-columns="reorderColumns"
              />
            </v-menu>
          </div>
        </v-col>
      </v-row>
    </div>

    <!-- Search Bar -->
    <v-card class="mb-4" v-if="!viewOptions.showSwimlanes">
      <v-card-text class="py-3">
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
      </v-card-text>
    </v-card>

    <!-- Kanban Board Container -->
    <div class="kanban-container" :class="{ 'with-swimlanes': viewOptions.showSwimlanes }">
      <!-- Column Headers (when not using swimlanes) -->
      <div v-if="!viewOptions.showSwimlanes" class="kanban-board">
        <KanbanColumn
          v-for="column in visibleColumns"
          :key="column.id"
          :column="column"
          :tasks="getColumnTasks(column.id)"
          :project-id="currentProjectId"
          @task-moved="handleTaskMoved"
          @task-click="openTaskDetails"
          @add-task="openTaskForm"
          @column-toggle="toggleColumnCollapse"
        />
      </div>
      
      <!-- Swimlane View -->
      <KanbanSwimlanes
        v-else
        :columns="visibleColumns"
        :tasks="filteredTasks"
        :project-id="currentProjectId"
        :search-query="searchQuery"
        @task-moved="handleTaskMoved"
        @task-click="openTaskDetails"
        @add-task="openTaskForm"
      />
    </div>

    <!-- Quick Add Task Dialog -->
    <QuickTaskDialog
      v-model="showQuickAdd"
      :project-id="currentProjectId"
      :default-column="'todo'"
      @task-created="handleTaskCreated"
    />

    <!-- Task Details Dialog -->
    <TaskDetailsDialog
      v-model="showTaskDetails"
      :task="selectedTask"
      @task-updated="handleTaskUpdated"
      @task-deleted="handleTaskDeleted"
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
      v-if="!loading && filteredTasks.length === 0"
      class="text-center pa-8 mt-8"
    >
      <v-icon size="64" color="medium-emphasis" class="mb-4">
        mdi-clipboard-text-outline
      </v-icon>
      <h3 class="text-h6 mb-2">No Tasks Found</h3>
      <p class="text-body-2 text-medium-emphasis mb-4">
        {{ hasActiveFilters ? 'Try adjusting your filters or search terms.' : 'Get started by creating your first task.' }}
      </p>
      <v-btn
        color="primary"
        prepend-icon="mdi-plus"
        @click="showQuickAdd = true"
      >
        Create First Task
      </v-btn>
    </v-card>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProjectsStore } from '@/stores/projects'
import { useTasksStore } from '@/stores/tasks'
import { useUIStore } from '@/stores/ui'
import KanbanColumn from '@/components/kanban/KanbanColumn.vue'
import KanbanSwimlanes from '@/components/kanban/KanbanSwimlanes.vue'
import FilterPanel from '@/components/kanban/FilterPanel.vue'
import BoardSettings from '@/components/kanban/BoardSettings.vue'
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

const viewOptions = ref({
  showSwimlanes: false,
  compactMode: false
})

const filters = ref({
  assignee: [],
  priority: [],
  tags: [],
  dueDate: null
})

// Store getters
const currentProject = computed(() => projectsStore.currentProject)
const currentProjectId = computed(() => projectsStore.currentProjectId)
const projectUsers = computed(() => projectsStore.projectUsers)
const kanbanColumns = computed(() => tasksStore.kanbanColumns)
const allTasks = computed(() => tasksStore.getTasksByProject(currentProjectId.value))

// Computed
const visibleColumns = computed(() => 
  kanbanColumns.value
    .filter(col => !col.hidden)
    .sort((a, b) => a.order - b.order)
)

const activeTasks = computed(() => 
  allTasks.value.filter(task => task.columnId !== 'done' && task.columnId !== 'cancelled')
)

const completedTasks = computed(() => 
  allTasks.value.filter(task => task.columnId === 'done')
)

const filteredTasks = computed(() => {
  let tasks = allTasks.value

  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    tasks = tasks.filter(task =>
      task.title.toLowerCase().includes(query) ||
      task.description.toLowerCase().includes(query) ||
      task.tags.some(tag => tag.toLowerCase().includes(query))
    )
  }

  // Assignee filter
  if (filters.value.assignee.length > 0) {
    tasks = tasks.filter(task =>
      task.assigneeIds.some(id => filters.value.assignee.includes(id))
    )
  }

  // Priority filter
  if (filters.value.priority.length > 0) {
    tasks = tasks.filter(task =>
      filters.value.priority.includes(task.priority)
    )
  }

  // Tags filter
  if (filters.value.tags.length > 0) {
    tasks = tasks.filter(task =>
      task.tags.some(tag => filters.value.tags.includes(tag))
    )
  }

  // Due date filter
  if (filters.value.dueDate) {
    const now = new Date()
    const filterDate = new Date(filters.value.dueDate)
    
    tasks = tasks.filter(task => {
      if (!task.dueDate) return false
      const taskDue = new Date(task.dueDate)
      return taskDue <= filterDate
    })
  }

  return tasks
})

const hasActiveFilters = computed(() => 
  filters.value.assignee.length > 0 ||
  filters.value.priority.length > 0 ||
  filters.value.tags.length > 0 ||
  filters.value.dueDate ||
  searchQuery.value
)

const activeFilterCount = computed(() => {
  let count = 0
  if (filters.value.assignee.length > 0) count++
  if (filters.value.priority.length > 0) count++
  if (filters.value.tags.length > 0) count++
  if (filters.value.dueDate) count++
  if (searchQuery.value) count++
  return count
})

// Methods
const getColumnTasks = (columnId) => {
  return filteredTasks.value.filter(task => task.columnId === columnId)
}

const handleTaskMoved = async (taskId, newColumnId, newIndex) => {
  try {
    loading.value = true
    await tasksStore.moveTask(taskId, newColumnId, newIndex)
    uiStore.showSuccess('Task moved successfully')
  } catch (error) {
    uiStore.showError('Failed to move task: ' + error.message)
  } finally {
    loading.value = false
  }
}

const openTaskDetails = (task) => {
  selectedTask.value = task
  showTaskDetails.value = true
}

const openTaskForm = (columnId) => {
  // Set default column for new task
  showQuickAdd.value = true
}

const handleTaskCreated = (task) => {
  uiStore.showSuccess('Task created successfully')
  showQuickAdd.value = false
}

const handleTaskUpdated = (task) => {
  uiStore.showSuccess('Task updated successfully')
  showTaskDetails.value = false
  selectedTask.value = null
}

const handleTaskDeleted = (taskId) => {
  uiStore.showSuccess('Task deleted successfully')
  showTaskDetails.value = false
  selectedTask.value = null
}

const toggleColumnCollapse = async (columnId) => {
  const column = kanbanColumns.value.find(col => col.id === columnId)
  if (column) {
    tasksStore.updateColumnCollapse(columnId, !column.collapsed)
  }
}

const updateColumn = async (columnId, updates) => {
  try {
    // Update column properties like WIP limits, colors, etc.
    await tasksStore.updateColumn(columnId, updates)
    uiStore.showSuccess('Column updated successfully')
  } catch (error) {
    uiStore.showError('Failed to update column: ' + error.message)
  }
}

const reorderColumns = async (newOrder) => {
  try {
    await tasksStore.reorderColumns(newOrder)
    uiStore.showSuccess('Columns reordered successfully')
  } catch (error) {
    uiStore.showError('Failed to reorder columns: ' + error.message)
  }
}

const clearFilters = () => {
  filters.value = {
    assignee: [],
    priority: [],
    tags: [],
    dueDate: null
  }
  searchQuery.value = ''
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

// Handle task query parameter for direct links
watch(() => route.query.task, (taskId) => {
  if (taskId) {
    const task = tasksStore.getTaskById(taskId)
    if (task) {
      openTaskDetails(task)
    }
  }
}, { immediate: true })
</script>

<style scoped>
.kanban-view {
  height: 100%;
  overflow: hidden;
}

.kanban-container {
  height: calc(100vh - 220px);
  overflow: hidden;
}

.kanban-container.with-swimlanes {
  height: calc(100vh - 180px);
}

.kanban-board {
  display: flex;
  gap: 16px;
  height: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  padding: 0 8px 16px 8px;
}

.search-field {
  max-width: 400px;
}

.kanban-header {
  flex-shrink: 0;
}

/* Custom scrollbar for board */
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

.kanban-board::-webkit-scrollbar-thumb:hover {
  background: rgba(var(--v-theme-on-surface), 0.5);
}

@media (max-width: 960px) {
  .kanban-container {
    height: calc(100vh - 160px);
  }
  
  .kanban-board {
    gap: 12px;
    padding: 0 4px 12px 4px;
  }
}

@media (max-width: 600px) {
  .kanban-header .v-row > .v-col {
    margin-bottom: 8px;
  }
  
  .kanban-container {
    height: calc(100vh - 140px);
  }
}
</style>