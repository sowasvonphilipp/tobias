<template>
  <div class="gamification-dashboard">
    <!-- Level Progress -->
    <div class="level-section">
      <div class="level-header">
        <div class="level-info">
          <span class="level-label">Level {{ currentLevel }}</span>
          <span class="level-name">{{ levelName }}</span>
        </div>
        <div class="xp-info">
          <span>{{ currentXP }} / {{ nextLevelXP }} XP</span>
        </div>
      </div>
      
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: progressPercentage + '%' }"></div>
      </div>
      
      <div class="level-rewards">
        <span v-if="xpToNextLevel === 0">🎉 Level erreicht!</span>
        <span v-else>Noch {{ xpToNextLevel }} XP bis Level {{ currentLevel + 1 }}</span>
      </div>
    </div>

    <!-- Badges -->
    <div class="badges-section">
      <h3>🏆 Abzeichen ({{ unlockedBadges.length }}/{{ totalBadges }})</h3>
      
      <div class="badges-grid">
        <div 
          v-for="badge in allBadges" 
          :key="badge.id"
          :class="['badge-item', badge.unlocked ? 'unlocked' : 'locked']"
          @click="showBadgeDetails(badge)"
        >
          <div class="badge-icon">{{ badge.icon }}</div>
          <div class="badge-name">{{ badge.name }}</div>
          <div v-if="badge.unlocked" class="badge-date">
            {{ formatDate(badge.unlockedAt) }}
          </div>
          <div v-else class="badge-requirement">
            {{ badge.requirement }}
          </div>
        </div>
      </div>
    </div>

    <!-- Achievements -->
    <div class="achievements-section">
      <h3>⭐ Erfolge</h3>
      
      <div class="achievement-tabs">
        <button 
          v-for="tier in achievementTiers" 
          :key="tier"
          @click="selectedTier = tier"
          :class="{ active: selectedTier === tier }"
        >
          {{ tier }}
        </button>
      </div>

      <div class="achievements-list">
        <div 
          v-for="achievement in filteredAchievements" 
          :key="achievement.id"
          :class="['achievement-item', achievement.unlocked ? 'unlocked' : 'locked']"
        >
          <div class="achievement-icon">{{ achievement.icon }}</div>
          <div class="achievement-details">
            <div class="achievement-name">{{ achievement.name }}</div>
            <div class="achievement-description">{{ achievement.description }}</div>
            <div v-if="!achievement.unlocked" class="achievement-progress">
              <div class="progress-bar-small">
                <div 
                  class="progress-fill-small" 
                  :style="{ width: achievement.progress + '%' }"
                ></div>
              </div>
              <span class="progress-text">{{ achievement.progress }}%</span>
            </div>
          </div>
          <div class="achievement-xp">+{{ achievement.xp }} XP</div>
        </div>
      </div>
    </div>

    <!-- Daily Challenges -->
    <div class="challenges-section">
      <h3>📅 Tägliche Herausforderungen</h3>
      
      <div class="time-remaining">
        Erneuert in: {{ timeUntilReset }}
      </div>

      <div class="challenges-list">
        <div 
          v-for="challenge in dailyChallenges" 
          :key="challenge.id"
          :class="['challenge-item', challenge.completed ? 'completed' : '']"
        >
          <div class="challenge-icon">{{ challenge.icon }}</div>
          <div class="challenge-details">
            <div class="challenge-name">{{ challenge.name }}</div>
            <div class="challenge-description">{{ challenge.description }}</div>
            <div class="challenge-progress">
              <div class="progress-bar-small">
                <div 
                  class="progress-fill-small" 
                  :style="{ width: (challenge.current / challenge.target) * 100 + '%' }"
                ></div>
              </div>
              <span class="progress-text">{{ challenge.current }}/{{ challenge.target }}</span>
            </div>
          </div>
          <div class="challenge-reward">
            <span v-if="challenge.completed">✅</span>
            <span v-else>+{{ challenge.xpReward }} XP</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Leaderboard -->
    <div class="leaderboard-section">
      <h3>🏅 Rangliste</h3>
      
      <div class="leaderboard-tabs">
        <button 
          v-for="tab in leaderboardTabs" 
          :key="tab.id"
          @click="selectedLeaderboard = tab.id"
          :class="{ active: selectedLeaderboard === tab.id }"
        >
          {{ tab.label }}
        </button>
      </div>

      <div class="leaderboard-list">
        <div 
          v-for="(entry, index) in leaderboardData" 
          :key="entry.userId"
          :class="['leaderboard-entry', entry.isCurrentUser ? 'current-user' : '']"
        >
          <div class="rank">
            <span v-if="index < 3" class="medal">{{ getMedal(index) }}</span>
            <span v-else>{{ index + 1 }}</span>
          </div>
          <div class="user-info">
            <div class="user-name">{{ entry.userName }}</div>
            <div class="user-level">Level {{ entry.level }}</div>
          </div>
          <div class="user-score">
            {{ formatScore(entry.score) }}
          </div>
        </div>
      </div>

      <div v-if="userRank" class="user-rank-info">
        Dein Rang: #{{ userRank }} von {{ totalPlayers }}
      </div>
    </div>

    <!-- Milestones -->
    <div class="milestones-section">
      <h3>🎯 Meilensteine</h3>
      
      <div class="milestones-timeline">
        <div 
          v-for="milestone in milestones" 
          :key="milestone.id"
          :class="['milestone-item', milestone.completed ? 'completed' : '']"
        >
          <div class="milestone-marker">
            <span v-if="milestone.completed">✓</span>
            <span v-else>{{ milestone.order }}</span>
          </div>
          <div class="milestone-content">
            <div class="milestone-name">{{ milestone.name }}</div>
            <div class="milestone-requirement">{{ milestone.requirement }}</div>
            <div class="milestone-reward">Belohnung: +{{ milestone.xpReward }} XP</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Stats Summary -->
    <div class="stats-summary">
      <div class="stat-card">
        <div class="stat-icon">🔥</div>
        <div class="stat-value">{{ totalXP }}</div>
        <div class="stat-label">Gesamt-XP</div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">🏆</div>
        <div class="stat-value">{{ unlockedBadges.length }}</div>
        <div class="stat-label">Abzeichen</div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">⭐</div>
        <div class="stat-value">{{ unlockedAchievements.length }}</div>
        <div class="stat-label">Erfolge</div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">📈</div>
        <div class="stat-value">{{ completedChallenges }}</div>
        <div class="stat-label">Challenges</div>
      </div>
    </div>

    <!-- Badge Details Modal -->
    <div v-if="selectedBadge" class="modal-overlay" @click="closeBadgeDetails">
      <div class="modal-content" @click.stop>
        <div class="badge-detail-icon">{{ selectedBadge.icon }}</div>
        <h3>{{ selectedBadge.name }}</h3>
        <p>{{ selectedBadge.description }}</p>
        
        <div v-if="selectedBadge.unlocked" class="unlock-info">
          <p>✅ Freigeschaltet am {{ formatDate(selectedBadge.unlockedAt) }}</p>
        </div>
        <div v-else class="lock-info">
          <p>🔒 Anforderung: {{ selectedBadge.requirement }}</p>
        </div>
        
        <button @click="closeBadgeDetails" class="btn-close">Schließen</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { 
  getUserGamification,
  getAllBadges,
  getAllAchievements,
  getDailyChallenges,
  getLeaderboard,
  getUserRank,
  getMilestones
} = useGamification()

const { user } = useFirebaseAuth()

const currentLevel = ref(1)
const currentXP = ref(0)
const nextLevelXP = ref(100)
const levelName = ref('Anfänger')
const allBadges = ref<any[]>([])
const allAchievements = ref<any[]>([])
const dailyChallenges = ref<any[]>([])
const leaderboardData = ref<any[]>([])
const milestones = ref<any[]>([])
const userRank = ref(0)
const totalPlayers = ref(0)

const selectedTier = ref('bronze')
const selectedLeaderboard = ref('xp')
const selectedBadge = ref<any>(null)

const achievementTiers = ['bronze', 'silver', 'gold', 'platinum']
const leaderboardTabs = [
  { id: 'xp', label: 'XP' },
  { id: 'streak', label: 'Streak' },
  { id: 'punctuality', label: 'Pünktlichkeit' }
]

// Computed
const progressPercentage = computed(() => {
  if (nextLevelXP.value === 0) return 100
  return (currentXP.value / nextLevelXP.value) * 100
})

const xpToNextLevel = computed(() => {
  return Math.max(0, nextLevelXP.value - currentXP.value)
})

const unlockedBadges = computed(() => {
  return allBadges.value.filter(b => b.unlocked)
})

const totalBadges = computed(() => {
  return allBadges.value.length
})

const filteredAchievements = computed(() => {
  return allAchievements.value.filter(a => a.tier === selectedTier.value)
})

const unlockedAchievements = computed(() => {
  return allAchievements.value.filter(a => a.unlocked)
})

const completedChallenges = computed(() => {
  return dailyChallenges.value.filter(c => c.completed).length
})

const totalXP = computed(() => {
  return currentXP.value
})

const timeUntilReset = computed(() => {
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(0, 0, 0, 0)
  
  const diff = tomorrow.getTime() - now.getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  
  return `${hours}h ${minutes}m`
})

// Methods
const loadGamificationData = async () => {
  if (!user.value) return
  
  const gamification = await getUserGamification(user.value.uid)
  if (gamification) {
    currentLevel.value = gamification.level
    currentXP.value = gamification.xp
    // Calculate next level XP based on level
    nextLevelXP.value = gamification.level * 100
  }
  
  allBadges.value = await getAllBadges()
  allAchievements.value = await getAllAchievements()
  dailyChallenges.value = getDailyChallenges()
  leaderboardData.value = await getLeaderboard(selectedLeaderboard.value as any, 10)
  milestones.value = getMilestones()
  
  const rankData = await getUserRank(user.value.uid, selectedLeaderboard.value as any)
  if (typeof rankData === 'number') {
    userRank.value = rankData
    totalPlayers.value = 100 // placeholder
  }
}

const showBadgeDetails = (badge: any) => {
  selectedBadge.value = badge
}

const closeBadgeDetails = () => {
  selectedBadge.value = null
}

const getMedal = (index: number) => {
  const medals = ['🥇', '🥈', '🥉']
  return medals[index] || ''
}

const formatScore = (score: number) => {
  if (selectedLeaderboard.value === 'punctuality') {
    return `${score}%`
  }
  return score.toLocaleString()
}

const formatDate = (timestamp: any) => {
  if (!timestamp) return ''
  const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp)
  return date.toLocaleDateString('de-DE')
}

// Watch for leaderboard changes
watch(selectedLeaderboard, async () => {
  if (user.value) {
    leaderboardData.value = await getLeaderboard(selectedLeaderboard.value as any, 10)
    const rankData = await getUserRank(user.value.uid, selectedLeaderboard.value as any)
    if (typeof rankData === 'number') {
      userRank.value = rankData
      totalPlayers.value = 100 // placeholder
    }
  }
})

// Load data on mount
onMounted(() => {
  loadGamificationData()
})

watch(user, () => {
  if (user.value) {
    loadGamificationData()
  }
})
</script>

<style scoped>
.gamification-dashboard {
  padding: 20px;
  display: grid;
  gap: 20px;
}

/* Level Section */
.level-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.2);
}

.level-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.level-label {
  font-size: 24px;
  font-weight: bold;
}

.level-name {
  font-size: 16px;
  opacity: 0.9;
  display: block;
}

.xp-info {
  font-size: 18px;
}

.progress-bar {
  height: 30px;
  background: rgba(255,255,255,0.2);
  border-radius: 15px;
  overflow: hidden;
  margin-bottom: 10px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4caf50 0%, #8bc34a 100%);
  transition: width 0.3s ease;
}

.level-rewards {
  text-align: center;
  font-size: 14px;
  opacity: 0.9;
}

/* Badges */
.badges-section {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.badges-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 15px;
  margin-top: 15px;
}

.badge-item {
  padding: 15px;
  text-align: center;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.badge-item.unlocked {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
}

.badge-item.locked {
  background: #f5f5f5;
  color: #999;
  opacity: 0.6;
}

.badge-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0,0,0,0.2);
}

.badge-icon {
  font-size: 48px;
  margin-bottom: 10px;
}

.badge-name {
  font-weight: bold;
  font-size: 14px;
  margin-bottom: 5px;
}

.badge-date, .badge-requirement {
  font-size: 11px;
  opacity: 0.8;
}

/* Achievements */
.achievements-section {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.achievement-tabs {
  display: flex;
  gap: 10px;
  margin: 15px 0;
}

.achievement-tabs button {
  flex: 1;
  padding: 10px;
  border: none;
  background: #f5f5f5;
  border-radius: 6px;
  cursor: pointer;
  text-transform: capitalize;
}

.achievement-tabs button.active {
  background: #007bff;
  color: white;
}

.achievements-list {
  display: grid;
  gap: 10px;
}

.achievement-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  border-radius: 8px;
  transition: all 0.2s;
}

.achievement-item.unlocked {
  background: #d4edda;
  border-left: 4px solid #28a745;
}

.achievement-item.locked {
  background: #f8f9fa;
  border-left: 4px solid #ddd;
}

.achievement-icon {
  font-size: 32px;
}

.achievement-details {
  flex: 1;
}

.achievement-name {
  font-weight: bold;
  margin-bottom: 5px;
}

.achievement-description {
  font-size: 14px;
  color: #666;
}

.achievement-progress {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 5px;
}

.progress-bar-small {
  flex: 1;
  height: 8px;
  background: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill-small {
  height: 100%;
  background: #007bff;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 12px;
  color: #666;
}

.achievement-xp {
  font-weight: bold;
  color: #007bff;
}

/* Challenges */
.challenges-section {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.time-remaining {
  text-align: center;
  padding: 10px;
  background: #fff3cd;
  border-radius: 6px;
  margin: 15px 0;
  font-weight: bold;
}

.challenges-list {
  display: grid;
  gap: 10px;
}

.challenge-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  border-radius: 8px;
  background: #f8f9fa;
  border-left: 4px solid #007bff;
}

.challenge-item.completed {
  background: #d4edda;
  border-left-color: #28a745;
}

.challenge-icon {
  font-size: 32px;
}

.challenge-details {
  flex: 1;
}

.challenge-name {
  font-weight: bold;
  margin-bottom: 5px;
}

.challenge-description {
  font-size: 14px;
  color: #666;
  margin-bottom: 5px;
}

.challenge-reward {
  font-weight: bold;
  color: #28a745;
}

/* Leaderboard */
.leaderboard-section {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.leaderboard-tabs {
  display: flex;
  gap: 10px;
  margin: 15px 0;
}

.leaderboard-tabs button {
  flex: 1;
  padding: 10px;
  border: none;
  background: #f5f5f5;
  border-radius: 6px;
  cursor: pointer;
}

.leaderboard-tabs button.active {
  background: #007bff;
  color: white;
}

.leaderboard-list {
  display: grid;
  gap: 5px;
}

.leaderboard-entry {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  border-radius: 8px;
  background: #f8f9fa;
}

.leaderboard-entry.current-user {
  background: #e7f3ff;
  border: 2px solid #007bff;
}

.rank {
  width: 40px;
  text-align: center;
  font-weight: bold;
  font-size: 18px;
}

.medal {
  font-size: 24px;
}

.user-info {
  flex: 1;
}

.user-name {
  font-weight: bold;
  margin-bottom: 3px;
}

.user-level {
  font-size: 12px;
  color: #666;
}

.user-score {
  font-size: 20px;
  font-weight: bold;
  color: #007bff;
}

.user-rank-info {
  text-align: center;
  padding: 15px;
  background: #e7f3ff;
  border-radius: 6px;
  margin-top: 15px;
  font-weight: bold;
}

/* Milestones */
.milestones-section {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.milestones-timeline {
  display: grid;
  gap: 15px;
  margin-top: 15px;
  position: relative;
}

.milestone-item {
  display: flex;
  gap: 15px;
  padding: 15px;
  border-radius: 8px;
  background: #f8f9fa;
  position: relative;
}

.milestone-item.completed {
  background: #d4edda;
}

.milestone-marker {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  flex-shrink: 0;
}

.milestone-item.completed .milestone-marker {
  background: #28a745;
  color: white;
}

.milestone-content {
  flex: 1;
}

.milestone-name {
  font-weight: bold;
  margin-bottom: 5px;
}

.milestone-requirement {
  font-size: 14px;
  color: #666;
  margin-bottom: 3px;
}

.milestone-reward {
  font-size: 12px;
  color: #007bff;
  font-weight: bold;
}

/* Stats Summary */
.stats-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.stat-card {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  text-align: center;
}

.stat-icon {
  font-size: 48px;
  margin-bottom: 10px;
}

.stat-value {
  font-size: 32px;
  font-weight: bold;
  color: #007bff;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
  color: #666;
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
  max-width: 400px;
  text-align: center;
}

.badge-detail-icon {
  font-size: 96px;
  margin-bottom: 20px;
}

.btn-close {
  width: 100%;
  padding: 12px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  margin-top: 20px;
}
</style>
