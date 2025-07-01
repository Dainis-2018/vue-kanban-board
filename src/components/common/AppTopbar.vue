<template>
  <v-app-bar
    elevation="1"
    color="surface"
    class="px-4"
  >
    <!-- Mobile Menu Toggle -->
    <v-app-bar-nav-icon 
      @click="$emit('toggle-drawer')"
      class="d-md-none"
    />

    <!-- Page Title & Breadcrumbs -->
    <div class="d-flex flex-column align-start">
      <h1 class="text-h6 font-weight-medium">
        {{ pageTitle }}
      </h1>
      <v-breadcrumbs
        v-if="breadcrumbs.length > 1"
        :items="breadcrumbs"
        density="compact"
        class="pa-0"
      >
        <template #divider>
          <v-icon>mdi-chevron-right</v-icon>
        </template>
      </v-breadcrumbs>
    </div>

    <v-spacer />

    <!-- Quick Actions -->
    <div class="d-flex align-center ga-2">
      <!-- Global Search -->
      <v-text-field
        v-model="globalSearch"
        placeholder="Search tasks, projects..."
        variant="outlined"
        density="compact"
        hide-details
        prepend-inner-icon="mdi-magnify"
        style="max-width: 300px;"
        class="d-none d-sm-flex"
        @keyup.enter="performSearch"
      />

      <!-- Theme Toggle -->
      <v-btn
        icon
        variant="text"
        @click="toggleTheme"
      >
        <v-icon>{{ isDark ? 'mdi-weather-sunny' : 'mdi-weather-night' }}</v-icon>
      </v-btn>

      <!-- Notifications -->
      <v-menu offset-y>
        <template #activator="{ props }">
          <v-btn
            v-bind="props"
            icon
            variant="text"
          >
            <v-badge
              :content="notificationCount"
              :model-value="notificationCount > 0"
              color="error"
            >
              <v-icon>mdi-bell</v-icon>
            </v-badge>
          </v-btn>
        </template>

        <v-card min-width="320" max-width="400">
          <v-card-title class="d-flex align-center justify-space-between">
            <span>Notifications</span>
            <v-btn
              variant="text"
              size="small"
              @click="markAllAsRead"
            >
              Mark all read
            </v-btn>
          </v-card-title>

          <v-divider />

          <v-list max-height="400" class="pa-0">
            <template v-if="notifications.length > 0">
              <v-list-item
                v-for="notification in notifications.slice(0, 5)"
                :key="notification.id"
                :class="{ 'bg-primary-lighten-5': !notification.read }"
              >
                <template #prepend>
                  <v-avatar
                    size="32"
                    :color="notification.color"
                    variant="tonal"
                  >
                    <v-icon size="16">{{ notification.icon }}</v-icon>
                  </v-avatar>
                </template>

                <v-list-item-title class="text-body-2 font-weight-medium">
                  {{ notification.title }}
                </v-list-item-title>
                <v-list-item-subtitle class="text-caption">
                  {{ notification.message }}
                </v-list-item-subtitle>
                <v-list-item-subtitle class="text-caption text-medium-emphasis">
                  {{ formatTime(notification.timestamp) }}
                </v-list-item-subtitle>

                <template #append>
                  <v-btn
                    v-if="!notification.read"
                    icon
                    size="x-small"
                    variant="text"
                    @click="markAsRead(notification.id)"
                  >
                    <v-icon size="12">mdi-circle</v-icon>
                  </v-btn>
                </template>
              </v-list-item>
            </template>
            <v-list-item v-else>
              <v-list-item-title class="text-center text-medium-emphasis">
                No notifications
              </v-list-item-title>
            </v-list-item>
          </v-list>

          <v-divider />

          <v-card-actions>
            <v-btn
              variant="text"
              block
              size="small"
              @click="viewAllNotifications"
            >
              View All Notifications
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-menu>

      <!-- User Menu -->
      <v-menu offset-y>
        <template #activator="{ props }">
          <v-btn
            v-bind="props"
            variant="text"
            class="pa-1"
          >
            <v-avatar
              size="32"
              :image="currentUser.avatar"
            >
              {{ currentUser.name.charAt(0) }}
            </v-avatar>
            <v-icon class="ml-1">mdi-chevron-down</v-icon>
          </v-btn>
        </template>

        <v-card min-width="240">
          <v-card-text class="pa-4">
            <div class="d-flex align-center">
              <v-avatar
                size="40"
                :image="currentUser.avatar"
                class="mr-3"
              >
                {{ currentUser.name.charAt(0) }}
              </v-avatar>
              <div>
                <div class="font-weight-medium">{{ currentUser.name }}</div>
                <div class="text-caption text-medium-emphasis">{{ currentUser.email }}</div>
                <v-chip size="x-small" color="primary" variant="tonal" class="mt-1">
                  {{ currentUser.role }}
                </v-chip>
              </div>
            </div>
          </v-card-text>

          <v-divider />

          <v-list density="compact">
            <v-list-item
              v-for="item in userMenuItems"
              :key="item.title"
              :prepend-icon="item.icon"
              :title="item.title"
              @click="item.action"
            />
          </v-list>

          <v-divider />

          <v-list density="compact">
            <v-list-item
              prepend-icon="mdi-logout"
              title="Sign Out"
              @click="logout"
            />
          </v-list>
        </v-card>
      </v-menu>
    </div>
  </v-app-bar>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTheme } from 'vuetify'
import { useProjectsStore } from '@/stores/projects'

// Emits
defineEmits(['toggle-drawer'])

// Composables
const route = useRoute()
const router = useRouter()
const theme = useTheme()
const projectsStore = useProjectsStore()

// Local state
const globalSearch = ref('')

// Mock notifications
const notifications = ref([
  {
    id: 1,
    title: 'New Task Assigned',
    message: 'You have been assigned to "Update User Interface"',
    icon: 'mdi-account-plus',
    color: 'primary',
    timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
    read: false
  },
  {
    id: 2,
    title: 'Project Update',
    message: 'E-commerce Platform milestone completed',
    icon: 'mdi-update',
    color: 'info',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    read: false
  },
  {
    id: 3,
    title: 'Task Completed',
    message: 'Setup Project Structure has been completed',
    icon: 'mdi-check-circle',
    color: 'success',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    read: true
  }
])

// Mock current user data
const currentUser = ref({
  id: 'user-1',
  name: 'John Doe',
  email: 'john@example.com',
  avatar: 'https://i.pravatar.cc/150?img=1',
  role: 'Project Manager'
})

// Computed
const isDark = computed(() => theme.global.name.value === 'dark')

const notificationCount = computed(() => 
  notifications.value.filter(n => !n.read).length
)

const pageTitle = computed(() => {
  const routeTitles = {
    'Dashboard': 'Dashboard',
    'Projects': 'Projects',
    'Kanban': 'Kanban Board',
    'Roadmap': 'Project Roadmap',
    'Teams': 'Teams'
  }
  return routeTitles[route.name] || 'Kanban Board'
})

const breadcrumbs = computed(() => {
  const items = [{ title: 'Home', to: '/dashboard' }]
  
  if (route.name === 'Kanban' || route.name === 'Roadmap') {
    items.push({ title: 'Projects', to: '/projects' })
    
    const currentProject = projectsStore.currentProject
    if (currentProject) {
      items.push({ 
        title: currentProject.name, 
        to: `/projects/${currentProject.id}`,
        disabled: true 
      })
    }
    
    items.push({ 
      title: route.name === 'Kanban' ? 'Kanban Board' : 'Roadmap',
      disabled: true 
    })
  } else if (route.name !== 'Dashboard') {
    items.push({ title: pageTitle.value, disabled: true })
  }
  
  return items
})

const userMenuItems = computed(() => [
  {
    title: 'Profile Settings',
    icon: 'mdi-account',
    action: () => console.log('Profile settings')
  },
  {
    title: 'Preferences',
    icon: 'mdi-cog',
    action: () => console.log('Preferences')
  },
  {
    title: 'Keyboard Shortcuts',
    icon: 'mdi-keyboard',
    action: () => console.log('Shortcuts')
  },
  {
    title: 'Help & Support',
    icon: 'mdi-help-circle',
    action: () => console.log('Help')
  }
])

// Methods
const toggleTheme = () => {
  theme.global.name.value = isDark.value ? 'light' : 'dark'
}

const performSearch = () => {
  if (globalSearch.value.trim()) {
    router.push(`/search?q=${encodeURIComponent(globalSearch.value)}`)
  }
}

const markAsRead = (notificationId) => {
  const notification = notifications.value.find(n => n.id === notificationId)
  if (notification) {
    notification.read = true
  }
}

const markAllAsRead = () => {
  notifications.value.forEach(notification => {
    notification.read = true
  })
}

const viewAllNotifications = () => {
  console.log('View all notifications')
}

const logout = () => {
  console.log('Logout')
}

const formatTime = (timestamp) => {
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
</script>

<style scoped>
:deep(.v-breadcrumbs-item--disabled) {
  opacity: 0.6;
}

:deep(.v-text-field .v-field) {
  box-shadow: none;
}
</style>