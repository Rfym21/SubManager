<template>
  <div class="fixed top-0 w-full h-[60vh] bg-transparent" @click="toggle"></div>
  <div
    class="animate__animated animate__bounceInDown w-full h-[40vh] fixed bottom-0 bg-[rgba(0,0,0,0.75)] rounded-3xl rounded-b">
    <header class="flex justify-between text-white items-center border-b mb-4 border-dashed border-black">
    <h2 class="py-2 px-4 text-xl hover:bg-[rgba(0,0,0,0.5)] rounded-lg ml-3">取消</h2>
    <h1 class="text-3xl text-center py-2">{{ props.title }}</h1>
    <h2 class="py-2 px-4 text-xl hover:bg-[rgba(0,0,0,0.5)] rounded-lg mr-3">确定</h2>
    </header>

    <ul>
      <li v-for="item in props.rules" class="text-white text-xl" @click="choice(item.value)">
        <section class="w-1/2 h-12 mx-auto text-center">
          {{ item.text }}
        </section>
      </li>
    </ul>
  </div>
</template>

<script setup>

const props = defineProps({
  rules: Array,
  type: {
    type: Boolean,
    default: true
  },
  title:{
    type: String,
    default: '选择'
  }
})

const emit = defineEmits(['toggle', 'choice'])

const toggle = () => {
  emit('toggle')
}

const choice = (value) => {
  emit('choice', value)
}

</script>

<style lang="css" scoped></style>