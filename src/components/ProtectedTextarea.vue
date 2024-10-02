<!-- src/components/ProtectedTextarea.vue -->
<template>
  <div>
    <textarea :value="editableText" @input="onInput" @blur="onBlur" :ref="(el) => inputs.push(el)"></textarea>
  </div>
</template>

<script>
import { defineComponent, nextTick, onMounted, ref, watch } from "vue";

export default defineComponent({
  name: "ProtectedTextarea",
  props: {
    value: String,
  },
  emits: ["update:value"],
  setup(props, { emit }) {
    const editableText = ref(props.value);
    const inputs = ref([]);


    watch(
      () => props.value,
      (newVal) => {
        editableText.value = newVal;
      }
    );

    onMounted(() => {
      nextTick(() => {
        const newTextarea = inputs.value[inputs.value.length - 1];
        if (newTextarea) autoResize({ target: newTextarea });
      });
    });

    const onInput = (event) => {
      editableText.value = event.target.value;
      autoResize(event);
    };

    const autoResize = (event) => {
      const textarea = event.target;
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + 'px';
    }

    const onBlur = () => {
      const originalSpecialParts = extractSpecialParts(props.value);
      const newSpecialParts = extractSpecialParts(editableText.value);

      if (
        JSON.stringify(originalSpecialParts) !== JSON.stringify(newSpecialParts)
      ) {
        alert("Você não pode alterar o conteúdo dentro de [], $$ ou @!");
        editableText.value = props.value;
      } else {
        emit("update:value", editableText.value);
      }
    };

    const extractSpecialParts = (text) => {
      const brackets = text.match(/\[.*?\]/g) || [];
      const cifrons = text.match(/\$.*?\$/g) || [];
      const atAndExclamation = text.match(/@.*?!/g) || [];
      return { brackets, cifrons, atAndExclamation };
    };

    return {
      editableText,
      onInput,
      onBlur,
      inputs
    };
  },
});
</script>

<style>
textarea {
  width: 100%;
  height: 80px;
  padding: 10px;
  font-size: 14px;
  box-sizing: border-box;
  resize: none;
  overflow: hidden;
}
</style>
