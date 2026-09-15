# BlockCtrl migration runbook

Runtime requests do not execute DDL. Apply migrations before deploying the web app:

```bash
pnpm db:migrate
pnpm build
pnpm start
```

The migration runner reads sorted files from `migrations/` and records applied versions in `schema_migrations`. `0001_runtime_ddl_baseline.sql` marks the removal of the former runtime schema bootstrap. `0002_metrics_alerts_notifications.sql` creates the metrics, alert-rule, and notification tables required by `/api/metrics`.

Run migrations with the production database environment loaded. Do not run the web deployment before the migration succeeds. If a migration fails, the runner rolls back the current transaction and does not record its version.
