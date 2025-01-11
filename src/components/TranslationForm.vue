<template>
  <div>
    <h2 style="margin-top: 0">{{ fileName }}</h2>

    <ProgressBar :content="content" />

    <div class="actions-container">
      <SearchBar :content="content" @search-results="handleSearchResults" />
      <button @click="markAllTranslated()" class="action-button"
        title="Marca todos os textos desta página como traduzidos">
        {{ 'Marcar tudo como Traduzido' }}
      </button>
    </div>

    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <span>Carregando traduções...</span>
    </div>

    <DynamicScroller v-else :items="displayedContent" :min-item-size="100" class="translation-list">
      <template #default="{ item, index, active }">
        <DynamicScrollerItem :item="item" :active="active" :data-index="index" :data-active="active"
          :size-dependencies="[item.value]" :key="item.id">
          <div class="translation-item" :class="{ 'new-key': !item.isTranslated }"
            :title="!item.isTranslated ? 'Este texto ainda não foi traduzido' : 'Este texto já foi traduzido'">
            <label>{{ item.id }}</label>
            <ProtectedTextarea :value="item.value" @update:value="(newValue) => updateValue(item.id, newValue)"
              :placeholder="'Digite a tradução aqui...'" />
            <button @click="toggleTranslated(item.id)" class="toggle-button"
              :title="item.isTranslated ? 'Marcar como não traduzido' : 'Marcar como traduzido'">
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
import ProgressBar from './ProgressBar.vue';
import { DynamicScroller, DynamicScrollerItem } from 'vue-virtual-scroller';

export default defineComponent({
  name: 'TranslationForm',
  components: {
    ProtectedTextarea,
    DynamicScroller,
    DynamicScrollerItem,
    SearchBar,
    ProgressBar
  },
  props: {
    fileName: String,
    content: Object,
  },
  emits: ['update-content'],
  setup(props, { emit }) {
    const filteredContent = ref(null)
    const loading = ref(false)

    const updateValue = (key, newValue) => {
      loading.value = true
      props.content[key] = { value: newValue, isTranslated: true };
      emit('update-content', props.content);
      loading.value = false
    };

    const handleSearchResults = (results) => {
      loading.value = true
      filteredContent.value = results
      loading.value = false
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
      loading.value = true
      const newContent = { ...props.content };
      Object.keys(newContent).forEach((key) => {
        newContent[key].isTranslated = true;
      });
      emit('update-content', newContent);
      loading.value = false
    };

    const toggleTranslated = (key) => {
      loading.value = true
      props.content[key].isTranslated = !props.content[key].isTranslated;
      emit('update-content', props.content);
      loading.value = false
    };

    return {
      updateValue,
      displayedContent,
      toggleTranslated,
      markAllTranslated,
      handleSearchResults,
      loading
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
  border-radius: 4px;
}

.translation-item {
  padding: 15px;
  border-bottom: 1px solid #ccc;
  margin-bottom: 10px;
  transition: background-color 0.2s ease;
}

.translation-item:hover {
  background-color: #f8f8f8;
}

label {
  font-weight: bold;
  display: block;
  margin-bottom: 8px;
  color: #333;
}

.new-key {
  background-color: #ffe6e6;
}

.translated-key {
  opacity: 0.5;
}

.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  gap: 10px;
  color: #666;
}

.loading-spinner {
  width: 24px;
  height: 24px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #16915e;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.action-button,
.toggle-button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s ease;
}

.action-button {
  background-color: #16915e;
  color: white;
}

.action-button:hover {
  background-color: #147a4f;
}

.toggle-button {
  background-color: #f0f0f0;
  color: #333;
}

.toggle-button:hover {
  background-color: #e0e0e0;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}
</style>
