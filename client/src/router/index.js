import { createRouter, createWebHistory } from 'vue-router';

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
        whiteList: false
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
      path: '/admin',
      name: 'Admin',
      meta: {
        title: '管理',
        whiteList: false
      },
      component: () => import('../views/AdminView.vue')
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/'
    }
  ]
});

router.beforeEach((to, from, next) => {
  document.title = to.meta.title + " | 一条订阅";
  const token = localStorage.getItem('token');

  if (to.meta.whiteList) {
    next();
  } else {
    if (token && token.trim() !== '' && token.length > 20) {
      next();
    } else {
      next('/login');
    }
  }
});

export default router;
