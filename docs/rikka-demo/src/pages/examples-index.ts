import { defineElement } from '@rikka/elements';
import { css, div, h1, h2, p, a, span } from '@rikka/dom';
import { sharedStyles, examplePageStyles } from '../shared/styles';

const styles = css`${examplePageStyles}

.examples-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
}
.example-card {
  background: linear-gradient(135deg, #1a1a2e 0%, #161b22 100%);
  border: 1px solid #334155;
  border-radius: 0.75rem;
  padding: 1.5rem;
  transition: all 0.3s ease;
  text-decoration: none;
  color: inherit;
  display: block;
  position: relative;
  overflow: hidden;
}
.example-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #6366f1, #a78bfa, #6366f1);
  opacity: 0;
  transition: opacity 0.3s ease;
}
.example-card:hover::before {
  opacity: 1;
}
.example-card:hover {
  border-color: #6366f1;
  transform: translateY(-4px);
  box-shadow: 0 12px 35px rgba(99, 102, 241, 0.18);
}
.example-icon {
  font-size: 2rem;
  margin-bottom: 0.75rem;
  display: block;
}
.example-card h2 {
  color: #e2e8f0;
  font-size: 1.25rem;
  margin-bottom: 0.5rem;
  font-weight: 600;
}
.example-card p {
  color: #94a3b8;
  font-size: 0.9375rem;
  line-height: 1.6;
  margin: 0 0 1rem 0;
}
.example-tags {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.example-tag {
  background: rgba(99, 102, 241, 0.12);
  color: #a5b4fc;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 500;
  border: 1px solid rgba(99, 102, 241, 0.2);
}`;

const examples = [
  { icon: '🔢', title: 'Counter', desc: 'A simple counter demonstrating signal and computed reactivity with real-time updates.', href: '#/examples/counter', tags: ['signal', 'computed'] },
  { icon: '✅', title: 'Todo List', desc: 'A reactive todo list with add, toggle, delete operations and remaining count.', href: '#/examples/todo', tags: ['arrays', 'computed', 'events'] },
  { icon: '🎨', title: 'Color Picker', desc: 'RGB sliders controlling a color preview in real-time with hex output.', href: '#/examples/color-picker', tags: ['multiple signals', 'computed'] },
  { icon: '📑', title: 'Tabs', desc: 'A tab component with reactive content switching using signals.', href: '#/examples/tabs', tags: ['conditional', 'events'] },
  { icon: '🔍', title: 'Live Search', desc: 'A search input that filters a list in real-time as you type.', href: '#/examples/live-search', tags: ['filter', 'computed', 'input'] },
  { icon: '📊', title: 'Mission Control', desc: 'Real-time dashboard with 4 metrics updating every second, peak tracking, and threshold alerts.', href: '#/examples/mission-control', tags: ['effect', 'store', 'For'] },
  { icon: '📋', title: 'Kanban Board', desc: '3-column project board with drag-and-drop cards, priority colors, and stats bar.', href: '#/examples/kanban', tags: ['effect', 'drag-drop', 'computed'] },
  { icon: '🎨', title: 'Token Manager', desc: 'Design system color manager with groups, theme switching, and CSS export.', href: '#/examples/token-manager', tags: ['store', 'effect', 'localStorage'] },
  { icon: '📚', title: 'Knowledge Base', desc: 'Search interface with facets, history, popular tags, and reactive filtering.', href: '#/examples/knowledge-base', tags: ['computed', 'effect', 'localStorage'] },
  { icon: '💻', title: 'Mini IDE', desc: 'File tree, closable tabs, editor area, and terminal simulator.', href: '#/examples/mini-ide', tags: ['signal', 'effect', 'For'] },
  { icon: '👥', title: 'Collaboration', desc: 'Team simulator with avatars, status indicators, role filtering, and live updates.', href: '#/examples/collaboration', tags: ['effect', 'computed', 'store'] },
];

const ExamplesIndex = defineElement('rikka-examples-index', {
  styles,
  render() {
    return div({ class: 'example-page' },
      h1({}, 'Examples'),
      p({}, 'Interactive examples showcasing Rikka\'s reactivity system in action. Click any example to see it live.'),

      div({ class: 'examples-grid' },
        ...examples.map(example =>
          a({ href: example.href, class: 'example-card' },
            span({ class: 'example-icon' }, example.icon),
            h2({}, example.title),
            p({}, example.desc),
            div({ class: 'example-tags' },
              ...example.tags.map(tag => span({ class: 'example-tag' }, tag))
            )
          )
        )
      ),

      div({ class: 'explanation' },
        h2({}, 'What You\'ll Learn'),
        p(sharedStyles.inlineCode('signal()'), ' — Create reactive state containers that automatically track dependencies.'),
        p(sharedStyles.inlineCode('computed()'), ' — Derive values that update automatically when their sources change.'),
        p(sharedStyles.inlineCode('effect()'), ' — Run side effects (like DOM updates) when reactive data changes.'),
        p('Each example is fully interactive — edit the code and see results instantly!')
      ),
    );
  }
});

export { ExamplesIndex };
