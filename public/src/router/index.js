import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      meta: {
        title: '首页',
        whiteList: true
      },
      component: () => import('../views/HomeView.vue')
    },
    {
      path: '/sub',
      name: 'Sub',
      meta: {
        title: '订阅面板',
        whiteList: true
      },
      component: () => import('../views/SubView.vue')
    },
    {
      path: '/login',
      name: 'Login',
      meta: {
        title: '登录',
        whiteList: true
      },
      component: () => import('../views/LoginView.vue')
    },
    {
      path: '/register',
      name: 'Register',
      meta: {
        title: '注册',
        whiteList: true
      },
      component: () => import('../views/RegisterView.vue')
    },
    {
      path: '/*',
      redirect: '/'
    }
  ]
})

router.beforeEach((to, from, next) => {
  // 设置网页标题
  document.title = to.meta.title + " | 一条订阅"
  // 获取 token
  const token = localStorage.getItem('token')
  // 判断是否需要登录
  if (to.meta.whiteList) {
    // 不需要登录
    next()
  } else {
    // 需要登录
    if (token && token.trim() !== '' && token.length > 20) {
      // 已登录
      next()
    } else {
      // 未登录
      next('/login')
    }
  }


})

export default router
