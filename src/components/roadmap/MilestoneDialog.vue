<template>
  <v-dialog v-model="localDialog" max-width="600">
    <v-card>
      <v-card-title>
        {{ editing ? 'Edit Milestone' : 'Create Milestone' }}
      </v-card-title>

      <v-card-text>
        <v-form @submit.prevent="saveMilestone">
          <v-text-field
            v-model="form.title"
            label="Milestone Title"
            variant="outlined"
            required
          />

          <v-textarea
            v-model="form.description"
            label="Description"
            variant="outlined"
            rows="3"
          />

          <v-row>
            <v-col cols="6">
              <v-text-field
                v-model="form.start"
                label="Start Date"
                type="date"
                variant="outlined"
                required
              />
            </v-col>
            <v-col cols="6">
              <v-text-field
                v-model="form.end"
                label="End Date"
                type="date"
                variant="outlined"
                required
              />
            </v-col>
          </v-row>

          <v-row>
            <v-col cols="6">
              <v-select
                v-model="form.status"
                :items="statusOptions"
                label="Status"
                variant="outlined"
              />
            </v-col>
            <v-col cols="6">
              <v-slider
                v-model="form.progress"
                label="Progress"
                min="0"
                max="100"
                step="5"
                thumb-label
              >
                <template #append>
                  <v-text-field
                    v-model.number="form.progress"
                    type="number"
                    style="width: 80px"
                    variant="outlined"
                    density="compact"
                    suffix="%"
                    min="0"
                    max="100"
                  />
                </template>
              </v-slider>
            </v-col>
          </v-row>

          <v-text-field
            v-model="form.color"
            label="Color"
            type="color"
            variant="outlined"
          />
        </v-form>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn @click="localDialog = false">Cancel</v-btn>
        <v-btn color="primary" @click="saveMilestone" :loading="saving">
          {{ editing ? 'Update' : 'Create' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  modelValue: Boolean,
  milestone: Object,
  projectId: String
})

const emit = defineEmits(['update:modelValue', 'milestone-saved'])

const saving = ref(false)
const form = ref({
  title: '',
  description: '',
  start: '',
  end: '',
  status: 'planned',
  progress: 0,
  color: '#1976D2'
})

const localDialog = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const editing = computed(() => !!props.milestone)

const statusOptions = [
  { title: 'Planned', value: 'planned' },
  { title: 'In Progress', value: 'in-progress' },
  { title: 'Completed', value: 'completed' },
  { title: 'On Hold', value: 'on-hold' },
  { title: 'Cancelled', value: 'cancelled' }
]

const saveMilestone = async () => {
  if (!form.value.title.trim()) return

  try {
    saving.value = true
    const milestoneData = {
      ...form.value,
      projectId: props.projectId,
      type: 'milestone'
    }

    emit('milestone-saved', milestoneData)
    localDialog.value = false
  } catch (error) {
    console.error('Failed to save milestone:', error)
  } finally {
    saving.value = false
  }
}

watch(() => props.milestone, (milestone) => {
  if (milestone) {
    form.value = { ...milestone }
  } else {
    form.value = {
      title: '',
      description: '',
      start: '',
      end: '',
      status: 'planned',
      progress: 0,
      color: '#1976D2'
    }
  }
}, { immediate: true })
</script>