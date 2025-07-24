<!-- src/views/Kanban.vue -->
<template>
  <div class="kanban-view">
    <!-- Header -->
    <div class="kanban-header">
      <div class="d-flex align-center justify-space-between mb-4">
        <div>
          <h1 class="text-h4 font-weight-bold">
            {{ currentProject?.name || 'Kanban Board' }}
          </h1>
          <p class="text-body-1 text-medium-emphasis">
            {{ currentProject?.description || 'Manage your tasks efficiently' }}
          </p>
        </div>
        
        <div class="d-flex align-center ga-3">
          <!-- Search -->
          <v-text-field
            v-model="searchQuery"
            placeholder="Search tasks..."
            prepend-inner-icon="mdi-magnify"
            variant="outlined"
            density="compact"
            hide-details
            class="search-field"
            style="min-width: 250px;"
          />
          
          <!-- Add Task Button -->
          <v-btn
            color="primary"
            prepend-icon="mdi-plus"
            @click="handleAddTask(null)"
          >
            Add Task
          </v-btn>
          
          <!-- Add Column Button -->
          <v-btn
            variant="outlined"
            prepend-icon="mdi-view-column"
            @click="handleAddColumn"
          >
            Add Column
          </v-btn>
        </div>
      </div>
    </div>

    <!-- Kanban Board -->
    <div v-if="kanbanColumns.length > 0" class="kanban-board">
      <div class="kanban-columns">
        <div
          v-for="(column, columnIndex) in kanbanColumns"
          :key="column.id"
          class="kanban-column-wrapper"
          :class="{ 'collapsed': column.collapsed }"
          :data-column-index="columnIndex"
        >
          <v-card
            class="kanban-column"
            :class="{ 'column-collapsed': column.collapsed }"
            elevation="2"
            :data-column-id="column.id"
          >
            <!-- Column Header -->
            <v-card-title class="column-header d-flex align-center justify-space-between">
              <div class="d-flex align-center" :class="{ 'flex-column': column.collapsed }">
                <span v-if="!column.collapsed" class="text-subtitle-1 font-weight-bold">{{ column.title }}</span>
                <span v-else class="text-subtitle-1 font-weight-bold vertical-text">{{ column.title }}</span>
                
                <v-chip
                  v-if="!column.collapsed"
                  size="small"
                  variant="flat"
                  :color="column.color || 'primary'"
                  class="ml-2"
                >
                  {{ getColumnTasks(column.id).length }}
                </v-chip>
                <v-chip
                  v-else
                  size="small"
                  variant="flat"
                  :color="column.color || 'primary'"
                  class="collapsed-chip-header"
                >
                  {{ getColumnTasks(column.id).length }}
                </v-chip>
              </div>
              
              <div class="d-flex align-center" :class="{ 'flex-column': column.collapsed }">
                <!-- Menu Button (only when expanded) -->
                <v-menu v-if="!column.collapsed">
                  <template #activator="{ props }">
                    <v-btn
                      v-bind="props"
                      variant="text"
                      size="small"
                      icon="mdi-dots-vertical"
                      class="mr-1"
                    />
                  </template>
                  
                  <v-list density="compact">
                    <v-list-item @click="editColumn(column)">
                      <template #prepend>
                        <v-icon>mdi-pencil</v-icon>
                      </template>
                      <v-list-item-title>Edit Column</v-list-item-title>
                    </v-list-item>
                    
                    <v-list-item @click="handleDeleteColumn(column.id)">
                      <template #prepend>
                        <v-icon color="error">mdi-delete</v-icon>
                      </template>
                      <v-list-item-title class="text-error">Delete Column</v-list-item-title>
                    </v-list-item>
                  </v-list>
                </v-menu>
                
                <!-- Collapse/Expand Button -->
                <v-btn
                  variant="text"
                  size="small"
                  :icon="column.collapsed ? 'mdi-chevron-right' : 'mdi-chevron-left'"
                  @click="toggleColumnCollapse(column.id)"
                  class="collapse-btn"
                  :class="{ 'collapsed-expand-btn': column.collapsed }"
                  :title="column.collapsed ? 'Expand column' : 'Collapse column'"
                />
              </div>
            </v-card-title>

            <v-divider />

            <!-- Column Content -->
            <div v-if="!column.collapsed" class="column-content">
              <!-- Tasks -->
              <draggable
                :model-value="getColumnTasks(column.id)"
                @update:model-value="updateColumnTasks(column.id, $event)"
                group="kanban-tasks"
                item-key="id"
                class="tasks-container"
                :animation="200"
                ghost-class="task-ghost"
                chosen-class="task-chosen"
                drag-class="task-drag"
                @start="onDragStart"
                @end="onDragEnd"
              >
                <template #item="{ element: task }">
                  <TaskCard
                    :task="task"
                    :assignees="getTaskAssignees(task)"
                    @click="openTaskDetails(task)"
                  />
                </template>
                <template #footer>
                  <div v-if="getColumnTasks(column.id).length === 0" class="empty-column">
                    <div class="empty-content text-center pa-4">
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

              <!-- Add Task Button -->
              <div class="add-task-section pa-2">
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
            
            <!-- Collapsed State - Just a thin vertical strip -->
            <div v-else class="collapsed-content">
              <div class="collapsed-indicator" @click="toggleColumnCollapse(column.id)">
                <v-icon size="12" color="grey-lighten-1">mdi-dots-vertical</v-icon>
              </div>
              <div class="collapsed-task-count">
                <span class="text-caption">{{ getColumnTasks(column.id).length }}</span>
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

    <!-- Task Creation Dialog -->
    <QuickTaskDialog
      v-model="showQuickAdd"
      :project-id="currentProjectId"
      :columns="kanbanColumns"
      :users="allUsers"
      :default-column-id="quickAddDefaultColumnId"
      @task-created="onTaskCreated"
    />

    <!-- Task Details Dialog -->
    <TaskDetailsDialog
      v-model="showTaskDetails"
      :task="selectedTask"
      :columns="kanbanColumns"
      :users="allUsers"
      @task-updated="onTaskUpdated"
      @task-deleted="onTaskDeleted"
    />

    <!-- Column Dialog -->
    <ColumnDialog
      v-model="showColumnDialog"
      :column="selectedColumn"
      :existing-columns="kanbanColumns"
      @save="onColumnSaved"
      @delete="onColumnDeleted"
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
import TaskCard from '@/components/kanban/TaskCard.vue'
import ColumnDialog from '@/components/kanban/ColumnDialog.vue'

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
const showColumnDialog = ref(false)
const selectedTask = ref(null)
const selectedColumn = ref(null)
const quickAddDefaultColumnId = ref(null)
const draggedTask = ref(null)
const isDragging = ref(false)

// Store getters
const currentProject = computed(() => projectsStore.currentProject)
const currentProjectId = computed(() => projectsStore.currentProjectId)
const allUsers = computed(() => projectsStore.users)
const kanbanColumns = computed(() => tasksStore.kanbanColumns || [])
const allTasks = computed(() => {
  const projectId = currentProjectId.value
  if (!projectId) return []
  return tasksStore.getTasksByProject(projectId) || []
})

// Computed properties
const filteredTasks = computed(() => {
  let tasks = allTasks.value
  
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    tasks = tasks.filter(task => 
      task.title.toLowerCase().includes(query) ||
      task.description?.toLowerCase().includes(query) ||
      task.tags?.some(tag => tag.toLowerCase().includes(query))
    )
  }
  
  return tasks
})

const tasksByColumn = computed(() => {
  const columnMap = new Map()
  
  // Initialize all columns with empty arrays
  kanbanColumns.value.forEach(column => {
    columnMap.set(column.id, [])
  })
  
  // Group tasks by column
  filteredTasks.value.forEach(task => {
    const columnTasks = columnMap.get(task.columnId) || []
    columnTasks.push(task)
    columnMap.set(task.columnId, columnTasks)
  })
  
  // Sort tasks within each column by order
  columnMap.forEach((tasks, columnId) => {
    tasks.sort((a, b) => (a.order || 0) - (b.order || 0))
  })
  
  return columnMap
})

// Methods for draggable
const getColumnTasks = (columnId) => {
  return tasksByColumn.value.get(columnId) || []
}

const updateColumnTasks = async (columnId, newTasks) => {
  for (let i = 0; i < newTasks.length; i++) {
    const task = newTasks[i]
    
    if (task.columnId !== columnId) {
      await tasksStore.updateTask(task.id, {
        columnId: columnId,
        order: i
      })
    } else if (task.order !== i) {
      await tasksStore.updateTask(task.id, { order: i })
    }
  }
}

const onDragStart = (evt) => {
  isDragging.value = true
  draggedTask.value = evt.item._underlying_vm_
}

const onDragEnd = async (evt) => {
  isDragging.value = false
  
  const task = draggedTask.value
  if (!task) return
  
  const targetColumn = evt.to.closest('[data-column-id]')
  const newColumnId = targetColumn?.getAttribute('data-column-id')
  const newIndex = evt.newIndex
  
  if (newColumnId && task.columnId !== newColumnId) {
    try {
      await tasksStore.moveTask(task.id, newColumnId, newIndex)
      uiStore.showSuccess(`Task moved to ${getColumnTitle(newColumnId)}`)
    } catch (error) {
      console.error('Error moving task:', error)
      uiStore.showError('Failed to move task')
    }
  } else if (newIndex !== undefined) {
    try {
      await tasksStore.updateTask(task.id, { order: newIndex })
    } catch (error) {
      console.error('Error updating task order:', error)
    }
  }
  
  draggedTask.value = null
}

const getColumnTitle = (columnId) => {
  const column = kanbanColumns.value.find(c => c.id === columnId)
  return column?.title || 'Unknown Column'
}

const getTaskAssignees = (task) => {
  if (!task) return []
  
  const assigneeIds = task.assigneeIds && task.assigneeIds.length > 0 
    ? task.assigneeIds 
    : (task.assigneeId ? [task.assigneeId] : [])
  
  return assigneeIds
    .map(id => allUsers.value.find(user => user.id === id))
    .filter(Boolean)
}

const handleAddTask = (columnId) => {
  quickAddDefaultColumnId.value = columnId
  showQuickAdd.value = true
}

const openTaskDetails = (task) => {
  selectedTask.value = task
  showTaskDetails.value = true
}

const toggleColumnCollapse = async (columnId) => {
  const column = kanbanColumns.value.find(c => c.id === columnId)
  if (column) {
    await tasksStore.updateColumnCollapse(columnId, !column.collapsed)
  }
}

const editColumn = (column) => {
  selectedColumn.value = column
  showColumnDialog.value = true
}

const handleAddColumn = () => {
  selectedColumn.value = null
  showColumnDialog.value = true
}

const handleDeleteColumn = async (columnId) => {
  if (confirm('Are you sure you want to delete this column? All tasks in this column will be moved to the backlog.')) {
    await onColumnDeleted(columnId)
  }
}

const onColumnSaved = async (columnData) => {
  try {
    if (selectedColumn.value) {
      // Update existing column
      await tasksStore.updateColumn(columnData.id, columnData)
      uiStore.showSuccess('Column updated successfully')
    } else {
      // Create new column
      await tasksStore.createColumn(columnData)
      uiStore.showSuccess('Column created successfully')
    }
    selectedColumn.value = null
  } catch (error) {
    console.error('Error saving column:', error)
    uiStore.showError('Failed to save column: ' + error.message)
  }
}

const onColumnDeleted = async (columnId) => {
  try {
    // Move all tasks to backlog before deleting column
    const tasksInColumn = tasksByColumn.value.get(columnId) || []
    for (const task of tasksInColumn) {
      await tasksStore.moveTask(task.id, 'backlog')
    }
    
    // Delete the column
    await tasksStore.deleteColumn(columnId)
    uiStore.showSuccess('Column deleted successfully')
    selectedColumn.value = null
  } catch (error) {
    console.error('Error deleting column:', error)
    uiStore.showError('Failed to delete column: ' + error.message)
  }
}

const onTaskCreated = (task) => {
  uiStore.showSuccess('Task created successfully')
}

const onTaskUpdated = (task) => {
  uiStore.showSuccess('Task updated successfully')
}

const onTaskDeleted = (taskId) => {
  selectedTask.value = null
  showTaskDetails.value = false
  uiStore.showSuccess('Task deleted successfully')
}

// Watch for route changes
watch(() => route.params.projectId, (newProjectId) => {
  if (newProjectId && newProjectId !== currentProjectId.value) {
    projectsStore.setCurrentProject(newProjectId)
  }
}, { immediate: true })

// Initialize data
onMounted(async () => {
  loading.value = true
  
  try {
    projectsStore.initializeCurrentProject()
    tasksStore.initializeData()
    
    if (route.params.projectId) {
      projectsStore.setCurrentProject(route.params.projectId)
    }
  } catch (error) {
    console.error('Error initializing kanban board:', error)
    uiStore.showError('Failed to load kanban board')
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.kanban-view {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.kanban-header {
  flex-shrink: 0;
  padding: 24px;
  background: rgba(var(--v-theme-surface), 1);
}

.search-field {
  max-width: 300px;
}

.kanban-board {
  flex: 1;
  overflow: hidden;
  padding: 0 24px 24px;
}

.kanban-columns {
  display: flex;
  gap: 16px;
  height: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  padding-bottom: 16px;
}

.kanban-column-wrapper {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
}

.kanban-column-wrapper.collapsed {
  width: 50px !important;
  min-width: 50px !important;
  max-width: 50px !important;
}

.kanban-column {
  width: 300px;
  height: 100%;
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
  flex-shrink: 0;
  min-width: auto; /* Remove any default min-width */
}

.column-collapsed {
  width: 50px !important; /* Force the width with !important */
  min-width: 50px !important;
  max-width: 50px !important;
}

.column-collapsed .column-header {
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: 8px 2px !important; /* Force tighter padding */
  min-height: 120px;
  width: 100%;
  overflow: hidden; /* Prevent content from overflowing */
}

.column-collapsed .vertical-text {
  writing-mode: vertical-lr;
  text-orientation: mixed;
  white-space: nowrap;
  margin: 8px 0;
  font-size: 0.7rem !important;
  max-width: 45px;
  overflow: hidden;
  text-overflow: ellipsis;
  transform: rotate(0deg); /* Ensure proper rotation */
}

.collapsed-chip {
  margin: 4px 0 !important;
  min-width: 18px !important;
  height: 18px !important;
  font-size: 0.6rem !important;
  padding: 0 !important;
}

.collapsed-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  opacity: 0.3;
  padding: 8px 0;
}

.collapsed-indicator {
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s ease;
  writing-mode: vertical-lr;
}

.collapsed-indicator:hover {
  background-color: rgba(var(--v-theme-primary), 0.1);
  opacity: 1;
}

.collapsed-task-count {
  margin-top: 8px;
  background: rgba(var(--v-theme-primary), 0.1);
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.column-collapsed .collapse-btn {
  margin-top: 8px;
  width: 24px;
  height: 24px;
  min-width: 24px;
}

.collapse-btn {
  transition: transform 0.2s ease, background-color 0.2s ease;
}

.collapse-btn:hover {
  background-color: rgba(var(--v-theme-primary), 0.1);
  transform: scale(1.1);
}

.column-header {
  flex-shrink: 0;
  min-height: 64px;
  padding: 12px 16px;
}

.column-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.tasks-container {
  flex: 1;
  overflow-y: auto;
  min-height: 100px;
  padding: 0 8px;
  transition: background-color 0.2s ease;
}

.tasks-container:empty {
  background: rgba(var(--v-theme-surface-variant), 0.3);
  border-radius: 8px;
  position: relative;
}

.tasks-container:empty::after {
  content: 'Drop tasks here';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: rgba(var(--v-theme-on-surface), 0.4);
  font-size: 0.875rem;
  pointer-events: none;
}

.empty-column {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 120px;
}

.add-task-section {
  flex-shrink: 0;
}

.add-task-btn {
  border-style: dashed !important;
  transition: all 0.2s ease;
}

.add-task-btn:hover {
  background-color: rgba(var(--v-theme-primary), 0.04);
  border-style: solid !important;
}

/* Drag and drop styling */
.task-ghost {
  opacity: 0.5;
  background: rgba(var(--v-theme-primary), 0.1);
  border: 2px dashed rgba(var(--v-theme-primary), 0.3);
}

.task-chosen {
  cursor: grabbing;
  transform: rotate(5deg);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}

.task-drag {
  transform: rotate(0deg);
  opacity: 0.8;
}

/* Scrollbar styling */
.kanban-columns::-webkit-scrollbar,
.tasks-container::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.kanban-columns::-webkit-scrollbar-track,
.tasks-container::-webkit-scrollbar-track {
  background: rgba(var(--v-theme-surface-variant), 0.5);
  border-radius: 3px;
}

.kanban-columns::-webkit-scrollbar-thumb,
.tasks-container::-webkit-scrollbar-thumb {
  background: rgba(var(--v-theme-on-surface), 0.3);
  border-radius: 3px;
}

.kanban-columns::-webkit-scrollbar-thumb:hover,
.tasks-container::-webkit-scrollbar-thumb:hover {
  background: rgba(var(--v-theme-on-surface), 0.5);
}

@media (max-width: 768px) {
  .kanban-header {
    padding: 16px;
  }
  
  .kanban-board {
    padding: 0 16px 16px;
  }
  
  .kanban-column {
    width: 280px;
  }
  
  .column-collapsed {
    width: 40px;
  }
  
  .search-field {
    max-width: 200px;
  }
}
</style>