import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getDashboardSummary() {
    const [totalUsers, activeLoans, totalRepaid, totalFlagged] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.loan.aggregate({
        _sum: { amount: true },
        where: { status: 'approved' },
      }),
      this.prisma.loanRepayment.aggregate({
        _sum: { amountpaid: true },
      }),
      this.prisma.user.count({ where: { isFlagged: true } }),
    ]);

    const totalLoanAmount = activeLoans._sum.amount || 0;
    const totalRepayment = totalRepaid._sum.amountpaid || 0;
    const repaymentRate = totalLoanAmount > 0
      ? ((totalRepayment / totalLoanAmount) * 100).toFixed(1)
      : '0.0';

    return {
      totalUsers,
      activeLoanAmount: totalLoanAmount,
      repaymentRate: `${repaymentRate}%`,
      flaggedAccounts: totalFlagged,
    };
  }
}
