---
"@takanashi/rikka-elements": patch
---

Fix event handler types: use `EventDetailOfNonVoid` so that `on*` handlers receive `CustomEvent<T>` instead of `CustomEvent<void | T>` when the event spec is non-void.
