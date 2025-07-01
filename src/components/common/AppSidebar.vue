<template>
  <v-navigation-drawer
    v-model="localDrawer"
    app
    :rail="rail"
    permanent
    :width="280"
    :rail-width="72"
    class="sidebar"
  >
    <!-- Sidebar Header -->
    <div class="sidebar-header pa-4 d-flex align-center">
      <v-icon 
        color="primary" 
        size="32"
        class="mr-3"
      >
        mdi-view-dashboard
      </v-icon>
      <v-fade-transition>
        <div v-show="!rail" class="flex-grow-1">
          <h2 class="text-h6 font-weight-bold text-primary">
            Kanban Board
          </h2>
          <p class="text-caption text-medium-emphasis ma-0">
            Project Management
          </p>
        </div>
      </v-fade-transition>
      
      <v-btn
        icon
        variant="text"
        size="small"
        @click="toggleRail"
        class="ml-auto"
      >
        <v-icon>{{ rail ? 'mdi-chevron-right' : 'mdi-chevron-left' }}</v-icon>
      </v-btn>
    </div>

    <v-divider />

    <!-- Project Selector -->
    <div class="px-4 py-2">
      <v-fade-transition>
        <div v-show="!rail">
          <v-select
            v-model="selectedProject"
            :items="projectItems"
            item-title="name"
            item-value="id"
            label="Current Project"
            variant="outlined"
            density="compact"
            hide-details
            @update:model-value="handleProjectChange"
          >
            <template #prepend-inner>
              <v-icon color="primary" size="20">mdi-folder</v-icon>
            </template>
            <template #item="{ props, item }">
              <v-list-item v-bind="props">
                <template #prepend>
                  <v-avatar size="20" :color="item.raw.color">
                    <span class="text-white text-caption">
                      {{ item.raw.name.charAt(0) }}
                    </span>
                  </v-avatar>
                </template>
              </v-list-item>
            </template>
          </v-select>
        </div>
      </v-fade-transition>
      
      <!-- Rail Mode Project Indicator -->
      <v-fade-transition>
        <div v-show="rail" class="text-center">
          <v-tooltip location="right">
            <template #activator="{ props }">
              <v-avatar 
                v-bind="props"
                size="32" 
                :color="currentProject?.color || 'primary'"
                class="mx-auto"
              >
                <span class="text-white text-body-2">
                  {{ currentProject?.name?.charAt(0) || 'P' }}
                </span>
              </v-avatar>
            </template>
            <span>{{ currentProject?.name || 'No Project' }}</span>
          </v-tooltip>
        </div>
      </v-fade-transition>
    </div>

    <v-divider />

    <!-- Navigation Menu -->
    <v-list nav density="compact">
      <v-list-item
        v-for="item in navigationItems"
        :key="item.title"
        :to="item.to"
        :prepend-icon="item.icon"
        :title="item.title"
        :value="item.title"
        color="primary"
        class="mx-2 mb-1"
        rounded="lg"
      >
        <template #append v-if="item.badge">
          <v-badge 
            :content="item.badge" 
            color="error" 
            inline
          />
        </template>
      </v-list-item>
    </v-list>

    <v-divider class="my-4" />

    <!-- Quick Actions -->
    <div class="px-4">
      <v-fade-transition>
        <div v-show="!rail">
          <p class="text-caption text-medium-emphasis mb-2 font-weight-medium">
            QUICK ACTIONS
          </p>
          <v-btn
            block
            color="primary"
            variant="outlined"
            size="small"
            prepend-icon="mdi-plus"
            class="mb-2"
            @click="createTask"
          >
            New Task
          </v-btn>
          <v-btn
            block
            color="secondary"
            variant="outlined"
            size="small"
            prepend-icon="mdi-folder-plus"
            @click="createProject"
          >
            New Project
          </v-btn>
        </div>
      </v-fade-transition>
      
      <!-- Rail Mode Quick Actions -->
      <v-fade-transition>
        <div v-show="rail" class="text-center">
          <v-tooltip location="right">
            <template #activator="{ props }">
              <v-btn
                v-bind="props"
                icon
                size="small"
                color="primary"
                variant="outlined"
                class="mb-2"
                @click="createTask"
              >
                <v-icon>mdi-plus</v-icon>
              </v-btn>
            </template>
            <span>New Task</span>
          </v-tooltip>
          
          <v-tooltip location="right">
            <template #activator="{ props }">
              <v-btn
                v-bind="props"
                icon
                size="small"
                color="secondary"
                variant="outlined"
                @click="createProject"
              >
                <v-icon>mdi-folder-plus</v-icon>
              </v-btn>
            </template>
            <span>New Project</span>
          </v-tooltip>
        </div>
      </v-fade-transition>
    </div>

    <!-- Team Members (when not in rail mode) -->
    <template v-if="!rail && projectUsers.length > 0">
      <v-divider class="my-4" />
      <div class="px-4">
        <p class="text-caption text-medium-emphasis mb-2 font-weight-medium">
          TEAM MEMBERS
        </p>
        <div class="d-flex flex-wrap ga-1">
          <v-tooltip
            v-for="user in projectUsers.slice(0, 8)"
            :key="user.id"
            location="top"
          >
            <template #activator="{ props }">
              <v-avatar
                v-bind="props"
                size="32"
                class="border"
              >
                <v-img
                  :src="user.avatar"
                  :alt="user.name"
                />
              </v-avatar>
            </template>
            <span>{{ user.name }} - {{ user.role }}</span>
          </v-tooltip>
          
          <v-avatar
            v-if="projectUsers.length > 8"
            size="32"
            color="surface-variant"
            class="border"
          >
            <span class="text-caption">+{{ projectUsers.length - 8 }}</span>
          </v-avatar>
        </div>
      </div>
    </template>

    <!-- Spacer -->
    <v-spacer />

    <!-- Bottom Actions -->
    <div class="px-4 pb-4">
      <v-divider class="mb-4" />
      
      <v-fade-transition>
        <div v-show="!rail">
          <v-list nav density="compact">
            <v-list-item
              prepend-icon="mdi-cog"
              title="Settings"
              @click="openSettings"
              class="mb-1"
              rounded="lg"
            />
            <v-list-item
              prepend-icon="mdi-help-circle"
              title="Help & Support"
              @click="openHelp"
              rounded="lg"
            />
          </v-list>
        </div>
      </v-fade-transition>
      
      <v-fade-transition>
        <div v-show="rail" class="text-center">
          <v-tooltip location="right">
            <template #activator="{ props }">
              <v-btn
                v-bind="props"
                icon
                variant="text"
                size="small"
                class="mb-2"
                @click="openSettings"
              >
                <v-icon>mdi-cog</v-icon>
              </v-btn>
            </template>
            <span>Settings</span>
          </v-tooltip>
          
          <v-tooltip location="right">
            <template #activator="{ props }">
              <v-btn
                v-bind="props"
                icon
                variant="text"
                size="small"
                @click="openHelp"
              >
                <v-icon>mdi-help-circle</v-icon>
              </v-btn>
            </template>
            <span>Help & Support</span>
          </v-tooltip>
        </div>
      </v-fade-transition>
    </div>
  </v-navigation-drawer>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useProjectsStore } from '@/stores/projects'
import { useTasksStore } from '@/stores/tasks'

// Props & Emits
const props = defineProps({
  drawer: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['update:drawer'])

// Composables
const router = useRouter()
const route = useRoute()
const projectsStore = useProjectsStore()
const tasksStore = useTasksStore()

// Local state
const rail = ref(false)
const localDrawer = computed({
  get: () => props.drawer,
  set: (value) => emit('update:drawer', value)
})

// Store getters
const currentProject = computed(() => projectsStore.currentProject)
const projects = computed(() => projectsStore.projects)
const projectUsers = computed(() => projectsStore.projectUsers)
const pendingTasksCount = computed(() => tasksStore.pendingTasksCount)

// Computed
const selectedProject = computed({
  get: () => projectsStore.currentProjectId,
  set: (value) => projectsStore.setCurrentProject(value)
})

const projectItems = computed(() => 
  projects.value.map(project => ({
    id: project.id,
    name: project.name,
    color: project.color
  }))
)

const navigationItems = computed(() => [
  {
    title: 'Dashboard',
    icon: 'mdi-view-dashboard',
    to: '/dashboard'
  },
  {
    title: 'Projects',
    icon: 'mdi-folder-multiple',
    to: '/projects'
  },
  {
    title: 'Kanban Board',
    icon: 'mdi-view-column',
    to: `/kanban/${currentProject.value?.id || ''}`,
    badge: pendingTasksCount.value > 0 ? pendingTasksCount.value : null
  },
  {
    title: 'Roadmap',
    icon: 'mdi-map',
    to: `/roadmap/${currentProject.value?.id || ''}`
  },
  {
    title: 'Teams',
    icon: 'mdi-account-group',
    to: '/teams'
  }
])

// Methods
const toggleRail = () => {
  rail.value = !rail.value
}

const handleProjectChange = (projectId) => {
  projectsStore.setCurrentProject(projectId)
  
  // Update route if we're on a project-specific page
  if (route.name === 'Kanban' || route.name === 'Roadmap') {
    router.push({
      name: route.name,
      params: { projectId }
    })
  }
}

const createTask = () => {
  // TODO: Open task creation dialog
  console.log('Create new task')
}

const createProject = () => {
  // TODO: Open project creation dialog
  console.log('Create new project')
}

const openSettings = () => {
  console.log('Open settings')
}

const openHelp = () => {
  console.log('Open help')
}

// Watch for route changes to update current project
watch(() => route.params.projectId, (projectId) => {
  if (projectId && projectId !== projectsStore.currentProjectId) {
    projectsStore.setCurrentProject(projectId)
  }
}, { immediate: true })
</script>

<style scoped>
.sidebar {
  border-right: 1px solid rgb(var(--v-theme-surface-variant));
}

.sidebar-header {
  border-bottom: 1px solid rgb(var(--v-theme-surface-variant));
  min-height: 64px;
}

:deep(.v-list-item) {
  margin-bottom: 4px;
  border-radius: 8px;
}

:deep(.v-list-item--active) {
  background-color: rgb(var(--v-theme-primary), 0.1);
  color: rgb(var(--v-theme-primary));
}

:deep(.v-list-item--active .v-list-item__prepend .v-icon) {
  color: rgb(var(--v-theme-primary));
}

.v-navigation-drawer--rail {
  :deep(.v-list-item__prepend) {
    margin-inline-end: 0;
  }
}
</style>