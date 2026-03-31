-- CreateTable
CREATE TABLE "WebhookEvent" (
    "eventId" TEXT NOT NULL PRIMARY KEY,
    "receivedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "topic" TEXT
);
