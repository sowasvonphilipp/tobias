import { 
  collection, 
  doc,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  getDocs,
  Timestamp
} from 'firebase/firestore'

export const useConfig = () => {
  const { $db } = useNuxtApp()

  // ============ SYSTEM CONFIG ============
  
  // Get system configuration
  const getSystemConfig = async () => {
    try {
      const configDoc = await getDoc(doc($db, 'systemConfig', 'general'))
      
      if (!configDoc.exists()) {
        return getDefaultConfig()
      }
      
      return configDoc.data()
    } catch (error) {
      console.error('Error getting system config:', error)
      return getDefaultConfig()
    }
  }

  // Update system configuration
  const updateSystemConfig = async (config: any) => {
    try {
      const configRef = doc($db, 'systemConfig', 'general')
      await setDoc(configRef, {
        ...config,
        updatedAt: Timestamp.now()
      }, { merge: true })
      
      return true
    } catch (error) {
      console.error('Error updating system config:', error)
      throw error
    }
  }

  // Get default configuration
  const getDefaultConfig = () => ({
    // App Settings
    appName: 'Stempel-Tracker',
    appVersion: '2.0.0',
    maintenanceMode: false,
    
    // Stamp Settings
    requiredDays: ['tuesday', 'thursday'],
    stampWindow: {
      start: '00:00',
      end: '23:59'
    },
    gracePeroid: 5, // minutes
    
    // Streak Settings
    streakProtectionEnabled: true,
    maxStreakProtections: 3,
    streakResetTime: '00:00',
    
    // Reward Settings
    rewardsEnabled: true,
    customRewardsEnabled: true,
    maxCustomRewards: 10,
    
    // Gamification Settings
    gamificationEnabled: true,
    xpMultiplier: 1.0,
    levelCap: 10,
    dailyChallengesEnabled: true,
    
    // Social Settings
    socialFeaturesEnabled: true,
    friendsEnabled: true,
    groupsEnabled: true,
    challengesEnabled: true,
    
    // Notification Settings
    notificationsEnabled: true,
    emailNotificationsEnabled: true,
    pushNotificationsEnabled: false,
    
    // Analytics Settings
    analyticsEnabled: true,
    dataRetentionDays: 365,
    
    // Security Settings
    requireEmailVerification: false,
    sessionTimeout: 86400, // 24 hours in seconds
    maxLoginAttempts: 5,
    
    // Rate Limiting
    maxStampsPerDay: 10,
    maxAPICallsPerMinute: 60,
    
    // Feature Flags
    features: {
      calendar: true,
      heatmap: true,
      leaderboards: true,
      exports: true,
      imports: true,
      automation: true,
      advancedAnalytics: true
    }
  })

  // ============ REWARD CONFIG ============
  
  // Get reward tiers from DB
  const getRewardTiers = async () => {
    try {
      const tiersDoc = await getDoc(doc($db, 'systemConfig', 'rewardTiers'))
      
      if (!tiersDoc.exists()) {
        return getDefaultRewardTiers()
      }
      
      return tiersDoc.data().tiers || getDefaultRewardTiers()
    } catch (error) {
      console.error('Error getting reward tiers:', error)
      return getDefaultRewardTiers()
    }
  }

  // Update reward tiers
  const updateRewardTiers = async (tiers: any[]) => {
    try {
      const tiersRef = doc($db, 'systemConfig', 'rewardTiers')
      await setDoc(tiersRef, {
        tiers,
        updatedAt: Timestamp.now()
      })
      
      return true
    } catch (error) {
      console.error('Error updating reward tiers:', error)
      throw error
    }
  }

  // Get default reward tiers
  const getDefaultRewardTiers = () => [
    { id: 'pizza', name: 'Pizza 🍕', requiredStamps: 3, icon: '🍕' },
    { id: 'steam', name: 'Steam €10 💰', requiredStamps: 5, icon: '💰' },
    { id: 'crunchyroll', name: 'Crunchyroll 🎌', requiredStamps: 8, icon: '🎌' },
    { id: 'netflix', name: 'Netflix 📺', requiredStamps: 12, icon: '📺' },
    { id: 'custom', name: 'Custom 🎁', requiredStamps: 20, icon: '🎁' },
    { id: 'legendary', name: 'Legendary 👑', requiredStamps: 30, icon: '👑' }
  ]

  // ============ XP & LEVEL CONFIG ============
  
  // Get XP configuration
  const getXPConfig = async () => {
    try {
      const xpDoc = await getDoc(doc($db, 'systemConfig', 'xp'))
      
      if (!xpDoc.exists()) {
        return getDefaultXPConfig()
      }
      
      return xpDoc.data()
    } catch (error) {
      console.error('Error getting XP config:', error)
      return getDefaultXPConfig()
    }
  }

  // Update XP configuration
  const updateXPConfig = async (config: any) => {
    try {
      const xpRef = doc($db, 'systemConfig', 'xp')
      await setDoc(xpRef, {
        ...config,
        updatedAt: Timestamp.now()
      })
      
      return true
    } catch (error) {
      console.error('Error updating XP config:', error)
      throw error
    }
  }

  // Get default XP config
  const getDefaultXPConfig = () => ({
    onTimeStamp: 50,
    lateStamp: 20,
    veryLateStamp: 5,
    perfectWeek: 200,
    perfectMonth: 1000,
    streakMilestone: 100, // per milestone
    achievementBonus: 150,
    dailyChallengeComplete: 75,
    levelUpBonus: 500
  })

  // ============ BADGE CONFIG ============
  
  // Get badge configuration
  const getBadgeConfig = async () => {
    try {
      const badgesDoc = await getDoc(doc($db, 'systemConfig', 'badges'))
      
      if (!badgesDoc.exists()) {
        return getDefaultBadges()
      }
      
      return badgesDoc.data().badges || getDefaultBadges()
    } catch (error) {
      console.error('Error getting badge config:', error)
      return getDefaultBadges()
    }
  }

  // Update badge configuration
  const updateBadgeConfig = async (badges: any[]) => {
    try {
      const badgesRef = doc($db, 'systemConfig', 'badges')
      await setDoc(badgesRef, {
        badges,
        updatedAt: Timestamp.now()
      })
      
      return true
    } catch (error) {
      console.error('Error updating badge config:', error)
      throw error
    }
  }

  // Get default badges
  const getDefaultBadges = () => [
    { id: 'first_stamp', name: 'Erster Stempel', icon: '🎯', requirement: '1 Stempel' },
    { id: 'streak_3', name: '3er Streak', icon: '🔥', requirement: '3 Tage Streak' },
    { id: 'streak_5', name: '5er Streak', icon: '🔥🔥', requirement: '5 Tage Streak' },
    { id: 'streak_10', name: '10er Streak', icon: '🔥🔥🔥', requirement: '10 Tage Streak' },
    { id: 'perfect_week', name: 'Perfekte Woche', icon: '⭐', requirement: 'Alle Stempel einer Woche' },
    { id: 'early_bird', name: 'Frühaufsteher', icon: '🌅', requirement: '10 Stempel vor 9 Uhr' },
    { id: 'night_owl', name: 'Nachteule', icon: '🦉', requirement: '10 Stempel nach 20 Uhr' }
  ]

  // ============ TEXT & MESSAGES CONFIG ============
  
  // Get text configuration (for customizable messages)
  const getTextConfig = async () => {
    try {
      const textDoc = await getDoc(doc($db, 'systemConfig', 'texts'))
      
      if (!textDoc.exists()) {
        return getDefaultTexts()
      }
      
      return textDoc.data()
    } catch (error) {
      console.error('Error getting text config:', error)
      return getDefaultTexts()
    }
  }

  // Update text configuration
  const updateTextConfig = async (texts: any) => {
    try {
      const textRef = doc($db, 'systemConfig', 'texts')
      await setDoc(textRef, {
        ...texts,
        updatedAt: Timestamp.now()
      })
      
      return true
    } catch (error) {
      console.error('Error updating text config:', error)
      throw error
    }
  }

  // Get default texts
  const getDefaultTexts = () => ({
    welcomeMessage: 'Willkommen bei Stempel-Tracker! 🎉',
    streakReminderMessage: 'Vergiss nicht, heute deinen Stempel zu holen! 🔥',
    rewardAvailableMessage: 'Du hast eine neue Belohnung freigeschaltet! 🎁',
    levelUpMessage: 'Glückwunsch! Du bist Level {level} erreicht! ⬆️',
    achievementUnlockedMessage: 'Neuer Erfolg freigeschaltet: {achievement} ⭐',
    goalCompletedMessage: 'Ziel erreicht: {goal} 🎯',
    perfectWeekMessage: 'Perfekte Woche! Weiter so! ⭐',
    streakDangerMessage: 'Achtung! Dein Streak läuft heute ab! ⚠️'
  })

  // ============ AUTOMATION CONFIG ============
  
  // Get automation configuration
  const getAutomationConfig = async () => {
    try {
      const automationDoc = await getDoc(doc($db, 'systemConfig', 'automation'))
      
      if (!automationDoc.exists()) {
        return getDefaultAutomationConfig()
      }
      
      return automationDoc.data()
    } catch (error) {
      console.error('Error getting automation config:', error)
      return getDefaultAutomationConfig()
    }
  }

  // Update automation configuration
  const updateAutomationConfig = async (config: any) => {
    try {
      const automationRef = doc($db, 'systemConfig', 'automation')
      await setDoc(automationRef, {
        ...config,
        updatedAt: Timestamp.now()
      })
      
      return true
    } catch (error) {
      console.error('Error updating automation config:', error)
      throw error
    }
  }

  // Get default automation config
  const getDefaultAutomationConfig = () => ({
    autoStreakReminders: true,
    reminderTime: '20:00',
    autoRewardNotifications: true,
    autoGoalUpdates: true,
    autoWeeklySummary: true,
    weeklySummaryDay: 'sunday',
    autoStreakProtection: false,
    autoBackups: true,
    backupFrequency: 'daily'
  })

  // ============ ALL CONFIGS ============
  
  // Get all configurations
  const getAllConfigs = async () => {
    try {
      const [
        system,
        rewards,
        xp,
        badges,
        texts,
        automation,
        notifications
      ] = await Promise.all([
        getSystemConfig(),
        getRewardTiers(),
        getXPConfig(),
        getBadgeConfig(),
        getTextConfig(),
        getAutomationConfig(),
        getDoc(doc($db, 'systemConfig', 'notifications'))
      ])
      
      return {
        system,
        rewards,
        xp,
        badges,
        texts,
        automation,
        notifications: notifications.exists() ? notifications.data() : {}
      }
    } catch (error) {
      console.error('Error getting all configs:', error)
      return null
    }
  }

  // Reset to defaults
  const resetToDefaults = async () => {
    try {
      await Promise.all([
        updateSystemConfig(getDefaultConfig()),
        updateRewardTiers(getDefaultRewardTiers()),
        updateXPConfig(getDefaultXPConfig()),
        updateBadgeConfig(getDefaultBadges()),
        updateTextConfig(getDefaultTexts()),
        updateAutomationConfig(getDefaultAutomationConfig())
      ])
      
      return true
    } catch (error) {
      console.error('Error resetting to defaults:', error)
      throw error
    }
  }

  return {
    // System
    getSystemConfig,
    updateSystemConfig,
    
    // Rewards
    getRewardTiers,
    updateRewardTiers,
    
    // XP & Levels
    getXPConfig,
    updateXPConfig,
    
    // Badges
    getBadgeConfig,
    updateBadgeConfig,
    
    // Texts
    getTextConfig,
    updateTextConfig,
    
    // Automation
    getAutomationConfig,
    updateAutomationConfig,
    
    // All
    getAllConfigs,
    resetToDefaults,
    
    // Defaults
    getDefaultConfig,
    getDefaultRewardTiers,
    getDefaultXPConfig,
    getDefaultBadges,
    getDefaultTexts,
    getDefaultAutomationConfig
  }
}
