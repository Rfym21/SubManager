<template>

  <div
    :class="`flex flex-col items-center justify-center h-screen py-20 ${mobile ? 'overflow-hidden' : 'overflow-y-auto'}`"
    ref="page">
    <ul class="w-5/6 mx-auto">
      <div class="h-12"></div>
      <li class="text-center">
        <div class="w-48 h-48 overflow-hidden rounded-full mx-auto">
          <img class="w-full" src="../assets/author.png" alt="">
        </div>
        <p class="text-2xl w-auto mx-auto font-bold my-6 text-center">自定义一下参数吧!</p>
        <p class="text-left text-base w-auto mx-auto mb-2"><span class="font-bold text-lg">规则: </span>规则参数,可选只保留和删除!
        </p>
        <p class="text-left text-base w-auto mx-auto mb-2"><span class="font-bold text-lg">文件: </span>选择需要被处理的的文件!
        </p>
        <p class="text-left text-base w-auto mx-auto mb-2"><span class="font-bold text-lg">等级:
          </span>R>F>Y>M,如果你需要升级自己的等级请发件至
          dev@rfym.net,或者telegram与我联系进行免费升级!
        </p>
        <p class="text-left text-base w-auto mx-auto mb-4 "><span class="font-bold text-lg">数量:
          </span>默认值为30,当填写的数量大于节点库节点数量时返回最大数量节点,不填或者不合法默认返回1个节点!
        </p>
        <p class="text-xl w-auto mx-auto mb-6 text-red-700 text-center" v-if="!token"><span class="font-bold">警告:
          </span>游客不可修改任何参数!
        </p>
        <p class="text-xl w-auto mx-auto mb-6 text-red-700 text-center" v-if="token"><span class="font-bold">提示:
          </span>欢迎 "{{ level }}" 级用户: {{ nickname }}!
        </p>

        <div
          class="text-center flex align-middle w-auto mx-auto bg-white bg-opacity-30 backdrop-filter backdrop-blur-md text-black rounded-full px-4 py-2 hover:bg-opacity-50 hover:shadow-lg transition duration-300 mb-4"
          @click="showRule = true">
          <p class="w-3/12 text-lg leading-10">规则 </p>
          <p class="block flex-1 bg-white bg-opacity-30 text-left backdrop-blur-md text-black rounded-full px-4 py-2  focus:outline-none"
            v-text="rule"></p>
        </div>

        <div
          class="text-center flex align-middle w-auto mx-auto bg-white bg-opacity-30 backdrop-filter backdrop-blur-md text-black rounded-full px-4 py-2 hover:bg-opacity-50 hover:shadow-lg transition duration-300 mb-4">
          <p class="w-3/12 text-lg leading-10">文件 </p>
          <p class="block flex-1 bg-white bg-opacity-30  backdrop-blur-md text-black rounded-full px-4 py-2  focus:outline-none"
            v-text="ArrayToText(files)"></p>
        </div>

        <div
          class="text-center flex align-middle w-auto mx-auto bg-white bg-opacity-30 backdrop-filter backdrop-blur-md text-black rounded-full px-4 py-2 hover:bg-opacity-50 hover:shadow-lg transition duration-300 mb-4">
          <p class="w-3/12 text-lg leading-10">等级 </p><input type="text" placeholder="等级不可修改!"
            class="block flex-1 bg-white bg-opacity-30  backdrop-blur-md text-black rounded-full px-4 py-2  focus:outline-none"
            v-model="level" disabled>
        </div>

        <div
          class="text-center flex align-middle w-auto mx-auto bg-white bg-opacity-30 backdrop-filter backdrop-blur-md text-black rounded-full px-4 py-2 hover:bg-opacity-50 hover:shadow-lg transition duration-300 mb-8">
          <p class="w-3/12 text-lg leading-10">数量 </p><input type="text" placeholder="请输入节点数量!"
            class="block flex-1 bg-white bg-opacity-30  backdrop-blur-md text-black rounded-full px-4 py-2  focus:outline-none"
            v-model="number" :disabled="!token">
        </div>


        <input type="text" disabled v-model="link"
          class="w-full mx-auto block bg-black bg-opacity-30 backdrop-filter backdrop-blur-md text-black rounded-xl px-4 py-2 h-20 mb-4 text-wrap ">

        <button
          class="w-full bg-black bg-opacity-80 backdrop-filter backdrop-blur-md text-white rounded-xl px-20 py-2 hover:bg-opacity-50 hover:shadow-lg transition duration-300 focus:outline-none mb-12"
          @click="copy">复制订阅链接
        </button>
      </li>
    </ul>
  </div>

  <div class="userInfo-btn fixed top-2 right-2 w-14 h-14 rounded-full overflow-hidden" v-if="!UserInfoShow"
    @click="UserInfoShow = true">
    <img src="../assets/login_true.png" alt="" v-if="token" class="w-14 h-14 p-2">
    <img src="../assets/login_false.png" alt="" v-if="!token" class="w-14 h-14 p-2">
  </div>

  <UserInfo v-if="UserInfoShow" @toggle="toggleUserInfoShow" />

  <selection v-if="showRule" :rules="rules" title="规则参数" @choice="ruleChoice" @toggle="ruleShow" :type="true"/>

</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import isMobileDevice from '@/lib/isMobileDevice'
import BScroll from '@better-scroll/core'
import clipboardy from 'clipboardy'
import { showDialog } from 'vant'
import { getFiles } from '../api/axios.js'
import UserInfo from './UserInfoView.vue'
import selection from '../components/selection.vue'

const UserInfoShow = ref(false)
const page = ref(null)
const nickname = ref(localStorage.getItem('nickname') || null)
const files = ref(['Na', 'Ca', 'He'])
const rule = ref('none')
const rules = [
  { text: '空', value: 'none' },
  { text: '删除', value: 'del' },
  { text: '只保留', value: 'only' }
]
const showRule = ref(true)
const token = ref(localStorage.getItem('token') || null)
const level = ref(localStorage.getItem('level') || 'M')
const number = ref(30)
const mobile = ref(false)

const copy = () => {
  navigator.clipboard.writeText(link.value)
  clipboardy.write(link.value)
  showDialog({
    title: '订阅消息',
    message: '复制成功,填入订阅器即可!',
    theme: 'round-button',
  })
}

onMounted(async () => {

  if (isMobileDevice()) {
    mobile.value = true
    nextTick(() => {
      new BScroll(page.value, {
        click: true,
        disableMouse: false,
        disableTouch: false
      })
    })
  }


  const filesData = await getFiles(token.value)
  if (filesData.code && filesData.code === 8200) {
    files.value = filesData.files
  }

})

const toggleUserInfoShow = () => {
  UserInfoShow.value = !UserInfoShow.value
}

const ruleShow = () => {
  showRule.value = !showRule.value
}

const ruleChoice = (value) => {
  rule.value = value
  ruleShow()
}

const ArrayToText = (value) => {
  return value.join(',')
}

</script>

<style lang="css" scoped>
ul,
li {
  list-style: none;
  padding: 0;
  margin: 0;
}
</style>