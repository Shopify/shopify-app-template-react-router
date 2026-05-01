-- Tutorial pivot: no classic webhook dedupe or debug forwarding.
DROP TABLE IF EXISTS "WebhookEvent";

-- SQLite 3.35+
ALTER TABLE "ShopSettings" DROP COLUMN "webhookDebugForwardUrl";
