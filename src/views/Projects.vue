<template>
  <div class="projects-view">
    <!-- Header -->
    <div class="d-flex align-center justify-space-between mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold mb-2">Projects</h1>
        <p class="text-body-1 text-medium-emphasis">
          Manage your projects and track progress across teams
        </p>
      </div>
      
      <v-btn
        color="primary"
        size="large"
        prepend-icon="mdi-plus"
        @click="showCreateDialog = true"
      >
        New Project
      </v-btn>
    </div>

    <!-- Filters and Search -->
    <v-card class="mb-6">
      <v-card-text>
        <v-row align="center">
          <v-col cols="12" md="4">
            <v-text-field
              v-model="searchQuery"
              placeholder="Search projects..."
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="compact"
              hide-details
              clearable
            />
          </v-col>
          
          <v-col cols="12" md="3">
            <v-select
              v-model="statusFilter"
              :items="statusOptions"
              label="Status"
              variant="outlined"
              density="compact"
              hide-details
              clearable
            />
          </v-col>
          
          <v-col cols="12" md="3">
            <v-select
              v-model="teamFilter"
              :items="teamOptions"
              label="Team"
              variant="outlined"
              density="compact"
              hide-details
              clearable
            />
          </v-col>
          
          <v-col cols="12" md="2">
            <v-btn-toggle
              v-model="viewMode"
              variant="outlined"
              mandatory
              class="w-100"
            >
              <v-btn value="grid" icon="mdi-view-grid" />
              <v-btn value="list" icon="mdi-view-list" />
            </v-btn-toggle>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Projects Grid/List -->
    <div v-show="viewMode === 'grid'" class="projects-grid">
      <v-row>
        <v-col
          v-for="project in filteredProjects"
          :key="project.id"
          cols="12"
          md="6"
          lg="4"
        >
          <ProjectCard
            :project="project"
            @edit="editProject"
            @delete="confirmDelete"
            @view-kanban="viewKanban"
            @view-roadmap="viewRoadmap"
          />
        </v-col>
      </v-row>
    </div>

    <div v-show="viewMode === 'list'" class="projects-list">
      <v-card>
        <v-data-table
          ref="dataTable"
          :headers="tableHeaders"
          :items="draggableProjects"
          :search="searchQuery"
          item-value="id"
          class="elevation-0"
        >
          <template #item.name="{ item }">
            <div class="d-flex align-center">
              <v-avatar
                v-if="!item.drag"
                size="32"
                :color="item.color"
                class="mr-3"
              >
                <span class="text-white text-body-2">
                  {{ item.name.charAt(0) }}
                </span>
              </v-avatar>
              <v-icon v-else class="drag-handle mr-3" style="cursor: move;">
                mdi-drag-horizontal
              </v-icon>
              <div>
                <div class="font-weight-medium">{{ item.name }}</div>
                <div class="text-caption text-medium-emphasis">
                  {{ item.description }}
                </div>
              </div>
            </div>
          </template>
          
          <template #item.status="{ item }">
            <v-chip
              :color="getStatusColor(item.status)"
              size="small"
              variant="flat"
            >
              {{ item.status.toUpperCase() }}
            </v-chip>
          </template>
          
          <template #item.progress="{ item }">
            <div class="d-flex align-center">
              <v-progress-linear
                :model-value="getProjectProgress(item.id)"
                :color="item.color"
                height="6"
                rounded
                class="mr-2"
                style="min-width: 100px;"
              />
              <span class="text-caption">{{ getProjectProgress(item.id) }}%</span>
            </div>
          </template>
          
          <template #item.teams="{ item }">
            <div class="d-flex align-center">
              <div class="avatar-group">
                <v-avatar
                  v-for="teamId in item.teamIds.slice(0, 3)"
                  :key="teamId"
                  size="24"
                  :color="getTeamById(teamId)?.color"
                  class="avatar-group-item"
                >
                  <span class="text-caption text-white">
                    {{ getTeamById(teamId)?.name?.charAt(0) }}
                  </span>
                </v-avatar>
              </div>
              <span v-if="item.teamIds.length > 3" class="text-caption ml-2">
                +{{ item.teamIds.length - 3 }}
              </span>
            </div>
          </template>
          
          <template #item.dueDate="{ item }">
            <span class="text-body-2">
              {{ formatDate(item.endDate) }}
            </span>
          </template>
          
          <template #item.actions="{ item }">
            <v-menu>
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
                  prepend-icon="mdi-view-column"
                  title="Kanban Board"
                  @click="viewKanban(item)"
                />
                <v-list-item
                  prepend-icon="mdi-map"
                  title="Roadmap"
                  @click="viewRoadmap(item)"
                />
                <v-divider />
                <v-list-item
                  prepend-icon="mdi-pencil"
                  title="Edit"
                  @click="editProject(item)"
                />
                <v-list-item
                  prepend-icon="mdi-delete"
                  title="Delete"
                  @click="confirmDelete(item)"
                />
              </v-list>
            </v-menu>
          </template>
        </v-data-table>
      </v-card>
    </div>

    <!-- Empty State -->
    <v-card v-if="filteredProjects.length === 0" class="text-center pa-8">
      <v-icon size="64" color="medium-emphasis" class="mb-4">
        mdi-folder-multiple-outline
      </v-icon>
      <h3 class="text-h6 mb-2">No Projects Found</h3>
      <p class="text-body-2 text-medium-emphasis mb-4">
        {{ searchQuery ? 'Try adjusting your search or filters.' : 'Get started by creating your first project.' }}
      </p>
      <v-btn
        v-if="!searchQuery"
        color="primary"
        prepend-icon="mdi-plus"
        @click="showCreateDialog = true"
      >
        Create Project
      </v-btn>
    </v-card>

    <!-- Create/Edit Project Dialog -->
    <ProjectDialog
      v-model="showCreateDialog"
      :project="editingProject"
      @save="handleProjectSave"
      @close="handleDialogClose"
    />

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="showDeleteDialog" max-width="400">
      <v-card>
        <v-card-title class="text-h6">Delete Project</v-card-title>
        <v-card-text>
          Are you sure you want to delete "{{ deletingProject?.name }}"? 
          This action cannot be undone and will also delete all associated tasks.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="showDeleteDialog = false">Cancel</v-btn>
          <v-btn
            color="error"
            @click="handleDelete"
            :loading="deleting"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useProjectsStore } from '@/stores/projects'
import { useTasksStore } from '@/stores/tasks'
import { useUIStore } from '@/stores/ui'
import ProjectCard from '@/components/project/ProjectCard.vue'
import ProjectDialog from '@/components/project/ProjectDialog.vue'
import { useDraggable } from 'vue-draggable-plus'

// Composables
const router = useRouter()
const projectsStore = useProjectsStore()
const tasksStore = useTasksStore()
const uiStore = useUIStore()

// Local state
const searchQuery = ref('')
const statusFilter = ref('')
const teamFilter = ref('')
const viewMode = ref('grid')
const dataTable = ref(null)
const showCreateDialog = ref(false)
const showDeleteDialog = ref(false)
const editingProject = ref(null)
const deletingProject = ref(null)
const deleting = ref(false)
const draggableInstance = ref(null)

// Store getters
const projects = computed(() => projectsStore.projects)
const teams = computed(() => projectsStore.teams)
const allTasks = computed(() => tasksStore.tasks)

// Options for filters
const statusOptions = computed(() => [
  { title: 'Active', value: 'active' },
  { title: 'On Hold', value: 'on-hold' },
  { title: 'Completed', value: 'completed' },
  { title: 'Cancelled', value: 'cancelled' }
])

const teamOptions = computed(() => 
  teams.value.map(team => ({
    title: team.name,
    value: team.id
  }))
)

// Table headers for list view
const tableHeaders = [
  { title: '', key: 'name', sortable: false, width: '30px' },
  { title: 'Project', key: 'name', sortable: true },
  { title: 'Status', key: 'status', sortable: true },
  { title: 'Progress', key: 'progress', sortable: false },
  { title: 'Teams', key: 'teams', sortable: false },
  { title: 'Due Date', key: 'dueDate', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false, align: 'center' }
]

// Computed
const filteredProjects = computed(() => {
  let filtered = projects.value

  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(project =>
      project.name.toLowerCase().includes(query) ||
      project.description.toLowerCase().includes(query)
    )
  }

  // Status filter
  if (statusFilter.value) {
    filtered = filtered.filter(project => project.status === statusFilter.value)
  }

  // Team filter
  if (teamFilter.value) {
    filtered = filtered.filter(project => 
      project.teamIds.includes(teamFilter.value)
    )
  }

  return filtered
})

const draggableProjects = computed({
  get: () => filteredProjects.value.map(p => ({ ...p, drag: true })),
  set: (newOrder) => {
    // If you need to persist the order, you can map the newOrder
    // back to an array of IDs and call a store action here.
    // For example:
    // const newProjectOrder = newOrder.map(p => p.id);
    // projectsStore.updateProjectOrder(newProjectOrder);
  }
})

const draggableOptions = computed(() => ({
  animation: 150,
  handle: '.drag-handle'
}))

// Methods
const getProjectProgress = (projectId) => {
  const projectTasks = allTasks.value.filter(task => task.projectId === projectId)
  if (projectTasks.length === 0) return 0
  
  const completedTasks = projectTasks.filter(task => task.columnId === 'done')
  return Math.round((completedTasks.length / projectTasks.length) * 100)
}

const getStatusColor = (status) => {
  const colors = {
    active: 'success',
    'on-hold': 'warning',
    completed: 'info',
    cancelled: 'error'
  }
  return colors[status] || 'grey'
}

const getTeamById = (teamId) => {
  return projectsStore.getTeamById(teamId)
}

const formatDate = (dateString) => {
  if (!dateString) return 'No due date'
  return new Date(dateString).toLocaleDateString()
}

const editProject = (project) => {
  editingProject.value = { ...project }
  showCreateDialog.value = true
}

const confirmDelete = (project) => {
  deletingProject.value = project
  showDeleteDialog.value = true
}

const viewKanban = (project) => {
  projectsStore.setCurrentProject(project.id)
  router.push(`/kanban/${project.id}`)
}

const viewRoadmap = (project) => {
  projectsStore.setCurrentProject(project.id)
  router.push(`/roadmap/${project.id}`)
}

const handleProjectSave = async (projectData) => {
  try {
    if (editingProject.value) {
      // Update existing project
      await projectsStore.updateProject(editingProject.value.id, projectData)
      uiStore.showSuccess('Project updated successfully')
    } else {
      // Create new project
      const newProject = await projectsStore.createProject(projectData)
      uiStore.showSuccess('Project created successfully')
      
      // Optionally navigate to the new project
      if (projectData.redirectToKanban) {
        projectsStore.setCurrentProject(newProject.id)
        router.push(`/kanban/${newProject.id}`)
      }
    }
  } catch (error) {
    uiStore.showError(`Failed to ${editingProject.value ? 'update' : 'create'} project: ${error.message}`)
  }
}

const handleDialogClose = () => {
  showCreateDialog.value = false
  editingProject.value = null
}

const handleDelete = async () => {
  if (!deletingProject.value) return
  
  try {
    deleting.value = true
    
    // Delete all tasks associated with the project
    const projectTasks = allTasks.value.filter(task => 
      task.projectId === deletingProject.value.id
    )
    
    if (projectTasks.length > 0) {
      await tasksStore.bulkDeleteTasks(projectTasks.map(task => task.id))
    }
    
    // Delete the project
    await projectsStore.deleteProject(deletingProject.value.id)
    
    uiStore.showSuccess('Project deleted successfully')
    showDeleteDialog.value = false
    deletingProject.value = null
  } catch (error) {
    uiStore.showError(`Failed to delete project: ${error.message}`)
  } finally {
    deleting.value = false
  }
}

// --- Drag and Drop Logic ---

const initDraggable = () => {
  // Ensure we run this after the DOM has been updated
  nextTick(() => {
    if (draggableInstance.value) return // Already initialized

    const tbody = dataTable.value?.$el?.querySelector('tbody')
    if (tbody) {
      draggableInstance.value = useDraggable(tbody, draggableProjects, draggableOptions)
    }
  })
}

const destroyDraggable = () => {
  if (draggableInstance.value) {
    draggableInstance.value.destroy()
    draggableInstance.value = null
  }
}

// Watch for conditions to be right for initializing or destroying draggable
watch([viewMode, filteredProjects], ([mode, projects]) => {
  if (mode === 'list' && projects.length > 0) {
    initDraggable()
  } else {
    destroyDraggable()
  }
})

// Clean up on component unmount
onBeforeUnmount(destroyDraggable)
</script>

<style scoped>
.projects-grid .v-col {
  display: flex;
}

.projects-view {
  max-width: 100%;
}

.avatar-group {
  display: flex;
}

.avatar-group-item {
  margin-left: -8px;
  border: 2px solid rgb(var(--v-theme-surface));
  transition: transform 0.2s ease-in-out;
}

.avatar-group-item:first-child {
  margin-left: 0;
}

:deep(.v-data-table) {
  background: transparent;
}

:deep(.v-data-table .v-data-table__td) {
  padding: 12px 16px;
}

:deep(.v-data-table .v-data-table__th) {
  padding: 12px 16px;
  font-weight: 600;
}

@media (max-width: 960px) {
  .projects-grid .v-col {
    margin-bottom: 16px;
  }
}
</style>