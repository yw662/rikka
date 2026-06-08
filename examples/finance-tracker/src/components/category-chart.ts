import { computed } from '@takanashi/rikka-signal';
import { When, For, div, span } from '@takanashi/rikka-dom';
import {
  categoryBreakdown,
  CategoryBreakdown,
  TransactionCategory,
} from '../finance-store';
import { t } from '../i18n.js';
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

function CategoryBar(item: CategoryBreakdown) {
  return div({ class: 'category-bar-item' },
    div({ class: 'category-bar-header' },
      span({ class: 'category-icon' }, item.icon),
      span({ class: 'category-name' }, t(CATEGORY_CONTENT[item.category])),
      span({ class: 'category-amount' }, `$${item.amount.toFixed(2)}`),
      span({ class: 'category-percentage' }, `${item.percentage}%`)
    ),
    div({ class: 'category-bar-track' },
      div({
        class: 'category-bar-fill',
        style: { width: `${item.percentage}%` },
      })
    )
  );
}

export function CategoryChart() {
  const hasData = computed(() => categoryBreakdown.get().length > 0);

  return div({ class: 'category-chart' },
    When(
      hasData,
      () => div({ class: 'category-bars' },
        For(categoryBreakdown, (item: CategoryBreakdown) => CategoryBar(item), (item: CategoryBreakdown) => item.category)
      ),
      () => div({ class: 'empty-chart' },
        span({ class: 'empty-icon' }, '📊'),
        span({ class: 'empty-title' }, () => t(content.noExpenseData)),
        span({ class: 'empty-subtitle' }, () => t(content.addExpensesToSee))
      )
    )
  );
}
