<template>
  <div class="setup-container">
    <div class="setup-card">
      <div class="setup-icon">🚀</div>
      <h1>Tobias Stempelkarte Setup</h1>
      <p class="setup-description">
        Initialisiere dein Admin-Konto, um die App zu nutzen.
      </p>

      <div v-if="!user" class="info-box warning">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 9V13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M12 17H12.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M12 2L2 20H22L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <p>Du musst eingeloggt sein, um das Setup zu starten.</p>
        <NuxtLink to="/login" class="btn-primary">Zum Login</NuxtLink>
      </div>

      <div v-else>
        <div class="user-info">
          <div class="user-avatar">{{ userInitial }}</div>
          <div>
            <p class="user-email">{{ user.email }}</p>
            <p class="user-label">Aktueller Account</p>
          </div>
        </div>

        <div v-if="isAdmin" class="info-box success">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.709 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4881 2.02168 11.3363C2.16356 9.18455 2.99721 7.13631 4.39828 5.49706C5.79935 3.85781 7.69279 2.71537 9.79619 2.24013C11.8996 1.7649 14.1003 1.98232 16.07 2.85999" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M22 4L12 14.01L9 11.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <p><strong>Setup abgeschlossen! ✅</strong></p>
          <p>Du bist bereits als Admin registriert.</p>
          <NuxtLink to="/dashboard" class="btn-primary">Zum Dashboard</NuxtLink>
        </div>

        <div v-else>
          <div class="info-box info">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
              <path d="M12 16V12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              <path d="M12 8H12.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            <p>Klicke auf den Button unten, um dich als Admin zu registrieren.</p>
          </div>

          <button 
            @click="setupAdmin" 
            :disabled="loading"
            class="btn-setup"
          >
            <svg v-if="!loading" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M19.4 15C19.2669 15.3016 19.2272 15.6362 19.286 15.9606C19.3448 16.285 19.4995 16.5843 19.73 16.82L19.79 16.88C19.976 17.0657 20.1235 17.2863 20.2241 17.5291C20.3248 17.7719 20.3766 18.0322 20.3766 18.295C20.3766 18.5578 20.3248 18.8181 20.2241 19.0609C20.1235 19.3037 19.976 19.5243 19.79 19.71C19.6043 19.896 19.3837 20.0435 19.1409 20.1441C18.8981 20.2448 18.6378 20.2966 18.375 20.2966C18.1122 20.2966 17.8519 20.2448 17.6091 20.1441C17.3663 20.0435 17.1457 19.896 16.96 19.71L16.9 19.65C16.6643 19.4195 16.365 19.2648 16.0406 19.206C15.7162 19.1472 15.3816 19.1869 15.08 19.32C14.7842 19.4468 14.532 19.6572 14.3543 19.9255C14.1766 20.1938 14.0813 20.5082 14.08 20.83V21C14.08 21.5304 13.8693 22.0391 13.4942 22.4142C13.1191 22.7893 12.6104 23 12.08 23C11.5496 23 11.0409 22.7893 10.6658 22.4142C10.2907 22.0391 10.08 21.5304 10.08 21V20.91C10.0723 20.579 9.96512 20.258 9.77251 19.9887C9.5799 19.7194 9.31074 19.5143 9 19.4C8.69838 19.2669 8.36381 19.2272 8.03941 19.286C7.71502 19.3448 7.41568 19.4995 7.18 19.73L7.12 19.79C6.93425 19.976 6.71368 20.1235 6.47088 20.2241C6.22808 20.3248 5.96783 20.3766 5.705 20.3766C5.44217 20.3766 5.18192 20.3248 4.93912 20.2241C4.69632 20.1235 4.47575 19.976 4.29 19.79C4.10405 19.6043 3.95653 19.3837 3.85588 19.1409C3.75523 18.8981 3.70343 18.6378 3.70343 18.375C3.70343 18.1122 3.75523 17.8519 3.85588 17.6091C3.95653 17.3663 4.10405 17.1457 4.29 16.96L4.35 16.9C4.58054 16.6643 4.73519 16.365 4.794 16.0406C4.85282 15.7162 4.81312 15.3816 4.68 15.08C4.55324 14.7842 4.34276 14.532 4.07447 14.3543C3.80618 14.1766 3.49179 14.0813 3.17 14.08H3C2.46957 14.08 1.96086 13.8693 1.58579 13.4942C1.21071 13.1191 1 12.6104 1 12.08C1 11.5496 1.21071 11.0409 1.58579 10.6658C1.96086 10.2907 2.46957 10.08 3 10.08H3.09C3.42099 10.0723 3.742 9.96512 4.0113 9.77251C4.28059 9.5799 4.48572 9.31074 4.6 9C4.73312 8.69838 4.77282 8.36381 4.714 8.03941C4.65519 7.71502 4.50054 7.41568 4.27 7.18L4.21 7.12C4.02405 6.93425 3.87653 6.71368 3.77588 6.47088C3.67523 6.22808 3.62343 5.96783 3.62343 5.705C3.62343 5.44217 3.67523 5.18192 3.77588 4.93912C3.87653 4.69632 4.02405 4.47575 4.21 4.29C4.39575 4.10405 4.61632 3.95653 4.85912 3.85588C5.10192 3.75523 5.36217 3.70343 5.625 3.70343C5.88783 3.70343 6.14808 3.75523 6.39088 3.85588C6.63368 3.95653 6.85425 4.10405 7.04 4.29L7.1 4.35C7.33568 4.58054 7.63502 4.73519 7.95941 4.794C8.28381 4.85282 8.61838 4.81312 8.92 4.68H9C9.29577 4.55324 9.54802 4.34276 9.72569 4.07447C9.90337 3.80618 9.99872 3.49179 10 3.17V3C10 2.46957 10.2107 1.96086 10.5858 1.58579C10.9609 1.21071 11.4696 1 12 1C12.5304 1 13.0391 1.21071 13.4142 1.58579C13.7893 1.96086 14 2.46957 14 3V3.09C14.0013 3.41179 14.0966 3.72618 14.2743 3.99447C14.452 4.26276 14.7042 4.47324 15 4.6C15.3016 4.73312 15.6362 4.77282 15.9606 4.714C16.285 4.65519 16.5843 4.50054 16.82 4.27L16.88 4.21C17.0657 4.02405 17.2863 3.87653 17.5291 3.77588C17.7719 3.67523 18.0322 3.62343 18.295 3.62343C18.5578 3.62343 18.8181 3.67523 19.0609 3.77588C19.3037 3.87653 19.5243 4.02405 19.71 4.21C19.896 4.39575 20.0435 4.61632 20.1441 4.85912C20.2448 5.10192 20.2966 5.36217 20.2966 5.625C20.2966 5.88783 20.2448 6.14808 20.1441 6.39088C20.0435 6.63368 19.896 6.85425 19.71 7.04L19.65 7.1C19.4195 7.33568 19.2648 7.63502 19.206 7.95941C19.1472 8.28381 19.1869 8.61838 19.32 8.92V9C19.4468 9.29577 19.6572 9.54802 19.9255 9.72569C20.1938 9.90337 20.5082 9.99872 20.83 10H21C21.5304 10 22.0391 10.2107 22.4142 10.5858C22.7893 10.9609 23 11.4696 23 12C23 12.5304 22.7893 13.0391 22.4142 13.4142C22.0391 13.7893 21.5304 14 21 14H20.91C20.5882 14.0013 20.2738 14.0966 20.0055 14.2743C19.7372 14.452 19.5268 14.7042 19.4 15Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <div v-else class="spinner"></div>
            {{ loading ? 'Wird eingerichtet...' : 'Als Admin registrieren' }}
          </button>

          <div v-if="message" class="message" :class="messageType">
            {{ message }}
          </div>
        </div>
      </div>

      <div class="setup-footer">
        <NuxtLink to="/" class="link-back">← Zurück zur Startseite</NuxtLink>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
const { user } = useFirebaseAuth()
const { createAdmin, isUserAdmin } = useStempelCard()
const router = useRouter()

const loading = ref(false)
const isAdmin = ref(false)
const message = ref('')
const messageType = ref<'success' | 'error'>('success')

const userInitial = computed(() => {
  return user.value?.email?.charAt(0).toUpperCase() || 'U'
})

onMounted(async () => {
  if (user.value?.email) {
    isAdmin.value = await isUserAdmin(user.value.email)
  }
})

const setupAdmin = async () => {
  if (!user.value?.email) {
    message.value = 'Kein Benutzer eingeloggt!'
    messageType.value = 'error'
    return
  }

  loading.value = true
  message.value = ''

  try {
    const created = await createAdmin(user.value.email)
    
    if (created) {
      message.value = 'Admin-Account erfolgreich erstellt! 🎉'
      messageType.value = 'success'
      
      // Wait a moment then check admin status
      setTimeout(async () => {
        if (user.value?.email) {
          isAdmin.value = await isUserAdmin(user.value.email)
        }
        
        if (isAdmin.value) {
          setTimeout(() => {
            router.push('/dashboard')
          }, 1500)
        }
      }, 1000)
    } else {
      message.value = 'Du bist bereits Admin!'
      messageType.value = 'success'
      isAdmin.value = true
    }
  } catch (error) {
    console.error('Setup error:', error)
    message.value = 'Fehler beim Erstellen des Admin-Accounts. Prüfe die Firebase-Berechtigungen.'
    messageType.value = 'error'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.setup-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #EFFDF5 0%, #D9FBE8 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.setup-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 24px;
  padding: 3rem 2rem;
  max-width: 600px;
  width: 100%;
  box-shadow: 
    0 20px 60px rgba(0, 193, 106, 0.1),
    0 0 0 1px rgba(0, 193, 106, 0.1);
  animation: fadeIn 0.6s ease-out;
}

.setup-icon {
  font-size: 4rem;
  text-align: center;
  margin-bottom: 1rem;
  animation: bounce 2s ease-in-out infinite;
}

h1 {
  font-size: 2rem;
  font-weight: 700;
  text-align: center;
  background: linear-gradient(135deg, #00C16A 0%, #00DC82 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 1rem;
}

.setup-description {
  text-align: center;
  color: #6B7280;
  margin-bottom: 2rem;
  font-size: 1.125rem;
}

.info-box {
  padding: 1.5rem;
  border-radius: 16px;
  margin-bottom: 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  text-align: center;
}

.info-box svg {
  width: 48px;
  height: 48px;
  flex-shrink: 0;
}

.info-box.warning {
  background: #FEF3C7;
  border: 2px solid #FCD34D;
  color: #92400E;
}

.info-box.warning svg {
  color: #F59E0B;
}

.info-box.success {
  background: #D1FAE5;
  border: 2px solid #6EE7B7;
  color: #065F46;
}

.info-box.success svg {
  color: #10B981;
}

.info-box.info {
  background: #DBEAFE;
  border: 2px solid #93C5FD;
  color: #1E40AF;
}

.info-box.info svg {
  color: #3B82F6;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, #EFFDF5 0%, #D9FBE8 100%);
  border-radius: 16px;
  margin-bottom: 1.5rem;
}

.user-avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: linear-gradient(135deg, #00C16A 0%, #00DC82 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: 700;
  flex-shrink: 0;
}

.user-email {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1F2937;
}

.user-label {
  font-size: 0.875rem;
  color: #6B7280;
  margin-top: 0.25rem;
}

.btn-setup {
  width: 100%;
  padding: 1rem 2rem;
  background: linear-gradient(135deg, #00C16A 0%, #00DC82 100%);
  color: white;
  border: none;
  border-radius: 16px;
  font-size: 1.125rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  box-shadow: 0 4px 12px rgba(0, 193, 106, 0.3);
}

.btn-setup:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 193, 106, 0.4);
}

.btn-setup:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-setup svg {
  width: 24px;
  height: 24px;
}

.btn-primary {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #00C16A 0%, #00DC82 100%);
  color: white;
  text-decoration: none;
  border-radius: 12px;
  font-weight: 600;
  transition: all 0.3s ease;
  margin-top: 1rem;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 193, 106, 0.3);
}

.message {
  margin-top: 1rem;
  padding: 1rem;
  border-radius: 12px;
  text-align: center;
  font-weight: 500;
  animation: fadeIn 0.3s ease-out;
}

.message.success {
  background: #D1FAE5;
  color: #065F46;
  border: 2px solid #6EE7B7;
}

.message.error {
  background: #FEE2E2;
  color: #991B1B;
  border: 2px solid #FCA5A5;
}

.setup-footer {
  margin-top: 2rem;
  text-align: center;
}

.link-back {
  color: #6B7280;
  text-decoration: none;
  font-size: 0.875rem;
  transition: color 0.3s ease;
}

.link-back:hover {
  color: #00C16A;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 640px) {
  .setup-card {
    padding: 2rem 1.5rem;
  }

  h1 {
    font-size: 1.5rem;
  }

  .setup-icon {
    font-size: 3rem;
  }
}
</style>
