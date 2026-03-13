<template>
  <div class="legal-container">
    <div class="legal-content">
      <div class="header">
        <NuxtLink to="/login" class="back-link">← Zurück</NuxtLink>
        <h1>Datenschutzerklärung</h1>
        <p class="last-updated">Stand: März 2026</p>
      </div>

      <section>
        <h2>1. Verantwortlicher</h2>
        <p>
          Verantwortlich für die Datenverarbeitung auf dieser Website ist:
        </p>
        <p class="contact-info">
          Tobias Stempelkarte<br>
          E-Mail: datenschutz@tobiasstempelcard.de
        </p>
      </section>

      <section>
        <h2>2. Datenerfassung</h2>
        <h3>Firebase Authentication</h3>
        <p>
          Wir nutzen Firebase Authentication von Google zur Verwaltung von Benutzerkonten. 
          Dabei werden folgende Daten verarbeitet:
        </p>
        <ul>
          <li>E-Mail-Adresse</li>
          <li>Verschlüsseltes Passwort</li>
          <li>Zeitstempel der Anmeldung</li>
          <li>IP-Adresse (für Sicherheitszwecke)</li>
        </ul>
      </section>

      <section>
        <h2>3. Zweck der Datenverarbeitung</h2>
        <p>Die Verarbeitung Ihrer Daten erfolgt zu folgenden Zwecken:</p>
        <ul>
          <li>Bereitstellung und Verwaltung Ihres Benutzerkontos</li>
          <li>Authentifizierung und Zugriffskontrolle</li>
          <li>Sicherstellung der Systemsicherheit</li>
          <li>Erfüllung gesetzlicher Verpflichtungen</li>
        </ul>
      </section>

      <section>
        <h2>4. Rechtsgrundlage</h2>
        <p>
          Die Verarbeitung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. b DSGVO 
          (Vertragserfüllung) sowie Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse 
          an der Systemsicherheit).
        </p>
      </section>

      <section>
        <h2>5. Speicherdauer</h2>
        <p>
          Ihre Daten werden gespeichert, solange Ihr Benutzerkonto besteht. 
          Nach Löschung des Kontos werden Ihre Daten innerhalb von 30 Tagen vollständig entfernt.
        </p>
      </section>

      <section>
        <h2>6. Ihre Rechte</h2>
        <p>Sie haben folgende Rechte:</p>
        <ul>
          <li>Auskunft über Ihre gespeicherten Daten (Art. 15 DSGVO)</li>
          <li>Berichtigung unrichtiger Daten (Art. 16 DSGVO)</li>
          <li>Löschung Ihrer Daten (Art. 17 DSGVO)</li>
          <li>Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
          <li>Datenübertragbarkeit (Art. 20 DSGVO)</li>
          <li>Widerspruch gegen die Verarbeitung (Art. 21 DSGVO)</li>
        </ul>
      </section>

      <section>
        <h2>7. Google Analytics</h2>
        <p>
          Wir verwenden Firebase Analytics zur Analyse der Websitenutzung. 
          Die Datenverarbeitung erfolgt anonymisiert. Sie können der Datenerfassung 
          durch Analytics widersprechen.
        </p>
      </section>

      <section>
        <h2>8. Datensicherheit</h2>
        <p>
          Wir setzen technische und organisatorische Sicherheitsmaßnahmen ein, 
          um Ihre Daten gegen zufällige oder vorsätzliche Manipulation, Verlust, 
          Zerstörung oder Zugriff unberechtigter Personen zu schützen.
        </p>
      </section>

      <section>
        <h2>9. Kontakt</h2>
        <p>
          Bei Fragen zum Datenschutz können Sie uns jederzeit kontaktieren:<br>
          E-Mail: datenschutz@tobiasstempelcard.de
        </p>
      </section>
    </div>
  </div>
</template>

<style scoped>
.legal-container {
  min-height: 100vh;
  padding: 2rem 1rem;
  width: 100%;
}

.legal-content {
  max-width: 800px;
  margin: 0 auto;
  padding: 2.5rem;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 24px;
  box-shadow: 0 20px 25px -5px rgba(0, 193, 106, 0.1),
              0 10px 10px -5px rgba(0, 193, 106, 0.04);
  border: 1px solid rgba(0, 220, 130, 0.1);
  animation: fadeInUp 0.6s ease-out;
}

.header {
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 2px solid #D9FBE8;
}

.back-link {
  display: inline-block;
  color: #00C16A;
  text-decoration: none;
  font-weight: 600;
  font-size: 0.925rem;
  margin-bottom: 1rem;
  transition: color 0.2s ease;
}

.back-link:hover {
  color: #00DC82;
}

.header h1 {
  font-size: 2.5rem;
  font-weight: 800;
  background: linear-gradient(135deg, #00C16A 0%, #00DC82 50%, #75EDAE 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 0.5rem;
  line-height: 1.2;
}

.last-updated {
  color: #007F45;
  font-size: 0.925rem;
  font-weight: 500;
}

section {
  margin-bottom: 2rem;
}

h2 {
  color: #016538;
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
  margin-top: 1.5rem;
}

h3 {
  color: #007F45;
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  margin-top: 1rem;
}

p {
  color: #0A5331;
  line-height: 1.7;
  margin-bottom: 1rem;
  font-size: 1rem;
}

.contact-info {
  padding: 1rem;
  background: #EFFDF5;
  border-left: 4px solid #00DC82;
  border-radius: 8px;
  font-weight: 500;
}

ul {
  margin-left: 1.5rem;
  margin-bottom: 1rem;
}

li {
  color: #0A5331;
  line-height: 1.8;
  margin-bottom: 0.5rem;
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
  .legal-content {
    padding: 2rem;
  }

  .header h1 {
    font-size: 2rem;
  }

  h2 {
    font-size: 1.25rem;
  }

  p, li {
    font-size: 0.95rem;
  }
}

@media (max-width: 480px) {
  .legal-container {
    padding: 1rem 0.5rem;
  }

  .legal-content {
    padding: 1.5rem;
    border-radius: 16px;
  }

  .header h1 {
    font-size: 1.75rem;
  }

  h2 {
    font-size: 1.125rem;
  }

  ul {
    margin-left: 1rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .legal-content {
    animation: none;
  }
}
</style>
