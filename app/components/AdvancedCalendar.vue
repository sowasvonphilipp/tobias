<template>
  <div class="calendar-wrapper">
    <div class="calendar-header">
      <button @click="previousMonth" class="nav-btn">◀</button>
      <h2>{{ monthNames[currentMonth] }} {{ currentYear }}</h2>
      <button @click="nextMonth" class="nav-btn">▶</button>
    </div>

    <!-- View Toggle -->
    <div class="view-toggle">
      <button 
        v-for="view in views" 
        :key="view.id"
        @click="currentView = view.id"
        :class="{ active: currentView === view.id }"
      >
        {{ view.label }}
      </button>
    </div>

    <!-- Month View -->
    <div v-if="currentView === 'month'" class="calendar-grid">
      <div v-for="day in weekDays" :key="day" class="weekday">
        {{ day }}
      </div>
      
      <div 
        v-for="(day, index) in calendarDays" 
        :key="index"
        :class="getDayClass(day)"
        @click="selectDay(day)"
      >
        <div class="day-number">{{ day.date }}</div>
        <div v-if="day.stamps > 0" class="day-stamps">
          {{ day.stamps }} ✓
        </div>
        <div v-if="day.status" :class="`status-indicator status-${day.status}`"></div>
        <div v-if="day.streak" class="streak-badge">🔥 {{ day.streak }}</div>
      </div>
    </div>

    <!-- Week View -->
    <div v-if="currentView === 'week'" class="week-view">
      <div v-for="day in weekDays" :key="day" class="week-column">
        <div class="week-header">{{ day }}</div>
        <div class="week-content">
          <div 
            v-for="(event, idx) in getWeekEvents(day)" 
            :key="idx"
            :class="`event event-${event.type}`"
          >
            <span class="event-time">{{ event.time }}</span>
            <span class="event-title">{{ event.title }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Heat Map View -->
    <div v-if="currentView === 'heatmap'" class="heatmap-view">
      <div class="heatmap-legend">
        <span>Weniger</span>
        <div class="legend-colors">
          <div class="legend-item" :style="{ backgroundColor: getHeatColor(0) }"></div>
          <div class="legend-item" :style="{ backgroundColor: getHeatColor(1) }"></div>
          <div class="legend-item" :style="{ backgroundColor: getHeatColor(2) }"></div>
          <div class="legend-item" :style="{ backgroundColor: getHeatColor(3) }"></div>
          <div class="legend-item" :style="{ backgroundColor: getHeatColor(4) }"></div>
        </div>
        <span>Mehr</span>
      </div>
      
      <div class="heatmap-grid">
        <div v-for="month in 12" :key="month" class="heatmap-month">
          <div class="heatmap-month-label">{{ getShortMonthName(month - 1) }}</div>
          <div class="heatmap-days">
            <div 
              v-for="day in getDaysInMonth(month - 1)"
              :key="day"
              :style="{ backgroundColor: getHeatColor(getActivityLevel(month - 1, day)) }"
              class="heatmap-day"
              :title="`${day}. ${getShortMonthName(month - 1)}: ${getActivityLevel(month - 1, day)} Stempel`"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <!-- List View -->
    <div v-if="currentView === 'list'" class="list-view">
      <div 
        v-for="stamp in sortedStamps" 
        :key="stamp.id"
        class="list-item"
      >
        <div class="list-date">
          <span class="date-day">{{ formatDay(stamp.timestamp) }}</span>
          <span class="date-full">{{ formatFullDate(stamp.timestamp) }}</span>
        </div>
        <div class="list-details">
          <div class="list-status" :class="`status-${stamp.status}`">
            {{ getStatusLabel(stamp.status) }}
          </div>
          <div class="list-time">{{ formatTime(stamp.timestamp) }}</div>
        </div>
        <div class="list-actions">
          <button @click="editStamp(stamp)" class="btn-edit">✏️</button>
          <button @click="deleteStamp(stamp)" class="btn-delete">🗑️</button>
        </div>
      </div>
    </div>

    <!-- Day Details Modal -->
    <div v-if="selectedDay" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <h3>{{ formatFullDate(selectedDay.fullDate) }}</h3>
        
        <div class="day-stats">
          <div class="stat-item">
            <span class="stat-label">Stempel:</span>
            <span class="stat-value">{{ selectedDay.stamps }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Status:</span>
            <span class="stat-value">{{ getStatusLabel(selectedDay.status) }}</span>
          </div>
          <div v-if="selectedDay.streak" class="stat-item">
            <span class="stat-label">Streak:</span>
            <span class="stat-value">🔥 {{ selectedDay.streak }}</span>
          </div>
        </div>

        <div v-if="selectedDay.details" class="day-details">
          <h4>Details</h4>
          <div v-for="(detail, idx) in selectedDay.details" :key="idx" class="detail-item">
            <span class="detail-time">{{ detail.time }}</span>
            <span class="detail-text">{{ detail.text }}</span>
          </div>
        </div>

        <button @click="closeModal" class="btn-close">Schließen</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  userId: string
}>()

const { getCalendarData, getStampsByDateRange } = useStempelCard()

const currentMonth = ref(new Date().getMonth())
const currentYear = ref(new Date().getFullYear())
const currentView = ref('month')
const selectedDay = ref<any>(null)
const calendarDays = ref<any[]>([])
const allStamps = ref<any[]>([])

const monthNames = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
]

const weekDays = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']

const views = [
  { id: 'month', label: 'Monat' },
  { id: 'week', label: 'Woche' },
  { id: 'heatmap', label: 'Heatmap' },
  { id: 'list', label: 'Liste' }
]

// Load calendar data
const loadCalendarData = async () => {
  if (!props.userId) return
  
  try {
    const data = await getCalendarData(props.userId, currentMonth.value, currentYear.value)
    calendarDays.value = data
    
    // Load all stamps for the year
    const startDate = new Date(currentYear.value, 0, 1)
    const endDate = new Date(currentYear.value, 11, 31)
    allStamps.value = await getStampsByDateRange(props.userId, startDate, endDate)
  } catch (error) {
    console.error('Error loading calendar data:', error)
    calendarDays.value = []
    allStamps.value = []
  }
}

// Navigation
const previousMonth = () => {
  if (currentMonth.value === 0) {
    currentMonth.value = 11
    currentYear.value--
  } else {
    currentMonth.value--
  }
  loadCalendarData()
}

const nextMonth = () => {
  if (currentMonth.value === 11) {
    currentMonth.value = 0
    currentYear.value++
  } else {
    currentMonth.value++
  }
  loadCalendarData()
}

// Day class
const getDayClass = (day: any) => {
  const classes = ['calendar-day']
  
  if (!day.currentMonth) classes.push('other-month')
  if (day.isToday) classes.push('today')
  if (day.stamps > 0) classes.push('has-stamps')
  if (day.status) classes.push(`status-${day.status}`)
  
  return classes.join(' ')
}

// Select day
const selectDay = (day: any) => {
  if (!day.currentMonth) return
  selectedDay.value = day
}

const closeModal = () => {
  selectedDay.value = null
}

// Heat map helpers
const getHeatColor = (level: number) => {
  const colors = ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39']
  return colors[Math.min(level, 4)]
}

const getActivityLevel = (month: number, day: number) => {
  const date = new Date(currentYear.value, month, day)
  const stamps = allStamps.value.filter((s: any) => {
    const stampDate = s.timestamp?.toDate()
    return stampDate?.getDate() === day && 
           stampDate?.getMonth() === month &&
           stampDate?.getFullYear() === currentYear.value
  })
  return stamps.length
}

const getDaysInMonth = (month: number) => {
  return new Date(currentYear.value, month + 1, 0).getDate()
}

const getShortMonthName = (month: number) => {
  return monthNames[month]?.substring(0, 3) || ''
}

// Week view helpers
const getWeekEvents = (day: string): any[] => {
  // Mock data - would be replaced with actual events
  return []
}

// List view
const sortedStamps = computed(() => {
  return [...allStamps.value].sort((a, b) => {
    const aTime = a.timestamp?.toDate()?.getTime() || 0
    const bTime = b.timestamp?.toDate()?.getTime() || 0
    return bTime - aTime
  })
})

// Formatters
const formatDay = (timestamp: any) => {
  const date = timestamp?.toDate()
  return date?.getDate() || ''
}

const formatFullDate = (timestamp: any) => {
  const date = timestamp?.toDate()
  if (!date) return ''
  
  const day = date.getDate()
  const month = monthNames[date.getMonth()]
  const year = date.getFullYear()
  
  return `${day}. ${month} ${year}`
}

const formatTime = (timestamp: any) => {
  const date = timestamp?.toDate()
  if (!date) return ''
  
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  
  return `${hours}:${minutes}`
}

const getStatusLabel = (status: string) => {
  const labels: any = {
    'on-time': 'Pünktlich ✅',
    'late': 'Zu spät ⏰',
    'very-late': 'Sehr spät ❌',
    'absent': 'Abwesend 🚫'
  }
  return labels[status] || status
}

// Actions
const editStamp = (stamp: any) => {
  // Implement edit functionality
  console.log('Edit stamp:', stamp)
}

const deleteStamp = (stamp: any) => {
  // Implement delete functionality
  console.log('Delete stamp:', stamp)
}

// Load data on mount
onMounted(() => {
  loadCalendarData()
})

// Watch for userId changes
watch(() => props.userId, () => {
  if (props.userId) {
    loadCalendarData()
  }
})
</script>

<style scoped>
.calendar-wrapper {
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.nav-btn {
  background: #007bff;
  color: white;
  border: none;
  padding: 10px 15px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
}

.nav-btn:hover {
  background: #0056b3;
}

.view-toggle {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.view-toggle button {
  flex: 1;
  padding: 10px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 6px;
  cursor: pointer;
}

.view-toggle button.active {
  background: #007bff;
  color: white;
  border-color: #007bff;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 5px;
}

.weekday {
  text-align: center;
  font-weight: bold;
  padding: 10px;
  background: #f8f9fa;
}

.calendar-day {
  aspect-ratio: 1;
  padding: 8px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  transition: all 0.2s;
}

.calendar-day:hover {
  border-color: #007bff;
  transform: scale(1.05);
}

.calendar-day.other-month {
  opacity: 0.3;
  pointer-events: none;
}

.calendar-day.today {
  border: 2px solid #007bff;
  background: #e7f3ff;
}

.calendar-day.has-stamps {
  background: #d4edda;
}

.day-number {
  font-weight: bold;
  font-size: 14px;
}

.day-stamps {
  font-size: 12px;
  color: #28a745;
  margin-top: 5px;
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  position: absolute;
  top: 5px;
  right: 5px;
}

.status-on-time { background: #28a745; }
.status-late { background: #ffc107; }
.status-very-late { background: #dc3545; }
.status-absent { background: #6c757d; }

.streak-badge {
  position: absolute;
  bottom: 5px;
  right: 5px;
  font-size: 10px;
  background: #ff6b6b;
  color: white;
  padding: 2px 5px;
  border-radius: 10px;
}

/* Week View */
.week-view {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 10px;
  min-height: 400px;
}

.week-column {
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  overflow: hidden;
}

.week-header {
  background: #f8f9fa;
  padding: 10px;
  font-weight: bold;
  text-align: center;
}

.week-content {
  padding: 10px;
}

.event {
  padding: 5px;
  margin-bottom: 5px;
  border-radius: 4px;
  font-size: 12px;
}

.event-on-time { background: #d4edda; }
.event-late { background: #fff3cd; }
.event-very-late { background: #f8d7da; }

/* Heatmap View */
.heatmap-view {
  padding: 20px;
}

.heatmap-legend {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
  justify-content: center;
}

.legend-colors {
  display: flex;
  gap: 3px;
}

.legend-item {
  width: 15px;
  height: 15px;
  border-radius: 2px;
}

.heatmap-grid {
  display: grid;
  gap: 15px;
}

.heatmap-month {
  display: flex;
  gap: 5px;
  align-items: center;
}

.heatmap-month-label {
  width: 40px;
  font-size: 12px;
  font-weight: bold;
}

.heatmap-days {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
}

.heatmap-day {
  width: 12px;
  height: 12px;
  border-radius: 2px;
  cursor: pointer;
}

.heatmap-day:hover {
  outline: 2px solid #000;
}

/* List View */
.list-view {
  max-height: 600px;
  overflow-y: auto;
}

.list-item {
  display: flex;
  align-items: center;
  padding: 15px;
  border-bottom: 1px solid #e0e0e0;
  transition: background 0.2s;
}

.list-item:hover {
  background: #f8f9fa;
}

.list-date {
  flex: 0 0 150px;
}

.date-day {
  font-size: 24px;
  font-weight: bold;
  display: block;
}

.date-full {
  font-size: 12px;
  color: #6c757d;
}

.list-details {
  flex: 1;
}

.list-status {
  font-weight: bold;
  margin-bottom: 5px;
}

.list-time {
  font-size: 14px;
  color: #6c757d;
}

.list-actions {
  display: flex;
  gap: 10px;
}

.btn-edit, .btn-delete {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  padding: 5px;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 30px;
  border-radius: 12px;
  max-width: 500px;
  width: 90%;
}

.day-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
  margin: 20px 0;
}

.stat-item {
  padding: 15px;
  background: #f8f9fa;
  border-radius: 6px;
}

.stat-label {
  display: block;
  font-size: 12px;
  color: #6c757d;
  margin-bottom: 5px;
}

.stat-value {
  display: block;
  font-size: 20px;
  font-weight: bold;
}

.day-details {
  margin: 20px 0;
}

.detail-item {
  display: flex;
  gap: 15px;
  padding: 10px;
  border-left: 3px solid #007bff;
  background: #f8f9fa;
  margin-bottom: 10px;
}

.detail-time {
  font-weight: bold;
  color: #007bff;
}

.btn-close {
  width: 100%;
  padding: 12px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
}

.btn-close:hover {
  background: #0056b3;
}
</style>
