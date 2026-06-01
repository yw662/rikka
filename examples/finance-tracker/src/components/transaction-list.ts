import { computed } from '@rikka/signal';
import { When, For, div, span, button } from '@rikka/dom';
import {
  sortedTransactions,
  deleteTransaction,
  CATEGORY_ICONS,
  Transaction,
} from '../finance-store';

function TransactionItem(tx: Transaction) {
  const isIncome = tx.type === 'income';
  const amountColor = isIncome ? 'income-text' : 'expense-text';
  const amountPrefix = isIncome ? '+' : '-';

  return div({ class: 'transaction-item' },
    div({ class: 'transaction-icon' },
      span({}, CATEGORY_ICONS[tx.category])
    ),
    div({ class: 'transaction-details' },
      span({ class: 'transaction-category' }, tx.category),
      span({ class: 'transaction-description' }, tx.description || 'No description'),
      span({ class: 'transaction-date' }, formatDate(tx.date))
    ),
    div({ class: 'transaction-amount-wrapper' },
      span({ class: `transaction-amount ${amountColor}` },
        `${amountPrefix}$${tx.amount.toFixed(2)}`
      ),
      button({
        class: 'delete-btn',
        onclick: () => deleteTransaction(tx.id),
        title: 'Delete transaction',
      }, '×')
    )
  );
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function TransactionList() {
  const hasTransactions = computed(() => sortedTransactions.get().length > 0);

  return div({ class: 'transaction-list-container' },
    When(
      hasTransactions,
      () => div({ class: 'transaction-list' },
        For(sortedTransactions, (tx: Transaction) => TransactionItem(tx), (tx: Transaction) => tx.id)
      ),
      () => div({ class: 'empty-state' },
        span({ class: 'empty-icon' }, '📝'),
        span({ class: 'empty-title' }, 'No transactions yet'),
        span({ class: 'empty-subtitle' }, 'Add your first transaction above')
      )
    )
  );
}
