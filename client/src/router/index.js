import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      meta: {
        title: 'Home',
        whiteList: true
      },
      component: () => import('../views/HomeView.vue')
    },
    {
      path: '/sub',
      name: 'Sub',
      meta: {
        title: 'Subscription Panel',
        whiteList: false
      },
      component: () => import('../views/SubView.vue')
    },
    {
      path: '/login',
      name: 'Login',
      meta: {
        title: 'Login',
        whiteList: true
      },
      component: () => import('../views/LoginView.vue')
    },
    {
      path: '/manage',
      name: 'Manage',
      meta: {
        title: 'Manage Panel',
        whiteList: false
      },
      component: () => import('../views/AdminView.vue')
    },
    {
      path: '/setting',
      name: 'Setting',
      meta: {
        title: 'Setting',
        whiteList: false
      },
      component: () => import('../views/SettingView.vue')
    },
    {
      path: '/token',
      name: 'Token',
      meta: {
        title: 'Token Management',
        whiteList: false
      },
      component: () => import('../views/TokenView.vue')
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/'
    }
  ]
});

router.beforeEach((to, from, next) => {
  document.title = to.meta.title + " | A Subscription";
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
