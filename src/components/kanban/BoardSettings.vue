<template>
  <v-card min-width="300">
    <v-card-title class="text-h6">Board Settings</v-card-title>
    <v-divider />
    <v-card-text>
      <div class="mb-4">
        <h4 class="text-subtitle-2 mb-2">Column Management</h4>
        <draggable
          v-model="draggableColumns"
          item-key="id"
          handle=".drag-handle"
          tag="div"
        >
          <template #item="{ element: column }">
            <v-list-item class="px-0">
              <template #prepend>
                <v-icon class="drag-handle mr-2" style="cursor: move">
                  mdi-drag-horizontal
                </v-icon>
                <v-icon :color="column.color" size="16">
                  mdi-view-column
                </v-icon>
              </template>

              <v-list-item-title>{{ column.title }}</v-list-item-title>

              <template #append>
                <v-tooltip location="top">
                  <template #activator="{ props: tooltipProps }">
                    <v-btn
                      v-bind="tooltipProps"
                      :icon="column.collapsed ? 'mdi-eye-off' : 'mdi-eye'"
                      variant="text"
                      size="small"
                      :color="column.collapsed ? 'grey' : 'primary'"
                      @click="toggleColumn(column.id)"
                    />
                  </template>
                  <span>{{ column.collapsed ? 'Show' : 'Hide' }} column</span>
                </v-tooltip>
              </template>
            </v-list-item>
          </template>
        </draggable>
      </div>
      
      <div class="mb-4">
        <h4 class="text-subtitle-2 mb-2">Display Options</h4>
        <v-switch
          v-model="localCompactMode"
          label="Compact Mode"
          density="compact"
          hide-details
        />
      </div>
    </v-card-text>
    <v-card-actions>
      <v-spacer />
      <v-btn size="small" @click="$emit('close')">Close</v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup>
import { computed } from 'vue'
import { VueDraggableNext as draggable } from 'vue-draggable-next'

const props = defineProps({
  columns: {
    type: Array,
    required: true,
  },
  compact: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update-column', 'reorder-columns', 'update:compactMode', 'close'])

const localCompactMode = computed({
  get: () => props.compact,
  set: (value) => emit('update:compactMode', value),
})

const draggableColumns = computed({
  get: () => props.columns,
  set: (value) => {
    emit('reorder-columns', value.map(c => c.id))
  },
})

const toggleColumn = (columnId) => {
  emit('update-column', columnId, { collapsed: !props.columns.find(c => c.id === columnId)?.collapsed })
}
</script>