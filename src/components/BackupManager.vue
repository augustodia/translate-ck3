<template>
  <button @click="toggleBackupList" class="action-button backup-button" title="Gerenciar backups">
    <span class="button-icon">📁</span>
    Backups
  </button>

  <template v-if="showBackups">
    <div class="modal-overlay" @click="toggleBackupList"></div>
    <div class="backup-modal">
      <div class="modal-header">
        <h3>Backups Disponíveis</h3>
        <button @click="toggleBackupList" class="close-button" title="Fechar">×</button>
      </div>

      <div class="modal-content">
        <div v-if="loading" class="loading-state">
          Carregando backups...
        </div>
        <div v-else-if="backups && backups.length > 0" class="backup-list">
          <div v-for="backup in backups" :key="backup.timestamp" class="backup-item">
            <div class="backup-info">
              <span class="backup-date">{{ formatDate(backup.timestamp) }}</span>
              <span class="backup-meta">
                {{ backup.fileName }}
              </span>
            </div>
            <button @click="restoreBackupVersion(backup)" class="restore-button" :disabled="loading">
              {{ loading ? 'Restaurando...' : 'Restaurar' }}
            </button>
          </div>
        </div>
        <div v-else class="no-backups">
          Nenhum backup disponível ainda.
          <br>
          Os backups são criados automaticamente a cada alteração.
        </div>
      </div>
    </div>
  </template>
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
  emits: ['restore-backup', 'update:content'],
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
        loading.value = true;
        const backupList = await listBackups(props.fileName);
        backups.value = backupList.sort((a, b) =>
          new Date(b.timestamp) - new Date(a.timestamp)
        );
      } catch (error) {
        console.error('Erro ao carregar backups:', error);
        backups.value = [];
      } finally {
        loading.value = false;
      }
    }

    const toggleBackupList = () => {
      showBackups.value = !showBackups.value
      if (showBackups.value) {
        loadBackups()
      }
    }

    const restoreBackupVersion = async (backup) => {
      try {
        loading.value = true;
        isRestoring.value = true;

        const key = backup.key;
        console.log('Tentando restaurar backup com chave:', key);

        const backupData = await restoreBackup(key);
        console.log('Dados restaurados:', backupData);

        if (!backupData) {
          throw new Error('Backup não encontrado ou inválido');
        }

        // Emite o evento com os dados restaurados
        emit('update:content', backupData);
        emit('restore-backup', backupData);
        showBackups.value = false;

        // Mantém isRestoring como true por um curto período após a restauração
        setTimeout(() => {
          isRestoring.value = false;
        }, 1000);

      } catch (error) {
        console.error('Erro ao restaurar backup:', error);
        alert(`Erro ao restaurar backup: ${error.message}`);
        isRestoring.value = false;
      } finally {
        loading.value = false;
      }
    }

    // Watch para criar backups
    watch(() => props.content, async () => {
      // Não cria backup se estiver restaurando ou se não houver conteúdo
      if (isRestoring.value || !props.content) return;

      try {
        await createBackup(props.content, props.fileName);
      } catch (error) {
        console.error('Erro ao criar backup automático:', error);
      }
    }, { deep: true });

    // Criação do backup inicial
    onMounted(async () => {
      if (props.content) {
        try {
          await createBackup(props.content, props.fileName);
        } catch (error) {
          console.error('Erro ao criar backup inicial:', error);
        }
      }
      await loadBackups();
    });

    const getTranslatedCount = (content) => {
      if (!content) return 0;
      return Object.values(content).filter(item => item.isTranslated).length;
    }

    const getTotalCount = (content) => {
      if (!content) return 0;
      return Object.keys(content).length;
    }

    return {
      showBackups,
      backups,
      loading,
      toggleBackupList,
      restoreBackupVersion,
      formatDate,
      getTranslatedCount,
      getTotalCount
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
  background-color: #edf2f7;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  font-size: 14px;
  color: #4a5568;
  transition: all 0.2s ease;
}

.backup-button:hover {
  background-color: #e2e8f0;
}

.backup-icon {
  font-size: 16px;
}

.loading-dot {
  width: 6px;
  height: 6px;
  background-color: #16915e;
  border-radius: 50%;
  animation: pulse 1s infinite;
}

.backup-modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  width: 400px;
  max-width: 90vw;
  padding: 0;
  overflow: hidden;
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
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: none;
  border: none;
  font-size: 20px;
  color: #718096;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  border-radius: 4px;
  transition: all 0.2s ease;
  margin-top: 0px;
}

.close-button:hover {
  background-color: #e2e8f0;
  color: #4a5568;
}

.modal-content {
  padding: 20px;
}

.backup-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.backup-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.backup-item:hover {
  border-color: #cbd5e0;
  background: #fff;
}

.backup-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.backup-date {
  font-size: 14px;
  font-weight: 500;
  color: #2d3748;
}

.backup-meta {
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
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.restore-button:hover {
  background-color: #147a4f;
}

.no-backups {
  text-align: center;
  padding: 32px 20px;
  color: #718096;
  font-size: 14px;
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

.loading-state {
  text-align: center;
  padding: 32px 20px;
  color: #718096;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.loading-state::after {
  content: "";
  width: 16px;
  height: 16px;
  border: 2px solid #e2e8f0;
  border-top-color: #16915e;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>