<template>
  <div class="min-h-screen p-4 pb-8 overflow-y-auto h-full w-full max-w-[720px] mx-auto">
    <h1 class="text-xl font-semibold text-center my-6" style="color: #1d1d1f;">基础配置</h1>

    <!-- 基础配置 -->
    <van-cell-group class="rounded-lg">
      <van-field v-model="configForm.subconverter" label="subconverter" placeholder="订阅转换地址" />
      <van-field v-model="configForm.filename" label="filename" placeholder="output filename" />
      <van-field v-model="configForm.exclude" label="exclude" placeholder="exclude keywords" type="textarea" rows="2" />
      <van-field v-model="configForm.sub_config" label="sub_config" placeholder="sub_config URL" />
      <van-field v-model="configForm.cacheTime" label="cacheTime" type="number" placeholder="缓存时间（分钟）" />
    </van-cell-group>
    <button class="mac-btn primary mt-6 w-full" @click="saveConfig">保存配置</button>

    <!-- 浮动球组件 -->
    <FloatingBall />
  </div>
</template>

<script setup>
import { reactive, onMounted } from 'vue';
import { showToast } from 'vant';
import { getConfig, updateConfig } from '../api/axios.js';
import FloatingBall from '../components/FloatingBall.vue';

// 基础配置
const configForm = reactive({
  subconverter: '',
  filename: '',
  exclude: '',
  sub_config: '',
  cacheTime: 30
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

// 保存配置
const saveConfig = async () => {
  const res = await updateConfig(configForm);
  if (res.status) {
    showToast('保存成功');
  } else {
    showToast(res.message || '保存失败');
  }
};

onMounted(() => {
  loadConfig();
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
</style>
