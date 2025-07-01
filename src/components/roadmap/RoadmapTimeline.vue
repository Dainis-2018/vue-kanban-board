<template>
  <div 
    ref="timelineContainer" 
    class="roadmap-timeline"
    :class="{ 'timeline-gantt': viewMode === 'gantt' }"
  >
    <!-- Timeline will be mounted here -->
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { Timeline } from 'vis-timeline/standalone'
import { DataSet } from 'vis-data'

// Props
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

// Emits
const emit = defineEmits([
  'item-moved',
  'item-updated', 
  'item-selected',
  'item-double-click',
  'group-selected',
  'range-changed',
  'click'
])

// Refs
const timelineContainer = ref(null)
let timeline = null
let itemsDataSet = null
let groupsDataSet = null

// Initialize timeline
const initializeTimeline = () => {
  if (!timelineContainer.value) return

  // Create datasets
  itemsDataSet = new DataSet(props.items)
  groupsDataSet = props.groups ? new DataSet(props.groups) : null

  // Default options
  const defaultOptions = {
    stack: true,
    showCurrentTime: true,
    zoomable: true,
    moveable: true,
    selectable: true,
    multiselect: false,
    editable: {
      updateTime: true,
      updateGroup: !!groupsDataSet,
      add: false,
      remove: false
    },
    orientation: 'top',
    margin: {
      item: 10,
      axis: 5
    },
    tooltip: {
      followMouse: true,
      overflowMethod: 'cap'
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
    ...getViewModeOptions(),
    ...props.options
  }

  // Create timeline instance
  try {
    timeline = new Timeline(
      timelineContainer.value,
      itemsDataSet,
      groupsDataSet,
      defaultOptions
    )

    // Set up event listeners
    setupEventListeners()

    // Apply custom styles
    applyCustomStyles()

  } catch (error) {
    console.error('Failed to initialize timeline:', error)
  }
}

// Get view mode specific options
const getViewModeOptions = () => {
  if (props.viewMode === 'gantt') {
    return {
      stack: false,
      orientation: 'top',
      margin: {
        item: 2,
        axis: 5
      },
      template: (item) => {
        const progress = getItemProgress(item.id)
        return `
          <div class="gantt-item" style="background: ${item.style?.split(':')[1] || '#1976D2'}">
            <div class="gantt-progress" style="width: ${progress}%"></div>
            <span class="gantt-label">${item.content}</span>
          </div>
        `
      }
    }
  }
  
  return {
    stack: true,
    template: (item) => {
      const progress = getItemProgress(item.id)
      const progressBar = progress > 0 ? 
        `<div class="timeline-progress">
          <div class="progress-bar" style="width: ${progress}%"></div>
        </div>` : ''
      
      return `
        <div class="timeline-item">
          <div class="item-content">
            <strong>${item.content}</strong>
            ${item.title ? `<br><small>${item.title}</small>` : ''}
          </div>
          ${progressBar}
        </div>
      `
    }
  }
}

// Get item progress (mock function - replace with real logic)
const getItemProgress = (itemId) => {
  const item = props.items.find(i => i.id === itemId)
  if (!item?.data?.taskIds?.length) return 0
  
  // This would need to calculate based on linked tasks
  // For now, return random progress for demo
  return Math.floor(Math.random() * 100)
}

// Setup event listeners
const setupEventListeners = () => {
  if (!timeline) return

  // Item moved/updated
  timeline.on('changed', (properties) => {
    if (properties.items && properties.items.length > 0) {
      properties.items.forEach(itemId => {
        const item = itemsDataSet.get(itemId)
        if (item) {
          emit('item-moved', item, (error) => {
            if (error) {
              // Revert changes on error
              itemsDataSet.update(props.items.find(i => i.id === itemId))
            }
          })
        }
      })
    }
  })

  // Item selection
  timeline.on('select', (selection) => {
    if (selection.items.length > 0) {
      const itemId = selection.items[0]
      const item = itemsDataSet.get(itemId)
      if (item) {
        emit('item-selected', item)
      }
    }
  })

  // Item double click
  timeline.on('doubleClick', (properties) => {
    if (properties.item) {
      const item = itemsDataSet.get(properties.item)
      if (item) {
        emit('item-double-click', item)
      }
    } else {
      emit('click', properties)
    }
  })

  // Group selection
  timeline.on('groupSelected', (properties) => {
    emit('group-selected', properties.group)
  })

  // Range changed
  timeline.on('rangechanged', (properties) => {
    emit('range-changed', {
      start: properties.start,
      end: properties.end,
      byUser: properties.byUser
    })
  })

  // Context menu (right click)
  timeline.on('contextmenu', (properties) => {
    properties.event.preventDefault()
    
    if (properties.item) {
      const item = itemsDataSet.get(properties.item)
      showContextMenu(properties.event, item)
    }
  })
}

// Show context menu
const showContextMenu = (event, item) => {
  // Create custom context menu
  const menu = document.createElement('div')
  menu.className = 'timeline-context-menu'
  menu.style.position = 'fixed'
  menu.style.left = event.clientX + 'px'
  menu.style.top = event.clientY + 'px'
  menu.style.background = 'white'
  menu.style.border = '1px solid #ccc'
  menu.style.borderRadius = '4px'
  menu.style.padding = '8px 0'
  menu.style.zIndex = '9999'
  menu.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)'

  const menuItems = [
    { label: 'Edit Milestone', action: () => emit('item-double-click', item) },
    { label: 'Duplicate', action: () => duplicateItem(item) },
    { label: 'Delete', action: () => deleteItem(item) }
  ]

  menuItems.forEach(menuItem => {
    const item = document.createElement('div')
    item.textContent = menuItem.label
    item.style.padding = '8px 16px'
    item.style.cursor = 'pointer'
    item.style.fontSize = '14px'
    
    item.addEventListener('mouseover', () => {
      item.style.background = '#f5f5f5'
    })
    
    item.addEventListener('mouseout', () => {
      item.style.background = 'white'
    })
    
    item.addEventListener('click', () => {
      menuItem.action()
      document.body.removeChild(menu)
    })
    
    menu.appendChild(item)
  })

  document.body.appendChild(menu)

  // Remove menu on outside click
  const removeMenu = (e) => {
    if (!menu.contains(e.target)) {
      document.body.removeChild(menu)
      document.removeEventListener('click', removeMenu)
    }
  }

  setTimeout(() => {
    document.addEventListener('click', removeMenu)
  }, 100)
}

// Apply custom styles
const applyCustomStyles = () => {
  if (!timeline) return

  // Add custom CSS
  const style = document.createElement('style')
  style.textContent = `
    .vis-timeline {
      font-family: 'Roboto', sans-serif;
      border: none;
    }
    
    .vis-panel.vis-top,
    .vis-panel.vis-bottom {
      border: none;
    }
    
    .vis-time-axis {
      border-top: 1px solid #e0e0e0;
    }
    
    .vis-item {
      border-radius: 6px;
      border-width: 0;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      transition: all 0.2s ease;
    }
    
    .vis-item:hover {
      box-shadow: 0 4px 8px rgba(0,0,0,0.15);
      transform: translateY(-1px);
    }
    
    .vis-item.vis-selected {
      box-shadow: 0 4px 12px rgba(25, 118, 210, 0.3);
      border: 2px solid #1976d2;
    }
    
    .timeline-item {
      padding: 8px 12px;
      color: white;
      font-weight: 500;
    }
    
    .item-content {
      margin-bottom: 4px;
    }
    
    .timeline-progress {
      background: rgba(255,255,255,0.3);
      height: 4px;
      border-radius: 2px;
      overflow: hidden;
    }
    
    .progress-bar {
      background: rgba(255,255,255,0.8);
      height: 100%;
      transition: width 0.3s ease;
    }
    
    .gantt-item {
      position: relative;
      height: 100%;
      border-radius: 4px;
      overflow: hidden;
      display: flex;
      align-items: center;
      padding: 0 8px;
    }
    
    .gantt-progress {
      position: absolute;
      left: 0;
      top: 0;
      height: 100%;
      background: rgba(255,255,255,0.3);
      transition: width 0.3s ease;
    }
    
    .gantt-label {
      position: relative;
      z-index: 1;
      color: white;
      font-weight: 500;
      font-size: 12px;
    }
    
    .milestone-milestone {
      background: linear-gradient(135deg, #1976d2, #1565c0);
    }
    
    .milestone-task {
      background: linear-gradient(135deg, #388e3c, #2e7d32);
    }
    
    .milestone-release {
      background: linear-gradient(135deg, #f57c00, #ef6c00);
    }
    
    .vis-current-time {
      background-color: #e53935;
      width: 2px;
    }
    
    .vis-custom-time {
      background-color: #1976d2;
      width: 2px;
    }
  `
  
  if (!document.querySelector('#timeline-styles')) {
    style.id = 'timeline-styles'
    document.head.appendChild(style)
  }
}

// Public methods
const setWindow = (start, end) => {
  if (timeline) {
    timeline.setWindow(start, end)
  }
}

const fit = () => {
  if (timeline) {
    timeline.fit()
  }
}

const focus = (itemId) => {
  if (timeline) {
    timeline.focus(itemId)
  }
}

const setSelection = (itemIds) => {
  if (timeline) {
    timeline.setSelection(itemIds)
  }
}

const getSelection = () => {
  return timeline ? timeline.getSelection() : []
}

const redraw = () => {
  if (timeline) {
    timeline.redraw()
  }
}

// Helper methods
const duplicateItem = (item) => {
  const newItem = {
    ...item,
    id: `${item.id}-copy-${Date.now()}`,
    content: `${item.content} (Copy)`,
    start: new Date(new Date(item.start).getTime() + 7 * 24 * 60 * 60 * 1000), // +1 week
    end: new Date(new Date(item.end).getTime() + 7 * 24 * 60 * 60 * 1000)
  }
  
  emit('item-updated', newItem)
}

const deleteItem = (item) => {
  if (confirm(`Are you sure you want to delete "${item.content}"?`)) {
    emit('item-updated', { ...item, _delete: true })
  }
}

// Watchers
watch(() => props.items, (newItems) => {
  if (itemsDataSet) {
    itemsDataSet.clear()
    itemsDataSet.add(newItems)
  }
}, { deep: true })

watch(() => props.groups, (newGroups) => {
  if (groupsDataSet && newGroups) {
    groupsDataSet.clear()
    groupsDataSet.add(newGroups)
  } else if (timeline && newGroups) {
    groupsDataSet = new DataSet(newGroups)
    timeline.setGroups(groupsDataSet)
  }
}, { deep: true })

watch(() => props.options, (newOptions) => {
  if (timeline) {
    timeline.setOptions({
      ...getViewModeOptions(),
      ...newOptions
    })
  }
}, { deep: true })

watch(() => props.viewMode, () => {
  if (timeline) {
    timeline.setOptions(getViewModeOptions())
    nextTick(() => {
      timeline.redraw()
    })
  }
})

// Lifecycle
onMounted(() => {
  nextTick(() => {
    initializeTimeline()
  })
})

onBeforeUnmount(() => {
  if (timeline) {
    timeline.destroy()
    timeline = null
  }
  
  // Remove custom styles
  const styleElement = document.querySelector('#timeline-styles')
  if (styleElement) {
    document.head.removeChild(styleElement)
  }
})

// Expose public methods
defineExpose({
  setWindow,
  fit,
  focus,
  setSelection,
  getSelection,
  redraw
})
</script>

<style scoped>
.roadmap-timeline {
  width: 100%;
  height: 100%;
  position: relative;
  background: #fafafa;
  border-radius: 8px;
  overflow: hidden;
}

.timeline-gantt {
  background: #f5f5f5;
}

/* Context menu styles are added dynamically */
:deep(.vis-timeline) {
  border-radius: 8px;
  overflow: hidden;
}

:deep(.vis-panel) {
  border-radius: 0;
}

:deep(.vis-labelset) {
  border-right: 1px solid #e0e0e0;
}

:deep(.vis-itemset) {
  background: transparent;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .roadmap-timeline {
    font-size: 12px;
  }
  
  :deep(.vis-item) {
    min-height: 20px;
  }
  
  :deep(.timeline-item) {
    padding: 4px 8px;
  }
  
  :deep(.gantt-label) {
    font-size: 10px;
  }
}
</style>