import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import sampleData from '@/data/sample-data.json'

export const useProjectsStore = defineStore('projects', () => {
  // State
  const projects = ref(sampleData.projects)
  const teams = ref(sampleData.teams)
  const users = ref(sampleData.users)
  const currentProjectId = ref(sampleData.projects[0]?.id || null)
  const loading = ref(false)
  const error = ref(null)

  // Getters
  const currentProject = computed(() => 
    projects.value.find(p => p.id === currentProjectId.value)
  )

  const projectTeams = computed(() => {
    if (!currentProject.value) return []
    return teams.value.filter(team => 
      currentProject.value.teamIds.includes(team.id)
    )
  })

  const projectUsers = computed(() => {
    const teamMembers = projectTeams.value.flatMap(team => team.members)
    return users.value.filter(user => teamMembers.includes(user.id))
  })

  const getUserById = computed(() => (userId) => 
    users.value.find(user => user.id === userId)
  )

  const getTeamById = computed(() => (teamId) => 
    teams.value.find(team => team.id === teamId)
  )

  // Actions
  const setCurrentProject = (projectId) => {
    currentProjectId.value = projectId
  }

  const createProject = async (projectData) => {
    try {
      loading.value = true
      const newProject = {
        id: `project-${Date.now()}`,
        ...projectData,
        status: 'active'
      }
      projects.value.push(newProject)
      return newProject
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateProject = async (projectId, updates) => {
    try {
      loading.value = true
      const index = projects.value.findIndex(p => p.id === projectId)
      if (index !== -1) {
        projects.value[index] = { ...projects.value[index], ...updates }
      }
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteProject = async (projectId) => {
    try {
      loading.value = true
      const index = projects.value.findIndex(p => p.id === projectId)
      if (index !== -1) {
        projects.value.splice(index, 1)
      }
      if (currentProjectId.value === projectId) {
        currentProjectId.value = projects.value[0]?.id || null
      }
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const createTeam = async (teamData) => {
    try {
      loading.value = true
      const newTeam = {
        id: `team-${Date.now()}`,
        ...teamData,
        members: []
      }
      teams.value.push(newTeam)
      return newTeam
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const addUserToTeam = async (teamId, userId) => {
    try {
      const team = teams.value.find(t => t.id === teamId)
      if (team && !team.members.includes(userId)) {
        team.members.push(userId)
      }
    } catch (err) {
      error.value = err.message
      throw err
    }
  }

  return {
    // State
    projects,
    teams,
    users,
    currentProjectId,
    loading,
    error,
    
    // Getters
    currentProject,
    projectTeams,
    projectUsers,
    getUserById,
    getTeamById,
    
    // Actions
    setCurrentProject,
    createProject,
    updateProject,
    deleteProject,
    createTeam,
    addUserToTeam
  }
})