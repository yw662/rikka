import { defineElement } from '@takanashi/rikka-elements';
import { css, div, h1, h2, p, pre, a } from '@takanashi/rikka-dom';
import {sharedHelpers} from '../../shared/helpers';
import {docPageStyles} from '../../shared/page-styles';
import { docContent } from '../../shared/doc-content';
import { tr } from '../../shared/i18n';
import { RikkaLivePlayground } from "@takanashi/rikka-live-playground";

const styles = css`
  ${docPageStyles}
`;

export const RikkaDocSignal01 = defineElement('rikka-doc-signal-01', {
  styles,
  render() {
    return div({ class: 'doc-page' },
      div({ class: 'doc-header' },
        h1({ class: 'doc-title' }, tr(docContent.sidebar.gettingStarted)),
        p({ class: 'doc-subtitle' }, tr(docContent.gettingStarted.subtitle)),
      ),
      div({ class: 'doc-section' },
        h2({ class: 'section-title' }, tr(docContent.gettingStarted.installation)),
        pre({ class: 'code-block' }, 'npm install @takanashi/rikka-signal @takanashi/rikka-dom @takanashi/rikka-elements'),
        p({ style: { marginTop: '12px', color: '#94a3b8', fontSize: '0.875rem' } },
          tr(docContent.gettingStarted.orUseCdn),
        ),
        pre({ class: 'code-block' }, `<!-- IIFE: all APIs on window.Rikka -->\n<script src="https://yw662.github.io/rikka/cdn/rikka.js"><\/script>\n\n<!-- ES Module -->\n<script type="module">\n  import { signal, computed, effect } from 'https://yw662.github.io/rikka/cdn/rikka.esm.js';\n</script>`),
      ),
      div({ class: 'doc-section' },
        h2({ class: 'section-title' }, tr(docContent.gettingStarted.coreConcepts)),
        p({}, tr(docContent.gettingStarted.coreConceptsDesc)),
        p(sharedHelpers.inlineCode('signal()'), tr(docContent.gettingStarted.signalDesc)),
        p(sharedHelpers.inlineCode('computed()'), tr(docContent.gettingStarted.computedDesc)),
        p(sharedHelpers.inlineCode('effect()'), tr(docContent.gettingStarted.effectDesc)),
      ),
      div({ class: 'doc-section' },
        h2({ class: 'section-title' }, tr(docContent.gettingStarted.quickExample)),
        p({ style: { color: '#94a3b8', fontSize: '0.875rem', marginBottom: '12px' } },
          tr(docContent.gettingStarted.quickExampleDesc),
        ),
        RikkaLivePlayground.h({
    code: `import { signal, computed, effect } from '@takanashi/rikka-signal';

const count = signal(0);
const doubled = computed(() => count.get() * 2);

effect(() => {
  console.log(\`Count: \${count.get()}, Doubled: \${doubled.get()}\`);
});

count.set(1);`, height: "280", title: 'Signal / Computed / Effect'
}),
      ),
      div({ class: 'doc-nav' },
        div({ class: 'nav-spacer' }),
        a({ class: 'nav-link next', href: '#/docs/@takanashi/rikka-signal/signal' },
          tr(docContent.signal.nextComputed),
        ),
      ),
    );
  }
});
