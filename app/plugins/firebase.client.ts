import { initializeApp } from 'firebase/app'
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth'
import { getAnalytics } from 'firebase/analytics'
import { getFirestore } from 'firebase/firestore'

export default defineNuxtPlugin(async () => {
  const firebaseConfig = {
    apiKey: "AIzaSyBL03nDPuy5U06KJ63tq3g8YcIh70v_AWE",
    authDomain: "tobiasstempelcard.firebaseapp.com",
    projectId: "tobiasstempelcard",
    storageBucket: "tobiasstempelcard.firebasestorage.app",
    messagingSenderId: "446284425147",
    appId: "1:446284425147:web:7bdd0720fd3049205fc69e",
    measurementId: "G-6KV1M7JKMC"
  }

  // Initialize Firebase
  const app = initializeApp(firebaseConfig)
  const auth = getAuth(app)
  const db = getFirestore(app)
  
  // Set persistence to localStorage for "stay logged in" functionality
  if (process.client) {
    try {
      await setPersistence(auth, browserLocalPersistence)
    } catch (error) {
      console.error('Error setting Firebase persistence:', error)
    }
  }
  
  // Analytics only in browser
  let analytics = null
  if (process.client) {
    analytics = getAnalytics(app)
  }

  return {
    provide: {
      firebase: app,
      auth,
      analytics,
      db
    }
  }
})
