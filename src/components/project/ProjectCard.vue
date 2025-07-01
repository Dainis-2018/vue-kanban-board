<template>
  <v-card 
    class="project-card h-100 d-flex flex-column"
    :class="{ 'project-card--current': isCurrentProject }"
    elevation="2"
    hover
  >
    <!-- Header with Project Color -->
    <div 
      class="project-header"
      :style="{ backgroundColor: project.color }"
    >
      <div class="d-flex align-center justify-space-between pa-4">
        <v-avatar 
          size="40" 
          color="white" 
          variant="flat"
        >
          <span 
            class="text-h6 font-weight-bold"
            :style="{ color: project.color }"
          >
            {{ project.name.charAt(0) }}
          </span>
        </v-avatar>
        
        <v-menu>
          <template #activator="{ props }">
            <v-btn
              v-bind="props"
              icon="mdi-dots-vertical"
              variant="text"
              color="white"
              size="small"
            />
          </template>
          
          <v-list density="compact">
            <v-list-item
              prepend-icon="mdi-view-column"
              title="Kanban Board"
              @click="$emit('view-kanban', project)"
            />
            <v-list-item
              prepend-icon="mdi-map"
              title="Roadmap"
              @click="$emit('view-roadmap', project)"
            />
            <v-divider />
            <v-list-item
              prepend-icon="mdi-pencil"
              title="Edit"
              @click="$emit('edit', project)"
            />
            <v-list-item
              prepend-icon="mdi-delete"
              title="Delete"
              @click="$emit('delete', project)"
            />
          </v-list>
        </v-menu>
      </div>
    </div>

    <!-- Content -->
    <v-card-text class="flex-grow-1 d-flex flex-column pa-4">
      <!-- Project Title and Description -->
      <div class="mb-3">
        <h3 class="text-h6 font-weight-bold mb-1 text-truncate">
          {{ project.name }}
        </h3>
        <p class="text-body-2 text-medium-emphasis line-clamp-2">
          {{ project.description }}
        </p>
      </div>

      <!-- Status Badge -->
      <div class="mb-3">
        <v-chip
          :color="getStatusColor(project.status)"
          size="small"
          variant="flat"
        >
          {{ project.status.replace('-', ' ').toUpperCase() }}
        </v-chip>
      </div>

      <!-- Progress -->
      <div class="mb-3">
        <div class="d-flex align-center justify-space-between mb-1">
          <span class="text-body-2 font-weight-medium">Progress</span>
          <span class="text-body-2 text-medium-emphasis">
            {{ progress }}%
          </span>
        </div>
        <v-progress-linear
          :model-value="progress"
          :color="project.color"
          height="6"
          rounded
        />
        <div class="d-flex justify-space-between mt-1">
          <span class="text-caption text-medium-emphasis">
            {{ completedTasks }} completed
          </span>
          <span class="text-caption text-medium-emphasis">
            {{ totalTasks }} total tasks
          </span>
        </div>
      </div>

      <!-- Dates -->
      <div class="mb-3">
        <div class="d-flex align-center justify-space-between">
          <div class="text-center flex-grow-1">
            <p class="text-caption text-medium-emphasis mb-0">Start Date</p>
            <p class="text-body-2 font-weight-medium">
              {{ formatDate(project.startDate) }}
            </p>
          </div>
          <v-divider vertical class="mx-3" />
          <div class="text-center flex-grow-1">
            <p class="text-caption text-medium-emphasis mb-0">End Date</p>
            <p class="text-body-2 font-weight-medium" :class="isOverdue ? 'text-error' : ''">
              {{ formatDate(project.endDate) }}
            </p>
          </div>
        </div>
      </div>

      <!-- Teams -->
      <div class="mb-3 flex-grow-1">
        <p class="text-body-2 font-weight-medium mb-2">Teams</p>
        <div class="d-flex flex-wrap ga-1">
          <v-chip
            v-for="teamId in project.teamIds.slice(0, 3)"
            :key="teamId"
            :color="getTeamColor(teamId)"
            size="x-small"
            variant="outlined"
          >
            {{ getTeamName(teamId) }}
          </v-chip>
          <v-chip
            v-if="project.teamIds.length > 3"
            size="x-small"
            variant="outlined"
            color="grey"
          >
            +{{ project.teamIds.length - 3 }} more
          </v-chip>
        </div>
      </div>

      <!-- Team Members Avatars -->
      <div class="mb-3">
        <p class="text-body-2 font-weight-medium mb-2">Team Members</p>
        <div class="d-flex align-center">
          <div class="avatar-group mr-2">
            <v-avatar
              v-for="user in teamMembers.slice(0, 6)"
              :key="user.id"
              size="28"
              class="avatar-group-item"
            >
              <v-img
                :src="user.avatar"
                :alt="user.name"
              />
            </v-avatar>
          </div>
          <span v-if="teamMembers.length > 6" class="text-caption text-medium-emphasis">
            +{{ teamMembers.length - 6 }} more
          </span>
        </div>
      </div>
    </v-card-text>

    <!-- Actions -->
    <v-card-actions class="pa-4 pt-0">
      <v-btn
        :color="project.color"
        variant="flat"
        block
        prepend-icon="mdi-view-column"
        @click="$emit('view-kanban', project)"
      >
        Open Kanban
      </v-btn>
    </v-card-actions>

    <!-- Current Project Indicator -->
    <div
      v-if="isCurrentProject"
      class="current-project-indicator"
      :style="{ backgroundColor: project.color }"
    >
      <v-icon size="16" color="white">mdi-check-circle</v-icon>
      <span class="text-caption text-white ml-1">Current</span>
    </div>
  </v-card>
</template>

<script setup>
import { computed } from 'vue'
import { useProjectsStore } from '@/stores/projects'
import { useTasksStore } from '@/stores/tasks'

// Props
const props = defineProps({
  project: {
    type: Object,
    required: true
  }
})

// Emits
defineEmits(['edit', 'delete', 'view-kanban', 'view-roadmap'])

// Composables
const projectsStore = useProjectsStore()
const tasksStore = useTasksStore()

// Computed
const isCurrentProject = computed(() => 
  projectsStore.currentProjectId === props.project.id
)

const projectTasks = computed(() => 
  tasksStore.tasks.filter(task => task.projectId === props.project.id)
)

const totalTasks = computed(() => projectTasks.value.length)

const completedTasks = computed(() => 
  projectTasks.value.filter(task => task.columnId === 'done').length
)

const progress = computed(() => {
  if (totalTasks.value === 0) return 0
  return Math.round((completedTasks.value / totalTasks.value) * 100)
})

const isOverdue = computed(() => {
  if (!props.project.endDate) return false
  return new Date(props.project.endDate) < new Date()
})

const teamMembers = computed(() => {
  const memberIds = projectsStore.teams
    .filter(team => props.project.teamIds.includes(team.id))
    .flatMap(team => team.members)
  
  // Remove duplicates
  const uniqueMemberIds = [...new Set(memberIds)]
  
  return uniqueMemberIds
    .map(memberId => projectsStore.getUserById(memberId))
    .filter(Boolean)
})

// Methods
const getStatusColor = (status) => {
  const colors = {
    active: 'success',
    'on-hold': 'warning',
    completed: 'info',
    cancelled: 'error'
  }
  return colors[status] || 'grey'
}

const getTeamName = (teamId) => {
  const team = projectsStore.getTeamById(teamId)
  return team?.name || 'Unknown Team'
}

const getTeamColor = (teamId) => {
  const team = projectsStore.getTeamById(teamId)
  return team?.color || 'grey'
}

const formatDate = (dateString) => {
  if (!dateString) return 'Not set'
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}
</script>

<style scoped>
.project-card {
  position: relative;
  transition: all 0.3s ease;
  border-radius: 12px;
  overflow: hidden;
}

.project-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.project-card--current {
  border: 2px solid rgb(var(--v-theme-primary));
}

.project-header {
  position: relative;
  background: linear-gradient(135deg, var(--color) 0%, var(--color-dark) 100%);
}

.current-project-indicator {
  position: absolute;
  top: 12px;
  right: 12px;
  padding: 4px 8px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.2);
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.avatar-group {
  display: flex;
}

.avatar-group-item {
  margin-left: -10px;
  border: 2px solid rgb(var(--v-theme-surface));
  transition: transform 0.2s ease-in-out;
}
.avatar-group-item:first-child {
  margin-left: 0;
}

:deep(.v-progress-linear) {
  border-radius: 3px;
}

@media (max-width: 960px) {
  .project-card {
    margin-bottom: 16px;
  }
}
</style>