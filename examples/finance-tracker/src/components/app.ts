import { div, h1, span } from '@rikka/dom';
import { TransactionForm } from './transaction-form';
import { TransactionList } from './transaction-list';
import { StatsPanel } from './stats-panel';
import { CategoryChart } from './category-chart';

export function App() {
  return div({ class: 'app' },
    h1({ class: 'app-title' }, '💰 Personal Finance Tracker'),
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
            span({}, 'Recent Transactions')
          ),
          TransactionList()
        ),
        div({ class: 'card chart-card' },
          div({ class: 'card-header' },
            span({}, 'Expense Breakdown')
          ),
          CategoryChart()
        )
      )
    )
  );
}