import { 
  collection, 
  doc,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  query,
  where,
  getDocs,
  Timestamp
} from 'firebase/firestore'

export const useAnalytics = () => {
  const { $db } = useNuxtApp()

  // ============ ADVANCED STATISTICS ============
  
  // Get hourly distribution
  const getHourlyDistribution = async (userId: string) => {
    try {
      const stampsQuery = query(
        collection($db, 'stamps'),
        where('userId', '==', userId)
      )
      
      const querySnapshot = await getDocs(stampsQuery)
      const hourCounts: any = {}
      
      // Initialize all hours
      for (let i = 0; i < 24; i++) {
        hourCounts[i] = { total: 0, onTime: 0, late: 0 }
      }
      
      querySnapshot.docs.forEach(doc => {
        const data = doc.data()
        const timestamp = data.timestamp?.toDate()
        if (timestamp) {
          const hour = timestamp.getHours()
          hourCounts[hour].total++
          if (data.status === 'on-time') {
            hourCounts[hour].onTime++
          } else {
            hourCounts[hour].late++
          }
        }
      })
      
      return hourCounts
    } catch (error) {
      console.error('Error getting hourly distribution:', error)
      return {}
    }
  }

  // Get weekly pattern
  const getWeeklyPattern = async (userId: string) => {
    try {
      const stampsQuery = query(
        collection($db, 'stamps'),
        where('userId', '==', userId)
      )
      
      const querySnapshot = await getDocs(stampsQuery)
      const weekdayStats: any = {
        'Montag': { total: 0, onTime: 0, late: 0 },
        'Dienstag': { total: 0, onTime: 0, late: 0 },
        'Mittwoch': { total: 0, onTime: 0, late: 0 },
        'Donnerstag': { total: 0, onTime: 0, late: 0 },
        'Freitag': { total: 0, onTime: 0, late: 0 },
        'Samstag': { total: 0, onTime: 0, late: 0 },
        'Sonntag': { total: 0, onTime: 0, late: 0 }
      }
      
      querySnapshot.docs.forEach(doc => {
        const data = doc.data()
        const day = data.dayOfWeek
        if (day && weekdayStats[day]) {
          weekdayStats[day].total++
          if (data.status === 'on-time') {
            weekdayStats[day].onTime++
          } else {
            weekdayStats[day].late++
          }
        }
      })
      
      return weekdayStats
    } catch (error) {
      console.error('Error getting weekly pattern:', error)
      return {}
    }
  }

  // Get monthly trends (last 12 months)
  const getMonthlyTrends = async (userId: string) => {
    try {
      const stampsQuery = query(
        collection($db, 'stamps'),
        where('userId', '==', userId)
      )
      
      const querySnapshot = await getDocs(stampsQuery)
      const monthlyData: any = {}
      
      querySnapshot.docs.forEach(doc => {
        const data = doc.data()
        const timestamp = data.timestamp?.toDate()
        if (timestamp) {
          const monthKey = `${timestamp.getFullYear()}-${String(timestamp.getMonth() + 1).padStart(2, '0')}`
          
          if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = { total: 0, onTime: 0, late: 0, totalMinutesLate: 0 }
          }
          
          monthlyData[monthKey].total++
          if (data.status === 'on-time') {
            monthlyData[monthKey].onTime++
          } else {
            monthlyData[monthKey].late++
            monthlyData[monthKey].totalMinutesLate += data.minutesLate || 0
          }
        }
      })
      
      return monthlyData
    } catch (error) {
      console.error('Error getting monthly trends:', error)
      return {}
    }
  }

  // Get performance metrics
  const getPerformanceMetrics = async (userId: string) => {
    try {
      const stampsQuery = query(
        collection($db, 'stamps'),
        where('userId', '==', userId)
      )
      
      const querySnapshot = await getDocs(stampsQuery)
      const stamps = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      
      if (stamps.length === 0) {
        return {
          averageResponseTime: 0,
          consistencyScore: 0,
          improvementRate: 0,
          reliability: 0,
          totalDaysActive: 0,
          longestActiveStreak: 0,
          averageStampsPerWeek: 0
        }
      }
      
      // Calculate metrics
      const totalStamps = stamps.length
      const onTimeStamps = stamps.filter((s: any) => s.status === 'on-time').length
      const reliability = (onTimeStamps / totalStamps) * 100
      
      // Get date range
      const dates = stamps.map((s: any) => s.timestamp?.toDate()).filter(d => d)
      dates.sort((a, b) => a.getTime() - b.getTime())
      
      const firstDate = dates[0]
      const lastDate = dates[dates.length - 1]
      const daysDiff = Math.ceil((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24))
      const averageStampsPerWeek = daysDiff > 0 ? (totalStamps / daysDiff) * 7 : 0
      
      // Unique days active
      const uniqueDays = new Set(dates.map(d => d.toISOString().split('T')[0]))
      const totalDaysActive = uniqueDays.size
      
      // Consistency score (how regular are the stamps)
      const consistencyScore = daysDiff > 0 ? (totalDaysActive / daysDiff) * 100 : 0
      
      return {
        averageResponseTime: 0, // Would need timestamp data
        consistencyScore: Math.round(consistencyScore),
        improvementRate: 0, // Would need historical comparison
        reliability: Math.round(reliability),
        totalDaysActive,
        longestActiveStreak: 0, // Would need day-by-day analysis
        averageStampsPerWeek: Math.round(averageStampsPerWeek * 10) / 10
      }
    } catch (error) {
      console.error('Error getting performance metrics:', error)
      return {}
    }
  }

  // Get correlation analysis
  const getCorrelationAnalysis = async (userId: string) => {
    try {
      const stampsQuery = query(
        collection($db, 'stamps'),
        where('userId', '==', userId)
      )
      
      const querySnapshot = await getDocs(stampsQuery)
      const stamps = querySnapshot.docs.map(doc => doc.data())
      
      // Analyze correlations
      const timeOfDayImpact: any = {}
      const dayOfWeekImpact: any = {}
      
      stamps.forEach((stamp: any) => {
        const timestamp = stamp.timestamp?.toDate()
        if (timestamp) {
          const hour = timestamp.getHours()
          const day = stamp.dayOfWeek
          
          // Time of day impact
          if (!timeOfDayImpact[hour]) {
            timeOfDayImpact[hour] = { onTime: 0, late: 0 }
          }
          if (stamp.status === 'on-time') {
            timeOfDayImpact[hour].onTime++
          } else {
            timeOfDayImpact[hour].late++
          }
          
          // Day of week impact
          if (day) {
            if (!dayOfWeekImpact[day]) {
              dayOfWeekImpact[day] = { onTime: 0, late: 0 }
            }
            if (stamp.status === 'on-time') {
              dayOfWeekImpact[day].onTime++
            } else {
              dayOfWeekImpact[day].late++
            }
          }
        }
      })
      
      return { timeOfDayImpact, dayOfWeekImpact }
    } catch (error) {
      console.error('Error getting correlation analysis:', error)
      return {}
    }
  }

  // Get predictive insights
  const getPredictiveInsights = async (userId: string) => {
    try {
      const monthlyTrends = await getMonthlyTrends(userId)
      const weeklyPattern = await getWeeklyPattern(userId)
      
      // Analyze trends
      const months = Object.keys(monthlyTrends).sort()
      if (months.length < 2) {
        return {
          trend: 'neutral',
          prediction: 'Nicht genug Daten für Vorhersage',
          confidence: 0
        }
      }
      
      const recentMonths = months.slice(-3)
      const rates = recentMonths.map(month => {
        const data = monthlyTrends[month]
        return data.total > 0 ? (data.onTime / data.total) * 100 : 0
      })
      
      // Calculate trend
      let trend = 'neutral'
      if (rates.length >= 2) {
        const first = rates[0]
        const last = rates[rates.length - 1]
        if (first !== undefined && last !== undefined) {
          const diff = last - first
          if (diff > 5) trend = 'improving'
          else if (diff < -5) trend = 'declining'
        }
      }
      
      // Find best day
      let bestDay = 'Dienstag'
      let bestRate = 0
      Object.entries(weeklyPattern).forEach(([day, data]: [string, any]) => {
        if (data.total > 0) {
          const rate = (data.onTime / data.total) * 100
          if (rate > bestRate) {
            bestRate = rate
            bestDay = day
          }
        }
      })
      
      return {
        trend,
        prediction: trend === 'improving' 
          ? 'Weiter so! Deine Pünktlichkeit verbessert sich.' 
          : trend === 'declining'
          ? 'Achtung! Deine Pünktlichkeit nimmt ab.'
          : 'Bleib am Ball!',
        confidence: Math.round(bestRate),
        bestDay,
        recommendation: `${bestDay} ist dein bester Tag (${Math.round(bestRate)}% pünktlich)`
      }
    } catch (error) {
      console.error('Error getting predictive insights:', error)
      return {}
    }
  }

  // ============ HEAT MAP DATA ============
  
  const getHeatMapData = async (userId: string, year: number) => {
    try {
      const stampsQuery = query(
        collection($db, 'stamps'),
        where('userId', '==', userId)
      )
      
      const querySnapshot = await getDocs(stampsQuery)
      const heatMap: any = {}
      
      querySnapshot.docs.forEach(doc => {
        const data = doc.data()
        const timestamp = data.timestamp?.toDate()
        if (timestamp && timestamp.getFullYear() === year) {
          const dateKey = timestamp.toISOString().split('T')[0]
          if (!heatMap[dateKey]) {
            heatMap[dateKey] = { count: 0, onTime: 0, late: 0 }
          }
          heatMap[dateKey].count++
          if (data.status === 'on-time') {
            heatMap[dateKey].onTime++
          } else {
            heatMap[dateKey].late++
          }
        }
      })
      
      return heatMap
    } catch (error) {
      console.error('Error getting heat map data:', error)
      return {}
    }
  }

  // ============ COMPARATIVE ANALYSIS ============
  
  const getComparativeAnalysis = async (userId: string) => {
    try {
      // Get user's stats
      const userStatsRef = doc($db, 'userStats', userId)
      const userStatsDoc = await getDoc(userStatsRef)
      
      if (!userStatsDoc.exists()) {
        return {
          userRank: null,
          percentile: null,
          comparison: {}
        }
      }
      
      const userStats = userStatsDoc.data()
      
      // Get all users' stats for comparison
      const allStatsQuery = query(collection($db, 'userStats'))
      const allStatsSnapshot = await getDocs(allStatsQuery)
      
      const allUsers = allStatsSnapshot.docs.map(doc => doc.data())
      
      // Calculate percentiles
      const punctualityRates = allUsers
        .map((u: any) => u.totalStamps > 0 ? (u.onTimeCount / u.totalStamps) * 100 : 0)
        .sort((a, b) => a - b)
      
      const userRate = userStats.totalStamps > 0 
        ? (userStats.onTimeCount / userStats.totalStamps) * 100 
        : 0
      
      const position = punctualityRates.findIndex(rate => rate >= userRate)
      const percentile = position >= 0 ? (position / punctualityRates.length) * 100 : 0
      
      // Calculate averages
      const avgOnTime = allUsers.reduce((sum: number, u: any) => sum + (u.onTimeCount || 0), 0) / allUsers.length
      const avgStreak = allUsers.reduce((sum: number, u: any) => sum + (u.currentStreak || 0), 0) / allUsers.length
      
      return {
        userRank: position + 1,
        percentile: Math.round(percentile),
        comparison: {
          yourOnTime: userStats.onTimeCount || 0,
          avgOnTime: Math.round(avgOnTime),
          yourStreak: userStats.currentStreak || 0,
          avgStreak: Math.round(avgStreak),
          yourRate: Math.round(userRate),
          avgRate: Math.round(punctualityRates.reduce((a, b) => a + b, 0) / punctualityRates.length)
        }
      }
    } catch (error) {
      console.error('Error getting comparative analysis:', error)
      return {}
    }
  }

  // ============ TIME SERIES DATA ============
  
  const getTimeSeriesData = async (userId: string, days: number = 30) => {
    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)
      
      const stampsQuery = query(
        collection($db, 'stamps'),
        where('userId', '==', userId)
      )
      
      const querySnapshot = await getDocs(stampsQuery)
      const timeSeriesData: any[] = []
      
      const dailyStats: any = {}
      
      querySnapshot.docs.forEach(doc => {
        const data = doc.data()
        const timestamp = data.timestamp?.toDate()
        if (timestamp && timestamp >= startDate) {
          const dateKey = timestamp.toISOString().split('T')[0]
          
          if (!dailyStats[dateKey]) {
            dailyStats[dateKey] = { date: dateKey, onTime: 0, late: 0, total: 0 }
          }
          
          dailyStats[dateKey].total++
          if (data.status === 'on-time') {
            dailyStats[dateKey].onTime++
          } else {
            dailyStats[dateKey].late++
          }
        }
      })
      
      // Fill in missing days with zeros
      for (let i = 0; i < days; i++) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const dateKey = date.toISOString().split('T')[0] || ''
        if (!dateKey) continue
        
        if (!dailyStats[dateKey]) {
          dailyStats[dateKey] = { date: dateKey, onTime: 0, late: 0, total: 0 }
        }
        
        timeSeriesData.push(dailyStats[dateKey])
      }
      
      return timeSeriesData.sort((a, b) => a.date.localeCompare(b.date))
    } catch (error) {
      console.error('Error getting time series data:', error)
      return []
    }
  }

  // ============ EXPORT REPORTS ============
  
  const generateDetailedReport = async (userId: string) => {
    try {
      const hourly = await getHourlyDistribution(userId)
      const weekly = await getWeeklyPattern(userId)
      const monthly = await getMonthlyTrends(userId)
      const performance = await getPerformanceMetrics(userId)
      const insights = await getPredictiveInsights(userId)
      const comparative = await getComparativeAnalysis(userId)
      
      return {
        generatedAt: new Date().toISOString(),
        userId,
        hourlyDistribution: hourly,
        weeklyPattern: weekly,
        monthlyTrends: monthly,
        performanceMetrics: performance,
        predictiveInsights: insights,
        comparativeAnalysis: comparative
      }
    } catch (error) {
      console.error('Error generating report:', error)
      throw error
    }
  }

  // Save report
  const saveReport = async (userId: string, reportData: any) => {
    try {
      await addDoc(collection($db, 'analyticsReports'), {
        userId,
        reportData,
        createdAt: Timestamp.now()
      })
      
      return true
    } catch (error) {
      console.error('Error saving report:', error)
      throw error
    }
  }

  return {
    // Distribution & Patterns
    getHourlyDistribution,
    getWeeklyPattern,
    getMonthlyTrends,
    
    // Performance
    getPerformanceMetrics,
    getCorrelationAnalysis,
    getPredictiveInsights,
    
    // Visualization
    getHeatMapData,
    getTimeSeriesData,
    
    // Comparison
    getComparativeAnalysis,
    
    // Reports
    generateDetailedReport,
    saveReport
  }
}
