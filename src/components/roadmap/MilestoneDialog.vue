<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    max-width="600"
    persistent
  >
    <v-card>
      <v-card-title class="text-h6 pa-4">
        <v-icon class="mr-2">{{ isEditing ? 'mdi-pencil' : 'mdi-flag-plus' }}</v-icon>
        {{ isEditing ? 'Edit Milestone' : 'Create New Milestone' }}
      </v-card-title>
      
      <v-divider />
      
      <v-form ref="form" @submit.prevent="handleSubmit">
        <v-card-text class="pa-4">
          <!-- Milestone Title -->
          <v-text-field
            v-model="formData.title"
            label="Milestone Title"
            :rules="[rules.required]"
            variant="outlined"
            autofocus
            placeholder="Enter milestone title..."
            prepend-inner-icon="mdi-format-title"
            class="mb-3"
          />
          
          <!-- Description -->
          <v-textarea
            v-model="formData.content"
            label="Description"
            variant="outlined"
            placeholder="Describe this milestone..."
            prepend-inner-icon="mdi-text"
            rows="3"
            auto-grow
            class="mb-3"
          />
          
          <!-- Date Range -->
          <v-row class="mb-3">
            <v-col cols="6">
              <v-text-field
                v-model="formData.start"
                label="Start Date"
                type="date"
                variant="outlined"
                prepend-inner-icon="mdi-calendar-start"
                :rules="[rules.required]"
              />
            </v-col>
            
            <v-col cols="6">
              <v-text-field
                v-model="formData.end"
                label="End Date"
                type="date"
                variant="outlined"
                prepend-inner-icon="mdi-calendar-end"
                :rules="[rules.required, rules.endAfterStart]"
              />
            </v-col>
          </v-row>
          
          <!-- Milestone Type -->
          <v-select
            v-model="formData.type"
            :items="milestoneTypes"
            label="Milestone Type"
            variant="outlined"
            prepend-inner-icon="mdi-shape"
            class="mb-3"
          >
            <template #item="{ props, item }">
              <v-list-item v-bind="props">
                <template #prepend>
                  <v-icon :color="item.raw.color" size="16">
                    {{ item.raw.icon }}
                  </v-icon>
                </template>
                <v-list-item-title>{{ item.title }}</v-list-item-title>
                <v-list-item-subtitle>{{ item.raw.description }}</v-list-item-subtitle>
              </v-list-item>
            </template>
            
            <template #selection="{ item }">
              <div class="d-flex align-center">
                <v-icon :color="item.raw.color" size="16" class="mr-2">
                  {{ item.raw.icon }}
                </v-icon>
                <span>{{ item.title }}</span>
              </div>
            </template>
          </v-select>
          
          <!-- Priority -->
          <v-select
            v-model="formData.priority"
            :items="priorityOptions"
            label="Priority"
            variant="outlined"
            prepend-inner-icon="mdi-flag"
            class="mb-3"
          >
            <template #item="{ props, item }">
              <v-list-item v-bind="props">
                <template #prepend>
                  <v-icon :color="item.raw.color" size="16">
                    {{ item.raw.icon }}
                  </v-icon>
                </template>
              </v-list-item>
            </template>
            
            <template #selection="{ item }">
              <div class="d-flex align-center">
                <v-icon :color="item.raw.color" size="16" class="mr-2">
                  {{ item.raw.icon }}
                </v-icon>
                <span>{{ item.title }}</span>
              </div>
            </template>
          </v-select>
          
          <!-- Owner/Responsible Team -->
          <v-select
            v-model="formData.teamId"
            :items="teamOptions"
            label="Responsible Team"
            variant="outlined"
            prepend-inner-icon="mdi-account-group"
            class="mb-3"
          >
            <template #item="{ props, item }">
              <v-list-item v-bind="props">
                <template #prepend>
                  <v-avatar size="24" :color="item.raw.color">
                    <span class="text-caption text-white">
                      {{ item.title.charAt(0) }}
                    </span>
                  </v-avatar>
                </template>
              </v-list-item>
            </template>
            
            <template #selection="{ item }">
              <div class="d-flex align-center">
                <v-avatar size="20" :color="item.raw.color" class="mr-2">
                  <span class="text-caption text-white">
                    {{ item.title.charAt(0) }}
                  </span>
                </v-avatar>
                <span>{{ item.title }}</span>
              </div>
            </template>
          </v-select>
          
          <!-- Dependencies (Future Enhancement) -->
          <v-autocomplete
            v-model="formData.dependencies"
            :items="dependencyOptions"
            label="Dependencies (Optional)"
            variant="outlined"
            prepend-inner-icon="mdi-link"
            multiple
            chips
            closable-chips
            placeholder="Select milestones this depends on..."
            class="mb-3"
          >
            <template #chip="{ props, item }">
              <v-chip v-bind="props" variant="outlined" size="small">
                {{ item.title }}
              </v-chip>
            </template>
          </v-autocomplete>
          
          <!-- Success Criteria -->
          <v-textarea
            v-model="formData.successCriteria"
            label="Success Criteria (Optional)"
            variant="outlined"
            placeholder="Define what success looks like for this milestone..."
            prepend-inner-icon="mdi-check-circle"
            rows="2"
            auto-grow
            class="mb-3"
          />
          
          <!-- Budget/Resources (Optional) -->
          <v-row>
            <v-col cols="6">
              <v-text-field
                v-model.number="formData.budget"
                label="Budget (Optional)"
                type="number"
                variant="outlined"
                prepend-inner-icon="mdi-currency-usd"
                prefix="$"
                min="0"
              />
            </v-col>
            
            <v-col cols="6">
              <v-text-field
                v-model.number="formData.estimatedHours"
                label="Estimated Hours"
                type="number"
                variant="outlined"
                prepend-inner-icon="mdi-clock"
                suffix="hrs"
                min="0"
              />
            </v-col>
          </v-row>
        </v-card-text>
        
        <v-divider />
        
        <v-card-actions class="pa-4">
          <v-btn
            @click="handleCancel"
            variant="outlined"
          >
            Cancel
          </v-btn>
          
          <v-spacer />
          
          <v-btn
            v-if="!isEditing"
            color="secondary"
            variant="outlined"
            @click="handleSaveAndCreateAnother"
            :loading="saving"
          >
            Save & Create Another
          </v-btn>
          
          <v-btn
            color="primary"
            type="submit"
            :loading="saving"
          >
            {{ isEditing ? 'Update Milestone' : 'Create Milestone' }}
          </v-btn>
        </v-card-actions>
      </v-form>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useProjectsStore } from '@/stores/projects'
import { useTasksStore } from '@/stores/tasks'

// Props
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  milestone: {
    type: Object,
    default: null
  },
  projectId: {
    type: String,
    required: true
  }
})

// Emits
const emit = defineEmits(['update:modelValue', 'milestone-saved', 'close'])

// Composables
const projectsStore = useProjectsStore()
const tasksStore = useTasksStore()

// Refs
const form = ref(null)
const saving = ref(false)

// Local state
const formData = ref({
  title: '',
  content: '',
  start: '',
  end: '',
  type: 'milestone',
  priority: 'medium',
  teamId: '',
  dependencies: [],
  successCriteria: '',
  budget: null,
  estimatedHours: null
})

// Computed
const isEditing = computed(() => !!props.milestone)

const milestoneTypes = [
  {
    title: 'Milestone',
    value: 'milestone',
    color: 'primary',
    icon: 'mdi-flag',
    description: 'Key project milestone or deliverable'
  },
  {
    title: 'Release',
    value: 'release',
    color: 'success',
    icon: 'mdi-rocket-launch',
    description: 'Product or feature release'
  },
  {
    title: 'Phase',
    value: 'phase',
    color: 'info',
    icon: 'mdi-timeline',
    description: 'Project phase or stage'
  },
  {
    title: 'Deadline',
    value: 'deadline',
    color: 'warning',
    icon: 'mdi-clock-alert',
    description: 'Important deadline'
  },
  {
    title: 'Review',
    value: 'review',
    color: 'purple',
    icon: 'mdi-eye',
    description: 'Review or approval gate'
  }
]

const priorityOptions = [
  { title: 'Critical', value: 'critical', color: 'error', icon: 'mdi-alert-circle' },
  { title: 'High', value: 'high', color: 'warning', icon: 'mdi-arrow-up' },
  { title: 'Medium', value: 'medium', color: 'info', icon: 'mdi-minus' },
  { title: 'Low', value: 'low', color: 'success', icon: 'mdi-arrow-down' }
]

const teamOptions = computed(() => 
  projectsStore.projectTeams.map(team => ({
    title: team.name,
    value: team.id,
    color: team.color
  }))
)

const dependencyOptions = computed(() => 
  tasksStore.getRoadmapByProject(props.projectId)
    .filter(item => item.id !== props.milestone?.id)
    .map(item => ({
      title: item.title,
      value: item.id
    }))
)

// Validation rules
const rules = {
  required: value => !!value || 'This field is required',
  endAfterStart: value => {
    if (!value || !formData.value.start) return true
    return new Date(value) >= new Date(formData.value.start) || 'End date must be after start date'
  }
}

// Methods
const resetForm = () => {
  formData.value = {
    title: '',
    content: '',
    start: '',
    end: '',
    type: 'milestone',
    priority: 'medium',
    teamId: teamOptions.value[0]?.value || '',
    dependencies: [],
    successCriteria: '',
    budget: null,
    estimatedHours: null
  }
  
  // Set default dates
  const today = new Date()
  const oneMonthLater = new Date(today)
  oneMonthLater.setMonth(today.getMonth() + 1)
  
  formData.value.start = today.toISOString().split('T')[0]
  formData.value.end = oneMonthLater.toISOString().split('T')[0]
}

const loadMilestoneData = () => {
  if (props.milestone) {
    formData.value = {
      title: props.milestone.title || '',
      content: props.milestone.content || '',
      start: props.milestone.start ? new Date(props.milestone.start).toISOString().split('T')[0] : '',
      end: props.milestone.end ? new Date(props.milestone.end).toISOString().split('T')[0] : '',
      type: props.milestone.type || 'milestone',
      priority: props.milestone.priority || 'medium',
      teamId: props.milestone.teamId || '',
      dependencies: props.milestone.dependencies || [],
      successCriteria: props.milestone.successCriteria || '',
      budget: props.milestone.budget || null,
      estimatedHours: props.milestone.estimatedHours || null
    }
  } else {
    resetForm()
  }
}

const handleSubmit = async () => {
  const { valid } = await form.value.validate()
  if (!valid) return
  
  try {
    saving.value = true
    
    const milestoneData = {
      ...formData.value,
      projectId: props.projectId,
      start: new Date(formData.value.start).toISOString(),
      end: new Date(formData.value.end).toISOString(),
      taskIds: props.milestone?.taskIds || []
    }
    
    if (isEditing.value) {
      await tasksStore.updateRoadmapItem(props.milestone.id, milestoneData)
    } else {
      await tasksStore.createRoadmapItem(milestoneData)
    }
    
    emit('milestone-saved', milestoneData)
    handleClose()
  } catch (error) {
    console.error('Error saving milestone:', error)
  } finally {
    saving.value = false
  }
}

const handleSaveAndCreateAnother = async () => {
  const { valid } = await form.value.validate()
  if (!valid) return
  
  try {
    saving.value = true
    
    const milestoneData = {
      ...formData.value,
      projectId: props.projectId,
      start: new Date(formData.value.start).toISOString(),
      end: new Date(formData.value.end).toISOString(),
      taskIds: []
    }
    
    await tasksStore.createRoadmapItem(milestoneData)
    emit('milestone-saved', milestoneData)
    
    // Reset form but keep some values
    const preservedValues = {
      type: formData.value.type,
      priority: formData.value.priority,
      teamId: formData.value.teamId
    }
    
    resetForm()
    Object.assign(formData.value, preservedValues)
    
    await nextTick()
    form.value?.resetValidation()
  } catch (error) {
    console.error('Error saving milestone:', error)
  } finally {
    saving.value = false
  }
}

const handleCancel = () => {
  handleClose()
}

const handleClose = () => {
  emit('update:modelValue', false)
  emit('close')
  setTimeout(() => {
    if (form.value) {
      form.value.resetValidation()
    }
  }, 300)
}

// Watchers
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    loadMilestoneData()
  }
})

watch(() => props.milestone, () => {
  if (props.modelValue) {
    loadMilestoneData()
  }
})
</script>

<style scoped>
:deep(.v-text-field .v-input__control) {
  min-height: 56px;
}

:deep(.v-textarea .v-input__control) {
  min-height: auto;
}

:deep(.v-select .v-input__control) {
  min-height: 56px;
}

.v-card-title {
  background: rgba(var(--v-theme-primary), 0.1);
  color: rgb(var(--v-theme-primary));
}

@media (max-width: 600px) {
  :deep(.v-dialog .v-card) {
    margin: 12px;
  }
}
</style>