# Isolierte Integrationstests

Alle Daten sind synthetisch. Der PostgreSQL-Treiber akzeptiert keine beliebige
Verbindungsadresse, sondern ausschließlich den Testcontainer
`kyx-gym-agent-test-db`. `database.mjs` setzt dessen Schema zurück.

```sh
podman run --rm -d --name kyx-gym-agent-test-db -e POSTGRES_PASSWORD=local-test-only postgres:16-alpine
KYX_TEST_POSTGRES=1 node tests/integrations/database.mjs
```

Für Docker zusätzlich `KYX_TEST_CONTAINER_RUNTIME=docker` setzen. Alternativ kann
`KYX_PGLITE_PATH` auf eine separat installierte PGlite-Version zeigen.
Die Fixture enthält die geprüfte Legacy-Cleanup-Logik, keine privaten Nutzerdaten.

Für HTTP und Browser nach den DB-Tests den lokalen Adapter starten:

```sh
node tests/integrations/http-fixture.mjs
```

Die App mit folgenden synthetischen Werten bauen und auf Port 3017 starten:

```sh
export NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:55439
export NEXT_PUBLIC_SUPABASE_ANON_KEY=fixture-anon
export SERVICE_ROLE_KEY=fixture-service
export MCP_PUBLIC_URL=http://localhost:3017/api/mcp
export NEXT_OPEN_AI_API_KEY=fixture-no-paid-calls
npm run build
npm run start -- -p3017
```

In einem zweiten Terminal `node tests/integrations/http.mjs` ausführen. Der Adapter
stellt nur Testdaten bereit; er ist kein Ersatz für einen Live-RLS-/Trigger-Abgleich.
Danach lokale Prozesse beenden und `podman stop kyx-gym-agent-test-db` ausführen.
