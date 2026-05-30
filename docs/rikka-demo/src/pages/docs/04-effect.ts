import { defineElement } from 'rikka-elements';
import { css, div, h1, h2, p, pre, a } from 'rikka-dom';
import { sharedStyles, docPageStyles } from '../../shared/styles';

const styles = css`
  ${docPageStyles}
`;

export const RikkaDocSignal04 = defineElement('rikka-doc-signal-04', {
  styles,
  render() {
    return div({ class: 'doc-page' },
      div({ class: 'doc-header' },
        h1({ class: 'doc-title' }, 'effect()'),
        p({ class: 'doc-subtitle' }, 'Effects run side effects when signals change.'),
      ),
      div({ class: 'doc-section' },
        h2({ class: 'section-title' }, 'Creating an Effect'),
        p({},
          'Use ',
          sharedStyles.inlineCode('effect(fn)'),
          ' to run a function whenever its signal dependencies change. Effects are the primary way to perform side effects in Rikka.',
        ),
        sharedStyles.createPlayground(
          `const count = signal(0);
const logs = signal<string[]>([]);
const logText = computed(() => logs.get().join('\\n'));

effect(() => {
  const msg = \`Count is now \${count.get()}\`;
  logs.set([...logs.get(), msg]);
});

container.appendChild(div({},
  h2({}, 'Effect Demo'),
  p({}, 'Count: ', count),
  button({ onclick: () => count.set(count.get() + 1) }, 'Increment'),
  pre({ style: { marginTop: '8px', padding: '8px', background: '#0d1117', borderRadius: '4px', color: '#94a3b8', fontSize: '0.75rem', maxHeight: '120px', overflow: 'auto' } }, logText)
));`,
          '260',
          'Effect Basics'
        ),
      ),
      div({ class: 'doc-section' },
        h2({ class: 'section-title' }, 'Cleanup Function'),
        p({},
          'An effect callback can return a function — the ',
          sharedStyles.inlineCode('cleanup function'),
          '. It runs in two cases:',
        ),
        p({ style: { paddingLeft: '16px', margin: '8px 0' } },
          '1. Before the next re-execution (when dependencies change)',
        ),
        p({ style: { paddingLeft: '16px', margin: '8px 0' } },
          '2. When the effect is disposed',
        ),
        p({},
          'The cleanup always runs before the new effect body. This is useful for removing event listeners, clearing timers, or aborting fetch requests.',
        ),
        sharedStyles.createPlayground(
          `const count = signal(0);
const logs = signal<string[]>([]);
const logText = computed(() => logs.get().join('\\n'));

effect(() => {
  logs.set([...logs.get(), 'effect: count=' + count.get()]);
  return () => {
    logs.set([...logs.get(), 'cleanup']);
  };
});

container.appendChild(div({},
  h2({}, 'Cleanup Execution Order'),
  p({}, 'Count: ', count),
  button({ onclick: () => count.set(count.get() + 1) }, 'Increment'),
  p({ style: { marginTop: '8px', color: '#71717a', fontSize: '0.8rem' } }, 'Each click triggers: cleanup → effect'),
  pre({ style: { marginTop: '8px', padding: '8px', background: '#0d1117', borderRadius: '4px', color: '#94a3b8', fontSize: '0.75rem', maxHeight: '120px', overflow: 'auto' } }, logText)
));`,
          '280',
          'Effect Cleanup'
        ),
      ),
      div({ class: 'doc-section' },
        h2({ class: 'section-title' }, 'Disposing Effects'),
        p({},
          sharedStyles.inlineCode('effect()'),
          ' returns a dispose function. Call it to permanently stop the effect and run its cleanup.',
        ),
        sharedStyles.createPlayground(
          `const count = signal(0);
const logs = signal<string[]>([]);
const logText = computed(() => logs.get().join('\\n'));
let disposed = false;

const dispose = effect(() => {
  if (!disposed) {
    logs.set([...logs.get(), 'count: ' + count.get()]);
  }
});

count.set(1); // effect runs

container.appendChild(div({},
  h2({}, 'Dispose Effect'),
  p({}, 'Count: ', count),
  button({ onclick: () => count.set(count.get() + 1) }, 'Increment'),
  button({ onclick: () => { dispose(); disposed = true; logs.set([...logs.get(), '— disposed —']); }, style: { marginLeft: '8px' } }, 'Dispose'),
  pre({ style: { marginTop: '8px', padding: '8px', background: '#0d1117', borderRadius: '4px', color: '#94a3b8', fontSize: '0.75rem', maxHeight: '120px', overflow: 'auto' } }, logText)
));`,
          '280',
          'Effect Dispose'
        ),
      ),
      div({ class: 'doc-section' },
        h2({ class: 'section-title' }, 'Try It'),
        sharedStyles.createPlayground(
          `import { signal, effect } from 'rikka-signal';

const count = signal(0);
const log: string[] = [];

const dispose = effect(() => {
  const msg = \`Count: \${count.get()}\`;
  log.push(msg);
  console.log(msg);
  return () => {
    console.log('cleanup before next run');
  };
});

count.set(1);
count.set(2);

console.log('Log:', log);
// ['Count: 0', 'Count: 1', 'Count: 2']

dispose();`,
          340,
          'Effect Logging Demo'
        ),
      ),
      div({ class: 'doc-nav' },
        a({ class: 'nav-link prev', href: '#/docs/rikka-signal/computed' }, '← computed()'),
        a({ class: 'nav-link next', href: '#/docs/rikka-signal/batch' }, 'Batch Updates →'),
      ),
    );
  }
});
