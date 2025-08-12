<template>
  <div class="roadmap-timeline">
    <div v-if="loading" class="d-flex justify-center align-center" style="height: 400px;">
      <v-progress-circular indeterminate color="primary" />
    </div>
    <div v-else-if="!items || items.length === 0" class="d-flex justify-center align-center" style="height: 400px;">
      <div class="text-center">
        <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-timeline-outline</v-icon>
        <h3 class="text-h6 mb-2">No roadmap items</h3>
        <p class="text-body-2 text-medium-emphasis">Add milestones and releases to see them on the timeline</p>
      </div>
    </div>
    <div v-else-if="!visLibraryAvailable" class="d-flex justify-center align-center" style="height: 400px;">
      <div class="text-center">
        <v-icon size="64" color="error" class="mb-4">mdi-alert-circle</v-icon>
        <h3 class="text-h6 mb-2">Timeline Library Not Available</h3>
        <p class="text-body-2 text-medium-emphasis">vis-timeline dependency failed to load</p>
      </div>
    </div>
    <div v-else ref="timelineContainer" class="timeline-container"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick, computed } from 'vue'

const props = defineProps({
  items: {
    type: Array,
    default: () => []
  },
  groups: {
    type: Array,
    default: null
  },
  options: {
    type: Object,
    default: () => ({})
  },
  viewMode: {
    type: String,
    default: 'timeline'
  }
})

const emit = defineEmits([
  'item-select', 
  'item-update', 
  'item-moved', 
  'item-updated', 
  'item-selected', 
  'item-double-click',
  'group-selected'
])

const timelineContainer = ref(null)
const loading = ref(false)
const visLibraryAvailable = ref(false)
let timeline = null
let DataSet = null
let Timeline = null

// Load vis-timeline library dynamically
const loadVisTimeline = async () => {
  try {
    console.log('Loading vis-timeline library...')
    const vis = await import('vis-timeline/standalone')
    DataSet = vis.DataSet
    Timeline = vis.Timeline
    visLibraryAvailable.value = true
    console.log('vis-timeline loaded successfully')
    return true
  } catch (error) {
    console.error('Failed to load vis-timeline:', error)
    visLibraryAvailable.value = false
    return false
  }
}

// Helper functions
const getItemStyle = (item) => {
  const colors = {
    'inprogress': '#2196F3',
    'completed': '#4CAF50', 
    'planning': '#FF9800',
    'overdue': '#F44336',
    'on-hold': '#9E9E9E'
  }
  
  const color = colors[item.status] || '#2196F3'
  const opacity = item.status === 'completed' ? 0.8 : 1
  
  return `background-color: ${color}; border-color: ${color}; opacity: ${opacity};`
}

const getItemGroup = (item) => {
  if (!props.groups) return undefined
  
  // Return the group from the item itself
  return item.group || undefined
}

// Computed properties
const timelineItems = computed(() => {
  console.log('Computing timeline items from props:', props.items)
  
  if (!props.items || props.items.length === 0) {
    console.log('No items provided to timeline')
    return []
  }
  
  const validItems = props.items
    .map(item => {
      console.log('Processing item:', item)
      
      // Convert the data format from sample data to vis-timeline format
      const startDate = new Date(item.startDate || item.start)
      const endDate = new Date(item.endDate || item.end)
      
      // Validate dates
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        console.warn('Invalid dates for item:', item, {
          startDate: item.startDate || item.start,
          endDate: item.endDate || item.end,
          parsedStart: startDate,
          parsedEnd: endDate
        })
        return null
      }

      const timelineItem = {
        id: item.id,
        content: item.content || item.title || 'Untitled',
        start: startDate,
        end: endDate,
        type: 'range',
        className: item.className || `milestone-${item.status || 'default'}`,
        style: item.style || getItemStyle(item),
        title: item.title || `${item.title || 'Untitled'}\nProgress: ${item.progress || 0}%\nStatus: ${item.status || 'unknown'}`,
        group: getItemGroup(item)
      }
      
      console.log('Created timeline item:', timelineItem)
      return timelineItem
    })
    .filter(item => item !== null) // Remove invalid items
    
  console.log('Final timeline items:', validItems)
  return validItems
})

const defaultTimelineOptions = computed(() => ({
  height: props.options.height || '400px',
  stack: true,
  stackSubgroups: true, // Enable stacking within subgroups
  showCurrentTime: true,
  zoomable: true,
  moveable: true,
  selectable: true,
  multiselect: false,
  editable: {
    updateTime: true,
    updateGroup: !!props.groups,
    add: false,
    remove: false
  },
  orientation: 'top',
  margin: {
    item: {
      horizontal: 10,
      vertical: 5 // Smaller vertical margin
    },
    axis: 5
  },
  format: {
    minorLabels: {
      millisecond: 'SSS',
      second: 's',
      minute: 'HH:mm',
      hour: 'HH:mm',
      weekday: 'ddd D',
      day: 'D',
      week: 'w',
      month: 'MMM',
      year: 'YYYY'
    },
    majorLabels: {
      millisecond: 'HH:mm:ss',
      second: 'D MMMM HH:mm',
      minute: 'ddd D MMMM',
      hour: 'ddd D MMMM',
      weekday: 'MMMM YYYY',
      day: 'MMMM YYYY',
      week: 'MMMM YYYY',
      month: 'YYYY',
      year: ''
    }
  },
  zoomKey: 'ctrlKey',
  groupOrder: 'order',
  showMajorLabels: true,
  showMinorLabels: true,
  // Prevent overlapping
  itemsAlwaysDraggable: false,
  verticalScroll: true,
  maxHeight: props.options.height || '400px',
  ...props.options
}))

const initializeTimeline = async () => {
  console.log('Initializing timeline...')
  
  if (!timelineContainer.value) {
    console.error('Timeline container not available')
    return
  }
  
  if (!DataSet || !Timeline) {
    console.error('vis-timeline classes not available')
    return
  }
  
  if (timelineItems.value.length === 0) {
    console.log('No timeline items to display')
    return
  }

  loading.value = true

  try {
    // Destroy existing timeline
    if (timeline) {
      timeline.destroy()
      timeline = null
    }

    // Create datasets
    const items = new DataSet(timelineItems.value)
    const groups = props.groups ? new DataSet(props.groups) : null

    console.log('Creating timeline with items:', timelineItems.value)
    console.log('Groups:', groups ? groups.get() : 'no groups')

    // Create timeline - IMPORTANT: Don't add groups to options, pass as separate parameter
    const finalOptions = defaultTimelineOptions.value
    
    // Create timeline with correct parameters
    if (groups) {
      timeline = new Timeline(timelineContainer.value, items, groups, finalOptions)
    } else {
      timeline = new Timeline(timelineContainer.value, items, finalOptions)
    }

    console.log('Timeline created successfully')

    // Set up event listeners
    timeline.on('select', (event) => {
      console.log('Timeline select event:', event)
      if (event.items && event.items.length > 0) {
        const selectedItemId = event.items[0]
        const selectedItem = props.items.find(item => item.id === selectedItemId || `task-${item.id}` === selectedItemId)
        if (selectedItem) {
          emit('item-selected', selectedItem)
          emit('item-select', selectedItem) // Backward compatibility
        }
      }
    })

    timeline.on('doubleClick', (event) => {
      console.log('Timeline double click event:', event)
      if (event.item) {
        const selectedItem = props.items.find(item => item.id === event.item || `task-${item.id}` === event.item)
        if (selectedItem) {
          emit('item-double-click', selectedItem)
        }
      }
    })

    timeline.on('itemover', (event) => {
      // Show tooltip on hover - can be enhanced later
      console.log('Timeline item hover:', event)
    })

    timeline.on('rangechanged', (event) => {
      // Handle time range changes if needed
      console.log('Timeline range changed:', event)
    })

    // Handle item movements - use the correct vis-timeline events
    timeline.on('timechange', (properties) => {
      console.log('Timeline time change event:', properties)
      try {
        if (properties && properties.id) {
          const updatedItem = items.get(properties.id)
          const originalItem = props.items.find(item => item.id === properties.id)
          
          if (updatedItem && originalItem) {
            emit('item-moved', properties.id, updatedItem.start, updatedItem.end)
          }
        }
      } catch (error) {
        console.error('Error handling timechange event:', error)
      }
    })

    // Fit timeline to data if we have items
    if (timelineItems.value.length > 0) {
      setTimeout(() => {
        try {
          timeline.fit()
          console.log('Timeline fitted to data')
        } catch (error) {
          console.error('Error fitting timeline:', error)
        }
      }, 100)
    }

  } catch (error) {
    console.error('Error initializing timeline:', error)
  } finally {
    loading.value = false
  }
}

const destroyTimeline = () => {
  if (timeline) {
    console.log('Destroying timeline')
    timeline.destroy()
    timeline = null
  }
}

const refreshTimeline = async () => {
  console.log('Refreshing timeline')
  destroyTimeline()
  await nextTick()
  if (visLibraryAvailable.value && timelineItems.value.length > 0) {
    await initializeTimeline()
  }
}

// Lifecycle
onMounted(async () => {
  console.log('RoadmapTimeline mounted')
  
  // Load vis-timeline library
  const loaded = await loadVisTimeline()
  
  if (loaded) {
    // Initialize timeline after library is loaded
    await nextTick()
    await initializeTimeline()
  }
})

// Watch for changes
watch(() => props.items, async (newItems, oldItems) => {
  console.log('Items changed:', { newItems, oldItems })
  
  if (!visLibraryAvailable.value) {
    console.log('vis-timeline not available, skipping update')
    return
  }
  
  if (timeline && timelineItems.value.length > 0) {
    // Update existing timeline instead of recreating
    try {
      const items = new DataSet(timelineItems.value)
      timeline.setItems(items)
      
      // Update groups if they exist
      if (props.groups) {
        const groups = new DataSet(props.groups)
        timeline.setGroups(groups)
      }
      
      // Fit timeline after a short delay
      setTimeout(() => {
        try {
          timeline.fit()
        } catch (error) {
          console.error('Error fitting timeline after update:', error)
        }
      }, 100)
    } catch (error) {
      console.error('Error updating timeline items:', error)
      await refreshTimeline()
    }
  } else if (!timeline && timelineItems.value.length > 0) {
    await initializeTimeline()
  }
}, { deep: true })

watch(() => props.groups, async () => {
  console.log('Groups changed')
  if (timeline) {
    await refreshTimeline()
  }
}, { deep: true })

watch(() => props.options, () => {
  console.log('Options changed')
  if (timeline) {
    try {
      timeline.setOptions(defaultTimelineOptions.value)
    } catch (error) {
      console.error('Error updating timeline options:', error)
    }
  }
}, { deep: true })

// Expose methods for parent component
defineExpose({
  refreshTimeline,
  setWindow: (start, end) => {
    if (timeline) {
      try {
        timeline.setWindow(start, end)
      } catch (error) {
        console.error('Error setting timeline window:', error)
      }
    }
  },
  fit: () => {
    if (timeline) {
      try {
        timeline.fit()
      } catch (error) {
        console.error('Error fitting timeline:', error)
      }
    }
  }
})
</script>

<style scoped>
.timeline-container {
  width: 100%;
  height: 100%;
}

.roadmap-timeline {
  width: 100%;
  height: 100%;
}
</style>