<template>
  <div class="projects-view pa-4">
    <!-- Header Card -->
    <v-card class="mb-6">
      <v-card-text class="pb-2">
        <v-row align="center">
          <v-col cols="12" md="6">
            <h1 class="text-h4 font-weight-bold">Projects</h1>
            <p class="text-body-1 text-medium-emphasis mt-1">
              Manage and organize your project portfolio
            </p>
          </v-col>
          <v-col cols="12" md="6" class="text-md-end">
            <v-btn
              color="primary"
              prepend-icon="mdi-plus"
              @click="showCreateDialog = true"
            >
              New Project
            </v-btn>
          </v-col>
        </v-row>

        <v-row class="mt-4">
          <v-col cols="12" md="4">
            <v-text-field
              v-model="searchQuery"
              prepend-inner-icon="mdi-magnify"
              label="Search projects"
              variant="outlined"
              density="compact"
              hide-details
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-select
              v-model="statusFilter"
              :items="statusOptions"
              label="Status"
              variant="outlined"
              density="compact"
              clearable
              hide-details
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-select
              v-model="teamFilter"
              :items="teamOptions"
              label="Team"
              variant="outlined"
              density="compact"
              clearable
              hide-details
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
        
        <v-col v-if="filteredProjects.length === 0" cols="12">
          <v-card class="text-center pa-8">
            <v-icon size="64" color="grey-lighten-1" class="mb-4">
              mdi-folder-outline
            </v-icon>
            <h3 class="text-h6 mb-2">No projects found</h3>
            <p class="text-body-2 text-medium-emphasis mb-4">
              {{ searchQuery || statusFilter || teamFilter 
                ? 'Try adjusting your filters' 
                : 'Create your first project to get started' }}
            </p>
            <v-btn
              v-if="!searchQuery && !statusFilter && !teamFilter"
              color="primary"
              prepend-icon="mdi-plus"
              @click="showCreateDialog = true"
            >
              Create First Project
            </v-btn>
          </v-card>
        </v-col>
      </v-row>
    </div>

    <div v-show="viewMode === 'list'" class="projects-list">
      <v-card>
        <v-data-table
          ref="dataTable"
          :headers="tableHeaders"
          :items="filteredProjects"
          :search="searchQuery"
          item-value="id"
          class="elevation-0"
        >
          <template #item.name="{ item }">
            <div class="d-flex align-center">
              <v-avatar
                size="32"
                :color="item.color"
                class="mr-3"
              >
                <span class="text-white text-body-2">
                  {{ item.name.charAt(0) }}
                </span>
              </v-avatar>
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
              {{ item.status }}
            </v-chip>
          </template>

          <template #item.progress="{ item }">
            <div class="d-flex align-center">
              <v-progress-linear
                :model-value="getProjectProgress(item.id)"
                height="6"
                rounded
                class="mr-2"
                style="min-width: 100px;"
              />
              <span class="text-caption">{{ getProjectProgress(item.id) }}%</span>
            </div>
          </template>

          <template #item.teams="{ item }">
            <div class="d-flex avatar-group">
              <v-avatar
                v-for="(teamId, index) in item.teamIds.slice(0, 3)"
                :key="teamId"
                size="24"
                :class="index > 0 ? 'avatar-group-item' : ''"
              >
                <span class="text-caption">
                  {{ getTeamById(teamId)?.name?.charAt(0) || 'T' }}
                </span>
              </v-avatar>
              <v-avatar
                v-if="item.teamIds.length > 3"
                size="24"
                color="grey-lighten-1"
                class="avatar-group-item"
              >
                <span class="text-caption">+{{ item.teamIds.length - 3 }}</span>
              </v-avatar>
            </div>
          </template>

          <template #item.dueDate="{ item }">
            <span class="text-body-2">{{ formatDate(item.dueDate) }}</span>
          </template>

          <template #item.actions="{ item }">
            <div class="d-flex justify-center">
              <v-menu location="bottom end" :attach="dataTable?.$el">
                <template #activator="{ props }">
                  <v-btn v-bind="props" icon="mdi-dots-vertical" size="small" variant="text" />
                </template>
                <v-list density="compact">
                  <v-list-item @click="viewKanban(item)">
                    <template #prepend>
                      <v-icon>mdi-view-column</v-icon>
                    </template>
                    <v-list-item-title>View Kanban</v-list-item-title>
                  </v-list-item>
                  <v-list-item @click="viewRoadmap(item)">
                    <template #prepend>
                      <v-icon>mdi-timeline</v-icon>
                    </template>
                    <v-list-item-title>View Roadmap</v-list-item-title>
                  </v-list-item>
                  <v-divider />
                  <v-list-item @click="editProject(item)">
                    <template #prepend>
                      <v-icon>mdi-pencil</v-icon>
                    </template>
                    <v-list-item-title>Edit</v-list-item-title>
                  </v-list-item>
                  <v-list-item @click="confirmDelete(item)" class="text-error">
                    <template #prepend>
                      <v-icon color="error">mdi-delete</v-icon>
                    </template>
                    <v-list-item-title>Delete</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-menu>
            </div>
          </template>
        </v-data-table>
      </v-card>
    </div>

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
          Are you sure you want to delete <strong>{{ deletingProject?.name }}</strong>?
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
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useProjectsStore } from '@/stores/projects'
import { useTasksStore } from '@/stores/tasks'
import { useUIStore } from '@/stores/ui'
import ProjectCard from '@/components/project/ProjectCard.vue'
import ProjectDialog from '@/components/project/ProjectDialog.vue'

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

// Initialize data
onMounted(() => {
  // Load projects and tasks if needed
  if (projects.value.length === 0) {
    projectsStore.fetchProjects()
  }
  if (allTasks.value.length === 0) {
    tasksStore.fetchTasks()
  }
})
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