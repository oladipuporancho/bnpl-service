export class ApplyLoanDto {
  userId: string; // Add userId here
  amount: number;
  purpose: string;
  durationInMonths: number;
  category: string; // Add category here
  vendor?: string;
}
