<template>
  <div class="swimlane-row" :class="{ 'swimlane-row--collapsed': collapsed }">
    <!-- Swimlane Header -->
    <div 
      class="swimlane-header"
      :style="{ backgroundColor: swimlane.color + '20', borderColor: swimlane.color }"
    >
      <div class="d-flex align-center justify-space-between pa-3">
        <div class="d-flex align-center flex-grow-1">
          <!-- Collapse Button -->
          <v-btn
            icon
            variant="text"
            size="small"
            @click="toggleCollapse"
            class="mr-2"
          >
            <v-icon>
              {{ collapsed ? 'mdi-chevron-right' : 'mdi-chevron-down' }}
            </v-icon>
          </v-btn>
          
          <!-- Swimlane Info -->
          <div class="flex-grow-1">
            <div class="d-flex align-center mb-1">
              <v-icon 
                :color="swimlane.color" 
                size="20" 
                class="mr-2"
              >
                {{ swimlane.icon }}
              </v-icon>
              <h4 class="text-subtitle-1 font-weight-bold">
                {{ swimlane.title }}
              </h4>
              <v-chip
                size="x-small"
                :color="swimlane.color"
                variant="outlined"
                class="ml-2"
              >
                {{ tasks.length }}
              </v-chip>
            </div>
            <p class="text-caption text-medium-emphasis mb-0">
              {{ swimlane.description }}
            </p>
          </div>
        </div>
        
        <!-- Swimlane Actions -->
        <div class="swimlane-actions ml-2">
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
                prepend-icon="mdi-plus"
                title="Add Task"
                @click="addTask"
              />
              <v-list-item
                prepend-icon="mdi-sort"
                title="Sort Tasks"
                @click="sortTasks"
              />
              <v-divider />
              <v-list-item
                prepend-icon="mdi-filter"
                title="Filter This Swimlane"
                @click="filterSwimlane"
              />
            </v-list>
          </v-menu>
        </div>
      </div>
    </div>

    <!-- Swimlane Content -->
    <div v-if="!collapsed" class="swimlane-content">
      <div class="swimlane-columns">
        <div
          v-for="column in columns"
          :key="column.id"
          class="swimlane-column"
        >
          <!-- Column Tasks -->
          <div class="column-tasks">
            <Draggable
              :model-value="getColumnTasks(column.id)"
              group="kanban-tasks"
              :animation="200"
              ghost-class="task-ghost"
              chosen-class="task-chosen"
              drag-class="task-drag"
              @start="onDragStart"
              @end="onDragEnd"
              @change="(evt) => onTasksChanged(evt, column.id)"
              item-key="id"
              class="tasks-list"
            >
              <template #item="{ element: task }">
                <KanbanCard
                  :key="task.id"
                  :task="task"
                  :index="getColumnTasks(column.id).indexOf(task)"
                  @click="$emit('task-click', task)"
                  @quick-assign="handleQuickAssign"
                  @priority-change="handlePriorityChange"
                  class="swimlane-task-card"
                />
              </template>
            </Draggable>
            
            <!-- Empty Column State -->
            <div 
              v-if="getColumnTasks(column.id).length === 0" 
              class="empty-column-swimlane"
            >
              <div class="empty-content">
                <v-icon size="24" color="medium-emphasis">
                  {{ getColumnIcon(column.id) }}
                </v-icon>
                <p class="text-caption text-medium-emphasis mt-1">
                  No {{ swimlane.title.toLowerCase() }}
                </p>
              </div>
            </div>
            
            <!-- Add Task Button -->
            <div class="add-task-swimlane pa-2">
              <v-btn
                variant="outlined"
                size="small"
                block
                prepend-icon="mdi-plus"
                @click="addTaskToColumn(column.id)"
                class="add-task-btn-swimlane"
              >
                Add {{ swimlane.title.slice(0, -1) }}
              </v-btn>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Collapsed Summary -->
    <div v-else class="swimlane-collapsed">
      <div class="collapsed-summary pa-2">
        <div class="d-flex align-center justify-space-between">
          <div class="d-flex align-center ga-2">
            <v-chip
              v-for="column in columns"
              :key="column.id"
              size="x-small"
              :color="column.color"
              variant="outlined"
            >
              {{ getColumnTasks(column.id).length }}
            </v-chip>
          </div>
          
          <v-btn
            size="x-small"
            variant="outlined"
            prepend-icon="mdi-plus"
            @click="addTask"
          >
            Add
          </v-btn>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { VueDraggable as Draggable } from 'vue-draggable-plus'
import KanbanCard from './KanbanCard.vue'

// Props
const props = defineProps({
  swimlane: {
    type: Object,
    required: true
  },
  columns: {
    type: Array,
    required: true
  },
  tasks: {
    type: Array,
    required: true
  }
})

// Emits
const emit = defineEmits(['task-moved', 'task-click', 'add-task'])

// Local state
const collapsed = ref(false)
const isDragging = ref(false)

// Methods
const getColumnTasks = (columnId) => {
  return props.tasks.filter(task => task.columnId === columnId)
}

const getColumnIcon = (columnId) => {
  const icons = {
    'backlog': 'mdi-inbox-outline',
    'todo': 'mdi-format-list-checks',
    'in-progress': 'mdi-clock-outline',
    'review': 'mdi-eye-outline',
    'done': 'mdi-check-circle-outline'
  }
  return icons[columnId] || 'mdi-circle-outline'
}

const toggleCollapse = () => {
  collapsed.value = !collapsed.value
}

const onDragStart = (evt) => {
  isDragging.value = true
  evt.item.classList.add('dragging')
}

const onDragEnd = (evt) => {
  isDragging.value = false
  evt.item.classList.remove('dragging')
}

const onTasksChanged = (evt, columnId) => {
  if (evt.added) {
    const { element: task, newIndex } = evt.added
    emit('task-moved', {
      taskId: task.id,
      columnId,
      index: newIndex,
      swimlane: props.swimlane.id
    })
  } else if (evt.moved) {
    const { element: task, newIndex } = evt.moved
    emit('task-moved', {
      taskId: task.id,
      columnId,
      index: newIndex,
      swimlane: props.swimlane.id
    })
  }
}

const handleQuickAssign = (taskId, userId) => {
  console.log('Quick assign in swimlane:', taskId, userId)
}

const handlePriorityChange = (taskId, priority) => {
  console.log('Priority change in swimlane:', taskId, priority)
}

const addTask = () => {
  emit('add-task', {
    swimlane: props.swimlane.id,
    columnId: 'todo' // Default column
  })
}

const addTaskToColumn = (columnId) => {
  emit('add-task', {
    swimlane: props.swimlane.id,
    columnId
  })
}

const sortTasks = () => {
  console.log('Sort tasks in swimlane:', props.swimlane.id)
}

const filterSwimlane = () => {
  console.log('Filter swimlane:', props.swimlane.id)
}
</script>

<style scoped>
.swimlane-row {
  background: rgb(var(--v-theme-surface));
  border-radius: 12px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  overflow: hidden;
  transition: all 0.3s ease;
}

.swimlane-row:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.swimlane-row--collapsed {
  min-height: auto;
}

.swimlane-header {
  border-left: 4px solid;
  background: rgba(var(--v-theme-surface-variant), 0.3);
  transition: all 0.2s ease;
}

.swimlane-content {
  padding: 16px;
}

.swimlane-columns {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
}

.swimlane-column {
  min-height: 200px;
  background: rgba(var(--v-theme-surface-variant), 0.1);
  border-radius: 8px;
  border: 1px dashed rgba(var(--v-theme-on-surface), 0.12);
  display: flex;
  flex-direction: column;
}

.column-tasks {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.tasks-list {
  flex-grow: 1;
  padding: 8px;
  min-height: 100px;
  overflow-y: auto;
}

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

.swimlane-task-card {
  margin-bottom: 8px;
}

.empty-column-swimlane {
  flex-grow: 1;
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

.add-task-swimlane {
  flex-shrink: 0;
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  background: rgba(var(--v-theme-surface-variant), 0.1);
}

.add-task-btn-swimlane {
  opacity: 0.7;
  transition: opacity 0.2s ease;
}

.swimlane-column:hover .add-task-btn-swimlane {
  opacity: 1;
}

.swimlane-collapsed {
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.12);
}

.collapsed-summary {
  background: rgba(var(--v-theme-surface-variant), 0.1);
}

.swimlane-actions {
  opacity: 0;
  transition: opacity 0.2s ease;
}

.swimlane-row:hover .swimlane-actions {
  opacity: 1;
}

/* Drag & Drop Styles */
.task-ghost {
  opacity: 0.5;
  transform: rotate(2deg);
}

.task-chosen {
  transform: scale(1.02);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.task-drag {
  transform: rotate(2deg);
  z-index: 1000;
}

/* Responsive Design */
@media (max-width: 1200px) {
  .swimlane-columns {
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 12px;
  }
}

@media (max-width: 960px) {
  .swimlane-content {
    padding: 12px;
  }
  
  .swimlane-columns {
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 8px;
  }
}

@media (max-width: 600px) {
  .swimlane-content {
    padding: 8px;
  }
  
  .swimlane-columns {
    grid-template-columns: 1fr;
    gap: 8px;
  }
  
  .swimlane-column {
    min-height: 150px;
  }
  
  .empty-column-swimlane {
    min-height: 80px;
    padding: 16px;
  }
}
</style>