import {
  Controller,
  Post,
  Body,
  Param,
  Get,
  Patch,
} from '@nestjs/common';
import { LoansService } from './loan.service';
import { ApplyLoanDto } from './dto/apply-loan.dto';
import { RepayLoanDto } from './dto/repay-loan.dto';

@Controller('loans')
export class LoansController {
  constructor(private readonly loansService: LoansService) {}

  @Post('apply')
  applyLoan(@Body() dto: ApplyLoanDto) {
    return this.loansService.applyLoan(dto.userId, dto);
  }

  @Patch(':id/approve')
  approveLoan(
    @Param('id') loanId: string,
    @Body() body: { adminId: string; adminPassword: string },
  ) {
    return this.loansService.approveLoan(loanId, body.adminId, body.adminPassword);
  }

  @Get('history/:userId')
  getUserLoanHistory(@Param('userId') userId: string) {
    return this.loansService.getUserLoanHistory(userId);
  }

  @Get('transactions/:userId')
  getUserTransactions(@Param('userId') userId: string) {
    return this.loansService.getUserTransactions(userId);
  }

  @Post(':loanId/repay')
  repayLoan(
    @Param('loanId') loanId: string,
    @Body() body: { amount: number; userId: string },
  ) {
    const dto: RepayLoanDto = { amount: body.amount };
    return this.loansService.repayLoan(loanId, body.userId, dto);
  }

  @Get('stats/category')
  getLoanStatsByCategory() {
    return this.loansService.getLoanStatsByCategory();
  }

  @Get('stats/user-total/:userId')
  getUserTotalLoan(@Param('userId') userId: string) {
    return this.loansService.getUserTotalLoan(userId);
  }

  @Get('history/grouped/:userId')
  getGroupedLoanHistoryForUser(@Param('userId') userId: string) {
    return this.loansService.getGroupedLoanHistoryForUser(userId);
  }

  @Get('loan-with-payments/:userId')
async getLoanWithPayments(@Param('userId') userId: string) {
  return this.loansService.getApprovedLoanWithPaymentsAndDetails(userId);
}

  @Get('repayment-schedule/:userId')
  getUserRepaymentSchedule(@Param('userId') userId: string) {
    return this.loansService.getUserRepaymentSchedule(userId);
  }

  @Get('applications')
async getAllLoanApplications() {
  return this.loansService.getAllLoanApplications();
 }
}
