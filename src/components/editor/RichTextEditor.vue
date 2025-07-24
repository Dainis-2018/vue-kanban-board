<!-- src/components/editor/RichTextEditor.vue -->
<template>
  <div class="rich-text-editor">
    <!-- Toolbar -->
    <div v-if="editor && !readonly" class="editor-toolbar">
      <div class="toolbar-group">
        <v-btn
          size="small"
          variant="text"
          :class="{ 'active': editor.isActive('bold') }"
          @click="editor.chain().focus().toggleBold().run()"
          icon="mdi-format-bold"
          title="Bold"
        />
        <v-btn
          size="small"
          variant="text"
          :class="{ 'active': editor.isActive('italic') }"
          @click="editor.chain().focus().toggleItalic().run()"
          icon="mdi-format-italic"
          title="Italic"
        />
        <v-btn
          size="small"
          variant="text"
          :class="{ 'active': editor.isActive('strike') }"
          @click="editor.chain().focus().toggleStrike().run()"
          icon="mdi-format-strikethrough"
          title="Strikethrough"
        />
      </div>

      <v-divider vertical class="mx-2" />

      <!-- Color Controls -->
      <div class="toolbar-group">
        <!-- Text Color -->
        <v-menu offset-y>
          <template #activator="{ props }">
            <v-btn
              v-bind="props"
              size="small"
              variant="text"
              title="Text Color"
              class="color-btn"
            >
              <v-icon size="16">mdi-format-color-text</v-icon>
              <div 
                class="color-indicator"
                :style="{ backgroundColor: currentTextColor }"
              ></div>
            </v-btn>
          </template>
          <v-card class="color-picker-card" elevation="8">
            <v-card-text class="pa-3">
              <div class="text-caption font-weight-bold mb-2">Text Color</div>
              <div class="color-grid">
                <v-btn
                  v-for="color in textColors"
                  :key="color.value"
                  :style="{ backgroundColor: color.value }"
                  class="color-swatch"
                  size="x-small"
                  variant="flat"
                  :title="color.name"
                  @click="setTextColor(color.value)"
                >
                  <v-icon v-if="color.value === 'transparent'" size="12">mdi-format-color-text</v-icon>
                </v-btn>
              </div>
              <v-btn
                size="x-small"
                variant="text"
                prepend-icon="mdi-refresh"
                @click="clearTextColor"
                class="mt-2"
                block
                density="compact"
              >
                Remove Color
              </v-btn>
            </v-card-text>
          </v-card>
        </v-menu>

        <!-- Background Color -->
        <v-menu offset-y>
          <template #activator="{ props }">
            <v-btn
              v-bind="props"
              size="small"
              variant="text"
              title="Background Color"
              class="color-btn"
            >
              <v-icon size="16">mdi-format-color-highlight</v-icon>
              <div 
                class="color-indicator"
                :style="{ backgroundColor: currentBackgroundColor }"
              ></div>
            </v-btn>
          </template>
          <v-card class="color-picker-card" elevation="8">
            <v-card-text class="pa-3">
              <div class="text-caption font-weight-bold mb-2">Highlight Color</div>
              <div class="color-grid">
                <v-btn
                  v-for="color in highlightColors"
                  :key="color.value"
                  :style="{ backgroundColor: color.value }"
                  class="color-swatch"
                  size="x-small"
                  variant="flat"
                  :title="color.name"
                  @click="setBackgroundColor(color.value)"
                >
                  <v-icon v-if="color.value === 'transparent'" size="12">mdi-format-color-highlight</v-icon>
                </v-btn>
              </div>
              <v-btn
                size="x-small"
                variant="text"
                prepend-icon="mdi-refresh"
                @click="clearBackgroundColor"
                class="mt-2"
                block
                density="compact"
              >
                Remove Highlight
              </v-btn>
            </v-card-text>
          </v-card>
        </v-menu>
      </div>

      <v-divider vertical class="mx-2" />

      <div class="toolbar-group">
        <v-btn
          size="small"
          variant="text"
          :class="{ 'active': editor.isActive('bulletList') }"
          @click="editor.chain().focus().toggleBulletList().run()"
          icon="mdi-format-list-bulleted"
          title="Bullet List"
        />
        <v-btn
          size="small"
          variant="text"
          :class="{ 'active': editor.isActive('orderedList') }"
          @click="editor.chain().focus().toggleOrderedList().run()"
          icon="mdi-format-list-numbered"
          title="Numbered List"
        />
      </div>

      <v-divider vertical class="mx-2" />

      <div class="toolbar-group">
        <v-btn
          size="small"
          variant="text"
          :class="{ 'active': editor.isActive('blockquote') }"
          @click="editor.chain().focus().toggleBlockquote().run()"
          icon="mdi-format-quote-close"
          title="Quote"
        />
        <v-btn
          size="small"
          variant="text"
          :class="{ 'active': editor.isActive('codeBlock') }"
          @click="editor.chain().focus().toggleCodeBlock().run()"
          icon="mdi-code-tags"
          title="Code Block"
        />
      </div>

      <v-divider vertical class="mx-2" />

      <div class="toolbar-group">
        <v-btn
          size="small"
          variant="text"
          @click="editor.chain().focus().undo().run()"
          :disabled="!editor.can().undo()"
          icon="mdi-undo"
          title="Undo"
        />
        <v-btn
          size="small"
          variant="text"
          @click="editor.chain().focus().redo().run()"
          :disabled="!editor.can().redo()"
          icon="mdi-redo"
          title="Redo"
        />
      </div>
    </div>

    <!-- Editor Content -->
    <div 
      class="editor-content"
      :class="{ 
        'editor-readonly': readonly,
        'editor-focused': isFocused,
        'editor-error': !!errorMessage
      }"
    >
      <editor-content :editor="editor" />
      
      <!-- Placeholder -->
      <div v-if="!readonly && editor?.isEmpty" class="editor-placeholder">
        {{ placeholder }}
      </div>
    </div>

    <!-- Error Message -->
    <div v-if="errorMessage" class="editor-error-message">
      {{ errorMessage }}
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { Editor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import { Color } from '@tiptap/extension-color'
import TextStyle from '@tiptap/extension-text-style'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: 'Start typing...'
  },
  readonly: {
    type: Boolean,
    default: false
  },
  errorMessage: {
    type: String,
    default: ''
  },
  minHeight: {
    type: String,
    default: '120px'
  }
})

const emit = defineEmits(['update:modelValue', 'focus', 'blur'])

const editor = ref(null)
const isFocused = ref(false)

// Color palettes
const textColors = [
  { name: 'Default', value: 'transparent' },
  { name: 'Black', value: '#000000' },
  { name: 'Dark Grey', value: '#374151' },
  { name: 'Grey', value: '#6B7280' },
  { name: 'Light Grey', value: '#9CA3AF' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Orange', value: '#F97316' },
  { name: 'Yellow', value: '#EAB308' },
  { name: 'Green', value: '#22C55E' },
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Indigo', value: '#6366F1' },
  { name: 'Purple', value: '#A855F7' },
  { name: 'Pink', value: '#EC4899' }
]

const highlightColors = [
  { name: 'No Highlight', value: 'transparent' },
  { name: 'Yellow', value: '#FEF3C7' },
  { name: 'Green', value: '#D1FAE5' },
  { name: 'Blue', value: '#DBEAFE' },
  { name: 'Purple', value: '#E9D5FF' },
  { name: 'Pink', value: '#FCE7F3' },
  { name: 'Red', value: '#FEE2E2' },
  { name: 'Orange', value: '#FED7AA' },
  { name: 'Grey', value: '#F3F4F6' }
]

// Current colors
const currentTextColor = ref('#000000')
const currentBackgroundColor = ref('transparent')

onMounted(() => {
  editor.value = new Editor({
    content: props.modelValue,
    editable: !props.readonly,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3]
        }
      }),
      TextStyle,
      Color.configure({
        types: ['textStyle']
      })
    ],
    onUpdate: ({ editor }) => {
      emit('update:modelValue', editor.getHTML())
    },
    onFocus: () => {
      isFocused.value = true
      emit('focus')
    },
    onBlur: () => {
      isFocused.value = false
      emit('blur')
    },
    onSelectionUpdate: ({ editor }) => {
      // Update current color indicators
      const { color } = editor.getAttributes('textStyle')
      currentTextColor.value = color || '#000000'
      
      // Note: Background color would need a custom extension
      // For now, we'll use the highlight functionality
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none'
      }
    }
  })
})

onBeforeUnmount(() => {
  if (editor.value) {
    editor.value.destroy()
  }
})

watch(() => props.modelValue, (newValue) => {
  if (editor.value && editor.value.getHTML() !== newValue) {
    editor.value.commands.setContent(newValue, false)
  }
})

watch(() => props.readonly, (readonly) => {
  if (editor.value) {
    editor.value.setEditable(!readonly)
  }
})

// Color methods
const setTextColor = (color) => {
  if (color === 'transparent') {
    editor.value.chain().focus().unsetColor().run()
  } else {
    editor.value.chain().focus().setColor(color).run()
  }
  currentTextColor.value = color === 'transparent' ? '#000000' : color
}

const clearTextColor = () => {
  editor.value.chain().focus().unsetColor().run()
  currentTextColor.value = '#000000'
}

const setBackgroundColor = (color) => {
  if (color === 'transparent') {
    // Remove any background color styling
    editor.value.chain().focus().unsetMark('textStyle').run()
  } else {
    // Add background color as inline style
    editor.value.chain().focus().setMark('textStyle', { 
      style: `background-color: ${color}` 
    }).run()
  }
  currentBackgroundColor.value = color
}

const clearBackgroundColor = () => {
  // Remove background color styling
  const selection = editor.value.state.selection
  const { from, to } = selection
  
  editor.value.view.dispatch(
    editor.value.state.tr.removeMark(from, to, editor.value.schema.marks.textStyle)
  )
  currentBackgroundColor.value = 'transparent'
}
</script>

<style scoped>
.rich-text-editor {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 4px;
  transition: border-color 0.2s ease;
}

.rich-text-editor:hover {
  border-color: rgba(var(--v-theme-on-surface), 0.87);
}

.editor-focused {
  border-color: rgb(var(--v-theme-primary)) !important;
  box-shadow: 0 0 0 1px rgb(var(--v-theme-primary));
}

.editor-error {
  border-color: rgb(var(--v-theme-error)) !important;
}

.editor-toolbar {
  display: flex;
  align-items: center;
  padding: 6px 8px;
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  background: rgba(var(--v-theme-surface), 1);
  border-radius: 4px 4px 0 0;
  flex-wrap: wrap;
  gap: 2px;
  min-height: 44px;
}

.toolbar-group {
  display: flex;
  align-items: center;
  gap: 1px;
}

.toolbar-group .v-btn {
  min-width: 32px !important;
  width: 32px !important;
  height: 32px !important;
  padding: 0 !important;
}

.toolbar-group .v-btn.active {
  background-color: rgba(var(--v-theme-primary), 0.12);
  color: rgb(var(--v-theme-primary));
}

.editor-content {
  position: relative;
  min-height: v-bind(minHeight);
  padding: 16px;
  background: rgba(var(--v-theme-surface), 1);
}

.editor-readonly {
  background: transparent;
}

.editor-readonly .editor-toolbar {
  display: none;
}

.editor-placeholder {
  position: absolute;
  top: 16px;
  left: 16px;
  color: rgba(var(--v-theme-on-surface), 0.6);
  pointer-events: none;
  font-size: 0.875rem;
}

.editor-error-message {
  padding: 4px 12px;
  color: rgb(var(--v-theme-error));
  font-size: 0.75rem;
}

/* TipTap Editor Styling */
:deep(.ProseMirror) {
  outline: none;
  min-height: v-bind(minHeight);
  font-size: 0.875rem;
  line-height: 1.5;
}

:deep(.ProseMirror h1) {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0.5rem 0;
}

:deep(.ProseMirror h2) {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0.5rem 0;
}

:deep(.ProseMirror h3) {
  font-size: 1rem;
  font-weight: 600;
  margin: 0.5rem 0;
}

:deep(.ProseMirror p) {
  margin: 0.5rem 0;
}

:deep(.ProseMirror ul),
:deep(.ProseMirror ol) {
  margin: 0.5rem 0;
  padding-left: 1.5rem;
}

:deep(.ProseMirror li) {
  margin: 0.25rem 0;
}

:deep(.ProseMirror blockquote) {
  border-left: 3px solid rgba(var(--v-theme-primary), 0.5);
  padding-left: 1rem;
  margin: 0.5rem 0;
  font-style: italic;
}

:deep(.ProseMirror pre) {
  background: rgba(var(--v-theme-surface-variant), 0.5);
  border-radius: 4px;
  padding: 0.75rem;
  font-family: 'Courier New', monospace;
  font-size: 0.8rem;
  overflow-x: auto;
  margin: 0.5rem 0;
}

:deep(.ProseMirror code) {
  background: rgba(var(--v-theme-surface-variant), 0.5);
  border-radius: 2px;
  padding: 0.125rem 0.25rem;
  font-family: 'Courier New', monospace;
  font-size: 0.8rem;
}

:deep(.ProseMirror strong) {
  font-weight: 600;
}

:deep(.ProseMirror em) {
  font-style: italic;
}

:deep(.ProseMirror s) {
  text-decoration: line-through;
}

/* Color Picker Styles */
.color-btn {
  position: relative;
  min-width: 32px !important;
  width: 32px !important;
  height: 32px !important;
}

.color-picker-card {
  min-width: 180px;
  max-width: 220px;
}

.color-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 3px;
  margin-bottom: 8px;
}

.color-swatch {
  width: 24px !important;
  height: 24px !important;
  min-width: 24px !important;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 3px;
  padding: 0;
  transition: all 0.15s ease;
}

.color-swatch:hover {
  transform: scale(1.15);
  border-color: rgba(var(--v-theme-primary), 0.6);
  z-index: 1;
}

.color-swatch[style*="transparent"] {
  background: linear-gradient(45deg, #e5e7eb 25%, transparent 25%), 
              linear-gradient(-45deg, #e5e7eb 25%, transparent 25%), 
              linear-gradient(45deg, transparent 75%, #e5e7eb 75%), 
              linear-gradient(-45deg, transparent 75%, #e5e7eb 75%);
  background-size: 6px 6px;
  background-position: 0 0, 0 3px, 3px -3px, -3px 0px;
}

.color-indicator {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 8px;
  height: 2px;
  border-radius: 1px;
  border: 1px solid rgba(0, 0, 0, 0.2);
  background: currentColor;
}

/* Divider styling */
.v-divider--vertical {
  margin: 0 4px;
  height: 20px;
  align-self: center;
}

@media (max-width: 600px) {
  .editor-toolbar {
    padding: 4px 6px;
    min-height: 40px;
  }
  
  .toolbar-group .v-btn {
    min-width: 28px !important;
    width: 28px !important;
    height: 28px !important;
  }
  
  .color-btn {
    min-width: 28px !important;
    width: 28px !important;
    height: 28px !important;
  }
  
  .editor-content {
    padding: 12px;
  }
  
  :deep(.ProseMirror) {
    font-size: 0.8rem;
  }
  
  .color-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 2px;
  }
  
  .color-swatch {
    width: 20px !important;
    height: 20px !important;
    min-width: 20px !important;
  }
  
  .color-picker-card {
    min-width: 160px;
    max-width: 180px;
  }
  
  .v-divider--vertical {
    margin: 0 2px;
    height: 16px;
  }
}
</style>