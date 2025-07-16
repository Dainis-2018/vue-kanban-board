<template>
  <div class="roadmap-timeline">
    <div ref="timelineContainer" class="timeline-container"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from 'vue'
import { DataSet, Timeline } from 'vis-timeline/standalone'

const props = defineProps({
  items: Array,
  timeRange: String,
  showDependencies: Boolean
})

const emit = defineEmits(['item-select', 'item-update'])

const timelineContainer = ref(null)
let timeline = null

const initializeTimeline = () => {
  if (!timelineContainer.value) return

  // Function to safely convert date strings to Date objects
  const safeDate = (dateString) => {
    try {
      return dateString ? new Date(dateString) : null;
    } catch (e) {
      console.warn('Invalid date:', dateString, e);
      return null;
    }
  }

  const items = new DataSet(
    props.items.map(item => ({
      id: item.id,content: item.title,
      content: item.title || 'No Title',
      start: safeDate(item.startDate), // Use safeDate for start
          // Use the safeDate function for conversion
      color: item.color || '#2196f3', // Use a default color
      end: safeDate(item.endDate),
      type: 'range',
      className: `milestone-${item.status}`,
      style: `background-color: ${item.color}; border-color: ${item.color};` // Use template literals
    })).filter(item => {
      const isValid = item && item.start && item.end;
      if (!isValid) console.log("Filtered out item due to invalid date:", item);
      return isValid;
    })

  )

  const options = {
    editable: true,
    margin: { item: 10, axis: 5 },
    orientation: 'top',
    zoomable: true,
    moveable: true,
    template: (item) => {
      const milestone = props.items.find(m => m.id === item.id)
      return `
        <div class="timeline-item">
          <div class="timeline-title">${item.content}</div>
          <div class="timeline-progress">${milestone?.progress || 0}%</div>
        </div>
      `
    }
  }

  timeline = new Timeline(timelineContainer.value, items, options)

  timeline.on('select', (event) => {
    if (event.items.length > 0) {
      const selectedItem = props.items.find(item => item.id === event.items[0])
      emit('item-select', selectedItem)
    }
  })

  timeline.on('itemover', (event) => {
    // Show tooltip on hover
  })
}

onMounted(() => {
  nextTick(() => {
    initializeTimeline()
  })
})

watch(() => props.items, () => {
  if (timeline) {
    timeline.destroy()
    initializeTimeline()
  }
}, { deep: true })
</script>

<style scoped>
.roadmap-timeline {
  height: 400px;
  width: 100%;
}

.timeline-container {
  height: 100%;
  width: 100%;
}

:deep(.vis-timeline) {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
}

:deep(.milestone-in-progress) {
  opacity: 0.8;
}

:deep(.milestone-completed) {
  opacity: 1;
}

:deep(.milestone-planned) {
  opacity: 0.6;
}
</style>