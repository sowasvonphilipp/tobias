import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  getDocs,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  Timestamp,
  limit,
  writeBatch,
  serverTimestamp
} from 'firebase/firestore'

export const useStempelCard = () => {
  const { $db } = useNuxtApp()

  // Check in - only admins can do this
  const stampIn = async (userId: string, status: 'on-time' | 'late', minutesLate: number = 0, note: string = '') => {
    try {
      // Get previous stats to check for streak reset
      const userStatsRef = doc($db, 'userStats', userId)
      const userStatsSnap = await getDoc(userStatsRef)
      const previousStreak = userStatsSnap.exists() ? userStatsSnap.data().currentStreak || 0 : 0
      
      const stampData = {
        userId,
        status,
        minutesLate,
        note,
        timestamp: Timestamp.now(),
        date: new Date().toISOString().split('T')[0],
        dayOfWeek: new Date().toLocaleDateString('de-DE', { weekday: 'long' })
      }

      await addDoc(collection($db, 'stamps'), stampData)
      
      // Update user stats
      const newStats = await updateUserStats(userId)
      
      // Create notifications based on status
      if (status === 'late' && previousStreak > 0) {
        // Streak was reset!
        await addDoc(collection($db, 'notifications'), {
          userId,
          type: 'streak_reset',
          title: '💔 Streak zurückgesetzt',
          message: `Deine ${previousStreak}er Streak wurde leider durch Zuspätkommen zurückgesetzt. Aber keine Sorge - beim nächsten Mal klappt es!`,
          read: false,
          important: true,
          createdAt: Timestamp.now(),
          data: {
            previousStreak,
            minutesLate
          }
        })
      } else if (status === 'on-time') {
        // Create positive notification for streak milestones
        const currentStreak = newStats.currentStreak
        if (currentStreak === 5 || currentStreak === 10 || currentStreak === 15 || currentStreak === 20) {
          await addDoc(collection($db, 'notifications'), {
            userId,
            type: 'streak_milestone',
            title: `🎉 ${currentStreak}er Streak erreicht!`,
            message: `Fantastisch! Du hast ${currentStreak} Mal in Folge pünktlich erscheinen können!`,
            read: false,
            important: true,
            createdAt: Timestamp.now(),
            data: {
              currentStreak
            }
          })
        }
      }
      
      return stampData
    } catch (error) {
      console.error('Error stamping in:', error)
      throw error
    }
  }

  // Get user statistics
  const getUserStats = async (userId: string) => {
    try {
      const userStatsRef = doc($db, 'userStats', userId)
      const userStatsDoc = await getDoc(userStatsRef)
      
      if (userStatsDoc.exists()) {
        return userStatsDoc.data()
      }
      
      // Create default stats if none exist
      const defaultStats = {
        totalStamps: 0,
        onTimeCount: 0,
        lateCount: 0,
        currentStreak: 0,
        longestStreak: 0,
        totalMinutesLate: 0,
        averageMinutesLate: 0,
        rewardsEarned: [],
        nextRewardProgress: 0,
        lastUpdated: Timestamp.now()
      }
      
      // Auto-create the document
      await setDoc(userStatsRef, defaultStats)
      console.log('Created default user stats for:', userId)
      
      return defaultStats
    } catch (error) {
      console.error('Error getting user stats:', error)
      throw error
    }
  }

  // Get recent stamps
  const getRecentStamps = async (userId: string, limitCount: number = 10) => {
    try {
      const stampsQuery = query(
        collection($db, 'stamps'),
        where('userId', '==', userId)
      )
      
      const querySnapshot = await getDocs(stampsQuery)
      const stamps = querySnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .sort((a: any, b: any) => {
          const aTime = a.timestamp?.seconds || 0
          const bTime = b.timestamp?.seconds || 0
          return bTime - aTime
        })
        .slice(0, limitCount)
      
      return stamps
    } catch (error) {
      console.error('Error getting recent stamps:', error)
      throw error
    }
  }

  // Get this week's stamps (Tuesday and Thursday only)
  const getThisWeekStamps = async (userId: string) => {
    try {
      const today = new Date()
      const startOfWeek = new Date(today)
      startOfWeek.setDate(today.getDate() - today.getDay() + 1) // Monday
      startOfWeek.setHours(0, 0, 0, 0)

      const stampsQuery = query(
        collection($db, 'stamps'),
        where('userId', '==', userId)
      )
      
      const querySnapshot = await getDocs(stampsQuery)
      const stamps = querySnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter((stamp: any) => {
          const stampDate = stamp.timestamp?.toDate ? stamp.timestamp.toDate() : new Date(stamp.timestamp)
          return stampDate >= startOfWeek
        })
        .sort((a: any, b: any) => {
          const aTime = a.timestamp?.seconds || 0
          const bTime = b.timestamp?.seconds || 0
          return bTime - aTime
        })
      
      return stamps
    } catch (error) {
      console.error('Error getting week stamps:', error)
      throw error
    }
  }

  // Update user statistics
  const updateUserStats = async (userId: string) => {
    try {
      const stamps: any[] = await getRecentStamps(userId, 1000)
      
      const onTimeCount = stamps.filter((s: any) => s.status === 'on-time').length
      const lateCount = stamps.filter((s: any) => s.status === 'late').length
      const totalMinutesLate = stamps.reduce((sum: number, s: any) => sum + (s.minutesLate || 0), 0)
      
      // Calculate current streak
      let currentStreak = 0
      const sortedStamps: any[] = [...stamps].sort((a: any, b: any) => b.timestamp.seconds - a.timestamp.seconds)
      for (const stamp of sortedStamps) {
        if ((stamp as any).status === 'on-time') {
          currentStreak++
        } else {
          break
        }
      }
      
      // Calculate longest streak
      let longestStreak = 0
      let tempStreak = 0
      for (const stamp of sortedStamps.reverse()) {
        if ((stamp as any).status === 'on-time') {
          tempStreak++
          longestStreak = Math.max(longestStreak, tempStreak)
        } else {
          tempStreak = 0
        }
      }

      // Check for rewards
      const rewardsEarned = []
      if (currentStreak >= 3) rewardsEarned.push('bronze')
      if (currentStreak >= 5) rewardsEarned.push('silver')
      if (currentStreak >= 10) rewardsEarned.push('gold')
      if (longestStreak >= 20) rewardsEarned.push('legend')

      const stats = {
        totalStamps: stamps.length,
        onTimeCount,
        lateCount,
        currentStreak,
        longestStreak,
        totalMinutesLate,
        averageMinutesLate: lateCount > 0 ? Math.round(totalMinutesLate / lateCount) : 0,
        rewardsEarned,
        nextRewardProgress: currentStreak,
        lastUpdated: Timestamp.now()
      }

      await setDoc(doc($db, 'userStats', userId), stats)
      
      return stats
    } catch (error) {
      console.error('Error updating user stats:', error)
      throw error
    }
  }

  // Check if user is admin
  const isUserAdmin = async (email: string) => {
    try {
      const adminRef = doc($db, 'admins', email)
      const adminDoc = await getDoc(adminRef)
      return adminDoc.exists()
    } catch (error) {
      console.error('Error checking admin status:', error)
      return false
    }
  }

  // Create admin user (auto-initialize)
  const createAdmin = async (email: string) => {
    try {
      const adminRef = doc($db, 'admins', email)
      const adminDoc = await getDoc(adminRef)
      
      if (!adminDoc.exists()) {
        await setDoc(adminRef, {
          email,
          createdAt: Timestamp.now(),
          isActive: true
        })
        console.log('Created admin user:', email)
        return true
      }
      return false
    } catch (error) {
      console.error('Error creating admin:', error)
      return false
    }
  }

  // Log audit action
  const logAuditAction = async (
    userId: string, 
    action: string, 
    description: string, 
    details: string, 
    adminEmail: string
  ) => {
    try {
      await addDoc(collection($db, 'auditLogs'), {
        userId,
        action,
        description,
        details,
        adminEmail,
        timestamp: Timestamp.now()
      })
    } catch (error) {
      console.error('Error logging audit action:', error)
    }
  }

  // Get audit logs
  const getAuditLogs = async (userId: string, limitCount: number = 10) => {
    try {
      const logsQuery = query(
        collection($db, 'auditLogs'),
        where('userId', '==', userId)
      )
      
      const querySnapshot = await getDocs(logsQuery)
      const logs = querySnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .sort((a: any, b: any) => {
          const aTime = a.timestamp?.seconds || 0
          const bTime = b.timestamp?.seconds || 0
          return bTime - aTime
        })
        .slice(0, limitCount)
      
      return logs
    } catch (error) {
      console.error('Error getting audit logs:', error)
      return []
    }
  }

  // Reset streak
  const resetStreak = async (userId: string, adminEmail: string, reason: string) => {
    try {
      const userStatsRef = doc($db, 'userStats', userId)
      const userStatsDoc = await getDoc(userStatsRef)
      
      if (userStatsDoc.exists()) {
        const currentData: any = userStatsDoc.data()
        await setDoc(userStatsRef, {
          ...currentData,
          currentStreak: 0,
          lastUpdated: Timestamp.now()
        })
        
        // Log the action
        await logAuditAction(
          userId,
          'streak_reset',
          'Streak zurückgesetzt',
          `Alter Streak: ${currentData.currentStreak}. Grund: ${reason}`,
          adminEmail
        )
        
        return true
      }
      return false
    } catch (error) {
      console.error('Error resetting streak:', error)
      throw error
    }
  }

  // Delete stamp by ID
  const deleteStamp = async (stampId: string, userId: string, adminEmail: string) => {
    try {
      await deleteDoc(doc($db, 'stamps', stampId))
      
      // Update user stats
      await updateUserStats(userId)
      
      // Log the action
      await logAuditAction(
        userId,
        'stamp_deleted',
        'Eintrag gelöscht',
        `Stamp ID: ${stampId}`,
        adminEmail
      )
      
      return true
    } catch (error) {
      console.error('Error deleting stamp:', error)
      throw error
    }
  }

  // ============ REWARD MANAGEMENT ============
  
  // Get all available rewards
  const getAllRewards = () => {
    return [
      { id: 1, name: 'Pizza Party', emoji: '🍕', requirement: 3, prize: 'Eine Pizza deiner Wahl!', category: 'food' },
      { id: 2, name: 'Steam Guthaben', emoji: '🎮', requirement: 5, prize: '20€ Steam Card', category: 'gaming' },
      { id: 3, name: 'Crunchyroll Abo', emoji: '📺', requirement: 8, prize: '1 Monat Premium', category: 'entertainment' },
      { id: 4, name: 'Netflix Premium', emoji: '🎬', requirement: 12, prize: '1 Monat Premium', category: 'entertainment' },
      { id: 5, name: 'Wunsch-Belohnung', emoji: '🎯', requirement: 20, prize: 'Wünsch dir was! (bis 50€)', category: 'special' },
      { id: 6, name: 'LEGENDÄR', emoji: '👑', requirement: 30, prize: 'PlayStation 5 / Xbox Series X', category: 'legendary' }
    ]
  }

  // Get unlocked rewards for user
  const getUnlockedRewards = async (userId: string) => {
    const stats = await getUserStats(userId)
    const allRewards = getAllRewards()
    return allRewards.filter(reward => stats.currentStreak >= reward.requirement)
  }

  // Claim reward
  const claimReward = async (userId: string, rewardId: number, adminEmail: string) => {
    try {
      const claimData = {
        userId,
        rewardId,
        claimedAt: Timestamp.now(),
        status: 'pending',
        adminEmail
      }
      
      await addDoc(collection($db, 'rewardClaims'), claimData)
      await logAuditAction(userId, 'reward_claimed', 'Belohnung beansprucht', `Reward ID: ${rewardId}`, adminEmail)
      return true
    } catch (error) {
      console.error('Error claiming reward:', error)
      throw error
    }
  }

  // Update reward status (approve/reject)
  const updateRewardStatus = async (claimId: string, status: 'approved' | 'rejected', adminEmail: string) => {
    try {
      const claimRef = doc($db, 'rewardClaims', claimId)
      await updateDoc(claimRef, {
        status,
        processedBy: adminEmail,
        processedAt: Timestamp.now()
      })
      return true
    } catch (error) {
      console.error('Error updating reward status:', error)
      throw error
    }
  }

  // Get reward claims
  const getRewardClaims = async (userId?: string) => {
    try {
      let claimsQuery;
      if (userId) {
        claimsQuery = query(
          collection($db, 'rewardClaims'),
          where('userId', '==', userId)
        )
      } else {
        claimsQuery = query(
          collection($db, 'rewardClaims')
        )
      }
      
      const querySnapshot = await getDocs(claimsQuery)
      return querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a: any, b: any) => {
          const aTime = a.claimedAt?.seconds || 0
          const bTime = b.claimedAt?.seconds || 0
          return bTime - aTime
        })
    } catch (error) {
      console.error('Error getting reward claims:', error)
      return []
    }
  }

  // ============ BATCH OPERATIONS ============
  
  // Batch add stamps
  const batchAddStamps = async (stamps: any[], adminEmail: string) => {
    try {
      const batch = writeBatch($db)
      const stampsCollection = collection($db, 'stamps')
      
      stamps.forEach(stamp => {
        const stampRef = doc(stampsCollection)
        batch.set(stampRef, {
          ...stamp,
          timestamp: stamp.timestamp || Timestamp.now()
        })
      })
      
      await batch.commit()
      
      // Update stats for all affected users
      const uniqueUsers = [...new Set(stamps.map(s => s.userId))]
      for (const userId of uniqueUsers) {
        await updateUserStats(userId)
      }
      
      await logAuditAction('batch', 'batch_add_stamps', 'Batch Stempel hinzugefügt', `${stamps.length} Einträge hinzugefügt`, adminEmail)
      return true
    } catch (error) {
      console.error('Error batch adding stamps:', error)
      throw error
    }
  }

  // Batch delete stamps
  const batchDeleteStamps = async (stampIds: string[], userId: string, adminEmail: string) => {
    try {
      const batch = writeBatch($db)
      
      stampIds.forEach(id => {
        batch.delete(doc($db, 'stamps', id))
      })
      
      await batch.commit()
      await updateUserStats(userId)
      await logAuditAction(userId, 'batch_delete_stamps', 'Batch Löschung', `${stampIds.length} Einträge gelöscht`, adminEmail)
      return true
    } catch (error) {
      console.error('Error batch deleting stamps:', error)
      throw error
    }
  }

  // Batch update stamps
  const batchUpdateStamps = async (updates: Array<{id: string, data: any}>, userId: string, adminEmail: string) => {
    try {
      const batch = writeBatch($db)
      
      updates.forEach(update => {
        const stampRef = doc($db, 'stamps', update.id)
        batch.update(stampRef, update.data)
      })
      
      await batch.commit()
      await updateUserStats(userId)
      await logAuditAction(userId, 'batch_update_stamps', 'Batch Update', `${updates.length} Einträge aktualisiert`, adminEmail)
      return true
    } catch (error) {
      console.error('Error batch updating stamps:', error)
      throw error
    }
  }

  // ============ CALENDAR & DATE OPERATIONS ============
  
  // Get stamps by date range
  const getStampsByDateRange = async (userId: string, startDate: Date, endDate: Date) => {
    try {
      const stampsQuery = query(
        collection($db, 'stamps'),
        where('userId', '==', userId)
      )
      
      const querySnapshot = await getDocs(stampsQuery)
      return querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((stamp: any) => {
          const stampDate = stamp.timestamp?.toDate ? stamp.timestamp.toDate() : new Date(stamp.timestamp)
          return stampDate >= startDate && stampDate <= endDate
        })
        .sort((a: any, b: any) => {
          const aTime = a.timestamp?.seconds || 0
          const bTime = b.timestamp?.seconds || 0
          return bTime - aTime
        })
    } catch (error) {
      console.error('Error getting stamps by date range:', error)
      return []
    }
  }

  // Get monthly stamps
  const getMonthlyStamps = async (userId: string, year: number, month: number) => {
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0, 23, 59, 59)
    return getStampsByDateRange(userId, startDate, endDate)
  }

  // Get calendar data (for calendar view)
  const getCalendarData = async (userId: string, year: number, month: number) => {
    const stamps = await getMonthlyStamps(userId, year, month)
    const calendarData: any = {}
    
    stamps.forEach((stamp: any) => {
      const date = stamp.date || stamp.timestamp.toDate().toISOString().split('T')[0]
      if (!calendarData[date]) {
        calendarData[date] = []
      }
      calendarData[date].push(stamp)
    })
    
    return calendarData
  }

  // Get stamps by day of week
  const getStampsByDayOfWeek = async (userId: string, dayOfWeek: string) => {
    try {
      const stampsQuery = query(
        collection($db, 'stamps'),
        where('userId', '==', userId)
      )
      
      const querySnapshot = await getDocs(stampsQuery)
      return querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((stamp: any) => stamp.dayOfWeek === dayOfWeek)
        .sort((a: any, b: any) => {
          const aTime = a.timestamp?.seconds || 0
          const bTime = b.timestamp?.seconds || 0
          return bTime - aTime
        })
    } catch (error) {
      console.error('Error getting stamps by day:', error)
      return []
    }
  }

  // ============ GOALS & ACHIEVEMENTS ============
  
  // Create goal
  const createGoal = async (userId: string, goalData: any, adminEmail: string) => {
    try {
      const goal = {
        userId,
        ...goalData,
        createdAt: Timestamp.now(),
        status: 'active',
        progress: 0
      }
      
      const docRef = await addDoc(collection($db, 'goals'), goal)
      await logAuditAction(userId, 'goal_created', 'Ziel erstellt', goalData.title, adminEmail)
      return { id: docRef.id, ...goal }
    } catch (error) {
      console.error('Error creating goal:', error)
      throw error
    }
  }

  // Update goal progress
  const updateGoalProgress = async (goalId: string, progress: number) => {
    try {
      const goalRef = doc($db, 'goals', goalId)
      const updates: any = { progress, lastUpdated: Timestamp.now() }
      
      if (progress >= 100) {
        updates.status = 'completed'
        updates.completedAt = Timestamp.now()
      }
      
      await updateDoc(goalRef, updates)
      return true
    } catch (error) {
      console.error('Error updating goal progress:', error)
      throw error
    }
  }

  // Get user goals
  const getUserGoals = async (userId: string) => {
    try {
      const goalsQuery = query(
        collection($db, 'goals'),
        where('userId', '==', userId)
      )
      
      const querySnapshot = await getDocs(goalsQuery)
      return querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a: any, b: any) => {
          const aTime = a.createdAt?.seconds || 0
          const bTime = b.createdAt?.seconds || 0
          return bTime - aTime
        })
    } catch (error) {
      console.error('Error getting goals:', error)
      return []
    }
  }

  // Unlock achievement
  const unlockAchievement = async (userId: string, achievementId: string, adminEmail: string) => {
    try {
      const achievement = {
        userId,
        achievementId,
        unlockedAt: Timestamp.now()
      }
      
      await addDoc(collection($db, 'achievements'), achievement)
      await logAuditAction(userId, 'achievement_unlocked', 'Achievement freigeschaltet', achievementId, adminEmail)
      return true
    } catch (error) {
      console.error('Error unlocking achievement:', error)
      throw error
    }
  }

  // Get user achievements
  const getUserAchievements = async (userId: string) => {
    try {
      const achievementsQuery = query(
        collection($db, 'achievements'),
        where('userId', '==', userId)
      )
      
      const querySnapshot = await getDocs(achievementsQuery)
      return querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a: any, b: any) => {
          const aTime = a.unlockedAt?.seconds || 0
          const bTime = b.unlockedAt?.seconds || 0
          return bTime - aTime
        })
    } catch (error) {
      console.error('Error getting achievements:', error)
      return []
    }
  }

  // ============ ADVANCED STATISTICS ============
  
  // Get detailed statistics
  const getDetailedStats = async (userId: string) => {
    try {
      const stamps = await getRecentStamps(userId, 1000)
      const stats = await getUserStats(userId)
      
      // Calculate additional metrics
      const thisMonth = stamps.filter((s: any) => {
        const stampDate = s.timestamp.toDate()
        const now = new Date()
        return stampDate.getMonth() === now.getMonth() && stampDate.getFullYear() === now.getFullYear()
      })
      
      const lastMonth = stamps.filter((s: any) => {
        const stampDate = s.timestamp.toDate()
        const now = new Date()
        const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        return stampDate.getMonth() === lastMonthDate.getMonth() && stampDate.getFullYear() === lastMonthDate.getFullYear()
      })
      
      const punctualityRate = stats.totalStamps > 0 
        ? Math.round((stats.onTimeCount / stats.totalStamps) * 100) 
        : 0
      
      // Get best day of week
      const dayStats: any = {}
      stamps.forEach((stamp: any) => {
        if (!dayStats[stamp.dayOfWeek]) {
          dayStats[stamp.dayOfWeek] = { total: 0, onTime: 0 }
        }
        dayStats[stamp.dayOfWeek].total++
        if (stamp.status === 'on-time') {
          dayStats[stamp.dayOfWeek].onTime++
        }
      })
      
      let bestDay = null
      let bestDayRate = 0
      Object.entries(dayStats).forEach(([day, data]: [string, any]) => {
        const rate = (data.onTime / data.total) * 100
        if (rate > bestDayRate) {
          bestDayRate = rate
          bestDay = day
        }
      })
      
      return {
        ...stats,
        thisMonth: {
          total: thisMonth.length,
          onTime: thisMonth.filter((s: any) => s.status === 'on-time').length,
          late: thisMonth.filter((s: any) => s.status === 'late').length
        },
        lastMonth: {
          total: lastMonth.length,
          onTime: lastMonth.filter((s: any) => s.status === 'on-time').length,
          late: lastMonth.filter((s: any) => s.status === 'late').length
        },
        punctualityRate,
        bestDay,
        bestDayRate: Math.round(bestDayRate),
        dayStats
      }
    } catch (error) {
      console.error('Error getting detailed stats:', error)
      throw error
    }
  }

  // Get trend analysis
  const getTrendAnalysis = async (userId: string, days: number = 30) => {
    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)
      
      const stamps = await getStampsByDateRange(userId, startDate, new Date())
      
      // Group by week
      const weeklyData: any = {}
      stamps.forEach((stamp: any) => {
        const stampDate = stamp.timestamp.toDate()
        const weekNum = Math.floor((stampDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000))
        
        if (!weeklyData[weekNum]) {
          weeklyData[weekNum] = { total: 0, onTime: 0, late: 0, totalMinutesLate: 0 }
        }
        
        weeklyData[weekNum].total++
        if (stamp.status === 'on-time') {
          weeklyData[weekNum].onTime++
        } else {
          weeklyData[weekNum].late++
          weeklyData[weekNum].totalMinutesLate += stamp.minutesLate || 0
        }
      })
      
      return weeklyData
    } catch (error) {
      console.error('Error getting trend analysis:', error)
      return {}
    }
  }

  // Get comparison stats (compare user to own history)
  const getComparisonStats = async (userId: string) => {
    try {
      const now = new Date()
      const lastWeekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7)
      const lastWeekEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const twoWeeksAgoStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 14)
      const twoWeeksAgoEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7)
      
      const lastWeek = await getStampsByDateRange(userId, lastWeekStart, lastWeekEnd)
      const twoWeeksAgo = await getStampsByDateRange(userId, twoWeeksAgoStart, twoWeeksAgoEnd)
      
      const lastWeekOnTime = lastWeek.filter((s: any) => s.status === 'on-time').length
      const twoWeeksAgoOnTime = twoWeeksAgo.filter((s: any) => s.status === 'on-time').length
      
      const improvement = lastWeekOnTime - twoWeeksAgoOnTime
      const improvementPercent = twoWeeksAgoOnTime > 0 
        ? Math.round((improvement / twoWeeksAgoOnTime) * 100) 
        : 0
      
      return {
        lastWeek: {
          total: lastWeek.length,
          onTime: lastWeekOnTime,
          late: lastWeek.length - lastWeekOnTime
        },
        twoWeeksAgo: {
          total: twoWeeksAgo.length,
          onTime: twoWeeksAgoOnTime,
          late: twoWeeksAgo.length - twoWeeksAgoOnTime
        },
        improvement,
        improvementPercent
      }
    } catch (error) {
      console.error('Error getting comparison stats:', error)
      return null
    }
  }

  // ============ IMPORT / EXPORT ============
  
  // Export user data
  const exportUserData = async (userId: string) => {
    try {
      const stamps = await getRecentStamps(userId, 10000)
      const stats = await getUserStats(userId)
      const goals = await getUserGoals(userId)
      const achievements = await getUserAchievements(userId)
      const auditLogs = await getAuditLogs(userId, 1000)
      
      return {
        exportDate: new Date().toISOString(),
        userId,
        stamps,
        stats,
        goals,
        achievements,
        auditLogs
      }
    } catch (error) {
      console.error('Error exporting user data:', error)
      throw error
    }
  }

  // Import stamps data
  const importStamps = async (stamps: any[], userId: string, adminEmail: string) => {
    try {
      await batchAddStamps(stamps, adminEmail)
      await updateUserStats(userId)
      await logAuditAction(userId, 'data_import', 'Daten importiert', `${stamps.length} Einträge importiert`, adminEmail)
      return true
    } catch (error) {
      console.error('Error importing stamps:', error)
      throw error
    }
  }

  // ============ FILTERING & SEARCH ============
  
  // Search stamps by note
  const searchStampsByNote = async (userId: string, searchTerm: string) => {
    try {
      const allStamps = await getRecentStamps(userId, 10000)
      return allStamps.filter((stamp: any) => 
        stamp.note && stamp.note.toLowerCase().includes(searchTerm.toLowerCase())
      )
    } catch (error) {
      console.error('Error searching stamps:', error)
      return []
    }
  }

  // Filter stamps by status
  const filterStampsByStatus = async (userId: string, status: 'on-time' | 'late') => {
    try {
      const stampsQuery = query(
        collection($db, 'stamps'),
        where('userId', '==', userId)
      )
      
      const querySnapshot = await getDocs(stampsQuery)
      return querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((stamp: any) => stamp.status === status)
        .sort((a: any, b: any) => {
          const aTime = a.timestamp?.seconds || 0
          const bTime = b.timestamp?.seconds || 0
          return bTime - aTime
        })
    } catch (error) {
      console.error('Error filtering stamps:', error)
      return []
    }
  }

  // Get late stamps only
  const getLateStamps = async (userId: string) => {
    return filterStampsByStatus(userId, 'late')
  }

  // Get on-time stamps only
  const getOnTimeStamps = async (userId: string) => {
    return filterStampsByStatus(userId, 'on-time')
  }

  // ============ ADMIN SPECIAL OPERATIONS ============
  
  // Manually adjust streak
  const adjustStreak = async (userId: string, newStreak: number, adminEmail: string, reason: string) => {
    try {
      const statsRef = doc($db, 'userStats', userId)
      const statsDoc = await getDoc(statsRef)
      
      if (statsDoc.exists()) {
        const oldStreak = statsDoc.data().currentStreak
        await updateDoc(statsRef, {
          currentStreak: newStreak,
          lastUpdated: Timestamp.now()
        })
        
        await logAuditAction(
          userId,
          'streak_adjusted',
          'Streak manuell angepasst',
          `Von ${oldStreak} auf ${newStreak}. Grund: ${reason}`,
          adminEmail
        )
        return true
      }
      return false
    } catch (error) {
      console.error('Error adjusting streak:', error)
      throw error
    }
  }

  // Add bonus points
  const addBonusPoints = async (userId: string, points: number, reason: string, adminEmail: string) => {
    try {
      const pointsData = {
        userId,
        points,
        reason,
        addedBy: adminEmail,
        timestamp: Timestamp.now()
      }
      
      await addDoc(collection($db, 'bonusPoints'), pointsData)
      await logAuditAction(userId, 'bonus_points_added', 'Bonuspunkte hinzugefügt', `${points} Punkte: ${reason}`, adminEmail)
      return true
    } catch (error) {
      console.error('Error adding bonus points:', error)
      throw error
    }
  }

  // Edit stamp
  const editStamp = async (stampId: string, updates: any, userId: string, adminEmail: string) => {
    try {
      const stampRef = doc($db, 'stamps', stampId)
      await updateDoc(stampRef, {
        ...updates,
        editedAt: Timestamp.now(),
        editedBy: adminEmail
      })
      
      await updateUserStats(userId)
      await logAuditAction(userId, 'stamp_edited', 'Eintrag bearbeitet', `Stamp ID: ${stampId}`, adminEmail)
      return true
    } catch (error) {
      console.error('Error editing stamp:', error)
      throw error
    }
  }

  // Create custom report
  const createCustomReport = async (userId: string, reportData: any, adminEmail: string) => {
    try {
      const report = {
        userId,
        ...reportData,
        createdBy: adminEmail,
        createdAt: Timestamp.now()
      }
      
      const docRef = await addDoc(collection($db, 'reports'), report)
      await logAuditAction(userId, 'report_created', 'Bericht erstellt', reportData.title, adminEmail)
      return { id: docRef.id, ...report }
    } catch (error) {
      console.error('Error creating report:', error)
      throw error
    }
  }

  // Get custom reports
  const getCustomReports = async (userId?: string) => {
    try {
      let reportsQuery
      if (userId) {
        reportsQuery = query(
          collection($db, 'reports'),
          where('userId', '==', userId)
        )
      } else {
        reportsQuery = query(
          collection($db, 'reports')
        )
      }
      
      const querySnapshot = await getDocs(reportsQuery)
      return querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a: any, b: any) => {
          const aTime = a.createdAt?.seconds || 0
          const bTime = b.createdAt?.seconds || 0
          return bTime - aTime
        })
    } catch (error) {
      console.error('Error getting reports:', error)
      return []
    }
  }

  // ============ NOTIFICATIONS ============
  
  // Create notification
  const createNotification = async (userId: string, notification: any) => {
    try {
      const notifData = {
        userId,
        ...notification,
        createdAt: Timestamp.now(),
        read: false
      }
      
      await addDoc(collection($db, 'notifications'), notifData)
      return true
    } catch (error) {
      console.error('Error creating notification:', error)
      throw error
    }
  }

  // Get user notifications
  const getUserNotifications = async (userId: string, limitCount: number = 20) => {
    try {
      const notifsQuery = query(
        collection($db, 'notifications'),
        where('userId', '==', userId)
      )
      
      const querySnapshot = await getDocs(notifsQuery)
      return querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a: any, b: any) => {
          const aTime = a.createdAt?.seconds || 0
          const bTime = b.createdAt?.seconds || 0
          return bTime - aTime
        })
        .slice(0, limitCount)
    } catch (error) {
      console.error('Error getting notifications:', error)
      return []
    }
  }

  // Mark notification as read
  const markNotificationRead = async (notificationId: string) => {
    try {
      const notifRef = doc($db, 'notifications', notificationId)
      await updateDoc(notifRef, { read: true, readAt: Timestamp.now() })
      return true
    } catch (error) {
      console.error('Error marking notification read:', error)
      throw error
    }
  }

  // Mark all notifications as read
  const markAllNotificationsRead = async (userId: string) => {
    try {
      const notifications = await getUserNotifications(userId, 1000)
      const batch = writeBatch($db)
      
      notifications.forEach((notif: any) => {
        if (!notif.read) {
          const notifRef = doc($db, 'notifications', notif.id)
          batch.update(notifRef, { read: true, readAt: Timestamp.now() })
        }
      })
      
      await batch.commit()
      return true
    } catch (error) {
      console.error('Error marking all notifications read:', error)
      throw error
    }
  }

  // ============ USER PREFERENCES ============
  
  // Save user preferences
  const saveUserPreferences = async (userId: string, preferences: any) => {
    try {
      const prefRef = doc($db, 'userPreferences', userId)
      await setDoc(prefRef, {
        ...preferences,
        updatedAt: Timestamp.now()
      }, { merge: true })
      return true
    } catch (error) {
      console.error('Error saving preferences:', error)
      throw error
    }
  }

  // Get user preferences
  const getUserPreferences = async (userId: string) => {
    try {
      const prefRef = doc($db, 'userPreferences', userId)
      const prefDoc = await getDoc(prefRef)
      
      if (prefDoc.exists()) {
        return prefDoc.data()
      }
      
      // Return defaults
      return {
        theme: 'light',
        notifications: true,
        emailDigest: 'weekly',
        language: 'de'
      }
    } catch (error) {
      console.error('Error getting preferences:', error)
      return {}
    }
  }

  // ============ BACKUP & RESTORE ============
  
  // Create backup
  const createBackup = async (userId: string, adminEmail: string) => {
    try {
      const data = await exportUserData(userId)
      const backup = {
        userId,
        data,
        createdBy: adminEmail,
        createdAt: Timestamp.now()
      }
      
      const docRef = await addDoc(collection($db, 'backups'), backup)
      await logAuditAction(userId, 'backup_created', 'Backup erstellt', `Backup ID: ${docRef.id}`, adminEmail)
      return { id: docRef.id, ...backup }
    } catch (error) {
      console.error('Error creating backup:', error)
      throw error
    }
  }

  // Get backups
  const getBackups = async (userId: string) => {
    try {
      const backupsQuery = query(
        collection($db, 'backups'),
        where('userId', '==', userId)
      )
      
      const querySnapshot = await getDocs(backupsQuery)
      return querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a: any, b: any) => {
          const aTime = a.createdAt?.seconds || 0
          const bTime = b.createdAt?.seconds || 0
          return bTime - aTime
        })
    } catch (error) {
      console.error('Error getting backups:', error)
      return []
    }
  }

  // Clear all user data (with confirmation)
  const clearAllUserData = async (userId: string, adminEmail: string) => {
    try {
      // Create backup first
      await createBackup(userId, adminEmail)
      
      // Delete all stamps
      const stamps = await getRecentStamps(userId, 100000)
      const stampIds = stamps.map((s: any) => s.id)
      if (stampIds.length > 0) {
        await batchDeleteStamps(stampIds, userId, adminEmail)
      }
      
      // Reset stats
      const statsRef = doc($db, 'userStats', userId)
      await setDoc(statsRef, {
        totalStamps: 0,
        onTimeCount: 0,
        lateCount: 0,
        currentStreak: 0,
        longestStreak: 0,
        totalMinutesLate: 0,
        averageMinutesLate: 0,
        rewardsEarned: [],
        nextRewardProgress: 0,
        lastUpdated: Timestamp.now()
      })
      
      await logAuditAction(userId, 'data_cleared', 'Alle Daten gelöscht', 'Backup wurde erstellt', adminEmail)
      return true
    } catch (error) {
      console.error('Error clearing user data:', error)
      throw error
    }
  }

  // Get or create Tobias user (the main user for stamping)
  const getTobiasUserId = async () => {
    try {
      // Check if Tobias user exists in a special collection
      const tobiasConfigRef = doc($db, 'config', 'tobiasUser')
      const tobiasConfigDoc = await getDoc(tobiasConfigRef)
      
      if (tobiasConfigDoc.exists()) {
        return tobiasConfigDoc.data().userId
      }
      
      // Create Tobias user config if it doesn't exist
      const tobiasUserId = 'tobias-main-user-' + Date.now()
      
      await setDoc(tobiasConfigRef, {
        userId: tobiasUserId,
        name: 'Tobias',
        createdAt: Timestamp.now()
      })
      
      // Initialize stats for Tobias
      await setDoc(doc($db, 'userStats', tobiasUserId), {
        totalStamps: 0,
        onTimeCount: 0,
        lateCount: 0,
        currentStreak: 0,
        longestStreak: 0,
        totalMinutesLate: 0,
        averageMinutesLate: 0,
        rewardsEarned: [],
        nextRewardProgress: 0,
        lastUpdated: Timestamp.now()
      })
      
      console.log('Created Tobias user:', tobiasUserId)
      return tobiasUserId
    } catch (error) {
      console.error('Error getting/creating Tobias user:', error)
      throw error
    }
  }

  return {
    // Original functions
    stampIn,
    getUserStats,
    getRecentStamps,
    getThisWeekStamps,
    updateUserStats,
    isUserAdmin,
    createAdmin,
    getTobiasUserId,
    getAuditLogs,
    logAuditAction,
    resetStreak,
    deleteStamp,
    
    // Reward management
    getAllRewards,
    getUnlockedRewards,
    claimReward,
    updateRewardStatus,
    getRewardClaims,
    
    // Batch operations
    batchAddStamps,
    batchDeleteStamps,
    batchUpdateStamps,
    
    // Calendar & dates
    getStampsByDateRange,
    getMonthlyStamps,
    getCalendarData,
    getStampsByDayOfWeek,
    
    // Goals & achievements
    createGoal,
    updateGoalProgress,
    getUserGoals,
    unlockAchievement,
    getUserAchievements,
    
    // Advanced statistics
    getDetailedStats,
    getTrendAnalysis,
    getComparisonStats,
    
    // Import/Export
    exportUserData,
    importStamps,
    
    // Filtering & search
    searchStampsByNote,
    filterStampsByStatus,
    getLateStamps,
    getOnTimeStamps,
    
    // Admin operations
    adjustStreak,
    addBonusPoints,
    editStamp,
    createCustomReport,
    getCustomReports,
    
    // Notifications
    createNotification,
    getUserNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    
    // User preferences
    saveUserPreferences,
    getUserPreferences,
    
    // Backup & restore
    createBackup,
    getBackups,
    clearAllUserData
  }
}

