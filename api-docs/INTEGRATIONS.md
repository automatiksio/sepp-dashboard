# 🔌 API Integrationen — Dashboard

*Übersicht der geplanten API-Anbindungen*

---

## 1. Todoist API

### Übersicht
- **Docs:** https://developer.todoist.com/rest/v2/
- **Auth:** Bearer Token (Personal API Token)
- **Format:** JSON
- **Rate Limit:** Nicht explizit dokumentiert, aber fair use

### SDK verfügbar
```bash
# Python
pip install todoist-api-python

# JavaScript/TypeScript
npm install @doist/todoist-api-typescript
```

### Wichtige Endpoints

| Endpoint | Methode | Beschreibung |
|----------|---------|--------------|
| `/rest/v2/projects` | GET | Alle Projekte |
| `/rest/v2/tasks` | GET | Alle Tasks |
| `/rest/v2/tasks` | POST | Task erstellen |
| `/rest/v2/tasks/{id}` | POST | Task aktualisieren |
| `/rest/v2/tasks/{id}/close` | POST | Task abhaken |

### Beispiel: Tasks abrufen
```bash
curl -X GET \
  https://api.todoist.com/rest/v2/tasks \
  -H "Authorization: Bearer $TODOIST_TOKEN"
```

### Für Dashboard benötigt
- [ ] API Token von Chris
- [ ] Projekt-IDs für Filter

---

## 2. ClickUp API

### Übersicht
- **Docs:** https://developer.clickup.com/
- **Auth:** Personal API Token oder OAuth2
- **Format:** JSON
- **Rate Limit:** 100 requests/min pro Token

### Hierarchie
```
Workspace → Space → Folder → List → Task
```

### Wichtige Endpoints

| Endpoint | Methode | Beschreibung |
|----------|---------|--------------|
| `/team` | GET | Workspaces |
| `/team/{team_id}/space` | GET | Spaces |
| `/space/{space_id}/list` | GET | Listen |
| `/list/{list_id}/task` | GET | Tasks in Liste |
| `/task/{task_id}` | GET/PUT | Task Details |

### Beispiel: Tasks abrufen
```bash
curl -X GET \
  "https://api.clickup.com/api/v2/list/{list_id}/task" \
  -H "Authorization: $CLICKUP_TOKEN"
```

### Für Dashboard benötigt
- [ ] API Token von Chris
- [ ] Workspace ID (RegioNext, automatiks)
- [ ] Relevante Space/List IDs

---

## 3. Google Workspace (Calendar)

### Übersicht
- **Docs:** https://developers.google.com/calendar/api
- **Auth:** OAuth2 (komplexer Setup)
- **Format:** JSON

### Setup-Schritte
1. Google Cloud Console → Projekt erstellen
2. Calendar API aktivieren
3. OAuth2 Credentials erstellen
4. Consent Screen konfigurieren
5. Token Flow implementieren

### Wichtige Endpoints

| Endpoint | Methode | Beschreibung |
|----------|---------|--------------|
| `/calendars/{id}/events` | GET | Events abrufen |
| `/calendars/{id}/events` | POST | Event erstellen |
| `/calendars/{id}/events/{eventId}` | PUT | Event bearbeiten |

### Beispiel: Heute's Events
```bash
curl -X GET \
  "https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=2026-01-31T00:00:00Z&timeMax=2026-01-31T23:59:59Z" \
  -H "Authorization: Bearer $GOOGLE_TOKEN"
```

### Für Dashboard benötigt
- [ ] Google Cloud Projekt
- [ ] OAuth2 Setup
- [ ] Chris' Kalender-Zugriff

---

## 4. Priorisierung

### Phase 1 (Jetzt)
- ✅ Lokale JSON-Datenbank (tasks.json)
- ✅ Lesen/Schreiben aus Dashboard

### Phase 2 (Mit API Keys)
- [ ] Todoist Integration (einfachste API)
- [ ] ClickUp Integration

### Phase 3 (Später)
- [ ] Google Calendar (OAuth2 komplexer)
- [ ] GoHighLevel (automatiks.io CRM)
- [ ] Home Assistant (MCP)

---

## 5. Benötigte Credentials von Chris

| Service | Was wird benötigt | Wo zu finden |
|---------|-------------------|--------------|
| **Todoist** | API Token | Settings → Integrations → Developer |
| **ClickUp** | API Token | Settings → Apps → Generate API Token |
| **Google** | OAuth Setup | Google Cloud Console (komplexer) |

---

*Erstellt von Sepp ⚡ | 2026-01-31*
