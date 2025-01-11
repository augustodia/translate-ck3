<template>
  <div class="search-container">
    <div class="search-input-container">
      <input type="text" v-model="searchQuery" @input="handleSearch" placeholder="Buscar por texto..."
        class="search-input" />
      <div class="search-filters">
        <label class="filter-option">
          <input type="checkbox" v-model="filters.untranslated" @change="handleSearch" />
          Não Traduzidos
        </label>
        <label class="filter-option">
          <input type="checkbox" v-model="filters.translated" @change="handleSearch" />
          Traduzidos
        </label>
      </div>
    </div>
    <div class="search-stats" v-if="hasResults">
      Encontrados: {{ resultsCount }} itens
    </div>
  </div>
</template>

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
        if (filters.untranslated && item.isTranslated) continue
        if (filters.translated && !item.isTranslated) continue

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

<style scoped>
.search-container {
  padding: 15px;
  background: #f5f5f5;
  border-radius: 8px;
  margin-bottom: 15px;
}

.search-input-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.search-input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  width: 100%;
}

.search-filters {
  display: flex;
  gap: 15px;
}

.filter-option {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 14px;
  cursor: pointer;
}

.search-stats {
  margin-top: 8px;
  font-size: 12px;
  color: #666;
}
</style>