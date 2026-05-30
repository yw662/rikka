import { defineElement } from 'rikka-elements';
import { css, div, h1, h2, p, a, pre, code, ul, li } from 'rikka-dom';
import { sharedStyles, docPageStyles } from '../../shared/styles';

const styles = css`${docPageStyles}`;

const DocDom09 = defineElement('rikka-doc-dom-09', {
  styles,
  render() {
    return div({ class: 'doc-page' },
      h1('Conditionals'),
      p('Show, When, Switch, and Match for conditional rendering.'),
      div({ class: 'doc-content' },
        h2('Key Concepts'),
        ul(
          li(sharedStyles.inlineCode('Show(condition, render)'), ' — Show/hide an element based on condition (toggles display).'),
          li(sharedStyles.inlineCode('When(condition, trueRender, falseRender?)'), ' — Render one of two branches conditionally.'),
          li(sharedStyles.inlineCode('Switch(value, cases, fallback?)'), ' — Multi-way conditional rendering.'),
          li(sharedStyles.inlineCode('Match(match, render)'), ' — Pattern matching within Switch cases.'),
        ),
        h2('API Signatures'),
        pre({ class: 'code-block' }, code(
          `Show(condition: boolean | Signal.State<boolean> | Signal.Computed<boolean>, render: () => Element | null): ReactiveRange

When(condition: boolean | Signal.State<boolean> | Signal.Computed<boolean>, trueRender: () => Element | null, falseRender: () => Element | null): ReactiveRange

Switch<T>(value: T | Signal.State<T> | Signal.Computed<T>, cases: Case<T>[], fallback?: () => Element | null): ReactiveRange

Match<T>(match: T | ((value: T) => boolean), render: () => Element | null): Case<T>`
        )),
      ),
      div({ class: 'playground-section' },
        h2('Try It'),
        sharedStyles.createPlayground(
          `import { Show, When, Switch, Match } from 'rikka-dom';

const visible = signal(true);
const isLoggedIn = signal(false);
const theme = signal<"light" | "dark">("light");

function ConditionalDemo() {
  return div({},
    Show(visible, () =>
      p({}, "I am conditionally visible!")
    ),
    When(isLoggedIn,
      () => p({}, "Welcome back!"),
      () => p({}, "Please log in.")
    ),
    Switch(theme, [
      Match("light", () => div({}, "Light mode")),
      Match("dark", () => div({}, "Dark mode"))
    ])
  );
}

container.appendChild(ConditionalDemo());`,
          '320',
          'Show / When / Switch Demo'
        ),
      ),
      div({ class: 'doc-nav' },
        a({ href: '#/docs/rikka-dom/for', class: 'prev-link' }, '\u2190 For'),
        div({ class: 'spacer' }),
        a({ href: '#/docs/rikka-dom/html-template', class: 'next-link' }, 'html`` \u2192'),
      ),
    );
  }
});

export { DocDom09 };
