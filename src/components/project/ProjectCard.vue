<template>
  <v-card 
    class="project-card h-100"
    elevation="2"
    :class="{ 
      'project-card--current': isCurrentProject,
      'project-card--overdue': isOverdue 
    }"
  >
    <!-- Header -->
    <v-card-text class="pb-2">
      <div class="d-flex align-center justify-space-between mb-3">
        <v-avatar
          :color="project.color"
          size="40"
        >
          <span class="text-white text-h6">
            {{ project.name.charAt(0) }}
          </span>
        </v-avatar>
        
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
            <v-list-item @click="$emit('edit', project)">
              <template #prepend>
                <v-icon>mdi-pencil</v-icon>
              </template>
              <v-list-item-title>Edit</v-list-item-title>
            </v-list-item>
            <v-list-item @click="$emit('view-roadmap', project)">
              <template #prepend>
                <v-icon>mdi-map</v-icon>
              </template>
              <v-list-item-title>View Roadmap</v-list-item-title>
            </v-list-item>
            <v-divider />
            <v-list-item @click="$emit('delete', project)" class="text-error">
              <template #prepend>
                <v-icon color="error">mdi-delete</v-icon>
              </template>
              <v-list-item-title>Delete</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </div>

      <!-- Project Name & Description -->
      <div class="mb-3">
        <h3 class="text-h6 font-weight-bold mb-1">{{ project.name }}</h3>
        <p class="text-body-2 text-medium-emphasis">
          {{ project.description }}
        </p>
      </div>

      <!-- Status -->
      <div class="mb-3">
        <v-chip
          :color="getStatusColor(project.status)"
          size="small"
          variant="flat"
        >
          {{ project.status }}
        </v-chip>
      </div>

      <!-- Progress -->
      <div class="mb-3">
        <div class="d-flex align-center justify-space-between mb-2">
          <span class="text-body-2 font-weight-medium">Progress</span>
          <span class="text-body-2">{{ progress }}%</span>
        </div>
        <v-progress-linear
          :model-value="progress"
          height="6"
          rounded
          :color="project.color"
        />
        <div class="d-flex justify-space-between mt-1">
          <span class="text-caption text-medium-emphasis">
            {{ completedTasks }}/{{ totalTasks }} tasks
          </span>
          <span class="text-caption text-medium-emphasis">
            {{ totalTasks - completedTasks }} remaining
          </span>
        </div>
      </div>

      <!-- Due Date -->
      <div v-if="project.endDate" class="mb-3">
        <div class="d-flex align-center">
          <v-icon 
            size="16" 
            class="mr-2"
            :color="isOverdue ? 'error' : ''"
          >
            mdi-calendar
          </v-icon>
          <span 
            class="text-body-2"
            :class="isOverdue ? 'text-error' : ''"
          >
            Due {{ formatDate(project.endDate) }}
          </span>
        </div>
      </div>

      <!-- Teams -->
      <div class="mb-3">
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
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}
</script>

<style scoped>
.project-card {
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
}

.project-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.15);
}

.project-card--current {
  border: 2px solid rgb(var(--v-theme-primary));
}

.project-card--overdue {
  border-left: 4px solid rgb(var(--v-theme-error));
}

.avatar-group {
  display: flex;
}

.avatar-group-item {
  margin-left: -8px;
  border: 2px solid rgb(var(--v-theme-surface));
  transition: transform 0.2s ease;
}

.avatar-group-item:first-child {
  margin-left: 0;
}

.avatar-group-item:hover {
  transform: scale(1.1);
  z-index: 2;
}

.current-project-indicator {
  position: absolute;
  top: 12px;
  right: 12px;
  padding: 4px 8px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  font-size: 0.75rem;
}

@media (max-width: 600px) {
  .avatar-group-item {
    margin-left: -4px;
  }
  
  .current-project-indicator {
    top: 8px;
    right: 8px;
    padding: 2px 6px;
  }
}
</style>