<template>
  <div class="login-container">
    <div class="login-card">
      <h1 class="login-title">Login</h1>
      <van-form @submit="onSubmit" class="login-form" autocomplete="off">
        <div class="form-fields">
          <van-field
            v-model="state.username"
            name="username"
            label="用户名"
            placeholder="请输入用户名"
            autocomplete="off"
            :rules="[{ required: true }]"
          />
          <van-field
            v-model="state.password"
            type="password"
            name="password"
            label="密码"
            placeholder="请输入密码"
            autocomplete="new-password"
            :rules="[{ required: true }]"
          />
        </div>
        <van-button
          class="login-btn"
          round
          block
          native-type="submit"
          :disabled="state.status"
          :loading="state.status"
        >
          登录
        </van-button>
      </van-form>
    </div>
  </div>
</template>

<script setup>
import { reactive } from 'vue';
import { useRouter } from 'vue-router';
import { login } from '../api/axios.js';
import { showDialog } from 'vant';

const router = useRouter();
const state = reactive({
  username: '',
  password: '',
  status: false
});

const onSubmit = async (value) => {
  state.status = true;
  const { username, password } = value;
  const data = await login(username, password);

  if (data.status) {
    localStorage.setItem('token', data.data.access_token);
    localStorage.setItem('username', data.data.username);
    showDialog({
      title: '提示',
      message: '登录成功，正在跳转...',
    });
    router.push('/manage');
  } else {
    showDialog({
      title: '提示',
      message: data.message || '登录失败',
    });
  }
  state.status = false;
};
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.login-card {
  width: 100%;
  max-width: 360px;
}

.login-title {
  font-size: 3rem;
  font-weight: 700;
  color: #1d1d1f;
  text-align: center;
  margin-bottom: 40px;
}

.login-form {
  width: 100%;
}

.form-fields {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 32px;
}

.login-btn {
  width: 100%;
  height: 48px;
  font-size: 16px;
  font-weight: 500;
}
</style>

<style>
.login-form .van-field {
  background: rgba(255, 255, 255, 0.8);
  border-radius: 9999px;
  padding: 12px 20px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.login-form .van-field__label {
  width: 60px;
  color: #1d1d1f;
  font-weight: 500;
}

.login-form .van-field__control {
  color: #1d1d1f;
}

.login-form .van-field__control::placeholder {
  color: #86868b;
}

.login-form .van-button--default {
  background: #1d1d1f;
  color: #fff;
  border: none;
}

.login-form .van-button--default:active {
  background: #000;
}

.login-form .van-button--disabled {
  background: #86868b;
  opacity: 0.6;
}
</style>
