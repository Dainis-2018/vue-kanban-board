// src/stores/ui.js
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUIStore = defineStore('ui', () => {
  // State
  const loading = ref(false)
  const notifications = ref([])
  const sidebarOpen = ref(true)
  const theme = ref('light')

  // Actions
  const showSuccess = (message, timeout = 5000) => {
    const notification = {
      id: Date.now(),
      type: 'success',
      message,
      timeout
    }
    notifications.value.push(notification)
    
    if (timeout > 0) {
      setTimeout(() => {
        removeNotification(notification.id)
      }, timeout)
    }
    
    return notification.id
  }

  const showError = (message, timeout = 8000) => {
    const notification = {
      id: Date.now(),
      type: 'error',
      message,
      timeout
    }
    notifications.value.push(notification)
    
    if (timeout > 0) {
      setTimeout(() => {
        removeNotification(notification.id)
      }, timeout)
    }
    
    return notification.id
  }

  const showWarning = (message, timeout = 6000) => {
    const notification = {
      id: Date.now(),
      type: 'warning',
      message,
      timeout
    }
    notifications.value.push(notification)
    
    if (timeout > 0) {
      setTimeout(() => {
        removeNotification(notification.id)
      }, timeout)
    }
    
    return notification.id
  }

  const showInfo = (message, timeout = 5000) => {
    const notification = {
      id: Date.now(),
      type: 'info',
      message,
      timeout
    }
    notifications.value.push(notification)
    
    if (timeout > 0) {
      setTimeout(() => {
        removeNotification(notification.id)
      }, timeout)
    }
    
    return notification.id
  }

  const removeNotification = (id) => {
    const index = notifications.value.findIndex(n => n.id === id)
    if (index !== -1) {
      notifications.value.splice(index, 1)
    }
  }

  const clearAllNotifications = () => {
    notifications.value = []
  }

  const setLoading = (isLoading) => {
    loading.value = isLoading
  }

  const toggleSidebar = () => {
    sidebarOpen.value = !sidebarOpen.value
  }

  const setSidebarOpen = (isOpen) => {
    sidebarOpen.value = isOpen
  }

  const setTheme = (newTheme) => {
    theme.value = newTheme
    // Apply theme to document
    document.documentElement.setAttribute('data-theme', newTheme)
  }

  const toggleTheme = () => {
    const newTheme = theme.value === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
  }

  return {
    // State
    loading,
    notifications,
    sidebarOpen,
    theme,

    // Actions
    showSuccess,
    showError,
    showWarning,
    showInfo,
    removeNotification,
    clearAllNotifications,
    setLoading,
    toggleSidebar,
    setSidebarOpen,
    setTheme,
    toggleTheme
  }
})