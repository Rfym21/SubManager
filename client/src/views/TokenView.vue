<template>
  <div class="h-screen p-4 pb-8 overflow-y-auto w-full max-w-[720px] mx-auto">
    <h1 class="text-xl font-semibold text-center my-6" style="color: #1d1d1f;">令牌管理</h1>

    <!-- 操作栏：分页器 + 添加按钮 -->
    <div class="action-bar">
      <div v-if="totalPages > 1" class="pagination">
        <button
          class="page-btn"
          :disabled="currentPage === 1"
          @click="currentPage--"
        >上一页</button>
        <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
        <button
          class="page-btn"
          :disabled="currentPage === totalPages"
          @click="currentPage++"
        >下一页</button>
      </div>
      <div v-else class="pagination-placeholder"></div>
      <button class="page-btn add-btn" @click="showAddDialog">添加令牌</button>
    </div>

    <!-- Token 卡片 -->
    <div class="token-cards-grid">
      <div
        v-for="token in paginatedTokens"
        :key="token.name"
        class="token-card"
        :class="{ 'token-card-disabled': token.status === false }"
        @click="editToken(token)"
      >
        <div class="token-card-header">
          <span class="token-card-title">{{ token.name }}</span>
          <span class="token-card-status">{{ token.status === false ? '已禁用' : '启用中' }}</span>
        </div>
        <div class="token-card-token">{{ token.token }}</div>
        <div class="token-card-subs">{{ getTokenSubText(token) }}</div>
      </div>
    </div>

    <!-- 添加/编辑 Token 弹窗 -->
    <van-dialog
      v-model:show="tokenDialog.show"
      :title="tokenDialog.isEdit ? '编辑 Token' : '添加令牌'"
      show-cancel-button
      @confirm="submitToken"
      class="token-dialog"
    >
      <van-cell-group inset class="my-4">
        <van-field
          v-model="tokenDialog.form.name"
          label="名称"
          placeholder="Token 名称"
          :disabled="tokenDialog.isEdit"
        />
      </van-cell-group>

      <!-- 订阅选择 -->
      <div class="px-4 pb-2">
        <div class="subs-mode-group">
          <button
            type="button"
            class="subs-mode-btn"
            :class="{ active: tokenDialog.form.subscriptionMode !== 'deny' }"
            @click="setSubscriptionMode('allow')"
          >
            可用分组模式
          </button>
          <button
            type="button"
            class="subs-mode-btn"
            :class="{ active: tokenDialog.form.subscriptionMode === 'deny' }"
            @click="setSubscriptionMode('deny')"
          >
            不可用分组模式
          </button>
        </div>
        <div class="subs-label">
          {{
            tokenDialog.form.subscriptionMode === 'deny'
              ? '不可用分组（不选则全部可用）'
              : '可用分组（不选则全部可用）'
          }}
        </div>
        <div class="subs-checkbox-group">
          <label
            v-for="sub in allSubLinks"
            :key="sub.filename"
            class="sub-checkbox"
          >
            <input
              type="checkbox"
              :value="sub.filename"
              v-model="tokenDialog.form.subscriptions"
            />
            <span>{{ sub.remark || sub.filename }}</span>
          </label>
        </div>
      </div>

      <div v-if="tokenDialog.isEdit" class="px-4 pb-4 flex flex-col gap-3">
        <div class="token-display">
          <span class="token-display-label">Token:</span>
          <span class="token-display-value">{{ tokenDialog.form.token }}</span>
          <button class="copy-btn" @click="copyToken">复制</button>
        </div>
        <button @click="toggleTokenStatus" class="mac-btn secondary w-full">
          {{ tokenDialog.form.status === false ? '启用此 Token' : '禁用此 Token' }}
        </button>
        <button @click="removeToken" class="mac-btn danger w-full">删除此 Token</button>
      </div>
    </van-dialog>

    <!-- 浮动球组件 -->
    <FloatingBall />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { showToast, showConfirmDialog } from 'vant';
import {
  getTokens,
  addToken,
  updateToken,
  deleteToken,
  getSubLinks
} from '../api/axios.js';
import FloatingBall from '../components/FloatingBall.vue';
import isMobileDevice from '../lib/isMobileDevice.js';

// Token 列表
const tokens = ref([]);

// 所有订阅链接（用于选择）
const allSubLinks = ref([]);

// 分页状态（移动端每页5条，桌面端每页10条）
const currentPage = ref(1);
const pageSize = isMobileDevice() ? 5 : 10;

// 总页数
const totalPages = computed(() => {
  return Math.ceil(tokens.value.length / pageSize);
});

// 当前页的 Token
const paginatedTokens = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  const end = start + pageSize;
  return tokens.value.slice(start, end);
});

// Token 弹窗
const tokenDialog = reactive({
  show: false,
  isEdit: false,
  originalName: '',
  form: {
    name: '',
    token: '',
    status: true,
    subscriptions: [],
    subscriptionMode: 'allow'
  }
});

// 加载 tokens
const loadTokens = async () => {
  const res = await getTokens();
  if (res.status) {
    tokens.value = res.data;
  } else {
    showToast('加载 Token 列表失败');
  }
};

// 加载订阅链接
const loadSubLinks = async () => {
  const res = await getSubLinks();
  if (res.status) {
    allSubLinks.value = res.data;
  }
};

// 显示添加弹窗
const showAddDialog = () => {
  tokenDialog.isEdit = false;
  tokenDialog.form = { name: '', token: '', status: true, subscriptions: [], subscriptionMode: 'allow' };
  tokenDialog.show = true;
};

// 编辑 Token
const editToken = (token) => {
  tokenDialog.isEdit = true;
  tokenDialog.originalName = token.name;
  tokenDialog.form = {
    name: token.name,
    token: token.token,
    status: token.status,
    subscriptions: [...(token.subscriptions || [])],
    subscriptionMode: token.subscriptionMode === 'deny' ? 'deny' : 'allow'
  };
  tokenDialog.show = true;
};

const setSubscriptionMode = (mode) => {
  tokenDialog.form.subscriptionMode = mode === 'deny' ? 'deny' : 'allow'
}

const getTokenSubText = (token) => {
  const mode = token.subscriptionMode === 'deny' ? 'deny' : 'allow'
  const count = token.subscriptions?.length || 0
  if (mode === 'deny') {
    return count ? `${count} 个不可用分组` : '全部分组可用'
  }
  return count ? `${count} 个可用分组` : '全部分组可用'
}

// 提交 Token
const submitToken = async () => {
  const { isEdit, originalName, form } = tokenDialog;
  let res;
  if (isEdit) {
    res = await updateToken(originalName, {
      subscriptions: form.subscriptions,
      subscriptionMode: form.subscriptionMode
    });
  } else {
    res = await addToken({
      name: form.name,
      subscriptions: form.subscriptions,
      subscriptionMode: form.subscriptionMode
    });
  }
  if (res.status) {
    showToast(isEdit ? '修改成功' : '添加成功');
    loadTokens();
  } else {
    showToast(res.message || '操作失败');
  }
};

// 切换 Token 状态
const toggleTokenStatus = async () => {
  const newStatus = tokenDialog.form.status === false ? true : false;
  const res = await updateToken(tokenDialog.originalName, { status: newStatus });
  if (res.status) {
    tokenDialog.form.status = newStatus;
    showToast(newStatus ? '已启用' : '已禁用');
    loadTokens();
  } else {
    showToast(res.message || '操作失败');
  }
};

// 删除 Token
const removeToken = async () => {
  showConfirmDialog({ title: '确认删除此 Token？' }).then(async () => {
    const res = await deleteToken(tokenDialog.originalName);
    if (res.status) {
      showToast('删除成功');
      tokenDialog.show = false;
      await loadTokens();
      // 如果当前页没有数据且不是第一页，跳转到上一页
      if (paginatedTokens.value.length === 0 && currentPage.value > 1) {
        currentPage.value--;
      }
    } else {
      showToast(res.message || '删除失败');
    }
  }).catch(() => { });
};

// 复制 Token
const copyToken = () => {
  navigator.clipboard.writeText(tokenDialog.form.token);
  showToast('已复制');
};

onMounted(() => {
  loadTokens();
  loadSubLinks();
});
</script>

<style scoped>
/* 操作栏 */
.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.pagination-placeholder {
  flex: 1;
}

/* 分页器样式 */
.pagination {
  display: flex;
  align-items: center;
  gap: 12px;
}

.page-btn {
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.8);
  color: #1d1d1f;
  transition: all 0.15s ease;
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.page-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.95);
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-info {
  font-size: 13px;
  color: #86868b;
}

.add-btn {
  background: #1d1d1f;
  color: #fff;
}

.add-btn:hover {
  background: #000;
}

/* Token 卡片网格 */
.token-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
}

.token-card {
  background: rgba(255, 255, 255, 0.8);
  border-radius: 12px;
  padding: 14px 16px;
  cursor: pointer;
  transition: all 0.15s ease;
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  min-height: 90px;
}

.token-card:hover {
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}

.token-card:active {
  background: rgba(0, 0, 0, 0.03);
  transform: translateY(0);
}

.token-card-disabled {
  opacity: 0.5;
}

.token-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.token-card-title {
  font-weight: 600;
  font-size: 15px;
  color: #1d1d1f;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  margin-right: 10px;
}

.token-card-status {
  font-size: 12px;
  color: #86868b;
  flex-shrink: 0;
  background: rgba(0, 0, 0, 0.05);
  padding: 2px 8px;
  border-radius: 10px;
}

.token-card-token {
  font-size: 11px;
  color: #86868b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 4px;
  font-family: monospace;
}

.token-card-subs {
  font-size: 12px;
  color: #1d1d1f;
  margin-top: auto;
}

/* 订阅选择 */
.subs-label {
  font-size: 13px;
  color: #86868b;
  margin-bottom: 8px;
}

.subs-mode-group {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.subs-mode-btn {
  border: 1px solid rgba(0, 0, 0, 0.1);
  background: rgba(255, 255, 255, 0.8);
  color: #1d1d1f;
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 6px;
  cursor: pointer;
}

.subs-mode-btn.active {
  background: #1d1d1f;
  color: #fff;
  border-color: #1d1d1f;
}

.subs-checkbox-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  max-height: 150px;
  overflow-y: auto;
}

.sub-checkbox {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #1d1d1f;
  cursor: pointer;
  background: rgba(0, 0, 0, 0.03);
  padding: 4px 10px;
  border-radius: 6px;
}

.sub-checkbox input {
  cursor: pointer;
}

/* Token 显示 */
.token-display {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(0, 0, 0, 0.03);
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 12px;
}

.token-display-label {
  color: #86868b;
  flex-shrink: 0;
}

.token-display-value {
  color: #1d1d1f;
  font-family: monospace;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.copy-btn {
  background: #1d1d1f;
  color: #fff;
  border: none;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  flex-shrink: 0;
}

.copy-btn:hover {
  background: #000;
}

/* macOS 风格按钮 */
.mac-btn {
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.15s ease;
}

.mac-btn:active {
  opacity: 0.7;
}

.mac-btn.secondary {
  background: #f5f5f7;
  color: #1d1d1f;
}

.mac-btn.secondary:hover {
  background: #e8e8ed;
}

.mac-btn.danger {
  background: #666;
  color: #fff;
}

.mac-btn.danger:hover {
  background: #333;
}
</style>

<!-- 弹窗样式需要非 scoped -->
<style>
.token-dialog {
  width: 90% !important;
  max-width: 480px !important;
  border-radius: 14px !important;
  overflow: hidden;
}

.token-dialog .van-dialog__header {
  padding: 20px 20px 10px;
  font-weight: 600;
  font-size: 17px;
  color: #1d1d1f;
}

.token-dialog .van-dialog__content {
  padding: 0;
}

.token-dialog .van-cell-group--inset {
  margin: 8px 16px 16px;
  border-radius: 10px;
  overflow: hidden;
}

.token-dialog .van-field__label {
  width: 70px;
  color: #1d1d1f;
}

.token-dialog .van-dialog__footer {
  padding: 0;
}

.token-dialog .van-dialog__cancel,
.token-dialog .van-dialog__confirm {
  height: 50px;
  font-size: 17px;
}

.token-dialog .van-dialog__confirm {
  color: #1d1d1f;
  font-weight: 500;
}

.token-dialog .van-dialog__cancel {
  color: #86868b;
}
</style>
