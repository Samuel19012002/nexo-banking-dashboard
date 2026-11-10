export type TransactionStatus = "Completed" | "Pending" | "Declined";
export type TransactionType = "Income" | "Expense";

export type Transaction = {
  id: string;
  merchant: string;
  description: string;
  category: string;
  account: string;
  date: string;
  amount: number;
  status: TransactionStatus;
  type: TransactionType;
  reference: string;
};

export type Account = {
  id: string;
  name: string;
  number_last4: string;
  account_type: string;
  balance: number;
  available_balance: number;
};

export type Payment = {
  id: string;
  confirmation: string;
  status: string;
  recipient: string;
  amount: number;
  memo: string;
  estimated_arrival: string;
  created_at: string;
  available_balance: number;
};
