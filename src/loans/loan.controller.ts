import {
  Controller,
  Post,
  Body,
  Param,
  Get,
  Patch,
  Req,
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

  @Get('history/:userId')
  getLoanHistoryByUser(@Param('userId') userId: string) {
    return this.loansService.getLoanHistoryByUser(userId);
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
    return this.loansService.repayLoan(
      loanId,
      body.userId,
      { amount: body.amount },
    );
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
  getLoanWithPayments(@Param('userId') userId: string) {
    return this.loansService.getApprovedLoanWithPaymentsAndDetails(userId);
  }

  @Get('repayment-schedule/:userId')
  getUserRepaymentSchedule(@Param('userId') userId: string) {
    return this.loansService.getUserRepaymentSchedule(userId);
  }

  @Get('applications')
  getAllLoanApplications() {
    return this.loansService.getAllLoanApplications();
  }

  @Get('payment/user/:userId')
  getUserPaymentHistoryA(@Param('userId') userId: string) {
    return this.loansService.getUserPaymentHistory(userId);
  }

  @Get('payment/:userId')
  getUserPaymentHistoryB(@Param('userId') userId: string) {
    return this.loansService.getUserPaymentHistory(userId);
  }
}
