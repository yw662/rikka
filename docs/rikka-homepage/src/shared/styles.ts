export function getPathFromHash(): string {
  const hash = window.location.hash;
  if (!hash || hash === '#/' || hash === '#') return '/';
  return hash.slice(1);
}

interface SharedHelpers {
  inlineCode: (text: string) => HTMLElement;
  createPlayground: (sourceCode: string, height?: string | number, title?: string) => HTMLElement;
  advancedBadge: (featureName: string, description: string) => HTMLElement;
}

export const sharedStyles: SharedHelpers = {
  inlineCode: (text: string): HTMLElement => {
    const el = document.createElement('code');
    el.textContent = text;
    return el;
  },

  createPlayground: (sourceCode: string, height: string | number = '250', title = 'Try It'): HTMLElement => {
    const el = document.createElement('rikka-live-playground');
    el.setAttribute('code', sourceCode);
    el.setAttribute('height', String(height));
    el.setAttribute('title', title);
    return el;
  },

  advancedBadge: (featureName: string, description: string): HTMLElement => {
    const el = document.createElement('p');
    el.className = 'advanced-badge';
    const label = document.createElement('span');
    label.className = 'advanced-badge-label';
    label.textContent = 'Advanced';
    el.appendChild(label);
    el.appendChild(document.createTextNode(' '));
    const code = document.createElement('code');
    code.textContent = featureName;
    el.appendChild(code);
    el.appendChild(document.createTextNode(` ${description}`));
    return el;
  },
};

export const docPageStyles = `
:host { display: block; }
.doc-page {
  max-width: 800px;
  margin: 0 auto;
}

/* ===== 页面头部 ===== */
.doc-header {
  margin-bottom: var(--spacing-2xl);
  padding-bottom: var(--spacing-xl);
  border-bottom: 1px solid var(--color-border);
}

.doc-title {
  font-size: 2.25rem;
  font-weight: 700;
  color: var(--color-text-primary);
  line-height: 1.2;
  margin-bottom: 0.75rem;
}

.doc-subtitle {
  font-size: 1.125rem;
  color: var(--color-text-secondary);
  line-height: 1.6;
  margin: 0;
}

/* ===== 内容区块 ===== */
.doc-section {
  margin-bottom: var(--spacing-2xl);
}

.section-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-top: 0;
  margin-bottom: var(--spacing-md);
  padding-bottom: var(--spacing-sm);
  border-bottom: 1px solid var(--color-border);
}

.doc-page h1 {
  font-size: 2.25rem;
  font-weight: 700;
  margin-bottom: var(--spacing-sm);
  color: var(--color-text-primary);
  line-height: 1.2;
}
.doc-page > p {
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-lg);
  font-size: 1.1rem;
  line-height: 1.6;
}
.doc-content {
  margin-bottom: var(--spacing-xl);
}
.doc-content h2 {
  font-size: 1.35rem;
  font-weight: 600;
  margin: var(--spacing-xl) 0 var(--spacing-md);
  color: var(--color-text-primary);
  padding-bottom: var(--spacing-sm);
  border-bottom: 1px solid var(--color-border);
}
.doc-content p {
  color: var(--color-text-secondary);
  margin: 0.75rem 0;
  line-height: 1.7;
}
.doc-content ul, .doc-content ol {
  color: var(--color-text-secondary);
  margin: 0.75rem 0;
  padding-left: var(--spacing-lg);
}
.doc-content li {
  margin: 0.4rem 0;
  line-height: 1.6;
}
.code-block {
  background: var(--color-surface);
  padding: var(--spacing-md) 1.25rem;
  border-radius: var(--radius-sm);
  overflow-x: auto;
  margin: 1.25rem 0;
  border: 1px solid var(--color-border);
}
  .code-block code {
  font-family: 'JetBrains Mono', 'Fira Code', Monaco, monospace;
  font-size: 0.875rem;
  line-height: 1.6;
  color: var(--color-text-primary);
  white-space: pre;
}
:not(.code-block) > code {
  background: var(--color-code-inline-bg);
  padding: 0.2em 0.4em;
  border-radius: var(--radius-xs);
  font-size: 0.9em;
  color: var(--color-primary);
  word-break: break-all;
  overflow-wrap: anywhere;
}
.playground-section {
  margin: 2.5rem 0;
  padding: var(--spacing-lg) 0;
  border-top: 1px solid var(--color-border);
  border-bottom: 1px solid var(--color-border);
}
.playground-section h2 {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: var(--spacing-md);
  color: var(--color-text-primary);
}
.explanation {
  background: var(--gradient-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
}
.explanation h2 {
  color: var(--color-text-primary);
  font-size: 1.25rem;
  margin: 0 0 var(--spacing-md) 0;
}
.explanation p {
  color: var(--color-text-secondary);
  font-size: 0.9375rem;
  margin: 0 0 0.75rem 0;
  line-height: 1.7;
}
.explanation p:last-child { margin-bottom: 0; }
.explanation code {
  background: var(--color-step-code-bg);
  padding: 0.2rem var(--spacing-sm);
  border-radius: var(--radius-xs);
  font-family: var(--font-mono), monospace;
  font-size: 0.875rem;
  color: var(--color-primary);
}
.api-signature {
  font-family: var(--font-mono), monospace;
  font-size: 0.8125rem;
  background: var(--color-code-block-bg);
  border: 1px solid var(--color-code-block-border);
  border-left: 3px solid var(--color-primary);
  border-radius: 0 var(--radius-md) var(--radius-md) 0;
  padding: var(--spacing-md) 1.25rem;
  color: var(--color-code-block-text);
  white-space: pre;
  overflow-x: auto;
  margin-bottom: var(--spacing-lg);
  line-height: 1.6;
}
.doc-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: var(--spacing-2xl);
  padding: var(--spacing-lg) 0 var(--spacing-2xl);
  border-top: 1px solid var(--color-border);
  gap: var(--spacing-md);
}
.doc-nav .spacer { flex: 1; }
.doc-nav a {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: 0.6rem 1.25rem;
  border-radius: var(--radius-sm);
  font-size: 0.9rem;
  font-weight: 500;
  text-decoration: none;
  transition: color var(--transition-fast), background-color var(--transition-fast), border-color var(--transition-fast);
}
.doc-nav a.prev,
.doc-nav .prev-link {
  color: var(--color-text-secondary);
  background: rgba(110, 118, 129, 0.08);
  border: 1px solid rgba(110, 118, 129, 0.2);
}
.doc-nav a.prev:hover,
.doc-nav .prev-link:hover {
  color: var(--color-text-secondary);
  background: rgba(110, 118, 129, 0.15);
  border-color: rgba(110, 118, 129, 0.35);
}
.doc-nav a.next,
.doc-nav .next-link {
  color: var(--color-text-secondary);
  background: rgba(110, 118, 129, 0.08);
  border: 1px solid rgba(110, 118, 129, 0.2);
}
.doc-nav a.next:hover,
.doc-nav .next-link:hover {
  color: var(--color-text-secondary);
  background: rgba(110, 118, 129, 0.15);
  border-color: rgba(110, 118, 129, 0.35);
}

/* ===== API 表格 ===== */
.api-table {
  width: 100%;
  border-collapse: collapse;
  margin: var(--spacing-lg) 0;
  font-size: 0.9375rem;
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  overflow: hidden;
  border: 1px solid var(--color-border);
}
.api-table thead {
  background: var(--color-surface-hover);
}
.api-table th {
  padding: var(--spacing-md);
  text-align: left;
  font-weight: 600;
  color: var(--color-text-primary);
  border-bottom: 2px solid var(--color-border);
  font-family: var(--font-mono), monospace;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.api-table td {
  padding: var(--spacing-md);
  color: var(--color-text-secondary);
  border-bottom: 1px solid var(--color-border-subtle);
  vertical-align: top;
  line-height: 1.6;
}
.api-table tr:last-child td {
  border-bottom: none;
}
.api-table tbody tr:hover {
  background: rgba(99, 102, 241, 0.05);
}
.api-table code {
  background: rgba(99, 102, 241, 0.15);
  padding: 0.2rem var(--spacing-sm);
  border-radius: var(--radius-xs);
  font-size: 0.875em;
  color: var(--color-primary-light);
  font-family: var(--font-mono), monospace;
}
.api-table td:first-child {
  font-family: var(--font-mono), monospace;
  font-weight: 500;
  color: var(--color-warning);
}

/* ===== 高级特性标记 ===== */
.advanced-badge {
  background: rgba(210, 153, 34, 0.1);
  padding: 12px 16px;
  border-radius: var(--radius-sm);
  border-left: 4px solid var(--color-warning);
  color: var(--color-text-secondary);
  font-size: 0.9375rem;
  line-height: 1.6;
  margin: 0 0 var(--spacing-lg) 0;
}
.advanced-badge-label {
  display: inline-block;
  background: var(--color-warning);
  color: #0d1117;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0.15em 0.5em;
  border-radius: var(--radius-xs);
  vertical-align: middle;
  margin-right: 0.25rem;
}
.advanced-badge code {
  background: var(--color-advanced-tag-bg);
  padding: 0.2em 0.4em;
  border-radius: var(--radius-xs);
  font-size: 0.9em;
  color: var(--color-warning);
}
.advanced-inline-tag {
  display: inline-block;
  background: var(--color-advanced-tag-bg);
  color: var(--color-warning);
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0.1em 0.4em;
  border-radius: var(--radius-xs);
  vertical-align: middle;
  margin-left: 0.35rem;
}
`;

export const examplePageStyles = `
:host { display: block; }
.example-page {
  max-width: 900px;
  margin: 0 auto;
}
.example-page h1 {
  font-size: 2.25rem;
  color: var(--color-text-primary);
  margin: 0 0 var(--spacing-sm) 0;
}
.example-page > p {
  color: var(--color-text-secondary);
  font-size: 1.1rem;
  margin: 0 0 var(--spacing-xl) 0;
  line-height: 1.7;
}
.playground-container {
  margin-bottom: var(--spacing-xl);
}
.explanation {
  background: var(--gradient-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
}
.explanation h2 {
  color: var(--color-text-primary);
  font-size: 1.25rem;
  margin: 0 0 var(--spacing-md) 0;
}
.explanation p {
  color: var(--color-text-secondary);
  font-size: 0.9375rem;
  margin: 0 0 0.75rem 0;
  line-height: 1.7;
}
.explanation p:last-child { margin-bottom: 0; }
.explanation code {
  background: rgba(99, 102, 241, 0.15);
  padding: 0.2rem var(--spacing-sm);
  border-radius: var(--radius-xs);
  font-family: var(--font-mono), monospace;
  font-size: 0.875rem;
  color: var(--color-primary-light);
}
.example-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: nowrap;
  margin-top: var(--spacing-2xl);
  padding: var(--spacing-lg) 0 var(--spacing-2xl);
  border-top: 1px solid var(--color-border);
  gap: var(--spacing-md);
}
.example-nav .spacer { flex: 1; }
.example-nav a {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: 0.6rem 1.25rem;
  border-radius: var(--radius-sm);
  font-size: 0.9rem;
  font-weight: 500;
  text-decoration: none;
  transition: color var(--transition-fast), background-color var(--transition-fast), border-color var(--transition-fast);
}
.example-nav a.prev,
.example-nav .prev-link {
  color: var(--color-text-secondary);
  background: rgba(110, 118, 129, 0.08);
  border: 1px solid rgba(110, 118, 129, 0.2);
}
.example-nav a.prev:hover,
.example-nav .prev-link:hover {
  color: var(--color-text-secondary);
  background: rgba(110, 118, 129, 0.15);
  border-color: rgba(110, 118, 129, 0.35);
}
.example-nav a.next,
.example-nav .next-link {
  color: var(--color-text-secondary);
  background: rgba(110, 118, 129, 0.08);
  border: 1px solid rgba(110, 118, 129, 0.2);
}
.example-nav a.next:hover,
.example-nav .next-link:hover {
  color: var(--color-text-secondary);
  background: rgba(110, 118, 129, 0.15);
  border-color: rgba(110, 118, 129, 0.35);
}
`;

const showcasePageStylesText = `
:host { display: block; }
.showcase-page { padding: 3rem 1rem; }
.showcase-hero {
  background: var(--gradient-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 2rem;
  margin-bottom: 2rem;
}
.showcase-hero h2 {
  font-size: 1.75rem;
  color: var(--color-text-primary);
  margin-bottom: 0.75rem;
}
.showcase-hero p {
  color: var(--color-text-secondary);
  font-size: 1rem;
  line-height: 1.6;
  max-width: 700px;
}
.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1rem;
}
.feature-card {
  background: var(--gradient-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 1.25rem;
  transition: all 0.25s ease;
}
.feature-card:hover {
  border-color: var(--color-primary);
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(99, 102, 241, 0.15);
}
.feature-card h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-primary-light);
  margin-bottom: 0.5rem;
}
.feature-card p {
  color: var(--color-text-secondary);
  font-size: 0.9375rem;
  line-height: 1.6;
  overflow-wrap: anywhere;
  word-break: break-word;
}
.feature-card code {
  word-break: break-all;
  overflow-wrap: anywhere;
}
.arch-section {
  background: var(--gradient-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 2rem;
  margin-top: 2rem;
}
.arch-section h3 {
  font-size: 1.35rem;
  color: var(--color-text-primary);
  margin-bottom: 1rem;
}
.arch-section ul {
  list-style: none;
  padding: 0;
}
.arch-section li {
  padding: 0.6rem 0;
  border-bottom: 1px solid #1e293b;
  color: var(--color-text-secondary);
  line-height: 1.6;
}
.arch-section li:last-child {
  border-bottom: none;
}
.source-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1.5rem;
  padding: 0.7rem 1.4rem;
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  text-decoration: none;
  font-weight: 500;
  transition: all 0.25s ease;
}
.source-link:hover {
  border-color: var(--color-primary-dark);
  color: var(--color-text-primary);
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.15);
  transform: translateY(-1px);
}

.example-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: nowrap;
  margin-top: 2rem;
  padding: 1.5rem 0 2rem;
  border-top: 1px solid var(--color-border);
  gap: 1rem;
}
.example-nav .spacer { flex: 1; }
.example-nav a {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1.25rem;
  border-radius: 0.375rem;
  font-size: 0.9rem;
  font-weight: 500;
  text-decoration: none;
  transition: color 150ms ease, background-color 150ms ease, border-color 150ms ease;
}
.example-nav a.prev,
.example-nav .prev-link {
  color: var(--color-text-secondary);
  background: rgba(110, 118, 129, 0.08);
  border: 1px solid rgba(110, 118, 129, 0.2);
}
.example-nav a.prev:hover,
.example-nav .prev-link:hover {
  color: var(--color-text-secondary);
  background: rgba(110, 118, 129, 0.15);
  border-color: rgba(110, 118, 129, 0.35);
}
.example-nav a.next,
.example-nav .next-link {
  color: var(--color-text-secondary);
  background: rgba(110, 118, 129, 0.08);
  border: 1px solid rgba(110, 118, 129, 0.2);
}
.example-nav a.next:hover,
.example-nav .next-link:hover {
  color: var(--color-text-secondary);
  background: rgba(110, 118, 129, 0.15);
  border-color: rgba(110, 118, 129, 0.35);
}
`;

export const showcasePageStyles = new CSSStyleSheet();
showcasePageStyles.replaceSync(showcasePageStylesText);
