import type { Locale } from './i18n';

export const content = {
  appTitle: { en: '🎨 Drawing Pad', zh: '🎨 画板' },
  appSubtitle: { en: 'Create, sketch, and bring ideas to life', zh: '释放你的创造力，自由绘画' },
  pen: { en: 'Pen', zh: '画笔' },
  eraser: { en: 'Eraser', zh: '橡皮' },
  line: { en: 'Line', zh: '直线' },
  rect: { en: 'Rectangle', zh: '矩形' },
  circle: { en: 'Circle', zh: '圆形' },
  color: { en: 'Color', zh: '颜色' },
  size: { en: 'Size', zh: '粗细' },
  bgColor: { en: 'Background', zh: '背景' },
  undo: { en: 'Undo', zh: '撤销' },
  redo: { en: 'Redo', zh: '重做' },
  clear: { en: 'Clear', zh: '清空' },
  savePNG: { en: 'Save PNG', zh: '保存图片' },
  saveSVG: { en: 'Save JSON', zh: '保存数据' },
  load: { en: 'Load', zh: '载入' },
  switchLang: { en: '中文', zh: 'EN' },
} satisfies Record<string, Record<Locale, string>>;
