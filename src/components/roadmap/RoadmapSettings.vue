<template>
  <v-card min-width="280">
    <v-card-title class="text-h6">Roadmap Settings</v-card-title>
    <v-divider />
    
    <v-card-text class="pa-4">
      <!-- Display Options -->
      <div class="mb-4">
        <h4 class="text-subtitle-2 mb-2">Display Options</h4>
        
        <v-switch
          :model-value="showTasks"
          @update:model-value="$emit('update:show-tasks', $event)"
          label="Show Linked Tasks"
          density="compact"
          hide-details
          class="mb-2"
        />
        
        <v-switch
          :model-value="showDependencies"
          @update:model-value="$emit('update:show-dependencies', $event)"
          label="Show Dependencies"
          density="compact"
          hide-details
          class="mb-2"
        />
        
        <v-switch
          v-model="showProgress"
          label="Show Progress Bars"
          density="compact"
          hide-details
          class="mb-2"
        />
        
        <v-switch
          v-model="showCurrentTime"
          label="Show Current Time"
          density="compact"
          hide-details
        />
      </div>
      
      <!-- Grouping Options -->
      <div class="mb-4">
        <h4 class="text-subtitle-2 mb-2">Grouping</h4>
        
        <v-select
          :model-value="groupBy"
          @update:model-value="$emit('update:group-by', $event)"
          :items="groupOptions"
          label="Group By"
          variant="outlined"
          density="compact"
          hide-details
        />
      </div>
      
      <!-- Time Range -->
      <div class="mb-4">
        <h4 class="text-subtitle-2 mb-2">Time Range</h4>
        
        <v-btn-toggle
          v-model="selectedTimeRange"
          variant="outlined"
          size="small"
          mandatory
          class="mb-3"
        >
          <v-btn value="quarter">Quarter</v-btn>
          <v-btn value="year">Year</v-btn>
          <v-btn value="custom">Custom</v-btn>
        </v-btn-toggle>
        
        <div v-if="selectedTimeRange === 'custom'" class="custom-range">
          <v-text-field
            v-model="customStartDate"
            label="Start Date"
            type="date"
            variant="outlined"
            density="compact"
            hide-details
            class="mb-2"
          />
          
          <v-text-field
            v-model="customEndDate"
            label="End Date"
            type="date"
            variant="outlined"
            density="compact"
            hide-details
          />
        </div>
      </div>
      
      <!-- Export Options -->
      <div class="mb-4">
        <h4 class="text-subtitle-2 mb-2">Export</h4>
        
        <div class="d-flex flex-column ga-2">
          <v-btn
            variant="outlined"
            size="small"
            prepend-icon="mdi-file-image"
            @click="$emit('export', 'png')"
            block
          >
            Export as PNG
          </v-btn>
          
          <v-btn
            variant="outlined"
            size="small"
            prepend-icon="mdi-file-pdf-box"
            @click="$emit('export', 'pdf')"
            block
          >
            Export as PDF
          </v-btn>
          
          <v-btn
            variant="outlined"
            size="small"
            prepend-icon="mdi-microsoft-excel"
            @click="$emit('export', 'excel')"
            block
          >
            Export to Excel
          </v-btn>
        </div>
      </div>
      
      <!-- Zoom Controls -->
      <div class="mb-4">
        <h4 class="text-subtitle-2 mb-2">Zoom</h4>
        
        <div class="d-flex align-center ga-2">
          <v-btn
            icon="mdi-minus"
            variant="outlined"
            size="small"
            @click="$emit('zoom', 'out')"
          />
          
          <v-slider
            v-model="zoomLevel"
            min="25"
            max="200"
            step="25"
            hide-details
            class="flex-grow-1"
            @update:model-value="$emit('zoom', $event)"
          >
            <template #append>
              <span class="text-caption">{{ zoomLevel }}%</span>
            </template>
          </v-slider>
          
          <v-btn
            icon="mdi-plus"
            variant="outlined"
            size="small"
            @click="$emit('zoom', 'in')"
          />
        </div>
        
        <div class="d-flex ga-2 mt-2">
          <v-btn
            variant="text"
            size="x-small"
            @click="$emit('zoom', 'fit')"
          >
            Fit to Screen
          </v-btn>
          
          <v-btn
            variant="text"
            size="x-small"
            @click="zoomLevel = 100; $emit('zoom', 100)"
          >
            Reset (100%)
          </v-btn>
        </div>
      </div>
      
      <!-- View Presets -->
      <div>
        <h4 class="text-subtitle-2 mb-2">Quick Views</h4>
        
        <div class="d-flex flex-column ga-2">
          <v-btn
            variant="outlined"
            size="small"
            prepend-icon="mdi-calendar-today"
            @click="setQuickView('current')"
            block
          >
            Current Sprint
          </v-btn>
          
          <v-btn
            variant="outlined"
            size="small"
            prepend-icon="mdi-calendar-month"
            @click="setQuickView('quarter')"
            block
          >
            Current Quarter
          </v-btn>
          
          <v-btn
            variant="outlined"
            size="small"
            prepend-icon="mdi-calendar-range"
            @click="setQuickView('year')"
            block
          >
            Full Year
          </v-btn>
          
          <v-btn
            variant="outlined"
            size="small"
            prepend-icon="mdi-eye"
            @click="setQuickView('all')"
            block
          >
            Show All
          </v-btn>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref } from 'vue'

// Props
const props = defineProps({
  showTasks: {
    type: Boolean,
    default: true
  },
  showDependencies: {
    type: Boolean,
    default: false
  },
  groupBy: {
    type: String,
    default: 'none'
  }
})

// Emits
const emit = defineEmits([
  'update:show-tasks',
  'update:show-dependencies', 
  'update:group-by',
  'export',
  'zoom',
  'view-changed'
])

// Local state
const showProgress = ref(true)
const showCurrentTime = ref(true)
const selectedTimeRange = ref('quarter')
const customStartDate = ref('')
const customEndDate = ref('')
const zoomLevel = ref(100)

// Options
const groupOptions = [
  { title: 'None', value: 'none' },
  { title: 'By Type', value: 'type' },
  { title: 'By Team', value: 'team' },
  { title: 'By Priority', value: 'priority' }
]

// Methods
const setQuickView = (view) => {
  const now = new Date()
  let start, end
  
  switch (view) {
    case 'current':
      // Current 2-week sprint
      start = new Date(now)
      start.setDate(now.getDate() - now.getDay()) // Start of week
      end = new Date(start)
      end.setDate(start.getDate() + 14)
      break
      
    case 'quarter':
      // Current quarter
      const quarter = Math.floor(now.getMonth() / 3)
      start = new Date(now.getFullYear(), quarter * 3, 1)
      end = new Date(now.getFullYear(), quarter * 3 + 3, 0)
      break
      
    case 'year':
      // Full year
      start = new Date(now.getFullYear(), 0, 1)
      end = new Date(now.getFullYear(), 11, 31)
      break
      
    case 'all':
      // Show all milestones
      start = null
      end = null
      break
      
    default:
      return
  }
  
  emit('view-changed', { view, start, end })
}
</script>

<style scoped>
.custom-range {
  margin-top: 8px;
}

:deep(.v-slider) {
  margin: 0 8px;
}

:deep(.v-btn-toggle .v-btn) {
  font-size: 0.75rem;
}

@media (max-width: 600px) {
  .v-card {
    margin: 8px;
    min-width: calc(100vw - 32px);
  }
}
</style>