import { h as hFn, createElement } from "./h.js";
import type { Child, Attributes, ElementTagNameMap, TagFunction } from "./h.js";
import type { CommonHTMLAttributes } from "./attributes.js";
import { SVG_NS } from "./constants.js";

type TagFactory<K extends keyof ElementTagNameMap> = {
  (...children: Child[]): ElementTagNameMap[K];
  (attrs: Attributes<K>, ...children: Child[]): ElementTagNameMap[K];
};

type UntypedTagFactory = {
  (...args: unknown[]): Element;
};

function makeTag<K extends keyof ElementTagNameMap>(tag: K): TagFactory<K>;
function makeTag<T extends Element>(
  tag: string,
  forcedNS: string,
): SVGNamespacedTagFactory<T>;
function makeTag(tag: string, forcedNS?: string): UntypedTagFactory;
function makeTag(tag: string, forcedNS?: string): UntypedTagFactory {
  if (forcedNS) {
    return (...args: unknown[]) => createElement(tag, args, forcedNS);
  }
  return (...args: unknown[]) => createElement(tag, args);
}

type SVGNamespacedTagFactory<T extends Element> = {
  (...children: Child[]): T;
  (attrs: Record<string, unknown>, ...children: Child[]): T;
};

export type H = {
  <K extends keyof ElementTagNameMap>(
    tag: K,
    ...children: Child[]
  ): ElementTagNameMap[K];
  <K extends keyof ElementTagNameMap>(
    tag: K,
    attrs: Attributes<K>,
    ...children: Child[]
  ): ElementTagNameMap[K];
  <T extends Element, A extends Record<string, unknown>>(
    tag: TagFunction<T, A>,
    ...children: Child[]
  ): T;
  <T extends Element, A extends Record<string, unknown>>(
    tag: TagFunction<T, A>,
    attrs: A & CommonHTMLAttributes,
    ...children: Child[]
  ): T;
  (
    tag: string | (new () => HTMLElement),
    first?: CommonHTMLAttributes | Child,
    ...restChildren: Child[]
  ): Element;
  (strings: TemplateStringsArray, ...values: any[]): Element[];
};

export const h: H = hFn as H;

export const div = makeTag("div");
export const span = makeTag("span");
export const a = makeTag("a");
export const p = makeTag("p");
export const button = makeTag("button");
export const input = makeTag("input");
export const h1 = makeTag("h1");
export const h2 = makeTag("h2");
export const h3 = makeTag("h3");
export const h4 = makeTag("h4");
export const h5 = makeTag("h5");
export const h6 = makeTag("h6");
export const section = makeTag("section");
export const article = makeTag("article");
export const aside = makeTag("aside");
export const nav = makeTag("nav");
export const header = makeTag("header");
export const footer = makeTag("footer");
export const main = makeTag("main");
export const ul = makeTag("ul");
export const ol = makeTag("ol");
export const li = makeTag("li");
export const table = makeTag("table");
export const thead = makeTag("thead");
export const tbody = makeTag("tbody");
export const tr = makeTag("tr");
export const th = makeTag("th");
export const td = makeTag("td");
export const form = makeTag("form");
export const select = makeTag("select");
export const option = makeTag("option");
export const label = makeTag("label");
export const textarea = makeTag("textarea");
export const pre = makeTag("pre");
export const code = makeTag("code");
export const br = makeTag("br");
export const hr = makeTag("hr");
export const img = makeTag("img");
export const slot = makeTag("slot");
export const template = makeTag("template");
export const abbr = makeTag("abbr");
export const address = makeTag("address");
export const area = makeTag("area");
export const audio = makeTag("audio");
export const b = makeTag("b");
export const base = makeTag("base");
export const bdi = makeTag("bdi");
export const bdo = makeTag("bdo");
export const blockquote = makeTag("blockquote");
export const body = makeTag("body");
export const canvas = makeTag("canvas");
export const caption = makeTag("caption");
export const cite = makeTag("cite");
export const col = makeTag("col");
export const colgroup = makeTag("colgroup");
export const data = makeTag("data");
export const datalist = makeTag("datalist");
export const dd = makeTag("dd");
export const del = makeTag("del");
export const details = makeTag("details");
export const dfn = makeTag("dfn");
export const dialog = makeTag("dialog");
export const dl = makeTag("dl");
export const dt = makeTag("dt");
export const em = makeTag("em");
export const embed = makeTag("embed");
export const fieldset = makeTag("fieldset");
export const figcaption = makeTag("figcaption");
export const figure = makeTag("figure");
export const head = makeTag("head");
export const hgroup = makeTag("hgroup");
export const html = makeTag("html");
export const i = makeTag("i");
export const iframe = makeTag("iframe");
export const ins = makeTag("ins");
export const kbd = makeTag("kbd");
export const legend = makeTag("legend");
export const link = makeTag("link");
export const map = makeTag("map");
export const mark = makeTag("mark");
export const menu = makeTag("menu");
export const meta = makeTag("meta");
export const meter = makeTag("meter");
export const noscript = makeTag("noscript");
export const object = makeTag("object");
export const optgroup = makeTag("optgroup");
export const output = makeTag("output");
export const picture = makeTag("picture");
export const progress = makeTag("progress");
export const q = makeTag("q");
export const rp = makeTag("rp");
export const rt = makeTag("rt");
export const ruby = makeTag("ruby");
export const s = makeTag("s");
export const samp = makeTag("samp");
export const script = makeTag("script");
export const search = makeTag("search");
export const small = makeTag("small");
export const source = makeTag("source");
export const strong = makeTag("strong");
export const style = makeTag("style");
export const sub = makeTag("sub");
export const summary = makeTag("summary");
export const sup = makeTag("sup");
export const tfoot = makeTag("tfoot");
export const time = makeTag("time");
export const title = makeTag("title");
export const track = makeTag("track");
export const u = makeTag("u");
export const var_ = makeTag("var");
export const video = makeTag("video");
export const wbr = makeTag("wbr");

export const svg = makeTag("svg");
export const circle = makeTag("circle");
export const path = makeTag("path");
export const rect = makeTag("rect");
export const line = makeTag("line");
export const polygon = makeTag("polygon");
export const polyline = makeTag("polyline");
export const g = makeTag("g");
export const defs = makeTag("defs");
export const use = makeTag("use");
export const foreignObject = makeTag("foreignObject");
export const clipPath = makeTag("clipPath");
export const pattern = makeTag("pattern");
export const marker = makeTag("marker");
export const mask = makeTag("mask");
export const image = makeTag("image");
export const linearGradient = makeTag("linearGradient");
export const radialGradient = makeTag("radialGradient");
export const stop = makeTag("stop");
export const symbol = makeTag("symbol");
export const filter = makeTag("filter");
export const ellipse = makeTag("ellipse");
export const text = makeTag("text");
export const tspan = makeTag("tspan");
export const textPath = makeTag("textPath");
export const animate = makeTag("animate");
export const animateMotion = makeTag("animateMotion");
export const animateTransform = makeTag("animateTransform");
export const desc = makeTag("desc");
export const feBlend = makeTag("feBlend");
export const feColorMatrix = makeTag("feColorMatrix");
export const feComponentTransfer = makeTag("feComponentTransfer");
export const feComposite = makeTag("feComposite");
export const feConvolveMatrix = makeTag("feConvolveMatrix");
export const feDiffuseLighting = makeTag("feDiffuseLighting");
export const feDisplacementMap = makeTag("feDisplacementMap");
export const feDistantLight = makeTag("feDistantLight");
export const feDropShadow = makeTag("feDropShadow");
export const feFlood = makeTag("feFlood");
export const feFuncA = makeTag("feFuncA");
export const feFuncB = makeTag("feFuncB");
export const feFuncG = makeTag("feFuncG");
export const feFuncR = makeTag("feFuncR");
export const feGaussianBlur = makeTag("feGaussianBlur");
export const feImage = makeTag("feImage");
export const feMerge = makeTag("feMerge");
export const feMergeNode = makeTag("feMergeNode");
export const feMorphology = makeTag("feMorphology");
export const feOffset = makeTag("feOffset");
export const fePointLight = makeTag("fePointLight");
export const feSpecularLighting = makeTag("feSpecularLighting");
export const feSpotLight = makeTag("feSpotLight");
export const feTile = makeTag("feTile");
export const feTurbulence = makeTag("feTurbulence");
export const metadata = makeTag("metadata");
export const mpath = makeTag("mpath");
export const set = makeTag("set");
export const switch_ = makeTag("switch");
export const view = makeTag("view");

export const math = makeTag("math");
export const annotation = makeTag("annotation");
export const annotationXml = makeTag("annotation-xml");
export const maction = makeTag("maction");
export const menclose = makeTag("menclose");
export const merror = makeTag("merror");
export const mfenced = makeTag("mfenced");
export const mfrac = makeTag("mfrac");
export const mglyph = makeTag("mglyph");
export const mi = makeTag("mi");
export const mlabeledtr = makeTag("mlabeledtr");
export const maligngroup = makeTag("maligngroup");
export const malignmark = makeTag("malignmark");
export const mmultiscripts = makeTag("mmultiscripts");
export const mn = makeTag("mn");
export const mo = makeTag("mo");
export const mpadded = makeTag("mpadded");
export const mphantom = makeTag("mphantom");
export const mprescripts = makeTag("mprescripts");
export const mroot = makeTag("mroot");
export const mrow = makeTag("mrow");
export const ms = makeTag("ms");
export const mspace = makeTag("mspace");
export const msqrt = makeTag("msqrt");
export const mstyle = makeTag("mstyle");
export const msub = makeTag("msub");
export const msubsup = makeTag("msubsup");
export const msup = makeTag("msup");
export const mtable = makeTag("mtable");
export const mtd = makeTag("mtd");
export const mtext = makeTag("mtext");
export const mtr = makeTag("mtr");
export const munder = makeTag("munder");
export const munderover = makeTag("munderover");
export const none = makeTag("none");
export const semantics = makeTag("semantics");

export const svga = makeTag<SVGAElement>("a", SVG_NS);
export const svgscript = makeTag<SVGScriptElement>("script", SVG_NS);
export const svgstyle = makeTag<SVGStyleElement>("style", SVG_NS);
export const svgtitle = makeTag<SVGTitleElement>("title", SVG_NS);
