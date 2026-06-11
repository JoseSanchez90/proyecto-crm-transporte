-- Create enum type (safe: IF NOT EXISTS for shadow DB compatibility)
DO $$ BEGIN
  CREATE TYPE "ShipmentCategory" AS ENUM ('ELECTRONICA', 'MOBILIARIO', 'ROPA', 'ALIMENTOS', 'MAQUINARIA', 'OTROS');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Migrate existing data: convert Spanish strings to enum values
UPDATE "Shipment" SET "category" = 'ELECTRONICA' WHERE "category" = 'Electrónica';
UPDATE "Shipment" SET "category" = 'MOBILIARIO' WHERE "category" = 'Mobiliario';
UPDATE "Shipment" SET "category" = 'ROPA' WHERE "category" = 'Ropa';
UPDATE "Shipment" SET "category" = 'ALIMENTOS' WHERE "category" = 'Alimentos';
UPDATE "Shipment" SET "category" = 'MAQUINARIA' WHERE "category" = 'Maquinaria';

-- Alter the column type
ALTER TABLE "Shipment" ALTER COLUMN "category" TYPE "ShipmentCategory" USING "category"::text::"ShipmentCategory";
