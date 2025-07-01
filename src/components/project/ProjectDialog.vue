<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    max-width="600"
    persistent
  >
    <v-card>
      <v-card-title class="text-h5 pa-6 pb-2">
        {{ isEditing ? 'Edit Project' : 'Create New Project' }}
      </v-card-title>
      
      <v-divider />
      
      <v-form ref="form" @submit.prevent="handleSubmit">
        <v-card-text class="pa-6">
          <v-row>
            <!-- Project Name -->
            <v-col cols="12">
              <v-text-field
                v-model="formData.name"
                label="Project Name"
                :rules="[rules.required]"
                variant="outlined"
                prepend-inner-icon="mdi-folder"
                placeholder="Enter project name"
              />
            </v-col>
            
            <!-- Description -->
            <v-col cols="12">
              <v-textarea
                v-model="formData.description"
                label="Description"
                :rules="[rules.required]"
                variant="outlined"
                prepend-inner-icon="mdi-text"
                placeholder="Describe your project"
                rows="3"
                auto-grow
              />
            </v-col>
            
            <!-- Status and Color -->
            <v-col cols="6">
              <v-select
                v-model="formData.status"
                :items="statusOptions"
                label="Status"
                variant="outlined"
                prepend-inner-icon="mdi-flag"
              />
            </v-col>
            
            <v-col cols="6">
              <v-menu offset-y>
                <template #activator="{ props }">
                  <v-text-field
                    v-bind="props"
                    v-model="formData.color"
                    label="Project Color"
                    variant="outlined"
                    readonly
                    prepend-inner-icon="mdi-palette"
                  >
                    <template #append-inner>
                      <v-avatar size="24" :color="formData.color" />
                    </template>
                  </v-text-field>
                </template>
                
                <v-card class="pa-4">
                  <div class="d-flex flex-wrap ga-2">
                    <v-btn
                      v-for="color in colorOptions"
                      :key="color.value"
                      :color="color.value"
                      icon
                      size="32"
                      variant="flat"
                      @click="formData.color = color.value"
                    >
                      <v-icon v-if="formData.color === color.value">mdi-check</v-icon>
                    </v-btn>
                  </div>
                </v-card>
              </v-menu>
            </v-col>
            
            <!-- Date Range -->
            <v-col cols="6">
              <v-text-field
                v-model="formData.startDate"
                label="Start Date"
                type="date"
                variant="outlined"
                prepend-inner-icon="mdi-calendar-start"
                :rules="[rules.required]"
              />
            </v-col>
            
            <v-col cols="6">
              <v-text-field
                v-model="formData.endDate"
                label="End Date"
                type="date"
                variant="outlined"
                prepend-inner-icon="mdi-calendar-end"
                :rules="[rules.required, rules.endDateAfterStart]"
              />
            </v-col>
            
            <!-- Project Owner -->
            <v-col cols="12">
              <v-select
                v-model="formData.ownerId"
                :items="userOptions"
                label="Project Owner"
                variant="outlined"
                prepend-inner-icon="mdi-account-star"
                :rules="[rules.required]"
              >
                <template #item="{ props, item }">
                  <v-list-item v-bind="props">
                    <template #prepend>
                      <v-avatar size="32">
                        <v-img :src="item.raw.avatar" />
                      </v-avatar>
                    </template>
                    <v-list-item-title>{{ item.title }}</v-list-item-title>
                    <v-list-item-subtitle>{{ item.raw.role }}</v-list-item-subtitle>
                  </v-list-item>
                </template>
                
                <template #selection="{ item }">
                  <div class="d-flex align-center">
                    <v-avatar size="24" class="mr-2">
                      <v-img :src="item.raw.avatar" />
                    </v-avatar>
                    <span>{{ item.title }}</span>
                  </div>
                </template>
              </v-select>
            </v-col>
            
            <!-- Teams -->
            <v-col cols="12">
              <v-select
                v-model="formData.teamIds"
                :items="teamOptions"
                label="Teams"
                variant="outlined"
                prepend-inner-icon="mdi-account-group"
                multiple
                chips
                closable-chips
                :rules="[rules.atLeastOneTeam]"
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
                
                <template #chip="{ props, item }">
                  <v-chip
                    v-bind="props"
                    :color="item.raw.color"
                    variant="outlined"
                  >
                    {{ item.title }}
                  </v-chip>
                </template>
              </v-select>
            </v-col>
          </v-row>
        </v-card-text>
        
        <v-divider />
        
        <v-card-actions class="pa-6">
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
            @click="handleSaveAndStay"
            :loading="saving"
          >
            Save & Create Another
          </v-btn>
          
          <v-btn
            color="primary"
            type="submit"
            :loading="saving"
          >
            {{ isEditing ? 'Update Project' : 'Create Project' }}
          </v-btn>
        </v-card-actions>
      </v-form>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useProjectsStore } from '@/stores/projects'

// Props
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  project: {
    type: Object,
    default: null
  }
})

// Emits
const emit = defineEmits(['update:modelValue', 'save', 'close'])

// Composables
const projectsStore = useProjectsStore()

// Refs
const form = ref(null)
const saving = ref(false)

// Local state
const formData = ref({
  name: '',
  description: '',
  status: 'active',
  color: '#1976D2',
  startDate: '',
  endDate: '',
  ownerId: '',
  teamIds: []
})

// Computed
const isEditing = computed(() => !!props.project)

const statusOptions = [
  { title: 'Active', value: 'active' },
  { title: 'On Hold', value: 'on-hold' },
  { title: 'Completed', value: 'completed' },
  { title: 'Cancelled', value: 'cancelled' }
]

const colorOptions = [
  { value: '#1976D2', name: 'Blue' },
  { value: '#388E3C', name: 'Green' },
  { value: '#F57C00', name: 'Orange' },
  { value: '#7B1FA2', name: 'Purple' },
  { value: '#D32F2F', name: 'Red' },
  { value: '#303F9F', name: 'Indigo' },
  { value: '#C2185B', name: 'Pink' },
  { value: '#00796B', name: 'Teal' },
  { value: '#5D4037', name: 'Brown' },
  { value: '#455A64', name: 'Blue Grey' }
]

const userOptions = computed(() => 
  projectsStore.users.map(user => ({
    title: user.name,
    value: user.id,
    avatar: user.avatar,
    role: user.role
  }))
)

const teamOptions = computed(() => 
  projectsStore.teams.map(team => ({
    title: team.name,
    value: team.id,
    color: team.color
  }))
)

// Validation rules
const rules = {
  required: value => !!value || 'This field is required',
  atLeastOneTeam: value => (value && value.length > 0) || 'At least one team must be selected',
  endDateAfterStart: value => {
    if (!value || !formData.value.startDate) return true
    return new Date(value) >= new Date(formData.value.startDate) || 'End date must be after start date'
  }
}

// Methods
const resetForm = () => {
  formData.value = {
    name: '',
    description: '',
    status: 'active',
    color: '#1976D2',
    startDate: '',
    endDate: '',
    ownerId: '',
    teamIds: []
  }
  
  // Set default dates
  const today = new Date()
  const threeMonthsLater = new Date(today)
  threeMonthsLater.setMonth(today.getMonth() + 3)
  
  formData.value.startDate = today.toISOString().split('T')[0]
  formData.value.endDate = threeMonthsLater.toISOString().split('T')[0]
  
  // Set default owner to first user
  if (userOptions.value.length > 0) {
    formData.value.ownerId = userOptions.value[0].value
  }
}

const loadProjectData = () => {
  if (props.project) {
    formData.value = {
      name: props.project.name || '',
      description: props.project.description || '',
      status: props.project.status || 'active',
      color: props.project.color || '#1976D2',
      startDate: props.project.startDate || '',
      endDate: props.project.endDate || '',
      ownerId: props.project.ownerId || '',
      teamIds: [...(props.project.teamIds || [])]
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
    await emit('save', { ...formData.value })
    handleClose()
  } catch (error) {
    console.error('Error saving project:', error)
  } finally {
    saving.value = false
  }
}

const handleSaveAndStay = async () => {
  const { valid } = await form.value.validate()
  if (!valid) return
  
  try {
    saving.value = true
    await emit('save', { ...formData.value })
    resetForm()
    await nextTick()
    form.value?.resetValidation()
  } catch (error) {
    console.error('Error saving project:', error)
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
    loadProjectData()
  }
})

watch(() => props.project, () => {
  if (props.modelValue) {
    loadProjectData()
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

.color-picker-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
}

@media (max-width: 600px) {
  :deep(.v-dialog .v-card) {
    margin: 12px;
  }
}
</style>