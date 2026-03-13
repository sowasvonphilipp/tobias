<template>
  <div class="legal-container">
    <div class="legal-content">
      <div class="header">
        <NuxtLink to="/login" class="back-link">← Zurück</NuxtLink>
        <h1>Allgemeine Geschäftsbedingungen</h1>
        <p class="last-updated">Stand: März 2026</p>
      </div>

      <section>
        <h2>1. Geltungsbereich</h2>
        <p>
          Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für die Nutzung 
          der Tobias Stempelkarte Plattform. Mit der Registrierung und Nutzung 
          des Dienstes akzeptieren Sie diese Bedingungen.
        </p>
      </section>

      <section>
        <h2>2. Leistungsbeschreibung</h2>
        <p>
          Tobias Stempelkarte ist eine digitale Plattform zur Zeiterfassung 
          und Anwesenheitsverwaltung. Der Dienst umfasst:
        </p>
        <ul>
          <li>Benutzerauthentifizierung und -verwaltung</li>
          <li>Digitale Stempelkarten-Funktionalität</li>
          <li>Zeiterfassung und Auswertungen</li>
          <li>Datenspeicherung und -verwaltung</li>
        </ul>
      </section>

      <section>
        <h2>3. Registrierung und Nutzerkonto</h2>
        <p>
          Für die Nutzung des Dienstes ist eine Registrierung erforderlich. 
          Sie verpflichten sich:
        </p>
        <ul>
          <li>Wahrheitsgemäße Angaben bei der Registrierung zu machen</li>
          <li>Ihre Zugangsdaten vertraulich zu behandeln</li>
          <li>Unbefugte Nutzung Ihres Kontos zu verhindern</li>
          <li>Verdächtige Aktivitäten unverzüglich zu melden</li>
        </ul>
      </section>

      <section>
        <h2>4. Pflichten des Nutzers</h2>
        <p>Als Nutzer verpflichten Sie sich:</p>
        <ul>
          <li>Den Dienst nicht missbräuchlich zu verwenden</li>
          <li>Keine rechtswidrigen Inhalte zu übermitteln</li>
          <li>Die Rechte Dritter zu respektieren</li>
          <li>Maßnahmen zur Systemsicherheit nicht zu umgehen</li>
          <li>Korrekte Zeiterfassungen vorzunehmen</li>
        </ul>
      </section>

      <section>
        <h2>5. Verfügbarkeit</h2>
        <p>
          Wir bemühen uns um eine hohe Verfügbarkeit des Dienstes. Eine Garantie 
          für ununterbrochene Verfügbarkeit können wir jedoch nicht geben. 
          Wartungsarbeiten werden nach Möglichkeit angekündigt.
        </p>
      </section>

      <section>
        <h2>6. Haftung</h2>
        <p>
          Wir haften für Vorsatz und grobe Fahrlässigkeit. Bei leichter Fahrlässigkeit 
          haften wir nur bei Verletzung wesentlicher Vertragspflichten. 
          Die Haftung ist auf den vorhersehbaren, typischen Schaden begrenzt.
        </p>
        <p>
          Für den Verlust von Daten haften wir nur, wenn dieser Verlust auch bei 
          ordnungsgemäßer Datensicherung durch den Nutzer nicht vermeidbar gewesen wäre.
        </p>
      </section>

      <section>
        <h2>7. Datenschutz</h2>
        <p>
          Details zur Datenverarbeitung finden Sie in unserer 
          <NuxtLink to="/datenschutz" class="inline-link">Datenschutzerklärung</NuxtLink>.
        </p>
      </section>

      <section>
        <h2>8. Änderungen der AGB</h2>
        <p>
          Wir behalten uns vor, diese AGB zu ändern. Änderungen werden Ihnen 
          per E-Mail mitgeteilt. Widersprechen Sie nicht innerhalb von 4 Wochen, 
          gelten die Änderungen als akzeptiert.
        </p>
      </section>

      <section>
        <h2>9. Kündigung</h2>
        <p>
          Sie können Ihr Konto jederzeit löschen. Wir können Konten bei 
          Verstößen gegen diese AGB kündigen. Nach Kündigung werden Ihre 
          Daten gemäß unserer Datenschutzerklärung gelöscht.
        </p>
      </section>

      <section>
        <h2>10. Geistiges Eigentum</h2>
        <p>
          Alle Rechte an der Plattform, einschließlich Design, Code und Inhalten, 
          liegen bei uns. Eine Nutzung über den bestimmungsgemäßen Gebrauch hinaus 
          ist nicht gestattet.
        </p>
      </section>

      <section>
        <h2>11. Schlussbestimmungen</h2>
        <p>
          Es gilt das Recht der Bundesrepublik Deutschland. 
          Sollten einzelne Bestimmungen unwirksam sein, bleibt die Wirksamkeit 
          der übrigen Bestimmungen unberührt.
        </p>
      </section>

      <section>
        <h2>12. Kontakt</h2>
        <p>
          Bei Fragen zu diesen AGB können Sie uns kontaktieren:<br>
          E-Mail: support@tobiasstempelcard.de
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

.inline-link {
  color: #00C16A;
  font-weight: 600;
  text-decoration: underline;
}

.inline-link:hover {
  color: #00DC82;
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
