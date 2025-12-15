<template>
  <div class="min-h-screen p-4 pb-8 overflow-y-auto h-full w-full max-w-[720px] mx-auto">
    <h1 class="text-xl font-semibold text-center my-6" style="color: #1d1d1f;">订阅管理</h1>

    <!-- Tab切换 -->
    <van-tabs v-model:active="activeTab" class="pb-4 glass-tabs">
      <van-tab title="基础配置" class="mt-10">
        <!-- 基础配置 -->
        <van-cell-group class="rounded-lg">
          <van-field v-model="configForm.host" label="host" placeholder="host address" />
          <van-field v-model="configForm.subconverter" label="subconverter" placeholder="订阅转换地址" />
          <van-field v-model="configForm.filename" label="filename" placeholder="output filename" />
          <van-field v-model="configForm.exclude" label="exclude" placeholder="exclude keywords" type="textarea" rows="2" />
          <van-field v-model="configForm.sub_config" label="sub_config" placeholder="sub_config URL" />
        </van-cell-group>
        <button class="mac-btn primary mt-6 w-full" @click="saveConfig">保存配置</button>
      </van-tab>

      <van-tab title="订阅链接" class="mt-10">
        <!-- 订阅链接卡片 -->
        <div class="sub-cards-grid">
          <div
            v-for="link in sortedSubLinks"
            :key="link.filename"
            class="sub-card"
            @click="editSubLink(link)"
          >
            <div class="sub-card-header">
              <span class="sub-card-title">{{ link.filename }}</span>
              <span class="sub-card-weight">{{ link.weight }}</span>
            </div>
            <div class="sub-card-url">{{ link.url }}</div>
          </div>
        </div>
        <button class="mac-btn primary mt-6 w-full" @click="showAddDialog">添加订阅</button>
      </van-tab>
    </van-tabs>

    <!-- 添加/编辑订阅弹窗 -->
    <van-dialog
      v-model:show="subLinkDialog.show"
      :title="subLinkDialog.isEdit ? '编辑订阅' : '添加订阅'"
      show-cancel-button
      @confirm="submitSubLink"
      class="sub-dialog"
    >
      <van-cell-group inset class="my-4">
        <van-field v-model="subLinkDialog.form.filename" label="文件名" placeholder="如: my.txt"
          :disabled="subLinkDialog.isEdit" />
        <van-field v-model="subLinkDialog.form.url" label="URL" placeholder="订阅地址或 localhost" />
        <van-field v-model="subLinkDialog.form.weight" label="权重" type="number" placeholder="数字越大优先级越高" />
      </van-cell-group>
      <div v-if="subLinkDialog.isEdit" class="px-4 pb-4 flex flex-col gap-3">
        <button @click="editFileContent" class="mac-btn secondary w-full">编辑文件内容</button>
        <button @click="removeSubLink" class="mac-btn danger w-full">删除此订阅</button>
      </div>
    </van-dialog>

    <!-- 编辑文件内容弹窗 -->
    <van-dialog
      v-model:show="fileDialog.show"
      title="编辑文件内容"
      show-cancel-button
      @confirm="saveFileContent"
      class="sub-dialog"
    >
      <van-cell-group inset class="my-4">
        <van-field v-model="fileDialog.content" type="textarea" rows="10" placeholder="每行一条订阅链接" />
      </van-cell-group>
    </van-dialog>

    <!-- 浮动球组件 -->
    <FloatingBall />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { showToast, showConfirmDialog } from 'vant';
import {
  getConfig,
  updateConfig,
  getSubLinks,
  addSubLink,
  updateSubLink,
  deleteSubLink,
  getFileContent,
  updateFileContent
} from '../api/axios.js';
import FloatingBall from '../components/FloatingBall.vue';

const router = useRouter();

// Tab状态
const activeTab = ref(0);

// 基础配置
const configForm = reactive({
  host: '',
  subconverter: '',
  filename: '',
  exclude: '',
  sub_config: ''
});

// 订阅链接列表
const subLinks = ref([]);

// 按权重排序的订阅链接（权重高的在前）
const sortedSubLinks = computed(() => {
  return [...subLinks.value].sort((a, b) => b.weight - a.weight);
});

// 订阅链接弹窗
const subLinkDialog = reactive({
  show: false,
  isEdit: false,
  originalFilename: '',
  form: {
    filename: '',
    url: '',
    weight: 0
  }
});

// 文件编辑弹窗
const fileDialog = reactive({
  show: false,
  filename: '',
  content: ''
});

// 加载配置
const loadConfig = async () => {
  const res = await getConfig();
  if (res.status) {
    Object.assign(configForm, res.data);
  } else {
    showToast('加载配置失败');
  }
};

// 加载订阅链接
const loadSubLinks = async () => {
  const res = await getSubLinks();
  if (res.status) {
    subLinks.value = res.data;
  } else {
    showToast('加载订阅列表失败');
  }
};

// 保存配置
const saveConfig = async () => {
  const res = await updateConfig(configForm);
  if (res.status) {
    showToast('保存成功');
  } else {
    showToast(res.message || '保存失败');
  }
};

// 显示添加弹窗
const showAddDialog = () => {
  subLinkDialog.isEdit = false;
  subLinkDialog.form = { filename: '', url: '', weight: 0 };
  subLinkDialog.show = true;
};

// 编辑订阅链接
const editSubLink = (link) => {
  subLinkDialog.isEdit = true;
  subLinkDialog.originalFilename = link.filename;
  subLinkDialog.form = { ...link };
  subLinkDialog.show = true;
};

// 提交订阅链接
const submitSubLink = async () => {
  const { isEdit, originalFilename, form } = subLinkDialog;
  let res;
  if (isEdit) {
    res = await updateSubLink(originalFilename, form);
  } else {
    res = await addSubLink(form);
  }
  if (res.status) {
    showToast(isEdit ? '修改成功' : '添加成功');
    loadSubLinks();
  } else {
    showToast(res.message || '操作失败');
  }
};

// 删除订阅链接
const removeSubLink = async () => {
  showConfirmDialog({ title: '确认删除此订阅？' }).then(async () => {
    const res = await deleteSubLink(subLinkDialog.originalFilename);
    if (res.status) {
      showToast('删除成功');
      subLinkDialog.show = false;
      loadSubLinks();
    } else {
      showToast(res.message || '删除失败');
    }
  }).catch(() => { });
};

// 编辑文件内容
const editFileContent = async () => {
  const filename = subLinkDialog.form.filename;
  const res = await getFileContent(filename);
  if (res.status) {
    fileDialog.filename = filename;
    fileDialog.content = res.data.content;
    fileDialog.show = true;
  } else {
    fileDialog.filename = filename;
    fileDialog.content = '';
    fileDialog.show = true;
  }
};

// 保存文件内容
const saveFileContent = async () => {
  const res = await updateFileContent(fileDialog.filename, fileDialog.content);
  if (res.status) {
    showToast('保存成功');
  } else {
    showToast(res.message || '保存失败');
  }
};


onMounted(() => {
  loadConfig();
  loadSubLinks();
});
</script>

<style scoped>
:deep(.van-cell-group__title) {
  color: #1d1d1f;
  font-weight: 600;
  font-size: 13px;
}

:deep(.van-cell-group) {
  background-color: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 10px;
  border: 1px solid rgba(0, 0, 0, 0.08);
}

:deep(.van-field) {
  background-color: transparent;
}

:deep(.van-field__label) {
  color: #1d1d1f;
}

:deep(.van-button--primary) {
  background-color: #007aff;
  border-color: #007aff;
}

:deep(.van-button--success) {
  background-color: #34c759;
  border-color: #34c759;
}

/* Tab macOS 风格 */
.glass-tabs :deep(.van-tabs__wrap) {
  border-radius: 10px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.glass-tabs :deep(.van-tabs__nav) {
  background: transparent;
  position: relative;
  padding: 3px;
}

.glass-tabs :deep(.van-tab) {
  flex: 1;
  background: transparent;
  transition: color 0.2s ease;
  color: #666;
  z-index: 1;
  font-weight: 500;
  font-size: 14px;
}

.glass-tabs :deep(.van-tab--active) {
  color: #1d1d1f;
}

.glass-tabs :deep(.van-tabs__line) {
  height: calc(100% - 6px);
  width: calc(50% - 3px) !important;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  bottom: 3px;
  z-index: 0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* 订阅链接卡片网格 */
.sub-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
}

.sub-card {
  background: rgba(255, 255, 255, 0.8);
  border-radius: 10px;
  padding: 14px 16px;
  cursor: pointer;
  transition: all 0.15s ease;
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.sub-card:hover {
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.sub-card:active {
  background: rgba(0, 0, 0, 0.03);
}

.sub-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.sub-card-title {
  font-weight: 500;
  font-size: 14px;
  color: #1d1d1f;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  margin-right: 10px;
}

.sub-card-weight {
  font-size: 12px;
  color: #86868b;
  flex-shrink: 0;
}

.sub-card-url {
  font-size: 12px;
  color: #86868b;
  word-break: break-all;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
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

.mac-btn.primary {
  background: #007aff;
  color: #fff;
}

.mac-btn.primary:hover {
  background: #0071e3;
}

.mac-btn.secondary {
  background: #f5f5f7;
  color: #1d1d1f;
}

.mac-btn.secondary:hover {
  background: #e8e8ed;
}

.mac-btn.danger {
  background: #ff3b30;
  color: #fff;
}

.mac-btn.danger:hover {
  background: #e0342b;
}
</style>

<!-- 弹窗样式需要非 scoped -->
<style>
.sub-dialog {
  width: 90% !important;
  max-width: 480px !important;
  border-radius: 14px !important;
  overflow: hidden;
}

.sub-dialog .van-dialog__header {
  padding: 20px 20px 10px;
  font-weight: 600;
  font-size: 17px;
  color: #1d1d1f;
}

.sub-dialog .van-dialog__content {
  padding: 0;
}

.sub-dialog .van-cell-group--inset {
  margin: 8px 16px 16px;
  border-radius: 10px;
  overflow: hidden;
}

.sub-dialog .van-field__label {
  width: 70px;
  color: #1d1d1f;
}

.sub-dialog .van-dialog__footer {
  padding: 0;
}

.sub-dialog .van-dialog__cancel,
.sub-dialog .van-dialog__confirm {
  height: 50px;
  font-size: 17px;
}

.sub-dialog .van-dialog__confirm {
  color: #007aff;
  font-weight: 500;
}

.sub-dialog .van-dialog__cancel {
  color: #007aff;
}
</style>
