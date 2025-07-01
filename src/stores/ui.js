import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUIStore = defineStore('ui', () => {
  // State
  const globalLoading = ref(false)
  const sidebarCollapsed = ref(false)
  const theme = ref('light')
  const locale = ref('en')
  const toasts = ref([])

  // Toast management
  let toastId = 0

  // Actions
  const setGlobalLoading = (loading) => {
    globalLoading.value = loading
  }

  const toggleSidebar = () => {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  const setSidebarCollapsed = (collapsed) => {
    sidebarCollapsed.value = collapsed
  }

  const setTheme = (newTheme) => {
    theme.value = newTheme
    // Save to localStorage
    localStorage.setItem('kanban-theme', newTheme)
  }

  const setLocale = (newLocale) => {
    locale.value = newLocale
    // Save to localStorage
    localStorage.setItem('kanban-locale', newLocale)
  }

  const showToast = ({ 
    message, 
    type = 'info', 
    duration = 5000, 
    persistent = false 
  }) => {
    const toast = {
      id: ++toastId,
      message,
      type,
      duration,
      persistent,
      timestamp: Date.now()
    }
    
    toasts.value.push(toast)
    
    if (!persistent && duration > 0) {
      setTimeout(() => {
        removeToast(toast.id)
      }, duration)
    }
    
    return toast.id
  }

  const removeToast = (id) => {
    const index = toasts.value.findIndex(toast => toast.id === id)
    if (index > -1) {
      toasts.value.splice(index, 1)
    }
  }

  const clearAllToasts = () => {
    toasts.value = []
  }

  // Toast helper methods
  const showSuccess = (message, options = {}) => {
    return showToast({ 
      message, 
      type: 'success', 
      ...options 
    })
  }

  const showError = (message, options = {}) => {
    return showToast({ 
      message, 
      type: 'error', 
      persistent: true,
      ...options 
    })
  }

  const showWarning = (message, options = {}) => {
    return showToast({ 
      message, 
      type: 'warning', 
      ...options 
    })
  }

  const showInfo = (message, options = {}) => {
    return showToast({ 
      message, 
      type: 'info', 
      ...options 
    })
  }

  // Initialize from localStorage
  const initializeFromStorage = () => {
    const savedTheme = localStorage.getItem('kanban-theme')
    const savedLocale = localStorage.getItem('kanban-locale')
    const savedSidebarState = localStorage.getItem('kanban-sidebar-collapsed')
    
    if (savedTheme) {
      theme.value = savedTheme
    }
    
    if (savedLocale) {
      locale.value = savedLocale
    }
    
    if (savedSidebarState !== null) {
      sidebarCollapsed.value = JSON.parse(savedSidebarState)
    }
  }

  return {
    // State
    globalLoading,
    sidebarCollapsed,
    theme,
    locale,
    toasts,
    
    // Actions
    setGlobalLoading,
    toggleSidebar,
    setSidebarCollapsed,
    setTheme,
    setLocale,
    showToast,
    removeToast,
    clearAllToasts,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    initializeFromStorage
  }
})