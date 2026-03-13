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
  orderBy,
  limit,
  Timestamp
} from 'firebase/firestore'

export const useAdmin = () => {
  const { $db } = useNuxtApp()
  const { user } = useFirebaseAuth()

  // ============ AUDIT LOGGING ============
  
  const createAuditLog = async (action: string, details: any, targetUserId?: string) => {
    try {
      const log = {
        adminId: user.value?.uid,
        adminEmail: user.value?.email,
        action,
        details,
        targetUserId: targetUserId || null,
        timestamp: Timestamp.now(),
        ipAddress: null, // Could be filled from request
        userAgent: navigator.userAgent
      }
      
      await addDoc(collection($db, 'auditLogs'), log)
      return true
    } catch (error) {
      console.error('Error creating audit log:', error)
      return false
    }
  }

  // Get audit logs with filters
  const getAuditLogs = async (filters?: {
    adminId?: string
    targetUserId?: string
    action?: string
    startDate?: Date
    endDate?: Date
    limit?: number
  }) => {
    try {
      let logsQuery = query(collection($db, 'auditLogs'))
      
      const querySnapshot = await getDocs(logsQuery)
      let logs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      
      // Client-side filtering
      if (filters?.adminId) {
        logs = logs.filter((log: any) => log.adminId === filters.adminId)
      }
      if (filters?.targetUserId) {
        logs = logs.filter((log: any) => log.targetUserId === filters.targetUserId)
      }
      if (filters?.action) {
        logs = logs.filter((log: any) => log.action === filters.action)
      }
      if (filters?.startDate) {
        logs = logs.filter((log: any) => {
          const logDate = log.timestamp?.toDate()
          return logDate >= filters.startDate!
        })
      }
      if (filters?.endDate) {
        logs = logs.filter((log: any) => {
          const logDate = log.timestamp?.toDate()
          return logDate <= filters.endDate!
        })
      }
      
      // Sort by timestamp (newest first)
      logs.sort((a: any, b: any) => {
        const aTime = a.timestamp?.seconds || 0
        const bTime = b.timestamp?.seconds || 0
        return bTime - aTime
      })
      
      // Limit results
      if (filters?.limit) {
        logs = logs.slice(0, filters.limit)
      }
      
      return logs
    } catch (error) {
      console.error('Error getting audit logs:', error)
      return []
    }
  }

  // ============ USER MANAGEMENT ============
  
  // Get all users
  const getAllUsers = async () => {
    try {
      const usersQuery = query(collection($db, 'userStats'))
      const querySnapshot = await getDocs(usersQuery)
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
    } catch (error) {
      console.error('Error getting users:', error)
      return []
    }
  }

  // Reset user streak (with audit log)
  const resetUserStreak = async (userId: string, reason: string) => {
    try {
      const userStatsRef = doc($db, 'userStats', userId)
      const userStatsDoc = await getDoc(userStatsRef)
      
      if (!userStatsDoc.exists()) return false
      
      const oldStreak = userStatsDoc.data().currentStreak || 0
      
      await updateDoc(userStatsRef, {
        currentStreak: 0,
        lastStreakReset: Timestamp.now(),
        streakResetReason: reason
      })
      
      // Create audit log
      await createAuditLog('reset_streak', {
        reason,
        oldStreak,
        newStreak: 0
      }, userId)
      
      return true
    } catch (error) {
      console.error('Error resetting streak:', error)
      throw error
    }
  }

  // Adjust user streak
  const adjustUserStreak = async (userId: string, newStreak: number, reason: string) => {
    try {
      const userStatsRef = doc($db, 'userStats', userId)
      const userStatsDoc = await getDoc(userStatsRef)
      
      if (!userStatsDoc.exists()) return false
      
      const oldStreak = userStatsDoc.data().currentStreak || 0
      
      await updateDoc(userStatsRef, {
        currentStreak: newStreak,
        lastStreakAdjustment: Timestamp.now()
      })
      
      // Create audit log
      await createAuditLog('adjust_streak', {
        reason,
        oldStreak,
        newStreak
      }, userId)
      
      return true
    } catch (error) {
      console.error('Error adjusting streak:', error)
      throw error
    }
  }

  // Add bonus XP
  const addBonusXP = async (userId: string, amount: number, reason: string) => {
    try {
      const gamificationRef = doc($db, 'userGamification', userId)
      const gamificationDoc = await getDoc(gamificationRef)
      
      if (!gamificationDoc.exists()) return false
      
      const oldXP = gamificationDoc.data().xp || 0
      const newXP = oldXP + amount
      
      await updateDoc(gamificationRef, {
        xp: newXP,
        lastBonusXP: Timestamp.now()
      })
      
      // Create audit log
      await createAuditLog('add_bonus_xp', {
        reason,
        amount,
        oldXP,
        newXP
      }, userId)
      
      return true
    } catch (error) {
      console.error('Error adding bonus XP:', error)
      throw error
    }
  }

  // Delete user stamp
  const deleteUserStamp = async (stampId: string, userId: string, reason: string) => {
    try {
      const stampRef = doc($db, 'stamps', stampId)
      const stampDoc = await getDoc(stampRef)
      
      if (!stampDoc.exists()) return false
      
      const stampData = stampDoc.data()
      
      await deleteDoc(stampRef)
      
      // Create audit log
      await createAuditLog('delete_stamp', {
        reason,
        stampId,
        stampData
      }, userId)
      
      return true
    } catch (error) {
      console.error('Error deleting stamp:', error)
      throw error
    }
  }

  // Edit user stamp
  const editUserStamp = async (stampId: string, userId: string, updates: any, reason: string) => {
    try {
      const stampRef = doc($db, 'stamps', stampId)
      const stampDoc = await getDoc(stampRef)
      
      if (!stampDoc.exists()) return false
      
      const oldData = stampDoc.data()
      
      await updateDoc(stampRef, {
        ...updates,
        lastEditedAt: Timestamp.now(),
        lastEditedBy: user.value?.uid
      })
      
      // Create audit log
      await createAuditLog('edit_stamp', {
        reason,
        stampId,
        oldData,
        newData: updates
      }, userId)
      
      return true
    } catch (error) {
      console.error('Error editing stamp:', error)
      throw error
    }
  }

  // ============ NOTIFICATION MANAGEMENT ============
  
  // Create notification for user
  const createNotification = async (userId: string, notificationData: any) => {
    try {
      const notification = {
        userId,
        ...notificationData,
        read: false,
        createdAt: Timestamp.now()
      }
      
      const docRef = await addDoc(collection($db, 'notifications'), notification)
      
      // Create audit log
      await createAuditLog('create_notification', {
        notificationId: docRef.id,
        type: notificationData.type,
        title: notificationData.title
      }, userId)
      
      return { id: docRef.id, ...notification }
    } catch (error) {
      console.error('Error creating notification:', error)
      throw error
    }
  }

  // Broadcast notification to all users
  const broadcastNotification = async (notificationData: any) => {
    try {
      const users = await getAllUsers()
      const promises = users.map(user => 
        createNotification(user.id, notificationData)
      )
      
      await Promise.all(promises)
      
      // Create audit log
      await createAuditLog('broadcast_notification', {
        type: notificationData.type,
        title: notificationData.title,
        recipientCount: users.length
      })
      
      return true
    } catch (error) {
      console.error('Error broadcasting notification:', error)
      throw error
    }
  }

  // ============ REWARD MANAGEMENT ============
  
  // Create custom reward
  const createCustomReward = async (rewardData: any) => {
    try {
      const reward = {
        ...rewardData,
        createdAt: Timestamp.now(),
        createdBy: user.value?.uid
      }
      
      const docRef = await addDoc(collection($db, 'rewards'), reward)
      
      // Create audit log
      await createAuditLog('create_reward', {
        rewardId: docRef.id,
        name: rewardData.name,
        requiredStamps: rewardData.requiredStamps
      })
      
      return { id: docRef.id, ...reward }
    } catch (error) {
      console.error('Error creating reward:', error)
      throw error
    }
  }

  // Update reward
  const updateReward = async (rewardId: string, updates: any, reason: string) => {
    try {
      const rewardRef = doc($db, 'rewards', rewardId)
      const rewardDoc = await getDoc(rewardRef)
      
      if (!rewardDoc.exists()) return false
      
      const oldData = rewardDoc.data()
      
      await updateDoc(rewardRef, {
        ...updates,
        lastUpdatedAt: Timestamp.now(),
        lastUpdatedBy: user.value?.uid
      })
      
      // Create audit log
      await createAuditLog('update_reward', {
        reason,
        rewardId,
        oldData,
        newData: updates
      })
      
      return true
    } catch (error) {
      console.error('Error updating reward:', error)
      throw error
    }
  }

  // Delete reward
  const deleteReward = async (rewardId: string, reason: string) => {
    try {
      const rewardRef = doc($db, 'rewards', rewardId)
      const rewardDoc = await getDoc(rewardRef)
      
      if (!rewardDoc.exists()) return false
      
      const rewardData = rewardDoc.data()
      
      await deleteDoc(rewardRef)
      
      // Create audit log
      await createAuditLog('delete_reward', {
        reason,
        rewardId,
        rewardData
      })
      
      return true
    } catch (error) {
      console.error('Error deleting reward:', error)
      throw error
    }
  }

  // ============ BADGE & ACHIEVEMENT MANAGEMENT ============
  
  // Grant badge to user
  const grantBadge = async (userId: string, badgeType: string, reason: string) => {
    try {
      const badge = {
        userId,
        badgeType,
        unlockedAt: Timestamp.now(),
        grantedBy: user.value?.uid,
        reason
      }
      
      const docRef = await addDoc(collection($db, 'badgeUnlocks'), badge)
      
      // Create audit log
      await createAuditLog('grant_badge', {
        badgeType,
        reason
      }, userId)
      
      return { id: docRef.id, ...badge }
    } catch (error) {
      console.error('Error granting badge:', error)
      throw error
    }
  }

  // Revoke badge from user
  const revokeBadge = async (badgeId: string, userId: string, reason: string) => {
    try {
      const badgeRef = doc($db, 'badgeUnlocks', badgeId)
      const badgeDoc = await getDoc(badgeRef)
      
      if (!badgeDoc.exists()) return false
      
      const badgeData = badgeDoc.data()
      
      await deleteDoc(badgeRef)
      
      // Create audit log
      await createAuditLog('revoke_badge', {
        reason,
        badgeId,
        badgeType: badgeData.badgeType
      }, userId)
      
      return true
    } catch (error) {
      console.error('Error revoking badge:', error)
      throw error
    }
  }

  // ============ GOAL MANAGEMENT ============
  
  // Create goal for user
  const createGoalForUser = async (userId: string, goalData: any) => {
    try {
      const goal = {
        userId,
        ...goalData,
        createdAt: Timestamp.now(),
        createdBy: user.value?.uid
      }
      
      const docRef = await addDoc(collection($db, 'goals'), goal)
      
      // Create audit log
      await createAuditLog('create_goal', {
        goalId: docRef.id,
        title: goalData.title,
        target: goalData.target
      }, userId)
      
      return { id: docRef.id, ...goal }
    } catch (error) {
      console.error('Error creating goal:', error)
      throw error
    }
  }

  // ============ SYSTEM STATS ============
  
  // Get system statistics
  const getSystemStats = async () => {
    try {
      const [
        usersSnapshot,
        stampsSnapshot,
        auditLogsSnapshot,
        notificationsSnapshot
      ] = await Promise.all([
        getDocs(collection($db, 'userStats')),
        getDocs(collection($db, 'stamps')),
        getDocs(collection($db, 'auditLogs')),
        getDocs(collection($db, 'notifications'))
      ])
      
      return {
        totalUsers: usersSnapshot.size,
        totalStamps: stampsSnapshot.size,
        totalAuditLogs: auditLogsSnapshot.size,
        totalNotifications: notificationsSnapshot.size,
        activeUsers: usersSnapshot.docs.filter(doc => {
          const lastActive = doc.data().lastActiveAt?.toDate()
          const daysSinceActive = lastActive 
            ? Math.floor((Date.now() - lastActive.getTime()) / (1000 * 60 * 60 * 24))
            : 999
          return daysSinceActive <= 7
        }).length
      }
    } catch (error) {
      console.error('Error getting system stats:', error)
      return null
    }
  }

  // ============ BATCH OPERATIONS ============
  
  // Batch add XP to multiple users
  const batchAddXP = async (userIds: string[], amount: number, reason: string) => {
    try {
      const promises = userIds.map(userId => addBonusXP(userId, amount, reason))
      await Promise.all(promises)
      
      // Create audit log
      await createAuditLog('batch_add_xp', {
        reason,
        amount,
        userCount: userIds.length,
        userIds
      })
      
      return true
    } catch (error) {
      console.error('Error batch adding XP:', error)
      throw error
    }
  }

  // Batch reset streaks
  const batchResetStreaks = async (userIds: string[], reason: string) => {
    try {
      const promises = userIds.map(userId => resetUserStreak(userId, reason))
      await Promise.all(promises)
      
      // Create audit log
      await createAuditLog('batch_reset_streaks', {
        reason,
        userCount: userIds.length,
        userIds
      })
      
      return true
    } catch (error) {
      console.error('Error batch resetting streaks:', error)
      throw error
    }
  }

  return {
    // Audit Logs
    createAuditLog,
    getAuditLogs,
    
    // User Management
    getAllUsers,
    resetUserStreak,
    adjustUserStreak,
    addBonusXP,
    deleteUserStamp,
    editUserStamp,
    
    // Notifications
    createNotification,
    broadcastNotification,
    
    // Rewards
    createCustomReward,
    updateReward,
    deleteReward,
    
    // Badges & Achievements
    grantBadge,
    revokeBadge,
    
    // Goals
    createGoalForUser,
    
    // System
    getSystemStats,
    
    // Batch Operations
    batchAddXP,
    batchResetStreaks
  }
}
