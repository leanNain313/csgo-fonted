<template>
  <div>
    <a-form layout="inline" style="margin-bottom: 16px">
      <a-form-item label="关键词">
        <a-input v-model:value="keyword" placeholder="名称/hash" allow-clear />
      </a-form-item>
      <a-form-item label="一级分类">
        <a-select v-model:value="categoryL1Id" style="width: 140px" allow-clear placeholder="全部">
          <a-select-option v-for="c in categoryTree" :key="c.id" :value="c.id">{{ c.categoryName }}</a-select-option>
        </a-select>
      </a-form-item>
      <a-form-item>
        <a-button type="primary" @click="loadData">查询</a-button>
        <a-button style="margin-left: 8px" :loading="importing" @click="handleImport">导入本地JSON</a-button>
      </a-form-item>
    </a-form>

    <a-table
      :columns="columns"
      :data-source="dataSource"
      :loading="loading"
      :pagination="pagination"
      row-key="id"
      @change="onTableChange"
      :scroll="{ x: 900 }"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'status'">
          <a-tag :color="record.status === 1 ? 'green' : 'red'">{{ record.status === 1 ? '启用' : '停用' }}</a-tag>
        </template>
        <template v-if="column.key === 'action'">
          <a-button type="link" size="small" @click="toggleStatus(record)">
            {{ record.status === 1 ? '停用' : '启用' }}
          </a-button>
        </template>
      </template>
    </a-table>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { getMarketItemPage, importMarketCatalog, updateMarketItemStatus } from '@/api/marketItem'
import { getCategoryTree } from '@/api/itemCategory'
import type { MarketItemVO, ItemCategoryVO } from '@/types'

const keyword = ref('')
const categoryL1Id = ref<number>()
const loading = ref(false)
const importing = ref(false)
const dataSource = ref<MarketItemVO[]>([])
const categoryTree = ref<ItemCategoryVO[]>([])

const pagination = reactive({
  current: 1,
  pageSize: 20,
  total: 0,
  showSizeChanger: true
})

const columns = [
  { title: 'Good ID', dataIndex: 'goodId', width: 90 },
  { title: '饰品名称', dataIndex: 'name', ellipsis: true },
  { title: '一级分类', dataIndex: 'categoryL1Name', width: 100 },
  { title: '二级分类', dataIndex: 'categoryL2Name', width: 120 },
  { title: '磨损', dataIndex: 'wearLevel', width: 100 },
  { title: '状态', key: 'status', width: 80 },
  { title: '操作', key: 'action', width: 80 }
]

const loadData = async () => {
  loading.value = true
  try {
    const res = await getMarketItemPage({
      current: pagination.current,
      size: pagination.pageSize,
      keyword: keyword.value || undefined,
      categoryL1Id: categoryL1Id.value
    })
    dataSource.value = res.records
    pagination.total = res.total
  } finally {
    loading.value = false
  }
}

const onTableChange = (pag: any) => {
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize
  loadData()
}

const handleImport = async () => {
  importing.value = true
  try {
    const res = await importMarketCatalog()
    message.success(`导入完成：新增 ${res.inserted}，更新 ${res.updated}`)
    loadData()
  } finally {
    importing.value = false
  }
}

const toggleStatus = async (record: MarketItemVO) => {
  const newStatus = record.status === 1 ? 0 : 1
  await updateMarketItemStatus(record.id, newStatus)
  message.success('状态已更新')
  loadData()
}

onMounted(async () => {
  categoryTree.value = await getCategoryTree()
  loadData()
})
</script>
