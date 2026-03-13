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

export const useAutomation = () => {
  const { $db } = useNuxtApp()

  // ============ REMINDERS ============
  
  // Create reminder
  const createReminder = async (userId: string, reminderData: any) => {
    try {
      const reminder = {
        userId,
        ...reminderData,
        active: true,
        createdAt: Timestamp.now()
      }
      
      const docRef = await addDoc(collection($db, 'reminders'), reminder)
      return { id: docRef.id, ...reminder }
    } catch (error) {
      console.error('Error creating reminder:', error)
      throw error
    }
  }

  // Get user reminders
  const getUserReminders = async (userId: string) => {
    try {
      const remindersQuery = query(
        collection($db, 'reminders'),
        where('userId', '==', userId)
      )
      
      const querySnapshot = await getDocs(remindersQuery)
      return querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a: any, b: any) => {
          const aTime = a.createdAt?.seconds || 0
          const bTime = b.createdAt?.seconds || 0
          return bTime - aTime
        })
    } catch (error) {
      console.error('Error getting reminders:', error)
      return []
    }
  }

  // Update reminder
  const updateReminder = async (reminderId: string, updates: any) => {
    try {
      const reminderRef = doc($db, 'reminders', reminderId)
      await updateDoc(reminderRef, {
        ...updates,
        updatedAt: Timestamp.now()
      })
      return true
    } catch (error) {
      console.error('Error updating reminder:', error)
      throw error
    }
  }

  // Delete reminder
  const deleteReminder = async (reminderId: string) => {
    try {
      await deleteDoc(doc($db, 'reminders', reminderId))
      return true
    } catch (error) {
      console.error('Error deleting reminder:', error)
      throw error
    }
  }

  // Snooze reminder
  const snoozeReminder = async (reminderId: string, minutes: number) => {
    try {
      const newTime = new Date()
      newTime.setMinutes(newTime.getMinutes() + minutes)
      
      await updateReminder(reminderId, {
        snoozedUntil: Timestamp.fromDate(newTime),
        snoozeCount: increment(1)
      })
      
      return true
    } catch (error) {
      console.error('Error snoozing reminder:', error)
      throw error
    }
  }

  // ============ RECURRING TASKS ============
  
  // Create recurring task
  const createRecurringTask = async (userId: string, taskData: any) => {
    try {
      const task = {
        userId,
        ...taskData,
        active: true,
        lastExecuted: null,
        nextExecution: Timestamp.now(),
        createdAt: Timestamp.now()
      }
      
      const docRef = await addDoc(collection($db, 'recurringTasks'), task)
      return { id: docRef.id, ...task }
    } catch (error) {
      console.error('Error creating recurring task:', error)
      throw error
    }
  }

  // Get recurring tasks
  const getRecurringTasks = async (userId: string) => {
    try {
      const tasksQuery = query(
        collection($db, 'recurringTasks'),
        where('userId', '==', userId)
      )
      
      const querySnapshot = await getDocs(tasksQuery)
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    } catch (error) {
      console.error('Error getting recurring tasks:', error)
      return []
    }
  }

  // Execute recurring task
  const executeRecurringTask = async (taskId: string) => {
    try {
      const taskRef = doc($db, 'recurringTasks', taskId)
      const taskDoc = await getDoc(taskRef)
      
      if (!taskDoc.exists()) return false
      
      const task = taskDoc.data()
      
      // Calculate next execution based on frequency
      const nextExecution = new Date()
      switch (task.frequency) {
        case 'daily':
          nextExecution.setDate(nextExecution.getDate() + 1)
          break
        case 'weekly':
          nextExecution.setDate(nextExecution.getDate() + 7)
          break
        case 'monthly':
          nextExecution.setMonth(nextExecution.getMonth() + 1)
          break
      }
      
      await updateDoc(taskRef, {
        lastExecuted: Timestamp.now(),
        nextExecution: Timestamp.fromDate(nextExecution),
        executionCount: (task.executionCount || 0) + 1
      })
      
      // Log execution
      await addDoc(collection($db, 'taskExecutions'), {
        taskId,
        userId: task.userId,
        executedAt: Timestamp.now()
      })
      
      return true
    } catch (error) {
      console.error('Error executing recurring task:', error)
      throw error
    }
  }

  // ============ AUTO-ACTIONS ============
  
  // Create auto-action (if X happens, do Y)
  const createAutoAction = async (userId: string, actionData: any) => {
    try {
      const action = {
        userId,
        ...actionData,
        active: true,
        triggerCount: 0,
        createdAt: Timestamp.now()
      }
      
      const docRef = await addDoc(collection($db, 'autoActions'), action)
      return { id: docRef.id, ...action }
    } catch (error) {
      console.error('Error creating auto-action:', error)
      throw error
    }
  }

  // Get auto-actions
  const getAutoActions = async (userId: string) => {
    try {
      const actionsQuery = query(
        collection($db, 'autoActions'),
        where('userId', '==', userId)
      )
      
      const querySnapshot = await getDocs(actionsQuery)
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    } catch (error) {
      console.error('Error getting auto-actions:', error)
      return []
    }
  }

  // Trigger auto-action
  const triggerAutoAction = async (actionId: string) => {
    try {
      const actionRef = doc($db, 'autoActions', actionId)
      await updateDoc(actionRef, {
        lastTriggered: Timestamp.now(),
        triggerCount: increment(1)
      })
      
      return true
    } catch (error) {
      console.error('Error triggering auto-action:', error)
      throw error
    }
  }

  // ============ SMART SUGGESTIONS ============
  
  // Get smart suggestions based on user behavior
  const getSmartSuggestions = async (userId: string) => {
    try {
      const stampsQuery = query(
        collection($db, 'stamps'),
        where('userId', '==', userId)
      )
      
      const querySnapshot = await getDocs(stampsQuery)
      const stamps = querySnapshot.docs.map(doc => doc.data())
      
      const suggestions: Array<{type: string, title: string, description: string, priority: number}> = []
      
      // Analyze patterns
      const lateStamps = stamps.filter((s: any) => s.status === 'late')
      const latePercentage = stamps.length > 0 ? (lateStamps.length / stamps.length) * 100 : 0
      
      if (latePercentage > 30) {
        suggestions.push({
          type: 'reminder',
          title: 'Erinnerung einrichten',
          description: 'Du bist oft zu spät. Richte tägliche Erinnerungen ein!',
          priority: 1
        })
      }
      
      // Check for low activity
      const lastStamp = stamps[stamps.length - 1]
      if (lastStamp) {
        const daysSinceLastStamp = Math.floor(
          (Date.now() - (lastStamp.timestamp?.toDate()?.getTime() || 0)) / (1000 * 60 * 60 * 24)
        )
        
        if (daysSinceLastStamp > 7) {
          suggestions.push({
            type: 'motivation',
            title: 'Bleib dran!',
            description: 'Du warst lange nicht aktiv. Starte wieder durch!',
            priority: 2
          })
        }
      }
      
      // Find best time pattern
      const hourCounts: any = {}
      stamps.forEach((stamp: any) => {
        const hour = stamp.timestamp?.toDate()?.getHours()
        if (hour !== undefined) {
          hourCounts[hour] = (hourCounts[hour] || 0) + 1
        }
      })
      
      const bestHour = Object.entries(hourCounts).reduce((best: any, [hour, count]: any) => {
        return count > (hourCounts[best] || 0) ? hour : best
      }, 0)
      
      suggestions.push({
        type: 'insight',
        title: 'Deine beste Zeit',
        description: `Du bist meist um ${bestHour} Uhr aktiv. Nutze diese Zeit!`,
        priority: 3
      })
      
      return suggestions.sort((a, b) => a.priority - b.priority)
    } catch (error) {
      console.error('Error getting smart suggestions:', error)
      return []
    }
  }

  // ============ SCHEDULED ACTIONS ============
  
  // Schedule an action
  const scheduleAction = async (userId: string, actionData: any, executeAt: Date) => {
    try {
      const scheduled = {
        userId,
        action: actionData,
        scheduledFor: Timestamp.fromDate(executeAt),
        status: 'pending',
        createdAt: Timestamp.now()
      }
      
      const docRef = await addDoc(collection($db, 'scheduledActions'), scheduled)
      return { id: docRef.id, ...scheduled }
    } catch (error) {
      console.error('Error scheduling action:', error)
      throw error
    }
  }

  // Get scheduled actions
  const getScheduledActions = async (userId: string) => {
    try {
      const actionsQuery = query(
        collection($db, 'scheduledActions'),
        where('userId', '==', userId)
      )
      
      const querySnapshot = await getDocs(actionsQuery)
      return querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a: any, b: any) => {
          const aTime = a.scheduledFor?.seconds || 0
          const bTime = b.scheduledFor?.seconds || 0
          return aTime - bTime
        })
    } catch (error) {
      console.error('Error getting scheduled actions:', error)
      return []
    }
  }

  // Cancel scheduled action
  const cancelScheduledAction = async (actionId: string) => {
    try {
      const actionRef = doc($db, 'scheduledActions', actionId)
      await updateDoc(actionRef, {
        status: 'cancelled',
        cancelledAt: Timestamp.now()
      })
      return true
    } catch (error) {
      console.error('Error cancelling scheduled action:', error)
      throw error
    }
  }

  // ============ WORKFLOWS ============
  
  // Create workflow (multi-step automation)
  const createWorkflow = async (userId: string, workflowData: any) => {
    try {
      const workflow = {
        userId,
        ...workflowData,
        active: true,
        executionCount: 0,
        createdAt: Timestamp.now()
      }
      
      const docRef = await addDoc(collection($db, 'workflows'), workflow)
      return { id: docRef.id, ...workflow }
    } catch (error) {
      console.error('Error creating workflow:', error)
      throw error
    }
  }

  // Get workflows
  const getWorkflows = async (userId: string) => {
    try {
      const workflowsQuery = query(
        collection($db, 'workflows'),
        where('userId', '==', userId)
      )
      
      const querySnapshot = await getDocs(workflowsQuery)
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    } catch (error) {
      console.error('Error getting workflows:', error)
      return []
    }
  }

  // Execute workflow
  const executeWorkflow = async (workflowId: string) => {
    try {
      const workflowRef = doc($db, 'workflows', workflowId)
      const workflowDoc = await getDoc(workflowRef)
      
      if (!workflowDoc.exists()) return false
      
      await updateDoc(workflowRef, {
        lastExecuted: Timestamp.now(),
        executionCount: increment(1)
      })
      
      // Log execution
      await addDoc(collection($db, 'workflowExecutions'), {
        workflowId,
        executedAt: Timestamp.now(),
        status: 'success'
      })
      
      return true
    } catch (error) {
      console.error('Error executing workflow:', error)
      throw error
    }
  }

  // ============ TEMPLATES ============
  
  const getAutomationTemplates = () => [
    {
      id: 'daily_reminder',
      name: 'Tägliche Erinnerung',
      description: 'Erinnert dich täglich zur selben Zeit',
      type: 'reminder',
      config: { frequency: 'daily', time: '08:00' }
    },
    {
      id: 'streak_protection',
      name: 'Streak-Schutz',
      description: 'Warnt dich, wenn dein Streak gefährdet ist',
      type: 'auto-action',
      config: { trigger: 'streak_danger', action: 'send_notification' }
    },
    {
      id: 'weekly_summary',
      name: 'Wöchentliche Zusammenfassung',
      description: 'Sendet jeden Sonntag eine Zusammenfassung',
      type: 'recurring-task',
      config: { frequency: 'weekly', day: 'sunday' }
    },
    {
      id: 'goal_reminder',
      name: 'Ziel-Erinnerung',
      description: 'Erinnert dich an deine Ziele',
      type: 'reminder',
      config: { trigger: 'goal_deadline_near' }
    },
    {
      id: 'celebration',
      name: 'Erfolgs-Feier',
      description: 'Feiert deine Erfolge automatisch',
      type: 'auto-action',
      config: { trigger: 'milestone_reached', action: 'celebrate' }
    }
  ]

  // Apply template
  const applyTemplate = async (userId: string, templateId: string) => {
    try {
      const template = getAutomationTemplates().find(t => t.id === templateId)
      if (!template) return false
      
      if (template.type === 'reminder') {
        await createReminder(userId, {
          name: template.name,
          description: template.description,
          config: template.config
        })
      } else if (template.type === 'auto-action') {
        await createAutoAction(userId, {
          name: template.name,
          description: template.description,
          config: template.config
        })
      } else if (template.type === 'recurring-task') {
        await createRecurringTask(userId, {
          name: template.name,
          description: template.description,
          ...template.config
        })
      }
      
      return true
    } catch (error) {
      console.error('Error applying template:', error)
      throw error
    }
  }

  return {
    // Reminders
    createReminder,
    getUserReminders,
    updateReminder,
    deleteReminder,
    snoozeReminder,
    
    // Recurring Tasks
    createRecurringTask,
    getRecurringTasks,
    executeRecurringTask,
    
    // Auto-Actions
    createAutoAction,
    getAutoActions,
    triggerAutoAction,
    
    // Smart Suggestions
    getSmartSuggestions,
    
    // Scheduled Actions
    scheduleAction,
    getScheduledActions,
    cancelScheduledAction,
    
    // Workflows
    createWorkflow,
    getWorkflows,
    executeWorkflow,
    
    // Templates
    getAutomationTemplates,
    applyTemplate
  }
}

// Helper function for increment
const increment = (value: number) => {
  return (currentValue: number) => currentValue + value
}
