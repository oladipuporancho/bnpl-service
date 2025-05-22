import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testFetchLoanWithRepayments(prisma: PrismaClient) {
  const testLoanId = '83597780-a650-4dfa-8d5d-59b2df1f8472';

  try {
    const loan = await prisma.loan.findUnique({
      where: { id: testLoanId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            phone: true,
          },
        },
        loanRepayments: {
          orderBy: { repaymentDate: 'asc' }, // order payments by paymentDate
        },
      },
    });

    if (!loan) {
      console.log('Loan not found');
      return;
    }

    const formattedLoan = {
      loanId: loan.id,
      amount: loan.amount,
      purpose: loan.purpose,
      durationInMonths: loan.duration,
      status: loan.status,
      interestRate: loan.interestRate,
      category: loan.category,
      vendor: loan.vendor,
      createdAt: loan.createdAt,
      user: loan.user,
      paymentHistory: loan.loanRepayments.map((repayment) => ({
        amountpaid: repayment.amountpaid,
        repaymentDate: repayment.paymentDate, // Use paymentDate here
      })),
      remainingBalance: loan.remainingBalance,
    };

    console.log('✅ Formatted Loan with Repayments:');
    console.dir(formattedLoan, { depth: null });
  } catch (error) {
    console.error(' Error fetching loan:', error);
  }
}

(async () => {
  await testFetchLoanWithRepayments(prisma);
  await prisma.$disconnect();
})();
