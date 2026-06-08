import hljs from "highlight.js/lib/core";
import typescript from "highlight.js/lib/languages/typescript";

hljs.registerLanguage("typescript", typescript);

const APPLIED_FLAG = "hljsApplied";

const SELECTOR = [
  "pre.code-block",
  "pre.code-snippet",
  "pre.hero-demo-code",
].join(",");

function highlightOne(el: HTMLElement): void {
  if (el.dataset[APPLIED_FLAG]) return;
  const inner = el.querySelector(":scope > code") as HTMLElement | null;
  const target = inner ?? el;
  const source = target.textContent ?? "";
  target.innerHTML = hljs.highlight(source, {
    language: "typescript",
    ignoreIllegals: true,
  }).value;
  el.dataset[APPLIED_FLAG] = "1";
}

export function highlightCodeBlocks(root: ParentNode): void {
  const blocks = root.querySelectorAll<HTMLElement>(SELECTOR);
  for (const el of blocks) highlightOne(el);
}

export function highlightInline(source: string): string {
  return hljs.highlight(source, {
    language: "typescript",
    ignoreIllegals: true,
  }).value;
}
