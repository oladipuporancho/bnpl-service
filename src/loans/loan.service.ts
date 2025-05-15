import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ApplyLoanDto } from './dto/apply-loan.dto';
import { RepayLoanDto } from './dto/repay-loan.dto';
import { EmailService } from '../email/email.service';
import * as bcrypt from 'bcryptjs';

const MAX_CREDIT_LIMIT = 50000;

@Injectable()
export class LoansService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  async getUserUsedCredit(userId: string): Promise<number> {
    const loans = await this.prisma.loan.findMany({
      where: {
        userId,
        status: { in: ['approved', 'pending'] },
      },
    });
    return loans.reduce((sum, loan) => sum + loan.amount, 0);
  }

  async applyLoan(userId: string, dto: ApplyLoanDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const currentCreditUsed = await this.getUserUsedCredit(userId);
    if (currentCreditUsed + dto.amount > MAX_CREDIT_LIMIT) {
      throw new BadRequestException(
        `Loan request exceeds ₦${MAX_CREDIT_LIMIT}. You have ₦${MAX_CREDIT_LIMIT - currentCreditUsed} left.`,
      );
    }

    const validCategories = ['fashion', 'electronics', 'home appliances'];
    if (!validCategories.includes(dto.category.toLowerCase())) {
      throw new BadRequestException('Invalid loan category');
    }

    const loan = await this.prisma.loan.create({
      data: {
        userId,
        amount: dto.amount,
        purpose: dto.purpose,
        duration: dto.durationInMonths,
        status: 'pending',
        loanType: 'undecided',
        repaymentType: 'undecided',
        interestRate: 0,
        category: dto.category.toLowerCase(),
        remainingBalance: dto.amount,
        vendor: dto.vendor,
      },
    });

    await this.emailService.sendEmail(
      user.email,
      'Loan Application Received',
      `Your loan application for ₦${dto.amount} has been received and is under review .`,
      `<p>Your loan application for ₦${dto.amount}</p>`,
    );

    return {
      message: 'Loan application submitted',
      data: loan,
    };
  }

  async getUserLoanHistory(userId: string) {
    const loans = await this.prisma.loan.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        loanRepayments: true,
      },
    });

    return loans.map((loan) => ({
      loanId: loan.id,
      amountApproved: loan.amount,
      status: loan.status,
      interestRate: loan.interestRate,
      durationInMonths: loan.duration,
      category: loan.category,
      createdAt: loan.createdAt,
      repayments: loan.loanRepayments.map((repayment) => ({
        amountPaid: repayment.amount,
        paidAt: repayment.repaymentDate,
      })),
      remainingBalance: loan.remainingBalance,
    }));
  }

  async getUserTransactions(userId: string) {
    const repayments = await this.prisma.loanRepayment.findMany({
      where: { loan: { userId } },
      include: { loan: true },
      orderBy: { repaymentDate: 'desc' },
    });

    const usedCredit = await this.getUserUsedCredit(userId);

    return {
      userId,
      totalCreditLimit: MAX_CREDIT_LIMIT,
      usedCredit,
      availableCredit: MAX_CREDIT_LIMIT - usedCredit,
      repayments,
    };
  }

  async approveLoan(loanId: string, adminId: string, adminPassword: string) {
    if (!adminId || !adminPassword) {
      throw new BadRequestException('Admin ID and password are required');
    }

    const admin = await this.prisma.user.findFirst({
      where: {
        isAdmin: true,
        OR: [
          { id: adminId },
          { email: adminId?.toLowerCase() },
          { phone: adminId },
        ],
      },
    });

    if (!admin) throw new NotFoundException('Admin not found or not authorized');

    const passwordMatch = await bcrypt.compare(adminPassword, admin.password);
    if (!passwordMatch) {
      throw new BadRequestException('Invalid admin credentials');
    }

    const loan = await this.prisma.loan.findUnique({ where: { id: loanId } });
    if (!loan) throw new NotFoundException('Loan not found');

    const randomInterestRate = parseFloat((Math.random() * 7 + 3).toFixed(2));

    const updatedLoan = await this.prisma.loan.update({
      where: { id: loanId },
      data: {
        status: 'approved',
        approvalDate: new Date(),
        interestRate: randomInterestRate,
        loanType: 'personal',
        repaymentType: 'monthly',
      },
    });

    const user = await this.prisma.user.findUnique({ where: { id: updatedLoan.userId } });
    if (user) {
      await this.emailService.sendEmail(
        user.email,
        'Loan Approved',
        `Your loan of ₦${updatedLoan.amount} has been approved at an interest rate of ${randomInterestRate}%.`,
        `<p>Congratulations! Your loan of <strong>₦${updatedLoan.amount}</strong> has been approved at an interest rate of <strong>${randomInterestRate}%</strong>.</p>`,
      );
    }

    return {
      message: 'Loan approved by admin',
      data: updatedLoan,
    };
  }

  async toggleFlaggedStatus(userId: string, adminId: string, adminPassword: string) {
    const admin = await this.prisma.user.findFirst({
      where: {
        isAdmin: true,
        OR: [
          { id: adminId },
          { email: adminId?.toLowerCase() },
          { phone: adminId },
        ],
      },
    });

    if (!admin) throw new NotFoundException('Admin not found or not authorized');

    const passwordMatch = await bcrypt.compare(adminPassword, admin.password);
    if (!passwordMatch) {
      throw new BadRequestException('Invalid admin credentials');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { isFlagged: !user.isFlagged },
    });

    return {
      message: user.isFlagged ? 'User account unflagged' : 'User account flagged',
      data: updatedUser,
    };
  }

  async getRepaymentHistory(loanId: string) {
    const loan = await this.prisma.loan.findUnique({
      where: { id: loanId },
      include: { user: true },
    });

    if (!loan) throw new NotFoundException('Loan not found');

    return this.prisma.loanRepayment.findMany({
      where: { loanId },
      orderBy: { repaymentDate: 'desc' },
    });
  }

  async getLoansByCategory(category: string) {
    const validCategories = ['fashion', 'electronics', 'home appliances'];
    if (!validCategories.includes(category.toLowerCase())) {
      throw new BadRequestException('Invalid loan category');
    }

    return this.prisma.loan.findMany({
      where: { category: category.toLowerCase() },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getLoansByUser(userId: string) {
    return this.prisma.loan.findMany({
      where: { userId },
      orderBy: { id: 'desc' },
    });
  }

  async repayLoan(loanId: string, userId: string, dto: RepayLoanDto) {
    const loan = await this.prisma.loan.findUnique({ where: { id: loanId } });
    if (!loan) throw new NotFoundException('Loan not found');

    if (loan.userId !== userId) {
      throw new BadRequestException('User does not own this loan');
    }

    if (dto.amount <= 0) {
      throw new BadRequestException('Repayment amount must be greater than zero');
    }

    const totalLoanAmount = loan.amount + (loan.amount * loan.interestRate) / 100;
    const remainingBalance = loan.remainingBalance - dto.amount;

    if (remainingBalance < 0) {
      throw new BadRequestException('Repayment amount exceeds remaining balance');
    }

    const updatedLoan = await this.prisma.loan.update({
      where: { id: loanId },
      data: {
        remainingBalance,
        repaymentDate: new Date(),
        status: remainingBalance === 0 ? 'paid off' : loan.status,
      },
    });

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user) {
      await this.emailService.sendEmail(
        user.email,
        'Loan Repayment Received',
        `Your payment of ₦${dto.amount} has been received. Your remaining balance is ₦${remainingBalance}.`,
        `<p>Your payment of <strong>₦${dto.amount}</strong> has been received. Your remaining balance is <strong>₦${remainingBalance}</strong>.</p>`,
      );
    }

    return {
      message: 'Loan repayment processed successfully',
      data: updatedLoan,
    };
  }

  async getLoanStatsByCategory() {
    const totalLoans = await this.prisma.loan.count();
    const categories = ['fashion', 'electronics', 'home appliances'];

    const distribution = await Promise.all(
      categories.map(async (category) => {
        const count = await this.prisma.loan.count({ where: { category } });
        return {
          category,
          percentage: totalLoans === 0 ? 0 : parseFloat(((count / totalLoans) * 100).toFixed(2)),
        };
      }),
    );

    return distribution;
  }

  async getUserTotalLoan(userId: string) {
    const loans = await this.prisma.loan.findMany({ where: { userId } });
    const total = loans.reduce((sum, loan) => sum + loan.amount, 0);
    return { userId, totalLoan: total };
  }

  async getGroupedLoanHistoryForUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) throw new NotFoundException('User not found');

    const loans = await this.prisma.loan.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return {
      userId: user.id,
      name: user.fullName,
      loans: loans.map((loan) => ({
        loanId: loan.id,
        amountApproved: loan.amount,
        status: loan.status,
        interestRate: loan.interestRate,
        durationInMonths: loan.duration,
        category: loan.category,
        purpose: loan.purpose,
        vendor: loan.vendor,
        createdAt: loan.createdAt,
      })),
    };
  }
  async getApprovedLoanWithPaymentsAndDetails(userId: string) {
    // Step 1: Find approved or paid off loan
    const approvedLoan = await this.prisma.loan.findFirst({
      where: {
        userId,
        status: {
          in: ['approved', 'paid off'],
        },
      },
      include: {
        user: true,
      },
    });

    if (!approvedLoan) {
      throw new NotFoundException('No approved or paid-off loan found for this user');
    }

    // Step 2: Fetch repayments separately, ordered by repaymentDate
    const repayments = await this.prisma.loanRepayment.findMany({
      where: { loanId: approvedLoan.id },
      orderBy: { repaymentDate: 'asc' },
    });

    // Step 3: Calculate total paid
    const totalPaid = repayments.reduce((sum, repayment) => sum + repayment.amount, 0);

    // Step 4: Return full loan + repayments data
    return {
      loanId: approvedLoan.id,
      amountApproved: approvedLoan.amount,
      status: approvedLoan.status,
      interestRate: approvedLoan.interestRate,
      durationInMonths: approvedLoan.duration,
      category: approvedLoan.category,
      purpose: approvedLoan.purpose,
      vendor: approvedLoan.vendor,
      remainingBalance: approvedLoan.remainingBalance,
      createdAt: approvedLoan.createdAt,
      repayments,
      totalPaid,
    };
  }



  async getUserRepaymentSchedule(userId: string) {
    const loans = await this.prisma.loan.findMany({
      where: {
        userId,
        status: 'approved',
      },
      include: {
        user: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return loans.map((loan) => {
      const interestAmount = parseFloat(((loan.amount * loan.interestRate) / 100).toFixed(2));
      const totalRepayable = parseFloat((loan.amount + interestAmount).toFixed(2));

      return {
        loanId: loan.id,
        category: loan.category,
        purpose: loan.purpose,
        vendor: loan.vendor,
        durationInMonths: loan.duration,
        interestRate: loan.interestRate,
        interestAmount,
        totalRepayable,
        user: {
          userId: loan.userId,
          name: loan.user.fullName,
        },
        createdAt: loan.createdAt,
      };
    });
  }
}
