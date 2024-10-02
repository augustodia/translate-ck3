<template>
  <div>
    <h2 style="margin-top: 0">{{ fileName }}</h2>
    <button @click="markAllTranslated()" style="margin-bottom: 20px">
      {{ 'Marcar tudo como Traduzido' }}
    </button>

    <DynamicScroller :items="getContentArray(content)" :min-item-size="100" class="translation-list">
      <template #default="{ item, index, active }">
        <DynamicScrollerItem :item="item" :active="active" :data-index="index" :data-active="active" :size-dependencies="[
          item.value,
        ]" :key="item.id">
          <div class="translation-item" :class="{ 'new-key': !item.isTranslated }">
            <label>{{ item.id }}</label>
            <ProtectedTextarea :value="item.value" @update:value="(newValue) => updateValue(item.key, newValue)" />
            <button @click="toggleTranslated(item.id)">
              {{ item.isTranslated ? 'Desmarcar como Traduzido' : 'Marcar como Traduzido' }}
            </button>
          </div>
        </DynamicScrollerItem>
      </template>
    </DynamicScroller>
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import ProtectedTextarea from './ProtectedTextarea.vue';
import { DynamicScroller, DynamicScrollerItem } from 'vue-virtual-scroller';

export default defineComponent({
  name: 'TranslationForm',
  components: {
    ProtectedTextarea,
    DynamicScroller,
    DynamicScrollerItem
  },
  props: {
    fileName: String,
    content: Object,
  },
  emits: ['update-content'],
  setup(props, { emit }) {
    const updateValue = (key, newValue) => {
      props.content[key].value = newValue;
      emit('update-content', props.content);
    };

    const getContentArray = (content) => {
      return Object.keys(content)
        .sort((a, b) => {
          if (!content[a].isTranslated && content[b].isTranslated) return -1;
          if (content[a].isTranslated && !content[b].isTranslated) return 1;
          return 0;
        })
        .map((key) => ({
          id: key,
          value: content[key].value,
          isTranslated: content[key].isTranslated,
        }));
    };

    const markAllTranslated = () => {
      const newContent = { ...props.content };
      Object.keys(newContent).forEach((key) => {
        newContent[key].isTranslated = true;
      });
      emit('update-content', newContent);
    };

    const toggleTranslated = (key) => {
      props.content[key].isTranslated = !props.content[key].isTranslated;
      emit('update-content', props.content);
    };

    return {
      updateValue,
      getContentArray,
      toggleTranslated,
      markAllTranslated
    };
  },
});
</script>

<style>
.translation-list {
  max-height: calc(100vh - 218px);
  overflow-y: auto;
  border: 1px solid #7d7d7d;
}

.translation-item {
  padding: 10px;
  border-bottom: 1px solid #ccc;
  margin-bottom: 10px;
}

label {
  font-weight: bold;
  display: block;
  margin-bottom: 5px;
}

.new-key {
  background-color: #ffe6e6;
  /* Fundo vermelho claro */
}

.translated-key {
  opacity: 0.5;
  /* Chaves traduzidas aparecem desbotadas */
}
</style>
