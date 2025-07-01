<template>
  <v-app-bar 
    app 
    height="64"
    elevation="0"
    color="surface"
    class="topbar"
  >
    <!-- Menu Toggle (Mobile) -->
    <v-app-bar-nav-icon
      v-if="mobile"
      @click="$emit('toggle-drawer')"
    />

    <!-- Page Title -->
    <v-app-bar-title class="text-h6 font-weight-medium">
      {{ pageTitle }}
    </v-app-bar-title>

    <!-- Breadcrumbs -->
    <v-breadcrumbs
      v-if="!mobile && breadcrumbs.length > 1"
      :items="breadcrumbs"
      class="pa-0 ml-4"
      density="compact"
    >
      <template #divider>
        <v-icon size="16">mdi-chevron-right</v-icon>
      </template>
      <template #item="{ item }">
        <v-breadcrumbs-item
          :to="item.disabled ? undefined : item.to"
          :disabled="item.disabled"
          class="text-body-2"
        >
          {{ item.title }}
        </v-breadcrumbs-item>
      </template>
    </v-breadcrumbs>

    <v-spacer />

    <!-- Search -->
    <v-text-field
      v-model="searchQuery"
      placeholder="Search tasks, projects..."
      prepend-inner-icon="mdi-magnify"
      variant="outlined"
      density="compact"
      hide-details
      clearable
      class="mr-4"
      style="max-width: 300px;"
      @keyup.enter="performSearch"
    />

    <!-- Notifications -->
    <v-menu offset-y>
      <template #activator="{ props }">
        <v-btn
          v-bind="props"
          icon
          variant="text"
          class="mr-2"
        >
          <v-badge
            :content="notificationCount"
            :model-value="notificationCount > 0"
            color="error"
            overlap
          >
            <v-icon>mdi-bell</v-icon>
          </v-badge>
        </v-btn>
      </template>
      
      <v-card min-width="320" max-width="400">
        <v-card-title class="d-flex align-center justify-space-between">
          <span class="text-h6">Notifications</span>
          <v-btn
            icon
            variant="text"
            size="small"
            @click="markAllAsRead"
          >
            <v-icon>mdi-check-all</v-icon>
          </v-btn>
        </v-card-title>
        
        <v-divider />
        
        <v-list v-if="notifications.length > 0" max-height="400" class="py-0">
          <v-list-item
            v-for="notification in notifications"
            :key="notification.id"
            :class="{ 'bg-blue-lighten-5': !notification.read }"
            class="notification-item"
            @click="markAsRead(notification.id)"
          >
            <template #prepend>
              <v-avatar :color="notification.color" size="32">
                <v-icon :icon="notification.icon" size="16" />
              </v-avatar>
            </template>
            
            <v-list-item-title class="text-body-2 font-weight-medium">
              {{ notification.title }}
            </v-list-item-title>
            
            <v-list-item-subtitle class="text-caption">
              {{ notification.message }}
            </v-list-item-subtitle>
            
            <template #append>
              <v-list-item-action>
                <span class="text-caption text-medium-emphasis">
                  {{ formatTime(notification.timestamp) }}
                </span>
              </v-list-item-action>
            </template>
          </v-list-item>
        </v-list>
        
        <v-card-text v-else class="text-center text-medium-emphasis">
          <v-icon size="48" class="mb-2">mdi-bell-off</v-icon>
          <p class="text-body-2">No new notifications</p>
        </v-card-text>
        
        <v-divider v-if="notifications.length > 0" />
        
        <v-card-actions v-if="notifications.length > 0">
          <v-btn
            block
            variant="text"
            size="small"
            @click="viewAllNotifications"
          >
            View All Notifications
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-menu>

    <!-- Theme Toggle -->
    <v-btn
      icon
      variant="text"
      class="mr-2"
      @click="toggleTheme"
    >
      <v-icon>{{ isDark ? 'mdi-weather-sunny' : 'mdi-weather-night' }}</v-icon>
    </v-btn>

    <!-- User Menu -->
    <v-menu offset-y>
      <template #activator="{ props }">
        <v-btn
          v-bind="props"
          variant="text"
          class="user-menu-btn"
        >
          <v-avatar size="32" class="mr-2">
            <v-img
              :src="currentUser.avatar"
              :alt="currentUser.name"
            />
          </v-avatar>
          <span v-if="!mobile" class="text-body-2 font-weight-medium">
            {{ currentUser.name }}
          </span>
          <v-icon v-if="!mobile" class="ml-1">mdi-chevron-down</v-icon>
        </v-btn>
      </template>
      
      <v-card min-width="240">
        <v-card-text class="pb-2">
          <div class="d-flex align-center">
            <v-avatar size="40" class="mr-3">
              <v-img
                :src="currentUser.avatar"
                :alt="currentUser.name"
              />
            </v-avatar>
            <div>
              <p class="text-body-2 font-weight-medium mb-0">
                {{ currentUser.name }}
              </p>
              <p class="text-caption text-medium-emphasis mb-0">
                {{ currentUser.email }}
              </p>
              <v-chip
                size="x-small"
                color="primary"
                variant="outlined"
                class="mt-1"
              >
                {{ currentUser.role }}
              </v-chip>
            </div>
          </div>
        </v-card-text>
        
        <v-divider />
        
        <v-list nav density="compact">
          <v-list-item
            v-for="item in userMenuItems"
            :key="item.title"
            :prepend-icon="item.icon"
            :title="item.title"
            @click="item.action"
          />
        </v-list>
        
        <v-divider />
        
        <v-card-actions>
          <v-btn
            block
            variant="text"
            prepend-icon="mdi-logout"
            @click="logout"
          >
            Sign Out
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-menu>
  </v-app-bar>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDisplay, useTheme } from 'vuetify'
import { useProjectsStore } from '@/stores/projects'

// Emits
defineEmits(['toggle-drawer'])

// Composables
const route = useRoute()
const router = useRouter()
const { mobile } = useDisplay()
const theme = useTheme()
const projectsStore = useProjectsStore()

// Local state
const searchQuery = ref('')
const notifications = ref([
  {
    id: 1,
    title: 'Task Assigned',
    message: 'You have been assigned to "Fix Login Bug"',
    icon: 'mdi-account-plus',
    color: 'primary',
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    read: false
  },
  {
    id: 2,
    title: 'Project Updated',
    message: 'E-commerce Platform roadmap has been updated',
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
  if (searchQuery.value.trim()) {
    // TODO: Implement search functionality
    console.log('Searching for:', searchQuery.value)
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

const logout = () => {
  // TODO: Implement logout functionality
  console.log('Logout')
}
</script>

<style scoped>
.topbar {
  border-bottom: 1px solid rgb(var(--v-theme-surface-variant));
}

.user-menu-btn {
  text-transform: none;
  height: auto;
  padding: 4px 8px;
}

.notification-item {
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.notification-item:hover {
  background-color: rgb(var(--v-theme-surface-variant), 0.5);
}

:deep(.v-text-field .v-input__control) {
  min-height: 40px;
}

:deep(.v-breadcrumbs-item) {
  font-size: 0.875rem;
}

:deep(.v-breadcrumbs-item--disabled) {
  opacity: 0.6;
}
</style>