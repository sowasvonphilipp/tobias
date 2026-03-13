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

export const useSocial = () => {
  const { $db } = useNuxtApp()

  // ============ FRIENDS ============
  
  // Send friend request
  const sendFriendRequest = async (fromUserId: string, toUserId: string) => {
    try {
      const request = {
        fromUserId,
        toUserId,
        status: 'pending',
        createdAt: Timestamp.now()
      }
      
      const docRef = await addDoc(collection($db, 'friendRequests'), request)
      
      // Create notification for recipient
      await addDoc(collection($db, 'notifications'), {
        userId: toUserId,
        type: 'friend_request',
        fromUserId,
        read: false,
        createdAt: Timestamp.now()
      })
      
      return { id: docRef.id, ...request }
    } catch (error) {
      console.error('Error sending friend request:', error)
      throw error
    }
  }

  // Accept friend request
  const acceptFriendRequest = async (requestId: string) => {
    try {
      const requestRef = doc($db, 'friendRequests', requestId)
      const requestDoc = await getDoc(requestRef)
      
      if (!requestDoc.exists()) return false
      
      const requestData = requestDoc.data()
      
      // Create friendship
      await addDoc(collection($db, 'friendships'), {
        user1: requestData.fromUserId,
        user2: requestData.toUserId,
        createdAt: Timestamp.now()
      })
      
      // Update request status
      await updateDoc(requestRef, {
        status: 'accepted',
        acceptedAt: Timestamp.now()
      })
      
      // Notify sender
      await addDoc(collection($db, 'notifications'), {
        userId: requestData.fromUserId,
        type: 'friend_request_accepted',
        fromUserId: requestData.toUserId,
        read: false,
        createdAt: Timestamp.now()
      })
      
      return true
    } catch (error) {
      console.error('Error accepting friend request:', error)
      throw error
    }
  }

  // Reject friend request
  const rejectFriendRequest = async (requestId: string) => {
    try {
      const requestRef = doc($db, 'friendRequests', requestId)
      await updateDoc(requestRef, {
        status: 'rejected',
        rejectedAt: Timestamp.now()
      })
      return true
    } catch (error) {
      console.error('Error rejecting friend request:', error)
      throw error
    }
  }

  // Get friends
  const getFriends = async (userId: string) => {
    try {
      const friendshipsQuery = query(collection($db, 'friendships'))
      const querySnapshot = await getDocs(friendshipsQuery)
      
      return querySnapshot.docs
        .filter(doc => {
          const data = doc.data()
          return data.user1 === userId || data.user2 === userId
        })
        .map(doc => {
          const data = doc.data()
          return {
            id: doc.id,
            friendId: data.user1 === userId ? data.user2 : data.user1,
            ...data
          }
        })
    } catch (error) {
      console.error('Error getting friends:', error)
      return []
    }
  }

  // Remove friend
  const removeFriend = async (friendshipId: string) => {
    try {
      await deleteDoc(doc($db, 'friendships', friendshipId))
      return true
    } catch (error) {
      console.error('Error removing friend:', error)
      throw error
    }
  }

  // ============ GROUPS ============
  
  // Create group
  const createGroup = async (creatorId: string, groupData: any) => {
    try {
      const group = {
        ...groupData,
        creatorId,
        members: [creatorId],
        createdAt: Timestamp.now()
      }
      
      const docRef = await addDoc(collection($db, 'groups'), group)
      return { id: docRef.id, ...group }
    } catch (error) {
      console.error('Error creating group:', error)
      throw error
    }
  }

  // Get user groups
  const getUserGroups = async (userId: string) => {
    try {
      const groupsQuery = query(collection($db, 'groups'))
      const querySnapshot = await getDocs(groupsQuery)
      
      return querySnapshot.docs
        .filter(doc => {
          const data = doc.data()
          return data.members?.includes(userId)
        })
        .map(doc => ({ id: doc.id, ...doc.data() }))
    } catch (error) {
      console.error('Error getting groups:', error)
      return []
    }
  }

  // Add member to group
  const addGroupMember = async (groupId: string, userId: string) => {
    try {
      const groupRef = doc($db, 'groups', groupId)
      const groupDoc = await getDoc(groupRef)
      
      if (!groupDoc.exists()) return false
      
      const members = groupDoc.data().members || []
      if (!members.includes(userId)) {
        members.push(userId)
        await updateDoc(groupRef, { members })
      }
      
      return true
    } catch (error) {
      console.error('Error adding group member:', error)
      throw error
    }
  }

  // Remove member from group
  const removeGroupMember = async (groupId: string, userId: string) => {
    try {
      const groupRef = doc($db, 'groups', groupId)
      const groupDoc = await getDoc(groupRef)
      
      if (!groupDoc.exists()) return false
      
      const members = groupDoc.data().members || []
      const updatedMembers = members.filter((id: string) => id !== userId)
      await updateDoc(groupRef, { members: updatedMembers })
      
      return true
    } catch (error) {
      console.error('Error removing group member:', error)
      throw error
    }
  }

  // ============ SHARING ============
  
  // Share achievement
  const shareAchievement = async (userId: string, achievementData: any, shareWith: string[]) => {
    try {
      const share = {
        userId,
        type: 'achievement',
        data: achievementData,
        sharedWith: shareWith,
        likes: [],
        comments: [],
        createdAt: Timestamp.now()
      }
      
      const docRef = await addDoc(collection($db, 'shares'), share)
      
      // Notify recipients
      for (const recipientId of shareWith) {
        await addDoc(collection($db, 'notifications'), {
          userId: recipientId,
          type: 'share',
          fromUserId: userId,
          shareId: docRef.id,
          read: false,
          createdAt: Timestamp.now()
        })
      }
      
      return { id: docRef.id, ...share }
    } catch (error) {
      console.error('Error sharing achievement:', error)
      throw error
    }
  }

  // Share stats
  const shareStats = async (userId: string, statsData: any, shareWith: string[]) => {
    try {
      const share = {
        userId,
        type: 'stats',
        data: statsData,
        sharedWith: shareWith,
        likes: [],
        comments: [],
        createdAt: Timestamp.now()
      }
      
      const docRef = await addDoc(collection($db, 'shares'), share)
      return { id: docRef.id, ...share }
    } catch (error) {
      console.error('Error sharing stats:', error)
      throw error
    }
  }

  // Get shared content
  const getSharedContent = async (userId: string) => {
    try {
      const sharesQuery = query(collection($db, 'shares'))
      const querySnapshot = await getDocs(sharesQuery)
      
      return querySnapshot.docs
        .filter(doc => {
          const data = doc.data()
          return data.sharedWith?.includes(userId) || data.userId === userId
        })
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a: any, b: any) => {
          const aTime = a.createdAt?.seconds || 0
          const bTime = b.createdAt?.seconds || 0
          return bTime - aTime
        })
    } catch (error) {
      console.error('Error getting shared content:', error)
      return []
    }
  }

  // ============ LIKES & COMMENTS ============
  
  // Like share
  const likeShare = async (shareId: string, userId: string) => {
    try {
      const shareRef = doc($db, 'shares', shareId)
      const shareDoc = await getDoc(shareRef)
      
      if (!shareDoc.exists()) return false
      
      const likes = shareDoc.data().likes || []
      if (!likes.includes(userId)) {
        likes.push(userId)
        await updateDoc(shareRef, { likes })
        
        // Notify share owner
        const shareData = shareDoc.data()
        if (shareData.userId !== userId) {
          await addDoc(collection($db, 'notifications'), {
            userId: shareData.userId,
            type: 'like',
            fromUserId: userId,
            shareId,
            read: false,
            createdAt: Timestamp.now()
          })
        }
      }
      
      return true
    } catch (error) {
      console.error('Error liking share:', error)
      throw error
    }
  }

  // Unlike share
  const unlikeShare = async (shareId: string, userId: string) => {
    try {
      const shareRef = doc($db, 'shares', shareId)
      const shareDoc = await getDoc(shareRef)
      
      if (!shareDoc.exists()) return false
      
      const likes = shareDoc.data().likes || []
      const updatedLikes = likes.filter((id: string) => id !== userId)
      await updateDoc(shareRef, { likes: updatedLikes })
      
      return true
    } catch (error) {
      console.error('Error unliking share:', error)
      throw error
    }
  }

  // Add comment
  const addComment = async (shareId: string, userId: string, commentText: string) => {
    try {
      const comment = {
        userId,
        text: commentText,
        createdAt: Timestamp.now()
      }
      
      const shareRef = doc($db, 'shares', shareId)
      const shareDoc = await getDoc(shareRef)
      
      if (!shareDoc.exists()) return false
      
      const comments = shareDoc.data().comments || []
      comments.push(comment)
      await updateDoc(shareRef, { comments })
      
      // Notify share owner
      const shareData = shareDoc.data()
      if (shareData.userId !== userId) {
        await addDoc(collection($db, 'notifications'), {
          userId: shareData.userId,
          type: 'comment',
          fromUserId: userId,
          shareId,
          read: false,
          createdAt: Timestamp.now()
        })
      }
      
      return true
    } catch (error) {
      console.error('Error adding comment:', error)
      throw error
    }
  }

  // ============ CHALLENGES ============
  
  // Create challenge
  const createChallenge = async (userId: string, challengeData: any) => {
    try {
      const challenge = {
        creatorId: userId,
        ...challengeData,
        participants: [userId],
        status: 'active',
        createdAt: Timestamp.now()
      }
      
      const docRef = await addDoc(collection($db, 'challenges'), challenge)
      return { id: docRef.id, ...challenge }
    } catch (error) {
      console.error('Error creating challenge:', error)
      throw error
    }
  }

  // Join challenge
  const joinChallenge = async (challengeId: string, userId: string) => {
    try {
      const challengeRef = doc($db, 'challenges', challengeId)
      const challengeDoc = await getDoc(challengeRef)
      
      if (!challengeDoc.exists()) return false
      
      const participants = challengeDoc.data().participants || []
      if (!participants.includes(userId)) {
        participants.push(userId)
        await updateDoc(challengeRef, { participants })
      }
      
      return true
    } catch (error) {
      console.error('Error joining challenge:', error)
      throw error
    }
  }

  // Get active challenges
  const getActiveChallenges = async () => {
    try {
      const challengesQuery = query(
        collection($db, 'challenges'),
        where('status', '==', 'active')
      )
      
      const querySnapshot = await getDocs(challengesQuery)
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    } catch (error) {
      console.error('Error getting active challenges:', error)
      return []
    }
  }

  // Complete challenge
  const completeChallenge = async (challengeId: string, userId: string, result: any) => {
    try {
      await addDoc(collection($db, 'challengeResults'), {
        challengeId,
        userId,
        result,
        completedAt: Timestamp.now()
      })
      
      return true
    } catch (error) {
      console.error('Error completing challenge:', error)
      throw error
    }
  }

  // Get challenge leaderboard
  const getChallengeLeaderboard = async (challengeId: string) => {
    try {
      const resultsQuery = query(
        collection($db, 'challengeResults'),
        where('challengeId', '==', challengeId)
      )
      
      const querySnapshot = await getDocs(resultsQuery)
      return querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a: any, b: any) => (b.result?.score || 0) - (a.result?.score || 0))
    } catch (error) {
      console.error('Error getting challenge leaderboard:', error)
      return []
    }
  }

  // ============ COMPARISONS ============
  
  // Compare with friend
  const compareWithFriend = async (userId: string, friendId: string) => {
    try {
      // Get both users' stats
      const userStatsDoc = await getDoc(doc($db, 'userStats', userId))
      const friendStatsDoc = await getDoc(doc($db, 'userStats', friendId))
      
      if (!userStatsDoc.exists() || !friendStatsDoc.exists()) {
        return null
      }
      
      const userStats = userStatsDoc.data()
      const friendStats = friendStatsDoc.data()
      
      return {
        user: {
          id: userId,
          totalStamps: userStats.totalStamps || 0,
          currentStreak: userStats.currentStreak || 0,
          longestStreak: userStats.longestStreak || 0,
          punctualityRate: userStats.punctualityRate || 0
        },
        friend: {
          id: friendId,
          totalStamps: friendStats.totalStamps || 0,
          currentStreak: friendStats.currentStreak || 0,
          longestStreak: friendStats.longestStreak || 0,
          punctualityRate: friendStats.punctualityRate || 0
        },
        comparison: {
          stampsDifference: (userStats.totalStamps || 0) - (friendStats.totalStamps || 0),
          streakDifference: (userStats.currentStreak || 0) - (friendStats.currentStreak || 0),
          punctualityDifference: (userStats.punctualityRate || 0) - (friendStats.punctualityRate || 0)
        }
      }
    } catch (error) {
      console.error('Error comparing with friend:', error)
      return null
    }
  }

  // Get friend rankings
  const getFriendRankings = async (userId: string) => {
    try {
      const friends = await getFriends(userId)
      const rankings: any[] = []
      
      for (const friend of friends) {
        const statsDoc = await getDoc(doc($db, 'userStats', friend.friendId))
        if (statsDoc.exists()) {
          rankings.push({
            userId: friend.friendId,
            ...statsDoc.data()
          })
        }
      }
      
      // Add current user
      const userStatsDoc = await getDoc(doc($db, 'userStats', userId))
      if (userStatsDoc.exists()) {
        rankings.push({
          userId,
          ...userStatsDoc.data()
        })
      }
      
      return rankings.sort((a, b) => (b.totalStamps || 0) - (a.totalStamps || 0))
    } catch (error) {
      console.error('Error getting friend rankings:', error)
      return []
    }
  }

  // ============ MESSAGES ============
  
  // Send message
  const sendMessage = async (fromUserId: string, toUserId: string, messageText: string) => {
    try {
      const message = {
        fromUserId,
        toUserId,
        text: messageText,
        read: false,
        createdAt: Timestamp.now()
      }
      
      const docRef = await addDoc(collection($db, 'messages'), message)
      
      // Create notification
      await addDoc(collection($db, 'notifications'), {
        userId: toUserId,
        type: 'message',
        fromUserId,
        read: false,
        createdAt: Timestamp.now()
      })
      
      return { id: docRef.id, ...message }
    } catch (error) {
      console.error('Error sending message:', error)
      throw error
    }
  }

  // Get messages
  const getMessages = async (userId: string, otherUserId: string) => {
    try {
      const messagesQuery = query(collection($db, 'messages'))
      const querySnapshot = await getDocs(messagesQuery)
      
      return querySnapshot.docs
        .filter(doc => {
          const data = doc.data()
          return (
            (data.fromUserId === userId && data.toUserId === otherUserId) ||
            (data.fromUserId === otherUserId && data.toUserId === userId)
          )
        })
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a: any, b: any) => {
          const aTime = a.createdAt?.seconds || 0
          const bTime = b.createdAt?.seconds || 0
          return aTime - bTime
        })
    } catch (error) {
      console.error('Error getting messages:', error)
      return []
    }
  }

  // Mark message as read
  const markMessageRead = async (messageId: string) => {
    try {
      const messageRef = doc($db, 'messages', messageId)
      await updateDoc(messageRef, {
        read: true,
        readAt: Timestamp.now()
      })
      return true
    } catch (error) {
      console.error('Error marking message as read:', error)
      throw error
    }
  }

  return {
    // Friends
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    getFriends,
    removeFriend,
    
    // Groups
    createGroup,
    getUserGroups,
    addGroupMember,
    removeGroupMember,
    
    // Sharing
    shareAchievement,
    shareStats,
    getSharedContent,
    
    // Likes & Comments
    likeShare,
    unlikeShare,
    addComment,
    
    // Challenges
    createChallenge,
    joinChallenge,
    getActiveChallenges,
    completeChallenge,
    getChallengeLeaderboard,
    
    // Comparisons
    compareWithFriend,
    getFriendRankings,
    
    // Messages
    sendMessage,
    getMessages,
    markMessageRead
  }
}
