export function getPathFromHash(): string {
  const hash = window.location.hash;
  if (!hash || hash === '#/' || hash === '#') return '/';
  return hash.slice(1);
}

interface SharedHelpers {
  inlineCode: (text: string) => HTMLElement;
  createPlayground: (sourceCode: string, height?: string | number, title?: string) => HTMLElement;
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
};

export const docPageStyles = `
:host { display: block; }
.doc-page {
  max-width: 800px;
  margin: 0 auto;
}
.doc-page h1 {
  font-size: 2.25rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  color: #f0f6fc;
  line-height: 1.2;
}
.doc-page > p {
  color: #8b949e;
  margin-bottom: 1.5rem;
  font-size: 1.1rem;
  line-height: 1.6;
}
.doc-content {
  margin-bottom: 2rem;
}
.doc-content h2 {
  font-size: 1.35rem;
  font-weight: 600;
  margin: 2rem 0 1rem;
  color: #f0f6fc;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #30363d;
}
.doc-content p {
  color: #c9d1d9;
  margin: 0.75rem 0;
  line-height: 1.7;
}
.doc-content ul, .doc-content ol {
  color: #c9d1d9;
  margin: 0.75rem 0;
  padding-left: 1.5rem;
}
.doc-content li {
  margin: 0.4rem 0;
  line-height: 1.6;
}
.code-block {
  background: #161b22;
  padding: 1rem 1.25rem;
  border-radius: 6px;
  overflow-x: auto;
  margin: 1.25rem 0;
  border: 1px solid #30363d;
}
.code-block code {
  font-family: 'Fira Code', 'JetBrains Mono', Monaco, monospace;
  font-size: 0.875rem;
  line-height: 1.6;
  color: #c9d1d9;
  white-space: pre;
}
:not(.code-block) > code {
  background: rgba(110, 118, 129, 0.2);
  padding: 0.2em 0.4em;
  border-radius: 3px;
  font-size: 0.9em;
  color: #f0883e;
}
.playground-section {
  margin: 2.5rem 0;
  padding: 1.5rem 0;
  border-top: 1px solid #30363d;
  border-bottom: 1px solid #30363d;
}
.playground-section h2 {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: #f0f6fc;
}
.explanation {
  background: linear-gradient(135deg, #1a1a2e 0%, #161b22 100%);
  border: 1px solid #30363d;
  border-radius: 0.75rem;
  padding: 1.5rem;
  margin-bottom: 2rem;
}
.explanation h2 {
  color: #f0f6fc;
  font-size: 1.25rem;
  margin: 0 0 1rem 0;
}
.explanation p {
  color: #94a3b8;
  font-size: 0.9375rem;
  margin: 0 0 0.75rem 0;
  line-height: 1.7;
}
.explanation p:last-child { margin-bottom: 0; }
.explanation code {
  background: rgba(99, 102, 241, 0.15);
  padding: 0.2rem 0.5rem;
  border-radius: 0.25rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.875rem;
  color: #a5b4fc;
}
.api-signature {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.8125rem;
  background: #0d1117;
  border: 1px solid #30363d;
  border-left: 3px solid #6366f1;
  border-radius: 0 0.5rem 0.5rem 0;
  padding: 1rem 1.25rem;
  color: #e6edf3;
  white-space: pre;
  overflow-x: auto;
  margin-bottom: 1.5rem;
  line-height: 1.6;
}
.doc-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 3rem;
  padding: 1.5rem 0 3rem;
  border-top: 1px solid #30363d;
  gap: 1rem;
}
.doc-nav .spacer { flex: 1; }
.doc-nav a {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1.25rem;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.15s ease;
}
.doc-nav a.prev,
.doc-nav .prev-link {
  color: #8b949e;
  background: rgba(110, 118, 129, 0.08);
  border: 1px solid rgba(110, 118, 129, 0.2);
}
.doc-nav a.prev:hover,
.doc-nav .prev-link:hover {
  color: #c9d1d9;
  background: rgba(110, 118, 129, 0.15);
  border-color: rgba(110, 118, 129, 0.35);
}
.doc-nav a.next,
.doc-nav .next-link {
  color: #8b949e;
  background: rgba(110, 118, 129, 0.08);
  border: 1px solid rgba(110, 118, 129, 0.2);
}
.doc-nav a.next:hover,
.doc-nav .next-link:hover {
  color: #c9d1d9;
  background: rgba(110, 118, 129, 0.15);
  border-color: rgba(110, 118, 129, 0.35);
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
  color: #f0f6fc;
  margin: 0 0 0.5rem 0;
}
.example-page > p {
  color: #94a3b8;
  font-size: 1.1rem;
  margin: 0 0 2rem 0;
  line-height: 1.7;
}
.playground-container {
  margin-bottom: 2rem;
}
.explanation {
  background: linear-gradient(135deg, #1a1a2e 0%, #161b22 100%);
  border: 1px solid #30363d;
  border-radius: 0.75rem;
  padding: 1.5rem;
  margin-bottom: 2rem;
}
.explanation h2 {
  color: #f0f6fc;
  font-size: 1.25rem;
  margin: 0 0 1rem 0;
}
.explanation p {
  color: #94a3b8;
  font-size: 0.9375rem;
  margin: 0 0 0.75rem 0;
  line-height: 1.7;
}
.explanation p:last-child { margin-bottom: 0; }
.explanation code {
  background: rgba(99, 102, 241, 0.15);
  padding: 0.2rem 0.5rem;
  border-radius: 0.25rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.875rem;
  color: #a5b4fc;
}
.example-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 3rem;
  padding: 1.5rem 0 3rem;
  border-top: 1px solid #30363d;
  gap: 1rem;
}
.example-nav .spacer { flex: 1; }
.example-nav a {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1.25rem;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.15s ease;
}
.example-nav a.prev,
.example-nav .prev-link {
  color: #8b949e;
  background: rgba(110, 118, 129, 0.08);
  border: 1px solid rgba(110, 118, 129, 0.2);
}
.example-nav a.prev:hover,
.example-nav .prev-link:hover {
  color: #c9d1d9;
  background: rgba(110, 118, 129, 0.15);
  border-color: rgba(110, 118, 129, 0.35);
}
.example-nav a.next,
.example-nav .next-link {
  color: #8b949e;
  background: rgba(110, 118, 129, 0.08);
  border: 1px solid rgba(110, 118, 129, 0.2);
}
.example-nav a.next:hover,
.example-nav .next-link:hover {
  color: #c9d1d9;
  background: rgba(110, 118, 129, 0.15);
  border-color: rgba(110, 118, 129, 0.35);
}
`;
