import { defineElement } from '@rikka/elements';
import { css, div, h1, h2, p, pre, a } from '@rikka/dom';
import { sharedStyles, docPageStyles } from '../../shared/styles';

const styles = css`
  ${docPageStyles}
`;

export const RikkaDocSignal01 = defineElement('rikka-doc-signal-01', {
  styles,
  render() {
    return div({ class: 'doc-page' },
      div({ class: 'doc-header' },
        h1({ class: 'doc-title' }, 'Getting Started'),
        p({ class: 'doc-subtitle' }, 'A lightweight reactive primitives package built on the TC39 Signals proposal.'),
      ),
      div({ class: 'doc-section' },
        h2({ class: 'section-title' }, 'Installation'),
        pre({ class: 'code-block' }, 'npm install @rikka/signal @rikka/dom @rikka/elements'),
        p({ style: { marginTop: '12px', color: '#94a3b8', fontSize: '0.875rem' } },
          'Or use via CDN (no build step required):',
        ),
        pre({ class: 'code-block' }, `<!-- IIFE: all APIs on window.Rikka -->\n<script src="https://yw662.github.io/rikka/cdn/rikka.js"><\/script>\n\n<!-- ES Module -->\n<script type="module">\n  import { signal, computed, effect } from 'https://yw662.github.io/rikka/cdn/rikka.esm.js';\n</script>`),
      ),
      div({ class: 'doc-section' },
        h2({ class: 'section-title' }, 'Core Concepts'),
        p({}, 'Rikka provides three core reactive primitives:'),
        p({},
          sharedStyles.inlineCode('signal()'),
          ' — creates a reactive value that tracks dependencies.',
        ),
        p({},
          sharedStyles.inlineCode('computed()'),
          ' — derives a value from other signals automatically.',
        ),
        p({},
          sharedStyles.inlineCode('effect()'),
          ' — runs side effects when signals change.',
        ),
      ),
      div({ class: 'doc-section' },
        h2({ class: 'section-title' }, 'Quick Example'),
        p({ style: { color: '#94a3b8', fontSize: '0.875rem', marginBottom: '12px' } },
          'The example below uses pure signals — no custom elements required. This code works in any JavaScript environment.'
        ),
        sharedStyles.createPlayground(
          `import { signal, computed, effect } from '@rikka/signal';

const count = signal(0);
const doubled = computed(() => count.get() * 2);

effect(() => {
  console.log(\`Count: \${count.get()}, Doubled: \${doubled.get()}\`);
});

count.set(1);`,
          280,
          'Signal / Computed / Effect'
        ),
      ),
      div({ class: 'doc-nav' },
        div({ class: 'nav-spacer' }),
        a({ class: 'nav-link next', href: '#/docs/@rikka/signal/signal' }, 'signal() →'),
      ),
    );
  }
});
