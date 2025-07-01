<template>
  <v-card>
    <v-card-title class="d-flex align-center justify-space-between">
      <span>Roadmap Settings</span>
      <v-btn icon size="small" variant="text" @click="$emit('close')">
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-card-title>

    <v-divider />

    <v-card-text>
      <v-row>
        <v-col cols="12" md="6">
          <v-select
            :model-value="settings.timeRange"
            :items="timeRangeOptions"
            label="Time Range"
            variant="outlined"
            @update:model-value="updateSetting('timeRange', $event)"
          />
        </v-col>

        <v-col cols="12" md="6">
          <v-select
            :model-value="settings.groupBy"
            :items="groupByOptions"
            label="Group By"
            variant="outlined"
            @update:model-value="updateSetting('groupBy', $event)"
          />
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="12">
          <v-switch
            :model-value="settings.showDependencies"
            label="Show Dependencies"
            color="primary"
            @update:model-value="updateSetting('showDependencies', $event)"
          />
        </v-col>

        <v-col cols="12">
          <v-switch
            :model-value="settings.showProgress"
            label="Show Progress Bars"
            color="primary"
            @update:model-value="updateSetting('showProgress', $event)"
          />
        </v-col>

        <v-col cols="12">
          <v-switch
            :model-value="settings.showLinkedTasks"
            label="Show Linked Tasks"
            color="primary"
            @update:model-value="updateSetting('showLinkedTasks', $event)"
          />
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script setup>
const props = defineProps({
  settings: Object
})

const emit = defineEmits(['update:settings', 'close'])

const timeRangeOptions = [
  { title: '3 Months', value: '3months' },
  { title: '6 Months', value: '6months' },
  { title: '1 Year', value: '1year' },
  { title: '2 Years', value: '2years' }
]

const groupByOptions = [
  { title: 'None', value: 'none' },
  { title: 'Team', value: 'team' },
  { title: 'Priority', value: 'priority' },
  { title: 'Status', value: 'status' }
]

const updateSetting = (key, value) => {
  emit('update:settings', { ...props.settings, [key]: value })
}
</script>