<template>
  <div class="teams-view">
    <!-- Header -->
    <div class="d-flex align-center justify-space-between mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold mb-2">Teams</h1>
        <p class="text-body-1 text-medium-emphasis">
          Manage your teams and team members
        </p>
      </div>
      
      <v-btn
        color="primary"
        prepend-icon="mdi-plus"
        @click="showCreateTeamDialog = true"
      >
        Create Team
      </v-btn>
    </div>

    <!-- Teams Grid -->
    <v-row v-if="teams.length > 0">
      <v-col
        v-for="team in teams"
        :key="team.id"
        cols="12"
        md="6"
        lg="4"
      >
        <v-card
          elevation="2"
          class="team-card h-100"
          @click="selectTeam(team)"
        >
          <v-card-title class="d-flex align-center justify-space-between">
            <div class="d-flex align-center">
              <v-avatar
                :color="team.color || 'primary'"
                size="40"
                class="mr-3"
              >
                <v-icon>{{ team.icon || 'mdi-account-group' }}</v-icon>
              </v-avatar>
              <div>
                <div class="font-weight-bold">{{ team.name }}</div>
                <div class="text-caption text-medium-emphasis">
                  {{ team.members?.length || 0 }} members
                </div>
              </div>
            </div>
            
            <v-menu>
              <template #activator="{ props }">
                <v-btn
                  v-bind="props"
                  icon="mdi-dots-vertical"
                  size="small"
                  variant="text"
                  @click.stop
                />
              </template>
              <v-list>
                <v-list-item @click="editTeam(team)">
                  <template #prepend>
                    <v-icon>mdi-pencil</v-icon>
                  </template>
                  <v-list-item-title>Edit</v-list-item-title>
                </v-list-item>
                <v-list-item @click="deleteTeam(team)">
                  <template #prepend>
                    <v-icon>mdi-delete</v-icon>
                  </template>
                  <v-list-item-title>Delete</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </v-card-title>

          <v-card-text>
            <p class="text-body-2 mb-3">{{ team.description || 'No description' }}</p>
            
            <!-- Team Members -->
            <div class="mb-3">
              <div class="text-subtitle-2 mb-2">Members</div>
              <div class="d-flex align-center">
                <v-avatar-group>
                  <v-avatar
                    v-for="memberId in team.members?.slice(0, 4) || []"
                    :key="memberId"
                    size="32"
                    :image="getUserAvatar(memberId)"
                  >
                    {{ getUserInitials(memberId) }}
                  </v-avatar>
                  <v-avatar
                    v-if="(team.members?.length || 0) > 4"
                    size="32"
                    color="grey-lighten-1"
                  >
                    <span class="text-caption">+{{ (team.members?.length || 0) - 4 }}</span>
                  </v-avatar>
                </v-avatar-group>
              </div>
            </div>

            <!-- Team Stats -->
            <div class="d-flex justify-space-between text-caption">
              <div>
                <v-icon size="16" class="mr-1">mdi-folder</v-icon>
                {{ getTeamProjectCount(team.id) }} projects
              </div>
              <div>
                <v-icon size="16" class="mr-1">mdi-clipboard-text</v-icon>
                {{ getTeamTaskCount(team.id) }} tasks
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Empty State -->
    <div v-else class="text-center py-12">
      <v-icon size="80" color="grey-lighten-1" class="mb-4">mdi-account-group-outline</v-icon>
      <h2 class="text-h5 mb-2">No teams yet</h2>
      <p class="text-body-1 text-medium-emphasis mb-4">
        Create your first team to start collaborating
      </p>
      <v-btn
        color="primary"
        prepend-icon="mdi-plus"
        @click="showCreateTeamDialog = true"
      >
        Create Your First Team
      </v-btn>
    </div>

    <!-- Team Details Dialog -->
    <v-dialog
      v-model="showTeamDialog"
      max-width="800"
      scrollable
    >
      <v-card v-if="selectedTeam">
        <v-card-title class="d-flex align-center">
          <v-avatar
            :color="selectedTeam.color || 'primary'"
            size="40"
            class="mr-3"
          >
            <v-icon>{{ selectedTeam.icon || 'mdi-account-group' }}</v-icon>
          </v-avatar>
          <div>
            <div class="font-weight-bold">{{ selectedTeam.name }}</div>
            <div class="text-caption text-medium-emphasis">
              {{ selectedTeam.members?.length || 0 }} members
            </div>
          </div>
          <v-spacer />
          <v-btn
            icon="mdi-close"
            variant="text"
            @click="showTeamDialog = false"
          />
        </v-card-title>

        <v-divider />

        <v-card-text class="pa-0">
          <v-tabs v-model="activeTab">
            <v-tab value="members">Members</v-tab>
            <v-tab value="projects">Projects</v-tab>
            <v-tab value="activity">Activity</v-tab>
          </v-tabs>

          <v-divider />

          <v-tabs-window v-model="activeTab" class="pa-4">
            <!-- Members Tab -->
            <v-tabs-window-item value="members">
              <div class="d-flex align-center justify-space-between mb-4">
                <h3 class="text-h6">Team Members</h3>
                <v-btn
                  prepend-icon="mdi-account-plus"
                  size="small"
                  variant="outlined"
                  @click="showInviteDialog = true"
                >
                  Invite Member
                </v-btn>
              </div>

              <v-list>
                <v-list-item
                  v-for="memberId in selectedTeam.members || []"
                  :key="memberId"
                  class="member-item"
                >
                  <template #prepend>
                    <v-avatar
                      size="40"
                      :image="getUserAvatar(memberId)"
                    >
                      {{ getUserInitials(memberId) }}
                    </v-avatar>
                  </template>

                  <v-list-item-title>{{ getUserName(memberId) }}</v-list-item-title>
                  <v-list-item-subtitle>{{ getUserEmail(memberId) }}</v-list-item-subtitle>

                  <template #append>
                    <v-chip
                      size="small"
                      :color="getUserRole(memberId) === 'admin' ? 'primary' : 'default'"
                      variant="flat"
                    >
                      {{ getUserRole(memberId) }}
                    </v-chip>
                  </template>
                </v-list-item>
              </v-list>
            </v-tabs-window-item>

            <!-- Projects Tab -->
            <v-tabs-window-item value="projects">
              <h3 class="text-h6 mb-4">Team Projects</h3>
              
              <v-list>
                <v-list-item
                  v-for="project in getTeamProjects(selectedTeam.id)"
                  :key="project.id"
                  :to="`/kanban/${project.id}`"
                >
                  <template #prepend>
                    <v-avatar
                      :color="project.color"
                      size="40"
                    >
                      {{ project.name.charAt(0) }}
                    </v-avatar>
                  </template>

                  <v-list-item-title>{{ project.name }}</v-list-item-title>
                  <v-list-item-subtitle>{{ project.description }}</v-list-item-subtitle>

                  <template #append>
                    <v-chip
                      size="small"
                      :color="getStatusColor(project.status)"
                      variant="flat"
                    >
                      {{ project.status }}
                    </v-chip>
                  </template>
                </v-list-item>
              </v-list>
            </v-tabs-window-item>

            <!-- Activity Tab -->
            <v-tabs-window-item value="activity">
              <h3 class="text-h6 mb-4">Recent Activity</h3>
              
              <v-timeline density="compact" side="end">
                <v-timeline-item
                  v-for="activity in getTeamActivity(selectedTeam.id)"
                  :key="activity.id"
                  :dot-color="activity.color"
                  size="small"
                >
                  <div class="d-flex justify-space-between align-center">
                    <div>
                      <div class="font-weight-medium">{{ activity.title }}</div>
                      <div class="text-caption text-medium-emphasis">
                        {{ activity.description }}
                      </div>
                    </div>
                    <div class="text-caption text-medium-emphasis">
                      {{ formatTimeAgo(activity.timestamp) }}
                    </div>
                  </div>
                </v-timeline-item>
              </v-timeline>
            </v-tabs-window-item>
          </v-tabs-window>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- Create/Edit Team Dialog -->
    <v-dialog
      v-model="showCreateTeamDialog"
      max-width="500"
    >
      <v-card>
        <v-card-title>
          {{ editingTeam ? 'Edit Team' : 'Create New Team' }}
        </v-card-title>

        <v-divider />

        <v-card-text class="pa-4">
          <v-form ref="teamForm" v-model="teamFormValid">
            <v-text-field
              v-model="teamForm.name"
              label="Team Name"
              :rules="[v => !!v || 'Team name is required']"
              required
            />
            
            <v-textarea
              v-model="teamForm.description"
              label="Description"
              rows="3"
            />

            <v-row>
              <v-col cols="6">
                <v-select
                  v-model="teamForm.color"
                  label="Color"
                  :items="colorOptions"
                  item-title="name"
                  item-value="value"
                >
                  <template #selection="{ item }">
                    <div class="d-flex align-center">
                      <v-avatar size="20" :color="item.raw.value" class="mr-2" />
                      {{ item.raw.name }}
                    </div>
                  </template>
                  <template #item="{ props, item }">
                    <v-list-item v-bind="props">
                      <template #prepend>
                        <v-avatar size="20" :color="item.raw.value" />
                      </template>
                    </v-list-item>
                  </template>
                </v-select>
              </v-col>
              
              <v-col cols="6">
                <v-select
                  v-model="teamForm.icon"
                  label="Icon"
                  :items="iconOptions"
                  item-title="name"
                  item-value="value"
                >
                  <template #selection="{ item }">
                    <div class="d-flex align-center">
                      <v-icon class="mr-2">{{ item.raw.value }}</v-icon>
                      {{ item.raw.name }}
                    </div>
                  </template>
                  <template #item="{ props, item }">
                    <v-list-item v-bind="props">
                      <template #prepend>
                        <v-icon>{{ item.raw.value }}</v-icon>
                      </template>
                    </v-list-item>
                  </template>
                </v-select>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-divider />

        <v-card-actions>
          <v-spacer />
          <v-btn @click="showCreateTeamDialog = false">Cancel</v-btn>
          <v-btn
            color="primary"
            :loading="saving"
            @click="saveTeam"
          >
            {{ editingTeam ? 'Update' : 'Create' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Invite Member Dialog -->
    <v-dialog
      v-model="showInviteDialog"
      max-width="400"
    >
      <v-card>
        <v-card-title>Invite Team Member</v-card-title>

        <v-divider />

        <v-card-text class="pa-4">
          <v-text-field
            v-model="inviteEmail"
            label="Email Address"
            type="email"
            :rules="[v => !!v || 'Email is required', v => /.+@.+\..+/.test(v) || 'Email must be valid']"
          />
          
          <v-select
            v-model="inviteRole"
            label="Role"
            :items="['member', 'admin']"
          />
        </v-card-text>

        <v-divider />

        <v-card-actions>
          <v-spacer />
          <v-btn @click="showInviteDialog = false">Cancel</v-btn>
          <v-btn
            color="primary"
            :loading="inviting"
            @click="sendInvite"
          >
            Send Invite
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useProjectsStore } from '@/stores/projects'
import { useTasksStore } from '@/stores/tasks'
import { useUIStore } from '@/stores/ui'

const projectsStore = useProjectsStore()
const tasksStore = useTasksStore()
const uiStore = useUIStore()

// Local state
const showTeamDialog = ref(false)
const showCreateTeamDialog = ref(false)
const showInviteDialog = ref(false)
const selectedTeam = ref(null)
const editingTeam = ref(null)
const activeTab = ref('members')
const teamFormValid = ref(false)
const saving = ref(false)
const inviting = ref(false)

// Form data
const teamForm = ref({
  name: '',
  description: '',
  color: 'primary',
  icon: 'mdi-account-group'
})

const inviteEmail = ref('')
const inviteRole = ref('member')

// Store getters
const teams = computed(() => projectsStore.teams)
const users = computed(() => projectsStore.users)

// Options
const colorOptions = [
  { name: 'Blue', value: 'primary' },
  { name: 'Green', value: 'success' },
  { name: 'Orange', value: 'warning' },
  { name: 'Red', value: 'error' },
  { name: 'Purple', value: 'purple' },
  { name: 'Teal', value: 'teal' }
]

const iconOptions = [
  { name: 'Team', value: 'mdi-account-group' },
  { name: 'Development', value: 'mdi-code-tags' },
  { name: 'Design', value: 'mdi-palette' },
  { name: 'Marketing', value: 'mdi-bullhorn' },
  { name: 'Sales', value: 'mdi-handshake' },
  { name: 'Support', value: 'mdi-headset' }
]

// Methods
const selectTeam = (team) => {
  selectedTeam.value = team
  showTeamDialog.value = true
  activeTab.value = 'members'
}

const editTeam = (team) => {
  editingTeam.value = team
  teamForm.value = { ...team }
  showCreateTeamDialog.value = true
}

const deleteTeam = (team) => {
  if (confirm(`Are you sure you want to delete "${team.name}"?`)) {
    projectsStore.deleteTeam(team.id)
    uiStore.showSuccess(`Team "${team.name}" deleted successfully`)
  }
}

const saveTeam = async () => {
  saving.value = true
  try {
    if (editingTeam.value) {
      await projectsStore.updateTeam(editingTeam.value.id, teamForm.value)
      uiStore.showSuccess('Team created successfully')
    }
    showCreateTeamDialog.value = false
    editingTeam.value = null
    teamForm.value = {
      name: '',
      description: '',
      color: 'primary',
      icon: 'mdi-account-group'
    }
  } catch (error) {
    uiStore.showError('Failed to save team')
  } finally {
    saving.value = false
  }
}

const sendInvite = async () => {
  inviting.value = true
  try {
    // Simulate invite process
    await new Promise(resolve => setTimeout(resolve, 1000))
    uiStore.showSuccess(`Invitation sent to ${inviteEmail.value}`)
    showInviteDialog.value = false
    inviteEmail.value = ''
    inviteRole.value = 'member'
  } catch (error) {
    uiStore.showError('Failed to send invitation')
  } finally {
    inviting.value = false
  }
}

// Helper methods
const getUserAvatar = (userId) => {
  const user = users.value.find(u => u.id === userId)
  return user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${userId}`
}

const getUserInitials = (userId) => {
  const user = users.value.find(u => u.id === userId)
  return user?.name?.split(' ').map(n => n[0]).join('') || 'U'
}

const getUserName = (userId) => {
  const user = users.value.find(u => u.id === userId)
  return user?.name || 'Unknown User'
}

const getUserEmail = (userId) => {
  const user = users.value.find(u => u.id === userId)
  return user?.email || 'No email'
}

const getUserRole = (userId) => {
  const user = users.value.find(u => u.id === userId)
  return user?.role || 'member'
}

const getTeamProjectCount = (teamId) => {
  return projectsStore.projects.filter(p => p.teamIds?.includes(teamId)).length
}

const getTeamTaskCount = (teamId) => {
  const teamProjects = projectsStore.projects.filter(p => p.teamIds?.includes(teamId))
  return tasksStore.tasks.filter(t => teamProjects.some(p => p.id === t.projectId)).length
}

const getTeamProjects = (teamId) => {
  return projectsStore.projects.filter(p => p.teamIds?.includes(teamId))
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

const getTeamActivity = (teamId) => {
  // Mock activity data - in real app this would come from an API
  return [
    {
      id: 1,
      title: 'New member joined',
      description: 'Sarah Johnson joined the team',
      color: 'success',
      timestamp: new Date(Date.now() - 1000 * 60 * 30) // 30 minutes ago
    },
    {
      id: 2,
      title: 'Project created',
      description: 'Mobile App project was created',
      color: 'primary',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2) // 2 hours ago
    },
    {
      id: 3,
      title: 'Task completed',
      description: 'User Authentication task was completed',
      color: 'info',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24) // 1 day ago
    }
  ]
}

const formatTimeAgo = (timestamp) => {
  const now = new Date()
  const date = new Date(timestamp)
  const diffTime = now - date
  const diffMinutes = Math.floor(diffTime / (1000 * 60))
  const diffHours = Math.floor(diffTime / (1000 * 60 * 60))
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffMinutes < 60) return `${diffMinutes}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  return `${diffDays}d ago`
}
</script>

<style scoped>
.team-card {
  cursor: pointer;
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
}

.team-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
}

.member-item:hover {
  background-color: rgba(var(--v-theme-primary), 0.04);
}

.v-avatar-group {
  flex-wrap: wrap;
}
</style>showSuccess('Team updated successfully')
    } else {
      await projectsStore.createTeam(teamForm.value)
      uiStore.