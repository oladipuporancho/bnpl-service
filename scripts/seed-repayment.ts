import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const loanId = '6dd3c1a3-b9ae-48ac-8849-33b89d6782be';

  const newRepayment = await prisma.loanRepayment.create({
    data: {
      loanId,
      amount: 5000,             // amount paid
      repaymentDate: new Date(), // date of repayment
    },
  });

  console.log('Inserted repayment:', newRepayment);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
