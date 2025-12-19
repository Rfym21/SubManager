<template>
  <!-- 可拖动浮动球 -->
  <div class="floating-ball" :style="{ left: ballPos.x + 'px', top: ballPos.y + 'px' }" @mousedown="startDrag"
    @touchstart="startDrag" @click="toggleMenu">
    <span>☰</span>
  </div>

  <!-- 展开菜单 -->
  <div v-if="menuOpen" class="floating-menu" :style="menuStyle">
    <div class="menu-item" @click="navigateTo('/')">返回首页</div>
    <div class="menu-item" @click="navigateTo('/sub')">我的订阅</div>
    <div class="menu-item" @click="navigateTo('/manage')">订阅管理</div>
    <div class="menu-item" @click="navigateTo('/token')">令牌管理</div>
    <div class="menu-item" @click="navigateTo('/setting')">基础配置</div>
    <div class="menu-item" @click="handleLogout">退出登录</div>
  </div>

  <!-- 遮罩层 -->
  <div v-if="menuOpen" class="menu-overlay" @click="menuOpen = false"></div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

// 浮动球位置（初始位置更靠左）
const ballPos = reactive({ x: window.innerWidth - 80, y: window.innerHeight - 150 });
const menuOpen = ref(false);
let isDragging = false;
let dragStart = { x: 0, y: 0 };
let hasMoved = false;

// 菜单宽度
const menuWidth = 120;

/**
 * 计算菜单位置，确保不超出屏幕
 */
const menuStyle = computed(() => {
  let left = ballPos.x - 35;
  const top = ballPos.y - 280;

  // 如果菜单右边超出屏幕，向左调整
  if (left + menuWidth > window.innerWidth - 10) {
    left = window.innerWidth - menuWidth - 10;
  }
  // 如果菜单左边超出屏幕，向右调整
  if (left < 10) {
    left = 10;
  }

  return {
    left: left + 'px',
    top: Math.max(10, top) + 'px'
  };
});

// 开始拖动
const startDrag = (e) => {
  isDragging = true;
  hasMoved = false;
  const pos = e.touches ? e.touches[0] : e;
  dragStart = { x: pos.clientX - ballPos.x, y: pos.clientY - ballPos.y };
  document.addEventListener('mousemove', onDrag);
  document.addEventListener('touchmove', onDrag);
  document.addEventListener('mouseup', stopDrag);
  document.addEventListener('touchend', stopDrag);
};

// 拖动中
const onDrag = (e) => {
  if (!isDragging) return;
  hasMoved = true;
  const pos = e.touches ? e.touches[0] : e;
  ballPos.x = Math.max(0, Math.min(window.innerWidth - 50, pos.clientX - dragStart.x));
  ballPos.y = Math.max(0, Math.min(window.innerHeight - 50, pos.clientY - dragStart.y));
};

// 停止拖动
const stopDrag = () => {
  isDragging = false;
  document.removeEventListener('mousemove', onDrag);
  document.removeEventListener('touchmove', onDrag);
  document.removeEventListener('mouseup', stopDrag);
  document.removeEventListener('touchend', stopDrag);
};

// 切换菜单
const toggleMenu = () => {
  if (!hasMoved) {
    menuOpen.value = !menuOpen.value;
  }
};

// 导航
const navigateTo = (path) => {
  menuOpen.value = false;
  router.push(path);
};

// 退出登录
const handleLogout = () => {
  menuOpen.value = false;
  localStorage.clear();
  router.push('/login');
};
</script>

<style scoped>
.floating-ball {
  position: fixed;
  width: 50px;
  height: 50px;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #333;
  font-size: 20px;
  cursor: pointer;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15), 0 4px 20px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  user-select: none;
  touch-action: none;
  transition: transform 0.2s, box-shadow 0.2s;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.floating-ball:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2), 0 6px 24px rgba(0, 0, 0, 0.15);
}

.floating-ball:active {
  transform: scale(0.95);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.floating-menu {
  position: fixed;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  z-index: 1001;
  overflow: hidden;
  min-width: 120px;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.menu-item {
  padding: 12px 20px;
  cursor: pointer;
  transition: background 0.2s;
  font-size: 14px;
  white-space: nowrap;
  text-align: center;
}

.menu-item:hover {
  background: rgba(0, 0, 0, 0.05);
}

.menu-item:active {
  background: rgba(0, 0, 0, 0.1);
}

.menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 999;
}
</style>
