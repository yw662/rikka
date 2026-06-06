import { defineElement } from '@takanashi/rikka-elements';
import { css, div, h1, h2, p, a, pre, code, ul, li, svg, circle, svgtext } from '@takanashi/rikka-dom';
import {sharedHelpers} from '../../shared/helpers';
import {docPageStyles} from '../../shared/page-styles';
import { RikkaLivePlayground } from "@takanashi/rikka-live-playground";

const styles = css`${docPageStyles}`;

const DocDom07 = defineElement('rikka-doc-dom-07', {
  styles,
  render() {
    return div({ class: 'doc-page' },
      h1('Tag Helpers'),
      p('Pre-built factory functions for every HTML element.'),
      div({ class: 'doc-content' },
        h2('Key Concepts'),
        ul(
          li(sharedHelpers.inlineCode('div(), span(), button(), h1()-h6(), p(), input(), a()'), ' — Common element helpers.'),
          li('Same API as ', sharedHelpers.inlineCode('h()'), ' but the tag is pre-bound.'),
          li('Fully typed with correct attribute inference per element type.'),
          li('Includes semantic elements: ', sharedHelpers.inlineCode('section, article, header, nav, main, footer'), ', etc.'),
          li('Table elements: ', sharedHelpers.inlineCode('table, thead, tbody(), tr, th, td'), ', etc.'),
          li('Form elements: ', sharedHelpers.inlineCode('form, label, select, option, textarea'), ', etc.'),
        ),
        h2('Available Tag Helpers'),
        pre({ class: 'code-block' }, code(
          `// Layout & Text
div(), section(), article(), header(),
nav(), main(), footer(), aside(),
h1(), h2(), h3(), h4(), h5(), h6(),
p(), span(), pre(), code(), hr()

// Interactive
button(), a(), input(), textarea(),
select(), option(), form(), label()

// Media & Embedded
img()

// Tables
table(), thead(), tbody(), tr(), th(), td()

// Lists
ul(), ol(), li()`
        )),
        h2('SVG Tag Helpers'),
        p('SVG elements automatically use the SVG namespace:'),
        pre({ class: 'code-block' }, code(
          `svg(), circle(), path(), rect(), line(),
polyline(), polygon(), text()`
        )),
        p('Example:'),
        RikkaLivePlayground.h({
    code: `function SVGDemo() {
  return svg({ viewBox: '0 0 100 100', style: { width: '200px', height: '200px' } },
    circle({ cx: 50, cy: 50, r: 40, fill: 'steelblue' }),
    svgtext({ x: 50, y: 55, 'text-anchor': 'middle', fill: 'white' }, 'SVG')
  );
}

container.appendChild(SVGDemo());`, height: '150', title: 'SVG Elements'
}),
        h2('Namespace Behavior'),
        p('Each tag helper resolves its namespace based on the tag name itself (not parent context):'),
        ul(
          li(sharedHelpers.inlineCode('svg()'), ' and all SVG element helpers (', sharedHelpers.inlineCode('circle, path, rect, text'), ', etc.) always create elements in the SVG namespace — determined by a built-in tag-name lookup.'),
          li(sharedHelpers.inlineCode('math()'), ' and MathML helpers use the MathML namespace.'),
          li('Standard HTML helpers (', sharedHelpers.inlineCode('div, span, a'), ', etc.) use the HTML namespace.'),
          li('Only ', sharedHelpers.inlineCode('4 tag names'), ' exist in both HTML and SVG namespaces and require disambiguation — use the ', sharedHelpers.inlineCode('svg'), '-prefixed variant when you need the SVG version: ', sharedHelpers.inlineCode('a → svga(), script → svgscript(), style → svgstyle(), title → svgtitle()'), '.'),
          li('All other SVG-only tags (', sharedHelpers.inlineCode('circle, path, text, tspan, foreignObject'), ', etc.) and MathML-only tags (', sharedHelpers.inlineCode('mi, mo, mn, mrow'), ', etc.) resolve correctly without any prefix.'),
          li(sharedHelpers.inlineCode('foreignObject'), ' is an SVG element that serves as an HTML integration point — place standard HTML helpers inside it.'),
        ),
        h2('Usage Example'),
        RikkaLivePlayground.h({
    code: `function CardExample() {
  return article({ class: "card" },
    header({},
      h3({}, "Card Title"),
      p({}, "Posted today")
    ),
    p({}, "Tag helpers make your code readable and concise."),
    footer({},
      button({}, "Read More"),
      a({ href: "#" }, "Share")
    )
  );
}

container.appendChild(CardExample());`, height: '200', title: 'Tag Helpers Example'
}),
      ),
      div({ class: 'playground-section' },
        h2('Try It'),
        RikkaLivePlayground.h({
    code: `function CardExample() {
  return article({ class: "card" },
    header({},
      h3({}, "Card Title"),
      p({}, "Posted today")
    ),
    p({}, "Tag helpers make your code readable and concise."),
    footer({},
      button({}, "Read More"),
      a({ href: "#" }, "Share")
    )
  );
}

container.appendChild(CardExample());`, height: '200', title: 'Semantic HTML with Tag Helpers'
}),
      ),
      div({ class: 'doc-nav' },
        a({ href: '#/docs/@takanashi/rikka-dom/h', class: 'prev-link' }, '\u2190 h()'),
        div({ class: 'spacer' }),
        a({ href: '#/docs/@takanashi/rikka-dom/for', class: 'next-link' }, 'For \u2192'),
      ),
    );
  }
});

export { DocDom07 };
