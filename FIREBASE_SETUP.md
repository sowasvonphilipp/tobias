# Tobias Stempelkarte Setup

## Firestore Datenbank-Struktur einrichten

### 1. Firebase Console öffnen
Gehe zu: https://console.firebase.google.com/project/tobiasstempelcard/firestore

### 2. Firestore Database erstellen
- Firestore Database aktivieren
- Im **Produktionsmodus** starten
- Region: europe-west (oder eine andere EU-Region)

### 3. Sammlungen erstellen

#### ✅ Collection: `stamps`
**Automatisch erstellt** beim ersten Einstempeln. Beispielstruktur:
```
{
  userId: "tobias",
  status: "on-time" oder "late",
  minutesLate: 0,
  note: "...",
  timestamp: Timestamp,
  date: "2026-03-10",
  dayOfWeek: "Dienstag"
}
```

#### ✅ Collection: `userStats`
**Automatisch erstellt** beim ersten Laden des Dashboards. Beispielstruktur für Document ID `tobias`:
```
{
  totalStamps: 0,
  onTimeCount: 0,
  lateCount: 0,
  currentStreak: 0,
  longestStreak: 0,
  totalMinutesLate: 0,
  averageMinutesLate: 0,
  rewardsEarned: [],
  nextRewardProgress: 0,
  lastUpdated: Timestamp
}
```

#### ✅ Collection: `auditLogs`
**Automatisch erstellt** wenn Admins Änderungen vornehmen (Streak Reset, Einträge löschen, etc.):
```
{
  userId: "tobias",
  action: "streak_reset" | "stamp_deleted" | "stats_modified",
  description: "Streak zurückgesetzt",
  details: "Alter Streak: 5. Grund: Testlauf",
  adminEmail: "admin@example.com",
  timestamp: Timestamp
}
```

#### ⚠️ Collection: `admins`
**WICHTIG**: Muss für Admin-Zugriff erstellt werden!

**Option 1: Automatisch über Setup-Seite (EMPFOHLEN)**
1. Logge dich mit deinem Admin-Account ein
2. Gehe zu `/setup` in der App
3. Klicke auf "Als Admin registrieren"
4. Fertig! ✅

**Option 2: Manuell im Firebase Console**
1. Erstelle Collection namens `admins`
2. Erstelle ein Document mit der **E-Mail-Adresse** als Document ID
   - Document ID: `deine-admin-email@example.com`
   - Felder: `{ email: "deine-admin-email@example.com", createdAt: Timestamp, isActive: true }`

Beispiel:
```
Collection: admins
Document ID: admin@example.com
Felder: {
  email: "admin@example.com",
  createdAt: Timestamp,
  isActive: true
}
```

### 4. Firestore Regeln

Gehe zu **Firestore → Regeln** und füge folgende Regeln ein:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Admins können alles
    function isAdmin() {
      return exists(/databases/$(database)/documents/admins/$(request.auth.token.email));
    }
    
    // Stamps - nur Admins können schreiben
    match /stamps/{stampId} {
      allow read: if request.auth != null;
      allow write: if isAdmin();
    }
    
    // User Stats - nur Admins können schreiben
    match /userStats/{userId} {
      allow read: if request.auth != null;
      allow write: if isAdmin();
    }
    
    // Audit Logs - nur Admins können schreiben, alle können lesen
    match /auditLogs/{logId} {
      allow read: if request.auth != null;
      allow write: if isAdmin();
    }
    
    // Admins list - lesen für authentifizierte, schreiben nur für Setup
    match /admins/{email} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.auth.token.email == email;
      allow update, delete: if false;
    }
  }
}
```

### 5. Ersten Admin erstellen

1. Gehe zu Firebase Console → Firestore
2. Erstelle Collection `admins`
3. Klicke auf "Dokument hinzufügen"
4. Document ID: Deine E-Mail (z.B. `admin@example.com`)
5. Feld hinzufügen:
   - Feldname: `isAdmin`
   - Typ: boolean
   - Wert: `true`
6. Speichern

### 6. Test-User in Authentication erstellen

1. Gehe zu Firebase Console → Authentication
2. Klicke auf "Get started" (falls noch nicht aktiviert)
3. Aktiviere "Email/Password" als Sign-in method
4. Erstelle einen neuen User:
   - E-Mail: deine-email@example.com (sollte die gleiche sein wie in `admins`)
   - Passwort: dein-sicheres-passwort

## Belohnungssystem

### Bronze Meister 🥉
- 3x pünktlich in Folge

### Silber Champion 🥈
- 5x pünktlich in Folge

### Gold Legende 🥇
- 10x pünktlich in Folge

### Pünktlichkeits-König 👑
- 20x pünktlich in Folge (basiert auf längster Streak)

## Nutzung

### Als Admin:
1. Login mit deiner Admin-E-Mail
2. Klicke auf "Admin Panel" im Header
3. Wähle Status (Pünktlich oder Zu spät)
4. Bei "Zu spät": Minuten eingeben
5. Optional: Notiz hinzufügen
6. Auf "Einstempeln" klicken

### Als Tobias:
1. Login ins Dashboard
2. Sehe deine Statistiken
3. Verfolge deinen Fortschritt
4. Schalte Belohnungen frei! 🏆

## Wichtige Hinweise

- Stempel-Tage sind **nur Dienstag und Donnerstag**
- Nur Admins können einstempeln
- Tobias kann nur seine Statistiken sehen
- Alle Daten werden in Echtzeit synchronisiert
- Rewards werden automatisch freigeschaltet basierend auf dem Streak
