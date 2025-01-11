<template>
  <div class="recent-files">
    <button @click="showFiles = !showFiles" class="recent-files-button" :class="{ active: showFiles }">
      <span class="button-icon">📂</span>
      Arquivos Recentes
    </button>

    <div v-if="showFiles" class="recent-files-dropdown">
      <div class="recent-files-header">
        <h3>Arquivos Recentes</h3>
        <button @click="clearFiles" class="clear-button" title="Limpar lista de arquivos recentes">
          <span class="button-icon">🗑️</span>
          Limpar
        </button>
      </div>

      <div v-if="recentFiles.length === 0" class="no-files">
        Nenhum arquivo recente
      </div>

      <div v-else class="files-list">
        <div v-for="file in recentFiles" :key="file.fileName" class="file-item" @click="loadFile(file)">
          <div class="file-info">
            <span class="file-name">{{ file.fileName }}</span>
            <span class="last-opened">{{ formatDate(file.lastOpened) }}</span>
          </div>
          <span class="load-icon">➔</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref } from 'vue'
import { useRecentFilesStore } from '../stores/recentFiles'
import { storeToRefs } from 'pinia'

export default defineComponent({
  name: 'RecentFiles',

  setup(props, { emit }) {
    const recentFilesStore = useRecentFilesStore()
    const { recentFiles } = storeToRefs(recentFilesStore)
    const showFiles = ref(false)

    // Carrega os arquivos salvos quando o componente é montado
    recentFilesStore.loadFromLocalStorage()

    const formatDate = (dateString) => {
      const date = new Date(dateString)
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date)
    }

    const loadFile = (file) => {
      emit('load-file', file)
      showFiles.value = false
    }

    const clearFiles = () => {
      recentFilesStore.clearFiles()
    }

    return {
      recentFiles,
      formatDate,
      loadFile,
      clearFiles,
      showFiles
    }
  }
})
</script>

<style scoped>
.recent-files {
  position: relative;
}

.recent-files-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0 16px;
  height: 36px;
  border: none;
  border-radius: 6px;
  background-color: #4a5568;
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.recent-files-button:hover,
.recent-files-button.active {
  background-color: #2d3748;
}

.recent-files-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 300px;
  background-color: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  z-index: 100;
}

.recent-files-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border-bottom: 1px solid #e2e8f0;
}

.recent-files-header h3 {
  margin: 0;
  color: #2d3748;
  font-size: 14px;
  font-weight: 600;
}

.clear-button {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border: none;
  border-radius: 4px;
  background-color: #fee2e2;
  color: #dc2626;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.clear-button:hover {
  background-color: #fecaca;
}

.no-files {
  text-align: center;
  padding: 12px;
  color: #718096;
  font-size: 12px;
  font-style: italic;
}

.files-list {
  max-height: 300px;
  overflow-y: auto;
  padding: 8px;
}

.file-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 4px;
}

.file-item:hover {
  background-color: #f1f5f9;
  transform: translateX(4px);
}

.file-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow: hidden;
  min-width: 0;
}

.file-name {
  font-weight: 500;
  color: #2d3748;
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.last-opened {
  font-size: 11px;
  color: #718096;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.load-icon {
  color: #3b82f6;
  font-size: 14px;
  opacity: 0;
  transition: all 0.2s ease;
  margin-left: 8px;
  flex-shrink: 0;
}

.file-item:hover .load-icon {
  opacity: 1;
}

.button-icon {
  font-size: 14px;
  line-height: 1;
}
</style>