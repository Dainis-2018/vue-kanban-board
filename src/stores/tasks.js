// src/stores/tasks.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import sampleData from '@/data/sample-data.json'

export const useTasksStore = defineStore('tasks', () => {
  // State
  const tasks = ref([])
  const kanbanColumns = ref([])
  const roadmapItems = ref([])
  const loading = ref(false)
  const error = ref(null)

  // Getters
  const getTasksByProject = computed(() => (projectId) => 
    tasks.value.filter(task => task.projectId === projectId)
  )

  const getTasksByColumn = computed(() => (columnId, projectId = null) => {
    return tasks.value
      .filter(task => {
        if (task.columnId !== columnId) return false
        if (projectId && task.projectId !== projectId) return false
        return true
      })
      .sort((a, b) => a.order - b.order)
  })

  const getTasksBySwimlane = computed(() => (swimlane, projectId = null) => {
    return tasks.value.filter(task => {
      if (task.swimlane !== swimlane) return false
      if (projectId && task.projectId !== projectId) return false
      return true
    })
  })

  const getTaskById = computed(() => (taskId) => 
    tasks.value.find(task => task.id === taskId)
  )

  const pendingTasksCount = computed(() => 
    tasks.value.filter(task => task.columnId !== 'done').length
  )

  const tasksByPriority = computed(() => {
    const priorities = { critical: [], high: [], medium: [], low: [] }
    tasks.value.forEach(task => {
      if (priorities[task.priority]) {
        priorities[task.priority].push(task)
      }
    })
    return priorities
  })

  const overdueTasks = computed(() => {
    const now = new Date()
    return tasks.value.filter(task => {
      if (!task.dueDate || task.columnId === 'done') return false
      return new Date(task.dueDate) < now
    })
  })

  const getRoadmapByProject = computed(() => (projectId) =>
    roadmapItems.value.filter(item => item.projectId === projectId)
  )

  // Task Actions
  const createTask = async (taskData) => {
    try {
      loading.value = true
      error.value = null
      
      const newTask = {
        id: `task-${Date.now()}`,
        title: '',
        description: '',
        projectId: '',
        columnId: 'backlog',
        priority: 'medium',
        assigneeId: null, // Keep for backwards compatibility
        assigneeIds: [], // New multiple assignees field
        dueDate: null,
        swimlane: 'feature',
        commentsCount: 0,
        attachmentsCount: 0,
        subtasksCount: 0,
        completedSubtasks: 0,
        order: 1,
        tags: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...taskData
      }
      
      // Ensure assigneeIds is always an array
      if (!newTask.assigneeIds) {
        newTask.assigneeIds = []
      }
      
      // If single assigneeId is provided, add it to assigneeIds
      if (newTask.assigneeId && !newTask.assigneeIds.includes(newTask.assigneeId)) {
        newTask.assigneeIds.push(newTask.assigneeId)
      }
      
      tasks.value.push(newTask)
      return newTask
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateTask = async (taskId, updates) => {
    try {
      loading.value = true
      error.value = null
      
      const index = tasks.value.findIndex(t => t.id === taskId)
      if (index === -1) {
        throw new Error('Task not found')
      }

      const updatedTask = {
        ...tasks.value[index],
        ...updates,
        updatedAt: new Date().toISOString()
      }

      // Handle assignee updates
      if (updates.assigneeIds !== undefined) {
        updatedTask.assigneeIds = Array.isArray(updates.assigneeIds) 
          ? updates.assigneeIds 
          : []
        // Update single assigneeId for backwards compatibility
        updatedTask.assigneeId = updatedTask.assigneeIds[0] || null
      } else if (updates.assigneeId !== undefined) {
        // If only single assigneeId is updated, sync with assigneeIds
        if (updates.assigneeId) {
          updatedTask.assigneeIds = [updates.assigneeId]
          updatedTask.assigneeId = updates.assigneeId
        } else {
          updatedTask.assigneeIds = []
          updatedTask.assigneeId = null
        }
      }

      tasks.value[index] = updatedTask
      return updatedTask
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteTask = async (taskId) => {
    try {
      loading.value = true
      error.value = null
      
      const index = tasks.value.findIndex(t => t.id === taskId)
      if (index !== -1) {
        tasks.value.splice(index, 1)
      }
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const moveTask = async (taskId, newColumnId, newOrder = null) => {
    try {
      error.value = null
      const task = tasks.value.find(t => t.id === taskId)
      if (task) {
        const oldColumnId = task.columnId
        
        // Update the task's column and order
        task.columnId = newColumnId
        task.updatedAt = new Date().toISOString()
        
        if (newOrder !== null) {
          task.order = newOrder
        }
        
        // Reorder other tasks in both old and new columns
        if (oldColumnId !== newColumnId) {
          // Update order in old column (shift tasks up)
          tasks.value
            .filter(t => t.columnId === oldColumnId && t.order > (task.order || 0))
            .forEach(t => t.order = Math.max(0, (t.order || 0) - 1))
          
          // Update order in new column (make room for new task)
          const newColumnTasks = tasks.value
            .filter(t => t.columnId === newColumnId && t.id !== taskId)
            .sort((a, b) => (a.order || 0) - (b.order || 0))
          
          newColumnTasks.forEach((t, index) => {
            if (newOrder !== null && index >= newOrder) {
              t.order = index + 1
            } else {
              t.order = index
            }
          })
        }
        
        return task
      }
      throw new Error('Task not found')
    } catch (err) {
      error.value = err.message
      throw err
    }
  }

  // Enhanced assignment methods
  const assignTask = async (taskId, assigneeId) => {
    try {
      const task = tasks.value.find(t => t.id === taskId)
      if (!task) throw new Error('Task not found')
      
      // For backwards compatibility, this method assigns a single user
      task.assigneeId = assigneeId
      task.assigneeIds = assigneeId ? [assigneeId] : []
      task.updatedAt = new Date().toISOString()
      
      return task
    } catch (err) {
      error.value = err.message
      throw err
    }
  }

  const assignMultipleUsers = async (taskId, assigneeIds) => {
    try {
      const task = tasks.value.find(t => t.id === taskId)
      if (!task) throw new Error('Task not found')
      
      // Ensure assigneeIds is an array and remove duplicates
      const uniqueAssigneeIds = Array.isArray(assigneeIds) 
        ? [...new Set(assigneeIds)]
        : []
      
      task.assigneeIds = uniqueAssigneeIds
      task.assigneeId = uniqueAssigneeIds[0] || null // First assignee for backwards compatibility
      task.updatedAt = new Date().toISOString()
      
      return task
    } catch (err) {
      error.value = err.message
      throw err
    }
  }

  const addAssignee = async (taskId, assigneeId) => {
    try {
      const task = tasks.value.find(t => t.id === taskId)
      if (!task) throw new Error('Task not found')
      
      if (!task.assigneeIds) {
        task.assigneeIds = []
      }
      
      if (!task.assigneeIds.includes(assigneeId)) {
        task.assigneeIds.push(assigneeId)
        // Update primary assignee if this is the first one
        if (!task.assigneeId) {
          task.assigneeId = assigneeId
        }
        task.updatedAt = new Date().toISOString()
      }
      
      return task
    } catch (err) {
      error.value = err.message
      throw err
    }
  }

  const removeAssignee = async (taskId, assigneeId) => {
    try {
      const task = tasks.value.find(t => t.id === taskId)
      if (!task) throw new Error('Task not found')
      
      if (task.assigneeIds) {
        const index = task.assigneeIds.indexOf(assigneeId)
        if (index !== -1) {
          task.assigneeIds.splice(index, 1)
          
          // Update primary assignee
          if (task.assigneeId === assigneeId) {
            task.assigneeId = task.assigneeIds[0] || null
          }
          
          task.updatedAt = new Date().toISOString()
        }
      }
      
      return task
    } catch (err) {
      error.value = err.message
      throw err
    }
  }

  const updateTaskPriority = async (taskId, priority) => {
    try {
      const task = tasks.value.find(t => t.id === taskId)
      if (!task) throw new Error('Task not found')
      
      task.priority = priority
      task.updatedAt = new Date().toISOString()
      
      return task
    } catch (err) {
      error.value = err.message
      throw err
    }
  }

  const addTaskComment = async (taskId, comment) => {
    try {
      const task = tasks.value.find(t => t.id === taskId)
      if (!task) throw new Error('Task not found')
      
      task.commentsCount = (task.commentsCount || 0) + 1
      task.updatedAt = new Date().toISOString()
      
      return task
    } catch (err) {
      error.value = err.message
      throw err
    }
  }

  // Column Actions
  const createColumn = async (columnData) => {
    try {
      loading.value = true
      error.value = null
      
      const newColumn = {
        id: `column-${Date.now()}`,
        title: '',
        color: 'primary',
        order: kanbanColumns.value.length,
        collapsed: false,
        allowDrop: true,
        autoSort: false,
        taskLimit: null,
        description: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...columnData
      }
      
      // Reorder existing columns if needed
      if (columnData.position === 'start') {
        kanbanColumns.value.forEach(col => col.order += 1)
        newColumn.order = 0
      } else if (columnData.position && columnData.position.startsWith('after-')) {
        const afterColumnId = columnData.position.replace('after-', '')
        const afterColumn = kanbanColumns.value.find(col => col.id === afterColumnId)
        if (afterColumn) {
          const insertOrder = afterColumn.order + 1
          kanbanColumns.value
            .filter(col => col.order >= insertOrder)
            .forEach(col => col.order += 1)
          newColumn.order = insertOrder
        }
      }
      
      kanbanColumns.value.push(newColumn)
      return newColumn
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateColumn = async (columnId, updates) => {
    try {
      loading.value = true
      error.value = null
      
      const index = kanbanColumns.value.findIndex(c => c.id === columnId)
      if (index !== -1) {
        kanbanColumns.value[index] = {
          ...kanbanColumns.value[index],
          ...updates,
          updatedAt: new Date().toISOString()
        }
        return kanbanColumns.value[index]
      }
      throw new Error('Column not found')
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteColumn = async (columnId) => {
    try {
      loading.value = true
      error.value = null
      
      const index = kanbanColumns.value.findIndex(c => c.id === columnId)
      if (index !== -1) {
        const deletedColumn = kanbanColumns.value[index]
        kanbanColumns.value.splice(index, 1)
        
        // Reorder remaining columns
        kanbanColumns.value
          .filter(col => col.order > deletedColumn.order)
          .forEach(col => col.order -= 1)
      }
      return true
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateColumnCollapse = async (columnId, collapsed) => {
    try {
      const column = kanbanColumns.value.find(c => c.id === columnId)
      if (column) {
        column.collapsed = collapsed
      }
    } catch (err) {
      error.value = err.message
      throw err
    }
  }

  const reorderColumns = async (newOrder) => {
    try {
      kanbanColumns.value = newOrder
    } catch (err) {
      error.value = err.message
      throw err
    }
  }

  // Roadmap Actions
  const createRoadmapItem = async (itemData) => {
    try {
      loading.value = true
      const newItem = {
        id: `roadmap-${Date.now()}`,
        title: '',
        description: '',
        projectId: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        status: 'planning',
        progress: 0,
        taskIds: [],
        ...itemData
      }
      roadmapItems.value.push(newItem)
      return newItem
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateRoadmapItem = async (itemId, updates) => {
    try {
      const index = roadmapItems.value.findIndex(i => i.id === itemId)
      if (index !== -1) {
        roadmapItems.value[index] = { ...roadmapItems.value[index], ...updates }
        return roadmapItems.value[index]
      }
      throw new Error('Roadmap item not found')
    } catch (err) {
      error.value = err.message
      throw err
    }
  }

  const deleteRoadmapItem = async (itemId) => {
    try {
      const index = roadmapItems.value.findIndex(i => i.id === itemId)
      if (index !== -1) {
        roadmapItems.value.splice(index, 1)
      }
    } catch (err) {
      error.value = err.message
      throw err
    }
  }

  const linkTaskToRoadmap = async (taskId, roadmapItemId) => {
    try {
      const roadmapItem = roadmapItems.value.find(i => i.id === roadmapItemId)
      if (roadmapItem && !roadmapItem.taskIds.includes(taskId)) {
        roadmapItem.taskIds.push(taskId)
      }
    } catch (err) {
      error.value = err.message
      throw err
    }
  }

  const unlinkTaskFromRoadmap = async (taskId, roadmapItemId) => {
    try {
      const roadmapItem = roadmapItems.value.find(i => i.id === roadmapItemId)
      if (roadmapItem) {
        const index = roadmapItem.taskIds.indexOf(taskId)
        if (index !== -1) {
          roadmapItem.taskIds.splice(index, 1)
        }
      }
    } catch (err) {
      error.value = err.message
      throw err
    }
  }

  // Bulk Operations
  const bulkUpdateTasks = async (taskIds, updates) => {
    try {
      loading.value = true
      const updatedTasks = []
      
      for (const taskId of taskIds) {
        const task = await updateTask(taskId, updates)
        if (task) {
          updatedTasks.push(task)
        }
      }
      
      return updatedTasks
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const bulkDeleteTasks = async (taskIds) => {
    try {
      loading.value = true
      for (const taskId of taskIds) {
        await deleteTask(taskId)
      }
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // Search & Filter
  const searchTasks = (query, projectId = null) => {
    if (!query.trim()) return getTasksByProject.value(projectId) || tasks.value
    
    const searchTerm = query.toLowerCase()
    return tasks.value.filter(task => {
      if (projectId && task.projectId !== projectId) return false
      
      return (
        task.title.toLowerCase().includes(searchTerm) ||
        task.description.toLowerCase().includes(searchTerm) ||
        task.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      )
    })
  }

  const filterTasks = (filters, projectId = null) => {
    return tasks.value.filter(task => {
      // Filter by project
      if (projectId && task.projectId !== projectId) return false
      
      // Filter by assignee (support both single and multiple assignees)
      if (filters.assignee?.length) {
        const taskAssignees = task.assigneeIds && task.assigneeIds.length > 0 
          ? task.assigneeIds 
          : (task.assigneeId ? [task.assigneeId] : [])
        
        if (!filters.assignee.some(assigneeId => taskAssignees.includes(assigneeId))) {
          return false
        }
      }
      
      // Filter by priority
      if (filters.priority?.length && !filters.priority.includes(task.priority)) {
        return false
      }
      
      // Filter by tags
      if (filters.tags?.length) {
        const taskTags = task.tags || []
        if (!filters.tags.some(tag => taskTags.includes(tag))) {
          return false
        }
      }
      
      // Filter by due date
      if (filters.dueDate) {
        if (!task.dueDate) return false
        const taskDue = new Date(task.dueDate)
        const filterDue = new Date(filters.dueDate)
        if (taskDue.toDateString() !== filterDue.toDateString()) {
          return false
        }
      }
      
      return true
    })
  }

  // Initialize with sample data if empty
  const initializeData = () => {
    try {
      if (tasks.value.length === 0) {
        // Migrate sample data to support multiple assignees
        const migratedTasks = sampleData.tasks.map(task => ({
          ...task,
          assigneeIds: task.assigneeId ? [task.assigneeId] : []
        }))
        tasks.value = [...migratedTasks]
      }
      if (kanbanColumns.value.length === 0) {
        kanbanColumns.value = [...sampleData.kanbanColumns]
      }
      if (roadmapItems.value.length === 0) {
        roadmapItems.value = [...sampleData.roadmapItems]
      }
    } catch (err) {
      console.error('Error initializing sample data:', err)
      error.value = 'Failed to initialize data'
    }
  }

  return {
    // State
    tasks,
    kanbanColumns,
    roadmapItems,
    loading,
    error,

    // Getters
    getTasksByProject,
    getTasksByColumn,
    getTasksBySwimlane,
    getTaskById,
    pendingTasksCount,
    tasksByPriority,
    overdueTasks,
    getRoadmapByProject,

    // Task Actions
    createTask,
    updateTask,
    deleteTask,
    moveTask,
    assignTask,
    assignMultipleUsers,
    addAssignee,
    removeAssignee,
    updateTaskPriority,
    addTaskComment,

    // Column Actions
    createColumn,
    updateColumn,
    updateColumnCollapse,
    reorderColumns,

    // Roadmap Actions
    createRoadmapItem,
    updateRoadmapItem,
    deleteRoadmapItem,
    linkTaskToRoadmap,
    unlinkTaskFromRoadmap,

    // Bulk Operations
    bulkUpdateTasks,
    bulkDeleteTasks,

    // Search & Filter
    searchTasks,
    filterTasks,

    // Utility
    initializeData
  }
})