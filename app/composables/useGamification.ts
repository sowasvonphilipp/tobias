import { 
  collection, 
  doc,
  getDoc,
  setDoc,
  updateDoc,
  addDoc,
  query,
  where,
  getDocs,
  Timestamp,
  increment
} from 'firebase/firestore'

export const useGamification = () => {
  const { $db } = useNuxtApp()

  // ============ LEVEL & XP SYSTEM ============
  
  const getLevels = () => [
    { level: 1, xpRequired: 0, title: 'Anfänger 🌱', rewards: ['Bronze Badge'] },
    { level: 2, xpRequired: 100, title: 'Lernender 📚', rewards: ['5€ Bonus'] },
    { level: 3, xpRequired: 250, title: 'Fortgeschritten 🎯', rewards: ['Custom Avatar'] },
    { level: 4, xpRequired: 500, title: 'Profi 💪', rewards: ['10€ Bonus', 'Gold Badge'] },
    { level: 5, xpRequired: 1000, title: 'Experte 🏆', rewards: ['Premium Feature'] },
    { level: 6, xpRequired: 2000, title: 'Meister ⭐', rewards: ['20€ Bonus'] },
    { level: 7, xpRequired: 3500, title: 'Champion 👑', rewards: ['VIP Status'] },
    { level: 8, xpRequired: 5000, title: 'Legende 🔥', rewards: ['50€ Bonus'] },
    { level: 9, xpRequired: 7500, title: 'Titan 💎', rewards: ['Custom Rewards'] },
    { level: 10, xpRequired: 10000, title: 'Gottheit ⚡', rewards: ['100€ Bonus', 'Hall of Fame'] }
  ]

  const calculateLevel = (xp: number) => {
    const levels = getLevels()
    let currentLevel = 1
    
    for (let i = levels.length - 1; i >= 0; i--) {
      const level = levels[i]
      if (level && xp >= level.xpRequired) {
        currentLevel = level.level
        break
      }
    }
    
    return currentLevel
  }

  const getXPForNextLevel = (currentXP: number) => {
    const levels = getLevels()
    const currentLevel = calculateLevel(currentXP)
    const nextLevelData = levels.find(l => l.level === currentLevel + 1)
    
    if (!nextLevelData) return null
    
    return {
      current: currentXP,
      required: nextLevelData.xpRequired,
      remaining: nextLevelData.xpRequired - currentXP,
      progress: ((currentXP / nextLevelData.xpRequired) * 100).toFixed(1)
    }
  }

  // Add XP
  const addXP = async (userId: string, amount: number, reason: string) => {
    try {
      const userRef = doc($db, 'userGamification', userId)
      const userDoc = await getDoc(userRef)
      
      let currentXP = 0
      let oldLevel = 1
      
      if (userDoc.exists()) {
        currentXP = userDoc.data().totalXP || 0
        oldLevel = userDoc.data().level || 1
        
        await updateDoc(userRef, {
          totalXP: increment(amount),
          lastXPGain: Timestamp.now(),
          lastXPReason: reason
        })
      } else {
        await setDoc(userRef, {
          userId,
          totalXP: amount,
          level: 1,
          badges: [],
          achievements: [],
          lastXPGain: Timestamp.now(),
          lastXPReason: reason,
          createdAt: Timestamp.now()
        })
      }
      
      const newXP = currentXP + amount
      const newLevel = calculateLevel(newXP)
      
      // Level up!
      if (newLevel > oldLevel) {
        await updateDoc(userRef, { level: newLevel })
        await logLevelUp(userId, oldLevel, newLevel)
      }
      
      // Log XP gain
      await addDoc(collection($db, 'xpHistory'), {
        userId,
        amount,
        reason,
        timestamp: Timestamp.now(),
        oldXP: currentXP,
        newXP
      })
      
      return { newXP, newLevel, leveledUp: newLevel > oldLevel }
    } catch (error) {
      console.error('Error adding XP:', error)
      throw error
    }
  }

  // Get user gamification data
  const getUserGamification = async (userId: string) => {
    try {
      const userRef = doc($db, 'userGamification', userId)
      const userDoc = await getDoc(userRef)
      
      if (userDoc.exists()) {
        return userDoc.data()
      }
      
      return {
        userId,
        totalXP: 0,
        level: 1,
        badges: [],
        achievements: [],
        createdAt: Timestamp.now()
      }
    } catch (error) {
      console.error('Error getting gamification data:', error)
      throw error
    }
  }

  // Log level up
  const logLevelUp = async (userId: string, oldLevel: number, newLevel: number) => {
    try {
      await addDoc(collection($db, 'levelUps'), {
        userId,
        oldLevel,
        newLevel,
        timestamp: Timestamp.now()
      })
    } catch (error) {
      console.error('Error logging level up:', error)
    }
  }

  // ============ BADGES SYSTEM ============
  
  const getAllBadges = () => [
    { id: 'first_stamp', name: 'Erster Stempel', emoji: '🎯', description: 'Ersten Eintrag erhalten' },
    { id: 'streak_3', name: '3er Streak', emoji: '🔥', description: '3x pünktlich in Folge' },
    { id: 'streak_5', name: '5er Streak', emoji: '⚡', description: '5x pünktlich in Folge' },
    { id: 'streak_10', name: '10er Streak', emoji: '💫', description: '10x pünktlich in Folge' },
    { id: 'streak_20', name: '20er Streak', emoji: '🌟', description: '20x pünktlich in Folge' },
    { id: 'perfect_week', name: 'Perfekte Woche', emoji: '📅', description: 'Ganze Woche pünktlich' },
    { id: 'perfect_month', name: 'Perfekter Monat', emoji: '🗓️', description: 'Ganzer Monat pünktlich' },
    { id: 'early_bird', name: 'Frühaufsteher', emoji: '🌅', description: '10x vor 7 Uhr' },
    { id: 'night_owl', name: 'Nachteule', emoji: '🦉', description: '10x nach 22 Uhr' },
    { id: 'weekend_warrior', name: 'Wochenend-Krieger', emoji: '⚔️', description: 'Auch am Wochenende aktiv' },
    { id: 'century', name: 'Jahrhundert', emoji: '💯', description: '100 Einträge gesamt' },
    { id: 'half_millennium', name: 'Halbes Jahrtausend', emoji: '🏛️', description: '500 Einträge gesamt' },
    { id: 'perfectionist', name: 'Perfektionist', emoji: '✨', description: '95% Pünktlichkeitsrate' },
    { id: 'dedicated', name: 'Engagiert', emoji: '🎖️', description: '30 Tage in Folge aktiv' },
    { id: 'goal_crusher', name: 'Ziel-Zermalmer', emoji: '🎯', description: '10 Ziele erreicht' },
    { id: 'reward_hunter', name: 'Belohnungs-Jäger', emoji: '🏹', description: '5 Belohnungen erhalten' },
    { id: 'social_butterfly', name: 'Sozialer Schmetterling', emoji: '🦋', description: 'Mit anderen interagiert' },
    { id: 'speedster', name: 'Geschwindigkeits-Dämon', emoji: '⚡', description: 'Unter 1 Minute gestempelt' },
    { id: 'comeback_kid', name: 'Comeback-Kind', emoji: '🔄', description: 'Nach Pause zurückgekommen' },
    { id: 'legend', name: 'Legende', emoji: '👑', description: 'Level 10 erreicht' }
  ]

  // Unlock badge
  const unlockBadge = async (userId: string, badgeId: string) => {
    try {
      const userRef = doc($db, 'userGamification', userId)
      const userDoc = await getDoc(userRef)
      
      if (userDoc.exists()) {
        const badges = userDoc.data().badges || []
        if (!badges.includes(badgeId)) {
          badges.push(badgeId)
          await updateDoc(userRef, { badges })
          
          // Add XP for badge
          await addXP(userId, 50, `Badge unlocked: ${badgeId}`)
          
          // Log badge unlock
          await addDoc(collection($db, 'badgeUnlocks'), {
            userId,
            badgeId,
            timestamp: Timestamp.now()
          })
          
          return true
        }
      }
      return false
    } catch (error) {
      console.error('Error unlocking badge:', error)
      throw error
    }
  }

  // Check and award badges
  const checkAndAwardBadges = async (userId: string, stats: any) => {
    const badgesToCheck: Array<{id: string, condition: boolean}> = [
      { id: 'first_stamp', condition: stats.totalStamps >= 1 },
      { id: 'streak_3', condition: stats.currentStreak >= 3 },
      { id: 'streak_5', condition: stats.currentStreak >= 5 },
      { id: 'streak_10', condition: stats.currentStreak >= 10 },
      { id: 'streak_20', condition: stats.currentStreak >= 20 },
      { id: 'century', condition: stats.totalStamps >= 100 },
      { id: 'half_millennium', condition: stats.totalStamps >= 500 },
      { id: 'perfectionist', condition: stats.punctualityRate >= 95 }
    ]
    
    for (const badge of badgesToCheck) {
      if (badge.condition) {
        await unlockBadge(userId, badge.id)
      }
    }
  }

  // ============ ACHIEVEMENTS SYSTEM ============
  
  const getAllAchievements = () => [
    { id: 'first_steps', name: 'Erste Schritte', description: 'Erstes Login', tier: 'bronze', xp: 10 },
    { id: 'getting_started', name: 'Am Start', description: '5 Einträge', tier: 'bronze', xp: 25 },
    { id: 'regular', name: 'Stammgast', description: '10 Einträge', tier: 'silver', xp: 50 },
    { id: 'frequent', name: 'Häufiger Nutzer', description: '25 Einträge', tier: 'silver', xp: 100 },
    { id: 'veteran', name: 'Veteran', description: '50 Einträge', tier: 'gold', xp: 200 },
    { id: 'master', name: 'Meister', description: '100 Einträge', tier: 'platinum', xp: 500 },
    { id: 'punctual_3', name: 'Pünktlich (3)', description: '3er Streak', tier: 'bronze', xp: 30 },
    { id: 'punctual_7', name: 'Pünktlich (7)', description: '7er Streak', tier: 'silver', xp: 75 },
    { id: 'punctual_14', name: 'Pünktlich (14)', description: '14er Streak', tier: 'gold', xp: 150 },
    { id: 'punctual_30', name: 'Pünktlich (30)', description: '30er Streak', tier: 'platinum', xp: 300 },
    { id: 'goal_setter', name: 'Ziel-Setzer', description: 'Erstes Ziel erstellt', tier: 'bronze', xp: 20 },
    { id: 'goal_achiever', name: 'Ziel-Erreicher', description: '5 Ziele erreicht', tier: 'gold', xp: 150 },
    { id: 'reward_collector', name: 'Belohnungs-Sammler', description: '3 Belohnungen', tier: 'silver', xp: 100 },
    { id: 'perfect_week', name: 'Perfekte Woche', description: '7 Tage pünktlich', tier: 'gold', xp: 200 },
    { id: 'perfect_month', name: 'Perfekter Monat', description: '30 Tage pünktlich', tier: 'platinum', xp: 500 },
    { id: 'early_riser', name: 'Frühaufsteher', description: '10x vor 8 Uhr', tier: 'silver', xp: 75 },
    { id: 'consistent', name: 'Beständig', description: '30 Tage in Folge', tier: 'platinum', xp: 400 },
    { id: 'improver', name: 'Verbesserer', description: 'Rate um 20% erhöht', tier: 'gold', xp: 150 },
    { id: 'explorer', name: 'Entdecker', description: 'Alle Features genutzt', tier: 'platinum', xp: 300 },
    { id: 'social', name: 'Sozial', description: 'Anderen geholfen', tier: 'silver', xp: 100 }
  ]

  // Unlock achievement
  const unlockAchievement = async (userId: string, achievementId: string) => {
    try {
      const achievement = getAllAchievements().find(a => a.id === achievementId)
      if (!achievement) return false
      
      const userRef = doc($db, 'userGamification', userId)
      const userDoc = await getDoc(userRef)
      
      if (userDoc.exists()) {
        const achievements = userDoc.data().achievements || []
        if (!achievements.includes(achievementId)) {
          achievements.push(achievementId)
          await updateDoc(userRef, { achievements })
          
          // Add XP
          await addXP(userId, achievement.xp, `Achievement: ${achievement.name}`)
          
          // Log achievement
          await addDoc(collection($db, 'achievementUnlocks'), {
            userId,
            achievementId,
            timestamp: Timestamp.now()
          })
          
          return true
        }
      }
      return false
    } catch (error) {
      console.error('Error unlocking achievement:', error)
      throw error
    }
  }

  // ============ LEADERBOARD ============
  
  const getLeaderboard = async (type: 'xp' | 'streak' | 'punctuality' = 'xp', limitCount: number = 10) => {
    try {
      let leaderboardQuery
      
      if (type === 'xp') {
        leaderboardQuery = query(collection($db, 'userGamification'))
      } else if (type === 'streak') {
        leaderboardQuery = query(collection($db, 'userStats'))
      } else {
        leaderboardQuery = query(collection($db, 'userStats'))
      }
      
      const querySnapshot = await getDocs(leaderboardQuery)
      const users = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      
      // Sort based on type
      let sorted
      if (type === 'xp') {
        sorted = users.sort((a: any, b: any) => (b.totalXP || 0) - (a.totalXP || 0))
      } else if (type === 'streak') {
        sorted = users.sort((a: any, b: any) => (b.longestStreak || 0) - (a.longestStreak || 0))
      } else {
        sorted = users.sort((a: any, b: any) => {
          const aRate = a.totalStamps > 0 ? (a.onTimeCount / a.totalStamps) * 100 : 0
          const bRate = b.totalStamps > 0 ? (b.onTimeCount / b.totalStamps) * 100 : 0
          return bRate - aRate
        })
      }
      
      return sorted.slice(0, limitCount)
    } catch (error) {
      console.error('Error getting leaderboard:', error)
      return []
    }
  }

  // Get user rank
  const getUserRank = async (userId: string, type: 'xp' | 'streak' | 'punctuality' = 'xp') => {
    try {
      const leaderboard = await getLeaderboard(type, 1000)
      const rank = leaderboard.findIndex((u: any) => u.id === userId || u.userId === userId)
      return rank >= 0 ? rank + 1 : null
    } catch (error) {
      console.error('Error getting user rank:', error)
      return null
    }
  }

  // ============ DAILY CHALLENGES ============
  
  const getDailyChallenges = () => [
    { id: 'early_bird', name: 'Frühaufsteher', description: 'Stempel vor 8 Uhr', xp: 50, icon: '🌅' },
    { id: 'on_time_today', name: 'Pünktlich heute', description: 'Heute pünktlich sein', xp: 30, icon: '✅' },
    { id: 'perfect_day', name: 'Perfekter Tag', description: 'Alle Aufgaben erledigen', xp: 100, icon: '⭐' },
    { id: 'social_day', name: 'Sozialer Tag', description: 'Mit anderen interagieren', xp: 40, icon: '👥' },
    { id: 'goal_progress', name: 'Ziel-Fortschritt', description: 'An einem Ziel arbeiten', xp: 50, icon: '🎯' }
  ]

  const completeDailyChallenge = async (userId: string, challengeId: string) => {
    try {
      const today = new Date().toISOString().split('T')[0]
      
      await addDoc(collection($db, 'challengeCompletions'), {
        userId,
        challengeId,
        date: today,
        timestamp: Timestamp.now()
      })
      
      const challenge = getDailyChallenges().find(c => c.id === challengeId)
      if (challenge) {
        await addXP(userId, challenge.xp, `Daily Challenge: ${challenge.name}`)
      }
      
      return true
    } catch (error) {
      console.error('Error completing challenge:', error)
      throw error
    }
  }

  // Get completed challenges for today
  const getTodayCompletedChallenges = async (userId: string) => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const challengesQuery = query(
        collection($db, 'challengeCompletions'),
        where('userId', '==', userId),
        where('date', '==', today)
      )
      
      const querySnapshot = await getDocs(challengesQuery)
      return querySnapshot.docs.map(doc => doc.data().challengeId)
    } catch (error) {
      console.error('Error getting completed challenges:', error)
      return []
    }
  }

  // ============ STREAKS & MILESTONES ============
  
  const getMilestones = () => [
    { id: 'first', count: 1, name: 'Erster Schritt', reward: 10 },
    { id: 'bronze', count: 10, name: 'Bronze', reward: 50 },
    { id: 'silver', count: 25, name: 'Silber', reward: 100 },
    { id: 'gold', count: 50, name: 'Gold', reward: 250 },
    { id: 'platinum', count: 100, name: 'Platin', reward: 500 },
    { id: 'diamond', count: 250, name: 'Diamant', reward: 1000 },
    { id: 'master', count: 500, name: 'Meister', reward: 2000 },
    { id: 'legend', count: 1000, name: 'Legende', reward: 5000 }
  ]

  const checkMilestones = async (userId: string, totalStamps: number) => {
    const milestones = getMilestones()
    
    for (const milestone of milestones) {
      if (totalStamps >= milestone.count) {
        const reached = await hasMilestone(userId, milestone.id)
        if (!reached) {
          await reachMilestone(userId, milestone.id, milestone.reward)
        }
      }
    }
  }

  const hasMilestone = async (userId: string, milestoneId: string) => {
    try {
      const milestonesQuery = query(
        collection($db, 'milestones'),
        where('userId', '==', userId),
        where('milestoneId', '==', milestoneId)
      )
      
      const querySnapshot = await getDocs(milestonesQuery)
      return !querySnapshot.empty
    } catch (error) {
      console.error('Error checking milestone:', error)
      return false
    }
  }

  const reachMilestone = async (userId: string, milestoneId: string, xpReward: number) => {
    try {
      await addDoc(collection($db, 'milestones'), {
        userId,
        milestoneId,
        timestamp: Timestamp.now()
      })
      
      await addXP(userId, xpReward, `Milestone: ${milestoneId}`)
      return true
    } catch (error) {
      console.error('Error reaching milestone:', error)
      throw error
    }
  }

  return {
    // Level & XP
    getLevels,
    calculateLevel,
    getXPForNextLevel,
    addXP,
    getUserGamification,
    
    // Badges
    getAllBadges,
    unlockBadge,
    checkAndAwardBadges,
    
    // Achievements
    getAllAchievements,
    unlockAchievement,
    
    // Leaderboard
    getLeaderboard,
    getUserRank,
    
    // Daily Challenges
    getDailyChallenges,
    completeDailyChallenge,
    getTodayCompletedChallenges,
    
    // Milestones
    getMilestones,
    checkMilestones,
    hasMilestone,
    reachMilestone
  }
}
