<template>
  <div 
    class="kanban-column" 
    :class="{ 
      'kanban-column--collapsed': column.collapsed,
      'kanban-column--over-limit': isOverWipLimit 
    }"
  >
    <!-- Column Header -->
    <div class="column-header" :style="{ borderTopColor: column.color }">
      <div class="d-flex align-center justify-space-between pa-3">
        <div class="d-flex align-center flex-grow-1">
          <!-- Collapse/Expand Button -->
          <v-btn
            icon
            variant="text"
            size="small"
            @click="toggleCollapse"
            class="mr-2"
          >
            <v-icon>
              {{ column.collapsed ? 'mdi-chevron-right' : 'mdi-chevron-down' }}
            </v-icon>
          </v-btn>
          
          <!-- Column Title -->
          <div class="flex-grow-1" v-if="!column.collapsed">
            <h3 class="text-subtitle-1 font-weight-bold mb-0">
              {{ column.title }}
            </h3>
            <div class="d-flex align-center">
              <span class="text-caption text-medium-emphasis">
                {{ tasks.length }} {{ tasks.length === 1 ? 'task' : 'tasks' }}
              </span>
              
              <!-- WIP Limit Warning -->
              <v-chip
                v-if="column.wipLimit && isOverWipLimit"
                size="x-small"
                color="error"
                variant="flat"
                class="ml-2"
              >
                Over Limit
              </v-chip>
              
              <v-chip
                v-else-if="column.wipLimit"
                size="x-small"
                :color="wipLimitColor"
                variant="outlined"
                class="ml-2"
              >
                {{ tasks.length }}/{{ column.wipLimit }}
              </v-chip>
            </div>
          </div>
          
          <!-- Collapsed View -->
          <div v-else class="text-center">
            <div class="text-caption font-weight-bold">{{ column.title.charAt(0) }}</div>
            <div class="text-caption">{{ tasks.length }}</div>
          </div>
        </div>
        
        <!-- Column Actions -->
        <div v-if="!column.collapsed" class="column-actions ml-2">
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
                @click="$emit('add-task', column.id)"
              />
              <v-list-item
                prepend-icon="mdi-sort"
                title="Sort Tasks"
                @click="showSortMenu = true"
              />
              <v-divider />
              <v-list-item
                prepend-icon="mdi-cog"
                title="Column Settings"
                @click="showSettings = true"
              />
            </v-list>
          </v-menu>
        </div>
      </div>
      
      <!-- Add Task Button (when not collapsed) -->
      <div v-if="!column.collapsed" class="px-3 pb-2">
        <v-btn
          variant="outlined"
          size="small"
          block
          prepend-icon="mdi-plus"
          @click="$emit('add-task', column.id)"
          class="add-task-btn"
        >
          Add Task
        </v-btn>
      </div>
    </div>

    <!-- Tasks Container -->
    <div 
      v-if="!column.collapsed" 
      class="tasks-container"
      ref="tasksContainer"
    >
      <Draggable
        v-model="localTasks"
        group="kanban-tasks"
        :animation="200"
        ghost-class="task-ghost"
        chosen-class="task-chosen"
        drag-class="task-drag"
        @start="onDragStart"
        @end="onDragEnd"
        @change="onTasksChanged"
        item-key="id"
        class="tasks-list"
      >
        <template #item="{ element: task, index }">
          <KanbanCard
            :key="task.id"
            :task="task"
            :index="index"
            @click="$emit('task-click', task)"
            @quick-assign="handleQuickAssign"
            @priority-change="handlePriorityChange"
          />
        </template>
        
        <template #footer>
          <div class="drop-zone" v-if="isDragging">
            <div class="drop-zone-content">
              <v-icon>mdi-plus</v-icon>
              <span>Drop task here</span>
            </div>
          </div>
        </template>
      </Draggable>
      
      <!-- Empty State -->
      <div v-if="tasks.length === 0 && !isDragging" class="empty-column">
        <v-icon size="48" color="medium-emphasis" class="mb-2">
          {{ getColumnIcon(column.id) }}
        </v-icon>
        <p class="text-caption text-medium-emphasis text-center">
          No tasks in {{ column.title.toLowerCase() }}
        </p>
      </div>
    </div>

    <!-- Column Settings Dialog -->
    <ColumnSettingsDialog
      v-model="showSettings"
      :column="column"
      @update="handleColumnUpdate"
    />

    <!-- Sort Menu -->
    <SortMenu
      v-model="showSortMenu"
      :tasks="tasks"
      @sort="handleSort"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { VueDraggable as Draggable } from 'vue-draggable-plus'
import KanbanCard from './KanbanCard.vue'
//import ColumnSettingsDialog from './ColumnSettingsDialog.vue'
//import SortMenu from './SortMenu.vue'

// Props
const props = defineProps({
  column: {
    type: Object,
    required: true
  },
  tasks: {
    type: Array,
    default: () => []
  },
  projectId: {
    type: String,
    required: true
  }
})

// Emits
const emit = defineEmits([
  'task-moved',
  'task-click', 
  'add-task',
  'column-toggle'
])

// Local state
const localTasks = ref([...props.tasks])
const isDragging = ref(false)
const showSettings = ref(false)
const showSortMenu = ref(false)
const tasksContainer = ref(null)

// Computed
const isOverWipLimit = computed(() => 
  props.column.wipLimit && props.tasks.length > props.column.wipLimit
)

const wipLimitColor = computed(() => {
  if (!props.column.wipLimit) return 'grey'
  const ratio = props.tasks.length / props.column.wipLimit
  if (ratio >= 1) return 'error'
  if (ratio >= 0.8) return 'warning'
  return 'success'
})

// Methods
const toggleCollapse = () => {
  emit('column-toggle', props.column.id)
}

const onDragStart = (evt) => {
  isDragging.value = true
  evt.item.classList.add('dragging')
}

const onDragEnd = (evt) => {
  isDragging.value = false
  evt.item.classList.remove('dragging')
}

const onTasksChanged = (evt) => {
  // Handle task reordering within column or moving between columns
  if (evt.added) {
    const { element: task, newIndex } = evt.added
    emit('task-moved', task.id, props.column.id, newIndex)
  } else if (evt.moved) {
    const { element: task, newIndex } = evt.moved
    emit('task-moved', task.id, props.column.id, newIndex)
  }
}

const handleQuickAssign = (taskId, userId) => {
  // Emit event to parent to handle assignment
  console.log('Quick assign:', taskId, userId)
}

const handlePriorityChange = (taskId, priority) => {
  // Emit event to parent to handle priority change
  console.log('Priority change:', taskId, priority)
}

const handleColumnUpdate = (updates) => {
  // Emit to parent component
  emit('column-update', props.column.id, updates)
  showSettings.value = false
}

const handleSort = (sortedTasks) => {
  localTasks.value = [...sortedTasks]
  showSortMenu.value = false
  
  // Emit reorder events
  sortedTasks.forEach((task, index) => {
    emit('task-moved', task.id, props.column.id, index)
  })
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

// Watch for prop changes
watch(() => props.tasks, (newTasks) => {
  localTasks.value = [...newTasks]
}, { deep: true })
</script>

<style scoped>
.kanban-column {
  min-width: 280px;
  max-width: 320px;
  height: 100%;
  background: rgb(var(--v-theme-surface));
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
}

.kanban-column--collapsed {
  min-width: 60px;
  max-width: 60px;
}

.kanban-column--over-limit {
  border: 2px solid rgb(var(--v-theme-error));
}

.column-header {
  flex-shrink: 0;
  border-top: 4px solid;
  border-radius: 12px 12px 0 0;
  background: rgba(var(--v-theme-surface-variant), 0.3);
}

.tasks-container {
  flex-grow: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.tasks-list {
  flex-grow: 1;
  overflow-y: auto;
  padding: 8px;
  min-height: 100px;
}

.tasks-list::-webkit-scrollbar {
  width: 6px;
}

.tasks-list::-webkit-scrollbar-track {
  background: transparent;
}

.tasks-list::-webkit-scrollbar-thumb {
  background: rgba(var(--v-theme-on-surface), 0.2);
  border-radius: 3px;
}

.tasks-list::-webkit-scrollbar-thumb:hover {
  background: rgba(var(--v-theme-on-surface), 0.3);
}

.empty-column {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  height: 200px;
}

.drop-zone {
  padding: 16px;
  margin: 8px;
  border: 2px dashed rgb(var(--v-theme-primary));
  border-radius: 8px;
  background: rgba(var(--v-theme-primary), 0.05);
  transition: all 0.3s ease;
}

.drop-zone-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: rgb(var(--v-theme-primary));
  font-size: 14px;
}

.add-task-btn {
  transition: all 0.2s ease;
}

.add-task-btn:hover {
  background-color: rgba(var(--v-theme-primary), 0.1);
  border-color: rgb(var(--v-theme-primary));
}

/* Drag & Drop Styles */
.task-ghost {
  opacity: 0.5;
  transform: rotate(5deg);
}

.task-chosen {
  transform: scale(1.02);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}

.task-drag {
  transform: rotate(5deg);
  z-index: 1000;
}

:deep(.sortable-ghost) {
  opacity: 0.3;
}

/* Column Actions */
.column-actions {
  opacity: 0;
  transition: opacity 0.2s ease;
}

.kanban-column:hover .column-actions {
  opacity: 1;
}

/* Responsive Design */
@media (max-width: 960px) {
  .kanban-column {
    min-width: 260px;
    max-width: 280px;
  }
  
  .kanban-column--collapsed {
    min-width: 50px;
    max-width: 50px;
  }
}

@media (max-width: 600px) {
  .kanban-column {
    min-width: calc(100vw - 32px);
    max-width: calc(100vw - 32px);
  }
}
</style>