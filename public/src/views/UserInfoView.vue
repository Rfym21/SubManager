<template>
  <div class="h-screen w-screen fixed top-0 bottom-0 left-0 right-0 bg-[rgba(0,0,0,0.75)] text-white text-xl">
    <div class=" w-[80vw] h-full pt-[20vh] mx-auto text-left">
      <div class="nickname text-3xl text-center my-4 text-orange-500">{{ nickname }}</div>
      <div class="username text-xl py-2 px-4">用户名 => <span class="inline-block float-right border-b-2">{{ username
          }}</span></div>
      <div class="username text-xl py-2 px-4">ID => <span class="inline-block float-right border-b-2">{{ id }}</span>
      </div>
      <div class="username text-xl py-2 px-4">等级 => <span class="inline-block float-right border-b-2">{{ level }}</span>
      </div>
      <div class="username text-xl px-4 py-4">唯一Token =>
        <textarea class="w-full my-2 text-base bg-transparent" rows="5" disabled>{{ token }}</textarea>
      </div>
      <button class="block w-[60vw] mx-auto border-2 p-2 rounded-full hover:bg-[rgba(0,0,0,0.5)]" v-if="token"
        @click="logout">注销</button>
      <button class="block w-[60vw] mx-auto border-2 p-2 rounded-full hover:bg-[rgba(0,0,0,0.5)]" v-if="!token"
        @click="router.push('/login')">登录</button>
    </div>
  </div>

  <div class=" userInfo-btn fixed top-2 right-2 w-14 h-14 rounded-full overflow-hidden" @click="toggle">
    <img src="../assets/close.png" alt="" class="w-14 h-14 p-2">
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()
const emits = defineEmits(['toggle'])

const toggle = () => {
  emits('toggle')
}

const nickname = localStorage.getItem('nickname') || '游客'
const username = localStorage.getItem('username') || 'guest'
const id = localStorage.getItem('id') || '1'
const level = localStorage.getItem('level') || 'M'
const token = localStorage.getItem('token') || null

const logout = () => {
  localStorage.clear()
}

</script>

<style lang="css" scoped></style>