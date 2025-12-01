/*
  Warnings:

  - You are about to drop the `WasteEntry` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."WasteEntry" DROP CONSTRAINT "WasteEntry_staffId_fkey";

-- DropIndex
DROP INDEX "public"."Staff_name_key";

-- DropTable
DROP TABLE "public"."WasteEntry";

-- CreateTable
CREATE TABLE "Pickup" (
    "id" SERIAL NOT NULL,
    "staffId" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "co2Saved" DOUBLE PRECISION NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "imageUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Pickup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Pickup_status_idx" ON "Pickup"("status");

-- CreateIndex
CREATE INDEX "Pickup_staffId_idx" ON "Pickup"("staffId");

-- AddForeignKey
ALTER TABLE "Pickup" ADD CONSTRAINT "Pickup_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
