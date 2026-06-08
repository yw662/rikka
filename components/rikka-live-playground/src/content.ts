import type { Locale } from "./i18n";

/**
 * All user-facing strings in the live playground.
 * Keep keys in the order they appear in the UI.
 */
export const playgroundContent = {
  // Defaults for the `title` attribute when none is provided.
  defaultTitle: { en: "Example", zh: "示例" } as Record<Locale, string>,

  // Preview pane
  preview: { en: "Preview", zh: "预览" } as Record<Locale, string>,
  loading: { en: "Loading...", zh: "加载中..." } as Record<Locale, string>,

  // Layout toggle (vertical / horizontal split)
  layoutVertical: { en: "Vertical layout", zh: "纵向布局" } as Record<Locale, string>,
  layoutHorizontal: { en: "Horizontal layout", zh: "横向布局" } as Record<Locale, string>,

  // Panel toggle (both / editor-only / preview-only)
  panelBoth: { en: "Show both panels", zh: "显示两个面板" } as Record<Locale, string>,
  panelEditor: { en: "Show editor only", zh: "仅显示编辑器" } as Record<Locale, string>,
  panelPreview: { en: "Show preview only", zh: "仅显示预览" } as Record<Locale, string>,

  // Fullscreen toggle
  fullscreenEnter: { en: "Enter fullscreen", zh: "进入全屏" } as Record<Locale, string>,
  fullscreenExit: { en: "Exit fullscreen", zh: "退出全屏" } as Record<Locale, string>,

  // Action buttons
  run: { en: "\u25B6 Run", zh: "\u25B6 运行" } as Record<Locale, string>,
  reset: { en: "Reset", zh: "重置" } as Record<Locale, string>,

  // Compile errors
  compileErrorPrefix: { en: "Compile Error: ", zh: "编译错误：" } as Record<Locale, string>,
};
