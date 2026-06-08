export const PLAYGROUND_STARTER_CODE = `const count = signal(0);
const doubled = computed(() => count.get() * 2);
const running = signal(false);
let interval;

function start() {
  if (!running.get()) {
    running.set(true);
    interval = setInterval(() => count.set(count.get() + 1), 1000);
  }
}
function stop() {
  running.set(false);
  clearInterval(interval);
}
function reset() {
  stop();
  count.set(0);
}

const r = signal(99);
const g = signal(102);
const b = signal(241);
const hexColor = computed(() => {
  const toHex = (v) => v.toString(16).padStart(2, '0');
  return '#' + toHex(r.get()) + toHex(g.get()) + toHex(b.get());
});
const rgbColor = computed(() => 'rgb(' + r.get() + ', ' + g.get() + ', ' + b.get() + ')');

function slider(label, sig, color) {
  return div({ style: { display: 'flex', alignItems: 'center', gap: '8px' } },
    span({ style: { color: color, width: '14px', fontWeight: '600', fontSize: '13px' } }, label),
    h('input', { type: 'range', min: '0', max: '255', value: sig, oninput: (e) => sig.set(Number(e.target.value)), style: { flex: '1' } }),
    span({ style: { color: '#94a3b8', width: '28px', fontSize: '13px', textAlign: 'right' } }, sig)
  );
}

const app = div(
  { style: { fontFamily: 'system-ui', padding: '16px' } },
  div({ style: { display: 'flex', flexDirection: 'column', gap: '12px', padding: '12px', background: '#161b22', borderRadius: '8px', border: '1px solid #334155' } },
    div({ style: { textAlign: 'center' } },
      div({ style: { fontSize: '48px', fontWeight: 'bold', color: '#6366f1' } }, count),
      div({ style: { fontSize: '14px', color: '#94a3b8' } }, '\u00d72: ', doubled)
    ),
    div({ style: { display: 'flex', gap: '6px', justifyContent: 'center' } },
      button({ onclick: start, style: { padding: '6px 14px', background: '#238636', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' } }, 'Start'),
      button({ onclick: stop, style: { padding: '6px 14px', background: '#da3633', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' } }, 'Stop'),
      button({ onclick: reset, style: { padding: '6px 14px', background: '#30363d', color: '#e2e8f0', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' } }, 'Reset')
    )
  ),
  div({ style: { marginTop: '16px', padding: '12px', background: '#161b22', borderRadius: '8px', border: '1px solid #334155' } },
    div({ style: { width: '100%', height: '60px', borderRadius: '6px', background: rgbColor, marginBottom: '10px', border: '1px solid #30363d' } }),
    slider('R', r, '#f87171'),
    slider('G', g, '#4ade80'),
    slider('B', b, '#60a5fa'),
    div({ style: { marginTop: '8px', color: '#94a3b8', fontSize: '12px', fontFamily: 'monospace', textAlign: 'center' } }, hexColor)
  )
);

container.appendChild(app);`;
