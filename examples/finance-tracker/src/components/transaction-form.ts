import { signal, computed, effect } from '@takanashi/rikka-signal';
import {
  div,
  form,
  input,
  select,
  option,
  button,
  label,
} from '@takanashi/rikka-dom';
import {
  addTransaction,
  getTodayDate,
  CATEGORIES,
  CATEGORY_ICONS,
  TransactionType,
  TransactionCategory,
} from '../finance-store';

export function TransactionForm() {
  const amount = signal('');
  const type = signal<TransactionType>('expense');
  const category = signal<TransactionCategory>('Food');
  const description = signal('');
  const date = signal(getTodayDate());

  const isValid = computed(() => {
    const amt = parseFloat(amount.get());
    return !isNaN(amt) && amt > 0;
  });

  const incomeBtnClass = computed(() => `type-btn ${type.get() === 'income' ? 'active income' : ''}`);
  const expenseBtnClass = computed(() => `type-btn ${type.get() === 'expense' ? 'active expense' : ''}`);
  const addBtnClass = computed(() => `add-btn ${type.get()}`);
  const addBtnText = computed(() => `+ Add ${type.get() === 'income' ? 'Income' : 'Expense'}`);

  function handleSubmit() {
    if (!isValid.get()) return;

    const amt = parseFloat(amount.get());
    addTransaction(
      amt,
      type.get(),
      category.get(),
      description.get().trim(),
      date.get()
    );

    amount.set('');
    type.set('expense');
    category.set('Food');
    description.set('');
    date.set(getTodayDate());
  }

  const selectEl = select({
    id: 'category',
    class: 'category-select',
    onchange: (e: Event) => category.set((e.target as HTMLSelectElement).value as TransactionCategory),
  },
    ...CATEGORIES.map(cat =>
      option({
        value: cat,
      }, `${CATEGORY_ICONS[cat]} ${cat}`)
    )
  );

  effect(() => {
    selectEl.selectedIndex = CATEGORIES.indexOf(category.get());
  });

  return form(
    { class: 'transaction-form', onsubmit: (e: Event) => {
      e.preventDefault();
      handleSubmit();
    }},
    div({ class: 'form-row' },
      div({ class: 'form-group amount-group' },
        label({ for: 'amount' }, 'Amount'),
        input({
          id: 'amount',
          type: 'number',
          step: '0.01',
          min: '0.01',
          required: true,
          placeholder: '0.00',
          class: 'amount-input',
          value: amount,
        })
      ),
      div({ class: 'form-group type-group' },
        label({ for: 'type' }, 'Type'),
        div({ class: 'type-toggle' },
          button({
            type: 'button',
            class: incomeBtnClass,
            onclick: () => type.set('income'),
          }, 'Income'),
          button({
            type: 'button',
            class: expenseBtnClass,
            onclick: () => type.set('expense'),
          }, 'Expense')
        )
      )
    ),
    div({ class: 'form-row' },
      div({ class: 'form-group category-group' },
        label({ for: 'category' }, 'Category'),
        selectEl
      ),
      div({ class: 'form-group date-group' },
        label({ for: 'date' }, 'Date'),
        input({
          id: 'date',
          type: 'date',
          required: true,
          class: 'date-input',
          value: date,
          onchange: (e: Event) => date.set((e.target as HTMLInputElement).value),
        })
      )
    ),
    div({ class: 'form-group description-group' },
      label({ for: 'description' }, 'Description'),
      input({
        id: 'description',
        type: 'text',
        placeholder: 'What was this for?',
        class: 'description-input',
        value: description,
      })
    ),
    div({ class: 'form-actions' },
      button({
        type: 'submit',
        class: addBtnClass,
      }, addBtnText)
    )
  );
}
