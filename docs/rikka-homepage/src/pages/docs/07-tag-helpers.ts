import { defineElement } from '@takanashi/rikka-elements';
import { css, div, h1, h2, p, a, pre, code, ul, li, svg, circle, svgtext } from '@takanashi/rikka-dom';
import {sharedHelpers} from '../../shared/helpers';
import {docPageStyles} from '../../shared/page-styles';
import { docContent } from '../../shared/doc-content';
import { tr } from '../../shared/i18n';
import { RikkaLivePlayground } from "@takanashi/rikka-live-playground";

const styles = css`${docPageStyles}`;

const DocDom07 = defineElement('rikka-doc-dom-07', {
  styles,
  render() {
    return div({ class: 'doc-page' },
      h1({}, tr(docContent.sidebar.tagHelpers)),
      p({}, tr(docContent.tagHelpers.desc)),
      div({ class: 'doc-content' },
        h2({}, tr(docContent.tagHelpers.keyConcepts)),
        ul(
          li(sharedHelpers.inlineCode('div(), span(), button(), h1()-h6(), p(), input(), a()'), tr(docContent.tagHelpers.bullet1)),
          li(
            tr(docContent.tagHelpers.bullet2),
            sharedHelpers.inlineCode('h()'),
            tr(docContent.tagHelpers.bullet2End),
          ),
          li({}, tr(docContent.tagHelpers.bullet3)),
          li(
            tr(docContent.tagHelpers.bullet4),
            sharedHelpers.inlineCode('section, article, header, nav, main, footer'),
            tr(docContent.tagHelpers.bullet4End),
          ),
          li(
            tr(docContent.tagHelpers.bullet5),
            sharedHelpers.inlineCode('table, thead, tbody(), tr, th, td'),
            tr(docContent.tagHelpers.bullet5End),
          ),
          li(
            tr(docContent.tagHelpers.bullet6),
            sharedHelpers.inlineCode('form, label, select, option, textarea'),
            tr(docContent.tagHelpers.bullet6End),
          ),
        ),
        h2({}, tr(docContent.tagHelpers.availableHelpers)),
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
        h2({}, tr(docContent.tagHelpers.svgHelpers)),
        p({}, tr(docContent.tagHelpers.svgHelpersDesc)),
        pre({ class: 'code-block' }, code(
          `svg(), circle(), path(), rect(), line(),
polyline(), polygon(), text()`
        )),
        p({}, tr(docContent.tagHelpers.example)),
        RikkaLivePlayground.h({
    code: `function SVGDemo() {
  return svg({ viewBox: '0 0 100 100', style: { width: '200px', height: '200px' } },
    circle({ cx: 50, cy: 50, r: 40, fill: 'steelblue' }),
    svgtext({ x: 50, y: 55, 'text-anchor': 'middle', fill: 'white' }, 'SVG')
  );
}

container.appendChild(SVGDemo());`, height: '150', title: 'SVG Elements'
}),
        h2({}, tr(docContent.tagHelpers.namespace)),
        p({}, tr(docContent.tagHelpers.namespaceDesc)),
        ul(
          li(
            sharedHelpers.inlineCode('svg()'),
            tr(docContent.tagHelpers.nsBullet1),
            sharedHelpers.inlineCode('circle, path, rect, text'),
            tr(docContent.tagHelpers.nsBullet1Mid),
          ),
          li(sharedHelpers.inlineCode('math()'), tr(docContent.tagHelpers.nsBullet2)),
          li(
            tr(docContent.tagHelpers.nsBullet3),
            sharedHelpers.inlineCode('div, span, a'),
            tr(docContent.tagHelpers.nsBullet3End),
          ),
          li(
            tr(docContent.tagHelpers.nsBullet4),
            sharedHelpers.inlineCode('4 tag names'),
            tr(docContent.tagHelpers.nsBullet4Mid),
            sharedHelpers.inlineCode('svg'),
            tr(docContent.tagHelpers.nsBullet4End),
            sharedHelpers.inlineCode('a → svga(), script → svgscript(), style → svgstyle(), title → svgtitle()'),
            tr(docContent.tagHelpers.nsBullet4Final),
          ),
          li(
            tr(docContent.tagHelpers.nsBullet5),
            sharedHelpers.inlineCode('circle, path, text, tspan, foreignObject'),
            tr(docContent.tagHelpers.nsBullet5Mid),
            sharedHelpers.inlineCode('mi, mo, mn, mrow'),
            tr(docContent.tagHelpers.nsBullet5End),
          ),
          li(sharedHelpers.inlineCode('foreignObject'), tr(docContent.tagHelpers.nsBullet6)),
        ),
        h2({}, tr(docContent.tagHelpers.usageExample)),
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
        h2({}, tr(docContent.ui.tryIt)),
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
        a({ href: '#/docs/@takanashi/rikka-dom/h', class: 'prev-link' },
          tr(docContent.tagHelpers.prevH),
        ),
        div({ class: 'spacer' }),
        a({ href: '#/docs/@takanashi/rikka-dom/for', class: 'next-link' },
          tr(docContent.tagHelpers.nextFor),
        ),
      ),
    );
  }
});

export { DocDom07 };
