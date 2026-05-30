import { defineElement } from 'rikka-elements';
import { css, div, h1, h2, p, a, pre, code, ul, li, svg, circle, svgtext } from 'rikka-dom';
import { sharedStyles, docPageStyles } from '../../shared/styles';

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
          li(sharedStyles.inlineCode('div(), span(), button(), h1()-h6(), p(), input(), a()'), ' — Common element helpers.'),
          li('Same API as ', sharedStyles.inlineCode('h()'), ' but the tag is pre-bound.'),
          li('Fully typed with correct attribute inference per element type.'),
          li('Includes semantic elements: ', sharedStyles.inlineCode('section, article, header, nav, main, footer'), ', etc.'),
          li('Table elements: ', sharedStyles.inlineCode('table, thead, tbody(), tr, th, td'), ', etc.'),
          li('Form elements: ', sharedStyles.inlineCode('form, label, select, option, textarea'), ', etc.'),
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
        sharedStyles.createPlayground(
          `function SVGDemo() {
  return svg({ viewBox: '0 0 100 100', style: { width: '200px', height: '200px' } },
    circle({ cx: 50, cy: 50, r: 40, fill: 'steelblue' }),
    svgtext({ x: 50, y: 55, 'text-anchor': 'middle', fill: 'white' }, 'SVG')
  );
}

container.appendChild(SVGDemo());`,
          '150',
          'SVG Elements'
        ),
        h2('Namespace Behavior'),
        p('Each tag helper resolves its namespace based on the tag name itself (not parent context):'),
        ul(
          li(sharedStyles.inlineCode('svg()'), ' and all SVG element helpers (', sharedStyles.inlineCode('circle, path, rect, text'), ', etc.) always create elements in the SVG namespace — determined by a built-in tag-name lookup.'),
          li(sharedStyles.inlineCode('math()'), ' and MathML helpers use the MathML namespace.'),
          li('Standard HTML helpers (', sharedStyles.inlineCode('div, span, a'), ', etc.) use the HTML namespace.'),
          li('Only ', sharedStyles.inlineCode('4 tag names'), ' exist in both HTML and SVG namespaces and require disambiguation — use the ', sharedStyles.inlineCode('svg'), '-prefixed variant when you need the SVG version: ', sharedStyles.inlineCode('a → svga(), script → svgscript(), style → svgstyle(), title → svgtitle()'), '.'),
          li('All other SVG-only tags (', sharedStyles.inlineCode('circle, path, text, tspan, foreignObject'), ', etc.) and MathML-only tags (', sharedStyles.inlineCode('mi, mo, mn, mrow'), ', etc.) resolve correctly without any prefix.'),
          li(sharedStyles.inlineCode('foreignObject'), ' is an SVG element that serves as an HTML integration point — place standard HTML helpers inside it.'),
        ),
        h2('Usage Example'),
        sharedStyles.createPlayground(
          `function CardExample() {
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

container.appendChild(CardExample());`,
          '200',
          'Tag Helpers Example'
        ),
      ),
      div({ class: 'playground-section' },
        h2('Try It'),
        sharedStyles.createPlayground(
          `function CardExample() {
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

container.appendChild(CardExample());`,
          '200',
          'Semantic HTML with Tag Helpers'
        ),
      ),
      div({ class: 'doc-nav' },
        a({ href: '#/docs/rikka-dom/h', class: 'prev-link' }, '\u2190 h()'),
        div({ class: 'spacer' }),
        a({ href: '#/docs/rikka-dom/for', class: 'next-link' }, 'For \u2192'),
      ),
    );
  }
});

export { DocDom07 };
