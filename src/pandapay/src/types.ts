/**
 * Shared Type Definitions for PandaPay - Modern Interledger Platform
 */

export interface User {
  id: string;
  email: string;
  name: string;
  consentAccepted: boolean;
  kycStatus: 'unverified' | 'pending' | 'verified';
  kycDetails?: {
    fullName: string;
    idNumber: string;
    country: string;
    documentType: string;
  };
  createdAt: string;
}

export interface Wallet {
  id: string;
  userId: string;
  username: string; // e.g. "corazon"
  pointer: string;  // e.g. "$ilp.interledger-test.dev/corazon"
  balance: number;
  reserveBalance: number; // Reserve savings bucket
  creditOwed: number;     // Outstanding debt paid by fintech backup groups
  creditLimit: number;    // Maximum credit cover limit
  accumulatedInterest: number; // Interest accrued on late/backed-up payments
  confidenceScore: number; // AI calculated financial confidence score (0-1000)
  currency: string; // e.g. "ZAR" or "USD"
  active: boolean;
  createdAt: string;
}

export interface Grant {
  id: string;
  walletId: string;
  type: 'incoming' | 'outgoing' | 'quote';
  client: string;
  scope: string;
  active: boolean;
  createdAt: string;
}

export interface IncomingPayment {
  id: string;
  pointer: string;
  amount: number;
  currency: string;
  description: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
}

export interface OutgoingPayment {
  id: string;
  pointer: string;
  amount: number;
  currency: string;
  description: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
}

export interface Subscription {
  id: string;
  walletId: string;
  merchantName: string;
  pointer: string;
  amount: number;
  currency: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  category: string;
  status: 'active' | 'paused' | 'failed' | 'backed_up';
  nextPaymentDate: string;
  lastPaymentDate?: string;
  interestRate?: number; // Interest rate if backup fintech covers it
  createdAt: string;
}

export interface Quote {
  id: string;
  source: string;
  destination: string;
  sourceAmount: number;
  destinationAmount: number;
  expiry: string;
}

export interface Transaction {
  id: string;
  walletId: string;
  type: 'deposit' | 'send' | 'receive';
  direction: 'in' | 'out';
  amount: number;
  currency: string;
  counterparty: string; // shortening pointer, e.g., "$ilp.../liam"
  reference: string;
  status: 'pending' | 'completed' | 'failed';
  category: string; // e.g. "Food", "Transport", "Tech", "Savings", "General"
  createdAt: string;
}

export interface BudgetCategory {
  id: string;
  walletId: string;
  name: string;
  icon: string; // Lucide icon identifier or emoji
  limit: number;
  allocated: number;
  color: string; // hex or tailwind class
}

export interface BudgetAllocation {
  id: string;
  walletId: string;
  categoryId: string;
  amount: number;
  month: string; // e.g., "2026-06"
}

export interface Message {
  role: 'user' | 'model' | 'system';
  content: string;
  timestamp: string;
}

export interface AIConversation {
  id: string;
  userId: string;
  messages: Message[];
  createdAt: string;
}

export interface AuditLog {
  id: string;
  action: string;
  details: string;
  timestamp: string;
}

export type MascotState = 'idle' | 'happy' | 'warning' | 'sad' | 'thinking';

export interface MascotProps {
  state: MascotState;
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export interface BnplInstallment {
  id: string;
  installmentNumber: number;
  amount: number;
  dueDate: string;
  status: 'paid' | 'pending' | 'overdue';
  paidAt?: string;
  transactionId?: string;
}

export interface BnplContract {
  id: string;
  walletId: string;
  merchantName: string;
  merchantLogo?: string;
  purchaseAmount: number;
  remainingAmount: number;
  currency: string;
  totalInstallments: number;
  status: 'active' | 'completed' | 'overdue';
  createdAt: string;
  installments: BnplInstallment[];
}

