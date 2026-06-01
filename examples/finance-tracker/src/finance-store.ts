import { computed, effect, store, raw } from '@rikka/signal';

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

export interface FinanceState {
  transactions: Transaction[];
  nextId: number;
}

function loadFromStorage(): FinanceState {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data) as FinanceState;
      return {
        transactions: parsed.transactions || [],
        nextId: parsed.nextId || 1,
      };
    }
  } catch {
  }
  return { transactions: [], nextId: 1 };
}

function saveToStorage(state: FinanceState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    transactions: state.transactions,
    nextId: state.nextId,
  }));
}

const initialState = loadFromStorage();

export const financeStore = store<FinanceState>({
  transactions: initialState.transactions,
  nextId: initialState.nextId,
});

effect(() => {
  saveToStorage(raw(financeStore));
});

export const sortedTransactions = computed(() => {
  return [...financeStore.transactions].sort((a: Transaction, b: Transaction) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
});

export const totalIncome = computed(() => {
  return financeStore.transactions
    .filter((t: Transaction) => t.type === 'income')
    .reduce((sum: number, t: Transaction) => sum + t.amount, 0);
});

export const totalExpenses = computed(() => {
  return financeStore.transactions
    .filter((t: Transaction) => t.type === 'expense')
    .reduce((sum: number, t: Transaction) => sum + t.amount, 0);
});

export const balance = computed(() => {
  return totalIncome.get() - totalExpenses.get();
});

export const monthIncome = computed(() => {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  return financeStore.transactions
    .filter((t: Transaction) => {
      return t.type === 'income' && new Date(t.date) >= monthStart;
    })
    .reduce((sum: number, t: Transaction) => sum + t.amount, 0);
});

export const monthExpenses = computed(() => {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  return financeStore.transactions
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
  const expenses = financeStore.transactions.filter((t: Transaction) => t.type === 'expense');
  const totalExpenseAmount = expenses.reduce((sum: number, t: Transaction) => sum + t.amount, 0);

  const breakdown: Record<TransactionCategory, number> = {} as Record<TransactionCategory, number>;

  for (const cat of CATEGORIES) {
    breakdown[cat] = 0;
  }

  for (const tx of expenses) {
    breakdown[tx.category] += tx.amount;
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
    id: financeStore.nextId,
    amount,
    type,
    category,
    description,
    date,
  };

  financeStore.transactions.push(newTransaction);
  financeStore.nextId += 1;
}

export function deleteTransaction(id: number) {
  const index = financeStore.transactions.findIndex((t: Transaction) => t.id === id);
  if (index !== -1) {
    financeStore.transactions.splice(index, 1);
  }
}

export function getTodayDate(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}