// src/main.js
import { createApp } from "vue";
import { createPinia } from "pinia";
// import TreeNode from "./utils/TreeNode";
import App from "./App.vue";
import VueVirtualScroller from "vue-virtual-scroller";
import "vue-virtual-scroller/dist/vue-virtual-scroller.css";

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(VueVirtualScroller);
app.mount("#app");
