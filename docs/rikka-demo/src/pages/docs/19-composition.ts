import { defineElement } from '@rikka/elements';
import { css, div, h1, h2, p, a, ul, li } from '@rikka/dom';
import { sharedStyles, docPageStyles } from '../../shared/styles';

const styles = css`${docPageStyles}`;

const DocComposition = defineElement('rikka-doc-advanced-19', {
  styles,
  render() {
    return div({ class: 'doc-page' },
      h1('Composition'),
      p('Combine signals, h``, and h() together for powerful UI patterns.'),
      div({ class: 'doc-content' },
        h2('Composing Multiple APIs'),
        p('Rikka provides three layers of reactivity that work seamlessly together:'),
        ul(
          li(sharedStyles.inlineCode('signal()'), ' and ', sharedStyles.inlineCode('computed()'), ' — reactive state and derived values.'),
          li(sharedStyles.inlineCode('h()'), ' and tag helpers — programmatic DOM creation with signal interpolation.'),
          li(sharedStyles.inlineCode('h``'), ' — template literals with fine-grained signal interpolation.'),
        ),
        p('You can mix these freely in a single component. Each layer handles what it does best.'),
        p({ style: { color: '#94a3b8', marginTop: '8px' } },
          'Note: All these composition patterns work without ',
          sharedStyles.inlineCode('defineElement'),
          '. You only need custom elements when you want reusable, encapsulated components with shadow DOM.'
        ),
        h2('Fine-grained vs Coarse-grained in Practice'),
        p('Understanding when to use each pattern is key:'),
        ul(
          li(sharedStyles.inlineCode('h()'), ' with signal children — ', sharedStyles.inlineCode('fine-grained'), '. Only the text node updates. Preserves focus, cursor, and scroll position.'),
          li(sharedStyles.inlineCode('h``'), ' with ', sharedStyles.inlineCode('${signal}'), ' — ', sharedStyles.inlineCode('fine-grained'), '. Same surgical update as h() signal children.'),
          li(sharedStyles.inlineCode('computed(() => h`...`)'), ' — ', sharedStyles.inlineCode('coarse-grained'), '. The entire template is rebuilt when dependencies change. Use for structural changes.'),
          li(sharedStyles.inlineCode('effect(() => { ... })'), ' — ', sharedStyles.inlineCode('coarse-grained'), '. Manual DOM manipulation inside an effect. Full control, full responsibility.'),
        ),
        p('The rule of thumb: use fine-grained for frequent small updates (typing, counters), coarse-grained for structural changes (switching views, conditional sections).'),
        h2('Focus Preservation Example'),
        p('A practical difference: typing in an input field.'),
        ul(
          li(sharedStyles.inlineCode('Fine-grained'), ': the input element stays in the DOM. Only its value text node changes. Your cursor stays in place.'),
          li(sharedStyles.inlineCode('Coarse-grained'), ': the input is removed and recreated. Focus is lost, cursor position resets.'),
        ),
      ),
      div({ class: 'playground-section' },
        h2('Try It'),
        sharedStyles.createPlayground(
          `import { h } from '@rikka/dom';

const name = signal('Alice');
const coarseName = signal('Bob');

const fineInput = input({
  type: 'text',
  value: name.get(),
  style: { padding: '8px', background: '#0d1117', border: '1px solid #334155', borderRadius: '4px', color: '#e2e8f0', width: '200px' },
  oninput: (e) => name.set(e.target.value)
});

effect(() => {
  fineInput.value = name.get();
});

const coarseCard = computed(() => {
  return h\`
    <input
      type="text"
      value="\${coarseName}"
      style="padding: 8px; background: #0d1117; border: 1px solid #334155; border-radius: 4px; color: #e2e8f0; width: 200px;"
    />
  \`;
});

const app = div(
  { style: { padding: '16px', maxWidth: '420px' } },
  h3({ style: { color: '#e2e8f0', marginBottom: '8px' } }, 'Fine-grained (h + signal child)'),
  p({ style: { color: '#94a3b8', fontSize: '0.875rem', marginBottom: '8px' } }, 'Type here — cursor stays in place:'),
  fineInput,
  p({ style: { color: '#6366f1', marginTop: '8px', marginBottom: '24px' } }, 'You typed: ', name),

  h3({ style: { color: '#e2e8f0', marginBottom: '8px' } }, 'Coarse-grained (computed + h\`\`)'),
  p({ style: { color: '#94a3b8', fontSize: '0.875rem', marginBottom: '8px' } }, 'Type here — focus is lost on each keystroke:'),
  coarseCard,
  p({ style: { color: '#6366f1', marginTop: '8px' } }, 'You typed: ', coarseName)
);

container.appendChild(app);`,
          '280',
          'Fine-grained vs Coarse-grained'
        ),
      ),
      div({ class: 'doc-nav' },
        a({ href: '#/docs/rikka-elements/attach-template', class: 'prev-link' }, '\u2190 attachTemplate'),
        div({ class: 'spacer' }),
        a({ href: '#/docs/advanced/fine-grained', class: 'next-link' }, 'Fine-grained Updates \u2192'),
      ),
    );
  },
});

export { DocComposition };
