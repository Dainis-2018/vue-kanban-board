<template>
  <v-card
    class="kanban-card"
    :class="[
      `priority-${task.priority}`,
      `swimlane-${task.swimlane}`,
      { 'kanban-card--overdue': isOverdue }
    ]"
    elevation="2"
    hover
    @click="$emit('click', task)"
  >
    <!-- Card Header -->
    <div class="card-header pa-3 pb-2">
      <div class="d-flex align-center justify-space-between">
        <!-- Task ID and Priority -->
        <div class="d-flex align-center">
          <v-chip
            size="x-small"
            :color="priorityColor"
            variant="flat"
            class="task-id mr-2"
          >
            {{ task.id.split('-')[1] }}
          </v-chip>
          
          <v-icon
            :color="priorityColor"
            size="12"
            class="priority-icon"
          >
            {{ priorityIcon }}
          </v-icon>
        </div>
        
        <!-- Quick Actions -->
        <v-menu offset-y>
          <template #activator="{ props }">
            <v-btn
              v-bind="props"
              icon="mdi-dots-horizontal"
              variant="text"
              size="x-small"
              class="card-menu"
              @click.stop
            />
          </template>
          
          <v-list density="compact">
            <v-list-item
              prepend-icon="mdi-pencil"
              title="Edit"
              @click.stop="$emit('click', task)"
            />
            <v-list-item
              prepend-icon="mdi-account-plus"
              title="Assign"
              @click.stop="showAssignMenu = true"
            />
            <v-list-item
              prepend-icon="mdi-flag"
              title="Change Priority"
              @click.stop="showPriorityMenu = true"
            />
            <v-divider />
            <v-list-item
              prepend-icon="mdi-content-copy"
              title="Duplicate"
              @click.stop="duplicateTask"
            />
            <v-list-item
              prepend-icon="mdi-delete"
              title="Delete"
              @click.stop="deleteTask"
            />
          </v-list>
        </v-menu>
      </div>
    </div>

    <!-- Card Content -->
    <div class="card-content pa-3 pt-0">
      <!-- Task Title -->
      <h4 class="task-title text-body-1 font-weight-medium mb-2">
        {{ task.title }}
      </h4>
      
      <!-- Task Description (if exists) -->
      <div 
        v-if="task.description && task.description !== '<p></p>'"
        class="task-description text-body-2 text-medium-emphasis mb-3"
        v-html="truncatedDescription"
      />
      
      <!-- Tags -->
      <div v-if="task.tags && task.tags.length > 0" class="task-tags mb-3">
        <v-chip
          v-for="tag in task.tags.slice(0, 3)"
          :key="tag"
          size="x-small"
          variant="outlined"
          class="mr-1 mb-1"
          :color="getTagColor(tag)"
        >
          {{ tag }}
        </v-chip>
        <v-chip
          v-if="task.tags.length > 3"
          size="x-small"
          variant="outlined"
          class="mr-1 mb-1"
          color="grey"
        >
          +{{ task.tags.length - 3 }}
        </v-chip>
      </div>
      
      <!-- Attachments & Comments Indicators -->
      <div v-if="hasMetadata" class="task-metadata mb-3">
        <div class="d-flex align-center ga-2">
          <div v-if="task.attachments?.length" class="d-flex align-center">
            <v-icon size="12" class="mr-1">mdi-paperclip</v-icon>
            <span class="text-caption">{{ task.attachments.length }}</span>
          </div>
          
          <div v-if="task.comments?.length" class="d-flex align-center">
            <v-icon size="12" class="mr-1">mdi-comment-outline</v-icon>
            <span class="text-caption">{{ task.comments.length }}</span>
          </div>
          
          <div v-if="task.subtasks?.length" class="d-flex align-center">
            <v-icon size="12" class="mr-1">mdi-format-list-checks</v-icon>
            <span class="text-caption">
              {{ completedSubtasks }}/{{ task.subtasks.length }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Card Footer -->
    <div class="card-footer pa-3 pt-0">
      <div class="d-flex align-center justify-space-between">
        <!-- Assignees -->
        <div class="assignees">
          <v-avatar-group
            v-if="assignees.length > 0"
            :max="3"
            size="28"
          >
            <v-tooltip
              v-for="user in assignees.slice(0, 3)"
              :key="user.id"
              location="top"
            >
              <template #activator="{ props }">
                <v-avatar
                  v-bind="props"
                  size="28"
                  @click.stop="openUserProfile(user)"
                  class="cursor-pointer"
                >
                  <v-img :src="user.avatar" :alt="user.name" />
                </v-avatar>
              </template>
              <span>{{ user.name }}</span>
            </v-tooltip>
          </v-avatar-group>
          
          <v-btn
            v-else
            icon="mdi-account-plus"
            variant="outlined"
            size="small"
            @click.stop="showAssignMenu = true"
            class="assign-btn"
          >
          </v-btn>
        </div>
        
        <!-- Due Date -->
        <div v-if="task.dueDate" class="due-date">
          <v-chip
            size="x-small"
            :color="dueDateColor"
            :variant="isOverdue ? 'flat' : 'outlined'"
            :prepend-icon="dueDateIcon"
          >
            {{ formattedDueDate }}
          </v-chip>
        </div>
      </div>
      
      <!-- Progress Bar (if subtasks exist) -->
      <div v-if="task.subtasks?.length" class="mt-2">
        <v-progress-linear
          :model-value="subtaskProgress"
          height="4"
          rounded
          :color="subtaskProgress === 100 ? 'success' : 'primary'"
        />
        <div class="text-caption text-center mt-1">
          {{ completedSubtasks }}/{{ task.subtasks.length }} subtasks
        </div>
      </div>
    </div>

    <!-- Overdue Indicator -->
    <div v-if="isOverdue" class="overdue-indicator">
      <v-icon size="16" color="white">mdi-clock-alert</v-icon>
    </div>

    <!-- Assignment Menu -->
    <v-menu
      v-model="showAssignMenu"
      offset-y
      :close-on-content-click="false"
    >
      <v-card min-width="250">
        <v-card-title class="text-subtitle-2">Assign Task</v-card-title>
        <v-card-text class="py-2">
          <v-list density="compact">
            <v-list-item
              v-for="user in availableUsers"
              :key="user.id"
              @click="toggleAssignment(user.id)"
            >
              <template #prepend>
                <v-checkbox
                  :model-value="task.assigneeIds.includes(user.id)"
                  @click.stop="toggleAssignment(user.id)"
                  hide-details
                />
              </template>
              <template #title>
                <div class="d-flex align-center">
                  <v-avatar size="24" class="mr-2">
                    <v-img :src="user.avatar" />
                  </v-avatar>
                  <div>
                    <div class="text-body-2">{{ user.name }}</div>
                    <div class="text-caption text-medium-emphasis">{{ user.role }}</div>
                  </div>
                </div>
              </template>
            </v-list-item>
          </v-list>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn size="small" @click="showAssignMenu = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-menu>

    <!-- Priority Menu -->
    <v-menu
      v-model="showPriorityMenu"
      offset-y
    >
      <v-card min-width="200">
        <v-card-title class="text-subtitle-2">Change Priority</v-card-title>
        <v-card-text class="py-2">
          <v-list density="compact">
            <v-list-item
              v-for="priority in priorities"
              :key="priority.value"
              @click="changePriority(priority.value)"
              :class="{ 'v-list-item--active': task.priority === priority.value }"
            >
              <template #prepend>
                <v-icon :color="priority.color" size="16">
                  {{ priority.icon }}
                </v-icon>
              </template>
              <v-list-item-title>{{ priority.label }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-card-text>
      </v-card>
    </v-menu>
  </v-card>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useProjectsStore } from '@/stores/projects'

// Props
const props = defineProps({
  task: {
    type: Object,
    required: true
  },
  index: {
    type: Number,
    required: true
  }
})

// Emits
const emit = defineEmits(['click', 'quick-assign', 'priority-change'])

// Composables
const projectsStore = useProjectsStore()

// Local state
const showAssignMenu = ref(false)
const showPriorityMenu = ref(false)

// Computed
const assignees = computed(() => 
  props.task.assigneeIds
    .map(id => projectsStore.getUserById(id))
    .filter(Boolean)
)

const availableUsers = computed(() => projectsStore.projectUsers)

const isOverdue = computed(() => {
  if (!props.task.dueDate) return false
  return new Date(props.task.dueDate) < new Date()
})

const priorityColor = computed(() => {
  const colors = {
    critical: 'error',
    high: 'warning',
    medium: 'info',
    low: 'success'
  }
  return colors[props.task.priority] || 'grey'
})

const priorityIcon = computed(() => {
  const icons = {
    critical: 'mdi-alert-circle',
    high: 'mdi-arrow-up',
    medium: 'mdi-minus',
    low: 'mdi-arrow-down'
  }
  return icons[props.task.priority] || 'mdi-circle'
})

const dueDateColor = computed(() => {
  if (isOverdue.value) return 'error'
  
  if (!props.task.dueDate) return 'grey'
  
  const dueDate = new Date(props.task.dueDate)
  const now = new Date()
  const diffDays = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24))
  
  if (diffDays <= 1) return 'error'
  if (diffDays <= 3) return 'warning'
  return 'success'
})

const dueDateIcon = computed(() => {
  if (isOverdue.value) return 'mdi-clock-alert'
  return 'mdi-calendar'
})

const formattedDueDate = computed(() => {
  if (!props.task.dueDate) return ''
  
  const date = new Date(props.task.dueDate)
  const now = new Date()
  const diffTime = date.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays < 0) {
    return `${Math.abs(diffDays)}d ago`
  } else if (diffDays === 0) {
    return 'Today'
  } else if (diffDays === 1) {
    return 'Tomorrow'
  } else if (diffDays <= 7) {
    return `${diffDays}d`
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }
})

const truncatedDescription = computed(() => {
  if (!props.task.description) return ''
  
  // Remove HTML tags and truncate
  const text = props.task.description.replace(/<[^>]*>/g, '')
  return text.length > 100 ? text.substring(0, 100) + '...' : text
})

const hasMetadata = computed(() => 
  (props.task.attachments?.length > 0) ||
  (props.task.comments?.length > 0) ||
  (props.task.subtasks?.length > 0)
)

const completedSubtasks = computed(() => 
  props.task.subtasks?.filter(subtask => subtask.completed).length || 0
)

const subtaskProgress = computed(() => {
  if (!props.task.subtasks?.length) return 0
  return Math.round((completedSubtasks.value / props.task.subtasks.length) * 100)
})

const priorities = [
  { value: 'critical', label: 'Critical', color: 'error', icon: 'mdi-alert-circle' },
  { value: 'high', label: 'High', color: 'warning', icon: 'mdi-arrow-up' },
  { value: 'medium', label: 'Medium', color: 'info', icon: 'mdi-minus' },
  { value: 'low', label: 'Low', color: 'success', icon: 'mdi-arrow-down' }
]

// Methods
const getTagColor = (tag) => {
  // Simple hash function to generate consistent colors for tags
  let hash = 0
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  const colors = ['primary', 'secondary', 'success', 'info', 'warning', 'purple', 'teal']
  return colors[Math.abs(hash) % colors.length]
}

const toggleAssignment = (userId) => {
  emit('quick-assign', props.task.id, userId)
  // Don't close menu to allow multiple selections
}

const changePriority = (priority) => {
  emit('priority-change', props.task.id, priority)
  showPriorityMenu.value = false
}

const openUserProfile = (user) => {
  console.log('Open user profile:', user)
}

const duplicateTask = () => {
  console.log('Duplicate task:', props.task.id)
}

const deleteTask = () => {
  console.log('Delete task:', props.task.id)
}
</script>

<style scoped>
.kanban-card {
  margin-bottom: 8px;
  cursor: pointer;
  position: relative;
  transition: all 0.2s ease;
  border-radius: 8px;
  overflow: hidden;
}

.kanban-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.kanban-card--overdue {
  border-left: 4px solid rgb(var(--v-theme-error));
}

/* Priority Indicators */
.priority-critical {
  border-left: 4px solid rgb(var(--v-theme-error));
}

.priority-high {
  border-left: 4px solid rgb(var(--v-theme-warning));
}

.priority-medium {
  border-left: 4px solid rgb(var(--v-theme-info));
}

.priority-low {
  border-left: 4px solid rgb(var(--v-theme-success));
}

/* Swimlane Indicators */
.swimlane-feature {
  background: linear-gradient(90deg, rgba(var(--v-theme-primary), 0.1) 0%, rgba(var(--v-theme-primary), 0.1) 4px, transparent 4px);
}

.swimlane-bug {
  background: linear-gradient(90deg, rgba(var(--v-theme-error), 0.1) 0%, rgba(var(--v-theme-error), 0.1) 4px, transparent 4px);
}

.swimlane-improvement {
  background: linear-gradient(90deg, rgba(var(--v-theme-success), 0.1) 0%, rgba(var(--v-theme-success), 0.1) 4px, transparent 4px);
}

.card-header {
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.12);
}

.card-content {
  flex-grow: 1;
}

.card-footer {
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  background: rgba(var(--v-theme-surface-variant), 0.3);
}

.task-title {
  line-height: 1.4;
  word-wrap: break-word;
}

.task-description {
  line-height: 1.4;
  max-height: 60px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}

.task-id {
  font-family: monospace;
  font-weight: bold;
}

.priority-icon {
  margin-left: 4px;
}

.card-menu {
  opacity: 0;
  transition: opacity 0.2s ease;
}

.kanban-card:hover .card-menu {
  opacity: 1;
}

.assignees {
  min-height: 28px;
  display: flex;
  align-items: center;
}

.assign-btn {
  width: 28px;
  height: 28px;
  min-width: 28px;
}

.overdue-indicator {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 24px;
  height: 24px;
  background: rgb(var(--v-theme-error));
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
}

.task-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.task-metadata {
  color: rgb(var(--v-theme-on-surface-variant));
}

/* Avatar Group Styling */
:deep(.v-avatar-group .v-avatar) {
  border: 2px solid rgb(var(--v-theme-surface));
  transition: transform 0.2s ease;
}

:deep(.v-avatar-group .v-avatar:hover) {
  transform: scale(1.1);
  z-index: 2;
}

/* Drag State */
.kanban-card.sortable-chosen {
  transform: scale(1.02);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  z-index: 1000;
}

.kanban-card.sortable-ghost {
  opacity: 0.3;
}

/* Mobile Responsive */
@media (max-width: 600px) {
  .card-header,
  .card-content,
  .card-footer {
    padding: 12px;
  }
  
  .card-content {
    padding-top: 0;
  }
  
  .card-footer {
    padding-top: 0;
  }
  
  .task-title {
    font-size: 0.9rem;
  }
  
  .task-description {
    font-size: 0.8rem;
    max-height: 40px;
    -webkit-line-clamp: 2;
  }
}
</style>