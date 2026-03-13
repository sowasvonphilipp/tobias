import { 
  collection, 
  doc,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  Timestamp
} from 'firebase/firestore'

export const useNotifications = () => {
  const { $db } = useNuxtApp()

  // ============ USER NOTIFICATIONS ============
  
  // Get user notifications
  const getUserNotifications = async (userId: string, unreadOnly: boolean = false) => {
    try {
      let notificationsQuery = query(
        collection($db, 'notifications'),
        where('userId', '==', userId)
      )
      
      const querySnapshot = await getDocs(notificationsQuery)
      let notifications = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      
      // Filter unread if needed
      if (unreadOnly) {
        notifications = notifications.filter((n: any) => !n.read)
      }
      
      // Sort by timestamp (newest first)
      notifications.sort((a: any, b: any) => {
        const aTime = a.createdAt?.seconds || 0
        const bTime = b.createdAt?.seconds || 0
        return bTime - aTime
      })
      
      return notifications
    } catch (error) {
      console.error('Error getting notifications:', error)
      return []
    }
  }

  // Mark notification as read
  const markNotificationRead = async (notificationId: string) => {
    try {
      const notificationRef = doc($db, 'notifications', notificationId)
      await updateDoc(notificationRef, {
        read: true,
        readAt: Timestamp.now()
      })
      return true
    } catch (error) {
      console.error('Error marking notification as read:', error)
      throw error
    }
  }

  // Mark all notifications as read
  const markAllNotificationsRead = async (userId: string) => {
    try {
      const notifications = await getUserNotifications(userId, true)
      const promises = notifications.map(n => markNotificationRead(n.id))
      await Promise.all(promises)
      return true
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
      throw error
    }
  }

  // Delete notification
  const deleteNotification = async (notificationId: string) => {
    try {
      await deleteDoc(doc($db, 'notifications', notificationId))
      return true
    } catch (error) {
      console.error('Error deleting notification:', error)
      throw error
    }
  }

  // ============ NOTIFICATION TEMPLATES ============
  
  // Get notification templates from DB
  const getNotificationTemplates = async () => {
    try {
      const templatesQuery = query(collection($db, 'notificationTemplates'))
      const querySnapshot = await getDocs(templatesQuery)
      
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    } catch (error) {
      console.error('Error getting templates:', error)
      return []
    }
  }

  // Create notification template
  const createNotificationTemplate = async (templateData: any) => {
    try {
      const template = {
        ...templateData,
        createdAt: Timestamp.now()
      }
      
      const docRef = await addDoc(collection($db, 'notificationTemplates'), template)
      return { id: docRef.id, ...template }
    } catch (error) {
      console.error('Error creating template:', error)
      throw error
    }
  }

  // Update notification template
  const updateNotificationTemplate = async (templateId: string, updates: any) => {
    try {
      const templateRef = doc($db, 'notificationTemplates', templateId)
      await updateDoc(templateRef, {
        ...updates,
        updatedAt: Timestamp.now()
      })
      return true
    } catch (error) {
      console.error('Error updating template:', error)
      throw error
    }
  }

  // Delete notification template
  const deleteNotificationTemplate = async (templateId: string) => {
    try {
      await deleteDoc(doc($db, 'notificationTemplates', templateId))
      return true
    } catch (error) {
      console.error('Error deleting template:', error)
      throw error
    }
  }

  // ============ NOTIFICATION SETTINGS ============
  
  // Get user notification settings
  const getUserNotificationSettings = async (userId: string) => {
    try {
      const settingsDoc = await getDoc(doc($db, 'notificationSettings', userId))
      
      if (!settingsDoc.exists()) {
        // Return default settings
        return {
          email: true,
          push: true,
          sms: false,
          inApp: true,
          frequency: 'realtime',
          quiet_hours: { enabled: false, start: '22:00', end: '08:00' },
          categories: {
            streak_reminders: true,
            goal_updates: true,
            rewards: true,
            social: true,
            achievements: true,
            system: true
          }
        }
      }
      
      return settingsDoc.data()
    } catch (error) {
      console.error('Error getting notification settings:', error)
      return null
    }
  }

  // Update user notification settings
  const updateUserNotificationSettings = async (userId: string, settings: any) => {
    try {
      const settingsRef = doc($db, 'notificationSettings', userId)
      await setDoc(settingsRef, {
        ...settings,
        updatedAt: Timestamp.now()
      }, { merge: true })
      
      return true
    } catch (error) {
      console.error('Error updating notification settings:', error)
      throw error
    }
  }

  // ============ NOTIFICATION TYPES ============
  
  const getNotificationTypes = () => [
    {
      id: 'streak_reminder',
      name: 'Streak-Erinnerung',
      description: 'Erinnert dich, deinen Streak aufrechtzuerhalten',
      icon: '🔥',
      defaultEnabled: true
    },
    {
      id: 'goal_achieved',
      name: 'Ziel erreicht',
      description: 'Benachrichtigung wenn ein Ziel erreicht wurde',
      icon: '🎯',
      defaultEnabled: true
    },
    {
      id: 'reward_available',
      name: 'Belohnung verfügbar',
      description: 'Neue Belohnung kann eingelöst werden',
      icon: '🎁',
      defaultEnabled: true
    },
    {
      id: 'achievement_unlocked',
      name: 'Erfolg freigeschaltet',
      description: 'Neuer Erfolg wurde freigeschaltet',
      icon: '⭐',
      defaultEnabled: true
    },
    {
      id: 'level_up',
      name: 'Level aufgestiegen',
      description: 'Neues Level erreicht',
      icon: '⬆️',
      defaultEnabled: true
    },
    {
      id: 'friend_request',
      name: 'Freundschaftsanfrage',
      description: 'Jemand möchte dein Freund werden',
      icon: '👥',
      defaultEnabled: true
    },
    {
      id: 'challenge_invite',
      name: 'Challenge-Einladung',
      description: 'Einladung zu einer Challenge',
      icon: '🏆',
      defaultEnabled: true
    },
    {
      id: 'system_announcement',
      name: 'System-Ankündigung',
      description: 'Wichtige System-Nachrichten',
      icon: '📢',
      defaultEnabled: true
    },
    {
      id: 'streak_danger',
      name: 'Streak in Gefahr',
      description: 'Dein Streak läuft bald ab',
      icon: '⚠️',
      defaultEnabled: true
    },
    {
      id: 'weekly_summary',
      name: 'Wöchentliche Zusammenfassung',
      description: 'Zusammenfassung deiner Aktivitäten',
      icon: '📊',
      defaultEnabled: false
    }
  ]

  // ============ SCHEDULED NOTIFICATIONS ============
  
  // Get scheduled notifications
  const getScheduledNotifications = async () => {
    try {
      const scheduledQuery = query(collection($db, 'scheduledNotifications'))
      const querySnapshot = await getDocs(scheduledQuery)
      
      return querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((n: any) => n.status === 'pending')
        .sort((a: any, b: any) => {
          const aTime = a.scheduledFor?.seconds || 0
          const bTime = b.scheduledFor?.seconds || 0
          return aTime - bTime
        })
    } catch (error) {
      console.error('Error getting scheduled notifications:', error)
      return []
    }
  }

  // Create scheduled notification
  const createScheduledNotification = async (notificationData: any, scheduledFor: Date) => {
    try {
      const scheduled = {
        ...notificationData,
        scheduledFor: Timestamp.fromDate(scheduledFor),
        status: 'pending',
        createdAt: Timestamp.now()
      }
      
      const docRef = await addDoc(collection($db, 'scheduledNotifications'), scheduled)
      return { id: docRef.id, ...scheduled }
    } catch (error) {
      console.error('Error creating scheduled notification:', error)
      throw error
    }
  }

  // Cancel scheduled notification
  const cancelScheduledNotification = async (notificationId: string) => {
    try {
      const notificationRef = doc($db, 'scheduledNotifications', notificationId)
      await updateDoc(notificationRef, {
        status: 'cancelled',
        cancelledAt: Timestamp.now()
      })
      return true
    } catch (error) {
      console.error('Error cancelling scheduled notification:', error)
      throw error
    }
  }

  // ============ NOTIFICATION PREFERENCES (DB-BASED) ============
  
  // Get system-wide notification preferences
  const getSystemNotificationPreferences = async () => {
    try {
      const prefsDoc = await getDoc(doc($db, 'systemConfig', 'notifications'))
      
      if (!prefsDoc.exists()) {
        // Return defaults
        return {
          streakReminderTime: '20:00',
          weeklySummaryDay: 'sunday',
          maxNotificationsPerDay: 10,
          enableEmailNotifications: true,
          enablePushNotifications: true,
          enableSMSNotifications: false,
          defaultLanguage: 'de'
        }
      }
      
      return prefsDoc.data()
    } catch (error) {
      console.error('Error getting system notification preferences:', error)
      return null
    }
  }

  // Update system notification preferences
  const updateSystemNotificationPreferences = async (preferences: any) => {
    try {
      const prefsRef = doc($db, 'systemConfig', 'notifications')
      await setDoc(prefsRef, {
        ...preferences,
        updatedAt: Timestamp.now()
      }, { merge: true })
      
      return true
    } catch (error) {
      console.error('Error updating system notification preferences:', error)
      throw error
    }
  }

  // ============ NOTIFICATION STATS ============
  
  // Get notification statistics
  const getNotificationStats = async (userId?: string) => {
    try {
      let notificationsQuery = query(collection($db, 'notifications'))
      
      if (userId) {
        notificationsQuery = query(
          collection($db, 'notifications'),
          where('userId', '==', userId)
        )
      }
      
      const querySnapshot = await getDocs(notificationsQuery)
      const notifications = querySnapshot.docs.map(doc => doc.data())
      
      const total = notifications.length
      const read = notifications.filter((n: any) => n.read).length
      const unread = total - read
      
      // Group by type
      const byType: any = {}
      notifications.forEach((n: any) => {
        byType[n.type] = (byType[n.type] || 0) + 1
      })
      
      return {
        total,
        read,
        unread,
        readRate: total > 0 ? (read / total * 100).toFixed(1) + '%' : '0%',
        byType
      }
    } catch (error) {
      console.error('Error getting notification stats:', error)
      return null
    }
  }

  return {
    // User Notifications
    getUserNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotification,
    
    // Templates
    getNotificationTemplates,
    createNotificationTemplate,
    updateNotificationTemplate,
    deleteNotificationTemplate,
    
    // Settings
    getUserNotificationSettings,
    updateUserNotificationSettings,
    
    // Types
    getNotificationTypes,
    
    // Scheduled
    getScheduledNotifications,
    createScheduledNotification,
    cancelScheduledNotification,
    
    // System Preferences
    getSystemNotificationPreferences,
    updateSystemNotificationPreferences,
    
    // Stats
    getNotificationStats
  }
}
