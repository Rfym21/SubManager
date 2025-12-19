<template>
  <div class="flex flex-col items-center justify-center min-h-screen py-20">
    <div class="w-5/6 mx-auto text-center max-w-[720px]">
      <p class="text-2xl font-bold my-6">Get Subscription Links</p>

      <p class="text-left text-base mb-4">
        <span class="font-bold text-lg">Note: </span>Click the buttons below to copy the subscription links, and paste them into your proxy client to use.
      </p>

      <!-- Token 选择器 -->
      <div class="mb-4" v-if="tokenList.length > 1">
        <p class="text-left text-sm font-bold mb-1">Select Token:</p>
        <select
          v-model="selectedToken"
          class="w-full block bg-black bg-opacity-30 backdrop-filter backdrop-blur-md text-black rounded-xl px-4 py-2 h-12 text-sm appearance-none cursor-pointer"
        >
          <option v-for="token in tokenList" :key="token.name" :value="token.name">
            {{ token.name }}
          </option>
        </select>
      </div>

      <div class="mb-4">
        <p class="text-left text-sm font-bold mb-1">Clash Subscription Link:</p>
        <input type="text" disabled :value="currentSubInfo.sub_url"
          class="w-full block bg-black bg-opacity-30 backdrop-filter backdrop-blur-md text-black rounded-xl px-4 py-2 h-12 text-sm">
      </div>

      <div class="mb-4">
        <p class="text-left text-sm font-bold mb-1">Base64 Subscription Link:</p>
        <input type="text" disabled :value="currentSubInfo.base64_url"
          class="w-full block bg-black bg-opacity-30 backdrop-filter backdrop-blur-md text-black rounded-xl px-4 py-2 h-12 text-sm">
      </div>

      <button
        class="w-full bg-black bg-opacity-80 backdrop-filter backdrop-blur-md text-white rounded-xl px-20 py-3 hover:bg-opacity-50 hover:shadow-lg transition duration-300 focus:outline-none mb-3"
        @click="copyLink(currentSubInfo.sub_url)">
        Copy Clash Link
      </button>

      <button
        class="w-full bg-black bg-opacity-80 backdrop-filter backdrop-blur-md text-white rounded-xl px-20 py-3 hover:bg-opacity-50 hover:shadow-lg transition duration-300 focus:outline-none mb-6"
        @click="copyLink(currentSubInfo.base64_url)">
        Copy Base64 Link
      </button>

      <button
        class="w-full bg-white bg-opacity-30 backdrop-filter backdrop-blur-md text-black rounded-xl px-20 py-3 hover:bg-opacity-50 hover:shadow-lg transition duration-300 focus:outline-none"
        @click="router.push('/')">
        Back to Home
      </button>
    </div>

    <!-- 浮动球组件 -->
    <FloatingBall />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { showToast } from 'vant';
import { getSubInfo } from '../api/axios.js';
import FloatingBall from '../components/FloatingBall.vue';

const router = useRouter();

// 获取当前网站 host
const getHost = () => {
  return `${window.location.protocol}//${window.location.host}`;
};

// Token 列表
const tokenList = ref([]);

// 当前选中的 token name
const selectedToken = ref('');

// 当前选中的订阅信息
const currentSubInfo = computed(() => {
  const tokenData = tokenList.value.find(t => t.name === selectedToken.value);
  if (tokenData) {
    const host = getHost();
    return {
      sub_url: `${host}/sub?token=${tokenData.token}`,
      base64_url: `${host}/base64?token=${tokenData.token}`
    };
  }
  return {
    sub_url: '加载中...',
    base64_url: '加载中...'
  };
});

const copyLink = async (link) => {
  try {
    await navigator.clipboard.writeText(link);
    showToast('复制成功');
  } catch (e) {
    showToast('复制失败，请手动复制');
  }
};

onMounted(async () => {
  const res = await getSubInfo();
  if (res.status && res.data.length > 0) {
    tokenList.value = res.data;
    selectedToken.value = res.data[0].name;
  } else if (res.status && res.data.length === 0) {
    showToast('暂无可用的 Token');
  } else {
    showToast('获取订阅链接失败，请先登录');
    router.push('/login');
  }
});
</script>

<style scoped>
select {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23333' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
}
</style>
