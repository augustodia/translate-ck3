<template>
  <div class="version-manager">
    <button @click="showModal = !showModal" class="version-button" :class="{ active: showModal }">
      <span class="button-icon">📋</span>
      Versões e Backups
    </button>

    <div v-if="showModal" class="version-modal">
      <div class="modal-overlay" @click="showModal = false"></div>
      <div class="modal-content">
        <div class="modal-header">
          <h3>Gerenciador de Versões</h3>
          <button @click="showModal = false" class="close-button" title="Fechar">×</button>
        </div>

        <div class="modal-body">
          <!-- Abas -->
          <div class="tabs">
            <button @click="activeTab = 'auto'" :class="{ active: activeTab === 'auto' }" class="tab-button">
              🤖 Backups Automáticos
            </button>
            <button @click="activeTab = 'manual'" :class="{ active: activeTab === 'manual' }" class="tab-button">
              💾 Backups Manuais
            </button>
            <button @click="activeTab = 'history'" :class="{ active: activeTab === 'history' }" class="tab-button">
              📝 Histórico de Alterações
            </button>
          </div>

          <!-- Conteúdo das Abas -->
          <div class="tab-content">
            <!-- Backups Automáticos -->
            <div v-if="activeTab === 'auto'" class="auto-backups">
              <div class="section-header">
                <h4>Backups Automáticos (a cada 5 minutos)</h4>
                <div class="actions">
                  <button @click="createBackup(true)" class="action-button">
                    <span class="button-icon">💾</span>
                    Criar Backup Agora
                  </button>
                </div>
              </div>

              <div class="versions-list">
                <div v-for="backup in autoBackups" :key="backup.timestamp" class="version-item">
                  <div class="version-info">
                    <div class="version-header">
                      <span class="version-date">{{ formatDate(backup.timestamp) }}</span>
                      <span class="version-type auto">Automático</span>
                    </div>
                    <div class="version-stats">
                      <span>{{ getProgressText(backup.content) }}</span>
                    </div>
                  </div>
                  <div class="version-actions">
                    <button @click="restoreVersion(backup)" class="restore-button" title="Restaurar">
                      <span class="button-icon">↺</span>
                      <span class="button-text">Restaurar</span>
                    </button>
                    <button @click="downloadBackup(backup)" class="download-button" title="Baixar">
                      <span class="button-icon">⭳</span>
                    </button>
                    <button @click="deleteBackup(backup)" class="delete-button" title="Excluir">
                      <span class="button-icon">🗑️</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Backups Manuais -->
            <div v-if="activeTab === 'manual'" class="manual-backups">
              <div class="section-header">
                <h4>Backups Manuais</h4>
                <div class="actions">
                  <button @click="createBackup(false)" class="action-button">
                    <span class="button-icon">💾</span>
                    Backup
                  </button>
                  <label class="upload-button compact">
                    <span class="button-icon">⭱</span>
                    Importar
                    <input type="file" @change="importBackup" accept=".json" class="hidden-input" />
                  </label>
                </div>
              </div>

              <div class="versions-list">
                <div v-for="backup in manualBackups" :key="backup.timestamp" class="version-item">
                  <div class="version-info">
                    <div class="version-header">
                      <span class="version-date">{{ formatDate(backup.timestamp) }}</span>
                      <span class="version-type manual">Manual</span>
                    </div>
                    <div class="version-stats">
                      <span>{{ getProgressText(backup.content) }}</span>
                      <span v-if="backup.note" class="backup-note">{{ backup.note }}</span>
                    </div>
                  </div>
                  <div class="version-actions">
                    <button @click="restoreVersion(backup)" class="restore-button" title="Restaurar">
                      <span class="button-icon">↺</span>
                      <span class="button-text">Restaurar</span>
                    </button>
                    <button @click="downloadBackup(backup)" class="download-button" title="Baixar">
                      <span class="button-icon">⭳</span>
                    </button>
                    <button @click="deleteBackup(backup)" class="delete-button" title="Excluir">
                      <span class="button-icon">🗑️</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Histórico de Alterações -->
            <div v-if="activeTab === 'history'" class="history">
              <div class="section-header">
                <h4>Histórico de Alterações</h4>
                <div class="history-filters">
                  <select v-model="historyFilter" class="filter-select">
                    <option value="all">Todas as alterações</option>
                    <option value="translation">Apenas traduções</option>
                    <option value="status">Apenas status</option>
                  </select>
                </div>
              </div>

              <div class="versions-list">
                <div v-for="entry in filteredHistory" :key="entry.timestamp" class="version-item">
                  <div class="version-info">
                    <div class="version-header">
                      <span class="version-date">{{ formatDate(entry.timestamp) }}</span>
                      <span class="version-type" :class="entry.type">
                        {{ entry.type === 'translation' ? 'Tradução' : 'Status' }}
                      </span>
                    </div>
                    <div class="version-details">
                      <div class="key-name">{{ entry.key }}</div>
                      <div v-if="entry.type === 'translation'" class="translation-diff">
                        <div class="old-value">{{ entry.oldValue }}</div>
                        <div class="arrow">➔</div>
                        <div class="new-value">{{ entry.value }}</div>
                      </div>
                      <div v-else class="status-change">
                        {{ entry.isTranslated ? 'Marcado como traduzido' : 'Marcado como não traduzido' }}
                      </div>
                    </div>
                  </div>
                  <div class="version-actions">
                    <button @click="restoreEntry(entry)" class="restore-button" title="Restaurar">
                      <span class="button-icon">↺</span>
                      <span class="button-text">Restaurar</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { saveTranslations } from '../services/indexedDB';

export default defineComponent({
  name: 'VersionManager',

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
    const showModal = ref(false)
    const activeTab = ref('auto')
    const historyFilter = ref('all')
    const autoBackupInterval = ref(null)

    // Estados para backups e histórico
    const autoBackups = ref([])
    const manualBackups = ref([])
    const history = ref([])

    // Carregar dados salvos
    onMounted(() => {
      loadBackups()
      loadHistory()
      startAutoBackup()
    })

    onUnmounted(() => {
      if (autoBackupInterval.value) {
        clearInterval(autoBackupInterval.value)
      }
    })

    const startAutoBackup = () => {
      autoBackupInterval.value = setInterval(() => {
        createBackup(true)
      }, 5 * 60 * 1000) // 5 minutos
    }

    const loadBackups = () => {
      const savedAutoBackups = localStorage.getItem(`auto_backups_${props.fileName}`)
      const savedManualBackups = localStorage.getItem(`manual_backups_${props.fileName}`)

      if (savedAutoBackups) {
        autoBackups.value = JSON.parse(savedAutoBackups)
      }
      if (savedManualBackups) {
        manualBackups.value = JSON.parse(savedManualBackups)
      }
    }

    const loadHistory = () => {
      const savedHistory = localStorage.getItem(`history_${props.fileName}`)
      if (savedHistory) {
        history.value = JSON.parse(savedHistory)
      }
    }

    const saveBackups = () => {
      localStorage.setItem(`auto_backups_${props.fileName}`, JSON.stringify(autoBackups.value))
      localStorage.setItem(`manual_backups_${props.fileName}`, JSON.stringify(manualBackups.value))
    }

    const createBackup = async (isAuto = false) => {
      const backup = {
        timestamp: new Date().toISOString(),
        fileName: props.fileName,
        content: props.content,
        isAuto
      }

      if (!isAuto) {
        const note = await promptForNote()
        if (note) {
          backup.note = note
        }
      }

      if (isAuto) {
        autoBackups.value.unshift(backup)
        if (autoBackups.value.length > 10) {
          autoBackups.value.pop()
        }
      } else {
        manualBackups.value.unshift(backup)
      }

      saveBackups()
    }

    const promptForNote = () => {
      return new Promise((resolve) => {
        const note = prompt('Adicione uma nota para este backup (opcional):')
        resolve(note)
      })
    }

    const restoreVersion = (backup) => {
      if (confirm('Tem certeza que deseja restaurar esta versão? As alterações não salvas serão perdidas.')) {
        emit('restore-version', backup)
      }
    }

    const downloadBackup = (backup) => {
      const data = JSON.stringify(backup, null, 2)
      const blob = new Blob([data], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `backup_${props.fileName}_${formatDateForFilename(backup.timestamp)}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }

    const importBackup = (event) => {
      const file = event.target.files[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          try {
            const backup = JSON.parse(e.target.result)
            backup.timestamp = new Date().toISOString() // Atualiza o timestamp
            manualBackups.value.unshift(backup)
            saveBackups()
          } catch (error) {
            alert('Erro ao importar o backup. Verifique se o arquivo é válido.')
          }
        }
        reader.readAsText(file)
      }
    }

    const deleteBackup = (backup) => {
      if (confirm('Tem certeza que deseja excluir este backup?')) {
        if (backup.isAuto) {
          autoBackups.value = autoBackups.value.filter(b => b.timestamp !== backup.timestamp)
        } else {
          manualBackups.value = manualBackups.value.filter(b => b.timestamp !== backup.timestamp)
        }
        saveBackups()
      }
    }

    const restoreEntry = (entry) => {
      if (confirm('Tem certeza que deseja restaurar esta alteração?')) {
        const updatedContent = { ...props.content }
        updatedContent[entry.key] = entry.content
        emit('restore-version', { content: updatedContent })
      }
    }

    const filteredHistory = computed(() => {
      if (historyFilter.value === 'all') return history.value
      return history.value.filter(entry => entry.type === historyFilter.value)
    })

    const formatDate = (dateString) => {
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }).format(new Date(dateString))
    }

    const formatDateForFilename = (dateString) => {
      return new Date(dateString)
        .toISOString()
        .replace(/[:.]/g, '-')
        .replace('T', '_')
        .split('.')[0]
    }

    const getProgressText = (content) => {
      const total = Object.keys(content).length
      const translated = Object.values(content).filter(v => v.isTranslated).length
      const percentage = Math.round((translated / total) * 100)
      return `${translated}/${total} (${percentage}%) traduzido`
    }

    const addToHistory = (key, type, data = {}) => {
      const entry = {
        timestamp: new Date().toISOString(),
        key,
        type,
        content: props.content[key],
        ...data
      }

      history.value.unshift(entry)
      if (history.value.length > 50) history.value.pop()

      localStorage.setItem(`history_${props.fileName}`, JSON.stringify(history.value))
    }

    const updateValue = async (key, newValue) => {
      const oldValue = props.content[key].value
      if (oldValue !== newValue) {
        addToHistory(key, 'translation', { oldValue })
      }
    }

    const toggleTranslated = (key) => {
      const newStatus = !props.content[key].isTranslated
      addToHistory(key, 'status', { isTranslated: newStatus })
    }

    watch(() => props.content, (newContent, oldContent) => {
      if (oldContent) {
        Object.entries(newContent).forEach(([key, value]) => {
          if (oldContent[key]) {
            const oldValue = oldContent[key].value
            if (oldValue !== value.value) {
              const entry = {
                timestamp: new Date().toISOString(),
                key,
                type: 'translation',
                oldValue: oldValue,
                value: value.value,
                content: value
              }
              history.value.unshift(entry)
              if (history.value.length > 50) history.value.pop()
              localStorage.setItem(`history_${props.fileName}`, JSON.stringify(history.value))
            }
            if (oldContent[key].isTranslated !== value.isTranslated) {
              const entry = {
                timestamp: new Date().toISOString(),
                key,
                type: 'status',
                isTranslated: value.isTranslated,
                content: value
              }
              history.value.unshift(entry)
              if (history.value.length > 50) history.value.pop()
              localStorage.setItem(`history_${props.fileName}`, JSON.stringify(history.value))
            }
          }
        })
      }
    }, { deep: true })

    const handleVersionRestore = (entry) => {
      setLoading(true, 'Restaurando versão...')
      try {
        const updatedContent = { ...props.content }
        updatedContent[entry.key] = entry.content

        if (validateContent(updatedContent)) {
          emit('update-content', updatedContent)
          // Salvar no IndexedDB
          saveTranslations(updatedContent, props.mergedContent, props.fileName);
        }
      } catch (err) {
        handleError(err)
      } finally {
        setLoading(false)
      }
    }

    return {
      showModal,
      activeTab,
      historyFilter,
      autoBackups,
      manualBackups,
      filteredHistory,
      createBackup,
      restoreVersion,
      downloadBackup,
      importBackup,
      deleteBackup,
      restoreEntry,
      formatDate,
      getProgressText
    }
  }
})
</script>

<style scoped>
.version-manager {
  position: relative;
}

.version-button {
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

.version-button:hover,
.version-button.active {
  background-color: #2d3748;
}

.version-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
}

.modal-content {
  position: relative;
  width: 900px;
  max-width: 90vw;
  max-height: 90vh;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid #e2e8f0;
}

.modal-header h3 {
  margin: 0;
  color: #2d3748;
  font-size: 18px;
  font-weight: 600;
}

.close-button {
  background: none;
  border: none;
  font-size: 24px;
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

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 8px;
}

.tab-button {
  padding: 8px 16px;
  border: none;
  background: none;
  color: #718096;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.tab-button:hover {
  background-color: #f7fafc;
  color: #2d3748;
}

.tab-button.active {
  background-color: #ebf4ff;
  color: #3182ce;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-header h4 {
  margin: 0;
  color: #2d3748;
  font-size: 16px;
  font-weight: 600;
}

.actions {
  display: flex;
  gap: 8px;
}

.action-button,
.upload-button {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  border: none;
  border-radius: 6px;
  background-color: #4a5568;
  color: white;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  min-width: fit-content;
}

.upload-button.compact {
  padding: 8px 10px;
  font-size: 12px;
}

.hidden-input {
  display: none;
}

.versions-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.version-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.version-item:hover {
  background-color: #f1f5f9;
}

.version-info {
  flex: 1;
  min-width: 0;
}

.version-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.version-date {
  font-weight: 500;
  color: #2d3748;
  font-size: 14px;
}

.version-type {
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 500;
  white-space: nowrap;
  min-width: fit-content;
}

.version-type.auto {
  background-color: #e9d8fd;
  color: #6b46c1;
}

.version-type.manual {
  background-color: #c6f6d5;
  color: #2f855a;
}

.version-type.translation {
  background-color: #bee3f8;
  color: #2c5282;
}

.version-type.status {
  background-color: #feebc8;
  color: #9c4221;
}

.version-stats {
  font-size: 13px;
  color: #718096;
}

.backup-note {
  display: block;
  font-style: italic;
  margin-top: 4px;
}

.version-actions {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
  align-items: center;
}

.restore-button,
.download-button,
.delete-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
  padding: 6px 12px;
  min-width: fit-content;
  white-space: nowrap;
}

.restore-button {
  background-color: #4299e1;
  color: white;
  width: auto;
  gap: 6px;
}

.download-button,
.delete-button {
  width: 32px;
  height: 32px;
}

.button-text {
  font-size: 13px;
  font-weight: 500;
}

.version-details {
  margin-top: 8px;
  width: 100%;
  overflow: hidden;
}

.key-name {
  font-family: monospace;
  font-size: 12px;
  color: #4a5568;
  margin-bottom: 4px;
  word-break: break-all;
  white-space: pre-wrap;
}

.translation-diff {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  flex-wrap: wrap;
  max-width: 100%;
}

.old-value,
.new-value {
  max-width: calc(50% - 12px);
  overflow-wrap: break-word;
  word-break: break-all;
  white-space: pre-wrap;
}

.old-value {
  color: #e53e3e;
  text-decoration: line-through;
}

.new-value {
  color: #38a169;
}

.arrow {
  color: #718096;
  flex-shrink: 0;
}

.status-change {
  font-size: 13px;
  color: #718096;
  font-style: italic;
}

.history-filters {
  display: flex;
  gap: 8px;
}

.filter-select {
  padding: 4px 8px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 13px;
  color: #4a5568;
  background-color: white;
}

@media (max-width: 768px) {
  .modal-content {
    width: 100%;
    height: 100%;
    max-width: 100%;
    max-height: 100%;
    border-radius: 0;
  }

  .version-item {
    flex-direction: column;
    gap: 12px;
  }

  .version-actions {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>