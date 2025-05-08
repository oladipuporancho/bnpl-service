import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ApplyLoanDto } from './dto/apply-loan.dto';
import { RepayLoanDto } from './dto/repay-loan.dto';
import { EmailService } from '../email/email.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class LoansService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  // Apply for a loan
  async applyLoan(userId: string, dto: ApplyLoanDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const loan = await this.prisma.loan.create({
      data: {
        userId,
        amount: dto.amount,
        purpose: dto.purpose,
        duration: dto.durationInMonths,
        status: 'pending',
        loanType: 'undecided',
        repaymentType: 'undecided',
        interestRate: 0, // Initially 0
        category: dto.category,
        remainingBalance: dto.amount, // Store remaining balance initially equal to loan amount
      },
    });

    await this.emailService.sendEmail(
      user.email,
      'Loan Application Received',
      `Your loan application for ₦${dto.amount} has been received and is under review.`,
      `<p>Your loan application for <strong>₦${dto.amount}</strong> has been received and is under review.</p>`,
    );

    return {
      message: 'Loan application submitted successfully',
      data: loan,
    };
  }

  // Approve a loan (admin only)
  async approveLoan(loanId: string, adminId: string, adminPassword: string) {
    if (!adminId || !adminPassword) {
      throw new BadRequestException('Admin ID and password are required');
    }

    const admin = await this.prisma.user.findFirst({
      where: {
        isAdmin: true,
        OR: [
          { id: adminId },
          { email: typeof adminId === 'string' ? adminId.toLowerCase() : '' },
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

    const randomInterestRate = parseFloat((Math.random() * 7 + 3).toFixed(2)); // Random interest rate between 3% and 10%

    const updatedLoan = await this.prisma.loan.update({
      where: { id: loanId },
      data: {
        status: 'approved',
        approvalDate: new Date(),
        interestRate: randomInterestRate, // Set the interest rate for the loan
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

  // Flag/Unflag an account (admin only)
  async toggleFlaggedStatus(userId: string, adminId: string, adminPassword: string) {
    const admin = await this.prisma.user.findFirst({
      where: {
        isAdmin: true,
        OR: [
          { id: adminId },
          { email: typeof adminId === 'string' ? adminId.toLowerCase() : '' },
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
      data: {
        isFlagged: !user.isFlagged, // Toggle flag status
      },
    });

    return {
      message: user.isFlagged ? 'User account unflagged' : 'User account flagged',
      data: updatedUser,
    };
  }

  // Get repayment history of a loan
  async getRepaymentHistory(loanId: string) {
    const loan = await this.prisma.loan.findUnique({
      where: { id: loanId },
      include: { user: true }, // Include the user info to show the related user
    });

    if (!loan) throw new NotFoundException('Loan not found');

    return this.prisma.loanRepayment.findMany({
      where: { loanId },
      orderBy: { repaymentDate: 'desc' },
    });
  }

  // Get loans by category
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

  // Get loans by user
  async getLoansByUser(userId: string) {
    return this.prisma.loan.findMany({
      where: { userId },
      orderBy: { id: 'desc' },
    });
  }

  // Repay a loan
  async repayLoan(loanId: string, userId: string, dto: RepayLoanDto) {
    const loan = await this.prisma.loan.findUnique({ where: { id: loanId } });
    if (!loan) throw new NotFoundException('Loan not found');

    if (loan.userId !== userId) {
      throw new BadRequestException('User does not own this loan');
    }

    if (dto.amount <= 0) {
      throw new BadRequestException('Repayment amount must be greater than zero');
    }

    // Calculate the total amount to repay including the interest
    const totalLoanAmount = loan.amount + (loan.amount * loan.interestRate) / 100;
    const remainingBalance = loan.remainingBalance - dto.amount;

    if (remainingBalance < 0) {
      throw new BadRequestException('Repayment amount exceeds remaining balance');
    }

    // Update loan repayment date and remaining balance
    const updatedLoan = await this.prisma.loan.update({
      where: { id: loanId },
      data: {
        remainingBalance: remainingBalance,
        repaymentDate: new Date(), // Store the repayment date
        status: remainingBalance === 0 ? 'paid off' : loan.status, // Mark as paid off if balance is zero
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
}
