<template>
  <div class="translation-container">
    <header class="translation-header">
      <div class="header-main">
        <h2>{{ fileName }}</h2>
        <ProgressBar :content="content" />
      </div>
    </header>

    <div class="toolbar">
      <div class="toolbar-section search-section">
        <SearchBar :content="content" @search-results="handleSearchResults" />
      </div>

      <div class="toolbar-section actions-section">
        <button @click="$emit('export')" class="action-button export-button" title="Exportar arquivos traduzidos">
          <span class="button-icon">📥</span>
          Exportar Arquivos
        </button>
        <BackupManager :fileName="fileName" :content="content" @restore-backup="handleBackupRestore" />
        <HistoryManager :fileName="fileName" :content="content" @restore-version="handleVersionRestore" />
        <button @click="markAllTranslated()" class="action-button mark-all-button"
          title="Marca todos os textos desta página como traduzidos">
          <span class="button-icon">✓</span>
          Marcar tudo
        </button>
      </div>
    </div>

    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <span>{{ loadingMessage }}</span>
    </div>

    <div v-if="error" class="error-message">
      {{ error }}
    </div>

    <DynamicScroller v-else :items="displayedContent" :min-item-size="100" class="translation-list">
      <template #default="{ item, index, active }">
        <DynamicScrollerItem :item="item" :active="active" :data-index="index" :data-active="active"
          :size-dependencies="[item.value]" :key="item.id">
          <div class="translation-item" :class="{ 'new-key': !item.isTranslated }"
            :title="!item.isTranslated ? 'Este texto ainda não foi traduzido' : 'Este texto já foi traduzido'">
            <div class="translation-item-header">
              <label :for="'translation-' + item.id">{{ item.id }}</label>
              <div class="translation-actions">
                <button @click="debouncedGetSuggestions(item.id, item.value)" class="suggestion-trigger-button"
                  :disabled="loadingSuggestions.has(item.id) || isIndexing"
                  :title="isIndexing ? 'Indexando traduções...' : 'Buscar sugestões de tradução'">
                  <span class="button-icon">✨</span>
                </button>
                <button @click="toggleTranslated(item.id)" class="toggle-button"
                  :class="{ 'is-translated': item.isTranslated }"
                  :title="item.isTranslated ? 'Marcar como não traduzido' : 'Marcar como traduzido'">
                  <span class="button-icon">{{ item.isTranslated ? '✓' : '○' }}</span>
                  {{ item.isTranslated ? 'Traduzido' : 'Não Traduzido' }}
                </button>
              </div>
            </div>

            <ProtectedTextarea :id="'translation-' + item.id" :value="item.value"
              @update:value="(newValue) => updateValue(item.id, newValue)" :placeholder="'Digite a tradução aqui...'"
              class="translation-textarea" />

            <div v-if="suggestions[item.id] || loadingSuggestions.has(item.id)" class="suggestions-container">
              <div class="suggestions-header">
                <span>Sugestões de tradução</span>
                <div v-if="loadingSuggestions.has(item.id)" class="suggestions-loading">
                  <div class="loading-dots"></div>
                </div>
              </div>
              <div v-if="suggestions[item.id] && suggestions[item.id].length > 0"
                v-for="suggestion in suggestions[item.id]" :key="suggestion.key" class="suggestion-item">
                <div class="suggestion-content">
                  <div class="suggestion-text">{{ suggestion.value }}</div>
                  <div class="suggestion-source" :class="{ 'auto-translated': suggestion.isAutoTranslated }">
                    {{ suggestion.isAutoTranslated ? '🤖 Tradução Automática' : '📚 Tradução Similar' }}
                  </div>
                </div>
                <button @click="applySuggestion(item.id, suggestion.value)" class="suggestion-button">
                  <span class="button-icon">➔</span>
                  Usar
                </button>
              </div>
              <div v-else-if="suggestions[item.id] && suggestions[item.id].length === 0" class="no-suggestions">
                Nenhuma sugestão encontrada
              </div>
            </div>
          </div>
        </DynamicScrollerItem>
      </template>
    </DynamicScroller>
  </div>
</template>

<script>
import { defineComponent, ref, computed, watch, onMounted } from 'vue';
import ProtectedTextarea from './ProtectedTextarea.vue';
import SearchBar from './SearchBar.vue';
import ProgressBar from './ProgressBar.vue';
import BackupManager from './BackupManager.vue';
import HistoryManager from './HistoryManager.vue';
import { DynamicScroller, DynamicScrollerItem } from 'vue-virtual-scroller';
import { validateYamlContent } from '../utils/validation';
import { suggestionService } from '../utils/suggestionService';

// Função de debounce
const debounce = (fn, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

export default defineComponent({
  name: 'TranslationForm',
  components: {
    ProtectedTextarea,
    DynamicScroller,
    DynamicScrollerItem,
    SearchBar,
    ProgressBar,
    BackupManager,
    HistoryManager
  },
  props: {
    fileName: String,
    content: Object,
    mergedContent: {
      type: Object,
      required: true
    },
  },
  emits: ['update-content', 'export'],
  setup(props, { emit }) {
    const filteredContent = ref(null);
    const loading = ref(false);
    const loadingMessage = ref('');
    const error = ref(null);
    const suggestions = ref({});
    const isIndexing = ref(false);
    const loadingSuggestions = ref(new Set());

    const debouncedGetSuggestions = debounce(async (key, value) => {
      if (!value?.trim()) {
        suggestions.value[key] = [];
        return;
      }

      loadingSuggestions.value.add(key);
      try {
        suggestions.value[key] = await suggestionService.getSuggestions(key, value);
      } finally {
        loadingSuggestions.value.delete(key);
      }
    }, 300);

    // Cria o índice quando o componente é montado
    onMounted(async () => {
      if (props.mergedContent) {
        isIndexing.value = true;
        await suggestionService.createIndex(props.mergedContent);
        isIndexing.value = false;
      }
    });

    // Atualiza o índice quando o conteúdo muda
    watch(() => props.mergedContent, async (newContent) => {
      if (newContent) {
        isIndexing.value = true;
        await suggestionService.createIndex(newContent);
        isIndexing.value = false;
      }
    });

    const setLoading = (isLoading, message = 'Carregando traduções...') => {
      loading.value = isLoading
      loadingMessage.value = message
      if (isLoading) {
        error.value = null
      }
    }

    const handleError = (err) => {
      error.value = err.message
      loading.value = false
    }

    const validateContent = (content) => {
      try {
        const yamlContent = Object.entries(content).reduce((acc, [key, value]) => {
          acc[key] = value.value
          return acc
        }, {})

        validateYamlContent(yamlContent)
        return true
      } catch (err) {
        handleError(err)
        return false
      }
    }

    const addToHistory = async (key, type, data = {}) => {
      const historyKey = `translation_history_${props.fileName}`
      const savedHistory = localStorage.getItem(historyKey)
      const history = savedHistory ? JSON.parse(savedHistory) : []

      const entry = {
        timestamp: new Date().toISOString(),
        key,
        type,
        content: props.content[key],
        ...data
      }

      history.unshift(entry)
      if (history.length > 50) history.pop()

      localStorage.setItem(historyKey, JSON.stringify(history))
    }

    const handleVersionRestore = (entry) => {
      setLoading(true, 'Restaurando versão...')
      try {
        const updatedContent = { ...props.content }
        updatedContent[entry.key] = entry.content

        if (validateContent(updatedContent)) {
          emit('update-content', updatedContent)
        }
      } catch (err) {
        handleError(err)
      } finally {
        setLoading(false)
      }
    }

    const updateValue = async (key, newValue) => {
      try {
        // Se o valor não mudou, não faz nada
        if (props.content[key].value === newValue) return;

        const updatedContent = {
          ...props.content,
          [key]: {
            value: newValue,
            isTranslated: newValue.trim() !== '' // Só marca como traduzido se tiver conteúdo
          }
        }

        if (validateContent(updatedContent)) {
          await addToHistory(key, 'translation')
          emit('update-content', updatedContent)
        }
      } catch (err) {
        handleError(err)
      }
    }

    const applySuggestion = (key, suggestionValue) => {
      updateValue(key, suggestionValue)
      // Limpa as sugestões após aplicar
      suggestions.value[key] = [];
    }

    const handleSearchResults = (results) => {
      setLoading(true, 'Atualizando resultados...')
      try {
        filteredContent.value = results
      } catch (err) {
        handleError(err)
      } finally {
        setLoading(false)
      }
    }

    const handleBackupRestore = (restoredContent) => {
      setLoading(true, 'Restaurando backup...')
      try {
        if (validateContent(restoredContent)) {
          emit('update-content', restoredContent)
        }
      } catch (err) {
        handleError(err)
      } finally {
        setLoading(false)
      }
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
      setLoading(true, 'Marcando todos como traduzidos...')
      try {
        const newContent = { ...props.content };
        Object.keys(newContent).forEach((key) => {
          newContent[key].isTranslated = true;
        });

        if (validateContent(newContent)) {
          emit('update-content', newContent);
        }
      } catch (err) {
        handleError(err)
      } finally {
        setLoading(false)
      }
    };

    const toggleTranslated = (key) => {
      setLoading(true, 'Atualizando status...')
      try {
        const updatedContent = { ...props.content }
        const newStatus = !updatedContent[key].isTranslated
        updatedContent[key].isTranslated = newStatus

        if (validateContent(updatedContent)) {
          addToHistory(key, 'status', { isTranslated: newStatus })
          emit('update-content', updatedContent)
        }
      } catch (err) {
        handleError(err)
      } finally {
        setLoading(false)
      }
    };

    return {
      updateValue,
      displayedContent,
      toggleTranslated,
      markAllTranslated,
      handleSearchResults,
      handleBackupRestore,
      handleVersionRestore,
      loading,
      loadingMessage,
      error,
      suggestions,
      applySuggestion,
      isIndexing,
      loadingSuggestions,
      debouncedGetSuggestions,
    };
  },
});
</script>

<style>
.translation-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.translation-header {
  margin-bottom: 24px;
}

.header-main h2 {
  margin: 0 0 16px 0;
  color: #2c3e50;
  font-size: 24px;
}

.toolbar {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
  align-items: baseline;
}

.toolbar-section {
  display: flex;
  gap: 12px;
  align-items: center;
}

.search-section {
  flex: 1;
}

.actions-section {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  flex-wrap: wrap;
}

.translation-list {
  max-height: calc(100vh - 280px);
  overflow-y: auto;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: white;
}

.translation-item {
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
  transition: all 0.2s ease;
}

.translation-item:hover {
  background-color: #f8f9fa;
}

.translation-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.translation-textarea {
  width: 100%;
  min-height: 100px;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  font-size: 14px;
  line-height: 1.5;
  resize: vertical;
}

label {
  font-weight: 600;
  color: #2c3e50;
  font-size: 14px;
}

.new-key {
  background-color: #fff5f5;
}

.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  gap: 12px;
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

.error-message {
  background-color: #fff5f5;
  color: #e53e3e;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 20px;
  border: 1px solid #fed7d7;
}

.action-button,
.toggle-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  font-size: 14px;
  transition: all 0.2s ease;
}

.action-button {
  background-color: #16915e;
  color: white;
  height: 36px;
  padding: 0 16px;
}

.action-button:hover {
  background-color: #147a4f;
}

.mark-all-button {
  background-color: #2c5282;
  color: white;
}

.mark-all-button:hover {
  background-color: #2a4365;
}

.toggle-button {
  background-color: #edf2f7;
  color: #4a5568;
}

.toggle-button:hover {
  background-color: #e2e8f0;
}

.toggle-button.is-translated {
  background-color: #c6f6d5;
  color: #276749;
}

.toggle-button.is-translated:hover {
  background-color: #b2f5c2;
}

.button-icon {
  font-size: 16px;
  line-height: 1;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

@media (min-width: 768px) {
  .toolbar {
    flex-direction: row;
  }

  .search-section {
    flex: 2;
  }

  .actions-section {
    flex: 1;
  }
}

.export-button {
  background-color: #16915e;
  color: white;
}

.export-button:hover {
  background-color: #147a4f;
}

.suggestions-container {
  margin-top: 12px;
  padding: 12px;
  background-color: #f8f9fa;
  border-radius: 4px;
  border: 1px solid #e0e0e0;
}

.suggestions-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  color: #4a5568;
  margin-bottom: 8px;
  font-weight: 500;
}

.suggestions-loading {
  display: flex;
  align-items: center;
}

.loading-dots {
  width: 24px;
  height: 6px;
  background: linear-gradient(to right,
      #4a5568 0%,
      #4a5568 25%,
      transparent 25%,
      transparent 50%,
      #4a5568 50%,
      #4a5568 75%,
      transparent 75%,
      transparent 100%);
  background-size: 16px 100%;
  animation: loading-dots 1s infinite linear;
}

@keyframes loading-dots {
  from {
    background-position: 16px 0;
  }

  to {
    background-position: 0 0;
  }
}

.suggestion-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  background-color: white;
  border-radius: 4px;
  margin-bottom: 4px;
}

.suggestion-content {
  flex: 1;
  margin-right: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.suggestion-text {
  font-size: 14px;
  color: #2d3748;
}

.suggestion-source {
  font-size: 12px;
  color: #718096;
  display: flex;
  align-items: center;
  gap: 4px;
}

.suggestion-source.auto-translated {
  color: #805ad5;
}

.suggestion-button {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border: none;
  border-radius: 4px;
  background-color: #16915e;
  color: white;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.suggestion-button:hover {
  background-color: #147a4f;
}

.translation-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.suggestion-trigger-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  background-color: #edf2f7;
  color: #4a5568;
  cursor: pointer;
  transition: all 0.2s ease;
}.suggestion-trigger-button:hover:not(:disabled) {
  background-color: #e2e8f0;
  transform: scale(1.05);
}

.suggestion-trigger-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.no-suggestions {
  text-align: center;
  padding: 12px;
  color: #718096;
  font-size: 14px;
  font-style: italic;
}
</style>
