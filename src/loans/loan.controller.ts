import { Controller, Post, Body, Param, Get, Patch, BadRequestException } from '@nestjs/common';
import { LoansService } from './loan.service';
import { ApplyLoanDto } from './dto/apply-loan.dto';
import { RepayLoanDto } from './dto/repay-loan.dto';  // Import RepayLoanDto

@Controller('loans')
export class LoansController {
  constructor(private readonly loansService: LoansService) {}

  // Apply for a loan
  @Post('apply')
  applyLoan(@Body() dto: ApplyLoanDto) {
    return this.loansService.applyLoan(dto.userId, dto);
  }

  // Approve a loan (admin only)
  @Patch(':id/approve')
  approveLoan(
    @Param('id') loanId: string,
    @Body() body: { adminId: string; adminPassword: string },
  ) {
    return this.loansService.approveLoan(loanId, body.adminId, body.adminPassword);
  }

  // Get loans by category
  @Get('history/:category')
  async getLoanHistoryByCategory(@Param('category') category: string) {
    try {
      const loans = await this.loansService.getLoansByCategory(category);
      return { message: 'Loans retrieved successfully', data: loans };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Get loans by user
  @Post('my-loans')
  getUserLoans(@Body('userId') userId: string) {
    return this.loansService.getLoansByUser(userId);
  }

  // Repay a loan
  @Post(':loanId/repay')
  async repayLoan(
    @Param('loanId') loanId: string,
    @Body() body: { amount: number; userId: string },
  ) {
    // Create RepayLoanDto with the amount
    const repayLoanDto: RepayLoanDto = { amount: body.amount };

    return this.loansService.repayLoan(loanId, body.userId, repayLoanDto);
  }

  // Get market share (loan percentage) by category
  @Get('stats/category')
  getLoanStatsByCategory() {
    return this.loansService.getLoanStatsByCategory();
  }

  // Get total loan amount for a user
  @Get('stats/user-total/:userId')  // Changed from POST to GET
  getUserTotalLoan(@Param('userId') userId: string) {
    return this.loansService.getUserTotalLoan(userId);
  }
}
