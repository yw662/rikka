export const HTML_NS = "http://www.w3.org/1999/xhtml";
export const SVG_NS = "http://www.w3.org/2000/svg";
export const MATHML_NS = "http://www.w3.org/1998/Math/MathML";

export const HTML_TAG_NAMES = [
  "a", "abbr", "address", "area", "article", "aside", "audio",
  "b", "base", "bdi", "bdo", "blockquote", "body", "br", "button",
  "canvas", "caption", "cite", "code", "col", "colgroup",
  "data", "datalist", "dd", "del", "details", "dfn", "dialog", "div", "dl", "dt",
  "em", "embed",
  "fieldset", "figcaption", "figure", "font", "footer", "form",
  "h1", "h2", "h3", "h4", "h5", "h6", "head", "header", "hgroup", "hr", "html",
  "i", "iframe", "img", "input", "ins",
  "kbd",
  "label", "legend", "li", "link",
  "main", "map", "mark", "menu", "meta", "meter",
  "nav", "noscript",
  "object", "ol", "optgroup", "option", "output",
  "p", "picture", "pre", "progress",
  "q",
  "rp", "rt", "ruby",
  "s", "samp", "script", "search", "section", "select", "slot", "small", "source", "span", "strong", "style", "sub", "summary", "sup",
  "table", "tbody", "td", "template", "textarea", "tfoot", "th", "thead", "time", "title", "tr", "track",
  "u", "ul",
  "var", "video",
  "wbr",
] as const;

export const SVG_TAG_NAMES = [
  "animate", "animateMotion", "animateTransform",
  "circle", "clipPath",
  "defs", "desc",
  "ellipse",
  "feBlend", "feColorMatrix", "feComponentTransfer", "feComposite",
  "feConvolveMatrix", "feDiffuseLighting", "feDisplacementMap",
  "feDistantLight", "feDropShadow", "feFlood",
  "feFuncA", "feFuncB", "feFuncG", "feFuncR",
  "feGaussianBlur", "feImage", "feMerge", "feMergeNode",
  "feMorphology", "feOffset", "fePointLight",
  "feSpecularLighting", "feSpotLight", "feTile", "feTurbulence",
  "filter", "foreignObject",
  "g",
  "image",
  "line", "linearGradient",
  "marker", "mask", "metadata", "mpath",
  "path", "pattern", "polygon", "polyline",
  "radialGradient", "rect",
  "set", "stop", "svg", "switch", "symbol",
  "text", "textPath", "tspan",
  "use",
  "view",
] as const;

export const MATHML_TAG_NAMES = [
  "annotation", "annotation-xml",
  "maction", "math",
  "menclose", "merror", "mfenced", "mfrac",
  "mglyph", "mi", "mlabeledtr",
  "maligngroup", "malignmark",
  "mmultiscripts", "mn", "mo", "mpadded", "mphantom", "mprescripts",
  "mroot", "mrow", "ms", "mspace", "msqrt", "mstyle",
  "msub", "msubsup", "msup",
  "mtable", "mtd", "mtext", "mtr",
  "munder", "munderover",
  "none",
  "semantics",
] as const;

export const HTML_TAGS = new Set<string>(HTML_TAG_NAMES);
export const SVG_TAGS = new Set<string>(SVG_TAG_NAMES);
export const MATHML_TAGS = new Set<string>(MATHML_TAG_NAMES);

export const SVG_ALL_TAG_NAMES = [
  ...SVG_TAG_NAMES,
  "a", "script", "style", "title",
] as const;

export const SVG_ALL_TAGS = new Set<string>(SVG_ALL_TAG_NAMES);

export const MATHML_TEXT_INTEGRATION_POINTS = new Set([
  "mi", "mo", "mn", "ms", "mtext",
]);

export const SVG_HTML_INTEGRATION_POINTS = new Set([
  "foreignObject", "desc", "title",
]);

export const HTML_BREAKOUT_TAGS = new Set([
  "b", "big", "blockquote", "body", "br", "center", "code", "dd", "div", "dl", "dt",
  "em", "embed",
  "h1", "h2", "h3", "h4", "h5", "h6", "head", "hr",
  "i", "img", "li", "listing",
  "menu", "meta",
  "nobr",
  "ol",
  "p", "pre",
  "ruby",
  "s", "small", "span", "strong", "strike", "sub", "sup",
  "table", "tt",
  "u", "ul",
  "var",
]);
