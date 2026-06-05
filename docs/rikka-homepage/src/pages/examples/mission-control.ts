import { defineElement } from '@rikka/elements';
import { css, div, h1, h2, p, a } from '@rikka/dom';
import { signal } from '@rikka/signal';
import { sharedStyles, examplePageStyles } from '../../shared/styles';

const styles = css`${examplePageStyles}`;

const missionControlCode = `const metrics = signal(['cpu', 'memory', 'network', 'disk']);
const data = signal({ cpu: 45, memory: 62, network: 30, disk: 78 });
const peaks = signal({ cpu: 45, memory: 62, network: 30, disk: 78 });

const getColor = (value) => {
  if (value < 60) return '#22c55e';
  if (value < 80) return '#eab308';
  return '#ef4444';
};

const clearPeaks = () => {
  const keys = metrics.get();
  const currentData = data.get();
  const newPeaks = {};
  keys.forEach(key => {
    newPeaks[key] = currentData[key];
  });
  peaks.set(newPeaks);
};

const app = div(
  { style: { maxWidth: '500px' } },
  h1({ style: { color: '#e2e8f0', marginBottom: '1rem' } }, 'Realtime Mission Control'),
  div({ style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' } },
    For(metrics, (metric) => {
      const value = () => data.get()[metric];
      const peak = () => peaks.get()[metric];
      const color = () => getColor(value());
      return div(
        { style: { padding: '1.5rem', background: '#252542', borderRadius: '0.5rem' } },
        span({ style: { display: 'block', color: '#e2e8f0', fontWeight: '600', marginBottom: '0.75rem', textTransform: 'capitalize' } }, metric),
        div({ style: { height: '8px', background: '#1a1a2e', borderRadius: '4px', overflow: 'hidden', marginBottom: '0.5rem' } },
          div({ style: { height: '100%', width: value() + '%', background: color, transition: 'width 0.3s, background 0.3s', borderRadius: '4px' } })
        ),
        div({ style: { display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' } },
          span({ style: { color: '#94a3b8' } }, value() + '%'),
          span({ style: { color: '#64748b' } }, 'Peak: ' + peak())
        )
      );
    })
  ),
  div({ style: { marginTop: '1.5rem' } },
    button({
      onclick: clearPeaks,
      style: { padding: '0.625rem 1.25rem', background: '#334155', color: '#e2e8f0', border: 'none', borderRadius: '0.5rem', cursor: 'pointer' }
    }, 'Clear Peaks')
  )
);

container.appendChild(app);

let interval;
const setup = () => {
  if (interval) clearInterval(interval);
  interval = setInterval(() => {
    const keys = metrics.get();
    const currentData = data.get();
    const currentPeaks = peaks.get();
    const newData = {...currentData};
    const newPeaks = {...currentPeaks};
    keys.forEach(key => {
      const newValue = Math.floor(Math.random() * 100);
      newData[key] = newValue;
      if (newValue > currentPeaks[key]) {
        newPeaks[key] = newValue;
      }
    });
    data.set(newData);
    peaks.set(newPeaks);
  }, 1000);
  return () => clearInterval(interval);
};
setup();`;

const ExampleMissionControl = defineElement('rikka-example-mission-control', {
  styles,
  render() {
    return div({ class: 'example-page' },
      h1('Realtime Mission Control'),
      p('A dashboard demonstrating realtime updates with signals, effect, and computed.'),
      div({ class: 'playground-container' },
        sharedStyles.createPlayground(missionControlCode, '520', 'Mission Control Example'),
      ),
      div({ class: 'explanation' },
        h2('Key Concepts'),
        p(sharedStyles.inlineCode('signal({ ... })'), ' creates reactive signals for metrics — both values and peaks update with immutable patterns.'),
        p(sharedStyles.inlineCode('effect(() => setInterval(...))'), ' sets up periodic updates every second.'),
        p(sharedStyles.inlineCode('computed(() => ...)'), ' derives colors based on threshold: green < 60%, yellow < 80%, red >= 80%.'),
        p(sharedStyles.inlineCode('For(metrics, (metric) => ...)'), ' renders the metric cards reactively.'),
        p('Values update every second, peaks are tracked, and the "Clear Peaks" button resets them.'),
      ),
      div({ class: 'example-nav' },
        a({ href: '#/examples/live-search', class: 'prev-link' }, '\u2190 Live Search'),
        div({ class: 'spacer' }),
        a({ href: '#/examples/kanban', class: 'next-link' }, 'Kanban \u2192'),
      ),
    );
  }
});

export { ExampleMissionControl };