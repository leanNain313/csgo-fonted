<template>
  <div>
    <a-space direction="vertical" style="width: 100%" :size="isMobile ? 12 : 16">
      <a-alert message="批量购入需从目录选择饰品，共享下方分类筛选" type="info" show-icon />

      <a-form-item label="默认分类">
        <a-cascader
          v-model:value="defaultCategoryPath"
          :options="cascaderOptions"
          placeholder="选择一级/二级分类"
          style="width: 300px"
          @change="onDefaultCategoryChange"
        />
      </a-form-item>

      <a-button type="primary" @click="handleAddItem" :block="isMobile">
        <PlusOutlined /> 添加饰品
      </a-button>

      <a-table :columns="columns" :data-source="items" :pagination="false" row-key="key" :scroll="{ x: 1000 }">
        <template #bodyCell="{ column, record, index }">
          <template v-if="column.key === 'itemName'">
            <ItemNameAutoComplete
              v-model="record.itemName"
              :category-l2-id="record.categoryL2Id || defaultCategoryL2Id"
              placeholder="搜索目录饰品"
              @select="(item) => onItemSelect(record, item)"
            />
          </template>
          <template v-if="column.key === 'counterType'">
            <a-select v-model:value="record.counterType" style="width: 100%">
              <a-select-option value="普通">普通</a-select-option>
              <a-select-option value="StatTrak">StatTrak</a-select-option>
            </a-select>
          </template>
          <template v-if="column.key === 'wearLevel'">
            <a-select v-model:value="record.wearLevel" style="width: 100%">
              <a-select-option value="崭新出厂">崭新出厂</a-select-option>
              <a-select-option value="略有磨损">略有磨损</a-select-option>
              <a-select-option value="久经沙场">久经沙场</a-select-option>
              <a-select-option value="破损不堪">破损不堪</a-select-option>
              <a-select-option value="战痕累累">战痕累累</a-select-option>
            </a-select>
          </template>
          <template v-if="column.key === 'price'">
            <a-input-number v-model:value="record.price" :min="0.01" :precision="2" style="width: 100%" />
          </template>
          <template v-if="column.key === 'transactionTime'">
            <a-date-picker v-model:value="record.transactionTime" show-time format="YYYY-MM-DD HH:mm" style="width: 100%" />
          </template>
          <template v-if="column.key === 'action'">
            <a-button type="link" danger @click="handleRemoveItem(index)">删除</a-button>
          </template>
        </template>
      </a-table>

      <a-button type="primary" size="large" @click="handleSubmit" :loading="loading" :disabled="items.length === 0" block>
        批量提交（共 {{ items.length }} 个）
      </a-button>
    </a-space>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { PlusOutlined } from '@ant-design/icons-vue'
import { batchPurchaseItems } from '@/api/item'
import { getCategoryTree } from '@/api/itemCategory'
import ItemNameAutoComplete from '@/components/ItemNameAutoComplete.vue'
import type { ItemCategoryVO, MarketItemVO } from '@/types'
import dayjs from 'dayjs'
import { useWindowSize } from '@/hooks/useWindowSize'

const { isMobile } = useWindowSize()
const loading = ref(false)
const categoryTree = ref<ItemCategoryVO[]>([])
const defaultCategoryPath = ref<number[]>([])
const defaultCategoryL2Id = ref<number>()
const items = ref<any[]>([])

const cascaderOptions = computed(() =>
  categoryTree.value.map(l1 => ({
    value: l1.id,
    label: l1.categoryName,
    children: (l1.children || []).map(l2 => ({ value: l2.id, label: l2.categoryName }))
  }))
)

const columns = [
  { title: '饰品名称', key: 'itemName', width: 220 },
  { title: '计数类型', key: 'counterType', width: 110 },
  { title: '磨损程度', key: 'wearLevel', width: 110 },
  { title: '购入价格', key: 'price', width: 110 },
  { title: '购入时间', key: 'transactionTime', width: 180 },
  { title: '操作', key: 'action', width: 80 }
]

const onDefaultCategoryChange = () => {
  defaultCategoryL2Id.value = defaultCategoryPath.value?.[1]
}

const onItemSelect = (record: any, item: MarketItemVO) => {
  record.goodId = item.goodId
  record.itemName = item.name
  record.categoryL2Id = item.categoryL2Id || defaultCategoryL2Id.value
  if (item.wearLevel) record.wearLevel = item.wearLevel
  if (item.isStattrak) record.counterType = 'StatTrak'
}

const handleAddItem = () => {
  if (!defaultCategoryL2Id.value) {
    message.warning('请先选择默认分类')
    return
  }
  items.value.push({
    key: Date.now(),
    itemName: '',
    goodId: undefined,
    categoryL2Id: defaultCategoryL2Id.value,
    counterType: '普通',
    wearLevel: '崭新出厂',
    price: undefined,
    transactionTime: dayjs()
  })
}

const handleRemoveItem = (index: number) => items.value.splice(index, 1)

const handleSubmit = async () => {
  for (let i = 0; i < items.value.length; i++) {
    const item = items.value[i]
    if (!item.goodId) {
      message.error(`第 ${i + 1} 行：请从目录选择饰品`)
      return
    }
  }
  loading.value = true
  try {
    await batchPurchaseItems({
      items: items.value.map(item => ({
        goodId: item.goodId,
        categoryL2Id: item.categoryL2Id,
        itemName: item.itemName,
        counterType: item.counterType,
        wearLevel: item.wearLevel,
        price: item.price,
        transactionTime: item.transactionTime.format('YYYY-MM-DD HH:mm:ss')
      }))
    })
    message.success(`批量购入成功，共 ${items.value.length} 个`)
    items.value = []
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  categoryTree.value = await getCategoryTree()
})
</script>
