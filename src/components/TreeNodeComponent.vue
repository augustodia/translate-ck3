<!-- src/components/TreeNodeComponent.vue -->
<template>
  <li>
    <div @click="toggle" :class="{ folder: node.isDirectory }">

      <span v-if="node.isDirectory">
        <span v-if="node.hasPending" class="pending-indicator">*</span> {{ node.name }}
      </span>
      <span v-else @click.stop="selectFile" class="file">
        <span v-if="node.newKeysCount > 0 && node.hasPending" class="new-keys-count">
          ({{ node.newKeysCount }})
        </span>
        {{ node.name }}
      </span>
    </div>
    <ul v-if="node.isDirectory && isOpen">
      <TreeNode v-for="child in node.children" :key="child.path" :node="child"
        @select-file="$emit('select-file', $event)" />
    </ul>
  </li>
</template>

<script>
export default {
  name: "TreeNode",
  props: {
    node: Object,
  },
  emits: ["select-file"],
  data() {
    return {
      isOpen: false,
    };
  },
  methods: {
    toggle() {
      if (this.node.isDirectory) {
        this.isOpen = !this.isOpen;
      }
    },
    selectFile() {
      this.$emit("select-file", this.node.path);
    },
  },
};
</script>

<style>
.folder {
  font-weight: bold;
}

li {
  list-style-type: none;
}

li div {
  cursor: pointer;
}

ul {
  padding-left: 15px;
}

.new-keys-count {
  color: red;
  font-weight: bold;
  margin-left: 5px;
  font-size: 14px;
  margin-right: 2px;
}

.file {
  cursor: pointer;
  display: flex;
}

.pending-indicator {
  color: red;
  font-weight: bold;
  margin-left: 5px;
}
</style>
