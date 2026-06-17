<template>
  <a-form
    :model="formState"
    :label-col="labelCol"
    :wrapper-col="wrapperCol"
    @finish="handleSubmit"
  >
    <a-form-item label="饰品分类" name="categoryPath" :rules="[{ required: true, message: '请选择分类' }]">
      <a-cascader
        v-model:value="formState.categoryPath"
        :options="cascaderOptions"
        placeholder="选择一级/二级分类"
        @change="onCategoryChange"
      />
    </a-form-item>

    <a-form-item label="饰品名称" name="itemName" :rules="[{ required: true, message: '请从目录选择饰品' }]">
      <ItemNameAutoComplete
        v-model="formState.itemName"
        :category-l2-id="formState.categoryL2Id"
        placeholder="输入搜索，必须从目录选择"
        @select="onItemSelect"
      />
    </a-form-item>

    <a-form-item label="计数类型" name="counterType" :rules="[{ required: true, message: '请选择计数类型' }]">
      <a-select v-model:value="formState.counterType" placeholder="请选择计数类型">
        <a-select-option value="普通">普通</a-select-option>
        <a-select-option value="StatTrak">StatTrak</a-select-option>
      </a-select>
    </a-form-item>

    <a-form-item label="磨损程度" name="wearLevel" :rules="[{ required: true, message: '请选择磨损程度' }]">
      <a-select v-model:value="formState.wearLevel" placeholder="请选择磨损程度">
        <a-select-option value="崭新出厂">崭新出厂</a-select-option>
        <a-select-option value="略有磨损">略有磨损</a-select-option>
        <a-select-option value="久经沙场">久经沙场</a-select-option>
        <a-select-option value="破损不堪">破损不堪</a-select-option>
        <a-select-option value="战痕累累">战痕累累</a-select-option>
      </a-select>
    </a-form-item>

    <a-form-item label="购入价格" name="price" :rules="[{ required: true, message: '请输入购入价格' }]">
      <a-input-number
        v-model:value="formState.price"
        :min="0.01"
        :precision="2"
        style="width: 100%"
        placeholder="请输入购入价格"
      />
    </a-form-item>

    <a-form-item label="购入时间" name="transactionTime" :rules="[{ required: true, message: '请选择购入时间' }]">
      <a-date-picker
        v-model:value="formState.transactionTime"
        show-time
        format="YYYY-MM-DD HH:mm"
        style="width: 100%"
        placeholder="请选择购入时间"
      />
    </a-form-item>

    <a-form-item :wrapper-col="isMobile ? { span: 24 } : { offset: 6, span: 12 }">
      <a-space :style="{ width: isMobile ? '100%' : 'auto' }">
        <a-button type="primary" html-type="submit" :loading="loading" :block="isMobile">提交</a-button>
        <a-button @click="handleReset" :block="isMobile">重置</a-button>
      </a-space>
    </a-form-item>
  </a-form>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { message } from 'ant-design-vue'
import { purchaseItem } from '@/api/item'
import { getCategoryTree } from '@/api/itemCategory'
import ItemNameAutoComplete from '@/components/ItemNameAutoComplete.vue'
import type { ItemCategoryVO, MarketItemVO } from '@/types'
import dayjs, { Dayjs } from 'dayjs'
import { useWindowSize } from '@/hooks/useWindowSize'

const { isMobile } = useWindowSize()
const loading = ref(false)
const categoryTree = ref<ItemCategoryVO[]>([])

const labelCol = computed(() => isMobile.value ? { span: 24 } : { span: 6 })
const wrapperCol = computed(() => isMobile.value ? { span: 24 } : { span: 12 })

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

const formState = reactive<{
  categoryPath: number[]
  categoryL2Id?: number
  goodId?: number
  itemName: string
  counterType: string
  wearLevel: string
  price: number | undefined
  transactionTime: Dayjs | undefined
}>({
  categoryPath: [],
  itemName: '',
  counterType: '普通',
  wearLevel: '崭新出厂',
  price: undefined,
  transactionTime: undefined
})

const onCategoryChange = () => {
  formState.categoryL2Id = formState.categoryPath?.[1]
  formState.itemName = ''
  formState.goodId = undefined
}

const onItemSelect = (item: MarketItemVO) => {
  formState.goodId = item.goodId
  formState.itemName = item.name
  if (item.wearLevel) formState.wearLevel = item.wearLevel
  if (item.isStattrak) formState.counterType = 'StatTrak'
}

const handleSubmit = async () => {
  if (!formState.goodId) {
    message.error('请从目录中选择饰品')
    return
  }
  loading.value = true
  try {
    await purchaseItem({
      goodId: formState.goodId,
      categoryL2Id: formState.categoryL2Id!,
      itemName: formState.itemName,
      counterType: formState.counterType,
      wearLevel: formState.wearLevel,
      price: formState.price!,
      transactionTime: formState.transactionTime!.format('YYYY-MM-DD HH:mm:ss')
    })
    message.success('购入成功')
    handleReset()
  } finally {
    loading.value = false
  }
}

const handleReset = () => {
  formState.categoryPath = []
  formState.categoryL2Id = undefined
  formState.goodId = undefined
  formState.itemName = ''
  formState.counterType = '普通'
  formState.wearLevel = '崭新出厂'
  formState.price = undefined
  formState.transactionTime = undefined
}

onMounted(async () => {
  categoryTree.value = await getCategoryTree()
})
</script>
