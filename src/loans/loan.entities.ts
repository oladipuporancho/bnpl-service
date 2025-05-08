export class Loan {
  id: string;
  userId: string;
  amount: number;
  purpose: string;
  durationInMonths: number;
  status: 'pending' | 'approved' | 'rejected';
  approvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
