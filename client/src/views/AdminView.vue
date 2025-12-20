<template>
  <div class="h-screen p-4 pb-8 overflow-y-auto w-full max-w-[720px] mx-auto">
    <h1 class="text-xl font-semibold text-center my-6" style="color: #1d1d1f;">订阅管理</h1>

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
      <button class="page-btn add-btn" @click="showAddDialog">添加订阅</button>
    </div>

    <!-- 订阅链接卡片 -->
    <div class="sub-cards-grid">
      <div
        v-for="link in paginatedSubLinks"
        :key="link.filename"
        class="sub-card"
        :class="{ 'sub-card-disabled': link.status === false }"
        @click="editSubLink(link)"
      >
        <div class="sub-card-header">
          <span class="sub-card-title">{{ link.remark || link.filename }}</span>
          <span v-if="link.status === false" class="sub-card-status-badge">禁用</span>
          <span class="sub-card-weight">权重:{{ link.weight }}</span>
        </div>
        <div class="sub-card-url">{{ link.url }}</div>
        <div class="sub-card-filename">{{ link.filename }}</div>
        <div class="sub-card-meta">
          <span class="sub-card-tag" :class="link.url === 'localhost' ? 'tag-local' : 'tag-remote'">
            {{ link.url === 'localhost' ? '本地订阅' : '订阅链接' }}
          </span>
          <span class="sub-card-tag">缓存:{{ link.cacheTime != null ? link.cacheTime + '分钟' : '全局' }}</span>
        </div>
        <div class="sub-card-cache-info" v-if="link.url !== 'localhost'">
          <span>更新: {{ link.lastUpdateTime ? formatTime(link.lastUpdateTime) : '从未' }}</span>
          <span :class="isCacheExpired(link) ? 'cache-expired' : 'cache-valid'">
            {{ getCacheStatus(link) }}
          </span>
        </div>
      </div>
    </div>

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
        <van-field v-model="subLinkDialog.form.remark" label="备注" placeholder="订阅备注名称" />
        <van-field v-model="subLinkDialog.form.url" label="URL" placeholder="订阅地址或 localhost" />
        <van-field v-model="subLinkDialog.form.weight" label="权重" type="number" placeholder="数字越大优先级越高" />
        <van-field v-model="subLinkDialog.form.cacheTime" label="缓存" type="number" placeholder="分钟，留空使用全局配置" />
      </van-cell-group>
      <div v-if="subLinkDialog.isEdit" class="px-4 pb-4 flex flex-col gap-3">
        <button @click="toggleSubLinkStatus" class="mac-btn secondary w-full">
          {{ subLinkDialog.form.status === false ? '启用此订阅' : '禁用此订阅' }}
        </button>
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
      class="file-dialog"
    >
      <!-- 模式切换 -->
      <div class="mode-toggle">
        <button
          class="mode-btn"
          :class="{ active: fileDialog.mode === 'card' }"
          @click="fileDialog.mode = 'card'"
        >卡片模式</button>
        <button
          class="mode-btn"
          :class="{ active: fileDialog.mode === 'text' }"
          @click="fileDialog.mode = 'text'"
        >文本模式</button>
      </div>

      <!-- 卡片模式 -->
      <div v-if="fileDialog.mode === 'card'" class="card-mode-container">
        <div class="nodes-list">
          <div
            v-for="(node, index) in parsedNodes"
            :key="index"
            class="node-card"
          >
            <div class="node-header">
              <span class="node-line">L{{ index + 1 }}</span>
              <span class="node-name">{{ node.name || '未知节点' }}</span>
            </div>
            <div class="node-content">{{ node.line }}</div>
            <div class="node-actions">
              <button class="node-action-btn" @click="editNode(index)">编辑</button>
              <button class="node-action-btn danger" @click="deleteNode(index)">删除</button>
            </div>
          </div>
        </div>
        <button class="add-node-btn" @click="addNode">+ 添加节点</button>
      </div>

      <!-- 文本模式 -->
      <div v-else class="text-mode-container">
        <div class="text-editor-wrapper">
          <div class="line-numbers">
            <div v-for="n in lineCount" :key="n" class="line-number">{{ n }}</div>
          </div>
          <textarea
            v-model="fileDialog.content"
            class="text-editor"
            placeholder="每行一条订阅链接"
            @scroll="syncScroll"
            ref="textEditorRef"
          ></textarea>
        </div>
      </div>
    </van-dialog>

    <!-- 编辑单个节点弹窗 -->
    <van-dialog
      v-model:show="nodeEditDialog.show"
      :title="nodeEditDialog.isAdd ? '添加节点' : `编辑节点 (L${nodeEditDialog.lineIndex + 1})`"
      show-cancel-button
      @confirm="saveNode"
      class="sub-dialog"
    >
      <van-cell-group inset class="my-4">
        <van-field
          v-model="nodeEditDialog.content"
          type="textarea"
          rows="4"
          placeholder="输入节点链接"
        />
      </van-cell-group>
    </van-dialog>

    <!-- 浮动球组件 -->
    <FloatingBall />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { showToast, showConfirmDialog } from 'vant';
import {
  getSubLinks,
  addSubLink,
  updateSubLink,
  deleteSubLink,
  getFileContent,
  updateFileContent,
  getConfig
} from '../api/axios.js';
import FloatingBall from '../components/FloatingBall.vue';
import isMobileDevice from '../lib/isMobileDevice.js';

// 订阅链接列表
const subLinks = ref([]);

// 全局缓存时间
const globalCacheTime = ref(0);

// 分页状态（移动端每页5条，桌面端每页6条）
const currentPage = ref(1);
const pageSize = isMobileDevice() ? 5 : 6;

// 按权重排序的订阅链接（权重高的在前）
const sortedSubLinks = computed(() => {
  return [...subLinks.value].sort((a, b) => b.weight - a.weight);
});

// 总页数
const totalPages = computed(() => {
  return Math.ceil(sortedSubLinks.value.length / pageSize);
});

// 当前页的订阅链接
const paginatedSubLinks = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  const end = start + pageSize;
  return sortedSubLinks.value.slice(start, end);
});

// 订阅链接弹窗
const subLinkDialog = reactive({
  show: false,
  isEdit: false,
  originalFilename: '',
  form: {
    filename: '',
    remark: '',
    url: '',
    weight: 0,
    status: true,
    cacheTime: ''
  }
});

// 文件编辑弹窗
const fileDialog = reactive({
  show: false,
  filename: '',
  content: '',
  mode: 'card' // 'card' | 'text'
});

// 节点编辑弹窗
const nodeEditDialog = reactive({
  show: false,
  isAdd: false,
  lineIndex: 0,
  content: ''
});

// 文本编辑器引用
const textEditorRef = ref(null);

/**
 * 从节点链接中解析节点名称
 * @param {string} line - 节点链接
 * @returns {string} 解析后的节点名称
 */
const parseNodeName = (line) => {
  if (!line || !line.trim()) return '';
  const hashIndex = line.lastIndexOf('#');
  if (hashIndex === -1) return '';
  try {
    return decodeURIComponent(line.substring(hashIndex + 1));
  } catch {
    return line.substring(hashIndex + 1);
  }
};

/**
 * 解析后的节点列表
 */
const parsedNodes = computed(() => {
  if (!fileDialog.content) return [];
  return fileDialog.content.split('\n').filter(line => line.trim()).map(line => ({
    line: line.trim(),
    name: parseNodeName(line.trim())
  }));
});

/**
 * 文本模式的行数
 */
const lineCount = computed(() => {
  if (!fileDialog.content) return 1;
  return Math.max(fileDialog.content.split('\n').length, 1);
});

/**
 * 同步行号滚动
 */
const syncScroll = (e) => {
  const lineNumbers = e.target.previousElementSibling;
  if (lineNumbers) {
    lineNumbers.scrollTop = e.target.scrollTop;
  }
};

/**
 * 添加节点
 */
const addNode = () => {
  nodeEditDialog.isAdd = true;
  nodeEditDialog.lineIndex = parsedNodes.value.length;
  nodeEditDialog.content = '';
  nodeEditDialog.show = true;
};

/**
 * 编辑节点
 * @param {number} index - 节点索引
 */
const editNode = (index) => {
  nodeEditDialog.isAdd = false;
  nodeEditDialog.lineIndex = index;
  nodeEditDialog.content = parsedNodes.value[index].line;
  nodeEditDialog.show = true;
};

/**
 * 删除节点
 * @param {number} index - 节点索引
 */
const deleteNode = (index) => {
  showConfirmDialog({ title: `确认删除第 ${index + 1} 行节点？` }).then(() => {
    const lines = fileDialog.content.split('\n').filter(line => line.trim());
    lines.splice(index, 1);
    fileDialog.content = lines.join('\n');
    showToast('已删除');
  }).catch(() => { });
};

/**
 * 保存节点编辑
 */
const saveNode = () => {
  const content = nodeEditDialog.content.trim();
  if (!content) {
    showToast('节点内容不能为空');
    return;
  }
  const lines = fileDialog.content ? fileDialog.content.split('\n').filter(line => line.trim()) : [];
  if (nodeEditDialog.isAdd) {
    lines.push(content);
  } else {
    lines[nodeEditDialog.lineIndex] = content;
  }
  fileDialog.content = lines.join('\n');
  showToast(nodeEditDialog.isAdd ? '已添加' : '已修改');
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

// 加载全局配置
const loadConfig = async () => {
  const res = await getConfig();
  if (res.status) {
    globalCacheTime.value = res.data.cacheTime || 0;
  }
};

/**
 * 格式化时间戳
 * @param {number} timestamp - 时间戳
 * @returns {string} 格式化后的时间
 */
const formatTime = (timestamp) => {
  if (!timestamp) return '-';
  const date = new Date(timestamp);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${month}-${day} ${hours}:${minutes}`;
};

/**
 * 检查缓存是否过期
 * @param {Object} link - 订阅链接对象
 * @returns {boolean} 是否过期
 */
const isCacheExpired = (link) => {
  if (!link.lastUpdateTime) return true;
  const cacheTime = link.cacheTime != null ? link.cacheTime : globalCacheTime.value;
  if (!cacheTime) return true;
  const expireTime = link.lastUpdateTime + cacheTime * 60 * 1000;
  return Date.now() > expireTime;
};

/**
 * 获取缓存状态文本
 * @param {Object} link - 订阅链接对象
 * @returns {string} 缓存状态
 */
const getCacheStatus = (link) => {
  if (!link.lastUpdateTime) return '未缓存';
  const cacheTime = link.cacheTime != null ? link.cacheTime : globalCacheTime.value;
  if (!cacheTime) return '无缓存配置';
  const expireTime = link.lastUpdateTime + cacheTime * 60 * 1000;
  if (Date.now() > expireTime) {
    return '已过期';
  }
  return `到期: ${formatTime(expireTime)}`;
};

// 显示添加弹窗
const showAddDialog = () => {
  subLinkDialog.isEdit = false;
  subLinkDialog.form = { filename: '', remark: '', url: '', weight: 0, status: true, cacheTime: '' };
  subLinkDialog.show = true;
};

// 编辑订阅链接
const editSubLink = (link) => {
  subLinkDialog.isEdit = true;
  subLinkDialog.originalFilename = link.filename;
  subLinkDialog.form = {
    ...link,
    cacheTime: link.cacheTime != null ? link.cacheTime : ''
  };
  subLinkDialog.show = true;
};

// 提交订阅链接
const submitSubLink = async () => {
  const { isEdit, originalFilename, form } = subLinkDialog;
  const submitData = {
    ...form,
    // 编辑时清空则发送 null（删除属性回退全局），添加时清空则不发送
    cacheTime: form.cacheTime !== '' ? Number(form.cacheTime) : (isEdit ? null : undefined)
  };
  let res;
  if (isEdit) {
    res = await updateSubLink(originalFilename, submitData);
  } else {
    res = await addSubLink(submitData);
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
      await loadSubLinks();
      // 如果当前页没有数据且不是第一页，跳转到上一页
      if (paginatedSubLinks.value.length === 0 && currentPage.value > 1) {
        currentPage.value--;
      }
    } else {
      showToast(res.message || '删除失败');
    }
  }).catch(() => { });
};

// 切换订阅状态
const toggleSubLinkStatus = async () => {
  const newStatus = subLinkDialog.form.status === false ? true : false;
  const res = await updateSubLink(subLinkDialog.originalFilename, { status: newStatus });
  if (res.status) {
    subLinkDialog.form.status = newStatus;
    showToast(newStatus ? '已启用' : '已禁用');
    loadSubLinks();
  } else {
    showToast(res.message || '操作失败');
  }
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
  loadSubLinks();
  loadConfig();
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
  color: #000;
  border: 0;
}

/* 订阅链接卡片网格 */
.sub-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
}

.sub-card {
  background: rgba(255, 255, 255, 0.8);
  border-radius: 12px;
  padding: 14px 16px;
  cursor: pointer;
  transition: all 0.15s ease;
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  min-height: 130px;
}

.sub-card:hover {
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}

.sub-card:active {
  background: rgba(0, 0, 0, 0.03);
  transform: translateY(0);
}

.sub-card-disabled {
  opacity: 0.5;
}

.sub-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.sub-card-title {
  font-weight: 600;
  font-size: 15px;
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
  background: rgba(0, 0, 0, 0.05);
  padding: 2px 8px;
  border-radius: 10px;
}

.sub-card-url {
  font-size: 12px;
  color: #86868b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 4px;
}

.sub-card-filename {
  font-size: 11px;
  color: #86868b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 8px;
}

.sub-card-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: auto;
}

.sub-card-tag {
  font-size: 11px;
  color: #1d1d1f;
  background: rgba(0, 0, 0, 0.05);
  padding: 2px 8px;
  border-radius: 6px;
}

.sub-card-tag.tag-local {
  background: rgba(52, 199, 89, 0.15);
  color: #34c759;
}

.sub-card-tag.tag-remote {
  background: rgba(0, 122, 255, 0.15);
  color: #007aff;
}

.sub-card-tag.tag-disabled {
  background: rgba(255, 59, 48, 0.15);
  color: #ff3b30;
}

.sub-card-status-badge {
  font-size: 11px;
  color: #ff3b30;
  background: rgba(255, 59, 48, 0.15);
  padding: 2px 6px;
  border-radius: 4px;
  margin-right: 6px;
}

.sub-card-cache-info {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  color: #86868b;
  margin-top: 6px;
  padding-top: 6px;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
}

.cache-expired {
  color: #ff3b30;
}

.cache-valid {
  color: #34c759;
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
  background: #1d1d1f;
  color: #fff;
}

.mac-btn.primary:hover {
  background: #000;
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

/* 模式切换 */
.mode-toggle {
  display: flex;
  justify-content: center;
  gap: 8px;
  padding: 16px 16px 0;
}

.mode-btn {
  padding: 6px 16px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  border: 1px solid rgba(0, 0, 0, 0.1);
  cursor: pointer;
  background: #f5f5f7;
  color: #86868b;
  transition: all 0.15s ease;
}

.mode-btn.active {
  background: #1d1d1f;
  color: #fff;
  border-color: #1d1d1f;
}

.mode-btn:hover:not(.active) {
  background: #e8e8ed;
}

/* 卡片模式 */
.card-mode-container {
  padding: 16px;
  max-height: 400px;
  overflow-y: auto;
}

.nodes-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.node-card {
  background: #f5f5f7;
  border-radius: 10px;
  padding: 12px;
}

.node-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.node-line {
  font-size: 11px;
  font-weight: 600;
  color: #fff;
  background: #1d1d1f;
  padding: 2px 6px;
  border-radius: 4px;
}

.node-name {
  font-size: 14px;
  font-weight: 600;
  color: #1d1d1f;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.node-content {
  font-size: 11px;
  color: #86868b;
  font-family: monospace;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 10px;
}

.node-actions {
  display: flex;
  gap: 8px;
}

.node-action-btn {
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  background: #fff;
  color: #1d1d1f;
  transition: all 0.15s ease;
}

.node-action-btn:hover {
  background: #e8e8ed;
}

.node-action-btn.danger {
  color: #ff3b30;
}

.node-action-btn.danger:hover {
  background: #ffebea;
}

.add-node-btn {
  width: 100%;
  padding: 12px;
  margin-top: 12px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  border: 2px dashed rgba(0, 0, 0, 0.15);
  cursor: pointer;
  background: transparent;
  color: #86868b;
  transition: all 0.15s ease;
}

.add-node-btn:hover {
  border-color: #1d1d1f;
  color: #1d1d1f;
}

/* 文本模式 */
.text-mode-container {
  padding: 16px;
}

.text-editor-wrapper {
  display: flex;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  overflow: hidden;
  background: #f5f5f7;
}

.line-numbers {
  padding: 10px 0;
  background: #e8e8ed;
  color: #86868b;
  font-family: monospace;
  font-size: 13px;
  line-height: 20px;
  text-align: right;
  user-select: none;
  min-width: 40px;
  max-height: 300px;
  overflow: hidden;
}

.line-number {
  padding: 0 8px;
  height: 20px;
}

.text-editor {
  flex: 1;
  min-height: 300px;
  max-height: 300px;
  padding: 10px;
  border: none;
  background: transparent;
  font-family: monospace;
  font-size: 13px;
  line-height: 20px;
  color: #1d1d1f;
  resize: none;
  outline: none;
  white-space: pre;
  overflow-x: auto;
  overflow-y: auto;
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
  color: #1d1d1f;
  font-weight: 500;
}

.sub-dialog .van-dialog__cancel {
  color: #86868b;
}

/* 文件编辑弹窗 */
.file-dialog {
  width: 95% !important;
  max-width: 560px !important;
  border-radius: 14px !important;
  overflow: hidden;
}

.file-dialog .van-dialog__header {
  padding: 20px 20px 10px;
  font-weight: 600;
  font-size: 17px;
  color: #1d1d1f;
}

.file-dialog .van-dialog__content {
  padding: 0;
}

.file-dialog .van-dialog__footer {
  padding: 0;
}

.file-dialog .van-dialog__cancel,
.file-dialog .van-dialog__confirm {
  height: 50px;
  font-size: 17px;
}

.file-dialog .van-dialog__confirm {
  color: #1d1d1f;
  font-weight: 500;
}

.file-dialog .van-dialog__cancel {
  color: #86868b;
}
</style>
