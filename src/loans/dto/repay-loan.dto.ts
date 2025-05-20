import { IsNotEmpty, IsNumber, IsString, IsDateString, IsOptional } from 'class-validator';

export class RepayLoanDto {
  @IsNumber()
  @IsNotEmpty()
  amount: number;
}
