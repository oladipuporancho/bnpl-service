import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Query,
  Delete,
} from '@nestjs/common';
import { LoansService } from './loan.service';
import { ApplyLoanDto } from './dto/apply-loan.dto';
import { RepayLoanDto } from './dto/repay-loan.dto';

@Controller('loans')
export class LoansController {
  constructor(private readonly loansService: LoansService) {}

  @Post('apply/:userId')
  applyLoan(@Param('userId') userId: string, @Body() dto: ApplyLoanDto) {
    return this.loansService.applyLoan(userId, dto);
  }

  @Get('transactions/:userId')
  getUserTransactions(@Param('userId') userId: string) {
    return this.loansService.getUserTransactions(userId);
  }

  @Put('flag/:userId/admin/:adminId')
  toggleFlaggedStatus(
    @Param('userId') userId: string,
    @Param('adminId') adminId: string,
    @Query('adminPassword') adminPassword: string,
  ) {
    return this.loansService.toggleFlaggedStatus(userId, adminId, adminPassword);
  }

  @Get('repayment/history/:loanId')
  getRepaymentHistory(@Param('loanId') loanId: string) {
    return this.loansService.getRepaymentHistory(loanId);
  }

  @Get('category/:category')
  getLoansByCategory(@Param('category') category: string) {
    return this.loansService.getLoansByCategory(category);
  }

  @Get('user/:userId')
  getLoansByUser(@Param('userId') userId: string) {
    return this.loansService.getLoansByUser(userId);
  }

  @Post(':loanId/repay')
  repayLoan(
    @Param('loanId') loanId: string,
    @Param('userId') userId: string,
    @Body() dto: RepayLoanDto,
  ) {
    return this.loansService.repayLoan(loanId, userId, dto);
  }

  @Get('stats/category')
  getLoanStatsByCategory() {
    return this.loansService.getLoanStatsByCategory();
  }

  @Get('total/user/:userId')
  getUserTotalLoan(@Param('userId') userId: string) {
    return this.loansService.getUserTotalLoan(userId);
  }

  @Get('history/grouped/:userId')
  getGroupedLoanHistoryForUser(@Param('userId') userId: string) {
    return this.loansService.getGroupedLoanHistoryForUser(userId);
  }

  @Get('approved/:userId')
  getApprovedLoanWithPaymentsAndDetails(@Param('userId') userId: string) {
    return this.loansService.getApprovedLoanWithPaymentsAndDetails(userId);
  }

  @Get('payment/:userId')
  getUserPaymentHistory(@Param('userId') userId: string) {
    return this.loansService.getUserPaymentHistory(userId);
  }

  @Get('history/:userId')
getLoanHistoryByUser(@Param('userId') userId: string) {
  return this.loansService.getLoanHistoryByUser(userId);
 }

}
