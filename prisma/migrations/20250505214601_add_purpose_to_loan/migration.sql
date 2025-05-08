/*
  Warnings:

  - You are about to drop the column `createdAt` on the `Loan` table. All the data in the column will be lost.
  - Added the required column `duration` to the `Loan` table without a default value. This is not possible if the table is not empty.
  - Added the required column `interestRate` to the `Loan` table without a default value. This is not possible if the table is not empty.
  - Added the required column `loanType` to the `Loan` table without a default value. This is not possible if the table is not empty.
  - Added the required column `repaymentType` to the `Loan` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Loan" DROP COLUMN "createdAt",
ADD COLUMN     "approvalDate" TIMESTAMP(3),
ADD COLUMN     "duration" INTEGER NOT NULL,
ADD COLUMN     "interestRate" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "loanType" TEXT NOT NULL,
ADD COLUMN     "purpose" TEXT,
ADD COLUMN     "repaymentDate" TIMESTAMP(3),
ADD COLUMN     "repaymentType" TEXT NOT NULL;
