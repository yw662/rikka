import { defineElement } from '@takanashi/rikka-elements';
import { css, div, h1, h2, p, a, pre, code, ul, li, span } from '@takanashi/rikka-dom';
import {sharedHelpers} from '../../shared/helpers';
import {docPageStyles} from '../../shared/page-styles';
import { docContent } from '../../shared/doc-content';
import { tr } from '../../shared/i18n';
import { RikkaLivePlayground } from "@takanashi/rikka-live-playground";

const styles = css`${docPageStyles}`;

const DocDom09 = defineElement('rikka-doc-dom-09', {
  styles,
  render() {
    return div({ class: 'doc-page' },
      h1({}, tr(docContent.sidebar.conditionals)),
      p({}, tr(docContent.conditionals.desc)),
      div({ class: 'doc-content' },
        h2({}, tr(docContent.conditionals.keyConcepts)),
        ul(
          li(sharedHelpers.inlineCode('Show(condition, render)'), tr(docContent.conditionals.bullet1)),
          li(sharedHelpers.inlineCode('When(condition, trueRender, falseRender?)'), tr(docContent.conditionals.bullet2)),
          li(
            sharedHelpers.inlineCode('Switch(value, cases, fallback?)'),
            tr(docContent.conditionals.bullet3),
            span({ class: 'advanced-inline-tag' }, 'adv'),
          ),
          li(
            sharedHelpers.inlineCode('Match(match, render)'),
            tr(docContent.conditionals.bullet4),
            span({ class: 'advanced-inline-tag' }, 'adv'),
          ),
        ),
        h2({}, tr(docContent.conditionals.apiSignatures)),
        pre({ class: 'code-block' }, code(
          `Show(condition: boolean | Signal.State<boolean> | Signal.Computed<boolean>, render: () => Element | null): ReactiveRange

When(condition: boolean | Signal.State<boolean> | Signal.Computed<boolean>, trueRender: () => Element | null, falseRender: () => Element | null): ReactiveRange

Switch<T>(value: T | Signal.State<T> | Signal.Computed<T>, cases: Case<T>[], fallback?: () => Element | null): ReactiveRange

Match<T>(match: T | ((value: T) => boolean), render: () => Element | null): Case<T>`
        )),
      ),
      div({ class: 'playground-section' },
        h2({}, tr(docContent.ui.tryIt)),
        RikkaLivePlayground.h({
    code: `import { Show, When, Switch, Match } from '@takanashi/rikka-dom';

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

container.appendChild(ConditionalDemo());`, height: '320', title: 'Show / When / Switch Demo'
}),
      ),
      div({ class: 'doc-nav' },
        a({ href: '#/docs/@takanashi/rikka-dom/for', class: 'prev-link' },
          tr(docContent.conditionals.prevFor),
        ),
        div({ class: 'spacer' }),
        a({ href: '#/docs/@takanashi/rikka-dom/html-template', class: 'next-link' },
          tr(docContent.conditionals.nextHtmlTemplate),
        ),
      ),
    );
  }
});

export { DocDom09 };
