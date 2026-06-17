<template>
  <a-modal
    v-model:open="visible"
    title="绑定目录饰品"
    :width="520"
    destroy-on-close
    @ok="handleOk"
    @cancel="handleCancel"
  >
    <a-form :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
      <a-form-item label="饰品分类">
        <a-cascader
          v-model:value="categoryPath"
          :options="cascaderOptions"
          placeholder="选择一级/二级分类（可选）"
          allow-clear
          style="width: 100%"
          @change="onCategoryChange"
        />
      </a-form-item>
      <a-form-item label="饰品名称" required>
        <ItemNameAutoComplete
          v-model="itemName"
          :category-l2-id="categoryL2Id"
          in-modal
          placeholder="输入搜索，必须从目录选择"
          @select="onItemSelect"
        />
      </a-form-item>
      <a-form-item v-if="selectedGoodId" label="Good ID">
        <span>{{ selectedGoodId }}</span>
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { message } from 'ant-design-vue'
import { getCategoryTree } from '@/api/itemCategory'
import ItemNameAutoComplete from '@/components/ItemNameAutoComplete.vue'
import type { ItemCategoryVO, MarketItemVO } from '@/types'

const props = defineProps<{
  open: boolean
  defaultItemName?: string
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  confirm: [payload: { goodId: number; itemName: string }]
}>()

const visible = computed({
  get: () => props.open,
  set: (v) => emit('update:open', v)
})

const categoryTree = ref<ItemCategoryVO[]>([])
const categoryPath = ref<number[]>([])
const categoryL2Id = ref<number>()
const itemName = ref('')
const selectedGoodId = ref<number>()

const cascaderOptions = computed(() =>
  categoryTree.value.map(l1 => ({
    value: l1.id,
    label: l1.categoryName,
    children: (l1.children || []).map(l2 => ({
      value: l2.id,
      label: l2.categoryName
    }))
  }))
)

const resetForm = () => {
  categoryPath.value = []
  categoryL2Id.value = undefined
  itemName.value = props.defaultItemName || ''
  selectedGoodId.value = undefined
}

watch(() => props.open, async (open) => {
  if (open) {
    resetForm()
    if (!categoryTree.value.length) {
      categoryTree.value = await getCategoryTree()
    }
  }
})

const onCategoryChange = () => {
  categoryL2Id.value = categoryPath.value?.[1]
  itemName.value = ''
  selectedGoodId.value = undefined
}

const onItemSelect = (item: MarketItemVO) => {
  selectedGoodId.value = item.goodId
  itemName.value = item.name
}

const handleOk = () => {
  if (!selectedGoodId.value) {
    message.warning('请从目录中搜索并选择饰品')
    return
  }
  emit('confirm', { goodId: selectedGoodId.value, itemName: itemName.value })
}

const handleCancel = () => {
  visible.value = false
}
</script>
