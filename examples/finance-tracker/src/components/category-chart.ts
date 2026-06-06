import { computed } from '@takanashi/rikka-signal';
import { When, For, div, span } from '@takanashi/rikka-dom';
import {
  categoryBreakdown,
  CategoryBreakdown,
} from '../finance-store';

function CategoryBar(item: CategoryBreakdown) {
  return div({ class: 'category-bar-item' },
    div({ class: 'category-bar-header' },
      span({ class: 'category-icon' }, item.icon),
      span({ class: 'category-name' }, item.category),
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
        span({ class: 'empty-title' }, 'No expense data'),
        span({ class: 'empty-subtitle' }, 'Add expenses to see breakdown')
      )
    )
  );
}
