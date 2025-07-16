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

  const getProjectById = computed(() => (projectId) => 
    projects.value.find(project => project.id === projectId)
  )

  const activeProjects = computed(() => 
    projects.value.filter(project => project.status === 'active')
  )

  const completedProjects = computed(() => 
    projects.value.filter(project => project.status === 'completed')
  )

  // Actions
  const setCurrentProject = (projectId) => {
    currentProjectId.value = projectId
    // Save to localStorage if available
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('kanban-current-project', projectId)
    }
  }

  const initializeCurrentProject = () => {
    // Load current project from localStorage if available
    if (typeof localStorage !== 'undefined') {
      const savedProjectId = localStorage.getItem('kanban-current-project')
      if (savedProjectId && projects.value.find(p => p.id === savedProjectId)) {
        currentProjectId.value = savedProjectId
        return
      }
    }
    
    // Fallback to first project
    if (projects.value.length > 0) {
      currentProjectId.value = projects.value[0].id
    }
  }

  const createProject = async (projectData) => {
    try {
      loading.value = true
      const newProject = {
        id: `project-${Date.now()}`,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        teamIds: [],
        color: 'primary',
        ...projectData
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
        projects.value[index] = { 
          ...projects.value[index], 
          ...updates,
          updatedAt: new Date().toISOString()
        }
        return projects.value[index]
      }
      throw new Error('Project not found')
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

  const duplicateProject = async (projectId) => {
    try {
      const originalProject = projects.value.find(p => p.id === projectId)
      if (!originalProject) throw new Error('Project not found')

      const duplicatedProject = {
        ...originalProject,
        id: `project-${Date.now()}`,
        name: `${originalProject.name} (Copy)`,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      projects.value.push(duplicatedProject)
      return duplicatedProject
    } catch (err) {
      error.value = err.message
      throw err
    }
  }

  // Team Management
  const createTeam = async (teamData) => {
    try {
      loading.value = true
      const newTeam = {
        id: `team-${Date.now()}`,
        members: [],
        createdAt: new Date().toISOString(),
        color: 'primary',
        icon: 'mdi-account-group',
        ...teamData
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

  const updateTeam = async (teamId, updates) => {
    try {
      loading.value = true
      const index = teams.value.findIndex(t => t.id === teamId)
      if (index !== -1) {
        teams.value[index] = { 
          ...teams.value[index], 
          ...updates
        }
        return teams.value[index]
      }
      throw new Error('Team not found')
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteTeam = async (teamId) => {
    try {
      loading.value = true
      const index = teams.value.findIndex(t => t.id === teamId)
      if (index !== -1) {
        teams.value.splice(index, 1)
      }
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const addTeamMember = async (teamId, userId) => {
    try {
      const team = teams.value.find(t => t.id === teamId)
      if (!team) throw new Error('Team not found')
      
      if (!team.members.includes(userId)) {
        team.members.push(userId)
        team.updatedAt = new Date().toISOString()
      }
      
      return team
    } catch (err) {
      error.value = err.message
      throw err
    }
  }

  const removeTeamMember = async (teamId, userId) => {
    try {
      const team = teams.value.find(t => t.id === teamId)
      if (!team) throw new Error('Team not found')
      
      const memberIndex = team.members.indexOf(userId)
      if (memberIndex !== -1) {
        team.members.splice(memberIndex, 1)
        team.updatedAt = new Date().toISOString()
      }
      
      return team
    } catch (err) {
      error.value = err.message
      throw err
    }
  }

  // User Management
  const createUser = async (userData) => {
    try {
      loading.value = true
      const newUser = {
        id: `user-${Date.now()}`,
        avatar: `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70) + 1}`,
        role: 'Team Member',
        createdAt: new Date().toISOString(),
        ...userData
      }
      users.value.push(newUser)
      return newUser
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateUser = async (userId, updates) => {
    try {
      loading.value = true
      const index = users.value.findIndex(u => u.id === userId)
      if (index !== -1) {
        users.value[index] = { 
          ...users.value[index], 
          ...updates,
          updatedAt: new Date().toISOString()
        }
        return users.value[index]
      }
      throw new Error('User not found')
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteUser = async (userId) => {
    try {
      loading.value = true
      const index = users.value.findIndex(u => u.id === userId)
      if (index !== -1) {
        users.value.splice(index, 1)
      }
      
      // Remove user from all teams
      teams.value.forEach(team => {
        const memberIndex = team.members.indexOf(userId)
        if (memberIndex !== -1) {
          team.members.splice(memberIndex, 1)
        }
      })
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // Project Team Assignment
  const assignTeamToProject = async (projectId, teamId) => {
    try {
      const project = projects.value.find(p => p.id === projectId)
      if (!project) throw new Error('Project not found')
      
      if (!project.teamIds.includes(teamId)) {
        project.teamIds.push(teamId)
        project.updatedAt = new Date().toISOString()
      }
      
      return project
    } catch (err) {
      error.value = err.message
      throw err
    }
  }

  const removeTeamFromProject = async (projectId, teamId) => {
    try {
      const project = projects.value.find(p => p.id === projectId)
      if (!project) throw new Error('Project not found')
      
      const teamIndex = project.teamIds.indexOf(teamId)
      if (teamIndex !== -1) {
        project.teamIds.splice(teamIndex, 1)
        project.updatedAt = new Date().toISOString()
      }
      
      return project
    } catch (err) {
      error.value = err.message
      throw err
    }
  }

  // Search and Filter
  const searchProjects = (query) => {
    const searchTerms = query.toLowerCase().split(' ')
    return projects.value.filter(project => {
      const searchableText = [
        project.name,
        project.description || ''
      ].join(' ').toLowerCase()
      
      return searchTerms.every(term => searchableText.includes(term))
    })
  }

  const filterProjects = (filters) => {
    return projects.value.filter(project => {
      // Filter by status
      if (filters.status && project.status !== filters.status) {
        return false
      }
      
      // Filter by team
      if (filters.teamId && !project.teamIds.includes(filters.teamId)) {
        return false
      }
      
      // Filter by owner
      if (filters.ownerId && project.ownerId !== filters.ownerId) {
        return false
      }
      
      return true
    })
  }

  // Statistics
  const getProjectStats = computed(() => (projectId) => {
    const project = projects.value.find(p => p.id === projectId)
    if (!project) return null

    const projectTeamMembers = teams.value
      .filter(team => project.teamIds.includes(team.id))
      .flatMap(team => team.members)
    
    const uniqueMembers = [...new Set(projectTeamMembers)]

    return {
      id: project.id,
      name: project.name,
      status: project.status,
      teamCount: project.teamIds.length,
      memberCount: uniqueMembers.length,
      startDate: project.startDate,
      endDate: project.endDate
    }
  })

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
    getProjectById,
    activeProjects,
    completedProjects,
    getProjectStats,

    // Project Actions
    setCurrentProject,
    initializeCurrentProject,
    createProject,
    updateProject,
    deleteProject,
    duplicateProject,

    // Team Actions
    createTeam,
    updateTeam,
    deleteTeam,
    addTeamMember,
    removeTeamMember,

    // User Actions
    createUser,
    updateUser,
    deleteUser,

    // Project Team Assignment
    assignTeamToProject,
    removeTeamFromProject,

    // Search & Filter
    searchProjects,
    filterProjects
  }
})