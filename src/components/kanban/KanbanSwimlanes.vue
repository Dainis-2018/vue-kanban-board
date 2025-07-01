<template>
  <div class="kanban-swimlanes">
    <!-- Search Bar -->
    <v-card class="mb-4" v-if="searchQuery">
      <v-card-text class="py-3">
        <v-text-field
          :model-value="searchQuery"
          placeholder="Search tasks..."
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          density="compact"
          hide-details
          clearable
          readonly
        />
      </v-card-text>
    </v-card>

    <!-- Swimlanes Header -->
    <div class="swimlanes-header">
      <div class="swimlane-label">
        <h3 class="text-h6 font-weight-bold">Swimlanes</h3>
      </div>
      
      <div class="columns-header">
        <div
          v-for="column in columns"
          :key="column.id"
          class="column-header"
          :style="{ borderTopColor: column.color }"
        >
          <div class="d-flex align-center justify-center pa-2">
            <div class="text-center">
              <h4 class="text-subtitle-2 font-weight-bold mb-1">
                {{ column.title }}
              </h4>
              <span class="text-caption text-medium-emphasis">
                {{ getColumnTaskCount(column.id) }} tasks
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Swimlanes Content -->
    <div class="swimlanes-content">
      <!-- Feature Swimlane -->
      <SwimlaneRow
        :key="'feature'"
        :swimlane="featureSwimlane"
        :columns="columns"
        :tasks="getSwimlaneTasks('feature')"
        @task-moved="$emit('task-moved', $event.taskId, $event.columnId, $event.index)"
        @task-click="$emit('task-click', $event)"
        @add-task="$emit('add-task', $event)"
      />

      <!-- Bug Swimlane -->
      <SwimlaneRow
        :key="'bug'"
        :swimlane="bugSwimlane"
        :columns="columns"
        :tasks="getSwimlaneTasks('bug')"
        @task-moved="$emit('task-moved', $event.taskId, $event.columnId, $event.index)"
        @task-click="$emit('task-click', $event)"
        @add-task="$emit('add-task', $event)"
      />

      <!-- Improvement Swimlane -->
      <SwimlaneRow
        :key="'improvement'"
        :swimlane="improvementSwimlane"
        :columns="columns"
        :tasks="getSwimlaneTasks('improvement')"
        @task-moved="$emit('task-moved', $event.taskId, $event.columnId, $event.index)"
        @task-click="$emit('task-click', $event)"
        @add-task="$emit('add-task', $event)"
      />

      <!-- Other/Unassigned Swimlane -->
      <SwimlaneRow
        :key="'other'"
        :swimlane="otherSwimlane"
        :columns="columns"
        :tasks="getSwimlaneTasks('other')"
        @task-moved="$emit('task-moved', $event.taskId, $event.columnId, $event.index)"
        @task-click="$emit('task-click', $event)"
        @add-task="$emit('add-task', $event)"
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import SwimlaneRow from './SwimlaneRow.vue'

// Props
const props = defineProps({
  columns: {
    type: Array,
    required: true
  },
  tasks: {
    type: Array,
    required: true
  },
  projectId: {
    type: String,
    required: true
  },
  searchQuery: {
    type: String,
    default: ''
  }
})

// Emits
defineEmits(['task-moved', 'task-click', 'add-task'])

// Swimlane definitions
const featureSwimlane = {
  id: 'feature',
  title: 'Features',
  description: 'New features and enhancements',
  color: '#2196F3',
  icon: 'mdi-star'
}

const bugSwimlane = {
  id: 'bug',
  title: 'Bugs',
  description: 'Bug fixes and issues',
  color: '#F44336',
  icon: 'mdi-bug'
}

const improvementSwimlane = {
  id: 'improvement',
  title: 'Improvements',
  description: 'Performance and UX improvements',
  color: '#4CAF50',
  icon: 'mdi-trending-up'
}

const otherSwimlane = {
  id: 'other',
  title: 'Other',
  description: 'Miscellaneous tasks',
  color: '#9E9E9E',
  icon: 'mdi-dots-horizontal'
}

// Computed
const filteredTasks = computed(() => {
  if (!props.searchQuery) return props.tasks

  const query = props.searchQuery.toLowerCase()
  return props.tasks.filter(task =>
    task.title.toLowerCase().includes(query) ||
    task.description.toLowerCase().includes(query) ||
    task.tags.some(tag => tag.toLowerCase().includes(query))
  )
})

// Methods
const getSwimlaneTasks = (swimlane) => {
  return filteredTasks.value.filter(task => {
    if (swimlane === 'other') {
      return !task.swimlane || !['feature', 'bug', 'improvement'].includes(task.swimlane)
    }
    return task.swimlane === swimlane
  })
}

const getColumnTaskCount = (columnId) => {
  return filteredTasks.value.filter(task => task.columnId === columnId).length
}
</script>

<style scoped>
.kanban-swimlanes {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.swimlanes-header {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 16px;
  margin-bottom: 16px;
  flex-shrink: 0;
}

.swimlane-label {
  display: flex;
  align-items: center;
  padding: 16px;
  background: rgb(var(--v-theme-surface));
  border-radius: 8px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
}

.columns-header {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
}

.column-header {
  background: rgb(var(--v-theme-surface));
  border-radius: 8px;
  border-top: 4px solid;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  min-height: 80px;
  display: flex;
  align-items: center;
}

.swimlanes-content {
  flex-grow: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Responsive Design */
@media (max-width: 1200px) {
  .swimlanes-header {
    grid-template-columns: 180px 1fr;
  }
  
  .columns-header {
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 12px;
  }
}

@media (max-width: 960px) {
  .swimlanes-header {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .columns-header {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 8px;
  }
  
  .swimlanes-content {
    gap: 12px;
  }
}

@media (max-width: 600px) {
  .columns-header {
    grid-template-columns: 1fr;
  }
  
  .column-header {
    min-height: 60px;
  }
}
</style>