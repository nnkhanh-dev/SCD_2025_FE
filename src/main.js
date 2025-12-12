import { createApp } from "vue";
import "./style.css";
import App from "./App.vue";
import router from "./router";
import Vue3Toastify, { toast } from "vue3-toastify";
import "vue3-toastify/dist/index.css";

createApp(App)
  .use(router)
  .use(Vue3Toastify, {
    autoClose: 3000,
  })
  .mount("#app");
