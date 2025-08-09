<template>
  <div class="container-fluid py-3">
    <div class="row g-3">
      <div class="col-12 col-lg-6">
        <JsonEditor v-model="jsonc" :invalid="hasError" />
        <div v-if="hasError" class="invalid-feedback d-block">
          {{ errorMessage }}
        </div>
        <div class="mt-2 text-end">
          <button class="btn btn-sm btn-outline-secondary" @click="refreshPreview" :disabled="isLoading">
            Refresh
          </button>
        </div>
        <div class="form-text">Paste or edit your JSON with comments.</div>
      </div>
      <div class="col-12 col-lg-6 d-flex flex-column">
        <ImagePreview :src="imageUrl" :json="errorJson" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
const defaultJson = `{
  "format": "png",
  "quality": 100,
  "canvas": { "width": 1024, "height": 1024 },
  "steps": [
    // Draw a background image
    {
      "action": "draw_image",
      "x": 0, "y": 0,
      "width": 1024, "height": 1024,
      "source": "https://placehold.co/1024x1024.png"
    },
    // Write a text on it
    {
      "action": "write_text",
      "x": 200, "y": 200,
      "width": 600, "height": 600,
      "text": "Hello World",
      "font": "Comic Sans MS", "font_size": 40,
      "align": "center",
      "color": "#FF0000"
    },
    // Blur a region
    {
      "action": "blur_region",
      "x": 312, "y": 312,
      "width": 400, "height": 400,
      "sigma": 5
    }
  ]
}`

const jsonc = ref<string>(defaultJson)
const imageUrl = ref<string>('')
const errorJson = ref<string>('')
const isLoading = ref(false)
const hasError = ref(false)
const errorMessage = ref('')

async function refreshPreview() {
  try {
    hasError.value = false
    errorMessage.value = ''
    isLoading.value = true

    const res = await fetch('/api/v1/image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/jsonc' },
      body: jsonc.value,
    })
    if (!res.ok) {
      const text = await res.text()
      try {
        const obj = JSON.parse(text)
        errorJson.value = JSON.stringify(obj, null, 2)
      } catch {
        errorJson.value = text
      }
      imageUrl.value = ''
      hasError.value = true
      errorMessage.value = `HTTP ${res.status}`
      return
    }
    const blob = await res.blob()
    imageUrl.value = URL.createObjectURL(blob)
    errorJson.value = ''
  } catch (err: any) {
    hasError.value = true
    errorMessage.value = err?.message ?? 'Invalid JSON or server error'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  refreshPreview()
})
</script>

<style scoped>
.form-control.is-invalid {
  border-color: #dc3545;
}
</style>
