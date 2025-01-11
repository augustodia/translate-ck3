<template>
  <div class="progress-container">
    <div class="progress-info">
      <span class="progress-label">Progresso da Tradução</span>
      <span class="progress-percentage">{{ percentage }}%</span>
    </div>
    <div class="progress-bar-container">
      <div class="progress-bar" :style="{ width: `${percentage}%` }" :class="{
        'progress-low': percentage < 30,
        'progress-medium': percentage >= 30 && percentage < 70,
        'progress-high': percentage >= 70
      }">
      </div>
    </div>
    <div class="progress-details">
      <span>{{ translatedCount }} de {{ totalCount }} textos traduzidos</span>
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
    const percentage = computed(() =>
      Math.round((translatedCount.value / totalCount.value) * 100) || 0
    )

    return {
      totalCount,
      translatedCount,
      percentage
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

.progress-info {
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

.progress-bar-container {
  width: 100%;
  height: 8px;
  background: #eee;
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  transition: width 0.3s ease;
}

.progress-low {
  background: #ff6b6b;
}

.progress-medium {
  background: #ffd93d;
}

.progress-high {
  background: #16915e;
}

.progress-details {
  margin-top: 8px;
  font-size: 12px;
  color: #666;
  text-align: right;
}
</style>