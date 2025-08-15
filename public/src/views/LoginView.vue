<template>
  <div class="h-screen w-screen flex items-center justify-center">
    <main class="">

      <div class="avatar w-36 h-36 fixed top-20 left-1/2 -translate-x-1/2 rounded-full overflow-hidden">
        <img class="w-full h-full p-2" src="../assets/author.png" alt="">
      </div>

      <van-form @submit="onSubmit">

        <van-cell-group inset>

          <van-field v-model="state.username" name="username" label="用户名" placeholder="请输入用户名"
            :rules="[{ required: true, message: '请填写用户名' }]" />


          <van-field v-model="state.password" type="password" name="password" label="密码" placeholder="请输入密码"
            :rules="[{ required: true, message: '请填写密码' }]" />

        </van-cell-group>

        <div style="margin: 16px;" class="text-center rounded-full">
          <van-button round block native-type="submit" :disabled="state.status">开启订阅</van-button>
        </div>

      </van-form>
    </main>

    <p class="fixed bottom-4 text-xl" @click="router.push('/register')">注册一个账户</p>
  </div>
</template>

<script setup>
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import { login } from '../api/axios.js'
import { showDialog } from 'vant'

const router = useRouter()
const state = reactive({
  username: '',
  password: '',
  status: false
})


const onSubmit = async (value) => {
  state.status = true
  const { username, password } = value
  let data = await login(username, password)

  if (data.code && data.code === 8200) {
    // 储存数据
    data = data.data
    localStorage.setItem('token', data.token)
    localStorage.setItem('username', data.username)
    localStorage.setItem('id', data.id)
    localStorage.setItem('nickname', data.nickname)
    localStorage.setItem('level', data.level)
    showDialog({
      title: '一条消息',
      message: '登录成功,正在跳转管理页!',
    })
    router.push('/sub')
  } else {
    showDialog({
      title: '一条消息',
      message: data.message,
    })
  }
  state.status = true
}
</script>

<style lang="css" scoped>
:deep(.van-form) {
  width: 100vw;
  padding: 0 8vw;
}

:deep(.van-cell-group) {
  background-color: rgba(0, 0, 0, 0);
  margin: 0;
  padding: 0 2vw;
}

:deep(.van-field) {
  width: 100%;
  margin-top: 10%;
  margin-bottom: 5%;

  border-radius: 10rem;
  font-size: 1.25rem;
  box-shadow: 0 0 0 5px rgba(0, 0, 0, 0.1);
}

:deep(.van-button) {
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.5);
  font-size: 1rem;
}

:deep(.van-cell__title) {
  width: 4em;
}
</style>