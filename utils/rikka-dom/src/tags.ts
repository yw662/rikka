import { h as hFn, createElement } from "./h.js";
import { isPlainObject } from "./signal-utils.js";
import type {
  Child,
  Attributes,
  ElementTagNameMap,
  TagFunction,
} from "./h.js";
import type { CommonHTMLAttributes } from "./attributes.js";
import { SVG_NS } from "./constants.js";

type TagFactory<K extends keyof ElementTagNameMap> = {
  (...children: Child[]): ElementTagNameMap[K];
  (
    attrs: Attributes<K>,
    ...children: Child[]
  ): ElementTagNameMap[K];
};

type UntypedTagFactory = {
  (...args: unknown[]): Element;
};

function makeTag(
  tag: string,
  forcedNS?: string,
): UntypedTagFactory {
  if (forcedNS) {
    return (...args: unknown[]) => createElement(tag, args, forcedNS);
  }
  return (...args: unknown[]) => {
    if (isPlainObject(args[0])) {
      return createElement(tag, args);
    }
    return createElement(tag, args);
  };
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
  (
    strings: TemplateStringsArray,
    ...values: any[]
  ): Element[];
};

export const h: H = hFn as H;

export const div = makeTag("div") as TagFactory<"div">;
export const span = makeTag("span") as TagFactory<"span">;
export const a = makeTag("a") as TagFactory<"a">;
export const p = makeTag("p") as TagFactory<"p">;
export const button = makeTag("button") as TagFactory<"button">;
export const input = makeTag("input") as TagFactory<"input">;
export const h1 = makeTag("h1") as TagFactory<"h1">;
export const h2 = makeTag("h2") as TagFactory<"h2">;
export const h3 = makeTag("h3") as TagFactory<"h3">;
export const h4 = makeTag("h4") as TagFactory<"h4">;
export const h5 = makeTag("h5") as TagFactory<"h5">;
export const h6 = makeTag("h6") as TagFactory<"h6">;
export const section = makeTag("section") as TagFactory<"section">;
export const article = makeTag("article") as TagFactory<"article">;
export const aside = makeTag("aside") as TagFactory<"aside">;
export const nav = makeTag("nav") as TagFactory<"nav">;
export const header = makeTag("header") as TagFactory<"header">;
export const footer = makeTag("footer") as TagFactory<"footer">;
export const main = makeTag("main") as TagFactory<"main">;
export const ul = makeTag("ul") as TagFactory<"ul">;
export const ol = makeTag("ol") as TagFactory<"ol">;
export const li = makeTag("li") as TagFactory<"li">;
export const table = makeTag("table") as TagFactory<"table">;
export const thead = makeTag("thead") as TagFactory<"thead">;
export const tbody = makeTag("tbody") as TagFactory<"tbody">;
export const tr = makeTag("tr") as TagFactory<"tr">;
export const th = makeTag("th") as TagFactory<"th">;
export const td = makeTag("td") as TagFactory<"td">;
export const form = makeTag("form") as TagFactory<"form">;
export const select = makeTag("select") as TagFactory<"select">;
export const option = makeTag("option") as TagFactory<"option">;
export const label = makeTag("label") as TagFactory<"label">;
export const textarea = makeTag("textarea") as TagFactory<"textarea">;
export const pre = makeTag("pre") as TagFactory<"pre">;
export const code = makeTag("code") as TagFactory<"code">;
export const br = makeTag("br") as TagFactory<"br">;
export const hr = makeTag("hr") as TagFactory<"hr">;
export const img = makeTag("img") as TagFactory<"img">;
export const slot = makeTag("slot") as TagFactory<"slot">;
export const template = makeTag("template") as TagFactory<"template">;
export const svg = makeTag("svg") as TagFactory<"svg">;
export const circle = makeTag("circle") as TagFactory<"circle">;
export const path = makeTag("path") as TagFactory<"path">;
export const rect = makeTag("rect") as TagFactory<"rect">;
export const line = makeTag("line") as TagFactory<"line">;
export const polygon = makeTag("polygon") as TagFactory<"polygon">;
export const polyline = makeTag("polyline") as TagFactory<"polyline">;
export const g = makeTag("g") as TagFactory<"g">;
export const defs = makeTag("defs") as TagFactory<"defs">;
export const use = makeTag("use") as TagFactory<"use">;
export const foreignObject = makeTag("foreignObject") as TagFactory<"foreignObject">;
export const clipPath = makeTag("clipPath") as TagFactory<"clipPath">;
export const pattern = makeTag("pattern") as TagFactory<"pattern">;
export const marker = makeTag("marker") as TagFactory<"marker">;
export const mask = makeTag("mask") as TagFactory<"mask">;
export const image = makeTag("image") as TagFactory<"image">;
export const linearGradient = makeTag("linearGradient") as TagFactory<"linearGradient">;
export const radialGradient = makeTag("radialGradient") as TagFactory<"radialGradient">;
export const stop = makeTag("stop") as TagFactory<"stop">;
export const symbol = makeTag("symbol") as TagFactory<"symbol">;
export const filter = makeTag("filter") as TagFactory<"filter">;
export const ellipse = makeTag("ellipse") as TagFactory<"ellipse">;
export const text = makeTag("text") as TagFactory<"text">;
export const tspan = makeTag("tspan") as TagFactory<"tspan">;
export const textPath = makeTag("textPath") as TagFactory<"textPath">;

export const svga = makeTag("a", SVG_NS) as SVGNamespacedTagFactory<SVGAElement>;
export const svgscript = makeTag("script", SVG_NS) as SVGNamespacedTagFactory<SVGScriptElement>;
export const svgstyle = makeTag("style", SVG_NS) as SVGNamespacedTagFactory<SVGStyleElement>;
export const svgtitle = makeTag("title", SVG_NS) as SVGNamespacedTagFactory<SVGTitleElement>;
export const svgtext = makeTag("text", SVG_NS) as SVGNamespacedTagFactory<SVGTextElement>;
export const svgspan = makeTag("tspan", SVG_NS) as SVGNamespacedTagFactory<SVGTSpanElement>;
export const svgtextPath = makeTag("textPath", SVG_NS) as SVGNamespacedTagFactory<SVGTextPathElement>;
