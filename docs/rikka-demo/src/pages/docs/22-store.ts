import { defineElement } from @rikka/elements;
import { css, div, h1, h2, p, pre, a } from @rikka/dom;
import { sharedStyles, docPageStyles } from "../../shared/styles";

const styles = css`
  ${docPageStyles}
`;

export const RikkaDocSignalStore = defineElement(
  "rikka-doc-signal-store",
  {
    styles,
    render() {
      return div(
        { class: "doc-page" },
        div(
          { class: "doc-header" },
          h1({ class: "doc-title" }, "store()"),
          p(
            { class: "doc-subtitle" },
            "Reactive objects with automatic property tracking using Proxy.",
          ),
        ),
        div(
          { class: "doc-section" },
          h2({ class: "section-title" }, "Introduction"),
          p(
            {},
            sharedStyles.inlineCode("store()"),
            " creates a reactive proxy object where each property is automatically tracked as a signal. This is perfect for managing complex state like forms, configuration objects, or nested data structures.",
          ),
        ),
        div(
          { class: "doc-section" },
          h2({ class: "section-title" }, "Creating a Store"),
          p(
            {},
            "Use ",
            sharedStyles.inlineCode("store(initialObject)"),
            " to create a reactive store. All properties become reactive signals automatically.",
          ),
          sharedStyles.createPlayground(
            `import { store, signalOf } from '@rikka/signal';

const user = store({
  name: 'Alice',
  age: 25,
  preferences: {
    theme: 'dark',
    notifications: true,
  }
});

// user.name returns the raw value ("Alice")
// signalOf(user, 'name') returns the underlying Signal.State<string>
// Use signalOf() for reactive bindings in templates

container.appendChild(div({ style: { padding: '1rem' } },
  h2({}, 'Store Demo'),
  p({}, 'Name: ', signalOf(user, 'name')),
  p({}, 'Age: ', signalOf(user, 'age')),
  p({}, 'Theme: ', computed(() => user.preferences.theme)),
  div({ style: { display: 'flex', gap: '8px', marginTop: '8px' } },
    button({ onclick: () => user.name = 'Bob' }, 'Change Name'),
    button({ onclick: () => user.age++ }, 'Age++'),
    button({ onclick: () => user.preferences.theme = user.preferences.theme === 'dark' ? 'light' : 'dark' }, 'Toggle Theme')
  )
));`,
            "260",
            "Store Basics",
          ),
        ),
        div(
          { class: "doc-section" },
          h2({ class: "section-title" }, "signalOf() for Reactive Access"),
          p(
            {},
            "Store properties return raw values by default. Use ",
            sharedStyles.inlineCode("signalOf()"),
            " to access the underlying ",
            sharedStyles.inlineCode("Signal.State"),
            " for reactive template binding:",
          ),
          pre(
            { class: "code-block" },
            `const user = store({ name: 'Alice', age: 25 });

user.name              // string — raw value, no reactivity
signalOf(user, 'name') // Signal.State<string> — tracked by rikka-dom

// In templates, use signalOf() for fine-grained updates:
p({}, 'Hello, ', signalOf(user, 'name'))  // ✅ Text node updates on change
p({}, 'Hello, ', user.name)               // ❌ Static, never updates

// For non-template usage, .name is convenient:
console.log(user.name);            // "Alice"
if (user.age > 18) { ... }         // Works naturally`,
          ),
        ),
        div(
          { class: "doc-section" },
          h2({ class: "section-title" }, "Nested Reactivity"),
          p(
            {},
            "Stores automatically handle nested objects. Each level of nesting becomes its own reactive store. Nested proxies use a delegating architecture — references stay valid after replacement.",
          ),
          pre(
            { class: "code-block" },
            `const state = store({
  user: {
    name: 'Alice',
    profile: {
      email: 'alice@example.com'
    }
  }
});

// Nested access is fully reactive
state.user.profile.email;

// Updates propagate correctly
state.user.name = 'Bob';  // Traces up the chain

// Old references auto-sync after replacement
const oldUser = state.user;
state.user = { name: 'Charlie' };
oldUser.name;  // "Charlie" — still valid!`,
          ),
        ),
        div(
          { class: "doc-section" },
          h2({ class: "section-title" }, "Using Stores in Components"),
          p(
            {},
            "Use ",
            sharedStyles.inlineCode("signalOf()"),
            " for properties that need reactive binding:",
          ),
          pre(
            { class: "code-block" },
            `const UserCard = defineElement('user-card', {
  shadow: true,
  render() {
    const user = store({
      name: 'Alice',
      email: 'alice@example.com'
    });

    return div({},
      h2({}, signalOf(user, 'name')),
      p({}, signalOf(user, 'email')),
      button({
        onclick: () => user.name = 'Bob'
      }, 'Change Name')
    );
  }
})`,
          ),
        ),
        div(
          { class: "doc-section" },
          h2({ class: "section-title" }, "raw() Helper"),
          p(
            {},
            "Use ",
            sharedStyles.inlineCode("raw(store)"),
            " to access the underlying raw object without reactivity:",
          ),
          pre(
            { class: "code-block" },
            `import { store, raw } from '@rikka/signal';

const state = store({ count: 0 });
const plainObj = raw(state);

// plainObj is a normal object
// Modifications won't trigger updates
plainObj.count = 10;  // No reactivity`,
          ),
        ),
        div(
          { class: "doc-section" },
          h2({ class: "section-title" }, "When to Use store() vs signal()"),
          p({}, "Choose based on your use case:"),
          pre(
            { class: "code-block" },
            `// Use signal() for:
// - Single primitive values (string, number, boolean)
// - Simple counters or toggles
const count = signal(0);
const isVisible = signal(true);
const name = signal('Hello');

// Use store() for:
// - Complex objects with multiple properties
// - Forms with many fields
// - Configuration objects
// - Nested data structures
const form = store({
  username: '',
  email: '',
  preferences: {
    newsletter: true,
    theme: 'light'
  }
})`,
          ),
        ),
        div(
          { class: "doc-section" },
          h2({ class: "section-title" }, "Try It"),
          sharedStyles.createPlayground(
            `import { store, signalOf } from '@rikka/signal';

const user = store({
  name: 'Alice',
  role: 'Developer',
  skills: ['TypeScript', 'Web Components']
});

const app = div(
  { style: { padding: '1rem' } },
  div({ style: { marginBottom: '1rem' } },
    h3({ style: { color: '#6366f1', marginBottom: '0.5rem' } }, 'User Profile'),
    p({}, 'Name: ', signalOf(user, 'name')),
    p({}, 'Role: ', signalOf(user, 'role')),
  ),
  div({ style: { display: 'flex', gap: '0.5rem' } },
    button({
      onclick: () => user.name = 'Bob',
      style: { padding: '0.5rem 1rem', background: '#6366f1', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }
    }, 'Change Name'),
    button({
      onclick: () => user.role = 'Designer',
      style: { padding: '0.5rem 1rem', background: '#334155', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }
    }, 'Change Role')
  )
);

container.appendChild(app);`,
            "220",
            "Store Example",
          ),
        ),
        div(
          { class: "doc-nav" },
          a(
            { href: "#/docs/rikka-signal/batch", class: "prev-link" },
            "\u2190 Batch Updates",
          ),
          div({ class: "spacer" }),
          a({ href: "#/docs/rikka-dom/h", class: "next-link" }, "h() \u2192"),
        ),
      );
    },
  },
);
