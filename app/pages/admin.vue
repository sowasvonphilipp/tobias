<template>
  <div class="admin-container">
    <!-- Header -->
    <header class="admin-header">
      <div class="header-content">
        <div class="logo-section">
          <NuxtLink to="/dashboard" class="back-button">
            ← Zurück
          </NuxtLink>
          <h1>⚙️ Admin Panel</h1>
        </div>
        
        <button @click="handleLogout" class="logout-button">
          🚪 Abmelden
        </button>
      </div>
    </header>

    <!-- Main Content -->
    <main class="admin-main">
      <div v-if="!isAdmin && !loading" class="access-denied">
        <div class="denied-icon">🚫</div>
        <h2>Zugriff verweigert</h2>
        <p>Du hast keine Admin-Rechte.</p>
        <NuxtLink to="/dashboard" class="btn-primary">Zurück zum Dashboard</NuxtLink>
      </div>

      <div v-else-if="loading" class="loading-state">
        <div class="spinner-big"></div>
        <p>Lade Admin-Panel...</p>
      </div>

      <div v-else>
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

        <!-- STAMPING TAB -->
        <div v-if="activeTab === 'stamping'" class="tab-panel">
          <div class="welcome-section">
            <h2>Admin Panel 👨‍💼</h2>
            <p class="welcome-subtitle">Stempel Tobias ein - Dienstag & Donnerstag</p>
          </div>

          <!-- Current Day Info -->
          <div class="day-info" :class="dayClass">
            <div class="day-icon">{{ dayIcon }}</div>
            <div class="day-content">
              <h3>{{ currentDayName }}</h3>
              <p>{{ dayMessage }}</p>
            </div>
          </div>

          <!-- Quick Stats -->
          <div class="quick-stats">
            <div class="stat-box">
              <div class="stat-value">{{ tobiasStats.currentStreak }}</div>
              <div class="stat-label">Aktuelle Streak</div>
            </div>
            <div class="stat-box">
              <div class="stat-value">{{ tobiasStats.totalStamps }}</div>
              <div class="stat-label">Gesamt Stempel</div>
            </div>
            <div class="stat-box">
              <div class="stat-value">{{ tobiasStats.onTimeCount }}</div>
              <div class="stat-label">Pünktlich</div>
            </div>
            <div class="stat-box">
              <div class="stat-value">{{ tobiasStats.lateCount }}</div>
              <div class="stat-label">Zu spät</div>
            </div>
          </div>

          <!-- Stamp In Form -->
          <div class="stamp-form-card">
            <h3 class="form-title">🎯 Tobias einstempeln</h3>
            
            <form @submit.prevent="handleStampIn" class="stamp-form">
              <div class="form-group">
                <label>Status</label>
                <div class="radio-group">
                  <label class="radio-label" :class="{ active: stampStatus === 'on-time' }">
                    <input type="radio" v-model="stampStatus" value="on-time" />
                    <span class="radio-custom on-time">
                      ✅ Pünktlich
                    </span>
                  </label>
                  
                  <label class="radio-label" :class="{ active: stampStatus === 'late' }">
                    <input type="radio" v-model="stampStatus" value="late" />
                    <span class="radio-custom late">
                      ⏰ Zu spät
                    </span>
                  </label>
                </div>
              </div>

              <div v-if="stampStatus === 'late'" class="form-group">
                <label for="minutes">Minuten zu spät</label>
                <input 
                  id="minutes"
                  v-model.number="minutesLate" 
                  type="number" 
                  min="1" 
                  required 
                  placeholder="z.B. 15"
                />
              </div>

              <div class="form-group">
                <label for="note">Notiz (optional)</label>
                <textarea 
                  id="note"
                  v-model="note" 
                  placeholder="z.B. Bahn hatte Verspätung..."
                  rows="3"
                ></textarea>
              </div>

              <button type="submit" class="btn-submit" :disabled="submitting">
                {{ submitting ? '⏳ Speichern...' : '✅ Einstempeln' }}
              </button>

              <div v-if="submitMessage" :class="{'success-message': submitSuccess, 'error-message': !submitSuccess}">
                {{ submitMessage }}
              </div>
            </form>
          </div>

          <!-- Today's Stamps -->
          <div class="today-stamps">
            <h3 class="section-title">📅 Heutige Stempel</h3>
            <div v-if="todayStamps.length === 0" class="empty-state">
              <p>Noch keine Stempel heute.</p>
            </div>
            <div v-else class="stamps-list">
              <div v-for="stamp in todayStamps" :key="stamp.id" class="stamp-item">
                <span class="stamp-icon">{{ stamp.status === 'on-time' ? '✅' : '⏰' }}</span>
                <div class="stamp-details">
                  <strong>{{ stamp.status === 'on-time' ? 'Pünktlich' : `${stamp.minutesLate} Min zu spät` }}</strong>
                  <p v-if="stamp.note">{{ stamp.note }}</p>
                  <small>{{ formatTime(stamp.timestamp) }}</small>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- USERS TAB -->
        <div v-if="activeTab === 'users'" class="tab-panel">
          <div class="section-header">
            <h2>👥 Benutzerverwaltung</h2>
            <button @click="loadUsers" class="btn-refresh">🔄 Aktualisieren</button>
          </div>

          <!-- User List -->
          <div class="users-grid">
            <div v-for="user in allUsers" :key="user.id" class="user-card">
              <div class="user-info">
                <div class="user-avatar">👤</div>
                <div class="user-details">
                  <h4>{{ user.displayName || user.email || user.id }}</h4>
                  <p>Streak: {{ user.currentStreak || 0 }}x | Total: {{ user.totalStamps || 0 }} Stempel</p>
                  <p>Level {{ user.level || 1 }} | {{ user.xp || 0 }} XP</p>
                </div>
              </div>
              
              <div class="user-actions">
                <button @click="openUserModal(user, 'streak')" class="btn-action">
                  🔄 Streak
                </button>
                <button @click="openUserModal(user, 'xp')" class="btn-action">
                  ⭐ XP
                </button>
                <button @click="openUserModal(user, 'badge')" class="btn-action">
                  🏆 Badge
                </button>
                <button @click="openUserModal(user, 'stamp')" class="btn-action">
                  📝 Stempel
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- AUDIT LOG TAB -->
        <div v-if="activeTab === 'audit'" class="tab-panel">
          <div class="section-header">
            <h2>📜 Audit Log</h2>
            <button @click="loadAuditLogs" class="btn-refresh">🔄 Aktualisieren</button>
          </div>

          <!-- Filters -->
          <div class="audit-filters">
            <div class="filter-group">
              <label>Aktion:</label>
              <select v-model="auditFilters.action">
                <option value="">Alle</option>
                <option value="reset_streak">Streak zurückgesetzt</option>
                <option value="adjust_streak">Streak angepasst</option>
                <option value="add_bonus_xp">Bonus XP vergeben</option>
                <option value="delete_stamp">Stempel gelöscht</option>
                <option value="edit_stamp">Stempel bearbeitet</option>
                <option value="grant_badge">Badge vergeben</option>
                <option value="revoke_badge">Badge entzogen</option>
                <option value="create_notification">Benachrichtigung erstellt</option>
                <option value="broadcast_notification">Broadcast gesendet</option>
              </select>
            </div>
            
            <div class="filter-group">
              <label>Limit:</label>
              <select v-model.number="auditFilters.limit">
                <option :value="50">50</option>
                <option :value="100">100</option>
                <option :value="200">200</option>
              </select>
            </div>

            <button @click="applyAuditFilters" class="btn-secondary">Filter anwenden</button>
          </div>

          <!-- Audit Logs List -->
          <div class="audit-logs">
            <div v-for="log in auditLogs" :key="log.id" class="audit-log-item">
              <div class="log-icon">{{ getActionIcon(log.action) }}</div>
              <div class="log-content">
                <div class="log-header">
                  <strong>{{ getActionLabel(log.action) }}</strong>
                  <span class="log-time">{{ formatTimestamp(log.timestamp) }}</span>
                </div>
                <p class="log-admin">von {{ log.adminEmail }}</p>
                <p class="log-reason"><strong>Grund:</strong> {{ log.reason || '-' }}</p>
                <details class="log-details">
                  <summary>Details anzeigen</summary>
                  <pre>{{ JSON.stringify(log.details, null, 2) }}</pre>
                </details>
              </div>
            </div>
          </div>
        </div>

        <!-- NOTIFICATIONS TAB -->
        <div v-if="activeTab === 'notifications'" class="tab-panel">
          <div class="section-header">
            <h2>📢 Benachrichtigungen</h2>
          </div>

          <!-- Create Notification Form -->
          <div class="notification-form-card">
            <h3>📨 Benachrichtigung erstellen</h3>
            
            <form @submit.prevent="handleCreateNotification" class="notification-form">
              <div class="form-group">
                <label>Typ</label>
                <select v-model="notificationForm.type" required>
                  <option value="streak_reminder">🔥 Streak Erinnerung</option>
                  <option value="goal_achieved">🎯 Ziel erreicht</option>
                  <option value="reward_available">🎁 Belohnung verfügbar</option>
                  <option value="achievement_unlocked">⭐ Achievement</option>
                  <option value="level_up">⬆️ Level Up</option>
                  <option value="friend_request">👥 Freundschaftsanfrage</option>
                  <option value="challenge_invite">🏆 Challenge Einladung</option>
                  <option value="system_announcement">📢 System Ankündigung</option>
                  <option value="streak_danger">⚠️ Streak in Gefahr</option>
                  <option value="weekly_summary">📊 Wöchentliche Zusammenfassung</option>
                </select>
              </div>

              <div class="form-group">
                <label>Empfänger</label>
                <div class="radio-group">
                  <label>
                    <input type="radio" v-model="notificationForm.recipient" value="all" />
                    Alle Benutzer
                  </label>
                  <label>
                    <input type="radio" v-model="notificationForm.recipient" value="specific" />
                    Spezifischer Benutzer
                  </label>
                </div>
              </div>

              <div v-if="notificationForm.recipient === 'specific'" class="form-group">
                <label>Benutzer-ID oder E-Mail</label>
                <input v-model="notificationForm.userId" type="text" required placeholder="User ID oder E-Mail" />
              </div>

              <div class="form-group">
                <label>Titel</label>
                <input v-model="notificationForm.title" type="text" required placeholder="Titel der Benachrichtigung" />
              </div>

              <div class="form-group">
                <label>Nachricht</label>
                <textarea v-model="notificationForm.message" required rows="4" placeholder="Nachrichtentext..."></textarea>
              </div>

              <div class="form-group">
                <label>
                  <input type="checkbox" v-model="notificationForm.important" />
                  Als wichtig markieren
                </label>
              </div>

              <button type="submit" class="btn-submit" :disabled="notificationSubmitting">
                {{ notificationSubmitting ? '⏳ Senden...' : '📨 Senden ' }}
              </button>

              <div v-if="notificationMessage" :class="{'success-message': notificationSuccess, 'error-message': !notificationSuccess}">
                {{ notificationMessage }}
              </div>
            </form>
          </div>
        </div>

        <!-- CONFIGURATION TAB -->
        <div v-if="activeTab === 'config'" class="tab-panel">
          <div class="section-header">
            <h2>⚙️ Systemkonfiguration</h2>
          </div>

          <!-- XP Configuration -->
          <div class="config-section">
            <h3>⭐ XP Einstellungen</h3>
            <div class="config-grid">
              <div class="config-item">
                <label>Pünktlicher Stempel</label>
                <input v-model.number="xpConfig.onTimeStamp" type="number" min="0" />
              </div>
              <div class="config-item">
                <label>Verspäteter Stempel</label>
                <input v-model.number="xpConfig.lateStamp" type="number" min="0" />
              </div>
              <div class="config-item">
                <label>Sehr verspätet</label>
                <input v-model.number="xpConfig.veryLateStamp" type="number" min="0" />
              </div>
              <div class="config-item">
                <label>Perfekte Woche</label>
                <input v-model.number="xpConfig.perfectWeek" type="number" min="0" />
              </div>
              <div class="config-item">
                <label>Perfekter Monat</label>
                <input v-model.number="xpConfig.perfectMonth" type="number" min="0" />
              </div>
              <div class="config-item">
                <label>Streak Meilenstein</label>
                <input v-model.number="xpConfig.streakMilestone" type="number" min="0" />
              </div>
            </div>
            <button @click="saveXPConfig" class="btn-primary">💾 XP Config speichern</button>
          </div>

          <!-- Reward Tiers -->
          <div class="config-section">
            <h3>🎁 Belohnungsstufen</h3>
            <div class="rewards-config">
              <div v-for="(tier, index) in rewardTiersConfig" :key="index" class="reward-tier-item">
                <input v-model="tier.icon" placeholder="Icon (Emoji)" class="tier-icon-input" />
                <input v-model="tier.name" placeholder="Name" class="tier-name-input" />
                <input v-model.number="tier.requiredStamps" type="number" placeholder="Stempel" class="tier-stamps-input" />
                <input v-model="tier.description" placeholder="Beschreibung" class="tier-desc-input" />
                <button @click="removeTier(index)" class="btn-danger">❌</button>
              </div>
              <button @click="addTier" class="btn-secondary">➕ Stufe hinzufügen</button>
            </div>
            <button @click="saveRewardTiers" class="btn-primary">💾 Belohnungen speichern</button>
          </div>

          <!-- Text Configuration -->
          <div class="config-section">
            <h3>📝 Text-Konfiguration</h3>
            <div class="text-config">
              <div class="config-item">
                <label>Willkommensnachricht</label>
                <textarea v-model="textConfig.welcomeMessage" rows="2"></textarea>
              </div>
              <div class="config-item">
                <label>Streak Erinnerung</label>
                <textarea v-model="textConfig.streakReminderMessage" rows="2"></textarea>
              </div>
              <div class="config-item">
                <label>Belohnung verfügbar</label>
                <textarea v-model="textConfig.rewardAvailableMessage" rows="2"></textarea>
              </div>
              <div class="config-item">
                <label>Level Up</label>
                <textarea v-model="textConfig.levelUpMessage" rows="2"></textarea>
              </div>
            </div>
            <button @click="saveTextConfig" class="btn-primary">💾 Texte speichern</button>
          </div>

          <!-- Automation Configuration -->
          <div class="config-section">
            <h3>🤖 Automation Einstellungen</h3>
            <div class="automation-config">
              <label class="switch-label">
                <input type="checkbox" v-model="automationConfig.autoStreakReminders" />
                <span>Automatische Streak Erinnerungen</span>
              </label>
              
              <label class="switch-label">
                <input type="checkbox" v-model="automationConfig.autoRewardNotifications" />
                <span>Automatische Belohnungs-Benachrichtigungen</span>
              </label>
              
              <label class="switch-label">
                <input type="checkbox" v-model="automationConfig.autoGoalUpdates" />
                <span>Automatische Ziel-Updates</span>
              </label>
              
              <label class="switch-label">
                <input type="checkbox" v-model="automationConfig.autoWeeklySummary" />
                <span>Automatische  Wöchentliche Zusammenfassung</span>
              </label>

              <div class="config-item">
                <label>Erinnerungszeit (HH:MM)</label>
                <input v-model="automationConfig.reminderTime" type="time" />
              </div>
            </div>
            <button @click="saveAutomationConfig" class="btn-primary">💾 Automation speichern</button>
          </div>
        </div>

        <!-- STATISTICS TAB -->
        <div v-if="activeTab === 'stats'" class="tab-panel">
          <div class="section-header">
            <h2>📊 Systemstatistiken</h2>
            <button @click="loadSystemStats" class="btn-refresh">🔄 Aktualisieren</button>
          </div>

          <div class="stats-cards">
            <div class="stats-card">
              <div class="stats-icon">👥</div>
              <div class="stats-content">
                <div class="stats-number">{{ systemStats.totalUsers }}</div>
                <div class="stats-label">Benutzer gesamt</div>
              </div>
            </div>

            <div class="stats-card">
              <div class="stats-icon">✅</div>
              <div class="stats-content">
                <div class="stats-number">{{ systemStats.totalStamps }}</div>
                <div class="stats-label">Stempel gesamt</div>
              </div>
            </div>

            <div class="stats-card">
              <div class="stats-icon">📜</div>
              <div class="stats-content">
                <div class="stats-number">{{ systemStats.totalAuditLogs }}</div>
                <div class="stats-label">Audit Logs</div>
              </div>
            </div>

            <div class="stats-card">
              <div class="stats-icon">📢</div>
              <div class="stats-content">
                <div class="stats-number">{{ systemStats.totalNotifications }}</div>
                <div class="stats-label">Benachrichtigungen</div>
              </div>
            </div>

            <div class="stats-card">
              <div class="stats-icon">🔥</div>
              <div class="stats-content">
                <div class="stats-number">{{ systemStats.activeUsers7d }}</div>
                <div class="stats-label">Aktive User (7d)</div>
              </div>
            </div>

            <div class="stats-card">
              <div class="stats-icon">⭐</div>
              <div class="stats-content">
                <div class="stats-number">{{ systemStats.totalXP }}</div>
                <div class="stats-label">XP gesamt</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- User Action Modal -->
    <div v-if="showUserModal" class="modal-overlay" @click="closeUserModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>{{ userModalTitle }}</h3>
          <button @click="closeUserModal" class="modal-close">✖</button>
        </div>
        
        <div class="modal-body">
          <!-- Streak Actions -->
          <div v-if="userModalType === 'streak'">
            <div class="form-group">
              <label>Aktion</label>
              <select v-model="userActionForm.streakAction">
                <option value="reset">Zurücksetzen (auf 0)</option>
                <option value="adjust">Anpassen</option>
              </select>
            </div>

            <div v-if="userActionForm.streakAction === 'adjust'" class="form-group">
              <label>Neue Streak</label>
              <input v-model.number="userActionForm.streakValue" type="number" min="0" required />
            </div>

            <div class="form-group">
              <label>Grund (erforderlich)</label>
              <textarea v-model="userActionForm.reason" required rows="3" placeholder="Warum wird die Streak geändert?"></textarea>
            </div>

            <button @click="applyStreakAction" class="btn-submit" :disabled="modalSubmitting">
              {{ modalSubmitting ? '⏳ Speichern...' : '✅ Anwenden' }}
            </button>
          </div>

          <!-- XP Actions -->
          <div v-if="userModalType === 'xp'">
            <div class="form-group">
              <label>XP Menge</label>
              <input v-model.number="userActionForm.xpAmount" type="number" min="1" required placeholder="z.B. 500" />
            </div>

            <div class="form-group">
              <label>Grund (erforderlich)</label>
              <textarea v-model="userActionForm.reason" required rows="3" placeholder="Warum wird XP vergeben?"></textarea>
            </div>

            <button @click="applyXPAction" class="btn-submit" :disabled="modalSubmitting">
              {{ modalSubmitting ? '⏳ Vergeben...' : '✅ XP vergeben' }}
            </button>
          </div>

          <!-- Badge Actions -->
          <div v-if="userModalType === 'badge'">
            <div class="form-group">
              <label>Aktion</label>
              <select v-model="userActionForm.badgeAction">
                <option value="grant">Badge vergeben</option>
                <option value="revoke">Badge entziehen</option>
              </select>
            </div>

            <div class="form-group">
              <label>Badge</label>
              <select v-model="userActionForm.badgeId" required>
                <option value="first_stamp">🎯 Erster Stempel</option>
                <option value="week_warrior">📅 Wochen-Krieger</option>
                <option value="month_master">🗓️ Monats-Meister</option>
                <option value="streak_10">🔥 10er Streak</option>
                <option value="streak_20">🔥🔥 20er Streak</option>
                <option value="streak_50">🔥🔥🔥 50er Streak</option>
                <option value="perfect_week">⭐ Perfekte Woche</option>
                <option value="early_bird">🐦 Frühaufsteher</option>
              </select>
            </div>

            <div class="form-group">
              <label>Grund (erforderlich)</label>
              <textarea v-model="userActionForm.reason" required rows="3" placeholder="Warum wird das Badge vergeben/entzogen?"></textarea>
            </div>

            <button @click="applyBadgeAction" class="btn-submit" :disabled="modalSubmitting">
              {{ modalSubmitting ? '⏳ Anwenden...' : '✅ Anwenden' }}
            </button>
          </div>

          <div v-if="modalMessage" :class="{'success-message': modalSuccess, 'error-message': !modalSuccess}">
            {{ modalMessage }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
definePageMeta({
  middleware: 'auth'
})

const { user, logout } = useFirebaseAuth()
const { stampIn, getUserStats, getRecentStamps, isUserAdmin, getTobiasUserId } = useStempelCard()
const { getAllUsers, getSystemStats, resetUserStreak, adjustUserStreak, addBonusXP, grantBadge, revokeBadge, getAuditLogs, createNotification, broadcastNotification } = useAdmin()
const { getXPConfig, updateXPConfig, getRewardTiers, updateRewardTiers, getTextConfig, updateTextConfig, getAutomationConfig, updateAutomationConfig } = useConfig()
const router = useRouter()

const loading = ref(true)
const isAdmin = ref(false)
const activeTab = ref('stamping')

interface User {
  id: string
  displayName?: string
  email?: string
  currentStreak?: number
  totalStamps?: number
  level?: number
  xp?: number
}

interface Stamp {
  id: string
  status: 'on-time' | 'late'
  minutesLate: number
  note?: string
  timestamp: any
}

interface AuditLog {
  id: string
  action: string
  adminEmail: string
  timestamp: any
  reason?: string
  details: any
}

const tabs = [
  { id: 'stamping', label: 'Stempeln', icon: '🎯' },
  { id: 'users', label: 'Benutzer', icon: '👥' },
  { id: 'audit', label: 'Audit Log', icon: '📜' },
  { id: 'notifications', label: 'Benachrichtigungen', icon: '📢' },
  { id: 'config', label: 'Konfiguration', icon: '⚙️' },
  { id: 'stats', label: 'Statistiken', icon: '📊' }
]

// Stamping tab
const tobiasUserId = ref<string>('')
const tobiasStats = ref({ currentStreak: 0, totalStamps: 0, onTimeCount: 0, lateCount: 0 })
const todayStamps = ref<Stamp[]>([])
const stampStatus = ref('on-time')
const minutesLate = ref(0)
const note = ref('')
const submitting = ref(false)
const submitMessage = ref('')
const submitSuccess = ref(false)

const currentDayName = computed(() => {
  const days = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag']
  return days[new Date().getDay()]
})

const dayIcon = computed(() => {
  const day = new Date().getDay()
  return (day === 2 || day === 4) ? '✅' : '📅'
})

const dayClass = computed(() => {
  const day = new Date().getDay()
  return (day === 2 || day === 4) ? 'required-day' : 'normal-day'
})

const dayMessage = computed(() => {
  const day = new Date().getDay()
  return (day === 2 || day === 4) ? 'Heute ist ein Pflichttag!' : 'Heute ist kein Pflichttag.'
})

// Users tab
const allUsers = ref<User[]>([])
const showUserModal = ref(false)
const selectedUser = ref<User | null>(null)
const userModalType = ref<'streak' | 'xp' | 'badge' | 'stamp'>('streak')
const userModalTitle = computed(() => {
  if (!selectedUser.value) return ''
  const userName = selectedUser.value.displayName || selectedUser.value.email || selectedUser.value.id
  const actions = {
    streak: 'Streak anpassen',
    xp: 'XP vergeben',
    badge: 'Badge verwalten',
    stamp: 'Stempel bearbeiten'
  }
  return `${userName} - ${actions[userModalType.value]}`
})

const userActionForm = ref({
  streakAction: 'reset',
  streakValue: 0,
  xpAmount: 0,
  badgeAction: 'grant',
  badgeId: '',
  reason: ''
})

const modalSubmitting = ref(false)
const modalMessage = ref('')
const modalSuccess = ref(false)

// Audit log tab
const auditLogs = ref<AuditLog[]>([])
const auditFilters = ref({
  action: '',
  limit: 50
})

// Notifications tab
const notificationForm = ref({
  type: 'system_announcement',
  recipient: 'all',
  userId: '',
  title: '',
  message: '',
  important: false
})
const notificationSubmitting = ref(false)
const notificationMessage = ref('')
const notificationSuccess = ref(false)

// Config tab
const xpConfig = ref({
  onTimeStamp: 50,
  lateStamp: 20,
  veryLateStamp: 5,
  perfectWeek: 200,
  perfectMonth: 1000,
  streakMilestone: 100
})

const rewardTiersConfig = ref<any[]>([])

const textConfig = ref({
  welcomeMessage: '',
  streakReminderMessage: '',
  rewardAvailableMessage: '',
  levelUpMessage: ''
})

const automationConfig = ref({
  autoStreakReminders: false,
  autoRewardNotifications: false,
  autoGoalUpdates: false,
  autoWeeklySummary: false,
  reminderTime: '08:00'
})

// Stats tab
const systemStats = ref({
  totalUsers: 0,
  totalStamps: 0,
  totalAuditLogs: 0,
  totalNotifications: 0,
  activeUsers7d: 0,
  totalXP: 0
})

onMounted(async () => {
  if (!user.value) {
    router.push('/login')
    return
  }

  loading.value = true
  
  try {
    const adminStatus = await isUserAdmin(user.value.email || '')
    isAdmin.value = adminStatus
    
    if (adminStatus) {
      await loadInitialData()
    }
  } catch (error) {
    console.error('Error checking admin status:', error)
  } finally {
    loading.value = false
  }
})

const loadInitialData = async () => {
  try {
    // Load Tobias's data (assuming specific user ID or email)
    const tobiasEmail = 'tobias@example.com' // Adjust as needed
    const tobiasId = 'tobias-user-id' // Adjust as needed
    
    const [stats, stamps, config] = await Promise.all([
      getUserStats(tobiasId).catch(() => ({ currentStreak: 0, totalStamps: 0, onTimeCount: 0, lateCount: 0 })),
      getRecentStamps(tobiasId, 10).catch(() => []),
      getXPConfig().catch(() => xpConfig.value)
    ])
    
    tobiasStats.value = stats as any
    todayStamps.value = stamps as any
    xpConfig.value = config as any
  } catch (error) {
    console.error('Error loading initial data:', error)
  }
}

const handleLogout = async () => {
  await logout()
  router.push('/login')
}

const handleStampIn = async () => {
  submitting.value = true
  submitMessage.value = ''
  
  try {
    // Ensure we have Tobias user ID
    if (!tobiasUserId.value) {
      tobiasUserId.value = await getTobiasUserId()
    }
    
    await stampIn(
      tobiasUserId.value,
      stampStatus.value as 'on-time' | 'late',
      stampStatus.value === 'late' ? minutesLate.value : 0,
      note.value
    )
    
    submitMessage.value = '✅ Erfolgreich für Tobias eingestempelt!'
    submitSuccess.value = true
    
    // Reset form
    stampStatus.value = 'on-time'
    minutesLate.value = 0
    note.value = ''
    
    // Reload data
    await loadInitialData()
  } catch (error: any) {
    submitMessage.value = '❌ Fehler: ' + (error?.message || 'Unbekannter Fehler')
    submitSuccess.value = false
  } finally {
    submitting.value = false
    setTimeout(() => { submitMessage.value = '' }, 5000)
  }
}

const formatTime = (timestamp: any) => {
  if (!timestamp) return ''
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
}

const formatTimestamp = (timestamp: any) => {
  if (!timestamp) return ''
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  return date.toLocaleString('de-DE')
}

const loadUsers = async () => {
  try {
    allUsers.value = await getAllUsers()
  } catch (error: any) {
    alert('Fehler beim Laden der Benutzer: ' + (error?.message || 'Unbekannter Fehler'))
  }
}

const openUserModal = (user: User, type: 'streak' | 'xp' | 'badge' | 'stamp') => {
  selectedUser.value = user
  userModalType.value = type
  showUserModal.value = true
  userActionForm.value = {
    streakAction: 'reset',
    streakValue: 0,
    xpAmount: 0,
    badgeAction: 'grant',
    badgeId: '',
    reason: ''
  }
  modalMessage.value = ''
}

const closeUserModal = () => {
  showUserModal.value = false
  selectedUser.value = null
  userModalType.value = 'streak'
  modalMessage.value = ''
}

const applyStreakAction = async () => {
  if (!userActionForm.value.reason.trim()) {
    modalMessage.value = '❌ Grund ist erforderlich!'
    modalSuccess.value = false
    return
  }
  
  modalSubmitting.value = true
  modalMessage.value = ''
  
  try {
    if (!selectedUser.value) {
      modalMessage.value = '❌ Kein Benutzer ausgewählt'
      return
    }
    
    if (userActionForm.value.streakAction === 'reset') {
      await resetUserStreak(selectedUser.value.id, userActionForm.value.reason)
      modalMessage.value = '✅ Streak erfolgreich zurückgesetzt!'
    } else {
      await adjustUserStreak(selectedUser.value.id, userActionForm.value.streakValue, userActionForm.value.reason)
      modalMessage.value = '✅ Streak erfolgreich angepasst!'
    }
    modalSuccess.value = true
    await loadUsers()
  } catch (error: any) {
    modalMessage.value = '❌ Fehler: ' + (error?.message || error)
    modalSuccess.value = false
  } finally {
    modalSubmitting.value = false
  }
}

const applyXPAction = async () => {
  if (!userActionForm.value.reason.trim()) {
    modalMessage.value = '❌ Grund ist erforderlich!'
    modalSuccess.value = false
    return
  }
  
  modalSubmitting.value = true
  modalMessage.value = ''
  
  try {
    if (!selectedUser.value) {
      modalMessage.value = '❌ Kein Benutzer ausgewählt'
      return
    }
    
    await addBonusXP(selectedUser.value.id, userActionForm.value.xpAmount, userActionForm.value.reason)
    modalMessage.value = '✅ XP erfolgreich vergeben!'
    modalSuccess.value = true
    await loadUsers()
  } catch (error: any) {
    modalMessage.value = '❌ Fehler: ' + (error?.message || error)
    modalSuccess.value = false
  } finally {
    modalSubmitting.value = false
  }
}

const applyBadgeAction = async () => {
  if (!userActionForm.value.reason.trim()) {
    modalMessage.value = '❌ Grund ist erforderlich!'
    modalSuccess.value = false
    return
  }
  
  modalSubmitting.value = true
  modalMessage.value = ''
  
  try {
    if (!selectedUser.value) {
      modalMessage.value = '❌ Kein Benutzer ausgewählt'
      return
    }
    
    if (userActionForm.value.badgeAction === 'grant') {
      await grantBadge(selectedUser.value.id, userActionForm.value.badgeId, userActionForm.value.reason)
      modalMessage.value = '✅ Badge erfolgreich vergeben!'
    } else {
      await revokeBadge(selectedUser.value.id, userActionForm.value.badgeId, userActionForm.value.reason)
      modalMessage.value = '✅ Badge erfolgreich entzogen!'
    }
    modalSuccess.value = true
    await loadUsers()
  } catch (error: any) {
    modalMessage.value = '❌ Fehler: ' + (error?.message || error)
    modalSuccess.value = false
  } finally {
    modalSubmitting.value = false
  }
}

const loadAuditLogs = async () => {
  await applyAuditFilters()
}

const applyAuditFilters = async () => {
  try {
    const filters: any = {}
    if (auditFilters.value.action) {
      filters.action = auditFilters.value.action
    }
    filters.limit = auditFilters.value.limit
    
    auditLogs.value = (await getAuditLogs(filters)) as any
  } catch (error: any) {
    alert('Fehler beim Laden der Audit Logs: ' + (error?.message || 'Unbekannter Fehler'))
  }
}

const getActionIcon = (action: string) => {
  const icons: Record<string, string> = {
    reset_streak: '🔄',
    adjust_streak: '📝',
    add_bonus_xp: '⭐',
    delete_stamp: '🗑️',
    edit_stamp: '✏️',
    grant_badge: '🏆',
    revoke_badge: '❌',
    create_notification: '📨',
    broadcast_notification: '📢'
  }
  return icons[action] || '📋'
}

const getActionLabel = (action: string) => {
  const labels: Record<string, string> = {
    reset_streak: 'Streak zurückgesetzt',
    adjust_streak: 'Streak angepasst',
    add_bonus_xp: 'Bonus XP vergeben',
    delete_stamp: 'Stempel gelöscht',
    edit_stamp: 'Stempel bearbeitet',
    grant_badge: 'Badge vergeben',
    revoke_badge: 'Badge entzogen',
    create_notification: 'Benachrichtigung erstellt',
    broadcast_notification: 'Broadcast gesendet'
  }
  return labels[action] || action
}

const handleCreateNotification = async () => {
  notificationSubmitting.value = true
  notificationMessage.value = ''
  
  try {
    const data = {
      type: notificationForm.value.type,
      title: notificationForm.value.title,
      message: notificationForm.value.message,
      important: notificationForm.value.important
    }
    
    if (notificationForm.value.recipient === 'all') {
      await broadcastNotification(data)
      notificationMessage.value = '✅ Broadcast erfolgreich gesendet!'
    } else {
      await createNotification(notificationForm.value.userId, data)
      notificationMessage.value = '✅ Benachrichtigung erfolgreich gesendet!'
    }
    
    notificationSuccess.value = true
    
    // Reset form
    notificationForm.value = {
      type: 'system_announcement',
      recipient: 'all',
      userId: '',
      title: '',
      message: '',
      important: false
    }
  } catch (error: any) {
    notificationMessage.value = '❌ Fehler: ' + (error?.message || error)
    notificationSuccess.value = false
  } finally {
    notificationSubmitting.value = false
    setTimeout(() => { notificationMessage.value = '' }, 5000)
  }
}

const saveXPConfig = async () => {
  try {
    await updateXPConfig(xpConfig.value)
    alert('✅ XP Konfiguration gespeichert!')
  } catch (error: any) {
    alert('❌ Fehler: ' + (error?.message || error))
  }
}

const saveRewardTiers = async () => {
  try {
    await updateRewardTiers(rewardTiersConfig.value)
    alert('✅ Belohnungen gespeichert!')
  } catch (error: any) {
    alert('❌ Fehler: ' + (error?.message || error))
  }
}

const addTier = () => {
  rewardTiersConfig.value.push({
    icon: '🎁',
    name: '',
    requiredStamps: 0,
    description: ''
  })
}

const removeTier = (index: number) => {
  rewardTiersConfig.value.splice(index, 1)
}

const saveTextConfig = async () => {
  try {
    await updateTextConfig(textConfig.value)
    alert('✅ Texte gespeichert!')
  } catch (error: any) {
    alert('❌ Fehler: ' + (error?.message || error))
  }
}

const saveAutomationConfig = async () => {
  try {
    await updateAutomationConfig(automationConfig.value)
    alert('✅ Automation gespeichert!')
  } catch (error: any) {
    alert('❌ Fehler: ' + (error?.message || error))
  }
}

const loadSystemStats = async () => {
  try {
    const stats = await getSystemStats()
    systemStats.value = stats as any || {
      totalUsers: 0,
      totalStamps: 0,
      totalAuditLogs: 0,
      totalNotifications: 0,
      activeUsers7d: 0,
      totalXP: 0
    }
  } catch (error: any) {
    alert('Fehler beim Laden der Statistiken: ' + (error?.message || 'Unbekannter Fehler'))
  }
}

// Auto-load config data when config tab is opened
watch(activeTab, async (newTab) => {
  if (newTab === 'users' && allUsers.value.length === 0) {
    await loadUsers()
  } else if (newTab === 'audit' && auditLogs.value.length === 0) {
    await loadAuditLogs()
  } else if (newTab === 'config') {
    try {
      const [xp, rewards, texts, automation] = await Promise.all([
        getXPConfig(),
        getRewardTiers(),
        getTextConfig(),
        getAutomationConfig  ()
      ])
      xpConfig.value = xp as any
      rewardTiersConfig.value = rewards
      textConfig.value = texts as any
      automationConfig.value = automation as any
    } catch (error) {
      console.error('Error loading config:', error)
    }
  } else if (newTab === 'stats') {
    await loadSystemStats()
  }
})
</script>

<style scoped>
.admin-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.admin-header {
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

.back-button {
  padding: 0.5rem 1rem;
  background: #667eea;
  color: white;
  text-decoration: none;
  border-radius: 8px;
  font-size: 0.9rem;
  transition: all 0.3s;
}

.back-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.logo-section h1 {
  font-size: 1.5rem;
  color: #2c3e50;
  margin: 0;
}

.logout-button {
  padding: 0.5rem 1rem;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  background: #e74c3c;
  color: white;
  transition: all 0.3s;
}

.logout-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.admin-main {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

.access-denied {
  background: white;
  padding: 3rem;
  border-radius: 16px;
  text-align: center;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.denied-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
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

.tab-navigation {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  overflow-x: auto;
  padding-bottom: 0.5rem;
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
  color: #f5576c;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
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

.day-info {
  padding: 1.5rem;
  border-radius: 16px;
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  background: white;
}

.day-info.required-day {
  background: linear-gradient(135deg, #4caf50 0%, #81c784 100%);
  color: white;
}

.day-info.normal-day {
  background: #f8f9fa;
  color: #2c3e50;
}

.day-icon {
  font-size: 3rem;
}

.day-content h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
}

.day-content p {
  margin: 0;
  opacity: 0.9;
}

.quick-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-box {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-value {
  font-size: 2.5rem;
  font-weight: bold;
  color: #f5576c;
  margin-bottom: 0.5rem;
}

.stat-label {
  color: #666;
  font-size: 0.9rem;
}

.stamp-form-card, .notification-form-card, .config-section {
  background: white;
  padding: 2rem;
  border-radius: 16px;
  margin-bottom: 2rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.form-title {
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
  color: #2c3e50;
}

.stamp-form, .notification-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 500;
  color: #2c3e50;
}

.form-group input, .form-group textarea, .form-group select {
  padding: 0.75rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s;
}

.form-group input:focus, .form-group textarea:focus, .form-group select:focus {
  outline: none;
  border-color: #f5576c;
}

.radio-group {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.radio-label {
  cursor: pointer;
}

.radio-label input {
  display: none;
}

.radio-custom {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  transition: all 0.3s;
}

.radio-label.active .radio-custom {
  border-color: #f5576c;
  background: #f5576c;
  color: white;
}

.btn-submit, .btn-primary, .btn-secondary, .btn-action, .btn-refresh, .btn-danger {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  transition: all 0.3s;
}

.btn-submit, .btn-primary {
  background: #4caf50;
  color: white;
}

.btn-secondary {
  background: #667eea;
  color: white;
}

.btn-action {
  background: #ff9800;
  color: white;
  padding: 0.5rem 1rem;
  font-size: 0.85rem;
}

.btn-refresh {
  background: #2196f3;
  color: white;
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
}

.btn-danger {
  background: #e74c3c;
  color: white;
  padding: 0.5rem 1rem;
  font-size: 0.85rem;
}

.btn-submit:hover, .btn-primary:hover, .btn-secondary:hover, .btn-action:hover, .btn-refresh:hover, .btn-danger:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.btn-submit:disabled, .btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.success-message {
  padding: 1rem;
  background: #d4edda;
  color: #155724;
  border-radius: 8px;
  border: 1px solid #c3e6cb;
}

.error-message {
  padding: 1rem;
  background: #f8d7da;
  color: #721c24;
  border-radius: 8px;
  border: 1px solid #f5c6cb;
}

.today-stamps, .section-header {
  background: white;
  padding: 2rem;
  border-radius: 16px;
  margin-bottom: 2rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
}

.section-header h2 {
  margin: 0;
  font-size: 1.8rem;
  color: #2c3e50;
}

.section-title {
  font-size: 1.5rem;
  margin-bottom: 1rem;
  color: #2c3e50;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: #999;
}

.stamps-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.stamp-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 12px;
}

.stamp-icon {
  font-size: 1.5rem;
}

.stamp-details strong {
  display: block;
  margin-bottom: 0.25rem;
}

.stamp-details p {
  margin: 0.25rem 0;
  color: #666;
}

.stamp-details small {
  color: #999;
  font-size: 0.85rem;
}

.users-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.user-card {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.user-details h4 {
  margin: 0 0 0.25rem 0;
  font-size: 1.1rem;
}

.user-details p {
  margin: 0;
  color: #666;
  font-size: 0.9rem;
}

.user-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.audit-filters {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
  min-width: 200px;
}

.filter-group label {
  font-weight: 500;
  color: #2c3e50;
}

.filter-group select {
  padding: 0.5rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
}

.audit-logs {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.audit-log-item {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  display: flex;
  gap: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.log-icon {
  font-size: 1.5rem;
}

.log-content {
  flex: 1;
}

.log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.log-time {
  color: #999;
  font-size: 0.85rem;
}

.log-admin, .log-reason {
  color: #666;
  font-size: 0.9rem;
  margin: 0.25rem 0;
}

.log-details {
  margin-top: 0.5rem;
}

.log-details summary {
  cursor: pointer;
  color: #667eea;
  font-size: 0.9rem;
}

.log-details pre {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  overflow-x: auto;
  font-size: 0.85rem;
  margin-top: 0.5rem;
}

.config-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.config-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.config-item label {
  font-weight: 500;
  color: #2c3e50;
}

.config-item input, .config-item textarea {
  padding: 0.75rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
}

.rewards-config {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.reward-tier-item {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.tier-icon-input {
  width: 80px;
  padding: 0.5rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
}

.tier-name-input {
  flex: 1;
  padding: 0.5rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  min-width: 150px;
}

.tier-stamps-input {
  width: 100px;
  padding: 0.5rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
}

.tier-desc-input {
  flex: 2;
  padding: 0.5rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  min-width: 200px;
}

.text-config {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.automation-config {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.switch-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 8px;
  cursor: pointer;
}

.switch-label input[type="checkbox"] {
  width: 20px;
  height: 20px;
  cursor: pointer;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.stats-card {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stats-icon {
  font-size: 3rem;
}

.stats-content {
  flex: 1;
}

.stats-number {
  font-size: 2.5rem;
  font-weight: bold;
  color: #f5576c;
  margin-bottom: 0.5rem;
}

.stats-label {
  color: #666;
  font-size: 0.9rem;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 2rem;
}

.modal-content {
  background: white;
  border-radius: 16px;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.modal-header {
  padding: 1.5rem 2rem;
  border-bottom: 2px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.5rem;
  color: #2c3e50;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #999;
  transition: color 0.3s;
}

.modal-close:hover {
  color: #333;
}

.modal-body {
  padding: 2rem;
}

@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: 1rem;
  }
  
  .tab-navigation {
    flex-wrap: wrap;
  }
  
  .admin-main {
    padding: 1rem;
  }
  
  .quick-stats {
    grid-template-columns: 1fr;
  }
  
  .user-card {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .user-actions {
    width: 100%;
  }
  
  .reward-tier-item {
    flex-wrap: wrap;
  }
  
  .stats-cards {
    grid-template-columns: 1fr;
  }
}
</style>
