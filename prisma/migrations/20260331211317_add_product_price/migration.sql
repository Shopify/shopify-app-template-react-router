-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "shopifyGid" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "handle" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "price" TEXT NOT NULL DEFAULT '',
    "lastSyncedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Product" ("handle", "id", "lastSyncedAt", "shop", "shopifyGid", "status", "title") SELECT "handle", "id", "lastSyncedAt", "shop", "shopifyGid", "status", "title" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
CREATE UNIQUE INDEX "Product_shop_shopifyGid_key" ON "Product"("shop", "shopifyGid");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
