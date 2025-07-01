<template>
  <v-dialog v-model="localDialog" max-width="500">
    <v-card>
      <v-card-title>Quick Add Task</v-card-title>
      
      <v-card-text>
        <v-form @submit.prevent="createTask">
          <v-text-field
            v-model="form.title"
            label="Task Title"
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
              <v-select
                v-model="form.priority"
                :items="priorityOptions"
                label="Priority"
                variant="outlined"
              />
            </v-col>
            <v-col cols="6">
              <v-select
                v-model="form.columnId"
                :items="columnOptions"
                label="Status"
                variant="outlined"
              />
            </v-col>
          </v-row>
          
          <v-row>
            <v-col cols="6">
              <v-select
                v-model="form.assigneeId"
                :items="assigneeOptions"
                label="Assignee"
                variant="outlined"
                clearable
              />
            </v-col>
            <v-col cols="6">
              <v-text-field
                v-model="form.dueDate"
                label="Due Date"
                type="date"
                variant="outlined"
              />
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>
      
      <v-card-actions>
        <v-spacer />
        <v-btn @click="localDialog = false">Cancel</v-btn>
        <v-btn color="primary" @click="createTask" :loading="creating">
          Create Task
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useTasksStore } from '@/stores/tasks'
import { useProjectsStore } from '@/stores/projects'

const props = defineProps({
  modelValue: Boolean,
  projectId: String,
  columnId: String
})

const emit = defineEmits(['update:modelValue', 'task-created'])

const tasksStore = useTasksStore()
const projectsStore = useProjectsStore()

const creating = ref(false)
const form = ref({
  title: '',
  description: '',
  priority: 'medium',
  columnId: props.columnId || 'todo',
  assigneeId: null,
  dueDate: null
})

const localDialog = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const priorityOptions = [
  { title: 'Critical', value: 'critical' },
  { title: 'High', value: 'high' },
  { title: 'Medium', value: 'medium' },
  { title: 'Low', value: 'low' }
]

const columnOptions = computed(() => 
  tasksStore.kanbanColumns.map(col => ({
    title: col.title,
    value: col.id
  }))
)

const assigneeOptions = computed(() => 
  projectsStore.projectUsers.map(user => ({
    title: user.name,
    value: user.id
  }))
)

const createTask = async () => {
  if (!form.value.title.trim()) return
  
  try {
    creating.value = true
    await tasksStore.createTask({
      ...form.value,
      projectId: props.projectId
    })
    
    emit('task-created')
    localDialog.value = false
    resetForm()
  } catch (error) {
    console.error('Failed to create task:', error)
  } finally {
    creating.value = false
  }
}

const resetForm = () => {
  form.value = {
    title: '',
    description: '',
    priority: 'medium',
    columnId: props.columnId || 'todo',
    assigneeId: null,
    dueDate: null
  }
}

watch(() => props.modelValue, (newVal) => {
  if (!newVal) {
    resetForm()
  }
})
</script>