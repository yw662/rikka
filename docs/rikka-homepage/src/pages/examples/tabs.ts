import { defineElement } from "@takanashi/rikka-elements";
import { css, div, h1, h2, p, a } from "@takanashi/rikka-dom";
import {sharedHelpers} from "../../shared/helpers";
import {examplePageStyles} from "../../shared/page-styles";
import { RikkaLivePlayground } from "@takanashi/rikka-live-playground";

const styles = css`
  ${examplePageStyles}
`;

const tabsCode = `const activeTab = signal(0);

const tabs = [
  { title: 'Overview', content: 'This is the overview tab. It provides a high-level summary of the application and its main features.' },
  { title: 'Features', content: 'Here you can find detailed information about all the features available in this application.' },
  { title: 'Settings', content: 'Configure your preferences and customize the application behavior to suit your needs.' }
];

const currentContent = computed(() => tabs[activeTab.get()]);

const createTabButton = (tab, index) => {
  return button(
    {
      onclick: () => activeTab.set(index),
      style: () => ({ padding: '0.75rem 1.5rem', background: 'transparent', border: 'none', borderBottom: '2px solid ' + (activeTab.get() === index ? '#6366f1' : 'transparent'), color: (activeTab.get() === index ? '#6366f1' : '#94a3b8'), cursor: 'pointer', fontSize: '0.9375rem', fontWeight: (activeTab.get() === index ? '600' : '400'), transition: 'all 0.2s' })
    },
    tab.title
  );
};

const contentPanel = computed(() => {
  const tab = currentContent.get();
  return div({ style: { padding: '1.5rem 0' } },
    h2({ style: { color: '#e2e8f0', margin: '0 0 0.5rem 0' } }, tab.title),
    p({ style: { color: '#94a3b8', margin: '0', lineHeight: '1.7' } }, tab.content)
  );
});

const app = div(
  { style: { maxWidth: '500px' } },
  h1({ style: { color: '#e2e8f0', marginBottom: '1rem' } }, 'Tabs'),
  div({ style: { display: 'flex', borderBottom: '1px solid #334155', marginBottom: '0' } },
    ...tabs.map((tab, i) => createTabButton(tab, i))
  ),
  div({ style: { background: '#1a1a2e', padding: '0 1.5rem', borderRadius: '0 0 0.75rem 0.75rem', border: '1px solid #334155', borderTop: 'none', minHeight: '120px' } },
    contentPanel
  )
);

container.appendChild(app);`;

const ExampleTabs = defineElement("rikka-example-tabs", {
  styles,
  render() {
    return div(
      { class: "example-page" },
      h1("Tabs"),
      p("A tab component with reactive content switching."),
      div(
        { class: "playground-container" },
        RikkaLivePlayground.h({
    code: tabsCode, height: "320", title: "Tabs Example"
}),
      ),
      div(
        { class: "explanation" },
        h2("Key Concepts"),
        p(
          sharedHelpers.inlineCode("signal(0)"),
          " stores the active tab index.",
        ),
        p(
          sharedHelpers.inlineCode("computed()"),
          " derives the current content from the active tab.",
        ),
        p("Click different tabs to switch content — all handled by signals."),
        p("The pattern works for any conditional rendering scenario."),
      ),
      div(
        { class: "example-nav" },
        a(
          { href: "#/examples/color-picker", class: "prev-link" },
          "\u2190 Color Picker",
        ),
        div({ class: "spacer" }),
        a(
          { href: "#/examples/live-search", class: "next-link" },
          "Live Search \u2192",
        ),
      ),
    );
  },
});

export { ExampleTabs };
