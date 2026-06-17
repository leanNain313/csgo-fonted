<template>
  <div>
    <a-row :gutter="16">
      <a-col :span="8">
        <a-card title="一级分类" size="small">
          <a-menu
            v-model:selectedKeys="selectedL1"
            mode="inline"
            @click="onL1Select"
          >
            <a-menu-item v-for="cat in categoryTree" :key="cat.id">
              {{ cat.categoryName }}
            </a-menu-item>
          </a-menu>
        </a-card>
      </a-col>
      <a-col :span="16">
        <a-card title="二级分类" size="small">
          <a-table
            :columns="l2Columns"
            :data-source="level2List"
            :loading="loading"
            row-key="id"
            size="small"
            :pagination="false"
          />
        </a-card>
      </a-col>
    </a-row>

    <a-divider>旧类型绑定（兼容历史数据）</a-divider>
    <a-table
      :columns="legacyColumns"
      :data-source="itemTypes"
      row-key="id"
      size="small"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'bind'">
          <a-select
            :value="getBoundCategory(record.id)"
            placeholder="绑定二级分类"
            style="width: 200px"
            allow-clear
            @change="(v: number) => handleBind(record.id, v)"
          >
            <a-select-option v-for="c in allLevel2" :key="c.id" :value="c.id">
              {{ c.categoryName }}
            </a-select-option>
          </a-select>
        </template>
      </template>
    </a-table>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { message } from 'ant-design-vue'
import { getCategoryTree } from '@/api/itemCategory'
import { getItemTypeList, bindItemTypeCategory } from '@/api/itemType'
import type { ItemCategoryVO, ItemType } from '@/types'

const categoryTree = ref<ItemCategoryVO[]>([])
const level2List = ref<ItemCategoryVO[]>([])
const itemTypes = ref<ItemType[]>([])
const selectedL1 = ref<string[]>([])
const loading = ref(false)

const l2Columns = [
  { title: 'ID', dataIndex: 'id', width: 80 },
  { title: '分类名称', dataIndex: 'categoryName' },
  { title: '关联旧类型ID', dataIndex: 'legacyItemTypeId', width: 120 }
]

const legacyColumns = [
  { title: '旧类型', dataIndex: 'typeName' },
  { title: '绑定新分类', key: 'bind' }
]

const allLevel2 = computed(() =>
  categoryTree.value.flatMap(l1 => l1.children || [])
)

const getBoundCategory = (typeId: number) => {
  const cat = allLevel2.value.find(c => c.legacyItemTypeId === typeId)
  return cat?.id
}

const loadData = async () => {
  loading.value = true
  try {
    categoryTree.value = await getCategoryTree()
    itemTypes.value = await getItemTypeList()
    if (categoryTree.value.length > 0) {
      selectedL1.value = [String(categoryTree.value[0].id)]
      level2List.value = categoryTree.value[0].children || []
    }
  } finally {
    loading.value = false
  }
}

const onL1Select = ({ key }: { key: string }) => {
  const l1 = categoryTree.value.find(c => String(c.id) === key)
  level2List.value = l1?.children || []
}

const handleBind = async (typeId: number, categoryL2Id: number) => {
  await bindItemTypeCategory(typeId, categoryL2Id)
  message.success('绑定成功')
  await loadData()
}

onMounted(loadData)
</script>
