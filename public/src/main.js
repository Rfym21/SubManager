

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { Form, Field, CellGroup, Button } from 'vant'
import './style.css'
import 'vant/lib/index.css'
import 'animate.css'

const app = createApp(App)

app.use(router)
app.use(Button)
app.use(Form)
app.use(Field)
app.use(CellGroup)

app.mount('#app')
