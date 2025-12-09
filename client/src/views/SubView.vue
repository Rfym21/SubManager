<template>
  <div class="flex flex-col items-center justify-center min-h-screen py-20">
    <div class="w-5/6 mx-auto text-center max-w-[720px]">
      <p class="text-2xl font-bold my-6">Get Subscription Links</p>

      <p class="text-left text-base mb-4">
        <span class="font-bold text-lg">Note: </span>Click the buttons below to copy the subscription links, and paste them into your proxy client to use.
      </p>

      <div class="mb-4">
        <p class="text-left text-sm font-bold mb-1">Clash Subscription Link:</p>
        <input type="text" disabled :value="subInfo.sub_url"
          class="w-full block bg-black bg-opacity-30 backdrop-filter backdrop-blur-md text-black rounded-xl px-4 py-2 h-12 text-sm">
      </div>

      <div class="mb-4">
        <p class="text-left text-sm font-bold mb-1">Base64 Subscription Link:</p>
        <input type="text" disabled :value="subInfo.base64_url"
          class="w-full block bg-black bg-opacity-30 backdrop-filter backdrop-blur-md text-black rounded-xl px-4 py-2 h-12 text-sm">
      </div>

      <button
        class="w-full bg-black bg-opacity-80 backdrop-filter backdrop-blur-md text-white rounded-xl px-20 py-3 hover:bg-opacity-50 hover:shadow-lg transition duration-300 focus:outline-none mb-3"
        @click="copyLink(subInfo.sub_url)">
        Copy Clash Link
      </button>

      <button
        class="w-full bg-black bg-opacity-80 backdrop-filter backdrop-blur-md text-white rounded-xl px-20 py-3 hover:bg-opacity-50 hover:shadow-lg transition duration-300 focus:outline-none mb-6"
        @click="copyLink(subInfo.base64_url)">
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
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { showToast } from 'vant';
import { getSubInfo } from '../api/axios.js';
import FloatingBall from '../components/FloatingBall.vue';

const router = useRouter();

const subInfo = reactive({
  sub_url: '加载中...',
  base64_url: '加载中...'
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
  if (res.status) {
    subInfo.sub_url = res.data.sub_url;
    subInfo.base64_url = res.data.base64_url;
  } else {
    showToast('获取订阅链接失败，请先登录');
    router.push('/login');
  }
});
</script>

<style lang="css" scoped>
</style>
