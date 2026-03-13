<template>
  <div class="notifications-panel">
    <div class="notifications-header">
      <h3>🔔 Benachrichtigungen</h3>
      <div class="header-actions">
        <button v-if="unreadCount > 0" @click="markAllAsRead" class="btn-mark-all">
          Alle als gelesen markieren
        </button>
        <button @click="loadNotifications" class="btn-refresh">🔄</button>
      </div>
    </div>

    <div class="notifications-filter">
      <button 
        @click="filter = 'all'" 
        :class="{ active: filter === 'all' }"
        class="filter-btn"
      >
        Alle ({{ allNotifications.length }})
      </button>
      <button 
        @click="filter = 'unread'" 
        :class="{ active: filter === 'unread' }"
        class="filter-btn"
      >
        Ungelesen ({{ unreadCount }})
      </button>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Lade Benachrichtigungen...</p>
    </div>

    <div v-else-if="filteredNotifications.length === 0" class="empty-state">
      <div class="empty-icon">📭</div>
      <p>{{ filter === 'unread' ? 'Keine ungelesenen Benachrichtigungen' : 'Keine Benachrichtigungen' }}</p>
    </div>

    <div v-else class="notifications-list">
      <div 
        v-for="notification in filteredNotifications" 
        :key="notification.id"
        :class="['notification-item', { unread: !notification.read, important: notification.important }]"
        @click="handleNotificationClick(notification)"
      >
        <div class="notification-icon">
          {{ getNotificationIcon(notification.type) }}
        </div>
        
        <div class="notification-content">
          <div class="notification-header">
            <h4>{{ notification.title }}</h4>
            <span class="notification-time">{{ formatTime(notification.createdAt) }}</span>
          </div>
          
          <p class="notification-message">{{ notification.message }}</p>
          
          <div v-if="notification.data" class="notification-data">
            <span v-if="notification.data.reward" class="data-badge">
              🎁 {{ notification.data.reward }}
            </span>
            <span v-if="notification.data.xp" class="data-badge">
              ⭐ +{{ notification.data.xp }} XP
            </span>
            <span v-if="notification.data.level" class="data-badge">
              ⬆️ Level {{ notification.data.level }}
            </span>
          </div>
        </div>

        <div class="notification-actions">
          <button 
            v-if="!notification.read" 
            @click.stop="markAsRead(notification.id)"
            class="btn-mark-read"
            title="Als gelesen markieren"
          >
            ✓
          </button>
          <button 
            @click.stop="deleteNotification(notification.id)"
            class="btn-delete"
            title="Löschen"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>

    <!-- Notification Settings Link -->
    <div class="notifications-footer">
      <button @click="openSettings" class="btn-settings">
        ⚙️ Benachrichtigungs-Einstellungen
      </button>
    </div>

    <!-- Settings Modal -->
    <div v-if="showSettings" class="modal-overlay" @click="closeSettings">
      <div class="modal-content" @click.stop>
        <h3>⚙️ Benachrichtigungs-Einstellungen</h3>
        
        <div class="settings-form">
          <div class="setting-group">
            <h4>Benachrichtigungs-Kanäle</h4>
            <label class="checkbox-label">
              <input type="checkbox" v-model="settings.inApp" />
              <span>In-App Benachrichtigungen</span>
            </label>
            <label class="checkbox-label">
              <input type="checkbox" v-model="settings.email" />
              <span>E-Mail Benachrichtigungen</span>
            </label>
            <label class="checkbox-label">
              <input type="checkbox" v-model="settings.push" />
              <span>Push-Benachrichtigungen</span>
            </label>
          </div>

          <div class="setting-group">
            <h4>Benachrichtigungs-Kategorien</h4>
            <label class="checkbox-label">
              <input type="checkbox" v-model="settings.categories.streak_reminders" />
              <span>🔥 Streak-Erinnerungen & Updates</span>
            </label>
            <label class="checkbox-label">
              <input type="checkbox" v-model="settings.categories.streak_reset" />
              <span>💔 Streak-Reset Warnungen</span>
            </label>
            <label class="checkbox-label">
              <input type="checkbox" v-model="settings.categories.punctuality" />
              <span>⏰ Pünktlichkeits-Updates</span>
            </label>
            <label class="checkbox-label">
              <input type="checkbox" v-model="settings.categories.rewards" />
              <span>🎁 Belohnungen</span>
            </label>
            <label class="checkbox-label">
              <input type="checkbox" v-model="settings.categories.achievements" />
              <span>⭐ Erfolge</span>
            </label>
            <label class="checkbox-label">
              <input type="checkbox" v-model="settings.categories.system" />
              <span>📢 System-Ankündigungen</span>
            </label>
          </div>

          <div class="setting-group">
            <h4>Ruhemodus</h4>
            <label class="checkbox-label">
              <input type="checkbox" v-model="settings.quiet_hours.enabled" />
              <span>Ruhemodus aktivieren</span>
            </label>
            <div v-if="settings.quiet_hours.enabled" class="time-inputs">
              <div>
                <label>Von:</label>
                <input type="time" v-model="settings.quiet_hours.start" />
              </div>
              <div>
                <label>Bis:</label>
                <input type="time" v-model="settings.quiet_hours.end" />
              </div>
            </div>
          </div>

          <div class="setting-group">
            <h4>Häufigkeit</h4>
            <select v-model="settings.frequency">
              <option value="realtime">Echtzeit</option>
              <option value="hourly">Stündlich</option>
              <option value="daily">Täglich</option>
            </select>
          </div>
        </div>

        <div class="modal-actions">
          <button @click="saveSettings" class="btn-save">💾 Speichern</button>
          <button @click="closeSettings" class="btn-cancel">Abbrechen</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  userId: string
}>()

const {
  getUserNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification: deleteNotificationFn,
  getUserNotificationSettings,
  updateUserNotificationSettings
} = useNotifications()

const loading = ref(false)
const allNotifications = ref<any[]>([])
const filter = ref('all')
const showSettings = ref(false)
const settings = ref<any>({
  email: true,
  push: true,
  sms: false,
  inApp: true,
  frequency: 'realtime',
  quiet_hours: { enabled: false, start: '22:00', end: '08:00' },
  categories: {
    streak_reminders: true,
    streak_reset: true,
    punctuality: true,
    rewards: true,
    achievements: true,
    system: true
  }
})

const unreadCount = computed(() => {
  return allNotifications.value.filter(n => !n.read).length
})

const filteredNotifications = computed(() => {
  if (filter.value === 'unread') {
    return allNotifications.value.filter(n => !n.read)
  }
  return allNotifications.value
})

const loadNotifications = async () => {
  if (!props.userId) return
  
  loading.value = true
  try {
    allNotifications.value = await getUserNotifications(props.userId)
  } finally {
    loading.value = false
  }
}

const markAsRead = async (notificationId: string) => {
  try {
    await markNotificationRead(notificationId)
    const notification = allNotifications.value.find(n => n.id === notificationId)
    if (notification) {
      notification.read = true
    }
  } catch (error) {
    console.error('Error marking as read:', error)
  }
}

const markAllAsRead = async () => {
  if (!props.userId) return
  
  try {
    await markAllNotificationsRead(props.userId)
    allNotifications.value.forEach(n => n.read = true)
  } catch (error) {
    console.error('Error marking all as read:', error)
  }
}

const deleteNotification = async (notificationId: string) => {
  if (!confirm('Benachrichtigung wirklich löschen?')) return
  
  try {
    await deleteNotificationFn(notificationId)
    allNotifications.value = allNotifications.value.filter(n => n.id !== notificationId)
  } catch (error) {
    console.error('Error deleting notification:', error)
  }
}

const handleNotificationClick = async (notification: any) => {
  if (!notification.read) {
    await markAsRead(notification.id)
  }
  
  // Handle navigation based on notification type
  if (notification.action) {
    // Navigate to specific page or perform action
  }
}

const openSettings = async () => {
  if (!props.userId) return
  
  const userSettings = await getUserNotificationSettings(props.userId)
  if (userSettings) {
    settings.value = userSettings
  }
  
  showSettings.value = true
}

const closeSettings = () => {
  showSettings.value = false
}

const saveSettings = async () => {
  if (!props.userId) return
  
  try {
    await updateUserNotificationSettings(props.userId, settings.value)
    alert('✅ Einstellungen gespeichert!')
    closeSettings()
  } catch (error) {
    alert('❌ Fehler beim Speichern der Einstellungen')
  }
}

const getNotificationIcon = (type: string) => {
  const icons: any = {
    streak_reminder: '🔥',
    streak_reset: '💔',
    streak_danger: '⚠️',
    streak_milestone: '🎉',
    goal_achieved: '🎯',
    reward_available: '🎁',
    achievement_unlocked: '⭐',
    level_up: '⬆️',
    friend_request: '👥',
    challenge_invite: '🏆',
    system_announcement: '📢',
    weekly_summary: '📊',
    punctuality_success: '✅',
    late_warning: '⏰'
  }
  return icons[type] || '📬'
}

const formatTime = (timestamp: any) => {
  if (!timestamp) return ''
  
  const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  
  if (minutes < 1) return 'Gerade eben'
  if (minutes < 60) return `vor ${minutes} Min`
  if (hours < 24) return `vor ${hours} Std`
  if (days < 7) return `vor ${days} Tag(en)`
  
  return date.toLocaleDateString('de-DE')
}

onMounted(() => {
  loadNotifications()
})

// Watch for userId changes
watch(() => props.userId, () => {
  if (props.userId) {
    loadNotifications()
  }
})
</script>

<style scoped>
.notifications-panel {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  overflow: hidden;
}

.notifications-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: #f8f9fa;
  border-bottom: 1px solid #e0e0e0;
}

.notifications-header h3 {
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.btn-mark-all {
  padding: 8px 15px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.btn-refresh {
  padding: 8px 12px;
  background: #28a745;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.notifications-filter {
  display: flex;
  gap: 10px;
  padding: 15px 20px;
  background: #f8f9fa;
  border-bottom: 1px solid #e0e0e0;
}

.filter-btn {
  padding: 8px 16px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-btn.active {
  background: #007bff;
  color: white;
  border-color: #007bff;
}

.loading-state, .empty-state {
  padding: 60px 20px;
  text-align: center;
  color: #666;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 15px;
}

.notifications-list {
  max-height: 600px;
  overflow-y: auto;
}

.notification-item {
  display: flex;
  gap: 15px;
  padding: 15px 20px;
  border-bottom: 1px solid #e0e0e0;
  cursor: pointer;
  transition: background 0.2s;
}

.notification-item:hover {
  background: #f8f9fa;
}

.notification-item.unread {
  background: #e7f3ff;
  border-left: 4px solid #007bff;
}

.notification-item.important {
  border-left: 4px solid #dc3545;
}

.notification-icon {
  font-size: 32px;
  flex-shrink: 0;
}

.notification-content {
  flex: 1;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
}

.notification-header h4 {
  margin: 0;
  font-size: 16px;
}

.notification-time {
  font-size: 12px;
  color: #666;
}

.notification-message {
  margin: 5px 0;
  color: #333;
}

.notification-data {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.data-badge {
  padding: 4px 8px;
  background: white;
  border-radius: 4px;
  font-size: 12px;
  border: 1px solid #ddd;
}

.notification-actions {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.btn-mark-read, .btn-delete {
  padding: 6px 10px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.2s;
}

.btn-mark-read:hover {
  background: #28a745;
  color: white;
  border-radius: 4px;
}

.btn-delete:hover {
  background: #dc3545;
  border-radius: 4px;
}

.notifications-footer {
  padding: 15px 20px;
  background: #f8f9fa;
  border-top: 1px solid #e0e0e0;
  text-align: center;
}

.btn-settings {
  padding: 10px 20px;
  background: #6c757d;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
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
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-content h3 {
  margin: 0 0 20px 0;
}

.settings-form {
  display: grid;
  gap: 20px;
}

.setting-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.setting-group h4 {
  margin: 0;
  color: #333;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.checkbox-label input {
  cursor: pointer;
}

.time-inputs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  margin-top: 10px;
}

.time-inputs label {
  display: block;
  margin-bottom: 5px;
  font-size: 14px;
}

.time-inputs input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.setting-group select {
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.modal-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.btn-save {
  flex: 1;
  padding: 12px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.btn-cancel {
  flex: 1;
  padding: 12px;
  background: #6c757d;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.spinner {
  width: 40px;
  height: 40px;
  margin: 0 auto 20px auto;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
