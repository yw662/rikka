# @takanashi/rikka-elements

## 0.2.1

### Patch Changes

- 2a29b61: Fix event handler types: use `EventDetailOfNonVoid` so that `on*` handlers receive `CustomEvent<T>` instead of `CustomEvent<void | T>` when the event spec is non-void.

## 0.2.0

### Minor Changes

- 6f88b6d: feat(rikka-elements): 扩展 `defineElement` 的 API

  - 新增 1-arg builder 重载:`defineElement(tag).attrs()...build()`,支持链式声明
  - 导出 5 个 builder 阶段类型:`BuilderFresh`、`BuilderWithBindings`、`BuilderWithMethods`、`BuilderWithTemplate`、`BuilderWithRender`,以及 `AnyBuilder` 联合类型
  - `ElementConfig` 改用 `NoInfer<C>` 改善 `render(this)` 的类型推导
  - `defineElement` 内部增加 JSDoc 注释,解释原生 `on*` 事件覆盖、`EventSpec` 等
  - 新增 386 行单元测试覆盖 attribute / event / method / render 链路

## 0.1.1

### Patch Changes

- bug fixes
- Updated dependencies
  - @takanashi/rikka-dom@0.1.1
  - @takanashi/rikka-signal@0.1.1
