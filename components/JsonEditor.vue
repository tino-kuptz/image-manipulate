<template>
  <div ref="editorContainer" class="editor" :class="{ 'is-invalid': invalid }"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api'
import 'monaco-editor/min/vs/editor/editor.main.css'
import 'monaco-editor/esm/vs/language/json/monaco.contribution'
// Workers for Vite bundling
// @ts-expect-error - Vite worker import query
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
// @ts-expect-error - Vite worker import query
import JsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'

const props = defineProps<{ modelValue: string; invalid?: boolean }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: string): void }>()

const editorContainer = ref<HTMLElement | null>(null)
let instance: monaco.editor.IStandaloneCodeEditor | null = null;

// Map workers
(globalThis as any).MonacoEnvironment = {
    getWorker(_: string, label: string) {
      if (label === 'json') return new JsonWorker()
      return new EditorWorker()
    },
  }

onMounted(() => {
  console.debug('[JsonEditor] onMounted')
  if (!editorContainer.value) {
    console.error('[JsonEditor] editorContainer is null')
    return
  }
  monaco.languages.json.jsonDefaults.setDiagnosticsOptions({ validate: true, allowComments: true })
  try {
    instance = monaco.editor.create(editorContainer.value, {
      value: props.modelValue,
      language: 'json',
      automaticLayout: true,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      theme: 'vs',
    })
    console.debug('[JsonEditor] monaco editor created')
    instance.onDidChangeModelContent(() => {
      const val = instance?.getValue() ?? ''
      if (val !== props.modelValue) emit('update:modelValue', val)
    })
  } catch (e) {
    console.error('[JsonEditor] failed to create editor', e)
  }
})

onBeforeUnmount(() => {
  if (instance) {
    instance.dispose()
    instance = null
  }
})

watch(
  () => props.modelValue,
  (val) => {
    if (instance && val !== instance.getValue()) {
      const model = instance.getModel()
      if (model) monaco.editor.getModel(model.uri)?.setValue(val)
    }
  },
)
</script>

<style scoped>
.editor {
  ;
  min-height: 600px;
  background: #ffffff;
  width: 100%;
  border: 1px solid #ccc;
}
</style>
