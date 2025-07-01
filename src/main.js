import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import pinia from './stores'
import vuetify from './plugins/vuetify'
import { useUIStore } from './stores/ui'

// Global styles
import './assets/styles/main.css'

const app = createApp(App)

// Install plugins
app.use(pinia)
app.use(router)
app.use(vuetify)

// Initialize UI store from localStorage
const uiStore = useUIStore()
uiStore.initializeFromStorage()

// Mount app
app.mount('#app')