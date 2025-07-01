<template>
  <v-card min-width="300">
    <v-card-title class="text-h6">Board Settings</v-card-title>
    <v-divider />
    <v-card-text>
      <div class="mb-4">
        <h4 class="text-subtitle-2 mb-2">Column Management</h4>
        <v-list density="compact">
          <v-list-item
            v-for="column in columns"
            :key="column.id"
            class="px-0"
          >
            <template #prepend>
              <v-icon :color="column.color" size="16">
                mdi-view-column
              </v-icon>
            </template>
            
            <v-list-item-title>{{ column.title }}</v-list-item-title>
            
            <template #append>
              <v-btn
                icon="mdi-eye"
                variant="text"
                size="small"
                :color="column.collapsed ? 'grey' : 'primary'"
                @click="toggleColumn(column.id)"
              />
            </template>
          </v-list-item>
        </v-list>
      </div>
      
      <div class="mb-4">
        <h4 class="text-subtitle-2 mb-2">Display Options</h4>
        <v-switch
          v-model="compactMode"
          label="Compact Mode"
          density="compact"
          hide-details
        />
      </div>
    </v-card-text>
    <v-card-actions>
      <v-spacer />
      <v-btn size="small">Close</v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  columns: Array
})

const emit = defineEmits(['update-column', 'reorder-columns'])

const compactMode = ref(false)

const toggleColumn = (columnId) => {
  emit('update-column', columnId, { collapsed: !props.columns.find(c => c.id === columnId)?.collapsed })
}
</script>