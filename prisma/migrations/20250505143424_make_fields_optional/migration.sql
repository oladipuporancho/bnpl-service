-- DropIndex
DROP INDEX "User_bvn_key";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "idType" TEXT NOT NULL DEFAULT 'NIN',
ADD COLUMN     "updatedAt" TIMESTAMP(3),
ALTER COLUMN "bvn" SET DEFAULT 'not_set',
ALTER COLUMN "bankAccount" SET DEFAULT 'not_set';
