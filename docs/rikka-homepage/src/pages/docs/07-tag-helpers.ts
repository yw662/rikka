import { defineElement } from '@takanashi/rikka-elements';
import { css, div, h1, h2, p, a, pre, code, ul, li, svg, circle, text } from '@takanashi/rikka-dom';
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
          li({}, tr(docContent.tagHelpers.bullet7)),
        ),
        h2({}, tr(docContent.tagHelpers.availableHelpers)),
        pre({ class: 'code-block' }, code(
          `// Layout & Text
div(), section(), article(), header(),
nav(), main(), footer(), aside(),
h1(), h2(), h3(), h4(), h5(), h6(),
p(), span(), pre(), code(), blockquote(),
abbr(), address(), b(), i(), em(), strong(),
small(), sub(), sup(), s(), u(), hr(), br()

// Interactive
button(), a(), input(), textarea(),
select(), option(), form(), label(),
fieldset(), legend(), datalist(), output()

// Media & Embedded
img(), audio(), video(), picture(), source(),
track(), iframe(), embed(), object(), map(),
area(), canvas(), figure(), figcaption()

// Metadata & Scripting
meta(), link(), base(), style(), script(),
title(), noscript(), template(), slot()

// Tables
table(), thead(), tbody(), tfoot(), tr(),
th(), td(), caption(), col(), colgroup()

// Lists
ul(), ol(), li(), dl(), dt(), dd(), menu()

// Forms (extra)
progress(), meter(), optgroup(),
search(), dialog(), details(), summary(),
data(), time(), wbr(), ruby(), rp(), rt(),
cite(), code(), dfn(), kbd(), samp(), var_(),
bdi(), bdo(), del(), ins(), mark(), q(),
hgroup(), head(), body(), html()`
        )),
        h2({}, tr(docContent.tagHelpers.svgHelpers)),
        p({}, tr(docContent.tagHelpers.svgHelpersDesc)),
        pre({ class: 'code-block' }, code(
          `// Shape & structure
svg(), g(), defs(), use(), symbol(),
foreignObject(), switch_(), view()

// Basic shapes
circle(), ellipse(), line(), path(),
polygon(), polyline(), rect()

// Text
text(), tspan(), textPath()

// Gradients & paint
linearGradient(), radialGradient(), stop(),
pattern(), clipPath(), mask(), marker()

// Filter effects
filter(), feBlend(), feColorMatrix(),
feComponentTransfer(), feComposite(),
feConvolveMatrix(), feDiffuseLighting(),
feDisplacementMap(), feFlood(),
feFuncA(), feFuncB(), feFuncG(), feFuncR(),
feGaussianBlur(), feImage(), feMerge(),
feMergeNode(), feMorphology(), feOffset(),
feSpecularLighting(), feTile(), feTurbulence(),
feDistantLight(), fePointLight(), feSpotLight(),
feDropShadow()

// Animation & metadata
animate(), animateMotion(), animateTransform(),
set(), mpath(), desc(), metadata(), image()`
        )),
        p({}, tr(docContent.tagHelpers.example)),
        RikkaLivePlayground.h({
    code: `function SVGDemo() {
  return svg({ viewBox: '0 0 100 100', style: { width: '200px', height: '200px' } },
    circle({ cx: 50, cy: 50, r: 40, fill: 'steelblue' }),
    text({ x: 50, y: 55, 'text-anchor': 'middle', fill: 'white' }, 'SVG')
  );
}

container.appendChild(SVGDemo());`, height: '150', title: 'SVG Elements'
}),
        h2({}, tr(docContent.tagHelpers.mathmlHelpers)),
        p({}, tr(docContent.tagHelpers.mathmlHelpersDesc)),
        pre({ class: 'code-block' }, code(
          `math(), mrow(), mi(), mo(), mn(), ms(),
mtext(), mfrac(), msqrt(), mroot(), msub(),
msup(), msubsup(), munder(), munderover(),
mtable(), mtr(), mtd(), mlabeledtr(),
menclose(), mfenced(), mspace(), mphantom(),
mpadded(), mmultiscripts(), maction(),
merror(), mstyle(), mprescripts(), malignmark(),
maligngroup(), mglyph(), annotation(),
annotationXml(), semantics(), none()`
        )),
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
          li(
            tr(docContent.tagHelpers.nsBullet7),
            sharedHelpers.inlineCode('var'),
            tr(docContent.tagHelpers.nsBullet7Mid),
            sharedHelpers.inlineCode('switch'),
            tr(docContent.tagHelpers.nsBullet7End),
            sharedHelpers.inlineCode('var_, switch_'),
            tr(docContent.tagHelpers.nsBullet7Final),
          ),
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
