<template>
  <div class="swimlane-row">
    <!-- Expanded View -->
    <div v-if="!collapsed" class="swimlane-expanded">
      <div class="swimlane-header d-flex align-center pa-3">
        <v-btn
          icon
          size="small"
          variant="text"
          @click="toggleCollapse"
        >
          <v-icon>{{ collapsed ? 'mdi-chevron-right' : 'mdi-chevron-down' }}</v-icon>
        </v-btn>
        
        <div class="ml-2">
          <h6 class="text-h6 font-weight-medium">{{ swimlane.title }}</h6>
          <p v-if="swimlane.description" class="text-body-2 text-medium-emphasis mb-0">
            {{ swimlane.description }}
          </p>
        </div>
        
        <v-spacer />
        
        <v-btn
          size="small"
          variant="outlined"
          prepend-icon="mdi-plus"
          @click="addTask"
        >
          Add Task
        </v-btn>
      </div>

      <v-divider />

      <div class="swimlane-columns d-flex" style="min-height: 300px;">
        <div
          v-for="column in columns"
          :key="column.id"
          class="swimlane-column flex-grow-1 pa-2"
          :style="{ borderRight: '1px solid rgba(var(--v-border-color), var(--v-border-opacity))' }"
        >
          <div class="column-header d-flex align-center justify-space-between mb-3">
            <div class="d-flex align-center">
              <v-icon :color="column.color" size="16" class="mr-2">
                {{ getColumnIcon(column.id) }}
              </v-icon>
              <span class="text-subtitle-2">{{ column.title }}</span>
              <v-chip size="x-small" class="ml-2" variant="outlined">
                {{ getColumnTasks(column.id).length }}
              </v-chip>
            </div>
          </div>

          <draggable
            :model-value="getColumnTasks(column.id)"
            :group="{ name: 'swimlane-tasks', pull: true, put: true }"
            item-key="id"
            ghost-class="task-ghost"
            chosen-class="task-chosen"
            drag-class="task-dragging"
            :animation="200"
            @change="(evt) => onTaskMove(evt, column.id)"
            @start="onDragStart"
            @end="onDragEnd"
          >
            <template #item="{ element: task }">
              <KanbanCard
                :task="task"
                @click="emit('task-click', task)"
                class="mb-2"
              />
            </template>
          </draggable>

          <div class="mt-2">
            <v-btn
              block
              variant="text"
              size="small"
              prepend-icon="mdi-plus"
              @click="addTask(column.id)"
            >
              Add {{ column.title.slice(0, -1) }}
            </v-btn>
          </div>
        </div>
      </div>
    </div>

    <!-- Collapsed Summary -->
    <div v-else class="swimlane-collapsed">
      <div class="collapsed-summary pa-3">
        <div class="d-flex align-center justify-space-between">
          <div class="d-flex align-center">
            <v-btn
              icon
              size="small"
              variant="text"
              @click="toggleCollapse"
            >
              <v-icon>mdi-chevron-right</v-icon>
            </v-btn>
            
            <div class="ml-2">
              <h6 class="text-subtitle-1 font-weight-medium">{{ swimlane.title }}</h6>
            </div>
          </div>
          
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
            
            <v-btn
              size="small"
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
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { VueDraggableNext as draggable } from 'vue-draggable-next'
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
  return props.tasks.filter(task => 
    task.columnId === columnId && task.swimlaneId === props.swimlane.id
  )
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

const onTaskMove = (event, columnId) => {
  if (event.added) {
    emit('task-moved', {
      taskId: event.added.element.id,
      newColumnId: columnId,
      newSwimlaneId: props.swimlane.id,
      newIndex: event.added.newIndex
    })
  } else if (event.moved) {
    emit('task-moved', {
      taskId: event.moved.element.id,
      newColumnId: columnId,
      newSwimlaneId: props.swimlane.id,
      newIndex: event.moved.newIndex,
      oldIndex: event.moved.oldIndex
    })
  }
}

const addTask = (columnId = null) => {
  emit('add-task', {
    swimlaneId: props.swimlane.id,
    columnId: columnId || props.columns[0]?.id
  })
}
</script>

<style scoped>
.swimlane-row {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 8px;
  margin-bottom: 16px;
  background: rgb(var(--v-theme-surface));
}

.swimlane-header {
  background: rgba(var(--v-theme-surface-variant), 0.5);
}

.swimlane-column {
  min-width: 250px;
  position: relative;
}

.swimlane-column:last-child {
  border-right: none !important;
}

.collapsed-summary {
  background: rgba(var(--v-theme-surface-variant), 0.3);
}

.task-ghost {
  opacity: 0.5;
  background: rgba(var(--v-theme-primary), 0.1);
  border: 2px dashed rgba(var(--v-theme-primary), 0.5);
}

.task-chosen {
  transform: scale(1.02);
}

.task-dragging {
  transform: rotate(2deg);
  z-index: 9999;
}

.dragging {
  opacity: 0.8;
  transform: rotate(3deg);
}

@media (max-width: 768px) {
  .swimlane-columns {
    flex-direction: column;
  }
  
  .swimlane-column {
    min-width: 100%;
    border-right: none !important;
    border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  }
  
  .swimlane-column:last-child {
    border-bottom: none;
  }
}
</style>