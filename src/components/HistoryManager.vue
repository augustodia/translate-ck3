<template>
  <button @click="toggleHistory" class="action-button history-button" title="Ver histórico de alterações">
    <span class="button-icon">📋</span>
    Histórico
  </button>

  <template v-if="showHistory">
    <div class="modal-overlay" @click="toggleHistory"></div>
    <div class="history-modal">
      <div class="modal-header">
        <h3>Histórico de Alterações</h3>
        <button @click="toggleHistory" class="close-button" title="Fechar">×</button>
      </div>

      <div class="modal-content">
        <div v-if="loading" class="loading-state">
          Carregando histórico...
        </div>
        <div v-else-if="history.length > 0" class="history-list">
          <div v-for="entry in history" :key="entry.timestamp" class="history-item">
            <div class="history-info">
              <span class="history-date">{{ formatDate(entry.timestamp) }}</span>
              <span class="history-meta">
                {{ entry.key }} - {{ getChangeDescription(entry) }}
              </span>
            </div>
            <button @click="restoreVersion(entry)" class="restore-button" :disabled="loading">
              Restaurar
            </button>
          </div>
        </div>
        <div v-else class="no-history">
          Nenhuma alteração registrada ainda.
        </div>
      </div>
    </div>
  </template>
</template>

<script>
import { ref, onMounted } from 'vue'

export default {
  name: 'HistoryManager',
  props: {
    fileName: {
      type: String,
      required: true
    },
    content: {
      type: Object,
      required: true
    }
  },
  emits: ['restore-version'],
  setup(props, { emit }) {
    const showHistory = ref(false)
    const history = ref([])
    const loading = ref(false)

    const formatDate = (timestamp) => {
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(new Date(timestamp))
    }

    const getChangeDescription = (entry) => {
      if (entry.type === 'translation') {
        return `Tradução atualizada`
      }
      if (entry.type === 'status') {
        return entry.isTranslated ? 'Marcado como traduzido' : 'Marcado como não traduzido'
      }
      return 'Alteração realizada'
    }

    const loadHistory = async () => {
      loading.value = true
      try {
        const historyKey = `translation_history_${props.fileName}`
        const savedHistory = localStorage.getItem(historyKey)
        history.value = savedHistory ? JSON.parse(savedHistory) : []
      } catch (error) {
        console.error('Erro ao carregar histórico:', error)
        history.value = []
      } finally {
        loading.value = false
      }
    }

    const toggleHistory = () => {
      showHistory.value = !showHistory.value
      if (showHistory.value) {
        loadHistory()
      }
    }

    const restoreVersion = async (entry) => {
      loading.value = true
      try {
        emit('restore-version', entry)
        showHistory.value = false
      } catch (error) {
        console.error('Erro ao restaurar versão:', error)
      } finally {
        loading.value = false
      }
    }

    onMounted(loadHistory)

    return {
      showHistory,
      history,
      loading,
      toggleHistory,
      formatDate,
      getChangeDescription,
      restoreVersion
    }
  }
}
</script>

<style scoped>
.history-modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  width: 800px;
  max-width: 90vw;
  z-index: 1000;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
}

.modal-header h3 {
  margin: 0;
  font-size: 16px;
  color: #2d3748;
  font-weight: 600;
}

.close-button {
  background: none;
  border: none;
  font-size: 20px;
  color: #718096;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.close-button:hover {
  background-color: #e2e8f0;
  color: #4a5568;
}

.modal-content {
  padding: 20px;
  max-height: 60vh;
  overflow-y: auto;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
}

.history-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.history-date {
  font-size: 14px;
  font-weight: 500;
  color: #2d3748;
}

.history-meta {
  font-size: 12px;
  color: #718096;
}

.restore-button {
  background-color: #16915e;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 6px 12px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.restore-button:hover {
  background-color: #147a4f;
}

.restore-button:disabled {
  background-color: #cbd5e0;
  cursor: not-allowed;
}

.loading-state {
  text-align: center;
  padding: 32px 20px;
  color: #718096;
}

.no-history {
  text-align: center;
  padding: 32px 20px;
  color: #718096;
}

.history-button {
  background-color: #4a5568;
}

.history-button:hover {
  background-color: #2d3748;
}
</style>