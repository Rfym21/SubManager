<template>
    <div class="h-screen flex flex-col items-center justify-center w-max-[720px] mx-auto">
            <h1 class="text-5xl font-bold mb-6">Admin Login</h1>
            <van-form @submit="onSubmit">
                <van-cell-group inset class="w-full">

                    <van-field v-model="state.username" name="username" label="用户名" placeholder="请输入用户名"
                        :rules="[{ required: true}]" />


                    <van-field v-model="state.password" type="password" name="password" label="密码" placeholder="请输入密码"
                        :rules="[{ required: true }]" />

                </van-cell-group>

                <div class="text-center rounded-full mt-6 w-full py-[2vw]">
                    <van-button round block native-type="submit" :disabled="state.status">Login</van-button>
                </div>

            </van-form>
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
            title: '一条消息',
            message: '登录成功,正在跳转管理页!',
        });
        router.push('/admin');
    } else {
        showDialog({
            title: '一条消息',
            message: data.message || '登录失败',
        });
    }
    state.status = false;
};
</script>

<style lang="css" scoped>
:deep(.van-form) {
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
