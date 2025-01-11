<template>
  <div>
    <h2 style="margin-top: 0">{{ fileName }}</h2>
    <div class="actions-container">
      <SearchBar 
        :content="content"
        @search-results="handleSearchResults"
      />
      <button @click="markAllTranslated()" style="margin-bottom: 20px">
        {{ 'Marcar tudo como Traduzido' }}
      </button>
    </div>

    <DynamicScroller :items="displayedContent" :min-item-size="100" class="translation-list">
      <template #default="{ item, index, active }">
        <DynamicScrollerItem :item="item" :active="active" :data-index="index" :data-active="active" :size-dependencies="[
          item.value,
        ]" :key="item.id">
          <div class="translation-item" :class="{ 'new-key': !item.isTranslated }">
            <label>{{ item.id }}</label>
            <ProtectedTextarea :value="item.value" @update:value="(newValue) => updateValue(item.id, newValue)" />
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
import { defineComponent, ref, computed } from 'vue';
import ProtectedTextarea from './ProtectedTextarea.vue';
import SearchBar from './SearchBar.vue';
import { DynamicScroller, DynamicScrollerItem } from 'vue-virtual-scroller';

export default defineComponent({
  name: 'TranslationForm',
  components: {
    ProtectedTextarea,
    DynamicScroller,
    DynamicScrollerItem,
    SearchBar
  },
  props: {
    fileName: String,
    content: Object,
  },
  emits: ['update-content'],
  setup(props, { emit }) {
    const filteredContent = ref(null)

    const updateValue = (key, newValue) => {
      props.content[key] = { value: newValue, isTranslated: true };
      emit('update-content', props.content);
    };

    const handleSearchResults = (results) => {
      filteredContent.value = results
    }

    const displayedContent = computed(() => {
      const contentToUse = filteredContent.value || props.content
      return Object.keys(contentToUse)
        .sort((a, b) => {
          if (!contentToUse[a].isTranslated && contentToUse[b].isTranslated) return -1;
          if (contentToUse[a].isTranslated && !contentToUse[b].isTranslated) return 1;
          return 0;
        })
        .map((key) => ({
          id: key,
          value: contentToUse[key].value,
          isTranslated: contentToUse[key].isTranslated,
        }));
    });

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
      displayedContent,
      toggleTranslated,
      markAllTranslated,
      handleSearchResults
    };
  },
});
</script>

<style>
.actions-container {
  margin-bottom: 20px;
}

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
}

.translated-key {
  opacity: 0.5;
}
</style>
