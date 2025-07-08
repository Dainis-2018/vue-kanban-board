<template>
  <div class="teams-view">
    <!-- Header -->
    <div class="d-flex align-center justify-space-between mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold mb-2">Teams</h1>
        <p class="text-body-1 text-medium-emphasis">
          Manage your project teams and team members
        </p>
      </div>
      
      <v-btn
        color="primary"
        prepend-icon="mdi-plus"
        @click="showCreateDialog = true"
      >
        Create Team
      </v-btn>
    </div>

    <!-- Search and Filters -->
    <v-card class="mb-6">
      <v-card-text class="py-3">
        <v-row align="center">
          <v-col cols="12" md="6">
            <v-text-field
              v-model="searchQuery"
              placeholder="Search teams..."
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="compact"
              hide-details
              clearable
            />
          </v-col>
          
          <v-col cols="12" md="3">
            <v-select
              v-model="projectFilter"
              :items="projectOptions"
              label="Filter by Project"
              variant="outlined"
              density="compact"
              hide-details
              clearable
            />
          </v-col>
          
          <v-col cols="12" md="3">
            <v-btn-toggle
              v-model="viewMode"
              variant="outlined"
              mandatory
            >
              <v-btn value="grid" icon="mdi-view-grid" />
              <v-btn value="list" icon="mdi-format-list-bulleted" />
            </v-btn-toggle>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Teams Grid View -->
    <div v-if="viewMode === 'grid'">
      <v-row>
        <v-col
          v-for="team in filteredTeams"
          :key="team.id"
          cols="12"
          sm="6"
          lg="4"
        >
          <v-card class="team-card h-100" elevation="2">
            <v-card-text class="pa-4">
              <!-- Team Header -->
              <div class="d-flex align-center justify-space-between mb-3">
                <div class="d-flex align-center">
                  <v-avatar
                    :color="team.color"
                    size="32"
                    class="mr-3"
                  >
                    <v-icon color="white" size="18">mdi-account-group</v-icon>
                  </v-avatar>
                  <div>
                    <h3 class="text-h6 font-weight-medium">{{ team.name }}</h3>
                    <p class="text-caption text-medium-emphasis">
                      {{ team.members.length }} member{{ team.members.length !== 1 ? 's' : '' }}
                    </p>
                  </div>
                </div>
                
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
                    <v-list-item @click="editTeam(team)">
                      <template #prepend>
                        <v-icon>mdi-pencil</v-icon>
                      </template>
                      <v-list-item-title>Edit Team</v-list-item-title>
                    </v-list-item>
                    
                    <v-list-item @click="deleteTeam(team)">
                      <template #prepend>
                        <v-icon color="error">mdi-delete</v-icon>
                      </template>
                      <v-list-item-title class="text-error">Delete Team</v-list-item-title>
                    </v-list-item>
                  </v-list>
                </v-menu>
              </div>

              <!-- Team Members -->
              <div class="mb-4">
                <h4 class="text-subtitle-2 mb-2">Members</h4>
                <div v-if="getTeamMembers(team.id).length > 0" class="avatar-group">
                  <v-tooltip
                    v-for="member in getTeamMembers(team.id).slice(0, 5)"
                    :key="member.id"
                    location="top"
                  >
                    <template #activator="{ props }">
                      <v-avatar
                        v-bind="props"
                        :image="member.avatar"
                        size="32"
                        class="avatar-item"
                      >
                        {{ member.name.charAt(0) }}
                      </v-avatar>
                    </template>
                    <span>{{ member.name }} - {{ member.role }}</span>
                  </v-tooltip>
                  
                  <v-avatar
                    v-if="getTeamMembers(team.id).length > 5"
                    size="32"
                    color="grey-lighten-1"
                    class="avatar-item"
                  >
                    <span class="text-caption">+{{ getTeamMembers(team.id).length - 5 }}</span>
                  </v-avatar>
                </div>
                <p v-else class="text-caption text-medium-emphasis">
                  No members assigned
                </p>
              </div>

              <!-- Team Projects -->
              <div>
                <h4 class="text-subtitle-2 mb-2">Projects</h4>
                <div class="d-flex flex-wrap ga-1">
                  <v-chip
                    v-for="project in getTeamProjects(team.id)"
                    :key="project.id"
                    size="small"
                    :color="project.color"
                    variant="tonal"
                  >
                    {{ project.name }}
                  </v-chip>
                </div>
                <p v-if="getTeamProjects(team.id).length === 0" class="text-caption text-medium-emphasis">
                  No projects assigned
                </p>
              </div>
            </v-card-text>
            
            <v-card-actions class="px-4 pb-4">
              <v-btn
                variant="outlined"
                size="small"
                prepend-icon="mdi-account-plus"
                @click="manageMembers(team)"
              >
                Manage Members
              </v-btn>
              <v-spacer />
              <v-btn
                variant="text"
                size="small"
                @click="viewTeamDetails(team)"
              >
                View Details
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
    </div>

    <!-- Teams List View -->
    <v-card v-else>
      <v-data-table
        :headers="tableHeaders"
        :items="filteredTeams"
        :search="searchQuery"
        class="teams-table"
      >
        <template #item.name="{ item }">
          <div class="d-flex align-center">
            <v-avatar
              :color="item.color"
              size="24"
              class="mr-2"
            >
              <v-icon color="white" size="12">mdi-account-group</v-icon>
            </v-avatar>
            <span class="font-weight-medium">{{ item.name }}</span>
          </div>
        </template>
        
        <template #item.members="{ item }">
          <div class="d-flex align-center">
            <div class="avatar-group mr-2">
              <v-avatar
                v-for="member in getTeamMembers(item.id).slice(0, 3)"
                :key="member.id"
                :image="member.avatar"
                size="20"
                class="avatar-item-small"
              >
                {{ member.name.charAt(0) }}
              </v-avatar>
            </div>
            <span class="text-caption">{{ getTeamMembers(item.id).length }}</span>
          </div>
        </template>
        
        <template #item.projects="{ item }">
          <div class="d-flex flex-wrap ga-1">
            <v-chip
              v-for="project in getTeamProjects(item.id).slice(0, 2)"
              :key="project.id"
              size="x-small"
              :color="project.color"
              variant="tonal"
            >
              {{ project.name }}
            </v-chip>
            <span v-if="getTeamProjects(item.id).length > 2" class="text-caption text-medium-emphasis">
              +{{ getTeamProjects(item.id).length - 2 }} more
            </span>
          </div>
        </template>
        
        <template #item.actions="{ item }">
          <v-btn
            icon="mdi-pencil"
            variant="text"
            size="small"
            @click="editTeam(item)"
          />
          <v-btn
            icon="mdi-delete"
            variant="text"
            size="small"
            color="error"
            @click="deleteTeam(item)"
          />
        </template>
      </v-data-table>
    </v-card>

    <!-- Create/Edit Team Dialog -->
    <v-dialog v-model="showCreateDialog" max-width="600">
      <v-card>
        <v-card-title>
          {{ editingTeam ? 'Edit Team' : 'Create New Team' }}
        </v-card-title>
        
        <v-card-text>
          <v-form @submit.prevent="saveTeam">
            <v-text-field
              v-model="teamForm.name"
              label="Team Name"
              variant="outlined"
              required
            />
            
            <v-text-field
              v-model="teamForm.color"
              label="Team Color"
              type="color"
              variant="outlined"
            />
            
            <v-select
              v-model="teamForm.members"
              :items="allUsers"
              item-title="name"
              item-value="id"
              label="Team Members"
              variant="outlined"
              multiple
              chips
              closable-chips
            >
              <template #chip="{ props, item }">
                <v-chip v-bind="props">
                  <template #prepend>
                    <v-avatar size="20" start>
                      <v-img :src="item.raw.avatar" />
                    </v-avatar>
                  </template>
                  {{ item.title }}
                </v-chip>
              </template>
            </v-select>
          </v-form>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer />
          <v-btn @click="showCreateDialog = false">Cancel</v-btn>
          <v-btn color="primary" @click="saveTeam" :loading="saving">
            {{ editingTeam ? 'Update' : 'Create' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Empty State -->
    <div v-if="filteredTeams.length === 0" class="text-center pa-8">
      <v-icon size="64" color="medium-emphasis" class="mb-4">
        mdi-account-group-outline
      </v-icon>
      <h3 class="text-h6 mb-2">No Teams Found</h3>
      <p class="text-body-2 text-medium-emphasis mb-4">
        {{ searchQuery ? 'Try adjusting your search terms.' : 'Get started by creating your first team.' }}
      </p>
      <v-btn
        color="primary"
        prepend-icon="mdi-plus"
        @click="showCreateDialog = true"
      >
        Create Team
      </v-btn>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useProjectsStore } from '@/stores/projects'
import { useUIStore } from '@/stores/ui'

const projectsStore = useProjectsStore()
const uiStore = useUIStore()

// Local state
const searchQuery = ref('')
const projectFilter = ref('')
const viewMode = ref('grid')
const showCreateDialog = ref(false)
const editingTeam = ref(null)
const saving = ref(false)

const teamForm = ref({
  name: '',
  color: '#1976D2',
  members: []
})

// Store getters
const allTeams = computed(() => projectsStore.teams)
const allUsers = computed(() => projectsStore.users)
const allProjects = computed(() => projectsStore.projects)

// Computed
const filteredTeams = computed(() => {
  let teams = allTeams.value

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    teams = teams.filter(team =>
      team.name.toLowerCase().includes(query)
    )
  }

  // Filter by project
  if (projectFilter.value) {
    teams = teams.filter(team => {
      return allProjects.value.some(project =>
        project.teamIds.includes(team.id) && project.id === projectFilter.value
      )
    })
  }

  return teams
})

const projectOptions = computed(() =>
  allProjects.value.map(project => ({
    title: project.name,
    value: project.id
  }))
)

const tableHeaders = [
  { title: 'Team', key: 'name', sortable: true },
  { title: 'Members', key: 'members', sortable: false },
  { title: 'Projects', key: 'projects', sortable: false },
  { title: 'Actions', key: 'actions', sortable: false, width: '100px' }
]

// Methods
const getTeamMembers = (teamId) => {
  const team = allTeams.value.find(t => t.id === teamId)
  if (!team) return []
  
  return team.members
    .map(memberId => allUsers.value.find(user => user.id === memberId))
    .filter(Boolean)
}

const getTeamProjects = (teamId) => {
  return allProjects.value.filter(project =>
    project.teamIds.includes(teamId)
  )
}

const editTeam = (team) => {
  editingTeam.value = team
  teamForm.value = {
    name: team.name,
    color: team.color,
    members: [...team.members]
  }
  showCreateDialog.value = true
}

const deleteTeam = async (team) => {
  if (confirm(`Are you sure you want to delete "${team.name}"? This action cannot be undone.`)) {
    try {
      await projectsStore.deleteTeam(team.id)
      uiStore.showSuccess('Team deleted successfully')
    } catch (error) {
      uiStore.showError('Failed to delete team: ' + error.message)
    }
  }
}

const saveTeam = async () => {
  if (!teamForm.value.name.trim()) return

  try {
    saving.value = true

    if (editingTeam.value) {
      await projectsStore.updateTeam(editingTeam.value.id, teamForm.value)
      uiStore.showSuccess('Team updated successfully')
    } else {
      await projectsStore.createTeam(teamForm.value)
      uiStore.showSuccess('Team created successfully')
    }

    showCreateDialog.value = false
    resetForm()
  } catch (error) {
    uiStore.showError('Failed to save team: ' + error.message)
  } finally {
    saving.value = false
  }
}

const resetForm = () => {
  editingTeam.value = null
  teamForm.value = {
    name: '',
    color: '#1976D2',
    members: []
  }
}

const manageMembers = (team) => {
  // TODO: Open member management dialog
  console.log('Manage members for:', team.name)
}

const viewTeamDetails = (team) => {
  // TODO: Navigate to team details page
  console.log('View details for:', team.name)
}
</script>

<style scoped>
.team-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.team-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.avatar-group {
  display: flex;
}

.avatar-item {
  margin-left: -8px;
  border: 2px solid rgb(var(--v-theme-surface));
  transition: transform 0.2s ease-in-out;
}

.avatar-item:first-child {
  margin-left: 0;
}

.avatar-item:hover {
  transform: scale(1.1);
  z-index: 1;
}

.avatar-item-small {
  margin-left: -4px;
  border: 1px solid rgb(var(--v-theme-surface));
}

.avatar-item-small:first-child {
  margin-left: 0;
}

.teams-table :deep(.v-data-table__td) {
  padding: 8px 16px;
}

@media (max-width: 960px) {
  .team-card {
    margin-bottom: 16px;
  }
}
</style>