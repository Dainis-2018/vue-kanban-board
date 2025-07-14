import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUIStore = defineStore('ui', () => {
  // State
  const globalLoading = ref(false)
  const notifications = ref([])
  const sidebarOpen = ref(true)
  const theme = ref('light')
  
  // Settings
  const settings = ref({
    compactMode: false,
    showSwimlanes: false,
    autoSave: true,
    notifications: true
  })

  // Getters
  const activeNotifications = computed(() => 
    notifications.value.filter(n => n.active)
  )
  
  const unreadNotifications = computed(() => 
    notifications.value.filter(n => !n.read)
  )

  // Actions
  const showNotification = (notification) => {
    const id = Date.now() + Math.random()
    const newNotification = {
      id,
      timestamp: new Date().toISOString(),
      active: true,
      read: false,
      autoClose: true,
      duration: 5000,
      ...notification
    }
    
    notifications.value.unshift(newNotification)
    
    // Auto close if enabled
    if (newNotification.autoClose) {
      setTimeout(() => {
        closeNotification(id)
      }, newNotification.duration)
    }
    
    return id
  }

  const showSuccess = (message, options = {}) => {
    return showNotification({
      type: 'success',
      title: 'Success',
      message,
      color: 'success',
      icon: 'mdi-check-circle',
      ...options
    })
  }

  const showError = (message, options = {}) => {
    return showNotification({
      type: 'error',
      title: 'Error',
      message,
      color: 'error',
      icon: 'mdi-alert-circle',
      autoClose: false, // Errors should stay visible
      ...options
    })
  }

  const showWarning = (message, options = {}) => {
    return showNotification({
      type: 'warning',
      title: 'Warning',
      message,
      color: 'warning',
      icon: 'mdi-alert',
      duration: 7000,
      ...options
    })
  }

  const showInfo = (message, options = {}) => {
    return showNotification({
      type: 'info',
      title: 'Info',
      message,
      color: 'info',
      icon: 'mdi-information',
      ...options
    })
  }

  const closeNotification = (id) => {
    const index = notifications.value.findIndex(n => n.id === id)
    if (index !== -1) {
      notifications.value[index].active = false
      
      // Remove after animation
      setTimeout(() => {
        const currentIndex = notifications.value.findIndex(n => n.id === id)
        if (currentIndex !== -1) {
          notifications.value.splice(currentIndex, 1)
        }
      }, 300)
    }
  }

  const markNotificationRead = (id) => {
    const notification = notifications.value.find(n => n.id === id)
    if (notification) {
      notification.read = true
    }
  }

  const markAllNotificationsRead = () => {
    notifications.value.forEach(notification => {
      notification.read = true
    })
  }

  const clearAllNotifications = () => {
    notifications.value = []
  }

  const setGlobalLoading = (loading) => {
    globalLoading.value = loading
  }

  const toggleSidebar = () => {
    sidebarOpen.value = !sidebarOpen.value
    saveToStorage()
  }

  const setSidebarOpen = (open) => {
    sidebarOpen.value = open
    saveToStorage()
  }

  const setTheme = (newTheme) => {
    theme.value = newTheme
    saveToStorage()
  }

  const toggleTheme = () => {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
    saveToStorage()
  }

  const updateSettings = (newSettings) => {
    settings.value = { ...settings.value, ...newSettings }
    saveToStorage()
  }

  // Storage functions
  const saveToStorage = () => {
    if (typeof localStorage !== 'undefined') {
      try {
        const uiState = {
          sidebarOpen: sidebarOpen.value,
          theme: theme.value,
          settings: settings.value
        }
        localStorage.setItem('kanban-ui-state', JSON.stringify(uiState))
      } catch (e) {
        console.warn('Failed to save UI state to localStorage:', e)
      }
    }
  }

  const loadFromStorage = () => {
    if (typeof localStorage !== 'undefined') {
      try {
        const stored = localStorage.getItem('kanban-ui-state')
        if (stored) {
          const uiState = JSON.parse(stored)
          sidebarOpen.value = uiState.sidebarOpen ?? true
          theme.value = uiState.theme ?? 'light'
          settings.value = { ...settings.value, ...uiState.settings }
        }
      } catch (e) {
        console.warn('Failed to load UI state from localStorage:', e)
      }
    }
  }

  const initializeFromStorage = () => {
    loadFromStorage()
  }

  // Auto-save settings when they change
  const startAutoSave = () => {
    // This would be called if we had watchers, but we're keeping it simple
    // and saving manually after each change
  }

  return {
    // State
    globalLoading,
    notifications,
    sidebarOpen,
    theme,
    settings,
    
    // Getters
    activeNotifications,
    unreadNotifications,
    
    // Notification actions
    showNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    closeNotification,
    markNotificationRead,
    markAllNotificationsRead,
    clearAllNotifications,
    
    // UI actions
    setGlobalLoading,
    toggleSidebar,
    setSidebarOpen,
    setTheme,
    toggleTheme,
    updateSettings,
    
    // Storage
    saveToStorage,
    loadFromStorage,
    initializeFromStorage,
    startAutoSave
  }
})