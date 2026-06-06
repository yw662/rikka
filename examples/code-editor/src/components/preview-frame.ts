import { defineElement, css } from '@takanashi/rikka-elements';
import { div, span, registerDisposable } from '@takanashi/rikka-dom';
import { effect } from '@takanashi/rikka-signal';
import { combinedPreviewHTML } from '../editor-store';

const previewStyles = css`
:host {
  display: block;
  flex: 1;
  min-height: 0;
  border-left: 1px solid #3c3c3c;
}
.preview-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #1e1e1e;
}
.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.75rem;
  background: #252526;
  border-bottom: 1px solid #3c3c3c;
}
.preview-title {
  font-size: 0.75rem;
  color: #d4d4d4;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.preview-iframe {
  flex: 1;
  border: none;
  background: #ffffff;
}
`;

const CONSOLE_CAPTURE_SCRIPT = `
(function() {
  var originalLog = console.log;
  var originalWarn = console.warn;
  var originalError = console.error;
  var originalInfo = console.info;

  function sendToParent(type, args) {
    var msg = Array.from(args).map(function(arg) {
      try {
        return typeof arg === 'object' ? JSON.stringify(arg) : String(arg);
      } catch (e) {
        return String(arg);
      }
    }).join(' ');

    window.parent.postMessage({
      type: 'console',
      level: type,
      message: msg
    }, '*');
  }

  console.log = function() {
    originalLog.apply(console, arguments);
    sendToParent('log', arguments);
  };
  console.warn = function() {
    originalWarn.apply(console, arguments);
    sendToParent('warn', arguments);
  };
  console.error = function() {
    originalError.apply(console, arguments);
    sendToParent('error', arguments);
  };
  console.info = function() {
    originalInfo.apply(console, arguments);
    sendToParent('info', arguments);
  };

  window.addEventListener('error', function(msg, url, line, col, err) {
    window.parent.postMessage({
      type: 'console',
      level: 'error',
      message: err ? err.message : msg
    }, '*');
    return false;
  });

  window.addEventListener('unhandledrejection', function(e) {
    window.parent.postMessage({
      type: 'console',
      level: 'error',
      message: 'Unhandled Promise rejection: ' + (e.reason || 'unknown')
    }, '*');
  });
})();
`;

function buildPreviewHTML(content: string): string {
  const headEnd = content.indexOf('</head>');
  if (headEnd === -1) {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <script>${CONSOLE_CAPTURE_SCRIPT}</script>
</head>
<body>
${content.replace('</body>', '')}
</body>
</html>`;
  }

  return content.replace('</head>', `<script>${CONSOLE_CAPTURE_SCRIPT}</script></head>`);
}

const PreviewFrame = defineElement(
  'preview-frame',
  {
    styles: previewStyles,
    render() {
      const iframeEl = document.createElement('iframe');
      iframeEl.className = 'preview-iframe';
      iframeEl.sandbox.add('allow-scripts');

      iframeEl.srcdoc = buildPreviewHTML(combinedPreviewHTML.get());

      const dispose = effect(() => {
        iframeEl.srcdoc = buildPreviewHTML(combinedPreviewHTML.get());
      });
      registerDisposable(iframeEl, dispose);

      return div(
        { class: 'preview-container' },
        div(
          { class: 'preview-header' },
          span({ class: 'preview-title' }, 'Preview')
        ),
        iframeEl
      );
    }
  }
);

export { PreviewFrame };