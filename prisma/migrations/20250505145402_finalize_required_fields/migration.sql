/*
  Warnings:

  - Made the column `bvn` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `bankAccount` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updatedAt` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "User" ALTER COLUMN "bvn" SET NOT NULL,
ALTER COLUMN "bankAccount" SET NOT NULL,
ALTER COLUMN "updatedAt" SET NOT NULL;
