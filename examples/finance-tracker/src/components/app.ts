import { div, h1, span, button } from '@takanashi/rikka-dom';
import { computed } from '@takanashi/rikka-signal';
import { t, locale, setLocale } from '../i18n.js';
import { content } from '../content.js';
import { TransactionForm } from './transaction-form';
import { TransactionList } from './transaction-list';
import { StatsPanel } from './stats-panel';
import { CategoryChart } from './category-chart';

export function App() {
  const localeLabel = computed(() => locale.get() === 'en' ? '中文' : 'EN');

  return div({ class: 'app' },
    div({ class: 'app-header' },
      h1({ class: 'app-title' }, () => t(content.appTitle)),
      button({
        class: 'locale-toggle',
        onclick: () => setLocale(locale.get() === 'en' ? 'zh' : 'en'),
      }, localeLabel)
    ),
    div({ class: 'main-content' },
      div({ class: 'left-column' },
        div({ class: 'card form-card' },
          TransactionForm()
        ),
        div({ class: 'card stats-card' },
          StatsPanel()
        )
      ),
      div({ class: 'right-column' },
        div({ class: 'card transactions-card' },
          div({ class: 'card-header' },
            span({}, () => t(content.recentTransactions))
          ),
          TransactionList()
        ),
        div({ class: 'card chart-card' },
          div({ class: 'card-header' },
            span({}, () => t(content.expenseBreakdown))
          ),
          CategoryChart()
        )
      )
    )
  );
}