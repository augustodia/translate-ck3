<template>
  <div class="search-container">
    <div class="search-input-wrapper">
      <span class="search-icon">🔍</span>
      <input type="text" v-model="searchQuery" @input="handleSearch" placeholder="Buscar por texto..."
        class="search-input" />
    </div>
    <div class="search-filters">
      <label class="filter-option">
        <input type="checkbox" v-model="filters.untranslated" @change="handleSearch" />
        <span class="checkbox-label">Não Traduzidos</span>
      </label>
      <label class="filter-option">
        <input type="checkbox" v-model="filters.translated" @change="handleSearch" />
        <span class="checkbox-label">Traduzidos</span>
      </label>
    </div>
    <div class="search-stats" v-if="hasResults">
      Encontrados: {{ resultsCount }} itens
    </div>
  </div>
</template>

<style scoped>
.search-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.search-input-wrapper {
  position: relative;
  width: 100%;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #718096;
  font-size: 14px;
}

.search-input {
  width: 100%;
  height: 24px;
  padding: 6px 12px 6px 36px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 14px;
  color: #2d3748;
  background-color: white;
  transition: all 0.2s ease;
}

.search-input:focus {
  outline: none;
  border-color: #16915e;
  box-shadow: 0 0 0 3px rgba(22, 145, 94, 0.1);
}

.search-input::placeholder {
  color: #a0aec0;
}

.search-filters {
  display: flex;
  gap: 16px;
  padding: 0;
  margin-top: 4px;
}

.filter-option {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  user-select: none;
}

.filter-option input[type="checkbox"] {
  width: 14px;
  height: 14px;
  cursor: pointer;
  accent-color: #16915e;
}

.checkbox-label {
  font-size: 14px;
  color: #4a5568;
}

.search-stats {
  font-size: 12px;
  color: #718096;
  padding: 0 4px;
}
</style>

<script>
import { ref, reactive } from 'vue'

export default {
  name: 'SearchBar',
  props: {
    content: {
      type: Object,
      required: true
    }
  },
  emits: ['search-results'],
  setup(props, { emit }) {
    const searchQuery = ref('')
    const filters = reactive({
      untranslated: false,
      translated: false
    })
    const resultsCount = ref(0)
    const hasResults = ref(false)

    const handleSearch = () => {
      const results = {}

      for (const [key, item] of Object.entries(props.content)) {
        // Verifica os filtros de tradução
        if (filters.untranslated && item.isTranslated) continue
        if (filters.translated && !item.isTranslated) continue

        // Se tiver texto na busca, verifica se corresponde
        if (searchQuery.value) {
          const matchesSearch =
            key.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
            item.value.toLowerCase().includes(searchQuery.value.toLowerCase())

          if (!matchesSearch) continue
        }

        results[key] = item
      }

      resultsCount.value = Object.keys(results).length
      hasResults.value = resultsCount.value > 0
      emit('search-results', results)
    }

    return {
      searchQuery,
      filters,
      resultsCount,
      hasResults,
      handleSearch
    }
  }
}
</script>