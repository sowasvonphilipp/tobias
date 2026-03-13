<template>
  <div class="dashboard-container">
    <!-- Header -->
    <header class="dashboard-header">
      <div class="header-content">
        <div class="logo-section">
          <div class="logo-icon">🎯</div>
          <h1>Tobias Stempelkarte</h1>
        </div>
        
        <div class="user-section">
          <ClientOnly>
            <div class="user-info">
              <div class="user-avatar">{{ userInitial }}</div>
              <span class="user-email">{{ user?.email?.split('@')[0] }}</span>
            </div>
          </ClientOnly>
          <NuxtLink v-if="isAdmin" to="/admin" class="admin-button">
            ⚙️ Admin
          </NuxtLink>
          <button @click="handleLogout" class="logout-button">
            🚪 Abmelden
          </button>
        </div>
      </div>
    </header>

    <!-- Tab Navigation -->
    <div class="tab-navigation">
      <button 
        v-for="tab in tabs" 
        :key="tab.id"
        @click="activeTab = tab.id"
        :class="{ active: activeTab === tab.id }"
        class="tab-btn"
      >
        {{ tab.icon }} {{ tab.label }}
      </button>
    </div>

    <!-- Main Content -->
    <main class="dashboard-main">
      <div v-if="loading" class="loading-state">
        <div class="spinner-big"></div>
        <p>Lade deine Daten...</p>
      </div>

      <div v-else>
        <!-- OVERVIEW TAB / STEMPELKARTE -->
        <div v-if="activeTab === 'overview'" class="tab-panel">
          <div class="welcome-section">
            <h2>Hey Tobias! 👋</h2>
            <p class="welcome-subtitle">Deine Pünktlichkeits-Challenge: Dienstag & Donnerstag</p>
          </div>

          <!-- Current Streak Focus -->
          <div class="streak-focus-card">
            <div class="streak-header">
              <h2>🔥 Aktuelle Serie</h2>
              <div class="streak-number">{{ stats.currentStreak }}</div>
            </div>
            <p class="streak-description">
              Du musst <strong>20 Mal hintereinander pünktlich</strong> erscheinen für die große Belohnung!
            </p>
            <div class="streak-progress-bar">
              <div class="streak-progress-fill" :style="{ width: (currentStampProgress / TOTAL_STAMPS * 100) + '%' }">
                <span class="progress-text">{{ currentStampProgress }} / {{ TOTAL_STAMPS }}</span>
              </div>
            </div>
            <p class="streak-remaining">
              Noch <strong>{{ TOTAL_STAMPS - currentStampProgress }}</strong> pünktliche Termine bis zur Belohnung! 🎁
            </p>
          </div>

          <!-- 20 Stamp Card Display -->
          <div class="stamp-card-section">
            <h3 class="section-title">🎯 Deine Stempelkarte</h3>
            <div class="stamp-grid">
              <div 
                v-for="i in TOTAL_STAMPS" 
                :key="i"
                class="stamp-slot"
                :class="{ 
                  filled: i <= currentStampProgress,
                  current: i === currentStampProgress
                }"
              >
                <div class="stamp-number">{{ i }}</div>
                <div class="stamp-icon">
                  <span v-if="i <= currentStampProgress">✓</span>
                  <span v-else class="empty-stamp">○</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Quick Stats -->
          <div class="quick-stats">
            <div class="quick-stat-card green">
              <div class="stat-icon">✅</div>
              <div class="stat-content">
                <div class="stat-value">{{ stats.onTimeCount }}</div>
                <div class="stat-label">Pünktlich</div>
              </div>
            </div>

            <div class="quick-stat-card orange">
              <div class="stat-icon">⏰</div>
              <div class="stat-content">
                <div class="stat-value">{{ stats.lateCount }}</div>
                <div class="stat-label">Zu spät</div>
              </div>
            </div>

            <div class="quick-stat-card blue">
              <div class="stat-icon">⚡</div>
              <div class="stat-content">
                <div class="stat-value">{{ stats.longestStreak }}</div>
                <div class="stat-label">Beste Serie</div>
              </div>
            </div>
          </div>

          <!-- Rewards Section -->
          <div class="rewards-section">
            <h3 class="section-title">🎁 Belohnungen</h3>
            <p class="rewards-subtitle">Erreiche die Meilensteine für tolle Belohnungen!</p>
            <div class="rewards-grid">
              <div v-for="tier in rewardTiers" :key="tier.requiredStamps" 
                   class="reward-card" 
                   :class="{ unlocked: stats.currentStreak >= tier.requiredStamps }">
                <div class="reward-icon">{{ tier.icon }}</div>
                <h4>{{ tier.name }}</h4>
                <p class="reward-requirement">{{ tier.requiredStamps }}x pünktlich</p>
                <p class="reward-prize">{{ tier.description }}</p>
                <div v-if="stats.currentStreak >= tier.requiredStamps" class="reward-badge">
                  ✅ Freigeschaltet!
                </div>
                <div v-else class="reward-progress">
                  {{ stats.currentStreak }}/{{ tier.requiredStamps }}
                </div>
              </div>
            </div>
          </div>

          <!-- Recent History -->
          <div class="history-section">
            <h3 class="section-title">📅 Letzte Einträge</h3>
            <div v-if="recentStamps.length === 0" class="empty-state">
              <p>Noch keine Einträge vorhanden.</p>
              <p class="empty-subtitle">Dein Admin wird dich einstempeln! 😊</p>
            </div>
            <div v-else class="history-list">
              <div 
                v-for="stamp in recentStamps" 
                :key="stamp.id"
                class="history-item"
                :class="stamp.status"
              >
                <div class="history-icon">
                  <span v-if="stamp.status === 'on-time'">✅</span>
                  <span v-else>⏰</span>
                </div>
                <div class="history-content">
                  <div class="history-main">
                    <strong>{{ stamp.dayOfWeek }}, {{ formatDate(stamp.date) }}</strong>
                    <span v-if="stamp.status === 'on-time'" class="status-badge on-time">Pünktlich!</span>
                    <span v-else class="status-badge late">{{ stamp.minutesLate }} Min zu spät</span>
                  </div>
                  <p v-if="stamp.note" class="history-note">{{ stamp.note }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- CALENDAR & ANALYTICS TAB -->
        <div v-if="activeTab === 'calendar'" class="tab-panel">
          <div class="dual-panel">
            <div class="calendar-section">
              <h3 class="section-title">📅 Kalender</h3>
              <AdvancedCalendar :userId="tobiasUserId" />
            </div>
            <div class="analytics-section">
              <h3 class="section-title">📊 Analytics</h3>
              <AnalyticsDashboard :userId="tobiasUserId" />
            </div>
          </div>
        </div>

        <!-- NOTIFICATIONS TAB -->
        <div v-if="activeTab === 'notifications'" class="tab-panel">
          <div class="notifications-page">
            <h2>🔔 Benachrichtigungen</h2>
            <p class="section-description">Hier findest du alle deine Benachrichtigungen und kannst deine Einstellungen verwalten.</p>
            <NotificationsPanel :userId="tobiasUserId" />
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script lang="ts" setup>
definePageMeta({
  middleware: 'auth'
})

const { user, logout } = useFirebaseAuth()
const { getUserStats, getRecentStamps, isUserAdmin, getTobiasUserId } = useStempelCard()
const { getRewardTiers } = useConfig()
const router = useRouter()

const userInitial = computed(() => {
  return user.value?.email?.charAt(0).toUpperCase() || 'T'
})

const loading = ref(true)
const isAdmin = ref(false)
const tobiasUserId = ref<string>('')
const stats = ref({
  currentStreak: 0,
  longestStreak: 0,
  totalStamps: 0,
  onTimeCount: 0,
  lateCount: 0
})
const recentStamps = ref<any[]>([])
const rewardTiers = ref<any[]>([])

// Tabs
const activeTab = ref('overview')
const tabs = [
  { id: 'overview', label: 'Stempelkarte', icon: '🎯' },
  { id: 'calendar', label: 'Kalender & Analytics', icon: '📊' },
  { id: 'notifications', label: 'Benachrichtigungen', icon: '🔔' }
]

// Stamp card display
const TOTAL_STAMPS = 20
const currentStampProgress = computed(() => {
  return Math.min(stats.value.currentStreak, TOTAL_STAMPS)
})

onMounted(async () => {
  if (!user.value) {
    router.push('/login')
    return
  }

  loading.value = true
  
  try {
    // Get Tobias user ID
    tobiasUserId.value = await getTobiasUserId()
    
    // Load main data for Tobias (not the logged-in admin)
    const [userStats, stamps, tiers, adminStatus] = await Promise.all([
      getUserStats(tobiasUserId.value),
      getRecentStamps(tobiasUserId.value, 10),
      getRewardTiers(),
      isUserAdmin(user.value.email || '')
    ])
    
    stats.value = userStats as any
    recentStamps.value = stamps
    rewardTiers.value = tiers
    isAdmin.value = adminStatus
    
  } catch (error) {
    console.error('Error loading dashboard:', error)
  } finally {
    loading.value = false
  }
})

const handleLogout = async () => {
  await logout()
  router.push('/login')
}

const formatDate = (timestamp: any) => {
  if (!timestamp) return ''
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
</script>

<style scoped>
.dashboard-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.dashboard-header {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 2px solid #e0e0e0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.logo-icon {
  font-size: 2rem;
}

.logo-section h1 {
  font-size: 1.5rem;
  color: #2c3e50;
  margin: 0;
}

.user-section {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.user-email {
  font-size: 0.9rem;
  color: #666;
}

.admin-button, .logout-button {
  padding: 0.5rem 1rem;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.3s;
}

.admin-button {
  background: #667eea;
  color: white;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.logout-button {
  background: #e74c3c;
  color: white;
}

.admin-button:hover, .logout-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.tab-navigation {
  max-width: 1400px;
  margin: 0 auto;
  padding: 1rem 2rem;
  display: flex;
  gap: 1rem;
  overflow-x: auto;
}

.tab-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  font-size: 1rem;
  font-weight: 500;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s;
  white-space: nowrap;
}

.tab-btn.active {
  background: white;
  color: #667eea;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.dashboard-main {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

.loading-state {
  text-align: center;
  padding: 3rem;
  color: white;
}

.spinner-big {
  width: 60px;
  height: 60px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.tab-panel {
  animation: fadeIn 0.3s;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.welcome-section {
  text-align: center;
  margin-bottom: 2rem;
  color: white;
}

.welcome-section h2 {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
}

.welcome-subtitle {
  font-size: 1.2rem;
  opacity: 0.9;
}

/* Streak Focus Card - New */
.streak-focus-card {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  padding: 2rem;
  border-radius: 20px;
  margin-bottom: 2rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  color: white;
}

.streak-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.streak-header h2 {
  font-size: 2rem;
  margin: 0;
}

.streak-number {
  font-size: 4rem;
  font-weight: bold;
  line-height: 1;
}

.streak-description {
  font-size: 1.1rem;
  margin-bottom: 1.5rem;
  opacity: 0.95;
}

.streak-progress-bar {
  background: rgba(255, 255, 255, 0.3);
  height: 40px;
  border-radius: 20px;
  overflow: hidden;
  margin-bottom: 1rem;
  position: relative;
}

.streak-progress-fill {
  background: linear-gradient(90deg, #4caf50 0%, #8bc34a 100%);
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: width 0.5s ease;
  min-width: 80px;
}

.progress-text {
  font-weight: bold;
  font-size: 1rem;
  color: white;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.streak-remaining {
  font-size: 1rem;
  margin: 0;
  opacity: 0.95;
}

/* 20 Stamp Card Grid - New */
.stamp-card-section {
  background: white;
  padding: 2rem;
  border-radius: 20px;
  margin-bottom: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.stamp-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 1rem;
  margin-top: 1.5rem;
}

.stamp-slot {
  aspect-ratio: 1;
  border: 3px solid #e0e0e0;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #f8f9fa;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.stamp-slot.filled {
  background: linear-gradient(135deg, #4caf50 0%, #8bc34a 100%);
  border-color: #4caf50;
  animation: stampPop 0.4s ease;
}

.stamp-slot.current {
  border-color: #f5576c;
  box-shadow: 0 0 0 3px rgba(245, 87, 108, 0.3);
  animation: pulse 2s ease infinite;
}

@keyframes stampPop {
  0% { transform: scale(0.8); opacity: 0; }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.stamp-number {
  font-size: 0.9rem;
  font-weight: bold;
  color: #666;
  position: absolute;
  top: 6px;
  left: 8px;
}

.stamp-slot.filled .stamp-number {
  color: white;
}

.stamp-icon {
  font-size: 2.5rem;
}

.stamp-slot.filled .stamp-icon {
  color: white;
}

.empty-stamp {
  color: #ccc;
  font-size: 3rem;
}

/* Quick Stats - New Compact Design */
.quick-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;
}

.quick-stat-card {
  background: white;
  padding: 1.5rem;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: transform 0.3s;
}

.quick-stat-card:hover {
  transform: translateY(-4px);
}

.quick-stat-card.green {
  background: linear-gradient(135deg, #4caf50 0%, #8bc34a 100%);
  color: white;
}

.quick-stat-card.orange {
  background: linear-gradient(135deg, #ff9800 0%, #ffb74d 100%);
  color: white;
}

.quick-stat-card.blue {
  background: linear-gradient(135deg, #2196f3 0%, #64b5f6 100%);
  color: white;
}

.quick-stat-card .stat-icon {
  font-size: 2.5rem;
}

.quick-stat-card .stat-value {
  font-size: 2rem;
  font-weight: bold;
  line-height: 1;
}

.quick-stat-card .stat-label {
  font-size: 0.9rem;
  opacity: 0.9;
  margin-top: 0.25rem;
}

.rewards-section, .history-section, .social-section, .goals-section, .reminders-section, .workflows-section {
  background: white;
  padding: 2rem;
  border-radius: 16px;
  margin-bottom: 2rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.section-title {
  font-size: 1.8rem;
  color: #2c3e50;
  margin-bottom: 1rem;
}

.section-description {
  color: #666;
  margin-bottom: 1.5rem;
}

.rewards-subtitle {
  color: #666;
  margin-bottom: 1.5rem;
}

.rewards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

.reward-card {
  border: 2px solid #e0e0e0;
  padding: 1.5rem;
  border-radius: 12px;
  text-align: center;
  transition: all 0.3s;
}

.reward-card.unlocked {
  border-color: #4caf50;
  background: #f1f8f4;
}

.reward-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.reward-card h4 {
  font-size: 1.2rem;
  margin-bottom: 0.5rem;
}

.reward-requirement {
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

.reward-prize {
  color: #2c3e50;
  font-weight: 500;
  margin-bottom: 1rem;
}

.reward-badge {
  background: #4caf50;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.9rem;
}

.reward-progress {
  background: #f0f0f0;
  color: #666;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.9rem;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.history-item {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 12px;
  border-left: 4px solid #4caf50;
}

.history-item.late {
  border-left-color: #ff9800;
}

.history-icon {
  font-size: 1.5rem;
}

.history-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.85rem;
}

.status-badge.on-time {
  background: #4caf50;
  color: white;
}

.status-badge.late {
  background: #ff9800;
  color: white;
}

.history-note {
  font-size: 0.9rem;
  color: #666;
  margin: 0;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: #999;
}

.empty-subtitle {
  font-size: 0.9rem;
}

.dual-panel {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
}

@media (min-width: 1200px) {
  .dual-panel {
    grid-template-columns: 1fr 1fr;
  }
}

.calendar-section, .analytics-section {
  background: white;
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.notifications-page {
  background: white;
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  max-width: 900px;
  margin: 0 auto;
}

.notifications-page h2 {
  font-size: 2rem;
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

/* Mobile Optimizations */
@media (max-width: 1024px) {
  .welcome-section h2 {
    font-size: 2rem;
  }
  
  .streak-number {
    font-size: 3rem;
  }
  
  .stamp-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: 0.75rem;
  }
}

@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
  }
  
  .logo-section h1 {
    font-size: 1.2rem;
  }
  
  .user-section {
    flex-wrap: wrap;
    justify-content: center;
  }
  
  .tab-navigation {
    padding: 0.75rem 1rem;
    gap: 0.5rem;
  }
  
  .tab-btn {
    padding: 0.6rem 1rem;
    font-size: 0.9rem;
  }
  
  .dashboard-main {
    padding: 1rem;
  }
  
  .welcome-section h2 {
    font-size: 1.8rem;
  }
  
  .welcome-subtitle {
    font-size: 1rem;
  }
  
  .streak-focus-card {
    padding: 1.5rem;
  }
  
  .streak-header {
    flex-direction: column;
    text-align: center;
    gap: 0.5rem;
  }
  
  .streak-header h2 {
    font-size: 1.5rem;
  }
  
  .streak-number {
    font-size: 3rem;
  }
  
  .streak-description {
    font-size: 1rem;
  }
  
  .stamp-card-section {
    padding: 1.5rem;
  }
  
  .stamp-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: 0.5rem;
  }
  
  .stamp-icon {
    font-size: 2rem;
  }
  
  .stamp-number {
    font-size: 0.75rem;
    top: 4px;
    left: 6px;
  }
  
  .quick-stats {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
  
  .rewards-grid {
    grid-template-columns: 1fr;
  }
  
  .calendar-section, .analytics-section {
    padding: 1.5rem;
  }
  
  .notifications-page {
    padding: 1.5rem;
  }
}

@media (max-width: 480px) {
  .dashboard-main {
    padding: 0.75rem;
  }
  
  .welcome-section h2 {
    font-size: 1.5rem;
  }
  
  .streak-focus-card {
    padding: 1rem;
  }
  
  .streak-number {
    font-size: 2.5rem;
  }
  
  .stamp-grid {
    grid-template-columns: repeat(5, 1fr);
    gap: 0.4rem;
  }
  
  .stamp-icon {
    font-size: 1.5rem;
  }
  
  .stamp-number {
    font-size: 0.65rem;
  }
  
  .section-title {
    font-size: 1.3rem;
  }
  
  .tab-btn {
    padding: 0.5rem 0.75rem;
    font-size: 0.85rem;
  }
}
</style>
