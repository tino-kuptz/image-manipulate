<template>
  <div class="border rounded d-flex align-items-center justify-content-center p-2 flex-fill w-100"
    style="min-height: 320px; background: #f8f9fa;">
    <template v-if="json">
      <pre class="m-0 w-100 small text-start"
        style="white-space: pre-wrap; word-break: break-word; max-height: 70vh; overflow: auto;">
{{ json }}
      </pre>
    </template>
    <img v-else-if="src" :src="src" alt="Preview" class="img-fluid" />
    <div v-else class="text-muted">No preview yet</div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ src?: string; json?: string }>()
</script>