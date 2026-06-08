declare module '*.css' {
  const content: string;
  export default content;
}

declare module "highlight.js/lib/languages/typescript" {
  import type { LanguageFn } from "highlight.js";
  const typescript: LanguageFn;
  export default typescript;
}
