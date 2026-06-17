<template>
  <div class="user-panel" @click="emit('logout')">
    <div class="user-avatar">{{ initial }}</div>
    <div v-if="!collapsed" class="user-info">
      <div class="user-name">{{ user?.username || '未登录' }}</div>
      <div class="user-role">{{ roleLabel }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { AuthUser } from '@/utils/auth'
import { getRoleLabel, getUserInitial } from '@/utils/auth'

const props = defineProps<{
  user: AuthUser | null
  collapsed?: boolean
}>()

const emit = defineEmits<{
  logout: []
}>()

const initial = computed(() => getUserInitial(props.user?.username))
const roleLabel = computed(() => getRoleLabel(props.user?.role))
</script>

<style scoped>
.user-panel {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.2s;
}

.user-panel:hover {
  background: rgba(255, 255, 255, 0.06);
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #1677ff, #69b1ff);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  flex-shrink: 0;
}

.user-info {
  min-width: 0;
}

.user-name {
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-role {
  color: rgba(255, 255, 255, 0.55);
  font-size: 12px;
  margin-top: 2px;
}
</style>
