import { div, h1, span, button, select, option } from '@takanashi/rikka-dom';
import { computed } from '@takanashi/rikka-signal';
import { t, locale, setLocale, type Locale } from '../i18n.js';
import { content } from '../content.js';
import { TransactionForm } from './transaction-form';
import { TransactionList } from './transaction-list';
import { StatsPanel } from './stats-panel';
import { CategoryChart } from './category-chart';

export function App() {
  const langSelect = select(
    { class: 'locale-toggle' },
    option({ value: 'en' }, 'English'),
    option({ value: 'zh' }, '中文')
  );
  langSelect.value = locale.get();
  langSelect.addEventListener('change', (e) => {
    setLocale((e.target as HTMLSelectElement).value as Locale);
  });

  return div({ class: 'app' },
    div({ class: 'app-header' },
      h1({ class: 'app-title' }, () => t(content.appTitle)),
      langSelect
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