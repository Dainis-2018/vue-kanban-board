<template>
  <v-card class="kanban-column" elevation="1">
    <v-card-title class="d-flex align-center justify-space-between pa-4">
      <div class="d-flex align-center">
        <v-icon :color="column.color" class="mr-2">{{ column.icon }}</v-icon>
        <span class="font-weight-medium">{{ column.title }}</span>
        <v-chip size="small" variant="tonal" class="ml-2">
          {{ tasks.length }}
        </v-chip>
      </div>
      <v-btn icon size="small" variant="text">
        <v-icon>mdi-dots-vertical</v-icon>
      </v-btn>
    </v-card-title>

    <v-divider />

    <div class="pa-2" style="min-height: 400px;">
      <draggable
        v-model="localTasks"
        group="tasks"
        @change="onTaskMove"
        item-key="id"
      >
        <template #item="{ element: task }">
          <v-card
            class="task-card mb-2"
            elevation="1"
            @click="$emit('task-click', task)"
          >
            <v-card-text class="pa-3">
              <div class="d-flex align-center justify-space-between mb-2">
                <v-chip
                  size="x-small"
                  :color="getPriorityColor(task.priority)"
                  variant="flat"
                >
                  {{ task.priority }}
                </v-chip>
                <v-btn icon size="x-small" variant="text">
                  <v-icon>mdi-dots-horizontal</v-icon>
                </v-btn>
              </div>
              
              <h4 class="text-body-2 font-weight-medium mb-2">
                {{ task.title }}
              </h4>
              
              <p class="text-caption text-medium-emphasis mb-2">
                {{ task.description }}
              </p>
              
              <div class="d-flex align-center justify-space-between">
                <div class="d-flex align-center">
                  <v-avatar
                    v-if="task.assigneeId"
                    size="20"
                    :image="getAssigneeAvatar(task.assigneeId)"
                  />
                  <v-icon v-else size="20" color="grey">mdi-account-plus</v-icon>
                </div>
                
                <div class="d-flex align-center ga-1">
                  <v-icon v-if="task.dueDate" size="12" color="warning">
                    mdi-clock
                  </v-icon>
                  <span v-if="task.dueDate" class="text-caption">
                    {{ formatDate(task.dueDate) }}
                  </span>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </template>
      </draggable>
      
      <v-btn
        variant="outlined"
        block
        class="mt-2"
        @click="$emit('add-task', column.id)"
      >
        <v-icon class="mr-1">mdi-plus</v-icon>
        Add Task
      </v-btn>
    </div>
  </v-card>
</template>

<script setup>
import { computed } from 'vue'
import { VueDraggableNext as draggable } from 'vue-draggable-next'
import { useProjectsStore } from '@/stores/projects'

const props = defineProps({
  column: Object,
  tasks: Array
})

const emit = defineEmits(['task-move', 'task-click', 'add-task'])

const projectsStore = useProjectsStore()

const localTasks = computed({
  get: () => props.tasks,
  set: (value) => {
    // Handle reordering within column
  }
})

const onTaskMove = (event) => {
  if (event.added) {
    emit('task-move', {
      taskId: event.added.element.id,
      newColumnId: props.column.id,
      newIndex: event.added.newIndex
    })
  }
}

const getPriorityColor = (priority) => {
  const colors = {
    critical: 'error',
    high: 'warning', 
    medium: 'info',
    low: 'success'
  }
  return colors[priority] || 'grey'
}

const getAssigneeAvatar = (userId) => {
  const user = projectsStore.getUserById(userId)
  return user?.avatar || ''
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  })
}
</script>

<style scoped>
.kanban-column {
  min-width: 300px;
  max-width: 350px;
}

.task-card {
  cursor: pointer;
  transition: all 0.2s ease;
}

.task-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}
</style>