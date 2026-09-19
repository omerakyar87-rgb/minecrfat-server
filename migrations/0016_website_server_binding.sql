ALTER TABLE websites
  ADD COLUMN IF NOT EXISTS "serverId" uuid;

ALTER TABLE website_form_submissions
  ADD COLUMN IF NOT EXISTS "serverId" uuid;

CREATE INDEX IF NOT EXISTS websites_server_id_idx
  ON websites ("serverId");

CREATE INDEX IF NOT EXISTS website_form_submissions_server_id_idx
  ON website_form_submissions ("serverId");
