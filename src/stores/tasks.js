import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import sampleData from '@/data/sample-data.json'

export const useTasksStore = defineStore('tasks', () => {
  // State
  const tasks = ref(sampleData.tasks)
  const kanbanColumns = ref(sampleData.kanbanColumns)
  const roadmapItems = ref(sampleData.roadmapItems)
  const loading = ref(false)
  const error = ref(null)

  // Getters
  const getTasksByProject = computed(() => (projectId) => 
    tasks.value.filter(task => task.projectId === projectId)
  )

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

  // Actions
  const createTask = async (taskData) => {
    try {
      loading.value = true
      const newTask = {
        id: `task-${Date.now()}`,
        ...taskData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        assigneeIds: taskData.assigneeIds || [],
        tags: taskData.tags || [],
        swimlane: taskData.swimlane || 'feature'
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
      const index = tasks.value.findIndex(task => task.id === taskId)
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
      const index = tasks.value.findIndex(task => task.id === taskId)
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

  const moveTask = async (taskId, newColumnId, newIndex = null) => {
    try {
      loading.value = true
      const taskToMoveIndex = tasks.value.findIndex(t => t.id === taskId)
      if (taskToMoveIndex === -1) throw new Error('Task not found')

      // Remove the task from the array to re-insert it later
      const [taskToMove] = tasks.value.splice(taskToMoveIndex, 1)

      // Update task properties
      taskToMove.columnId = newColumnId
      taskToMove.updatedAt = new Date().toISOString()

      // Insert the task at the new index
      if (newIndex !== null) {
        // Get tasks in the destination column (now without the moved task)
        const tasksInNewColumn = tasks.value.filter(t =>
          t.projectId === taskToMove.projectId && t.columnId === newColumnId
        )

        if (newIndex < tasksInNewColumn.length) {
          // Find the task that will be after our moved task
          const taskAfter = tasksInNewColumn[newIndex]
          // Find its index in the main tasks array
          const insertionIndex = tasks.value.findIndex(t => t.id === taskAfter.id)
          // Insert the task at this position
          tasks.value.splice(insertionIndex, 0, taskToMove)
        } else {
          // If index is at the end or out of bounds, append to the end of the tasks list
          tasks.value.push(taskToMove)
        }
      } else {
        // If no index is provided, append to the end
        tasks.value.push(taskToMove)
      }

      return taskToMove
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const assignTask = async (taskId, userIds) => {
    try {
      const task = tasks.value.find(t => t.id === taskId)
      if (!task) throw new Error('Task not found')

      task.assigneeIds = Array.isArray(userIds) ? userIds : [userIds]
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
      task.updatedAt = new Date().toISOString()
      
      return newComment
    } catch (err) {
      error.value = err.message
      throw err
    }
  }

  // Kanban Column Management
  const updateColumnCollapse = (columnId, collapsed) => {
    const column = kanbanColumns.value.find(col => col.id === columnId)
    if (column) {
      column.collapsed = collapsed
    }
  }

  const updateColumnWipLimit = (columnId, wipLimit) => {
    const column = kanbanColumns.value.find(col => col.id === columnId)
    if (column) {
      column.wipLimit = wipLimit > 0 ? wipLimit : null
    }
  }

  const updateColumn = (columnId, updates) => {
    const column = kanbanColumns.value.find(col => col.id === columnId)
    if (column) {
      Object.assign(column, updates)
    }
  }

  const reorderColumns = (newOrder) => {
    newOrder.forEach((columnId, index) => {
      const column = kanbanColumns.value.find(col => col.id === columnId)
      if (column) {
        column.order = index + 1
      }
    })
    
    // Sort columns by new order
    kanbanColumns.value.sort((a, b) => a.order - b.order)
  }

  // Roadmap Management
  const createRoadmapItem = async (itemData) => {
    try {
      loading.value = true
      const newItem = {
        id: `roadmap-${Date.now()}`,
        ...itemData,
        taskIds: itemData.taskIds || []
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
          ...updates
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

  const linkTaskToRoadmap = async (taskId, roadmapItemId) => {
    try {
      const roadmapItem = roadmapItems.value.find(item => item.id === roadmapItemId)
      if (!roadmapItem) throw new Error('Roadmap item not found')

      if (!roadmapItem.taskIds.includes(taskId)) {
        roadmapItem.taskIds.push(taskId)
      }
    } catch (err) {
      error.value = err.message
      throw err
    }
  }

  const unlinkTaskFromRoadmap = async (taskId, roadmapItemId) => {
    try {
      const roadmapItem = roadmapItems.value.find(item => item.id === roadmapItemId)
      if (!roadmapItem) throw new Error('Roadmap item not found')

      const index = roadmapItem.taskIds.indexOf(taskId)
      if (index !== -1) {
        roadmapItem.taskIds.splice(index, 1)
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
          Object.assign(task, updates, { updatedAt: new Date().toISOString() })
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
      const idsToDelete = new Set(taskIds)
      tasks.value = tasks.value.filter(task => !idsToDelete.has(task.id))
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
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
    updateColumnCollapse,
    updateColumnWipLimit,
    updateColumn,
    reorderColumns,
    
    // Roadmap Actions
    createRoadmapItem,
    updateRoadmapItem,
    deleteRoadmapItem,
    linkTaskToRoadmap,
    unlinkTaskFromRoadmap,
    
    // Bulk Actions
    bulkUpdateTasks,
    bulkDeleteTasks
  }
})