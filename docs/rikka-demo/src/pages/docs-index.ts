import { defineElement } from '@rikka/elements';
import { css, div, h1, p, a, span, h3 } from '@rikka/dom';
import { docPageStyles } from '../shared/styles';

const styles = css`${docPageStyles}

.docs-index {
  max-width: 1200px;
  margin: 0 auto;
  padding: 3rem 2rem;
}

.header {
  text-align: center;
  margin-bottom: 4rem;
}

.title {
  font-size: 2.5rem;
  font-weight: 700;
  color: #f1f5f9;
  margin-bottom: 1rem;
}

.subtitle {
  font-size: 1.125rem;
  color: #94a3b8;
  max-width: 600px;
  margin: 0 auto;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.section-card {
  background: #161b22;
  border: 1px solid #334155;
  border-radius: 12px;
  padding: 1.5rem;
  transition: all 0.2s ease;
  cursor: pointer;
  text-decoration: none;
  display: block;
}

.section-card:hover {
  border-color: #6366f1;
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(99, 102, 241, 0.15);
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #6366f1;
  margin-bottom: 0.75rem;
}

.topic-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.topic-item {
  font-size: 0.875rem;
  color: #94a3b8;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.topic-item::before {
  content: '';
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #6366f1;
  flex-shrink: 0;
}`;

const sections = [
  {
    title: '@rikka/signal',
    link: '#/docs/rikka-signal/getting-started',
    topics: ['Getting Started', 'signal()', 'computed()', 'effect()', 'Batch Updates', 'store()'],
  },
  {
    title: '@rikka/dom',
    link: '#/docs/rikka-dom/h',
    topics: ['h()', 'Tag Helpers', 'For', 'Conditionals', 'h``', 'Signal Interpolation', 'css``', 'inlineStyle``'],
  },
  {
    title: '@rikka/elements',
    link: '#/docs/rikka-elements/define-element',
    topics: ['defineElement', 'Shadow DOM', 'adoptStyle', 'attribute', 'event', 'attachTemplate'],
  },
  {
    title: 'Advanced',
    link: '#/docs/advanced/composition',
    topics: ['Composition', 'Fine-grained Updates', 'API Reference'],
  },
];

const RikkaDocsIndex = defineElement('rikka-docs-index', {
  styles,
  render() {
    return div({ class: 'docs-index' },
      div({ class: 'header' },
        h1({ class: 'title' }, 'Documentation'),
        p({ class: 'subtitle' }, 'Learn Rikka step by step with interactive examples.'),
      ),
      div({ class: 'grid' },
        ...sections.map(section =>
          a({ class: 'section-card', href: section.link },
            h3({ class: 'section-title' }, section.title),
            div({ class: 'topic-list' },
              ...section.topics.map(topic =>
                span({ class: 'topic-item' }, topic)
              )
            )
          )
        )
      )
    );
  }
});

export { RikkaDocsIndex };
