import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  async updateUserFlagStatus(userId: string, action: 'flag' | 'unflag') {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        isFlagged: action === 'flag',
      },
    });

    return {
      message: `User ${action}ged successfully`,
      data: updatedUser,
    };
  }

  async approveKYC(
    adminId: string,
    adminPassword: string,
    userId: string,
    decision: 'approve' | 'reject',
  ) {
    if (adminId !== 'Admin 123' || adminPassword !== 'admin 123') {
      throw new BadRequestException('Invalid admin credentials');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        kycStatus: decision === 'approve' ? 'approved' : 'rejected',
      },
    });

    await this.emailService.sendEmail(
      user.email,
      'KYC Status Update',
      decision === 'approve'
        ? 'Your KYC has been approved.'
        : 'Your KYC has been rejected.',
      decision === 'approve'
        ? '<p>Congratulations! Your KYC has been approved.</p>'
        : '<p>Unfortunately, your KYC has been rejected. Please contact support for more details.</p>',
    );

    return {
      message: `KYC ${decision}d successfully`,
      data: updatedUser,
    };
  }

  async reviewLoanApplication(
  adminId: string,
  adminPassword: string,
  loanId: string,
  decision: 'approve' | 'reject',
) {
  if (adminId !== 'Admin 123' || adminPassword !== 'admin 123') {
    throw new BadRequestException('Invalid admin credentials');
  }

  const loan = await this.prisma.loan.findUnique({ where: { id: loanId } });
  if (!loan) throw new NotFoundException('Loan not found');

  const updatedLoan = await this.prisma.loan.update({
    where: { id: loanId },
    data: {
      status: decision === 'approve' ? 'approved' : 'rejected',
      approvalDate: decision === 'approve' ? new Date() : null,
    },
  });

  const user = await this.prisma.user.findUnique({ where: { id: loan.userId } });
  if (!user) throw new NotFoundException('User not found');

  await this.emailService.sendEmail(
    user.email,
    `Loan Application ${decision === 'approve' ? 'Approved' : 'Rejected'}`,
    decision === 'approve'
      ? 'Your loan application has been approved.'
      : 'Your loan application has been rejected.',
    decision === 'approve'
      ? '<p>Congratulations! Your loan is approved and will be disbursed shortly.</p>'
      : '<p>We regret to inform you that your loan application has been rejected. Please contact support for further assistance.</p>',
  );

  return {
    message: `Loan ${decision}ed successfully.`,
    data: updatedLoan,
  };
}

  async getAllFlaggedAccounts() {
    const flaggedUsers = await this.prisma.user.findMany({
      where: { isFlagged: true },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        isFlagged: true,
      },
    });

    return flaggedUsers;
  }

  async getPaymentAndLoanHistory() {
    const approvedLoans = await this.prisma.loan.findMany({
      where: {
        approvalDate: {
          not: null,
        },
      },
      include: {
        user: { select: { fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const repayments = await this.prisma.loanRepayment.findMany({
      include: {
        loan: {
          include: {
            user: { select: { fullName: true } },
          },
        },
      },
      orderBy: { paymentDate: 'desc' },
    });

    const formattedLoans = approvedLoans.map((loan) => ({
      user: loan.user?.fullName || 'Unknown',
      amount: loan.amount,
      date: loan.createdAt,
      status: 'approved loan',
      type: 'disbursement',
    }));

    const formattedRepayments = repayments.map((repay) => ({
      user: repay.loan?.user?.fullName || 'Unknown',
      amount: repay.amountpaid,
      date: repay.paymentDate,
      status: repay.loan.status,
      type: 'repayment',
    }));

    return [
      ...formattedLoans,
     ...formattedRepayments,
   ];
  }
}
