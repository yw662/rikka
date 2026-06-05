import { defineElement } from '@rikka/elements';
import { css, div, h1, h2, p, pre, a } from '@rikka/dom';
import { sharedStyles, docPageStyles } from '../../shared/styles';

const styles = css`
  ${docPageStyles}
`;

export const RikkaDocSignal03 = defineElement('rikka-doc-signal-03', {
  styles,
  render() {
    return div({ class: 'doc-page' },
      div({ class: 'doc-header' },
        h1({ class: 'doc-title' }, 'computed()'),
        p({ class: 'doc-subtitle' }, 'Computed signals derive their value from other signals.'),
      ),
      div({ class: 'doc-section' },
        h2({ class: 'section-title' }, 'Creating a Computed Signal'),
        p({},
          'Use ',
          sharedStyles.inlineCode('computed(fn)'),
          ' to create a signal that derives its value from other signals. The function re-runs whenever a dependency changes.',
        ),
        sharedStyles.createPlayground(
          `const firstName = signal('Rikka');
const lastName = signal('Reactive');
const fullName = computed(() => \`\${firstName.get()} \${lastName.get()}\`);

fullName.get(); // 'Rikka Reactive'

container.appendChild(div({},
  h2({}, 'Computed Signal'),
  p({}, 'Full Name: ', fullName),
  div({ style: { display: 'flex', gap: '8px', marginTop: '8px' } },
    input({ value: firstName, placeholder: 'First name' }),
    input({ value: lastName, placeholder: 'Last name' })
  )
));`,
          '220',
          'Computed Basics'
        ),
      ),
      div({ class: 'doc-section' },
        h2({ class: 'section-title' }, 'Auto-Tracking'),
        p({},
          'Dependencies are tracked automatically. Any ',
          sharedStyles.inlineCode('.get()'),
          ' call inside the computed function registers a dependency.',
        ),
        p({},
          'No explicit dependency arrays or watchers needed — just read signals and the rest is handled for you.',
        ),
      ),
      div({ class: 'doc-section' },
        h2({ class: 'section-title' }, 'Lazy Evaluation'),
        p({},
          'Computed signals are lazy. The derivation function only runs when ',
          sharedStyles.inlineCode('.get()'),
          ' is called, and only re-evaluates if a dependency has changed since the last read.',
        ),
      ),
      div({ class: 'doc-section' },
        h2({ class: 'section-title' }, 'Slicing a Complex Signal'),
        p({},
          'When the source of truth is one large object — e.g. a record loaded from the server — wrap each reader in a ',
          sharedStyles.inlineCode('computed'),
          ' that pulls out only the slice it needs. The ',
          sharedStyles.inlineCode('computed'),
          ' then depends precisely on that slice, not on the whole object.',
        ),
        p({},
          sharedStyles.inlineCode('Computed'),
          ' uses reference equality by default. If the slice value is unchanged, downstream readers do not re-run — even though the parent ',
          sharedStyles.inlineCode('signal'),
          ' was reassigned to a brand-new object.',
        ),
        sharedStyles.createPlayground(
          `const user = signal({
  info: { name: 'Alice', email: 'a@b.c', age: 30 },
  settings: { theme: 'dark', lang: 'en' },
});

// Each computed depends on exactly one slice
const userName = computed(() => user.get().info.name);
const userTheme = computed(() => user.get().settings.theme);

// Effects fire only when their slice actually changes
effect(() => console.log('name ->', userName.get()));
effect(() => console.log('theme ->', userTheme.get()));

container.appendChild(div({},
  h2({}, 'Slices'),
  p({}, 'name: ', userName),
  p({}, 'theme: ', userTheme),
  h2({}, 'Mutate one slice at a time'),
  div({ style: { display: 'flex', gap: '8px' } },
    button({
      onclick: () => {
        const u = user.get();
        user.set({ ...u, info: { ...u.info, name: u.info.name + '!' } });
      },
    }, 'Bump name'),
    button({
      onclick: () => {
        const u = user.get();
        user.set({ ...u, settings: { ...u.settings, theme: u.settings.theme === 'dark' ? 'light' : 'dark' } });
      },
    }, 'Toggle theme'),
  ),
));`,
          420,
          'Slicing a Signal'
        ),
      ),
      div({ class: 'doc-section' },
        h2({ class: 'section-title' }, 'Try It'),
        sharedStyles.createPlayground(
          `import { signal, computed } from '@rikka/signal';

const firstName = signal('Rikka');
const lastName = signal('Reactive');
const fullName = computed(() => \`\${firstName.get()} \${lastName.get()}\`);

effect(() => {
  console.log(fullName.get());
});

firstName.set('Hello');
// Logs: 'Hello Reactive'`,
          300,
          'Full Name Demo'
        ),
      ),
      div({ class: 'doc-nav' },
        a({ class: 'nav-link prev', href: '#/docs/@rikka/signal/signal' }, '← signal()'),
        a({ class: 'nav-link next', href: '#/docs/@rikka/signal/effect' }, 'effect() →'),
      ),
    );
  }
});
