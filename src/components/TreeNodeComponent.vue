<template>
  <li>
    <div @click="toggle" :class="{ folder: node.isDirectory }">
      <span v-if="node.isDirectory" class="folder">
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

<style scoped>
/* Estilos para a árvore com linhas */

.tree ul {
  list-style: none;
  margin: 0;
  padding-left: 14px;
  position: relative;
}

.tree ul::before {
  content: '';
  border-left: 1px solid #ccc;
  position: absolute;
  top: 0;
  bottom: 0;
  left: 10px;
}

.tree li {
  margin: 0;
  padding: 0 0 0 10px;
  position: relative;
  list-style: none;
}

.tree li::before {
  content: '';
  border-top: 1px solid #ccc;
  position: absolute;
  top: 10px;
  left: -4px;
  width: 10px;
}

.tree li:last-child::before {
  background: #fff;
  height: 10px;
}

.tree li:last-child::after {
  content: '';
  position: absolute;
  left: 10px;
  width: 1px;
  height: 100%;
  background: #fff;
  bottom: 0;
}

.folder {
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
}

.new-keys-count {
  color: red;
  font-weight: bold;
  margin-left: 5px;
  font-size: 14px;
  margin-right: 2px;
}

.pending-indicator {
  color: red;
  font-weight: bold;
  margin-right: 5px;
  margin-top: 7px;
}

.file {
  cursor: pointer;
  display: flex;
  align-items: center;

}
</style>
