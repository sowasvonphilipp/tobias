<template>
  <div class="login-container">
    <!-- Decorative Background Elements -->
    <div class="bg-decoration">
      <div class="circle circle-1"></div>
      <div class="circle circle-2"></div>
      <div class="circle circle-3"></div>
    </div>

    <div class="login-card">
      <!-- Logo/Icon Area -->
      <div class="logo-area">
        <div class="logo-circle">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
      </div>

      <div class="login-header">
        <h1>Willkommen zurück, Tobias! 👋</h1>
        <p>Bereit für eine neue Runde Pünktlichkeit?</p>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label for="email">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M22 6L12 13L2 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            E-Mail
          </label>
          <input
            id="email"
            v-model="email"
            type="email"
            placeholder="tobias@example.com"
            required
            autocomplete="email"
            :disabled="loading"
          />
        </div>

        <div class="form-group">
          <label for="password">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M7 11V7C7 5.67392 7.52678 4.40215 8.46447 3.46447C9.40215 2.52678 10.6739 2 12 2C13.3261 2 14.5979 2.52678 15.5355 3.46447C16.4732 4.40215 17 5.67392 17 7V11" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Passwort
          </label>
          <input
            id="password"
            v-model="password"
            type="password"
            placeholder="••••••••"
            required
            autocomplete="current-password"
            :disabled="loading"
          />
        </div>

        <div v-if="errorMessage" class="error-message">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
            <path d="M12 8V12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <path d="M12 16H12.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          {{ errorMessage }}
        </div>

        <button type="submit" class="login-button" :disabled="loading">
          <span v-if="!loading">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M10 17L15 12L10 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M15 12H3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Anmelden
          </span>
          <span v-else class="loading-spinner">
            <div class="spinner"></div>
            Lädt...
          </span>
        </button>
      </form>

      <div class="footer-links">
        <NuxtLink to="/datenschutz">Datenschutz</NuxtLink>
        <span class="separator">•</span>
        <NuxtLink to="/tos">AGB</NuxtLink>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
const email = ref('')
const password = ref('')
const errorMessage = ref('')
const loading = ref(false)

const { signIn } = useFirebaseAuth()
const router = useRouter()

const handleLogin = async () => {
  if (!email.value || !password.value) {
    errorMessage.value = 'Bitte fülle alle Felder aus'
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    await signIn(email.value, password.value)
    // Redirect to dashboard after successful login
    router.push('/dashboard')
  } catch (err: any) {
    errorMessage.value = err.message
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  width: 100%;
  position: relative;
  overflow: hidden;
}

/* Decorative Background */
.bg-decoration {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.circle {
  position: absolute;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(0, 220, 130, 0.1), rgba(117, 237, 174, 0.1));
  animation: float 20s infinite ease-in-out;
}

.circle-1 {
  width: 300px;
  height: 300px;
  top: -100px;
  right: -100px;
  animation-delay: 0s;
}

.circle-2 {
  width: 200px;
  height: 200px;
  bottom: -50px;
  left: -50px;
  animation-delay: 5s;
}

.circle-3 {
  width: 150px;
  height: 150px;
  top: 50%;
  left: 10%;
  animation-delay: 10s;
}

@keyframes float {
  0%, 100% {
    transform: translate(0, 0) scale(1);
  }
  33% {
    transform: translate(30px, -30px) scale(1.1);
  }
  66% {
    transform: translate(-20px, 20px) scale(0.9);
  }
}

.login-card {
  max-width: 480px;
  width: 100%;
  padding: 3rem;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(20px);
  border-radius: 32px;
  box-shadow: 
    0 20px 25px -5px rgba(0, 193, 106, 0.15),
    0 10px 10px -5px rgba(0, 193, 106, 0.08),
    0 0 0 1px rgba(0, 220, 130, 0.1);
  animation: fadeInUp 0.6s ease-out;
  position: relative;
  z-index: 1;
}

/* Logo Area */
.logo-area {
  display: flex;
  justify-content: center;
  margin-bottom: 1.5rem;
  animation: fadeInDown 0.6s ease-out;
}

.logo-circle {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #00C16A 0%, #00DC82 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 16px rgba(0, 220, 130, 0.3);
  animation: pulse 2s infinite;
}

.logo-circle svg {
  width: 40px;
  height: 40px;
  color: white;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 8px 16px rgba(0, 220, 130, 0.3);
  }
  50% {
    transform: scale(1.05);
    box-shadow: 0 12px 24px rgba(0, 220, 130, 0.4);
  }
}

.login-header {
  text-align: center;
  margin-bottom: 2.5rem;
  animation: fadeIn 0.6s ease-out 0.2s backwards;
}

.login-header h1 {
  font-size: 2rem;
  font-weight: 800;
  background: linear-gradient(135deg, #00C16A 0%, #00DC82 50%, #75EDAE 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 0.75rem;
  line-height: 1.2;
}

.login-header p {
  color: #007F45;
  font-size: 1.05rem;
  font-weight: 500;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
  animation: fadeIn 0.6s ease-out 0.4s backwards;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.form-group label {
  font-weight: 600;
  color: #016538;
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.form-group label svg {
  width: 18px;
  height: 18px;
  color: #00C16A;
}

.form-group input {
  padding: 1rem 1.25rem;
  border: 2px solid #D9FBE8;
  border-radius: 16px;
  font-size: 1rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: white;
  color: #0A5331;
  font-family: inherit;
}

.form-group input:focus {
  outline: none;
  border-color: #00DC82;
  box-shadow: 
    0 0 0 4px rgba(0, 220, 130, 0.1),
    0 4px 6px -1px rgba(0, 193, 106, 0.1);
  transform: translateY(-2px);
}

.form-group input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background: #F9FAFB;
}

.form-group input::placeholder {
  color: #B3F5D1;
}

.error-message {
  padding: 1rem 1.25rem;
  background: linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%);
  border: 2px solid #FCA5A5;
  border-radius: 16px;
  color: #DC2626;
  font-size: 0.95rem;
  font-weight: 600;
  animation: shake 0.4s ease, fadeIn 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.error-message svg {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.login-button {
  padding: 1.125rem 1.5rem;
  background: linear-gradient(135deg, #00C16A 0%, #00DC82 100%);
  color: white;
  border: none;
  border-radius: 16px;
  font-size: 1.125rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 
    0 4px 6px -1px rgba(0, 193, 106, 0.3), 
    0 2px 4px -1px rgba(0, 193, 106, 0.2);
  margin-top: 0.5rem;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
}

.login-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #00DC82 0%, #75EDAE 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.login-button span {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.login-button svg {
  width: 20px;
  height: 20px;
}

.login-button:hover:not(:disabled) {
  transform: translateY(-3px);
  box-shadow: 
    0 12px 20px -5px rgba(0, 193, 106, 0.4),
    0 4px 6px -2px rgba(0, 193, 106, 0.2);
}

.login-button:hover:not(:disabled)::before {
  opacity: 1;
}

.login-button:active:not(:disabled) {
  transform: translateY(-1px);
}

.login-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.loading-spinner {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.footer-links {
  margin-top: 2.5rem;
  padding-top: 2rem;
  border-top: 2px solid #EFFDF5;
  text-align: center;
  font-size: 0.9rem;
  color: #007F45;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
}

.footer-links a {
  color: #00C16A;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.2s ease;
  position: relative;
}

.footer-links a::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 0;
  height: 2px;
  background: linear-gradient(90deg, #00C16A, #00DC82);
  transition: width 0.3s ease;
}

.footer-links a:hover {
  color: #00DC82;
}

.footer-links a:hover::after {
  width: 100%;
}

.separator {
  color: #B3F5D1;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
  20%, 40%, 60%, 80% { transform: translateX(5px); }
}

/* Mobile Optimization */
@media (max-width: 768px) {
  .login-card {
    padding: 2.5rem;
    border-radius: 24px;
  }

  .logo-circle {
    width: 70px;
    height: 70px;
  }

  .logo-circle svg {
    width: 35px;
    height: 35px;
  }

  .login-header h1 {
    font-size: 1.75rem;
  }

  .login-header p {
    font-size: 0.975rem;
  }

  .circle {
    opacity: 0.5;
  }
}

@media (max-width: 480px) {
  .login-container {
    padding: 0.75rem;
  }

  .login-card {
    padding: 2rem;
    border-radius: 20px;
  }

  .logo-circle {
    width: 60px;
    height: 60px;
  }

  .logo-circle svg {
    width: 30px;
    height: 30px;
  }

  .login-header h1 {
    font-size: 1.5rem;
  }

  .form-group input {
    padding: 0.875rem 1rem;
  }

  .login-button {
    font-size: 1rem;
    padding: 1rem;
  }

  .footer-links {
    font-size: 0.85rem;
    flex-wrap: wrap;
  }
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  .login-card,
  .logo-area,
  .login-header,
  .login-form,
  .error-message,
  .circle {
    animation: none;
  }

  .login-button,
  .form-group input,
  .footer-links a {
    transition: none;
  }
  
  .logo-circle {
    animation: none;
  }
}
</style>
