import { signal, computed, effect } from '@rikka/signal';

export type TransactionType = 'income' | 'expense';

export type TransactionCategory =
  | 'Food'
  | 'Transport'
  | 'Entertainment'
  | 'Shopping'
  | 'Bills'
  | 'Salary'
  | 'Other';

export const CATEGORIES: TransactionCategory[] = [
  'Food',
  'Transport',
  'Entertainment',
  'Shopping',
  'Bills',
  'Salary',
  'Other',
];

export const CATEGORY_ICONS: Record<TransactionCategory, string> = {
  Food: '🍔',
  Transport: '🚗',
  Entertainment: '🎬',
  Shopping: '🛍️',
  Bills: '📄',
  Salary: '💰',
  Other: '📦',
};

export interface Transaction {
  id: number;
  amount: number;
  type: TransactionType;
  category: TransactionCategory;
  description: string;
  date: string;
}

const STORAGE_KEY = 'rikka-finance-transactions';

function loadFromStorage(): { transactions: Transaction[]; nextId: number } {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      return {
        transactions: parsed.transactions || [],
        nextId: parsed.nextId || 1,
      };
    }
  } catch {
  }
  return { transactions: [], nextId: 1 };
}

function saveToStorage(transactions: Transaction[], nextId: number) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ transactions, nextId }));
}

const initialState = loadFromStorage();

export const transactions = signal<Transaction[]>(initialState.transactions);
export const nextId = signal(initialState.nextId);

effect(() => {
  saveToStorage(transactions.get(), nextId.get());
});

export const sortedTransactions = computed(() => {
  return [...transactions.get()].sort((a: Transaction, b: Transaction) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
});

export const totalIncome = computed(() => {
  return transactions.get()
    .filter((t: Transaction) => t.type === 'income')
    .reduce((sum: number, t: Transaction) => sum + t.amount, 0);
});

export const totalExpenses = computed(() => {
  return transactions.get()
    .filter((t: Transaction) => t.type === 'expense')
    .reduce((sum: number, t: Transaction) => sum + t.amount, 0);
});

export const balance = computed(() => {
  return totalIncome.get() - totalExpenses.get();
});

export const monthIncome = computed(() => {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  return transactions.get()
    .filter((t: Transaction) => {
      return t.type === 'income' && new Date(t.date) >= monthStart;
    })
    .reduce((sum: number, t: Transaction) => sum + t.amount, 0);
});

export const monthExpenses = computed(() => {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  return transactions.get()
    .filter((t: Transaction) => {
      return t.type === 'expense' && new Date(t.date) >= monthStart;
    })
    .reduce((sum: number, t: Transaction) => sum + t.amount, 0);
});

export interface CategoryBreakdown {
  category: TransactionCategory;
  icon: string;
  amount: number;
  percentage: number;
}

export const categoryBreakdown = computed((): CategoryBreakdown[] => {
  const txs = transactions.get();
  const expenses = txs.filter((t: Transaction) => t.type === 'expense');
  const totalExpenseAmount = expenses.reduce((sum: number, t: Transaction) => sum + t.amount, 0);

  const breakdown: Record<TransactionCategory, number> = {} as Record<TransactionCategory, number>;

  for (const cat of CATEGORIES) {
    breakdown[cat] = 0;
  }

  for (const tx of expenses) {
    breakdown[tx.category as TransactionCategory] += tx.amount;
  }

  return CATEGORIES
    .map(category => ({
      category,
      icon: CATEGORY_ICONS[category],
      amount: breakdown[category],
      percentage: totalExpenseAmount > 0
        ? Math.round((breakdown[category] / totalExpenseAmount) * 100)
        : 0,
    }))
    .filter(item => item.amount > 0)
    .sort((a, b) => b.amount - a.amount);
});

export function addTransaction(
  amount: number,
  type: TransactionType,
  category: TransactionCategory,
  description: string,
  date: string
) {
  const newTransaction: Transaction = {
    id: nextId.get(),
    amount,
    type,
    category,
    description,
    date,
  };

  transactions.set([...transactions.get(), newTransaction]);
  nextId.set(nextId.get() + 1);
}

export function deleteTransaction(id: number) {
  transactions.set(transactions.get().filter((t: Transaction) => t.id !== id));
}

export function getTodayDate(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}
