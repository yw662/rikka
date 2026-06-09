import { defineElement } from '@takanashi/rikka-elements';
import { div, button, span, css, input, select, option } from '@takanashi/rikka-dom';
import { type Locale } from '../i18n.js';
import { effect } from '@takanashi/rikka-signal';
import {
  currentColor, currentSize, currentTool, bgColor,
  PALETTE, SIZES, pushUndo, popUndo, pushRedo, popRedo,
  clearHistory, canUndo, canRedo, type Tool,
} from '../store.js';
import { locale, setLocale, t } from '../i18n.js';
import { content } from '../content.js';

interface Point { x: number; y: number; }

export const drawingCanvas = defineElement('drawing-canvas', {
  attributes: {},
  styles: css`
    :host { display: block; width: 100%; }

    .wrap {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .toolbar {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.5rem;
      padding: 0.75rem;
      background: #f8fafc;
      border-radius: 0.75rem;
      border: 1px solid #e2e8f0;
    }

    .tool-group {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      padding-right: 0.75rem;
      border-right: 1px solid #e2e8f0;
    }

    .tool-group:last-child { border-right: none; }

    .tool-btn {
      padding: 0.4rem 0.75rem;
      border: 1px solid #e2e8f0;
      background: white;
      color: #475569;
      border-radius: 0.5rem;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s;
    }

    .tool-btn:hover { background: #f1f5f9; }

    .tool-btn.active {
      background: #6366f1;
      color: white;
      border-color: #6366f1;
    }

    .tool-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .palette {
      display: grid;
      grid-template-columns: repeat(8, 1fr);
      gap: 0.25rem;
    }

    .color-swatch {
      width: 24px;
      height: 24px;
      border-radius: 0.375rem;
      border: 2px solid #e2e8f0;
      cursor: pointer;
      padding: 0;
      transition: all 0.15s;
    }

    .color-swatch.active {
      border-color: #6366f1;
      transform: scale(1.15);
    }

    .size-swatches {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .size-btn {
      width: 32px;
      height: 32px;
      border-radius: 0.375rem;
      border: 1px solid #e2e8f0;
      background: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s;
    }

    .size-btn.active {
      border-color: #6366f1;
      background: #eef2ff;
    }

    .size-dot {
      background: #0f172a;
      border-radius: 50%;
    }

    .canvas-container {
      position: relative;
      border: 2px solid #e2e8f0;
      border-radius: 0.75rem;
      overflow: hidden;
      background:
        linear-gradient(45deg, #f8fafc 25%, transparent 25%),
        linear-gradient(-45deg, #f8fafc 25%, transparent 25%),
        linear-gradient(45deg, transparent 75%, #f8fafc 75%),
        linear-gradient(-45deg, transparent 75%, #f8fafc 75%);
      background-size: 20px 20px;
      background-position: 0 0, 0 10px, 10px -10px, 10px 0px;
      touch-action: none;
    }

    canvas {
      display: block;
      cursor: crosshair;
      touch-action: none;
    }

    .bg-input {
      width: 32px;
      height: 32px;
      border: 2px solid #e2e8f0;
      border-radius: 0.375rem;
      padding: 0;
      cursor: pointer;
      background: none;
    }

    .group-label {
      font-size: 0.7rem;
      color: #64748b;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-right: 0.25rem;
    }

    .top-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .header-left { display: flex; flex-direction: column; gap: 0.25rem; }
    .header-title { font-size: 1.25rem; font-weight: 700; color: white; }
    .header-sub { font-size: 0.85rem; color: rgba(255,255,255,0.8); }

    .lang-btn {
      background: rgba(255, 255, 255, 0.15);
      border: 1px solid rgba(255,255,255,0.25);
      color: white;
      padding: 0.4rem 0.85rem;
      border-radius: 0.5rem;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      appearance: none;
      -webkit-appearance: none;
      min-width: 80px;
    }

    .lang-btn:hover { background: rgba(255, 255, 255, 0.25); }

    .lang-btn option {
      background: #1e293b;
      color: white;
    }

    .app-shell {
      background: white;
      border-radius: 1rem;
      padding: 1rem;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    }
  `,
  render() {
    // 顶部栏（标题 + 语言切换）
    const titleEl = span({ class: 'header-title' }, t(content.appTitle));
    const subEl = span({ class: 'header-sub' }, t(content.appSubtitle));
    const langSelect = select(
      { class: 'lang-btn' },
      option({ value: 'en' }, 'English'),
      option({ value: 'zh' }, '中文')
    );
    langSelect.value = locale.get();
    langSelect.addEventListener('change', (e) => {
      setLocale((e.target as HTMLSelectElement).value as Locale);
    });

    effect(() => {
      titleEl.textContent = t(content.appTitle);
      subEl.textContent = t(content.appSubtitle);
      langSelect.value = locale.get();
    });

    // 工具按钮
    const tools: { key: Tool; label: keyof typeof content }[] = [
      { key: 'pen', label: 'pen' },
      { key: 'eraser', label: 'eraser' },
      { key: 'line', label: 'line' },
      { key: 'rect', label: 'rect' },
      { key: 'circle', label: 'circle' },
    ];
    const toolBtns = tools.map(toolDef => {
      const b = button(
        { class: 'tool-btn' + (currentTool.get() === toolDef.key ? ' active' : '') },
        t(content[toolDef.label])
      );
      b.addEventListener('click', () => currentTool.set(toolDef.key));
      return b;
    });

    // 调色板
    const paletteWrap = div({ class: 'palette' });
    const renderPalette = () => {
      paletteWrap.replaceChildren();
      for (const c of PALETTE) {
        const sw = button({
          class: 'color-swatch' + (currentColor.get() === c ? ' active' : ''),
          style: `background: ${c}`,
        });
        sw.addEventListener('click', () => currentColor.set(c));
        paletteWrap.appendChild(sw);
      }
    };
    renderPalette();

    // 大小选择
    const sizeWrap = div({ class: 'size-swatches' });
    const renderSizes = () => {
      sizeWrap.replaceChildren();
      for (const s of SIZES) {
        const btn = button({
          class: 'size-btn' + (currentSize.get() === s ? ' active' : ''),
        });
        const dot = div({
          class: 'size-dot',
          style: `width: ${Math.min(s, 20)}px; height: ${Math.min(s, 20)}px`,
        });
        btn.appendChild(dot);
        btn.addEventListener('click', () => currentSize.set(s));
        sizeWrap.appendChild(btn);
      }
    };
    renderSizes();

    // 背景色选择
    const bgInput = input({
      class: 'bg-input',
      type: 'color',
      value: bgColor.get(),
    });
    (bgInput as HTMLInputElement).addEventListener('input', () => {
      bgColor.set((bgInput as HTMLInputElement).value);
    });

    // 操作按钮
    const undoBtn = button({ class: 'tool-btn' }, t(content.undo));
    const redoBtn = button({ class: 'tool-btn' }, t(content.redo));
    const clearBtn = button({ class: 'tool-btn' }, t(content.clear));
    const saveBtn = button({ class: 'tool-btn' }, t(content.savePNG));
    const saveJsonBtn = button({ class: 'tool-btn' }, t(content.saveSVG));
    const loadBtn = button({ class: 'tool-btn' }, t(content.load));

    undoBtn.addEventListener('click', () => doUndo());
    redoBtn.addEventListener('click', () => doRedo());
    clearBtn.addEventListener('click', () => doClear());
    saveBtn.addEventListener('click', () => doSavePNG());
    saveJsonBtn.addEventListener('click', () => doSaveJSON());
    loadBtn.addEventListener('click', () => doLoadJSON());

    effect(() => {
      (undoBtn as HTMLButtonElement).disabled = !canUndo.get();
      (redoBtn as HTMLButtonElement).disabled = !canRedo.get();
      undoBtn.textContent = t(content.undo);
      redoBtn.textContent = t(content.redo);
      clearBtn.textContent = t(content.clear);
      saveBtn.textContent = t(content.savePNG);
      saveJsonBtn.textContent = t(content.saveSVG);
      loadBtn.textContent = t(content.load);
    });

    effect(() => {
      // 工具状态变化时重新渲染按钮
      currentTool.get();
      locale.get();
      tools.forEach((toolDef, i) => {
        const b = toolBtns[i] as HTMLButtonElement;
        b.className = 'tool-btn' + (currentTool.get() === toolDef.key ? ' active' : '');
        b.textContent = t(content[toolDef.label]);
      });
      renderPalette();
      renderSizes();
    });

    // Canvas 设置
    const canvas = document.createElement('canvas');
    const container = div({ class: 'canvas-container' });
    container.appendChild(canvas);

    const ctx = canvas.getContext('2d')!;
    const width = 800;
    const height = 500;
    canvas.width = width;
    canvas.height = height;
    (canvas.style as any).width = '100%';
    (canvas.style as any).maxWidth = `${width}px`;

    // 初始化背景
    let isDrawing = false;
    let startPoint: Point | null = null;
    let lastPoint: Point | null = null;
    let previewData: ImageData | null = null; // 用于形状预览的快照

    const fillBg = () => {
      ctx.save();
      ctx.fillStyle = bgColor.get();
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    };
    fillBg();

    effect(() => {
      // 背景色变化
      fillBg();
      (bgInput as HTMLInputElement).value = bgColor.get();
    });

    const getPoint = (e: MouseEvent | TouchEvent): Point => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      let clientX: number;
      let clientY: number;
      if (e instanceof TouchEvent) {
        clientX = e.touches[0]?.clientX ?? 0;
        clientY = e.touches[0]?.clientY ?? 0;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }
      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY,
      };
    };

    const snapshot = () => ctx.getImageData(0, 0, width, height);
    const restore = (data: ImageData) => ctx.putImageData(data, 0, 0);

    const strokeLine = (from: Point, to: Point, color: string, size: number, mode: 'stroke' | 'erase' = 'stroke') => {
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = size;
      if (mode === 'erase') {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = bgColor.get();
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = color;
      }
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
      ctx.restore();
    };

    const drawShape = (start: Point, end: Point, tool: Tool) => {
      if (previewData) restore(previewData);
      ctx.save();
      ctx.lineWidth = currentSize.get();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = currentColor.get();

      if (tool === 'line') {
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
      } else if (tool === 'rect') {
        ctx.beginPath();
        ctx.strokeRect(
          Math.min(start.x, end.x),
          Math.min(start.y, end.y),
          Math.abs(end.x - start.x),
          Math.abs(end.y - start.y)
        );
      } else if (tool === 'circle') {
        const cx = (start.x + end.x) / 2;
        const cy = (start.y + end.y) / 2;
        const rx = Math.abs(end.x - start.x) / 2;
        const ry = Math.abs(end.y - start.y) / 2;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, 2 * Math.PI);
        ctx.stroke();
      }
      ctx.restore();
    };

    const onStart = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      const p = getPoint(e);
      isDrawing = true;
      startPoint = p;
      lastPoint = p;

      const tool = currentTool.get();
      if (tool === 'line' || tool === 'rect' || tool === 'circle') {
        previewData = snapshot();
      }
      pushUndo(snapshot());

      if (tool === 'pen' || tool === 'eraser') {
        // 起点画一个点
        ctx.save();
        ctx.fillStyle = tool === 'eraser' ? bgColor.get() : currentColor.get();
        ctx.beginPath();
        ctx.arc(p.x, p.y, currentSize.get() / 2, 0, 2 * Math.PI);
        ctx.fill();
        ctx.restore();
      }
    };

    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!isDrawing) return;
      e.preventDefault();
      const p = getPoint(e);
      const tool = currentTool.get();

      if (tool === 'pen' && lastPoint) {
        strokeLine(lastPoint, p, currentColor.get(), currentSize.get(), 'stroke');
        lastPoint = p;
      } else if (tool === 'eraser' && lastPoint) {
        strokeLine(lastPoint, p, bgColor.get(), currentSize.get() * 2, 'erase');
        lastPoint = p;
      } else if ((tool === 'line' || tool === 'rect' || tool === 'circle') && startPoint) {
        drawShape(startPoint, p, tool);
      }
    };

    const onEnd = (e: MouseEvent | TouchEvent) => {
      if (!isDrawing) return;
      e.preventDefault();
      isDrawing = false;
      startPoint = null;
      lastPoint = null;
      previewData = null;
    };

    canvas.addEventListener('mousedown', onStart);
    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('mouseup', onEnd);
    canvas.addEventListener('mouseleave', onEnd);

    canvas.addEventListener('touchstart', onStart, { passive: false });
    canvas.addEventListener('touchmove', onMove, { passive: false });
    canvas.addEventListener('touchend', onEnd);

    const doUndo = () => {
      const prev = snapshot();
      const data = popUndo();
      if (data) {
        pushRedo(prev);
        restore(data);
      }
    };

    const doRedo = () => {
      const data = popRedo();
      if (data) {
        pushUndo(snapshot());
        restore(data);
      }
    };

    const doClear = () => {
      pushUndo(snapshot());
      fillBg();
      clearHistory();
      fillBg();
    };

    const doSavePNG = () => {
      // 绘制到临时 canvas 以确保背景色
      const temp = document.createElement('canvas');
      temp.width = width;
      temp.height = height;
      const tctx = temp.getContext('2d')!;
      tctx.fillStyle = bgColor.get();
      tctx.fillRect(0, 0, width, height);
      tctx.drawImage(canvas, 0, 0);
      const url = temp.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `drawing-${Date.now()}.png`;
      a.click();
    };

    const doSaveJSON = () => {
      const data = {
        version: 1,
        bg: bgColor.get(),
        image: canvas.toDataURL('image/png'),
      };
      const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `drawing-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    };

    const doLoadJSON = () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'application/json,.json';
      input.onchange = () => {
        const file = input.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const parsed = JSON.parse(reader.result as string);
            if (parsed.image) {
              bgColor.set(parsed.bg || '#ffffff');
              const img = new Image();
              img.onload = () => {
                pushUndo(snapshot());
                fillBg();
                ctx.drawImage(img, 0, 0);
              };
              img.src = parsed.image;
            }
          } catch {
            alert('Invalid file');
          }
        };
        reader.readAsText(file);
      };
      input.click();
    };

    // 键盘快捷键
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) doRedo();
        else doUndo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        doSavePNG();
      }
    });

    const toolLabel = span({ class: 'group-label' }, t(content.color));
    const sizeLabel = span({ class: 'group-label' }, t(content.size));
    const bgLabel = span({ class: 'group-label' }, t(content.bgColor));

    effect(() => {
      toolLabel.textContent = t(content.color);
      sizeLabel.textContent = t(content.size);
      bgLabel.textContent = t(content.bgColor);
      renderPalette();
      renderSizes();
    });

    const toolbar = div(
      { class: 'toolbar' },
      div({ class: 'tool-group' }, ...toolBtns),
      div({ class: 'tool-group' }, toolLabel, paletteWrap),
      div({ class: 'tool-group' }, sizeLabel, sizeWrap),
      div({ class: 'tool-group' }, bgLabel, bgInput),
      div({ class: 'tool-group' }, undoBtn, redoBtn, clearBtn, saveBtn, saveJsonBtn, loadBtn),
    );

    return div({ class: 'wrap' },
      div({ class: 'top-bar' },
        div({ class: 'header-left' }, titleEl, subEl),
        langSelect
      ),
      div({ class: 'app-shell' }, toolbar, container)
    );
  },
});
