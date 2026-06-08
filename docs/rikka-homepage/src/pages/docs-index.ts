import { defineElement } from '@takanashi/rikka-elements';
import { css, div, h1, p, a, span, h3 } from '@takanashi/rikka-dom';
import { effect } from '@takanashi/rikka-signal';
import { docPageStyles } from '../shared/page-styles';
import { t, type Locale } from '../shared/i18n';

const docsContent = {
  title: { en: 'Documentation', zh: '文档' } as Record<Locale, string>,
  subtitle: {
    en: 'Learn Rikka step by step with interactive examples.',
    zh: '通过交互式示例逐步学习 Rikka。',
  } as Record<Locale, string>,
};

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
  color: var(--color-text-primary);
  margin-bottom: 1rem;
}

.subtitle {
  font-size: 1.125rem;
  color: var(--color-text-secondary);
  max-width: 600px;
  margin: 0 auto;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.section-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 1.5rem;
  transition: all 0.2s ease;
  cursor: pointer;
  text-decoration: none;
  display: block;
}

.section-card:hover {
  border-color: var(--color-primary);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(99, 102, 241, 0.15);
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-primary);
  margin-bottom: 0.75rem;
}

.topic-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.topic-item {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.topic-item::before {
  content: '';
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-primary);
  flex-shrink: 0;
}

.topic-item.advanced::before {
  background: var(--color-warning);
}

.topic-advanced-tag {
  font-size: 0.6rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: var(--color-advanced-tag-bg);
  color: var(--color-warning);
  padding: 0.1em 0.4em;
  border-radius: 0.25rem;
  margin-left: auto;
}`;

const sections = [
  {
    title: '@takanashi/rikka-signal',
    link: '#/docs/@takanashi/rikka-signal/getting-started',
    topics: [
      { name: 'Getting Started' },
      { name: 'signal()' },
      { name: 'computed()' },
      { name: 'effect()' },
    ],
  },
  {
    title: '@takanashi/rikka-dom',
    link: '#/docs/@takanashi/rikka-dom/h',
    topics: [
      { name: 'h()' },
      { name: 'Tag Helpers' },
      { name: 'For' },
      { name: 'Conditionals' },
      { name: 'h``', advanced: true },
      { name: 'Signal Interpolation', advanced: true },
      { name: 'css``', advanced: true },
      { name: 'inlineStyle``', advanced: true },
    ],
  },
  {
    title: '@takanashi/rikka-elements',
    link: '#/docs/@takanashi/rikka-elements/define-element',
    topics: [
      { name: 'defineElement', advanced: true },
      { name: 'Shadow DOM', advanced: true },
      { name: 'adoptStyle', advanced: true },
      { name: 'attribute', advanced: true },
      { name: 'event', advanced: true },
      { name: 'attachTemplate', advanced: true },
    ],
  },
  {
    title: 'API Reference',
    link: '#/docs/api-reference',
    topics: [
      { name: 'API Reference' },
    ],
  },
];

const RikkaDocsIndex = defineElement('rikka-docs-index', {
  styles,
  render() {
    return div({ class: 'docs-index' },
      div({ class: 'header' },
        (() => { const el = h1({ class: 'title' }); effect(() => { el.textContent = t(docsContent.title); }); return el; })(),
        (() => { const el = p({ class: 'subtitle' }); effect(() => { el.textContent = t(docsContent.subtitle); }); return el; })(),
      ),
      div({ class: 'grid' },
        ...sections.map(section =>
          a({ class: 'section-card', href: section.link },
            h3({ class: 'section-title' }, section.title),
            div({ class: 'topic-list' },
              ...section.topics.map(topic =>
                span({ class: `topic-item${topic.advanced ? ' advanced' : ''}` },
                  topic.name,
                  topic.advanced ? span({ class: 'topic-advanced-tag' }, 'adv') : null,
                )
              )
            )
          )
        )
      )
    );
  }
});

export { RikkaDocsIndex };
