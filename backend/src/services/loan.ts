import { prisma } from "../prisma";
import { Decimal } from "@prisma/client/runtime/library";

/**
 * Loan Service — Business logic for loan operations
 */

export interface CreateLoanInput {
  userId: string;
  friendName: string;
  amount: number;
  dueDate: string;
}

export interface LoanSummary {
  totalLent: number;
  totalRepaid: number;
  overdueAmount: number;
  activeLoans: number;
  overdueLoans: number;
}

// Create a new loan entry
export async function createLoan(input: CreateLoanInput) {
  return prisma.loan.create({
    data: {
      userId: input.userId,
      friendName: input.friendName,
      amount: new Decimal(input.amount),
      dueDate: new Date(input.dueDate),
    },
  });
}

// Get all loans for a user, sorted by date (newest first)
export async function getUserLoans(userId: string) {
  const loans = await prisma.loan.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  const now = new Date();
  return loans.map((loan) => ({
    ...loan,
    amount: Number(loan.amount),
    isOverdue: !loan.isRepaid && new Date(loan.dueDate) < now,
  }));
}

// Mark a loan as repaid
export async function markAsRepaid(loanId: string, userId: string) {
  // Verify the loan belongs to this user
  const loan = await prisma.loan.findFirst({
    where: { id: loanId, userId },
  });

  if (!loan) return null;
  if (loan.isRepaid) return { ...loan, amount: Number(loan.amount), alreadyRepaid: true };

  const updated = await prisma.loan.update({
    where: { id: loanId },
    data: {
      isRepaid: true,
      repaidAt: new Date(),
    },
  });

  return { ...updated, amount: Number(updated.amount) };
}

// Get summary statistics
export async function getLoanSummary(userId: string): Promise<LoanSummary> {
  const loans = await prisma.loan.findMany({
    where: { userId },
  });

  const now = new Date();
  let totalLent = 0;
  let totalRepaid = 0;
  let overdueAmount = 0;
  let activeLoans = 0;
  let overdueLoans = 0;

  for (const loan of loans) {
    const amount = Number(loan.amount);
    totalLent += amount;

    if (loan.isRepaid) {
      totalRepaid += amount;
    } else {
      activeLoans++;
      if (new Date(loan.dueDate) < now) {
        overdueAmount += amount;
        overdueLoans++;
      }
    }
  }

  return {
    totalLent: Math.round(totalLent * 100) / 100,
    totalRepaid: Math.round(totalRepaid * 100) / 100,
    overdueAmount: Math.round(overdueAmount * 100) / 100,
    activeLoans,
    overdueLoans,
  };
}

// Update receipt URL for a loan
export async function updateReceipt(
  loanId: string,
  userId: string,
  receiptUrl: string
) {
  const loan = await prisma.loan.findFirst({
    where: { id: loanId, userId },
  });

  if (!loan) return null;

  return prisma.loan.update({
    where: { id: loanId },
    data: { receiptUrl },
  });
}