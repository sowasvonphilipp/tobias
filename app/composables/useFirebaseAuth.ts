import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  setPersistence, 
  browserLocalPersistence,
  type User 
} from 'firebase/auth'

export const useFirebaseAuth = () => {
  const { $auth } = useNuxtApp()
  const user = useState<User | null>('firebase-user', () => null)
  const loading = useState('firebase-loading', () => true)
  const error = useState<string | null>('firebase-error', () => null)
  const initialized = useState('firebase-initialized', () => false)

  const signIn = async (email: string, password: string) => {
    error.value = null
    loading.value = true
    try {
      // Ensure persistence is set to localStorage
      await setPersistence($auth, browserLocalPersistence)
      
      const userCredential = await signInWithEmailAndPassword($auth, email, password)
      user.value = userCredential.user
      
      // Store login state in localStorage for additional tracking
      if (process.client) {
        localStorage.setItem('isLoggedIn', 'true')
        localStorage.setItem('userEmail', userCredential.user.email || '')
      }
      
      return userCredential.user
    } catch (err: any) {
      const errorMessage = getErrorMessage(err.code)
      error.value = errorMessage
      throw new Error(errorMessage)
    } finally {
      loading.value = false
    }
  }

  const logout = async () => {
    try {
      await signOut($auth)
      user.value = null
      
      // Clear localStorage
      if (process.client) {
        localStorage.removeItem('isLoggedIn')
        localStorage.removeItem('userEmail')
      }
    } catch (err: any) {
      error.value = 'Fehler beim Abmelden'
      throw err
    }
  }

  const getErrorMessage = (code: string): string => {
    switch (code) {
      case 'auth/invalid-email':
        return 'Ungültige E-Mail-Adresse'
      case 'auth/user-disabled':
        return 'Dieser Benutzer wurde deaktiviert'
      case 'auth/user-not-found':
        return 'Benutzer nicht gefunden'
      case 'auth/wrong-password':
        return 'Falsches Passwort'
      case 'auth/invalid-credential':
        return 'Ungültige Anmeldedaten'
      case 'auth/too-many-requests':
        return 'Zu viele Anmeldeversuche. Bitte versuchen Sie es später erneut'
      case 'auth/network-request-failed':
        return 'Netzwerkfehler. Bitte überprüfen Sie Ihre Internetverbindung'
      default:
        return 'Ein Fehler ist aufgetreten'
    }
  }

  // Wait for auth initialization
  const waitForAuth = (): Promise<User | null> => {
    return new Promise((resolve) => {
      if (initialized.value) {
        resolve(user.value)
        return
      }

      const unsubscribe = onAuthStateChanged($auth, (firebaseUser) => {
        user.value = firebaseUser
        loading.value = false
        initialized.value = true
        unsubscribe()
        resolve(firebaseUser)
      })
    })
  }

  // Initialize auth state listener only once
  if (process.client && !initialized.value) {
    // Set persistence to localStorage on initialization
    setPersistence($auth, browserLocalPersistence).catch((error) => {
      console.error('Error setting persistence:', error)
    })

    onAuthStateChanged($auth, (firebaseUser) => {
      user.value = firebaseUser
      loading.value = false
      initialized.value = true
      
      // Sync with localStorage
      if (firebaseUser) {
        localStorage.setItem('isLoggedIn', 'true')
        localStorage.setItem('userEmail', firebaseUser.email || '')
      } else {
        localStorage.removeItem('isLoggedIn')
        localStorage.removeItem('userEmail')
      }
    })
  }

  return {
    user,
    loading,
    error,
    initialized,
    signIn,
    logout,
    waitForAuth
  }
}
