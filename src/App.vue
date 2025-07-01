<template>
  <v-app>
    <AppSidebar v-model:drawer="drawer" />
    
    <AppTopbar @toggle-drawer="toggleDrawer" />
    
    <v-main class="main-content">
      <v-container fluid class="pa-4">
        <router-view />
      </v-container>
    </v-main>
    
    <!-- Global Loading Overlay -->
    <v-overlay 
      v-model="globalLoading" 
      class="align-center justify-center"
      persistent
    >
      <v-progress-circular
        color="primary"
        indeterminate
        size="64"
      />
    </v-overlay>
  </v-app>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useDisplay } from 'vuetify'
import AppSidebar from '@/components/common/AppSidebar.vue'
import AppTopbar from '@/components/common/AppTopbar.vue'
import { useUIStore } from '@/stores/ui'

const { mobile } = useDisplay()
const uiStore = useUIStore()

// Drawer state
const drawer = ref(!mobile.value)

// Global loading state
const globalLoading = computed(() => uiStore.globalLoading)

// Methods
const toggleDrawer = () => {
  drawer.value = !drawer.value
}

// Watch for mobile changes
watch(() => mobile.value, (isMobile) => {
  drawer.value = !isMobile
})
</script>

<style scoped>
.main-content {
  background-color: rgb(var(--v-theme-background));
  min-height: 100vh;
}

:deep(.v-navigation-drawer) {
  border-right: 1px solid rgb(var(--v-theme-surface-variant));
}

:deep(.v-app-bar) {
  border-bottom: 1px solid rgb(var(--v-theme-surface-variant));
}
</style>