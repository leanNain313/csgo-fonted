<template>
  <a-auto-complete
    v-model:value="inputValue"
    :options="options"
    :placeholder="placeholder"
    :get-popup-container="popupContainer"
    :dropdown-match-select-width="true"
    allow-clear
    @search="handleSearch"
    @select="handleSelect"
    style="width: 100%"
  />
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { suggestMarketItems } from '@/api/marketItem'
import type { MarketItemVO } from '@/types'

const props = defineProps<{
  modelValue?: string
  categoryL2Id?: number
  placeholder?: string
  inModal?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  select: [item: MarketItemVO]
}>()

const inputValue = ref(props.modelValue || '')
const options = ref<{ value: string; item: MarketItemVO; label?: string }[]>([])
let timer: ReturnType<typeof setTimeout> | null = null
let abortController: AbortController | null = null

const popupContainer = (trigger: HTMLElement) => {
  if (props.inModal) {
    return (trigger.closest('.ant-modal-body') as HTMLElement) || document.body
  }
  return document.body
}

watch(() => props.modelValue, (v) => {
  inputValue.value = v || ''
})

watch(() => props.categoryL2Id, () => {
  options.value = []
})

const handleSearch = (keyword: string) => {
  emit('update:modelValue', keyword)
  if (timer) clearTimeout(timer)
  timer = setTimeout(async () => {
    if (!keyword || keyword.length < 1) {
      options.value = []
      return
    }
    if (abortController) abortController.abort()
    abortController = new AbortController()
    const { signal } = abortController
    try {
      const list = await suggestMarketItems(keyword, props.categoryL2Id, 20, signal)
      if (signal.aborted) return
      options.value = list.map(item => ({
        value: item.name,
        label: item.marketHashName ? `${item.name} (${item.marketHashName})` : item.name,
        item
      }))
    } catch (e: unknown) {
      const err = e as { code?: string; name?: string }
      if (err?.code === 'ERR_CANCELED' || err?.name === 'CanceledError') return
      options.value = []
    }
  }, 300)
}

const handleSelect = (value: string, option: { item?: MarketItemVO }) => {
  const item = option?.item ?? options.value.find(o => o.value === value)?.item
  if (!item) return
  inputValue.value = item.name
  emit('update:modelValue', item.name)
  emit('select', item)
}
</script>
