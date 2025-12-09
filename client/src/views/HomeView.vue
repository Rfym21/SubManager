<template>
    <div class="flex flex-col items-center justify-center min-h-screen">
        <div class="text-center w-[90vw] max-w-[720px] mx-auto">
            <h1 class="text-4xl font-bold">A <span class="inline-block text-5xl"></span> Subscription</h1>
            <a class="inline-block bg-opacity-30 backdrop-filter bg-purple-300 rounded-full py-1 px-4 text-purple-700 my-3"
                href="https://github.com/Rfym21" target="_blank">兜豆子</a>
            <p class="text-xl w-full mx-auto font-bold mb-6 text-center">Welcome to my subscription service page!</p>
            <p class="text-medium w-full  mb-6 text-center">This is an undisclosed subscription aggregation service for personal use only, if you have any questions, please feel free to contact me.</p>

            <div class="flex items-center justify-center mt-8">
                <button
                    class="bg-black backdrop-filter backdrop-blur-md text-white rounded-full px-4 py-2 hover:bg-opacity-50 hover:shadow-lg transition duration-300 mr-8"
                    @click="router.push('/sub')">
                    Get Subscription</button>
                <a class="bg-white bg-opacity-30 backdrop-filter backdrop-blur-md text-black rounded-full px-4 py-2 hover:bg-opacity-50 hover:shadow-lg transition duration-300"
                    href="https://t.me/Rfym21" target="_blank">
                    Contact Developer </a>
            </div>
        </div>
    </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()
</script>

<style lang="css" scoped></style>
