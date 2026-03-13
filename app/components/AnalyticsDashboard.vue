<template>
  <div class="analytics-dashboard">
    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Lade Analytics-Daten...</p>
    </div>

    <div v-else>
    <!-- Overview Cards -->
    <div class="overview-cards">
      <div class="stat-card consistency">
        <div class="card-icon">📊</div>
        <div class="card-value">{{ ((performanceMetrics?.consistency || 0) * 100).toFixed(1) }}%</div>
        <div class="card-label">Konsistenz</div>
        <div class="card-trend" :class="getTrendClass(performanceMetrics?.consistencyTrend || 'neutral')">
          {{ getTrendIndicator(performanceMetrics?.consistencyTrend || 'neutral') }}
        </div>
      </div>

      <div class="stat-card reliability">
        <div class="card-icon">⏰</div>
        <div class="card-value">{{ ((performanceMetrics?.reliability || 0) * 100).toFixed(1) }}%</div>
        <div class="card-label">Zuverlässigkeit</div>
        <div class="card-trend" :class="getTrendClass(performanceMetrics?.reliabilityTrend || 'neutral')">
          {{ getTrendIndicator(performanceMetrics?.reliabilityTrend || 'neutral') }}
        </div>
      </div>

      <div class="stat-card activity">
        <div class="card-icon">🔥</div>
        <div class="card-value">{{ performanceMetrics?.activityScore || 0 }}</div>
        <div class="card-label">Aktivitäts-Score</div>
        <div class="card-trend" :class="getTrendClass(performanceMetrics?.activityTrend || 'neutral')">
          {{ getTrendIndicator(performanceMetrics?.activityTrend || 'neutral') }}
        </div>
      </div>

      <div class="stat-card stamps-per-week">
        <div class="card-icon">📅</div>
        <div class="card-value">{{ (performanceMetrics?.stampsPerWeek || 0).toFixed(1) }}</div>
        <div class="card-label">Stempel/Woche</div>
      </div>
    </div>

    <!-- Hourly Distribution -->
    <div class="chart-section">
      <h3>📈 Aktivität nach Uhrzeit</h3>
      <div class="chart-container">
        <div class="bar-chart">
          <div 
            v-for="hour in hourlyDistribution" 
            :key="hour.hour"
            class="bar-wrapper"
          >
            <div 
              class="bar" 
              :style="{ 
                height: getBarHeight(hour.count, maxHourlyCount) + '%',
                backgroundColor: getHourColor(hour.hour)
              }"
              :title="`${hour.hour}:00 - ${hour.count} Stempel`"
            >
              <span class="bar-value">{{ hour.count }}</span>
            </div>
            <div class="bar-label">{{ hour.hour }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Weekly Pattern -->
    <div class="chart-section">
      <h3>📅 Aktivität nach Wochentag</h3>
      <div class="chart-container">
        <div class="bar-chart">
          <div 
            v-for="day in weeklyPattern" 
            :key="day.day"
            class="bar-wrapper"
          >
            <div 
              class="bar" 
              :style="{ 
                height: getBarHeight(day.count, maxWeeklyCount) + '%',
                backgroundColor: '#007bff'
              }"
              :title="`${day.day} - ${day.count} Stempel`"
            >
              <span class="bar-value">{{ day.count }}</span>
            </div>
            <div class="bar-label">{{ day.day }}</div>
          </div>
        </div>
      </div>
      
      <div class="insight-box">
        <strong>💡 Einsicht:</strong> 
        {{ weeklyInsight }}
      </div>
    </div>

    <!-- Monthly Trends -->
    <div class="chart-section">
      <h3>📊 Monatliche Trends</h3>
      <div class="chart-container">
        <div class="line-chart">
          <svg width="100%" height="300" viewBox="0 0 800 300">
            <!-- Grid lines -->
            <line v-for="i in 5" :key="`grid-${i}`"
              :y1="i * 60" :y2="i * 60"
              x1="50" x2="780"
              stroke="#e0e0e0" stroke-width="1"
            />
            
            <!-- Trend line -->
            <polyline 
              :points="getTrendLinePoints()"
              fill="none" 
              stroke="#007bff" 
              stroke-width="3"
            />
            
            <!-- Data points -->
            <circle 
              v-for="(month, index) in monthlyTrends" 
              :key="`point-${index}`"
              :cx="50 + (index * 60)"
              :cy="300 - (month.count / maxMonthlyCount * 250)"
              r="5"
              fill="#007bff"
            >
              <title>{{ month.month }}: {{ month.count }} Stempel</title>
            </circle>
            
            <!-- Labels -->
            <text 
              v-for="(month, index) in monthlyTrends" 
              :key="`label-${index}`"
              :x="50 + (index * 60)"
              y="290"
              text-anchor="middle"
              font-size="12"
            >
              {{ month.month.substring(0, 3) }}
            </text>
          </svg>
        </div>
      </div>
    </div>

    <!-- Heat Map -->
    <div class="chart-section">
      <h3>🔥 Jahres-Heatmap</h3>
      <div class="heatmap-container">
        <div class="heatmap-grid">
          <div v-for="week in heatMapWeeks" :key="week.week" class="heatmap-week">
            <div 
              v-for="day in week.days" 
              :key="day.date"
              class="heatmap-cell"
              :style="{ backgroundColor: getHeatMapColor(day.count) }"
              :title="`${day.date}: ${day.count} Stempel`"
            ></div>
          </div>
        </div>
        
        <div class="heatmap-legend">
          <span>Weniger</span>
          <div class="legend-gradient"></div>
          <span>Mehr</span>
        </div>
      </div>
    </div>

    <!-- Correlation Analysis -->
    <div class="chart-section">
      <h3>🔍 Korrelations-Analyse</h3>
      
      <div class="correlations-grid">
        <div class="correlation-card">
          <div class="correlation-title">Beste Uhrzeit</div>
          <div class="correlation-value">{{ correlationAnalysis?.bestTime || '-' }}</div>
          <div class="correlation-desc">Höchste Pünktlichkeit</div>
        </div>
        
        <div class="correlation-card">
          <div class="correlation-title">Bester Tag</div>
          <div class="correlation-value">{{ correlationAnalysis?.bestDay || '-' }}</div>
          <div class="correlation-desc">Höchste Aktivität</div>
        </div>
        
        <div class="correlation-card">
          <div class="correlation-title">Zeitpunkt-Effekt</div>
          <div class="correlation-value">{{ correlationAnalysis?.timeImpact || 0 }}%</div>
          <div class="correlation-desc">Einfluss auf Pünktlichkeit</div>
        </div>
        
        <div class="correlation-card">
          <div class="correlation-title">Tages-Effekt</div>
          <div class="correlation-value">{{ correlationAnalysis?.dayImpact || 0 }}%</div>
          <div class="correlation-desc">Einfluss auf Aktivität</div>
        </div>
      </div>
    </div>

    <!-- Predictive Insights -->
    <div class="chart-section">
      <h3>🔮 Vorhersagen & Empfehlungen</h3>
      
      <div class="insights-list">
        <div 
          v-for="insight in predictiveInsights" 
          :key="insight.type"
          :class="['insight-item', `insight-${insight.priority}`]"
        >
          <div class="insight-icon">{{ insight.icon }}</div>
          <div class="insight-content">
            <div class="insight-title">{{ insight.title }}</div>
            <div class="insight-description">{{ insight.description }}</div>
            <div v-if="insight.recommendation" class="insight-recommendation">
              💡 {{ insight.recommendation }}
            </div>
          </div>
          <div class="insight-indicator" :class="`trend-${insight.trend}`">
            {{ getTrendSymbol(insight.trend) }}
          </div>
        </div>
      </div>
    </div>

    <!-- Comparative Analysis -->
    <div class="chart-section">
      <h3>📊 Vergleichsanalyse</h3>
      
      <div class="comparison-grid">
        <div class="comparison-item">
          <div class="comparison-label">Dein Rang</div>
          <div class="comparison-value">#{{ comparativeAnalysis?.rank || 0 }}</div>
          <div class="comparison-total">von {{ comparativeAnalysis?.totalUsers || 0 }}</div>
        </div>
        
        <div class="comparison-item">
          <div class="comparison-label">Perzentil</div>
          <div class="comparison-value">{{ comparativeAnalysis?.percentile || 0 }}%</div>
          <div class="comparison-desc">Top {{ 100 - (comparativeAnalysis?.percentile || 0) }}%</div>
        </div>
        
        <div class="comparison-item">
          <div class="comparison-label">vs. Durchschnitt</div>
          <div class="comparison-value" :class="{ positive: (comparativeAnalysis?.vsAverage || 0) > 0 }">
            {{ (comparativeAnalysis?.vsAverage || 0) > 0 ? '+' : '' }}{{ comparativeAnalysis?.vsAverage || 0 }}%
          </div>
          <div class="comparison-desc">Abweichung</div>
        </div>
      </div>
      
      <div class="percentile-bar">
        <div class="percentile-marker" :style="{ left: (comparativeAnalysis?.percentile || 0) + '%' }">
          Du
        </div>
      </div>
    </div>

    <!-- Time Series -->
    <div class="chart-section">
      <h3>📈 Zeitreihen-Analyse (30 Tage)</h3>
      <div class="chart-container">
        <div class="area-chart">
          <svg width="100%" height="200" viewBox="0 0 800 200">
            <!-- Area -->
            <polygon 
              :points="getAreaPoints()"
              fill="url(#areaGradient)" 
              opacity="0.3"
            />
            
            <!-- Line -->
            <polyline 
              :points="getTimeSeriesLinePoints()"
              fill="none" 
              stroke="#28a745" 
              stroke-width="2"
            />
            
            <!-- Gradient definition -->
            <defs>
              <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style="stop-color:#28a745;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#28a745;stop-opacity:0" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>
    </div>

    <!-- Export Button -->
    <div class="export-section">
      <button @click="exportReport" class="btn-export">
        📥 Detaillierten Bericht exportieren
      </button>
    </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  userId: string
}>()

const {
  getHourlyDistribution,
  getWeeklyPattern,
  getMonthlyTrends,
  getPerformanceMetrics,
  getCorrelationAnalysis,
  getPredictiveInsights,
  getHeatMapData,
  getTimeSeriesData,
  getComparativeAnalysis,
  generateDetailedReport
} = useAnalytics()

const loading = ref(true)
const hourlyDistribution = ref<any[]>([])
const weeklyPattern = ref<any[]>([])
const monthlyTrends = ref<any[]>([])
const performanceMetrics = ref<any>({
  consistency: 0,
  consistencyTrend: 'neutral',
  reliability: 0,
  reliabilityTrend: 'neutral',
  activityScore: 0,
  activityTrend: 'neutral',
  stampsPerWeek: 0
})
const correlationAnalysis = ref<any>({
  bestTime: '-',
  bestDay: '-',
  timeImpact: 0,
  dayImpact: 0
})
const predictiveInsights = ref<any[]>([])
const heatMapData = ref<any[]>([])
const timeSeriesData = ref<any[]>([])
const comparativeAnalysis = ref<any>({
  rank: 0,
  totalUsers: 0,
  percentile: 0,
  vsAverage: 0
})

// Computed
const maxHourlyCount = computed(() => {
  if (!Array.isArray(hourlyDistribution.value) || hourlyDistribution.value.length === 0) return 1
  return Math.max(...hourlyDistribution.value.map(h => h.count), 1)
})

const maxWeeklyCount = computed(() => {
  if (!Array.isArray(weeklyPattern.value) || weeklyPattern.value.length === 0) return 1
  return Math.max(...weeklyPattern.value.map(d => d.count), 1)
})

const maxMonthlyCount = computed(() => {
  if (!Array.isArray(monthlyTrends.value) || monthlyTrends.value.length === 0) return 1
  return Math.max(...monthlyTrends.value.map(m => m.count), 1)
})

const heatMapWeeks = computed(() => {
  // Group heatmap data by weeks
  if (!Array.isArray(heatMapData.value)) return []
  const weeks: any[] = []
  heatMapData.value.forEach((day, index) => {
    const weekIndex = Math.floor(index / 7)
    if (!weeks[weekIndex]) {
      weeks[weekIndex] = { week: weekIndex, days: [] }
    }
    weeks[weekIndex].days.push(day)
  })
  return weeks
})

const weeklyInsight = computed(() => {
  if (!Array.isArray(weeklyPattern.value) || weeklyPattern.value.length === 0) return 'Noch keine Daten verfügbar.'
  
  const bestDay = weeklyPattern.value.reduce((best, current) => 
    current.count > best.count ? current : best
  )
  
  return `${bestDay.day} ist dein aktivster Tag mit ${bestDay.count} Stempeln.`
})

// Methods
const loadAnalyticsData = async () => {
  if (!props.userId) return
  
  try {
    loading.value = true
    
    const [hourly, weekly, monthly, metrics, correlation, insights, heatmap, timeSeries, comparative] = await Promise.all([
      getHourlyDistribution(props.userId).catch((err) => { console.error('hourly error:', err); return [] }),
      getWeeklyPattern(props.userId).catch((err) => { console.error('weekly error:', err); return [] }),
      getMonthlyTrends(props.userId).catch((err) => { console.error('monthly error:', err); return [] }),
      getPerformanceMetrics(props.userId).catch((err) => { 
        console.error('metrics error:', err)
        return {
          consistency: 0,
          consistencyTrend: 'neutral',
          reliability: 0,
          reliabilityTrend: 'neutral',
          activityScore: 0,
          activityTrend: 'neutral',
          stampsPerWeek: 0
        }
      }),
      getCorrelationAnalysis(props.userId).catch((err) => { 
        console.error('correlation error:', err)
        return {
          bestTime: '-',
          bestDay: '-',
          timeImpact: 0,
          dayImpact: 0
        }
      }),
      getPredictiveInsights(props.userId).catch((err) => { console.error('insights error:', err); return [] }),
      getHeatMapData(props.userId, new Date().getFullYear()).catch((err) => { console.error('heatmap error:', err); return [] }),
      getTimeSeriesData(props.userId).catch((err) => { console.error('timeseries error:', err); return [] }),
      getComparativeAnalysis(props.userId).catch((err) => { 
        console.error('comparative error:', err)
        return {
          rank: 0,
          totalUsers: 0,
          percentile: 0,
          vsAverage: 0
        }
      })
    ])
    
    hourlyDistribution.value = Array.isArray(hourly) ? hourly : []
    weeklyPattern.value = Array.isArray(weekly) ? weekly : []
    monthlyTrends.value = Array.isArray(monthly) ? monthly : []
    performanceMetrics.value = metrics
    correlationAnalysis.value = correlation
    predictiveInsights.value = Array.isArray(insights) ? insights : (insights && Object.keys(insights).length > 0 ? [insights] : [])
    heatMapData.value = Array.isArray(heatmap) ? heatmap : []
    timeSeriesData.value = Array.isArray(timeSeries) ? timeSeries : []
    comparativeAnalysis.value = comparative
  } catch (error) {
    console.error('Error loading analytics:', error)
  } finally {
    loading.value = false
  }
}

const getBarHeight = (count: number, max: number) => {
  if (max === 0) return 0
  return Math.max((count / max) * 100, 5) // Minimum 5% for visibility
}

const getHourColor = (hour: number) => {
  if (hour >= 6 && hour < 12) return '#ffd700' // Morning
  if (hour >= 12 && hour < 18) return '#007bff' // Afternoon
  if (hour >= 18 && hour < 22) return '#6f42c1' // Evening
  return '#6c757d' // Night
}

const getHeatMapColor = (count: number) => {
  if (count === 0) return '#ebedf0'
  if (count === 1) return '#9be9a8'
  if (count === 2) return '#40c463'
  if (count === 3) return '#30a14e'
  return '#216e39'
}

const getTrendClass = (trend: string) => {
  if (trend === 'up') return 'trend-up'
  if (trend === 'down') return 'trend-down'
  return 'trend-neutral'
}

const getTrendIndicator = (trend: string) => {
  if (trend === 'up') return '↗ Steigend'
  if (trend === 'down') return '↘ Fallend'
  return '→ Stabil'
}

const getTrendSymbol = (trend: string) => {
  if (trend === 'improving') return '📈'
  if (trend === 'declining') return '📉'
  return '➡️'
}

const getTrendLinePoints = () => {
  if (!Array.isArray(monthlyTrends.value) || monthlyTrends.value.length === 0) return '0,0'
  return monthlyTrends.value
    .map((month, index) => {
      const x = 50 + (index * 60)
      const y = 300 - (month.count / maxMonthlyCount.value * 250)
      return `${x},${y}`
    })
    .join(' ')
}

const getTimeSeriesLinePoints = () => {
  if (!Array.isArray(timeSeriesData.value) || timeSeriesData.value.length === 0) return '0,200'
  const width = 800
  const height = 200
  const step = width / timeSeriesData.value.length
  const maxValue = Math.max(...timeSeriesData.value.map(d => d.value), 1)
  
  return timeSeriesData.value
    .map((data, index) => {
      const x = index * step
      const y = height - (data.value / maxValue * (height - 20))
      return `${x},${y}`
    })
    .join(' ')
}

const getAreaPoints = () => {
  const linePoints = getTimeSeriesLinePoints()
  const width = 800
  const height = 200
  
  return `0,${height} ${linePoints} ${width},${height}`
}

const exportReport = async () => {
  if (!props.userId) return
  
  const report = await generateDetailedReport(props.userId)
  
  // Create downloadable file
  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `analytics-report-${new Date().toISOString()}.json`
  a.click()
  URL.revokeObjectURL(url)
}

// Load data on mount
onMounted(() => {
  loadAnalyticsData()
})

// Watch for userId changes
watch(() => props.userId, () => {
  if (props.userId) {
    loadAnalyticsData()
  }
})
</script>

<style scoped>
.analytics-dashboard {
  padding: 20px;
  display: grid;
  gap: 20px;
}

/* Overview Cards */
.overview-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
}

.stat-card {
  background: white;
  padding: 25px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  text-align: center;
  position: relative;
}

.card-icon {
  font-size: 48px;
  margin-bottom: 10px;
}

.card-value {
  font-size: 36px;
  font-weight: bold;
  color: #007bff;
  margin-bottom: 5px;
}

.card-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 10px;
}

.card-trend {
  font-size: 12px;
  font-weight: bold;
  padding: 5px 10px;
  border-radius: 15px;
  display: inline-block;
}

.trend-up {
  background: #d4edda;
  color: #28a745;
}

.trend-down {
  background: #f8d7da;
  color: #dc3545;
}

.trend-neutral {
  background: #e7f3ff;
  color: #007bff;
}

/* Charts */
.chart-section {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.chart-container {
  margin-top: 20px;
  overflow-x: auto;
}

.bar-chart {
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  height: 300px;
  gap: 10px;
  padding: 20px;
}

.bar-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}

.bar {
  width: 100%;
  max-width: 50px;
  background: #007bff;
  border-radius: 4px 4px 0 0;
  position: relative;
  transition: all 0.3s;
  cursor: pointer;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 5px;
}

.bar:hover {
  opacity: 0.8;
  transform: translateY(-5px);
}

.bar-value {
  font-size: 12px;
  font-weight: bold;
  color: white;
}

.bar-label {
  font-size: 12px;
  color: #666;
}

.line-chart, .area-chart {
  padding: 20px;
}

/* Heatmap */
.heatmap-container {
  margin-top: 20px;
}

.heatmap-grid {
  display: flex;
  gap: 3px;
  overflow-x: auto;
}

.heatmap-week {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.heatmap-cell {
  width: 12px;
  height: 12px;
  border-radius: 2px;
  cursor: pointer;
}

.heatmap-legend {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 15px;
  justify-content: center;
}

.legend-gradient {
  width: 200px;
  height: 15px;
  background: linear-gradient(to right, #ebedf0, #216e39);
  border-radius: 4px;
}

/* Insights */
.insight-box {
  margin-top: 15px;
  padding: 15px;
  background: #e7f3ff;
  border-left: 4px solid #007bff;
  border-radius: 4px;
}

.insights-list {
  display: grid;
  gap: 10px;
  margin-top: 15px;
}

.insight-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  border-radius: 8px;
  border-left: 4px solid;
}

.insight-high {
  background: #fff3cd;
  border-left-color: #ffc107;
}

.insight-medium {
  background: #e7f3ff;
  border-left-color: #007bff;
}

.insight-low {
  background: #f8f9fa;
  border-left-color: #6c757d;
}

.insight-icon {
  font-size: 32px;
}

.insight-content {
  flex: 1;
}

.insight-title {
  font-weight: bold;
  margin-bottom: 5px;
}

.insight-description {
  font-size: 14px;
  color: #666;
}

.insight-recommendation {
  margin-top: 5px;
  font-size: 13px;
  color: #007bff;
  font-weight: bold;
}

.insight-indicator {
  font-size: 24px;
}

/* Correlations */
.correlations-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-top: 15px;
}

.correlation-card {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  text-align: center;
}

.correlation-title {
  font-size: 12px;
  color: #666;
  margin-bottom: 10px;
}

.correlation-value {
  font-size: 28px;
  font-weight: bold;
  color: #007bff;
  margin-bottom: 5px;
}

.correlation-desc {
  font-size: 12px;
  color: #666;
}

/* Comparative Analysis */
.comparison-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-top: 15px;
}

.comparison-item {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  text-align: center;
}

.comparison-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 10px;
}

.comparison-value {
  font-size: 32px;
  font-weight: bold;
  color: #007bff;
  margin-bottom: 5px;
}

.comparison-value.positive {
  color: #28a745;
}

.comparison-total, .comparison-desc {
  font-size: 12px;
  color: #666;
}

.percentile-bar {
  margin-top: 20px;
  height: 40px;
  background: linear-gradient(to right, #dc3545, #ffc107, #28a745);
  border-radius: 20px;
  position: relative;
}

.percentile-marker {
  position: absolute;
  top: -10px;
  transform: translateX(-50%);
  background: #007bff;
  color: white;
  padding: 5px 10px;
  border-radius: 15px;
  font-size: 12px;
  font-weight: bold;
}

/* Export */
.export-section {
  text-align: center;
}

.btn-export {
  padding: 15px 30px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-export:hover {
  background: #0056b3;
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0,0,0,0.2);
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-state p {
  color: #666;
  font-size: 16px;
}
</style>
