# Agenten, Trainingsplanung und Soll–Ist

Stand: 14.09.2026. Implementierung und Produktionsrollout sind freigegeben.
Der isolierte Release-Branch ist `feat/agent-training-plans`; vorhandene Änderungen
im ursprünglichen Checkout wurden nicht in das Release übernommen.

## Freigegebener Umfang

Ein gemeinsamer Remote-HTTP-MCP-Endpunkt. Anmeldung über das bestehende
Supabase-Konto; separate, jederzeit widerrufbare Freigaben für `training.read`,
`plans.write`, `exercises.write`. Keine Löschtools, keine generischen SQL-/DB-Tools.
Lesen betrifft ausschließlich eigene Trainingsdaten und öffentliche/eigene Übungen.
Agenten dürfen zukünftige Pläne vollständig erstellen und vor Start ändern.
Start und Planänderung sperren dieselbe Datenbankzeile. Start erzeugt ein aktives
Workout mit allen Übungen und Sätzen in einer Transaktion; wiederholtes Starten
liefert dieselbe Workout-ID. Nach Start sind Agentenänderungen ausgeschlossen.

Zielgewicht und Zielwiederholungen bleiben unabhängig von tatsächlichen Werten
erhalten. Eingaben werden im Browser mit Zielwerten vorbelegt, in der Datenbank
bleiben Ist-Werte zunächst NULL und `is_finished=false`. Nur bestätigte Sätze
zählen als Leistung. Der Originalplan bleibt auch bei später gelöschten Sätzen
erhalten. Übungsbearbeitung erzeugt eine neue private Version mit eigener ID;
frühere IDs behalten Bedeutung und Historie.

Feedback nach Abschluss ist freiwillig: Schwierigkeit (1–10) und eigene Erklärung
für Anpassungen. Trainingsbedingungen: Zeitbudget, Geräte, zu vermeidende Übungen.
Pläne enthalten eine kurze sichtbare Begründung. Diese Angaben sind Kontext,
keine automatisch abgeleitete medizinische oder kausale Interpretation.

## Architekturentscheidung

Supabase dokumentiert einen OAuth-2.1-Server, aber OIDC-Scopes begrenzen dort keine
DB-Zugriffe. Das bisherige Schema besitzt nicht lokal dokumentierte RLS, Views und
RPCs. Deshalb gibt Kyx Gym **keine Supabase-Zugriffstokens an Agenten aus**.
Ein eigener OAuth-Authorization-Code-Endpunkt mit S256-PKCE, Resource-Bindung,
kurzlebigen Codes, gehashten opaken Access-/Refresh-Tokens und Refresh-Rotation
sitzt vor der bestehenden Supabase-Anmeldung. Alle Agentenoperationen laufen über
eine nur für `service_role` ausführbare, begrenzte DB-Funktion. Diese löst den
Token selbst auf und prüft die aktuelle Freigabe unter Zeilensperre. Widerruf und
Operationen sind damit geordnet. Der Service-Key bleibt ausschließlich serverseitig.
Die öffentliche Registrierung unterstützt öffentliche Clients mit exakten,
validierten Redirect-URIs; jeder Zugriff benötigt interaktive Zustimmung.

MCP: stateless Streamable HTTP, JSON-Antworten, Discovery nach RFC 9728/8414,
Authorization Code + PKCE, keine frei wählbaren Nutzer-IDs in Tools.
`MCP_PUBLIC_URL` ist die feste HTTPS-Adresse (lokal HTTP localhost möglich).
Ohne Konfiguration oder Migration bleibt die Funktion geschlossen.

## Umsetzung und Prüfung

- Migration für Pläne, Grants/Tokens, Idempotenz, Kontext/Feedback, Versionierung,
  atomaren Start und unveränderliche Zielwerte.
- Zod-Validierung und explizite MCP-Tools mit begrenzter Pagination.
- Dashboard/Planvorschau/Editor/Kalender sowie Verbindungsverwaltung und Zustimmung.
- Soll–Ist im aktiven Training und Verlauf; freiwilliges Feedback im Verlauf.
- Lokale Tests für Isolation, Rechte, Widerruf, Race, Wiederholung und Soll–Ist.
- Typecheck, ESLint, Format, Jest, Build, Desktop-/Mobilprüfung.

## Externe Voraussetzungen und Rollout

Das Live-Schema wurde nach Reaktivierung des Supabase-Projekts über eine
TLS-geprüfte Nur-Lese-Verbindung abgeglichen: 24 Tabellen, 56 Policies und 49
Trigger. Die ersten beiden Migrationen wurden auf dem Produktionsschema in einer
Transaktion erfolgreich probeweise ausgeführt und vollständig zurückgerollt.

Eine dritte Migration sichert den Suchpfad der RPC für bestehende Trigger ab: API-Rollen dürfen keine Objekte im öffentlichen Schema erzeugen; Legacy-Trigger finden ihre Tabellen weiterhin.

Der bestehende Abschluss-Trigger löscht unbestätigte Sätze und leere Übungen.
`gym_plan_sets` hält deshalb unabhängige unveränderliche Snapshots. Der Verlauf
zeigt auch ausgelassene Sätze. `exercise_history`, Rekorde und Volumenberechnung
verwenden bestätigte Sätze. Fremde und öffentliche Übungen können weder über die
Agenten-Tools noch über direkte Benutzer-Schreibzugriffe verändert werden;
Muskelzuordnungen haben jetzt ebenfalls passende Eigentumsregeln.

Erforderlich: `MCP_PUBLIC_URL=https://www.kyx-gym.app/api/mcp`,
`NEXT_PUBLIC_SUPABASE_URL`, der geprüfte öffentliche Publishable-Key unter
`NEXT_PUBLIC_SUPABASE_ANON_KEY` und serverseitig `SUPABASE_SERVICE_ROLE_KEY`
(oder lokal `SERVICE_ROLE_KEY`). Bestehende Schlüssel werden nicht widerrufen.
Neue Tabellen sind nur über die serverseitig kontrollierten Funktionen erreichbar.

Release-Basis ist Next.js 15.5.24 mit aktualisiertem sharp 0.35.4. Async-Request-APIs
sind migriert; der Cookie-Adapter erhält das bisherige Supabase-Sessionformat.
Der Altbestand besitzt weitere npm-Audit-Meldungen; dies ist keine vollständige
Sicherheitsmodernisierung aller bestehenden Bibliotheken und AI-Funktionen.

Verifiziert: 14 PostgreSQL-16-Integrationstests einschließlich echter Start-Races,
Eigentumsregeln, Legacy-Cleanup und Snapshots; 10 HTTP/OAuth/MCP-Integrationstests
gegen `next start`; 8 Jest-Tests; Typecheck, striktes ESLint, vollständiger Formatcheck
und Produktionsbuild. Browser: OAuth-Loginrückkehr/Zustimmung, Planbearbeitung,
Start mit unbestätigten Zielen, 40 statt 50 kg, ausgelassener Satz, erfolgreicher
Abschluss und 320 kg Ist-Volumen, Soll-Ist-Verlauf, Feedback, Trainingsbedingungen,
Adresse kopieren und Verbindung widerrufen; Desktop und 390-px-Mobilansicht.

Lokale Integrationstests verwenden ausschließlich den wegwerfbaren Container
`kyx-gym-agent-test-db`. Sie dürfen nicht auf eine Produktionsverbindung umgestellt
werden. Details stehen in `tests/integrations/README.md`.

## Primärquellen (14.09.2026)

- https://modelcontextprotocol.io/specification/2025-11-25/basic/authorization
- https://modelcontextprotocol.io/specification/2025-11-25/basic/transports
- https://supabase.com/docs/guides/auth/oauth-server
- https://supabase.com/docs/guides/auth/oauth-server/token-security
- https://docs.openclaw.ai/cli/mcp/transports

OpenClaw dokumentiert `streamable-http` und `auth: oauth`; tatsächlicher
OpenClaw-Login im installierten Nutzer-Agenten ist noch nicht verifiziert.
Der implementierte OAuth-/MCP-Ablauf ist unabhängig per HTTP und Browser geprüft. Beispiel:
`openclaw mcp set kyx '{"url":"https://HOST/api/mcp","transport":"streamable-http","auth":"oauth","oauth":{"scope":"training.read plans.write exercises.write"}}'`.

- https://nextjs.org/blog/august-2026-security-release
- https://supabase.com/docs/guides/platform/ssl-enforcement
