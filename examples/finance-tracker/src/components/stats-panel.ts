import { computed } from '@takanashi/rikka-signal';
import {
  balance,
  monthIncome,
  monthExpenses,
} from '../finance-store';
import { div, span } from '@takanashi/rikka-dom';

export function StatsPanel() {
  const balanceClass = computed(() => `stat-value ${balance.get() >= 0 ? 'positive' : 'negative'}`);
  const balanceText = computed(() => `$${balance.get().toFixed(2)}`);
  const incomeText = computed(() => `+$${monthIncome.get().toFixed(2)}`);
  const expensesText = computed(() => `-$${monthExpenses.get().toFixed(2)}`);

  return div({ class: 'stats-panel' },
    div({ class: 'stat-card balance-card' },
      span({ class: 'stat-label' }, 'Total Balance'),
      span({ class: balanceClass }, balanceText)
    ),
    div({ class: 'stat-row' },
      div({ class: 'stat-card income-stat' },
        span({ class: 'stat-label' }, 'This Month Income'),
        span({ class: 'stat-value income-text' }, incomeText)
      ),
      div({ class: 'stat-card expense-stat' },
        span({ class: 'stat-label' }, 'This Month Expenses'),
        span({ class: 'stat-value expense-text' }, expensesText)
      )
    )
  );
}
