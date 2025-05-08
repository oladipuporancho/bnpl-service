import { IsNotEmpty, IsNumber } from 'class-validator';

export class RepayLoanDto {
  @IsNumber()
  @IsNotEmpty()
  amount: number;  // The amount the user wants to repay
}
