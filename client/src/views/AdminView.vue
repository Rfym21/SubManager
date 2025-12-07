<template>
  <div class="min-h-screen p-4 pb-8">
    <h1 class="text-2xl font-bold text-center mb-6">订阅管理</h1>

    <!-- 基础配置 -->
    <van-cell-group inset title="基础配置" class="mb-4">
      <van-field v-model="configForm.host" label="Host" placeholder="服务地址" />
      <van-field v-model="configForm.subconverter" label="转换器" placeholder="订阅转换地址" />
      <van-field v-model="configForm.filename" label="文件名" placeholder="输出文件名" />
      <van-field v-model="configForm.exclude" label="排除" placeholder="排除关键词" type="textarea" rows="2" />
      <van-field v-model="configForm.sub_config" label="规则" placeholder="规则配置URL" />
      <van-button type="primary" block round class="mt-4" @click="saveConfig">保存配置</van-button>
    </van-cell-group>

    <!-- 订阅链接列表 -->
    <van-cell-group inset title="订阅链接" class="mb-4">
      <van-cell v-for="(link, index) in subLinks" :key="index" :title="link.filename" :label="link.url"
        :value="'权重: ' + link.weight" is-link @click="editSubLink(link)" />
      <van-button type="success" block round class="mt-4" @click="showAddDialog">添加订阅</van-button>
    </van-cell-group>

    <!-- 添加/编辑订阅弹窗 -->
    <van-dialog v-model:show="subLinkDialog.show" :title="subLinkDialog.isEdit ? '编辑订阅' : '添加订阅'"
      show-cancel-button @confirm="submitSubLink">
      <van-cell-group inset class="my-4">
        <van-field v-model="subLinkDialog.form.filename" label="文件名" placeholder="如: my.txt"
          :disabled="subLinkDialog.isEdit" />
        <van-field v-model="subLinkDialog.form.url" label="URL" placeholder="订阅地址或localhost" />
        <van-field v-model="subLinkDialog.form.weight" label="权重" type="number" placeholder="数字越大优先级越高" />
      </van-cell-group>
      <div v-if="subLinkDialog.isEdit" class="px-4 pb-4">
        <van-button type="warning" block round size="small" @click="editFileContent">编辑文件内容</van-button>
        <van-button type="danger" block round size="small" class="mt-2" @click="removeSubLink">删除此订阅</van-button>
      </div>
    </van-dialog>

    <!-- 编辑文件内容弹窗 -->
    <van-dialog v-model:show="fileDialog.show" title="编辑文件内容" show-cancel-button @confirm="saveFileContent">
      <van-cell-group inset class="my-4">
        <van-field v-model="fileDialog.content" type="textarea" rows="10" placeholder="每行一条订阅链接" />
      </van-cell-group>
    </van-dialog>

    <!-- 浮动球组件 -->
    <FloatingBall />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
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
  color: #333;
  font-weight: bold;
}

:deep(.van-cell-group) {
  background-color: rgba(255, 255, 255, 0.8);
}

:deep(.van-field) {
  background-color: transparent;
}

:deep(.van-button--primary) {
  background-color: #333;
  border-color: #333;
}

:deep(.van-button--success) {
  background-color: #07c160;
  border-color: #07c160;
}

</style>
