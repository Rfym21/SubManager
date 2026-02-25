<template>
  <video id="video-background" autoplay loop muted>
    <source src="./assets/background.mp4" type="video/mp4">
  </video>

  <router-view></router-view>

</template>

<script setup>
import isMobileDevice from '@/lib/isMobileDevice'
import { showDialog } from 'vant'
import { ref } from 'vue'
const DialogStatus = ref(false)

if (!isMobileDevice() && DialogStatus.value == false) {
  showDialog({
    title: '提示',
    message: '本站仅对移动端进行适配,PC端可能布局上会有些问题,优先使用移动端访问!',
  })
  DialogStatus.value = true
}
</script>

<style lang="css" scoped>
body,
html {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: relative;
}

#video-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
  object-fit: cover;
}
</style>