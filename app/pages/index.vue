<template>
  <div class="page-container">
    <div class="content-wrapper">
      <div class="title">
        <h1>Tobias Stempelkarte</h1>
      </div>
      <div class="subtitle">
        <p>Wirst du es jemals schaffen pünktlich zu sein?</p>
      </div>
      <div class="button">
        <Button variant="primary" size="lg" @click="$router.push('/login')">
          Log dich doch endlich an 🙏
        </Button>
      </div>
      <div class="setup-link">
        <NuxtLink to="/setup">⚙️ Ersteinrichtung</NuxtLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  width: 100%;
}

.content-wrapper {
  max-width: 800px;
  width: 100%;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  border-radius: 24px;
  box-shadow: 0 20px 25px -5px rgba(0, 193, 106, 0.1),
              0 10px 10px -5px rgba(0, 193, 106, 0.04);
  border: 1px solid rgba(0, 220, 130, 0.1);
}

.title {
  text-align: center;
  margin-bottom: 1.5rem;
  animation: fadeInDown 0.8s ease-out;
}

.title h1 {
  font-size: clamp(2rem, 6vw, 4rem);
  font-weight: 800;
  background: linear-gradient(135deg, #00C16A 0%, #00DC82 50%, #75EDAE 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.02em;
  line-height: 1.2;
  margin: 0;
}

.subtitle {
  text-align: center;
  margin-bottom: 2.5rem;
  animation: fadeInUp 0.8s ease-out 0.2s backwards;
}

.subtitle p {
  font-size: clamp(1rem, 2.5vw, 1.5rem);
  color: #007F45;
  font-weight: 500;
  margin: 0;
  line-height: 1.6;
  padding: 0 1rem;
}

.button {
  text-align: center;
  animation: fadeInUp 0.8s ease-out 0.4s backwards;
}

.button :deep(button) {
  font-size: clamp(0.9rem, 2vw, 1.125rem);
  font-weight: 600;
  padding: 1rem 2.5rem;
  border-radius: 12px;
  background: linear-gradient(135deg, #00C16A 0%, #00DC82 100%);
  color: white;
  border: none;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 6px -1px rgba(0, 193, 106, 0.2), 
              0 2px 4px -1px rgba(0, 193, 106, 0.1);
  position: relative;
  overflow: hidden;
  width: 100%;
  max-width: 400px;
}

.button :deep(button::before) {
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

.button :deep(button:hover) {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(0, 193, 106, 0.3),
              0 4px 6px -2px rgba(0, 193, 106, 0.15);
}

.button :deep(button:hover::before) {
  opacity: 1;
}

.button :deep(button:active) {
  transform: translateY(0);
}

.setup-link {
  text-align: center;
  margin-top: 1.5rem;
  animation: fadeInUp 0.8s ease-out 0.6s backwards;
}

.setup-link a {
  color: #6B7280;
  text-decoration: none;
  font-size: 0.9rem;
  transition: color 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.setup-link a:hover {
  color: #00C16A;
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
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

/* Mobile Optimization */
@media (max-width: 768px) {
  .content-wrapper {
    padding: 1.5rem;
    border-radius: 16px;
  }

  .title h1 {
    font-size: 2rem;
  }

  .subtitle {
    margin-bottom: 2rem;
  }

  .subtitle p {
    font-size: 1rem;
  }

  .button :deep(button) {
    padding: 0.875rem 2rem;
    font-size: 0.9rem;
  }
}

@media (max-width: 480px) {
  .page-container {
    padding: 0.5rem;
  }

  .content-wrapper {
    padding: 1.25rem;
  }

  .title h1 {
    font-size: 1.75rem;
  }

  .subtitle p {
    font-size: 0.95rem;
    padding: 0 0.5rem;
  }

  .button :deep(button) {
    padding: 0.75rem 1.5rem;
    width: 100%;
  }
}

/* Tablet Landscape */
@media (min-width: 769px) and (max-width: 1024px) {
  .content-wrapper {
    max-width: 700px;
  }
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  .title,
  .subtitle,
  .button {
    animation: none;
  }

  .button :deep(button) {
    transition: none;
  }
}
</style>