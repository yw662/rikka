import { computed } from '@takanashi/rikka-signal';
import { When, For, div, span, button } from '@takanashi/rikka-dom';
import {
  sortedTransactions,
  deleteTransaction,
  CATEGORY_ICONS,
  Transaction,
  TransactionCategory,
} from '../finance-store';
import { t, locale } from '../i18n.js';
import { content } from '../content.js';

const CATEGORY_CONTENT: Record<TransactionCategory, { en: string; zh: string }> = {
  Food: content.catFood,
  Transport: content.catTransport,
  Entertainment: content.catEntertainment,
  Shopping: content.catShopping,
  Bills: content.catBills,
  Salary: content.catSalary,
  Other: content.catOther,
};

function TransactionItem(tx: Transaction) {
  const isIncome = tx.type === 'income';
  const amountColor = isIncome ? 'income-text' : 'expense-text';
  const amountPrefix = isIncome ? '+' : '-';

  return div({ class: 'transaction-item' },
    div({ class: 'transaction-icon' },
      span({}, CATEGORY_ICONS[tx.category])
    ),
    div({ class: 'transaction-details' },
      span({ class: 'transaction-category' }, t(CATEGORY_CONTENT[tx.category])),
      span({ class: 'transaction-description' }, tx.description || t(content.noDescription)),
      span({ class: 'transaction-date' }, formatDate(tx.date))
    ),
    div({ class: 'transaction-amount-wrapper' },
      span({ class: `transaction-amount ${amountColor}` },
        `${amountPrefix}$${tx.amount.toFixed(2)}`
      ),
      button({
        class: 'delete-btn',
        onclick: () => deleteTransaction(tx.id),
        title: t(content.deleteTransaction),
      }, '×')
    )
  );
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  const loc = locale.get() === 'zh' ? 'zh-CN' : 'en-US';
  return date.toLocaleDateString(loc, {
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
        span({ class: 'empty-title' }, () => t(content.noTransactions)),
        span({ class: 'empty-subtitle' }, () => t(content.addFirst))
      )
    )
  );
}
