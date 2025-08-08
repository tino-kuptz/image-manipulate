<template>
  <div class="container-fluid py-3">
    <div class="row g-3">
      <div class="col-12 col-lg-6">
        <label class="form-label fw-semibold">JSON(c) Payload</label>
        <textarea
          v-model="jsonc"
          class="form-control"
          :class="{ 'is-invalid': hasError }"
          rows="24"
          spellcheck="false"
        />
        <div v-if="hasError" class="invalid-feedback d-block">
          {{ errorMessage }}
        </div>
        <div class="form-text">Paste or edit your JSON with comments. Live preview refreshes on valid input.</div>
      </div>
      <div class="col-12 col-lg-6 d-flex flex-column">
        <div class="d-flex align-items-center justify-content-between mb-2">
          <h6 class="mb-0">Live Preview</h6>
          <div>
            <button class="btn btn-sm btn-outline-secondary" @click="refreshPreview" :disabled="isLoading">
              Refresh
            </button>
          </div>
        </div>
        <div class="border rounded d-flex align-items-center justify-content-center p-2 flex-fill" style="min-height: 320px; background: #f8f9fa;">
          <img v-if="imageUrl" :src="imageUrl" alt="Preview" class="img-fluid"/>
          <div v-else class="text-muted">No preview yet</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import stripJsonComments from 'strip-json-comments'

// Two-pane JSON(c) editor + live image preview.
// Left: JSON(c) textarea with validation and error styling.
// Right: Image preview that refreshes on valid input via POST /api/v1/image.
const defaultJson = `{
  "format": "png",
  "quality": 90,
  "canvas": { "width": 1024, "height": 1024 },
  "steps": [
    { "action": "draw_image", "x": 0, "y": 0, "width": 1024, "height": 1024, "source": "https://placehold.co/1024x1024.png" },
    { "action": "write_text", "x": 200, "y": 200, "width": 600, "height": 600, "text": "Hello World", "font": "Comic Sans MS", "font_size": 40, "color": "#FF0000" },
    { "action": "write_text", "x": 20, "y": 964, "width": 964, "height": 40, "text": "Copyright (c) your app", "font": "Arial", "font_size": 20, "color": "#00FF00", "align": "right", "valign": "center", "line_break": false }
  ]
}`

const jsonc = ref<string>(defaultJson)
const imageUrl = ref<string>('')
const isLoading = ref(false)
const hasError = ref(false)
const errorMessage = ref('')

let debounceTimer: any

watch(jsonc, () => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(async () => {
    await refreshPreview()
  }, 400)
})

async function refreshPreview() {
  try {
    hasError.value = false
    errorMessage.value = ''
    const payload = JSON.parse(stripJsonComments(jsonc.value))
    isLoading.value = true

    const res = await fetch('/api/v1/image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const blob = await res.blob()
    imageUrl.value = URL.createObjectURL(blob)
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


