<template>
  <div class="progress-container">
    <div class="progress-header">
      <span class="progress-label">Progresso da Tradução</span>
      <span class="progress-percentage">{{ percentage }}%</span>
    </div>
    <div class="progress-bar">
      <div class="progress-fill" :style="{ width: `${percentage}%` }" :class="getProgressClass"></div>
    </div>
    <div class="progress-details">
      {{ translatedCount }} de {{ totalCount }} textos traduzidos
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'

export default {
  name: 'ProgressBar',
  props: {
    content: {
      type: Object,
      required: true
    }
  },
  setup(props) {
    const totalCount = computed(() => Object.keys(props.content).length)
    const translatedCount = computed(() =>
      Object.values(props.content).filter(item => item.isTranslated).length
    )
    const percentage = computed(() => {
      if (totalCount.value === 0) return 0;
      // Calcula com 2 casas decimais e arredonda para baixo
      const calc = Math.floor((translatedCount.value / totalCount.value) * 10000) / 100;
      // Só retorna 100% se realmente todos estiverem traduzidos
      return translatedCount.value === totalCount.value ? 100 : calc;
    });

    const getProgressClass = computed(() => {
      if (percentage.value < 30) return 'progress-low';
      if (percentage.value < 70) return 'progress-medium';
      return 'progress-high';
    });

    return {
      totalCount,
      translatedCount,
      percentage,
      getProgressClass
    }
  }
}
</script>

<style scoped>
.progress-container {
  background: white;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 15px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.progress-label {
  font-weight: 600;
  color: #333;
}

.progress-percentage {
  font-weight: 600;
  color: #16915e;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #eee;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  transition: width 0.3s ease;
}

.progress-fill.progress-low {
  background: #ff6b6b;
}

.progress-fill.progress-medium {
  background: #ffd93d;
}

.progress-fill.progress-high {
  background: #16915e;
}

.progress-details {
  margin-top: 8px;
  font-size: 12px;
  color: #666;
  text-align: right;
}
</style>