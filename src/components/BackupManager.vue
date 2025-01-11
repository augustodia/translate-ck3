<template>
  <div class="backup-manager">
    <button @click="toggleBackupList" class="backup-button" title="Gerenciar backups das traduções">
      <span class="backup-icon">📁</span>
      Backups
      <span v-if="loading" class="loading-dot"></span>
    </button>

    <div v-if="showBackups" class="backup-list">
      <div class="backup-header">
        <h3>Backups Disponíveis</h3>
        <button @click="toggleBackupList" class="close-button">×</button>
      </div>

      <div v-if="loading" class="backup-loading">
        Carregando backups...
      </div>

      <div v-else-if="backups.length === 0" class="no-backups">
        Nenhum backup encontrado para este arquivo.
      </div>

      <div v-else class="backup-items">
        <div v-for="backup in backups" :key="backup.key" class="backup-item">
          <div class="backup-info">
            <span class="backup-date">
              {{ formatDate(backup.timestamp) }}
            </span>
          </div>
          <div class="backup-actions">
            <button @click="restoreBackupVersion(backup.key)" class="restore-button" title="Restaurar esta versão"
              :disabled="loading">
              Restaurar
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, watch } from 'vue'
import { listBackups, restoreBackup, createBackup } from '../utils/validation'

export default {
  name: 'BackupManager',
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
  emits: ['restore-backup'],
  setup(props, { emit }) {
    const showBackups = ref(false)
    const backups = ref([])
    const loading = ref(false)
    const isRestoring = ref(false)

    const formatDate = (timestamp) => {
      try {
        const date = new Date(timestamp)
        return new Intl.DateTimeFormat('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        }).format(date)
      } catch (error) {
        console.error('Erro ao formatar data:', error)
        return 'Data inválida'
      }
    }

    const loadBackups = async () => {
      try {
        loading.value = true
        backups.value = await listBackups(props.fileName)
      } catch (error) {
        console.error('Erro ao carregar backups:', error)
      } finally {
        loading.value = false
      }
    }

    const toggleBackupList = () => {
      showBackups.value = !showBackups.value
      if (showBackups.value) {
        loadBackups()
      }
    }

    const restoreBackupVersion = async (backupKey) => {
      try {
        loading.value = true
        isRestoring.value = true
        const restoredData = await restoreBackup(backupKey)
        emit('restore-backup', restoredData.content)
        showBackups.value = false
        await loadBackups()
      } catch (error) {
        alert(`Erro ao restaurar backup: ${error.message}`)
      } finally {
        loading.value = false
        isRestoring.value = false
      }
    }

    // Criar backup automático quando o conteúdo mudar
    watch(() => props.content, async (newContent) => {
      if (isRestoring.value) return

      try {
        loading.value = true
        await createBackup(newContent, props.fileName)
        await loadBackups()
      } catch (error) {
        console.error('Erro ao criar backup automático:', error)
      } finally {
        loading.value = false
      }
    }, { deep: true })

    onMounted(async () => {
      try {
        loading.value = true
        await createBackup(props.content, props.fileName)
        await loadBackups()
      } catch (error) {
        console.error('Erro ao criar backup inicial:', error)
      } finally {
        loading.value = false
      }
    })

    return {
      showBackups,
      backups,
      loading,
      toggleBackupList,
      restoreBackupVersion,
      formatDate
    }
  }
}
</script>

<style scoped>
.backup-manager {
  position: relative;
  display: inline-block;
}

.backup-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background-color: #f0f0f0;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s ease;
}

.backup-button:hover {
  background-color: #e0e0e0;
}

.backup-icon {
  font-size: 16px;
}

.loading-dot {
  width: 8px;
  height: 8px;
  background-color: #16915e;
  border-radius: 50%;
  animation: pulse 1s infinite;
}

.backup-list {
  position: absolute;
  top: 100%;
  right: 0;
  width: 300px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  margin-top: 8px;
  z-index: 1000;
}

.backup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #eee;
}

.backup-header h3 {
  margin: 0;
  font-size: 16px;
  color: #333;
}

.close-button {
  background: none;
  border: none;
  font-size: 20px;
  color: #666;
  cursor: pointer;
  padding: 0 4px;
}

.close-button:hover {
  color: #333;
}

.backup-loading,
.no-backups {
  padding: 16px;
  text-align: center;
  color: #666;
}

.backup-items {
  max-height: 300px;
  overflow-y: auto;
}

.backup-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #eee;
}

.backup-info {
  flex: 1;
}

.backup-date {
  font-size: 14px;
  color: #333;
}

.backup-actions {
  display: flex;
  gap: 8px;
}

.restore-button {
  padding: 4px 8px;
  background-color: #16915e;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: background-color 0.2s ease;
}

.restore-button:hover:not(:disabled) {
  background-color: #147a4f;
}

.restore-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@keyframes pulse {
  0% {
    opacity: 0.5;
    transform: scale(0.8);
  }

  50% {
    opacity: 1;
    transform: scale(1);
  }

  100% {
    opacity: 0.5;
    transform: scale(0.8);
  }
}
</style>