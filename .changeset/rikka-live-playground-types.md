---
"@takanashi/rikka-live-playground": patch
---

fix(rikka-live-playground): 显式标注 `forEach` 回调参数为 `HTMLElement`,避免在严格类型下 `btn.dataset` 访问报错。无运行时行为变化。
