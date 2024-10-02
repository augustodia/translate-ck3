<!-- src/components/Sidebar.vue -->
<template>
  <div class="sidebar">
    <ul>
      <TreeNode v-for="child in rootNode.children" :key="child.path" :node="child" @select-file="onSelectFile" />
    </ul>
  </div>
</template>

<script>
import { defineComponent } from "vue";
import TreeNodeComponent from "./TreeNodeComponent.vue";

export default defineComponent({
  name: "Sidebar",
  components: {
    TreeNode: TreeNodeComponent,
  },
  props: {
    rootNode: Object,
  },
  emits: ["select-file"],
  setup(props, { emit }) {
    const onSelectFile = (filePath) => {
      emit("select-file", filePath);
    };

    return {
      onSelectFile,
    };
  },
});
</script>

<style>
.sidebar {
  width: 250px;
  border: 1px solid #7d7d7d;
  overflow-y: auto;
  border-right: 1px solid #ccc;
  height: calc(100vh - 90px);
}
</style>
