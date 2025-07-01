<template>
  <div class="dashboard">
    <!-- Welcome Section -->
    <v-row class="mb-6">
      <v-col cols="12">
        <v-card class="welcome-card" color="primary" dark>
          <v-card-text class="pa-6">
            <v-row align="center">
              <v-col cols="12" md="8">
                <h1 class="text-h4 font-weight-bold mb-2">
                  Welcome back, {{ currentUser.name }}! 👋
                </h1>
                <p class="text-h6 opacity-90 mb-0">
                  You have {{ pendingTasksCount }} pending tasks across {{ activeProjectsCount }} active projects.
                </p>
              </v-col>
              <v-col cols="12" md="4" class="text-center text-md-right">
                <v-btn
                  size="large"
                  color="white"
                  variant="elevated"
                  prepend-icon="mdi-plus"
                  @click="createNewTask"
                >
                  Create New Task
                </v-btn>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Quick Stats -->
    <v-row class="mb-6">
      <v-col
        v-for="stat in quickStats"
        :key="stat.title"
        cols="6"
        md="3"
      >
        <v-card class="stat-card h-100" :color="stat.color" variant="tonal">
          <v-card-text class="pa-4">
            <div class="d-flex align-center justify-space-between">
              <div>
                <p class="text-caption text-medium-emphasis mb-1">
                  {{ stat.title }}
                </p>
                <h3 class="text-h4 font-weight-bold">
                  {{ stat.value }}
                </h3>
                <div class="d-flex align-center mt-2">
                  <v-icon 
                    :color="stat.trend === 'up' ? 'success' : stat.trend === 'down' ? 'error' : 'warning'" 
                    size="16"
                    class="mr-1"
                  >
                    {{ stat.trend === 'up' ? 'mdi-trending-up' : stat.trend === 'down' ? 'mdi-trending-down' : 'mdi-minus' }}
                  </v-icon>
                  <span class="text-caption" :class="stat.trend === 'up' ? 'text-success' : stat.trend === 'down' ? 'text-error' : ''">
                    {{ stat.change }}
                  </span>
                </div>
              </div>
              <v-avatar :color="stat.color" size="48" variant="flat">
                <v-icon :icon="stat.icon" size="24" />
              </v-avatar>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <!-- My Tasks -->
      <v-col cols="12" lg="8">
        <v-card class="h-100">
          <v-card-title class="d-flex align-center justify-space-between">
            <span class="text-h6">My Tasks</span>
            <v-btn-toggle
              v-model="tasksView"
              variant="outlined"
              size="small"
              mandatory
            >
              <v-btn value="list" icon="mdi-format-list-bulleted" />
              <v-btn value="priority" icon="mdi-flag" />
              <v-btn value="due" icon="mdi-calendar-clock" />
            </v-btn-toggle>
          </v-card-title>
          
          <v-divider />
          
          <v-card-text class="pa-0">
            <!-- List View -->
            <div v-if="tasksView === 'list'" class="task-list">
              <v-list lines="two">
                <template v-for="(task, index) in myTasks.slice(0, 10)" :key="task.id">
                  <v-list-item
                    :to="`/kanban/${task.projectId}?task=${task.id}`"
                    class="task-item"
                  >
                    <template #prepend>
                      <v-avatar
                        size="32"
                        :color="getColumnColor(task.columnId)"
                        variant="tonal"
                      >
                        <v-icon size="16">{{ getColumnIcon(task.columnId) }}</v-icon>
                      </v-avatar>
                    </template>
                    
                    <v-list-item-title class="font-weight-medium">
                      {{ task.title }}
                    </v-list-item-title>
                    
                    <v-list-item-subtitle class="d-flex align-center">
                      <v-chip
                        size="x-small"
                        :color="getPriorityColor(task.priority)"
                        variant="flat"
                        class="mr-2"
                      >
                        {{ task.priority.toUpperCase() }}
                      </v-chip>
                      <span class="text-caption">{{ getProjectName(task.projectId) }}</span>
                    </v-list-item-subtitle>
                    
                    <template #append>
                      <div class="d-flex align-center">
                        <div v-if="task.assigneeIds.length > 0" class="avatar-group mr-2">
                          <v-avatar
                            v-for="userId in task.assigneeIds.slice(0, 2)"
                            :key="userId"
                            size="24"
                          >
                            <v-img :src="getUserById(userId)?.avatar" />
                          </v-avatar>
                          <span v-if="task.assigneeIds.length > 2" class="text-caption ml-1">
                            +{{ task.assigneeIds.length - 2 }}
                          </span>
                        </div>
                        <span v-if="task.dueDate" class="text-caption text-medium-emphasis">
                          {{ formatDueDate(task.dueDate) }}
                        </span>
                      </div>
                    </template>
                  </v-list-item>
                  
                  <v-divider v-if="index < myTasks.slice(0, 10).length - 1" />
                </template>
              </v-list>
              
              <v-card-actions v-if="myTasks.length > 10">
                <v-btn
                  variant="text"
                  block
                  :to="`/kanban/${currentProject?.id || ''}`"
                >
                  View All {{ myTasks.length }} Tasks
                </v-btn>
              </v-card-actions>
            </div>
            
            <!-- Priority View -->
            <div v-else-if="tasksView === 'priority'" class="priority-view pa-4">
              <div
                v-for="priority in ['critical', 'high', 'medium', 'low']"
                :key="priority"
                class="priority-section mb-4"
              >
                <h6 class="text-subtitle-2 font-weight-bold mb-2 d-flex align-center">
                  <v-icon
                    :color="getPriorityColor(priority)"
                    size="16"
                    class="mr-2"
                  >
                    mdi-flag
                  </v-icon>
                  {{ priority.toUpperCase() }}
                  <v-chip size="x-small" class="ml-2">
                    {{ tasksByPriority[priority]?.length || 0 }}
                  </v-chip>
                </h6>
                
                <div v-if="tasksByPriority[priority]?.length > 0" class="d-flex flex-wrap ga-2">
                  <v-card
                    v-for="task in tasksByPriority[priority].slice(0, 6)"
                    :key="task.id"
                    variant="outlined"
                    size="small"
                    class="task-mini-card cursor-pointer"
                    @click="goToTask(task)"
                  >
                    <v-card-text class="pa-2">
                      <p class="text-caption font-weight-medium mb-1 text-truncate">
                        {{ task.title }}
                      </p>
                      <p class="text-caption text-medium-emphasis mb-0">
                        {{ getProjectName(task.projectId) }}
                      </p>
                    </v-card-text>
                  </v-card>
                </div>
                
                <p v-else class="text-caption text-medium-emphasis mb-0">
                  No {{ priority }} priority tasks
                </p>
              </div>
            </div>
            
            <!-- Due Date View -->
            <div v-else-if="tasksView === 'due'" class="due-view pa-4">
              <div class="mb-4">
                <h6 class="text-subtitle-2 font-weight-bold mb-2 text-error d-flex align-center">
                  <v-icon color="error" size="16" class="mr-2">mdi-alert-circle</v-icon>
                  OVERDUE
                  <v-chip size="x-small" color="error" class="ml-2">
                    {{ overdueTasks.length }}
                  </v-chip>
                </h6>
                
                <div v-if="overdueTasks.length > 0" class="d-flex flex-wrap ga-2">
                  <v-card
                    v-for="task in overdueTasks.slice(0, 6)"
                    :key="task.id"
                    variant="outlined"
                    color="error"
                    size="small"
                    class="task-mini-card cursor-pointer"
                    @click="goToTask(task)"
                  >
                    <v-card-text class="pa-2">
                      <p class="text-caption font-weight-medium mb-1 text-truncate">
                        {{ task.title }}
                      </p>
                      <p class="text-caption text-medium-emphasis mb-0">
                        Due {{ formatDueDate(task.dueDate) }}
                      </p>
                    </v-card-text>
                  </v-card>
                </div>
                
                <p v-else class="text-caption text-medium-emphasis mb-0">
                  No overdue tasks 🎉
                </p>
              </div>
              
              <div>
                <h6 class="text-subtitle-2 font-weight-bold mb-2 text-warning d-flex align-center">
                  <v-icon color="warning" size="16" class="mr-2">mdi-clock-alert</v-icon>
                  DUE THIS WEEK
                  <v-chip size="x-small" color="warning" class="ml-2">
                    {{ dueThisWeekTasks.length }}
                  </v-chip>
                </h6>
                
                <div v-if="dueThisWeekTasks.length > 0" class="d-flex flex-wrap ga-2">
                  <v-card
                    v-for="task in dueThisWeekTasks.slice(0, 6)"
                    :key="task.id"
                    variant="outlined"
                    color="warning"
                    size="small"
                    class="task-mini-card cursor-pointer"
                    @click="goToTask(task)"
                  >
                    <v-card-text class="pa-2">
                      <p class="text-caption font-weight-medium mb-1 text-truncate">
                        {{ task.title }}
                      </p>
                      <p class="text-caption text-medium-emphasis mb-0">
                        Due {{ formatDueDate(task.dueDate) }}
                      </p>
                    </v-card-text>
                  </v-card>
                </div>
                
                <p v-else class="text-caption text-medium-emphasis mb-0">
                  No tasks due this week
                </p>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      
      <!-- Right Sidebar -->
      <v-col cols="12" lg="4">
        <v-row>
          <!-- Recent Activity -->
          <v-col cols="12">
            <v-card class="mb-4">
              <v-card-title class="text-h6">Recent Activity</v-card-title>
              <v-divider />
              <v-card-text class="pa-0">
                <v-list lines="two" class="py-0">
                  <v-list-item
                    v-for="(activity, index) in recentActivity"
                    :key="activity.id"
                    class="activity-item"
                  >
                    <template #prepend>
                      <v-avatar
                        size="32"
                        :color="activity.color"
                        variant="tonal"
                      >
                        <v-icon size="16">{{ activity.icon }}</v-icon>
                      </v-avatar>
                    </template>
                    
                    <v-list-item-title class="text-body-2">
                      {{ activity.message }}
                    </v-list-item-title>
                    
                    <v-list-item-subtitle class="text-caption">
                      {{ formatActivityTime(activity.timestamp) }}
                    </v-list-item-subtitle>
                    
                    <v-divider v-if="index < recentActivity.length - 1" />
                  </v-list-item>
                </v-list>
              </v-card-text>
            </v-card>
          </v-col>
          
          <!-- Project Progress -->
          <v-col cols="12">
            <v-card>
              <v-card-title class="text-h6">Project Progress</v-card-title>
              <v-divider />
              <v-card-text>
                <div
                  v-for="project in activeProjects"
                  :key="project.id"
                  class="project-progress mb-4"
                >
                  <div class="d-flex align-center justify-space-between mb-2">
                    <div class="d-flex align-center">
                      <v-avatar size="24" :color="project.color" class="mr-2">
                        <span class="text-caption text-white">
                          {{ project.name.charAt(0) }}
                        </span>
                      </v-avatar>
                      <span class="text-body-2 font-weight-medium">
                        {{ project.name }}
                      </span>
                    </div>
                    <span class="text-caption text-medium-emphasis">
                      {{ getProjectProgress(project.id) }}%
                    </span>
                  </div>
                  
                  <v-progress-linear
                    :model-value="getProjectProgress(project.id)"
                    :color="project.color"
                    height="6"
                    rounded
                  />
                  
                  <div class="d-flex justify-space-between mt-1">
                    <span class="text-caption text-medium-emphasis">
                      {{ getProjectTaskCounts(project.id).completed }} completed
                    </span>
                    <span class="text-caption text-medium-emphasis">
                      {{ getProjectTaskCounts(project.id).total }} total
                    </span>
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useProjectsStore } from '@/stores/projects'
import { useTasksStore } from '@/stores/tasks'

// Composables
const router = useRouter()
const projectsStore = useProjectsStore()
const tasksStore = useTasksStore()

// Local state
const tasksView = ref('list')

// Mock current user
const currentUser = ref({
  id: 'user-1',
  name: 'John Doe',
  email: 'john@example.com',
  avatar: 'https://i.pravatar.cc/150?img=1',
  role: 'Project Manager'
})

// Mock recent activity
const recentActivity = ref([
  {
    id: 1,
    message: 'Mike Johnson completed "Setup Project Structure"',
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    icon: 'mdi-check-circle',
    color: 'success'
  },
  {
    id: 2,
    message: 'New task "API Authentication" was created',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    icon: 'mdi-plus-circle',
    color: 'primary'
  },
  {
    id: 3,
    message: 'Sarah Wilson updated "Design User Authentication"',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4),
    icon: 'mdi-pencil',
    color: 'info'
  },
  {
    id: 4,
    message: 'Project "E-commerce Platform" roadmap updated',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
    icon: 'mdi-map',
    color: 'warning'
  }
])

// Store getters
const currentProject = computed(() => projectsStore.currentProject)
const allTasks = computed(() => tasksStore.tasks)
const kanbanColumns = computed(() => tasksStore.kanbanColumns)
const tasksByPriority = computed(() => tasksStore.tasksByPriority)
const overdueTasks = computed(() => tasksStore.overdueTasks)

// Computed
const activeProjects = computed(() => 
  projectsStore.projects.filter(p => p.status === 'active')
)

const activeProjectsCount = computed(() => activeProjects.value.length)

const pendingTasksCount = computed(() => 
  allTasks.value.filter(task => 
    task.columnId !== 'done' && task.columnId !== 'cancelled'
  ).length
)

const myTasks = computed(() => 
  allTasks.value.filter(task => 
    task.assigneeIds.includes(currentUser.value.id) &&
    task.columnId !== 'done'
  ).sort((a, b) => {
    // Sort by priority and due date
    const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
    const aPriority = priorityOrder[a.priority] || 0
    const bPriority = priorityOrder[b.priority] || 0
    
    if (aPriority !== bPriority) {
      return bPriority - aPriority
    }
    
    if (a.dueDate && b.dueDate) {
      return new Date(a.dueDate) - new Date(b.dueDate)
    }
    
    return a.dueDate ? -1 : 1
  })
)

const dueThisWeekTasks = computed(() => {
  const now = new Date()
  const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  
  return allTasks.value.filter(task => {
    if (!task.dueDate || task.columnId === 'done') return false
    const dueDate = new Date(task.dueDate)
    return dueDate >= now && dueDate <= weekFromNow
  })
})

const quickStats = computed(() => [
  {
    title: 'Total Tasks',
    value: allTasks.value.length,
    change: '+12%',
    trend: 'up',
    icon: 'mdi-format-list-checks',
    color: 'primary'
  },
  {
    title: 'In Progress',
    value: allTasks.value.filter(t => t.columnId === 'in-progress').length,
    change: '+8%',
    trend: 'up',
    icon: 'mdi-clock',
    color: 'warning'
  },
  {
    title: 'Completed',
    value: allTasks.value.filter(t => t.columnId === 'done').length,
    change: '+15%',
    trend: 'up',
    icon: 'mdi-check-circle',
    color: 'success'
  },
  {
    title: 'Overdue',
    value: overdueTasks.value.length,
    change: '-3%',
    trend: 'down',
    icon: 'mdi-alert-circle',
    color: 'error'
  }
])

// Methods
const getUserById = (userId) => {
  return projectsStore.getUserById(userId)
}

const getProjectName = (projectId) => {
  const project = projectsStore.projects.find(p => p.id === projectId)
  return project?.name || 'Unknown Project'
}

const getColumnColor = (columnId) => {
  const column = kanbanColumns.value.find(col => col.id === columnId)
  return column?.color || 'grey'
}

const getColumnIcon = (columnId) => {
  const icons = {
    'backlog': 'mdi-inbox',
    'todo': 'mdi-format-list-checks',
    'in-progress': 'mdi-clock',
    'review': 'mdi-eye',
    'done': 'mdi-check-circle'
  }
  return icons[columnId] || 'mdi-circle'
}

const getPriorityColor = (priority) => {
  const colors = {
    critical: 'error',
    high: 'warning',
    medium: 'info',
    low: 'success'
  }
  return colors[priority] || 'grey'
}

const formatDueDate = (dueDate) => {
  if (!dueDate) return ''
  
  const date = new Date(dueDate)
  const now = new Date()
  const diffTime = date.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays < 0) {
    return `${Math.abs(diffDays)} days ago`
  } else if (diffDays === 0) {
    return 'Today'
  } else if (diffDays === 1) {
    return 'Tomorrow'
  } else if (diffDays <= 7) {
    return `${diffDays} days`
  } else {
    return date.toLocaleDateString()
  }
}

const formatActivityTime = (timestamp) => {
  const now = new Date()
  const diff = now - timestamp
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (minutes < 60) {
    return `${minutes}m ago`
  } else if (hours < 24) {
    return `${hours}h ago`
  } else {
    return `${days}d ago`
  }
}

const getProjectProgress = (projectId) => {
  const projectTasks = allTasks.value.filter(task => task.projectId === projectId)
  if (projectTasks.length === 0) return 0
  
  const completedTasks = projectTasks.filter(task => task.columnId === 'done')
  return Math.round((completedTasks.length / projectTasks.length) * 100)
}

const getProjectTaskCounts = (projectId) => {
  const projectTasks = allTasks.value.filter(task => task.projectId === projectId)
  const completed = projectTasks.filter(task => task.columnId === 'done').length
  
  return {
    total: projectTasks.length,
    completed
  }
}

const goToTask = (task) => {
  router.push(`/kanban/${task.projectId}?task=${task.id}`)
}

const createNewTask = () => {
  // TODO: Open task creation dialog
  console.log('Create new task')
}
</script>

<style scoped>
.welcome-card {
  background: linear-gradient(135deg, rgb(var(--v-theme-primary)) 0%, rgb(var(--v-theme-primary-darken-1)) 100%);
}

.stat-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.task-item {
  transition: background-color 0.2s ease;
}

.task-item:hover {
  background-color: rgba(var(--v-theme-primary), 0.05);
}

.task-mini-card {
  min-width: 140px;
  max-width: 160px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.task-mini-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.priority-section {
  border-left: 3px solid transparent;
  padding-left: 12px;
}

.project-progress:last-child {
  margin-bottom: 0 !important;
}

.activity-item {
  padding: 12px 16px;
}

.avatar-group {
  display: flex;
  margin-left: -8px;
}

.avatar-group .v-avatar {
  margin-left: -4px;
  border: 2px solid rgb(var(--v-theme-surface));
}

@media (max-width: 960px) {
  .welcome-card .v-row {
    text-align: center;
  }
  
  .task-mini-card {
    min-width: 120px;
    max-width: 140px;
  }
}
</style>