import { defineElement } from "rikka-elements";
import { css, div, h1, h2, p, a } from "rikka-dom";
import { sharedStyles, examplePageStyles } from "../../shared/styles";

const styles = css`
  ${examplePageStyles}
`;

const colorPickerCode = `const r = signal(99);
const g = signal(102);
const b = signal(241);

const hex = computed(() => {
  const toHex = (v) => v.toString(16).padStart(2, '0');
  return '#' + toHex(r.get()) + toHex(g.get()) + toHex(b.get());
});

const rgbString = computed(() => \`rgb(\${r.get()}, \${g.get()}, \${b.get()})\`);

const background = hex;

const createSlider = (label, sig, color) => {
  return div({ style: { display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' } },
    span({ style: { width: '1.5rem', fontWeight: '600', color } }, label),
    input({ type: 'range', min: '0', max: '255', value: sig.get(), style: { flex: '1', accentColor: '#6366f1' }, oninput: (e) => sig.set(parseInt(e.target.value)) }),
    span({ style: { width: '2.5rem', textAlign: 'right', color: '#94a3b8' } }, sig)
  );
};

const app = div(
  { style: { maxWidth: '400px' } },
  h1({ style: { color: '#e2e8f0', marginBottom: '1rem' } }, 'Color Picker'),
  div({ style: { marginBottom: '1.5rem' } },
    createSlider('R', r, '#f87171'),
    createSlider('G', g, '#4ade80'),
    createSlider('B', b, '#60a5fa')
  ),
  div({ style: { height: '120px', borderRadius: '0.75rem', marginBottom: '1rem', border: '1px solid #334155' } },
    div({ style: { height: '100%', borderRadius: '0.75rem', background } })
  ),
  div({ style: { textAlign: 'center', fontFamily: 'JetBrains Mono, monospace', fontSize: '1.5rem', color: '#e2e8f0', background: '#0f0f1a', padding: '0.75rem', borderRadius: '0.5rem' } }, hex),
  div({ style: { textAlign: 'center', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.875rem', color: '#94a3b8', marginTop: '0.5rem' } }, rgbString)
);

container.appendChild(app);`;

const ExampleColorPicker = defineElement("rikka-example-color-picker", {
  styles,
  render() {
    return div(
      { class: "example-page" },
      h1("Color Picker"),
      p("RGB sliders controlling a color preview in real-time."),
      div(
        { class: "playground-container" },
        sharedStyles.createPlayground(
          colorPickerCode,
          "350",
          "Color Picker Example",
        ),
      ),
      div(
        { class: "explanation" },
        h2("Key Concepts"),
        p(
          "Three separate ",
          sharedStyles.inlineCode("signal()"),
          " instances for R, G, B values.",
        ),
        p(
          sharedStyles.inlineCode("computed()"),
          " derives hex and rgb strings from the three signals.",
        ),
        p(
          "Each slider updates its signal, triggering automatic re-computation.",
        ),
        p("Drag the sliders to see real-time color updates."),
      ),
      div(
        { class: "example-nav" },
        a({ href: "#/examples/todo", class: "prev-link" }, "\u2190 Todo List"),
        div({ class: "spacer" }),
        a({ href: "#/examples/tabs", class: "next-link" }, "Tabs \u2192"),
      ),
    );
  },
});

export { ExampleColorPicker };
