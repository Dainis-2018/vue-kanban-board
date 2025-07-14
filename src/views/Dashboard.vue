<template>
  <div class="dashboard">
    <!-- Welcome Section -->
    <v-card class="welcome-card mb-6" elevation="0">
      <v-card-text class="pa-6">
        <v-row align="center">
          <v-col cols="12" md="8">
            <h1 class="text-h4 text-white font-weight-bold mb-2">
              Welcome back, {{ currentUser.name }}! 👋
            </h1>
            <p class="text-h6 text-white mb-4 opacity-90">
              Here's what's happening with your projects today.
            </p>
            <div class="d-flex ga-3">
              <v-btn
                color="white"
                variant="flat"
                prepend-icon="mdi-plus"
                @click="createNewTask"
              >
                Create Task
              </v-btn>
              <v-btn
                color="white"
                variant="outlined"
                prepend-icon="mdi-view-dashboard"
                @click="$router.push('/projects')"
              >
                View Projects
              </v-btn>
            </div>
          </v-col>
          <v-col cols="12" md="4" class="text-center">
            <v-img
              src="https://placehold.co/300x200/1976D2/ffffff?text=Dashboard"
              max-width="300"
              class="mx-auto"
            />
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Stats Cards -->
    <v-row class="mb-6">
      <v-col
        v-for="stat in dashboardStats"
        :key="stat.title"
        cols="12"
        sm="6"
        lg="3"
      >
        <v-card class="stat-card h-100" elevation="2">
          <v-card-text class="pa-4">
            <div class="d-flex align-center justify-space-between">
              <div>
                <h3 class="text-h4 font-weight-bold mb-1">
                  {{ stat.value }}
                </h3>
                <p class="text-body-2 text-medium-emphasis mb-2">
                  {{ stat.title }}
                </p>
                <div class="d-flex align-center">
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
                        {{ task.priority }}
                      </v-chip>
                      <span class="text-caption">
                        {{ getProjectName(task.projectId) }}
                      </span>
                    </v-list-item-subtitle>
                    
                    <template #append>
                      <div class="text-caption text-medium-emphasis">
                        {{ task.dueDate ? formatDate(task.dueDate) : 'No due date' }}
                      </div>
                    </template>
                  </v-list-item>
                  <v-divider v-if="index < myTasks.slice(0, 10).length - 1" />
                </template>
              </v-list>
            </div>
            
            <!-- Priority View -->
            <div v-else-if="tasksView === 'priority'" class="pa-4">
              <div
                v-for="(tasks, priority) in tasksByPriority"
                :key="priority"
                class="priority-section mb-4"
                :style="{ borderLeftColor: getPriorityColor(priority) }"
              >
                <h4 class="text-subtitle-1 font-weight-medium mb-3 text-capitalize">
                  {{ priority }} Priority ({{ tasks.length }})
                </h4>
                <div class="d-flex ga-2 flex-wrap">
                  <v-card
                    v-for="task in tasks.slice(0, 3)"
                    :key="task.id"
                    class="task-mini-card"
                    elevation="1"
                    @click="goToTask(task)"
                  >
                    <v-card-text class="pa-3">
                      <div class="text-body-2 font-weight-medium mb-1">
                        {{ task.title }}
                      </div>
                      <div class="text-caption text-medium-emphasis">
                        {{ getProjectName(task.projectId) }}
                      </div>
                    </v-card-text>
                  </v-card>
                </div>
              </div>
            </div>
            
            <!-- Due Date View -->
            <div v-else-if="tasksView === 'due'" class="pa-4">
              <div class="mb-4">
                <h4 class="text-subtitle-1 font-weight-medium mb-3 text-error">
                  Overdue ({{ overdueTasks.length }})
                </h4>
                <div class="d-flex ga-2 flex-wrap">
                  <v-card
                    v-for="task in overdueTasks.slice(0, 3)"
                    :key="task.id"
                    class="task-mini-card"
                    elevation="1"
                    color="error"
                    variant="tonal"
                    @click="goToTask(task)"
                  >
                    <v-card-text class="pa-3">
                      <div class="text-body-2 font-weight-medium mb-1">
                        {{ task.title }}
                      </div>
                      <div class="text-caption">
                        Due: {{ formatDate(task.dueDate) }}
                      </div>
                    </v-card-text>
                  </v-card>
                </div>
              </div>
              
              <div>
                <h4 class="text-subtitle-1 font-weight-medium mb-3 text-warning">
                  Due This Week ({{ dueThisWeek.length }})
                </h4>
                <div class="d-flex ga-2 flex-wrap">
                  <v-card
                    v-for="task in dueThisWeek.slice(0, 3)"
                    :key="task.id"
                    class="task-mini-card"
                    elevation="1"
                    color="warning"
                    variant="tonal"
                    @click="goToTask(task)"
                  >
                    <v-card-text class="pa-3">
                      <div class="text-body-2 font-weight-medium mb-1">
                        {{ task.title }}
                      </div>
                      <div class="text-caption">
                        Due: {{ formatDate(task.dueDate) }}
                      </div>
                    </v-card-text>
                  </v-card>
                </div>
              </div>
            </div>
          </v-card-text>
          
          <v-divider />
          
          <v-card-actions>
            <v-btn
              variant="text"
              prepend-icon="mdi-eye"
              @click="$router.push('/kanban')"
            >
              View All Tasks
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>

      <!-- Right Sidebar -->
      <v-col cols="12" lg="4">
        <!-- Project Progress -->
        <v-card class="mb-4">
          <v-card-title>Project Progress</v-card-title>
          <v-card-text>
            <div
              v-for="project in activeProjects.slice(0, 3)"
              :key="project.id"
              class="project-progress mb-4"
            >
              <div class="d-flex align-center justify-space-between mb-2">
                <span class="font-weight-medium">{{ project.name }}</span>
                <span class="text-caption">
                  {{ getProjectProgress(project.id).completed }}/{{ getProjectProgress(project.id).total }}
                </span>
              </div>
              <v-progress-linear
                :model-value="(getProjectProgress(project.id).completed / getProjectProgress(project.id).total) * 100"
                :color="project.color"
                height="8"
                rounded
              />
            </div>
          </v-card-text>
          <v-card-actions>
            <v-btn
              variant="text"
              prepend-icon="mdi-folder-multiple"
              @click="$router.push('/projects')"
            >
              View All Projects
            </v-btn>
          </v-card-actions>
        </v-card>

        <!-- Recent Activity -->
        <v-card>
          <v-card-title>Recent Activity</v-card-title>
          <v-list density="compact">
            <v-list-item
              v-for="activity in recentActivities"
              :key="activity.id"
              class="activity-item"
            >
              <template #prepend>
                <v-avatar size="24" :color="activity.color" variant="tonal">
                  <v-icon size="12">{{ activity.icon }}</v-icon>
                </v-avatar>
              </template>
              
              <v-list-item-title class="text-body-2">
                {{ activity.message }}
              </v-list-item-title>
              
              <v-list-item-subtitle class="text-caption">
                {{ formatTimeAgo(activity.timestamp) }}
              </v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useProjectsStore } from '@/stores/projects'
import { useTasksStore } from '@/stores/tasks'

const router = useRouter()
const projectsStore = useProjectsStore()
const tasksStore = useTasksStore()

// Local state
const tasksView = ref('list')

// Mock current user (in real app, this would come from auth store)
const currentUser = ref({
  id: 'user-1',
  name: 'John Doe',
  email: 'john@example.com'
})

// Store getters
const allProjects = computed(() => projectsStore.projects)
const activeProjects = computed(() => projectsStore.activeProjects)
const allTasks = computed(() => tasksStore.tasks)

// Computed
const myTasks = computed(() => 
  allTasks.value.filter(task => task.assigneeId === currentUser.value.id)
)

const tasksByPriority = computed(() => {
  const priorities = { critical: [], high: [], medium: [], low: [] }
  myTasks.value.forEach(task => {
    if (priorities[task.priority]) {
      priorities[task.priority].push(task)
    }
  })
  return priorities
})

const overdueTasks = computed(() => {
  const now = new Date()
  return myTasks.value.filter(task => {
    if (!task.dueDate || task.columnId === 'done') return false
    return new Date(task.dueDate) < now
  })
})

const dueThisWeek = computed(() => {
  const now = new Date()
  const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  
  return myTasks.value.filter(task => {
    if (!task.dueDate || task.columnId === 'done') return false
    const dueDate = new Date(task.dueDate)
    return dueDate >= now && dueDate <= weekFromNow
  })
})

const dashboardStats = computed(() => [
  {
    title: 'Active Projects',
    value: activeProjects.value.length,
    icon: 'mdi-folder-multiple',
    color: 'primary',
    trend: 'up',
    change: '+2 this month'
  },
  {
    title: 'My Tasks',
    value: myTasks.value.filter(t => t.columnId !== 'done').length,
    icon: 'mdi-format-list-checks',
    color: 'info',
    trend: 'down',
    change: '-3 from last week'
  },
  {
    title: 'Overdue',
    value: overdueTasks.value.length,
    icon: 'mdi-clock-alert',
    color: 'error',
    trend: 'neutral',
    change: 'Same as last week'
  },
  {
    title: 'Completed',
    value: myTasks.value.filter(t => t.columnId === 'done').length,
    icon: 'mdi-check-circle',
    color: 'success',
    trend: 'up',
    change: '+5 this week'
  }
])

const recentActivities = computed(() => [
  {
    id: 1,
    message: 'Task "Setup Project Structure" completed',
    icon: 'mdi-check-circle',
    color: 'success',
    timestamp: new Date(Date.now() - 1000 * 60 * 30) // 30 minutes ago
  },
  {
    id: 2,
    message: 'New task assigned: "Design User Interface"',
    icon: 'mdi-account-plus',
    color: 'primary',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2) // 2 hours ago
  },
  {
    id: 3,
    message: 'Project "E-commerce Platform" updated',
    icon: 'mdi-update',
    color: 'info',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6) // 6 hours ago
  }
])

// Methods
const getPriorityColor = (priority) => {
  const colors = {
    critical: 'error',
    high: 'warning',
    medium: 'info',
    low: 'success'
  }
  return colors[priority] || 'grey'
}

const getColumnColor = (columnId) => {
  const column = tasksStore.kanbanColumns.find(col => col.id === columnId)
  return column?.color || 'grey'
}

const getColumnIcon = (columnId) => {
  const column = tasksStore.kanbanColumns.find(col => col.id === columnId)
  return column?.icon || 'mdi-circle'
}

const getProjectName = (projectId) => {
  const project = allProjects.value.find(p => p.id === projectId)
  return project?.name || 'Unknown Project'
}

const getProjectProgress = (projectId) => {
  const projectTasks = allTasks.value.filter(task => task.projectId === projectId)
  const completed = projectTasks.filter(task => task.columnId === 'done').length
  
  return {
    total: projectTasks.length,
    completed
  }
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  })
}

const formatTimeAgo = (timestamp) => {
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

const goToTask = (task) => {
  router.push(`/kanban/${task.projectId}?task=${task.id}`)
}

const createNewTask = () => {
  // TODO: Open task creation dialog
  console.log('Create new task')
}

onMounted(() => {
  // Initialize current project if not set
  projectsStore.initializeCurrentProject()
})
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
  cursor: pointer;
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