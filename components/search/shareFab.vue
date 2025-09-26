<template>
  <div>
    <div class="share-fab">
      <UButton class="cursor-pointer" :loading="loading" icon="i-lucide-share-2" variant="soft" @click="onShare"
        aria-label="Share this page">
        Share Results
      </UButton>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { useToast } from '#imports'

const props = defineProps<{
  url?: string
  title?: string
  text?: string
}>()

const loading = ref(false)
const toast = useToast()

const getData = () => {
  const href = typeof window !== 'undefined' ? window.location.href : ''
  const pageTitle = typeof document !== 'undefined' ? document.title : ''
  return {
    title: props.title ?? pageTitle ?? 'Check this out',
    text: props.text ?? 'Check this out!',
    url: props.url ?? href
  }
}

const onShare = async () => {
  if (typeof window === 'undefined') return
  loading.value = true
  const data = getData()

  try {
    if ('share' in navigator && typeof (navigator as any).share === 'function') {
      await (navigator as any).share(data)
      toast.add({
        title: 'Shared',
        description: 'Thanks for spreading the word!',
        icon: 'i-lucide-check-circle'
      })
    } else {
      await navigator.clipboard.writeText(data.url)
      toast.add({
        title: 'Link copied',
        description: 'Paste it anywhere to share.',
        icon: 'i-lucide-clipboard-check'
      })
    }
  } catch {
    toast.add({
      title: 'Share canceled',
      color: 'warning',
      icon: 'i-lucide-x-circle'
    })
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped></style>