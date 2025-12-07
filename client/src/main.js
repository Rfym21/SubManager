import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import {
  Form,
  Field,
  CellGroup,
  Cell,
  Button,
  Dialog,
  Toast,
  Tab,
  Tabs
} from 'vant';
import './style.css';
import 'vant/lib/index.css';
import 'animate.css';

const app = createApp(App);

app.use(router);
app.use(Form);
app.use(Field);
app.use(CellGroup);
app.use(Cell);
app.use(Button);
app.use(Dialog);
app.use(Toast);
app.use(Tab);
app.use(Tabs);

app.mount('#app');
