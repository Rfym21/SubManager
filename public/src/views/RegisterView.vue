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

          <van-field v-model="state.nickname" name="nickname" label="昵称" placeholder="请输入昵称"
            :rules="[{ required: true, message: '请填写昵称' }]" />

          <van-field v-model="state.password" type="password" name="password" label="密码" placeholder="请输入密码"
            :rules="[{ required: true, message: '请填写密码' }]" />

        </van-cell-group>

        <div style="margin: 16px;" class="text-center rounded-full">
          <van-button round block native-type="submit" :disabled="state.status">注册订阅</van-button>
        </div>

      </van-form>
    </main>
  </div>
</template>

<script setup>
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import { register } from '../api/axios.js'
import { showDialog } from 'vant'

const router = useRouter()
const state = reactive({
  username: '',
  password: '',
  nickname: '',
  status: false
})

const onSubmit = async (value) => {
  state.status = true
  const { username, password, nickname } = value

  let data = await register(username, nickname, password)
  if (data.code && data.code === 8200) {
    showDialog({
      title: '注册成功',
      message: '注册成功,正在前往登录页！',
    })
    router.push('/login')
  } else {
    showDialog({
      title: '注册失败',
      message: data.message,
    })
  }
  state.status = false
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