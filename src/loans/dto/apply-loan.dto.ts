export class ApplyLoanDto {
  userId: string; 
  amount: number;
  purpose: string;
  durationInMonths: number;
  category: string; 
  vendor?: string;
}
