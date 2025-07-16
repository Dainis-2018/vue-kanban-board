import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import sampleData from '@/data/sample-data.json'

export const useTasksStore = defineStore('tasks', () => {
  // State
  const tasks = ref([...sampleData.tasks])
  const kanbanColumns = ref([...sampleData.kanbanColumns])
  const roadmapItems = ref([...sampleData.roadmapItems])
  const loading = ref(false)
  const error = ref(null)

  // Getters
  const getTasksByProject = computed(() => (projectId) => {
    if (!projectId) return []
    return tasks.value.filter(task => task.projectId === projectId)
  })

  const getTasksByColumn = computed(() => (projectId, columnId) => 
    tasks.value.filter(task => 
      task.projectId === projectId && task.columnId === columnId
    )
  )

  const getTasksBySwimlane = computed(() => (projectId, swimlane) => 
    tasks.value.filter(task => 
      task.projectId === projectId && task.swimlane === swimlane
    )
  )

  const getTaskById = computed(() => (taskId) => 
    tasks.value.find(task => task.id === taskId)
  )

  const pendingTasksCount = computed(() => 
    tasks.value.filter(task => 
      task.columnId !== 'done' && task.columnId !== 'cancelled'
    ).length
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

  // Task Management Actions
  const createTask = async (taskData) => {
    try {
      loading.value = true
      const newTask = {
        id: `task-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        priority: 'medium',
        columnId: 'todo',
        swimlane: 'feature',
        commentsCount: 0,
        attachmentsCount: 0,
        subtasksCount: 0,
        completedSubtasks: 0,
        order: 1,
        tags: [],
        ...taskData
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
      const index = tasks.value.findIndex(t => t.id === taskId)
      if (index !== -1) {
        tasks.value[index] = {
          ...tasks.value[index],
          ...updates,
          updatedAt: new Date().toISOString()
        }
        return tasks.value[index]
      }
      throw new Error('Task not found')
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
      const task = tasks.value.find(t => t.id === taskId)
      if (task) {
        task.columnId = newColumnId
        task.updatedAt = new Date().toISOString()
        if (newOrder !== null) {
          task.order = newOrder
        }
      }
    } catch (err) {
      error.value = err.message
      throw err
    }
  }

  const assignTask = async (taskId, assigneeId) => {
    try {
      const task = tasks.value.find(t => t.id === taskId)
      if (!task) throw new Error('Task not found')
      
      task.assigneeId = assigneeId
      task.updatedAt = new Date().toISOString()
      
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
      
      if (!task.comments) {
        task.comments = []
      }

      const newComment = {
        id: `comment-${Date.now()}`,
        content: comment.content,
        authorId: comment.authorId,
        createdAt: new Date().toISOString()
      }

      task.comments.push(newComment)
      task.commentsCount = (task.commentsCount || 0) + 1
      task.updatedAt = new Date().toISOString()
      return newComment
    } catch (err) {
      error.value = err.message
      throw err
    }
  }

  // Column Management
  const createColumn = async (columnData) => {
    try {
      loading.value = true
      const newColumn = {
        id: `column-${Date.now()}`,
        collapsed: false,
        order: kanbanColumns.value.length,
        ...columnData
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
      const index = kanbanColumns.value.findIndex(col => col.id === columnId)
      if (index !== -1) {
        kanbanColumns.value[index] = {
          ...kanbanColumns.value[index],
          ...updates
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

  const updateColumnCollapse = async (columnId, collapsed) => {
    try {
      const column = kanbanColumns.value.find(col => col.id === columnId)
      if (column) {
        column.collapsed = collapsed
      }
    } catch (err) {
      error.value = err.message
      throw err
    }
  }

  const reorderColumns = async (columnIds) => {
    try {
      // Reorder columns based on the provided array of IDs
      const reorderedColumns = columnIds.map((id, index) => {
        const column = kanbanColumns.value.find(col => col.id === id)
        return { ...column, order: index }
      })
      kanbanColumns.value = reorderedColumns
    } catch (err) {
      error.value = err.message
      throw err
    }
  }

  // Roadmap Management
  const createRoadmapItem = async (itemData) => {
    try {
      loading.value = true
      const newItem = {
        id: `milestone-${Date.now()}`,
        type: 'milestone',
        status: 'planned',
        progress: 0,
        taskIds: [],
        ...itemData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
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
      loading.value = true
      const index = roadmapItems.value.findIndex(item => item.id === itemId)
      if (index !== -1) {
        roadmapItems.value[index] = {
          ...roadmapItems.value[index],
          ...updates,
          updatedAt: new Date().toISOString()
        }
        return roadmapItems.value[index]
      }
      throw new Error('Roadmap item not found')
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteRoadmapItem = async (itemId) => {
    try {
      loading.value = true
      const index = roadmapItems.value.findIndex(item => item.id === itemId)
      if (index !== -1) {
        roadmapItems.value.splice(index, 1)
      }
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const linkTaskToRoadmap = async (roadmapItemId, taskId) => {
    try {
      const roadmapItem = roadmapItems.value.find(item => item.id === roadmapItemId)
      if (roadmapItem && !roadmapItem.taskIds?.includes(taskId)) {
        if (!roadmapItem.taskIds) roadmapItem.taskIds = []
        roadmapItem.taskIds.push(taskId)
        roadmapItem.updatedAt = new Date().toISOString()
      }
    } catch (err) {
      error.value = err.message
      throw err
    }
  }

  const unlinkTaskFromRoadmap = async (roadmapItemId, taskId) => {
    try {
      const roadmapItem = roadmapItems.value.find(item => item.id === roadmapItemId)
      if (roadmapItem && roadmapItem.taskIds) {
        const taskIndex = roadmapItem.taskIds.indexOf(taskId)
        if (taskIndex !== -1) {
          roadmapItem.taskIds.splice(taskIndex, 1)
          roadmapItem.updatedAt = new Date().toISOString()
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
      
      taskIds.forEach(taskId => {
        const task = tasks.value.find(t => t.id === taskId)
        if (task) {
          Object.assign(task, updates, {
            updatedAt: new Date().toISOString()
          })
          updatedTasks.push(task)
        }
      })
      
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
      taskIds.forEach(taskId => {
        const index = tasks.value.findIndex(task => task.id === taskId)
        if (index !== -1) {
          tasks.value.splice(index, 1)
        }
      })
      return true
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // Search & Filter
  const searchTasks = (query, projectId = null) => {
    const searchTerms = query.toLowerCase().split(' ')
    return tasks.value.filter(task => {
      if (projectId && task.projectId !== projectId) return false
      
      const searchableText = [
        task.title,
        task.description || '',
        (task.tags || []).join(' ')
      ].join(' ').toLowerCase()
      
      return searchTerms.every(term => searchableText.includes(term))
    })
  }

  const filterTasks = (filters, projectId = null) => {
    return tasks.value.filter(task => {
      if (projectId && task.projectId !== projectId) return false
      
      // Filter by assignee
      if (filters.assignee?.length && !filters.assignee.includes(task.assigneeId)) {
        return false
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
    // Initialize with sample data if empty
    if (tasks.value.length === 0) {
      tasks.value = [...sampleData.tasks]
    }
    if (kanbanColumns.value.length === 0) {
      kanbanColumns.value = [...sampleData.kanbanColumns]
    }
    if (roadmapItems.value.length === 0) {
      roadmapItems.value = [...sampleData.roadmapItems]
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