-- CreateEnum
CREATE TYPE "TripCostCategory" AS ENUM ('FUEL', 'TOLL', 'MAINTENANCE', 'PER_DIEM', 'INSURANCE', 'OTHER');

-- CreateTable
CREATE TABLE "TripCost" (
    "id" TEXT NOT NULL,
    "shipmentId" TEXT NOT NULL,
    "category" "TripCostCategory" NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TripCost_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TripCost" ADD CONSTRAINT "TripCost_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
