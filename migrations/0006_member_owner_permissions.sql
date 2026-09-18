-- Üye rolündeki kullanıcıların kendi oluşturduğu sunucularda sahiplik erişimini kalıcılaştırır.
-- Paylaşılan sunucular için mevcut server_permissions satırları değişmeden kalır ve yalnız verilen izinler geçerlidir.

INSERT INTO "server_permissions" (
  "userId",
  "ownerUserId",
  "serverId",
  "canStart",
  "canStop",
  "canRestart",
  "canConsole",
  "canFiles",
  "canBackup",
  "canReset",
  "canViewLostItems",
  "canManageLostItems",
  "sections"
)
SELECT
  s."userId",
  s."userId",
  s."id",
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  '["overview","settings","console","logs","players","software","files","worlds","backups","network","integrations","security"]'::jsonb
FROM "servers" s
JOIN "user" u ON u."id" = s."userId"
WHERE lower(COALESCE(u."role", 'member')) = 'member'
  AND s."status" <> 'deleted'
ON CONFLICT ("userId", "serverId") DO UPDATE SET
  "ownerUserId" = EXCLUDED."ownerUserId",
  "canStart" = true,
  "canStop" = true,
  "canRestart" = true,
  "canConsole" = true,
  "canFiles" = true,
  "canBackup" = true,
  "canReset" = true,
  "canViewLostItems" = true,
  "canManageLostItems" = true,
  "sections" = EXCLUDED."sections";