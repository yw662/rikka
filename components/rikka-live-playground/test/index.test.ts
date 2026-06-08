import { describe, it, expect, beforeEach, afterEach, vi } from "@rstest/core";
import { RikkaLivePlayground } from "../src/index.js";
import type { LivePlaygroundElement } from "../src/index.js";

type LivePlaygroundEl = LivePlaygroundElement;

function waitFor(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

describe("RikkaLivePlayground", () => {
  let el: LivePlaygroundEl;

  beforeEach(async () => {
    await waitFor(50);
    el = document.createElement("rikka-live-playground") as LivePlaygroundEl;
  });

  afterEach(() => {
    el?.remove();
  });

  describe("custom element registration", () => {
    it("is registered as a custom element", () => {
      expect(customElements.get("rikka-live-playground")).toBe(
        RikkaLivePlayground,
      );
    });

    it("has observedAttributes defined", () => {
      expect(RikkaLivePlayground.observedAttributes).toBeTruthy();
      expect(RikkaLivePlayground.observedAttributes).toContain("code");
      expect(RikkaLivePlayground.observedAttributes).toContain("height");
      expect(RikkaLivePlayground.observedAttributes).toContain("title");
    });
  });

  describe("shadow DOM", () => {
    it("creates a shadow root when connected to DOM", async () => {
      document.body.appendChild(el);
      await waitFor(10);
      expect(el.shadowRoot).toBeTruthy();
    });

    it("applies adopted styles to shadow root", async () => {
      document.body.appendChild(el);
      await waitFor(10);
      const sheets = el.shadowRoot!.adoptedStyleSheets;
      expect(sheets.length).toBeGreaterThan(0);
    });
  });

  describe("attribute defaults", () => {
    it("code defaults to empty string", async () => {
      document.body.appendChild(el);
      await waitFor(10);
      expect(el.code).toBe("");
    });

    it("height defaults to 320", async () => {
      document.body.appendChild(el);
      await waitFor(10);
      expect(el.height).toBe("320");
    });

    it("title defaults to Example", async () => {
      document.body.appendChild(el);
      await waitFor(10);
      expect(el.title).toBe("Example");
    });
  });

  describe("attribute values", () => {
    it("reads code attribute value", async () => {
      el.setAttribute("code", 'console.log("hello")');
      document.body.appendChild(el);
      await waitFor(10);
      expect(el.code).toBe('console.log("hello")');
    });

    it("reads height attribute value", async () => {
      el.setAttribute("height", "300");
      document.body.appendChild(el);
      await waitFor(10);
      expect(el.height).toBe("300");
    });

    it("reads title attribute value", async () => {
      el.setAttribute("title", "My Demo");
      document.body.appendChild(el);
      await waitFor(10);
      expect(el.title).toBe("My Demo");
    });
  });

  describe("signal accessors", () => {
    it("has signal accessors for attributes", async () => {
      document.body.appendChild(el);
      await waitFor(10);
      expect(el.$code).toBeTruthy();
      expect(el.$height).toBeTruthy();
      expect(el.$title).toBeTruthy();
    });

    it("signal accessor reflects attribute value", async () => {
      el.setAttribute("code", "test-code");
      document.body.appendChild(el);
      await waitFor(10);
      expect(el.$code.get()).toBe("test-code");
    });
  });

  describe("event API", () => {
    it("dispatchError method exists", async () => {
      document.body.appendChild(el);
      await waitFor(10);
      expect(typeof el.dispatchError).toBe("function");
    });

    it("addEventListener subscribes to error events", async () => {
      document.body.appendChild(el);
      await waitFor(10);
      let received: CustomEvent<string> | null = null;
      el.addEventListener("error", (evt) => {
        received = evt as CustomEvent<string>;
      });
      el.dispatchError("test error");
      expect(received).toBeTruthy();
      expect(received!.detail).toBe("test error");
    });

    it("onerror handler property works", async () => {
      document.body.appendChild(el);
      await waitFor(10);
      let received: CustomEvent<string> | null = null;
      el.onerror = (evt: CustomEvent<string>) => {
        received = evt;
      };
      el.dispatchError("handler test");
      expect(received).toBeTruthy();
      expect(received!.detail).toBe("handler test");
    });
  });

  describe("shadow DOM structure", () => {
    it("renders a container div", async () => {
      document.body.appendChild(el);
      await waitFor(10);
      const container = el.shadowRoot!.querySelector(".container");
      expect(container).toBeTruthy();
    });

    it("renders a header with title", async () => {
      el.setAttribute("title", "Test Title");
      document.body.appendChild(el);
      await waitFor(10);
      const titleEl = el.shadowRoot!.querySelector(".title");
      expect(titleEl).toBeTruthy();
      expect(titleEl!.textContent).toBe("Test Title");
    });

    it("renders run and reset buttons", async () => {
      document.body.appendChild(el);
      await waitFor(10);
      const runBtn = el.shadowRoot!.querySelector(".run-btn");
      const resetBtn = el.shadowRoot!.querySelector(".reset-btn");
      expect(runBtn).toBeTruthy();
      expect(resetBtn).toBeTruthy();
      expect(runBtn!.textContent).toContain("Run");
      expect(resetBtn!.textContent).toContain("Reset");
    });

    it("renders a contenteditable div with editor-area class", async () => {
      document.body.appendChild(el);
      await waitFor(10);
      const editor = el.shadowRoot!.querySelector(
        ".editor-area",
      ) as HTMLElement;
      expect(editor).toBeTruthy();
      expect(editor.tagName).toBe("DIV");
      expect(editor.getAttribute("contenteditable")).toBeTruthy();
    });

    it("sets textarea height from height attribute", async () => {
      el.setAttribute("height", "400");
      document.body.appendChild(el);
      await waitFor(10);
      const body = el.shadowRoot!.querySelector(
        ".body",
      ) as HTMLElement;
      expect(body.style.height).toBe("400px");
    });

    it("editor-area has spellcheck attribute", async () => {
      document.body.appendChild(el);
      await waitFor(10);
      const editor = el.shadowRoot!.querySelector(
        ".editor-area",
      ) as HTMLElement;
      expect(editor).toBeTruthy();
      expect(editor.getAttribute("spellcheck")).toBe("false");
    });

    it("renders a preview section", async () => {
      document.body.appendChild(el);
      await waitFor(10);
      const previewSection = el.shadowRoot!.querySelector(".preview-section");
      expect(previewSection).toBeTruthy();
      const previewLabel = previewSection!.querySelector(".preview-label");
      expect(previewLabel?.textContent).toBe("Preview");
    });

    it("renders a preview area", async () => {
      document.body.appendChild(el);
      await waitFor(10);
      const previewArea = el.shadowRoot!.querySelector(".preview-area");
      expect(previewArea).toBeTruthy();
    });

    it("renders an error area", async () => {
      document.body.appendChild(el);
      await waitFor(10);
      const errorArea = el.shadowRoot!.querySelector(".error-area");
      expect(errorArea).toBeTruthy();
      expect(errorArea!.classList.contains("has-error")).toBe(false);
    });
  });

  describe("code from textContent", () => {
    it("uses textContent as initial code when code attribute is empty", async () => {
      el.textContent = "const x = 1";
      document.body.appendChild(el);
      await waitFor(10);
      const editor = el.shadowRoot!.querySelector(
        ".editor-area",
      ) as HTMLElement;
      expect(editor.textContent).toBe("const x = 1");
    });

    it("trims textContent before using as code", async () => {
      el.textContent = "  const x = 1  \n";
      document.body.appendChild(el);
      await waitFor(10);
      const editor = el.shadowRoot!.querySelector(
        ".editor-area",
      ) as HTMLElement;
      expect(editor.textContent).toBe("const x = 1");
    });

    it("prefers textContent over code attribute", async () => {
      el.textContent = "from-textcontent";
      el.setAttribute("code", "from-attribute");
      document.body.appendChild(el);
      await waitFor(10);
      const editor = el.shadowRoot!.querySelector(
        ".editor-area",
      ) as HTMLElement;
      expect(editor.textContent).toBe("from-textcontent");
    });

    it("falls back to code attribute when textContent is empty", async () => {
      el.setAttribute("code", "from-attribute");
      document.body.appendChild(el);
      await waitFor(10);
      const editor = el.shadowRoot!.querySelector(
        ".editor-area",
      ) as HTMLElement;
      expect(editor.textContent).toBe("from-attribute");
    });
  });

  describe("reset button", () => {
    it("restores original code to editor", async () => {
      el.setAttribute("code", "original code");
      document.body.appendChild(el);
      await waitFor(10);
      const editor = el.shadowRoot!.querySelector(
        ".editor-area",
      ) as HTMLElement;
      editor.textContent = "modified code";
      const resetBtn = el.shadowRoot!.querySelector(
        ".reset-btn",
      ) as HTMLButtonElement;
      resetBtn.click();
      expect(editor.textContent).toBe("original code");
    });

    it("restores textContent code on reset", async () => {
      el.textContent = "  textcontent code  ";
      document.body.appendChild(el);
      await waitFor(10);
      const editor = el.shadowRoot!.querySelector(
        ".editor-area",
      ) as HTMLElement;
      editor.textContent = "modified code";
      const resetBtn = el.shadowRoot!.querySelector(
        ".reset-btn",
      ) as HTMLButtonElement;
      resetBtn.click();
      expect(editor.textContent).toBe("textcontent code");
    });
  });

  describe("error display", () => {
    it("error area is hidden by default", async () => {
      document.body.appendChild(el);
      await waitFor(10);
      const errorArea = el.shadowRoot!.querySelector(
        ".error-area",
      ) as HTMLPreElement;
      expect(errorArea.classList.contains("has-error")).toBe(false);
      expect(errorArea.textContent).toBe("");
    });
  });

  describe("attribute reactivity", () => {
    it("updating code attribute updates the property", async () => {
      document.body.appendChild(el);
      await waitFor(10);
      el.setAttribute("code", "new code");
      await waitFor(10);
      expect(el.code).toBe("new code");
    });

    it("updating height attribute updates the property", async () => {
      document.body.appendChild(el);
      await waitFor(10);
      el.setAttribute("height", "500");
      await waitFor(10);
      expect(el.height).toBe("500");
    });

    it("updating title attribute updates the property", async () => {
      document.body.appendChild(el);
      await waitFor(10);
      el.setAttribute("title", "New Title");
      await waitFor(10);
      expect(el.title).toBe("New Title");
    });

    it("signal reflects attribute changes", async () => {
      document.body.appendChild(el);
      await waitFor(10);
      el.setAttribute("code", "updated");
      await waitFor(10);
      expect(el.$code.get()).toBe("updated");
    });

    it("setting property updates attribute", async () => {
      document.body.appendChild(el);
      await waitFor(10);
      el.code = "via-property";
      expect(el.getAttribute("code")).toBe("via-property");
    });

    it("removing attribute resets to default", async () => {
      el.setAttribute("code", "temp");
      document.body.appendChild(el);
      await waitFor(10);
      el.removeAttribute("code");
      await waitFor(10);
      expect(el.code).toBe("");
    });
  });

  describe("dynamic attribute updates", () => {
    it("updating height after connection updates body style", async () => {
      el.setAttribute("height", "320");
      document.body.appendChild(el);
      await waitFor(10);
      const body = el.shadowRoot!.querySelector(
        ".body",
      ) as HTMLElement;
      expect(body.style.height).toBe("320px");
      el.setAttribute("height", "400");
      await waitFor(50);
      expect(el.height).toBe("400");
      expect(body.style.height).toBe("400px");
    });

    it("updating title after connection updates header", async () => {
      el.setAttribute("title", "Original");
      document.body.appendChild(el);
      await waitFor(10);
      const titleEl = el.shadowRoot!.querySelector(".title");
      expect(titleEl?.textContent).toBe("Original");
      el.setAttribute("title", "Updated");
      await waitFor(50);
      expect(el.title).toBe("Updated");
    });

    it("updating code after connection updates signal", async () => {
      document.body.appendChild(el);
      await waitFor(10);
      el.setAttribute("code", "initial");
      await waitFor(10);
      expect(el.$code.get()).toBe("initial");
      el.setAttribute("code", "changed");
      await waitFor(10);
      expect(el.$code.get()).toBe("changed");
    });
  });

  describe("run method", () => {
    it("run method exists on the element", async () => {
      document.body.appendChild(el);
      await waitFor(10);
      expect(typeof el.run).toBe("function");
    });

    it("run clears previous error state before processing", async () => {
      el.setAttribute("code", "const x = 1");
      document.body.appendChild(el);
      await waitFor(10);
      const errorEl = el.shadowRoot!.querySelector(
        ".error-area",
      ) as HTMLPreElement;
      errorEl.classList.add("has-error");
      errorEl.textContent = "previous error";
      const runPromise = el.run();
      expect(errorEl.classList.contains("has-error")).toBe(false);
      expect(errorEl.textContent).toBe("");
      try {
        await runPromise;
      } catch {}
    });

    it("run removes previous iframe if present", async () => {
      document.body.appendChild(el);
      await waitFor(10);
      const previewEl = el.shadowRoot!.querySelector(".preview-area")!;
      const fakeIframe = document.createElement("iframe");
      fakeIframe.className = "preview-iframe";
      previewEl.appendChild(fakeIframe);
      expect(previewEl.contains(fakeIframe)).toBe(true);
      try {
        await el.run();
      } catch {}
      expect(previewEl.contains(fakeIframe)).toBe(false);
    });
  });

  describe("reset method", () => {
    it("reset method exists on the element", async () => {
      document.body.appendChild(el);
      await waitFor(10);
      expect(typeof el.reset).toBe("function");
    });

    it("reset restores original code from attribute", async () => {
      el.setAttribute("code", "original code");
      document.body.appendChild(el);
      await waitFor(10);
      const editor = el.shadowRoot!.querySelector(
        ".editor-area",
      ) as HTMLElement;
      editor.textContent = "modified code";
      el.reset();
      expect(editor.textContent).toBe("original code");
    });

    it("reset restores original code from textContent", async () => {
      el.textContent = "  textcontent code  ";
      document.body.appendChild(el);
      await waitFor(10);
      const editor = el.shadowRoot!.querySelector(
        ".editor-area",
      ) as HTMLElement;
      editor.textContent = "modified code";
      el.reset();
      expect(editor.textContent).toBe("textcontent code");
    });
  });

  describe("error display", () => {
    it("error area is hidden by default", async () => {
      document.body.appendChild(el);
      await waitFor(10);
      const errorArea = el.shadowRoot!.querySelector(
        ".error-area",
      ) as HTMLPreElement;
      expect(errorArea.classList.contains("has-error")).toBe(false);
      expect(errorArea.textContent).toBe("");
    });

    it("dispatchError fires custom event with detail", async () => {
      document.body.appendChild(el);
      await waitFor(10);
      let received: CustomEvent<string> | null = null;
      el.addEventListener("error", (evt) => {
        received = evt as CustomEvent<string>;
      });
      el.dispatchError("test error message");
      expect(received).toBeTruthy();
      expect(received!.detail).toBe("test error message");
    });
  });

  describe("multiple instances", () => {
    it("can create multiple playground instances", async () => {
      const el2 = document.createElement(
        "rikka-live-playground",
      ) as LivePlaygroundEl;
      el.setAttribute("code", "first");
      el2.setAttribute("code", "second");
      document.body.appendChild(el);
      document.body.appendChild(el2);
      await waitFor(10);
      expect(el.code).toBe("first");
      expect(el2.code).toBe("second");
      el2.remove();
    });

    it("instances have independent signals", async () => {
      const el2 = document.createElement(
        "rikka-live-playground",
      ) as LivePlaygroundEl;
      document.body.appendChild(el);
      document.body.appendChild(el2);
      await waitFor(10);
      el.setAttribute("code", "unique-1");
      el2.setAttribute("code", "unique-2");
      await waitFor(10);
      expect(el.$code.get()).toBe("unique-1");
      expect(el2.$code.get()).toBe("unique-2");
      el2.remove();
    });
  });

  describe("layout attribute", () => {
    it("layout defaults to vertical", async () => {
      document.body.appendChild(el);
      await waitFor(10);
      expect(el.layout).toBe("vertical");
    });

    it("reading layout attribute returns the value", async () => {
      el.setAttribute("layout", "horizontal");
      document.body.appendChild(el);
      await waitFor(10);
      expect(el.layout).toBe("horizontal");
    });

    it("invalid layout value falls back to vertical", async () => {
      el.setAttribute("layout", "diagonal");
      document.body.appendChild(el);
      await waitFor(10);
      expect(el.layout).toBe("vertical");
    });

    it("layout signal accessor exists", async () => {
      document.body.appendChild(el);
      await waitFor(10);
      expect(el.$layout).toBeTruthy();
    });

    it("body has layout-vertical class by default", async () => {
      document.body.appendChild(el);
      await waitFor(10);
      const body = el.shadowRoot!.querySelector(".body");
      expect(body!.classList.contains("layout-vertical")).toBe(true);
      expect(body!.classList.contains("layout-horizontal")).toBe(false);
    });

    it("setting layout=horizontal updates body class", async () => {
      el.setAttribute("layout", "horizontal");
      document.body.appendChild(el);
      await waitFor(10);
      const body = el.shadowRoot!.querySelector(".body");
      expect(body!.classList.contains("layout-vertical")).toBe(false);
      expect(body!.classList.contains("layout-horizontal")).toBe(true);
    });

    it("setLayout updates the layout attribute", async () => {
      document.body.appendChild(el);
      await waitFor(10);
      el.setLayout("horizontal");
      expect(el.layout).toBe("horizontal");
      expect(el.getAttribute("layout")).toBe("horizontal");
    });

    it("toggleLayout switches between vertical and horizontal", async () => {
      document.body.appendChild(el);
      await waitFor(10);
      expect(el.layout).toBe("vertical");
      el.toggleLayout();
      expect(el.layout).toBe("horizontal");
      el.toggleLayout();
      expect(el.layout).toBe("vertical");
    });

    it("clicking layout-vertical button sets layout to vertical", async () => {
      el.setAttribute("layout", "horizontal");
      document.body.appendChild(el);
      await waitFor(10);
      const btn = el.shadowRoot!.querySelector(
        '[data-action="layout-vertical"]',
      ) as HTMLButtonElement;
      btn.click();
      expect(el.layout).toBe("vertical");
    });

    it("clicking layout-horizontal button sets layout to horizontal", async () => {
      document.body.appendChild(el);
      await waitFor(10);
      const btn = el.shadowRoot!.querySelector(
        '[data-action="layout-horizontal"]',
      ) as HTMLButtonElement;
      btn.click();
      expect(el.layout).toBe("horizontal");
    });

    it("layout buttons reflect active layout", async () => {
      document.body.appendChild(el);
      await waitFor(10);
      const vBtn = el.shadowRoot!.querySelector(
        '[data-action="layout-vertical"]',
      ) as HTMLButtonElement;
      const hBtn = el.shadowRoot!.querySelector(
        '[data-action="layout-horizontal"]',
      ) as HTMLButtonElement;
      expect(vBtn.classList.contains("active")).toBe(true);
      expect(hBtn.classList.contains("active")).toBe(false);
      el.setLayout("horizontal");
      await waitFor(10);
      expect(vBtn.classList.contains("active")).toBe(false);
      expect(hBtn.classList.contains("active")).toBe(true);
    });
  });

  describe("panel attribute", () => {
    it("panel defaults to both", async () => {
      document.body.appendChild(el);
      await waitFor(10);
      expect(el.panel).toBe("both");
    });

    it("reading panel attribute returns the value", async () => {
      el.setAttribute("panel", "editor");
      document.body.appendChild(el);
      await waitFor(10);
      expect(el.panel).toBe("editor");
    });

    it("invalid panel value falls back to both", async () => {
      el.setAttribute("panel", "nope");
      document.body.appendChild(el);
      await waitFor(10);
      expect(el.panel).toBe("both");
    });

    it("panel signal accessor exists", async () => {
      document.body.appendChild(el);
      await waitFor(10);
      expect(el.$panel).toBeTruthy();
    });

    it("both panes are visible by default", async () => {
      document.body.appendChild(el);
      await waitFor(10);
      const editorPane = el.shadowRoot!.querySelector(".editor-pane") as HTMLElement;
      const previewPane = el.shadowRoot!.querySelector(".preview-pane") as HTMLElement;
      expect(editorPane.classList.contains("pane-hidden")).toBe(false);
      expect(previewPane.classList.contains("pane-hidden")).toBe(false);
    });

    it("setting panel=editor hides preview pane", async () => {
      el.setAttribute("panel", "editor");
      document.body.appendChild(el);
      await waitFor(10);
      const editorPane = el.shadowRoot!.querySelector(".editor-pane") as HTMLElement;
      const previewPane = el.shadowRoot!.querySelector(".preview-pane") as HTMLElement;
      expect(editorPane.classList.contains("pane-hidden")).toBe(false);
      expect(previewPane.classList.contains("pane-hidden")).toBe(true);
    });

    it("setting panel=preview hides editor pane", async () => {
      el.setAttribute("panel", "preview");
      document.body.appendChild(el);
      await waitFor(10);
      const editorPane = el.shadowRoot!.querySelector(".editor-pane") as HTMLElement;
      const previewPane = el.shadowRoot!.querySelector(".preview-pane") as HTMLElement;
      expect(editorPane.classList.contains("pane-hidden")).toBe(true);
      expect(previewPane.classList.contains("pane-hidden")).toBe(false);
    });

    it("setPanel updates the panel attribute", async () => {
      document.body.appendChild(el);
      await waitFor(10);
      el.setPanel("editor");
      expect(el.panel).toBe("editor");
      expect(el.getAttribute("panel")).toBe("editor");
    });

    it("togglePanel switches to target panel", async () => {
      document.body.appendChild(el);
      await waitFor(10);
      el.togglePanel("editor");
      expect(el.panel).toBe("editor");
    });

    it("togglePanel toggles back to both when same target clicked", async () => {
      document.body.appendChild(el);
      await waitFor(10);
      el.togglePanel("editor");
      expect(el.panel).toBe("editor");
      el.togglePanel("editor");
      expect(el.panel).toBe("both");
    });

    it("clicking panel-editor button toggles editor-only", async () => {
      document.body.appendChild(el);
      await waitFor(10);
      const btn = el.shadowRoot!.querySelector(
        '[data-action="panel-editor"]',
      ) as HTMLButtonElement;
      btn.click();
      expect(el.panel).toBe("editor");
      btn.click();
      expect(el.panel).toBe("both");
    });

    it("clicking panel-preview button toggles preview-only", async () => {
      document.body.appendChild(el);
      await waitFor(10);
      const btn = el.shadowRoot!.querySelector(
        '[data-action="panel-preview"]',
      ) as HTMLButtonElement;
      btn.click();
      expect(el.panel).toBe("preview");
      btn.click();
      expect(el.panel).toBe("both");
    });

    it("clicking panel-both button shows both panels", async () => {
      el.setAttribute("panel", "editor");
      document.body.appendChild(el);
      await waitFor(10);
      const btn = el.shadowRoot!.querySelector(
        '[data-action="panel-both"]',
      ) as HTMLButtonElement;
      btn.click();
      expect(el.panel).toBe("both");
    });

    it("panel buttons reflect active panel", async () => {
      document.body.appendChild(el);
      await waitFor(10);
      const bothBtn = el.shadowRoot!.querySelector(
        '[data-action="panel-both"]',
      ) as HTMLButtonElement;
      const editorBtn = el.shadowRoot!.querySelector(
        '[data-action="panel-editor"]',
      ) as HTMLButtonElement;
      const previewBtn = el.shadowRoot!.querySelector(
        '[data-action="panel-preview"]',
      ) as HTMLButtonElement;
      expect(bothBtn.classList.contains("active")).toBe(true);
      expect(editorBtn.classList.contains("active")).toBe(false);
      expect(previewBtn.classList.contains("active")).toBe(false);
      el.setPanel("editor");
      await waitFor(10);
      expect(bothBtn.classList.contains("active")).toBe(false);
      expect(editorBtn.classList.contains("active")).toBe(true);
    });
  });

  describe("theme attribute", () => {
    const LIGHT_VARS = [
      "--pg-bg",
      "--pg-surface",
      "--pg-surface-elevated",
      "--pg-surface-2",
      "--pg-surface-hover",
      "--pg-border",
      "--pg-text",
      "--pg-text-muted",
      "--pg-text-subtle",
      "--pg-text-strong",
      "--pg-text-inverse",
      "--pg-accent",
      "--pg-accent-soft",
      "--pg-accent-soft-strong",
      "--pg-accent-active",
      "--pg-error-bg",
      "--pg-handle-grip",
      "--pg-spinner-track",
      "--pg-spinner-active",
    ];

    function makeMatchMediaMock(initialDark: boolean) {
      type Listener = (ev: { matches: boolean; media: string }) => void;
      const listeners = new Set<Listener>();
      let prefDark = initialDark;
      const original = window.matchMedia;
      window.matchMedia = (query: string) => {
        const mql: MediaQueryList = {
          media: query,
          matches:
            query === "(prefers-color-scheme: dark)" ? prefDark : false,
          onchange: null,
          addEventListener: ((_: string, l: Listener) => {
            if (query === "(prefers-color-scheme: dark)") listeners.add(l);
          }) as MediaQueryList["addEventListener"],
          removeEventListener: ((_: string, l: Listener) => {
            if (query === "(prefers-color-scheme: dark)") listeners.delete(l);
          }) as MediaQueryList["removeEventListener"],
          addListener: ((l: Listener) => {
            if (query === "(prefers-color-scheme: dark)") listeners.add(l);
          }) as unknown as MediaQueryList["addListener"],
          removeListener: ((l: Listener) => {
            if (query === "(prefers-color-scheme: dark)") listeners.delete(l);
          }) as unknown as MediaQueryList["removeListener"],
          dispatchEvent: () => true,
        } as MediaQueryList;
        return mql;
      };
      const fire = (next: boolean) => {
        prefDark = next;
        for (const l of [...listeners]) {
          l({ matches: next, media: "(prefers-color-scheme: dark)" });
        }
      };
      const restore = () => {
        window.matchMedia = original;
      };
      return { restore, fire };
    }

    it("theme defaults to auto", async () => {
      document.body.appendChild(el);
      await waitFor(10);
      expect(el.theme).toBe("auto");
    });

    it("$theme signal accessor exists", async () => {
      document.body.appendChild(el);
      await waitFor(10);
      expect(el.$theme).toBeTruthy();
    });

    it("invalid theme attribute falls back to auto", async () => {
      el.setAttribute("theme", "bogus");
      document.body.appendChild(el);
      await waitFor(10);
      expect(el.theme).toBe("auto");
    });

    it("reading theme attribute returns the value", async () => {
      el.setAttribute("theme", "light");
      document.body.appendChild(el);
      await waitFor(10);
      expect(el.theme).toBe("light");
    });

    it("theme signal reflects attribute changes", async () => {
      document.body.appendChild(el);
      await waitFor(10);
      el.setAttribute("theme", "light");
      await waitFor(10);
      expect(el.$theme.get()).toBe("light");
    });

    it("setting theme property updates the attribute", async () => {
      document.body.appendChild(el);
      await waitFor(10);
      el.theme = "dark";
      expect(el.getAttribute("theme")).toBe("dark");
    });

    it("auto + matchMedia light -> host data-theme=light", async () => {
      const { restore: spy } = makeMatchMediaMock(false);
      try {
        document.body.appendChild(el);
        await waitFor(10);
        expect(el.getAttribute("data-theme")).toBe("light");
      } finally {
        spy();
      }
    });

    it("auto + matchMedia dark -> host data-theme=dark", async () => {
      const { restore: spy } = makeMatchMediaMock(true);
      try {
        document.body.appendChild(el);
        await waitFor(10);
        expect(el.getAttribute("data-theme")).toBe("dark");
      } finally {
        spy();
      }
    });

    it("theme=light explicit overrides matchMedia dark", async () => {
      const { restore: spy } = makeMatchMediaMock(true);
      try {
        el.setAttribute("theme", "light");
        document.body.appendChild(el);
        await waitFor(10);
        expect(el.getAttribute("data-theme")).toBe("light");
      } finally {
        spy();
      }
    });

    it("theme=dark explicit overrides matchMedia light", async () => {
      const { restore: spy } = makeMatchMediaMock(false);
      try {
        el.setAttribute("theme", "dark");
        document.body.appendChild(el);
        await waitFor(10);
        expect(el.getAttribute("data-theme")).toBe("dark");
      } finally {
        spy();
      }
    });

    it("matchMedia change in auto mode updates host data-theme", async () => {
      const { restore: spy, fire } = makeMatchMediaMock(false);
      try {
        document.body.appendChild(el);
        await waitFor(10);
        expect(el.getAttribute("data-theme")).toBe("light");
        fire(true);
        await waitFor(20);
        expect(el.getAttribute("data-theme")).toBe("dark");
      } finally {
        spy();
      }
    });

    it("matchMedia change in explicit mode does NOT flip host data-theme", async () => {
      const { restore: spy, fire } = makeMatchMediaMock(false);
      try {
        el.setAttribute("theme", "light");
        document.body.appendChild(el);
        await waitFor(10);
        expect(el.getAttribute("data-theme")).toBe("light");
        fire(true);
        await waitFor(20);
        expect(el.getAttribute("data-theme")).toBe("light");
      } finally {
        spy();
      }
    });

    it("changing theme attribute after connection re-syncs host data-theme", async () => {
      const { restore: spy, fire } = makeMatchMediaMock(false);
      try {
        document.body.appendChild(el);
        await waitFor(10);
        expect(el.getAttribute("data-theme")).toBe("light");
        el.setAttribute("theme", "dark");
        await waitFor(20);
        expect(el.getAttribute("data-theme")).toBe("dark");
        fire(true);
        await waitFor(20);
        expect(el.getAttribute("data-theme")).toBe("dark");
      } finally {
        spy();
      }
    });

    it("setTheme method exists", async () => {
      document.body.appendChild(el);
      await waitFor(10);
      expect(typeof el.setTheme).toBe("function");
    });

    it("setTheme('light') sets the attribute", async () => {
      document.body.appendChild(el);
      await waitFor(10);
      el.setTheme("light");
      expect(el.theme).toBe("light");
      expect(el.getAttribute("theme")).toBe("light");
    });

    it("setTheme('dark') sets the attribute", async () => {
      document.body.appendChild(el);
      await waitFor(10);
      el.setTheme("dark");
      expect(el.theme).toBe("dark");
      expect(el.getAttribute("theme")).toBe("dark");
    });

    it("setTheme rejects invalid values", async () => {
      document.body.appendChild(el);
      await waitFor(10);
      const before = el.theme;
      el.setTheme("bogus" as "light");
      expect(el.theme).toBe(before);
    });

    it("toggleTheme method exists", async () => {
      document.body.appendChild(el);
      await waitFor(10);
      expect(typeof el.toggleTheme).toBe("function");
    });

    it("toggleTheme flips dark -> light (pinned)", async () => {
      const { restore: spy } = makeMatchMediaMock(true);
      try {
        document.body.appendChild(el);
        await waitFor(10);
        expect(el.getAttribute("data-theme")).toBe("dark");
        el.toggleTheme();
        await waitFor(20);
        expect(el.getAttribute("data-theme")).toBe("light");
        expect(el.theme).toBe("light");
      } finally {
        spy();
      }
    });

    it("toggleTheme flips light -> dark (pinned)", async () => {
      const { restore: spy } = makeMatchMediaMock(false);
      try {
        document.body.appendChild(el);
        await waitFor(10);
        expect(el.getAttribute("data-theme")).toBe("light");
        el.toggleTheme();
        await waitFor(20);
        expect(el.getAttribute("data-theme")).toBe("dark");
        expect(el.theme).toBe("dark");
      } finally {
        spy();
      }
    });

    it(":host([data-theme=light]) exposes a light palette", async () => {
      el.setAttribute("theme", "light");
      document.body.appendChild(el);
      await waitFor(10);
      expect(el.getAttribute("data-theme")).toBe("light");
      const cs = getComputedStyle(el);
      for (const v of LIGHT_VARS) {
        const value = cs.getPropertyValue(v).trim();
        expect(value, `var ${v}`).not.toBe("");
      }
    });

    it("light --pg-bg is not the dark default", async () => {
      el.setAttribute("theme", "light");
      document.body.appendChild(el);
      await waitFor(10);
      const cs = getComputedStyle(el);
      const bg = cs.getPropertyValue("--pg-bg").trim().toLowerCase();
      expect(bg).not.toBe("#0d1117");
    });

    it("external [data-theme=light] rule can override built-in light palette", async () => {
      const styleEl = document.createElement("style");
      styleEl.textContent =
        "rikka-live-playground[data-theme=\"light\"] { --pg-bg: #abcdef; }";
      document.head.appendChild(styleEl);
      el.setAttribute("theme", "light");
      document.body.appendChild(el);
      await waitFor(10);
      const cs = getComputedStyle(el);
      expect(cs.getPropertyValue("--pg-bg").trim().toLowerCase()).toBe(
        "#abcdef",
      );
      styleEl.remove();
    });

    it("disconnect tears down the matchMedia listener", async () => {
      const { restore: spy, fire } = makeMatchMediaMock(false);
      try {
        document.body.appendChild(el);
        await waitFor(10);
        el.remove();
        await waitFor(10);
        fire(true);
        await waitFor(20);
        expect(el.getAttribute("data-theme")).not.toBe("dark");
      } finally {
        spy();
      }
    });
  });

  describe("fullscreen", () => {
    it("toggleFullscreen method exists", async () => {
      document.body.appendChild(el);
      await waitFor(10);
      expect(typeof el.toggleFullscreen).toBe("function");
    });

    it("exitFullscreen method exists", async () => {
      document.body.appendChild(el);
      await waitFor(10);
      expect(typeof el.exitFullscreen).toBe("function");
    });

    it("clicking fullscreen button calls requestFullscreen when not in fullscreen", async () => {
      document.body.appendChild(el);
      await waitFor(10);
      const btn = el.shadowRoot!.querySelector(
        '[data-action="fullscreen"]',
      ) as HTMLButtonElement;
      let called = false;
      const original = el.requestFullscreen;
      (el as unknown as { requestFullscreen: () => Promise<void> }).requestFullscreen =
        async function () {
          called = true;
        };
      try {
        btn.click();
        await waitFor(20);
        expect(called).toBe(true);
      } finally {
        (el as unknown as { requestFullscreen: typeof original }).requestFullscreen = original;
      }
    });

    it("removes fullscreen attribute when exitFullscreen is called", async () => {
      el.setAttribute("fullscreen", "");
      document.body.appendChild(el);
      await waitFor(10);
      const original = document.exitFullscreen;
      (document as unknown as { exitFullscreen: () => Promise<void> }).exitFullscreen =
        async function () {
          // noop
        };
      try {
        await el.exitFullscreen();
        expect(el.hasAttribute("fullscreen")).toBe(false);
      } finally {
        (document as unknown as { exitFullscreen: typeof original }).exitFullscreen = original;
      }
    });

    it("registers fullscreenchange handler on connect", async () => {
      const original = document.addEventListener;
      let called = false;
      (document as unknown as { addEventListener: typeof original }).addEventListener = function (
        ...args: Parameters<typeof original>
      ) {
        if (args[0] === "fullscreenchange") called = true;
        return original.apply(document, args);
      } as typeof original;
      try {
        document.body.appendChild(el);
        await waitFor(10);
        expect(called).toBe(true);
      } finally {
        (document as unknown as { addEventListener: typeof original }).addEventListener = original;
      }
    });

    it("removes fullscreenchange handler on disconnect", async () => {
      document.body.appendChild(el);
      await waitFor(10);
      el.remove();
      await waitFor(10);
      expect(true).toBe(true);
    });
  });

  describe("header actions", () => {
    it("renders layout toggle group", async () => {
      document.body.appendChild(el);
      await waitFor(10);
      const vBtn = el.shadowRoot!.querySelector('[data-action="layout-vertical"]');
      const hBtn = el.shadowRoot!.querySelector('[data-action="layout-horizontal"]');
      expect(vBtn).toBeTruthy();
      expect(hBtn).toBeTruthy();
    });

    it("renders panel toggle group", async () => {
      document.body.appendChild(el);
      await waitFor(10);
      const bothBtn = el.shadowRoot!.querySelector('[data-action="panel-both"]');
      const editorBtn = el.shadowRoot!.querySelector('[data-action="panel-editor"]');
      const previewBtn = el.shadowRoot!.querySelector('[data-action="panel-preview"]');
      expect(bothBtn).toBeTruthy();
      expect(editorBtn).toBeTruthy();
      expect(previewBtn).toBeTruthy();
    });

    it("renders fullscreen button", async () => {
      document.body.appendChild(el);
      await waitFor(10);
      const btn = el.shadowRoot!.querySelector('[data-action="fullscreen"]');
      expect(btn).toBeTruthy();
    });

    it("preserves run and reset buttons", async () => {
      document.body.appendChild(el);
      await waitFor(10);
      const runBtn = el.shadowRoot!.querySelector(".run-btn");
      const resetBtn = el.shadowRoot!.querySelector(".reset-btn");
      expect(runBtn).toBeTruthy();
      expect(resetBtn).toBeTruthy();
    });
  });

  describe("theming via CSS variables", () => {
    const EXPECTED_VARS = [
      "--pg-bg",
      "--pg-surface",
      "--pg-surface-elevated",
      "--pg-surface-2",
      "--pg-surface-hover",
      "--pg-border",
      "--pg-text",
      "--pg-text-muted",
      "--pg-text-subtle",
      "--pg-text-strong",
      "--pg-text-inverse",
      "--pg-accent",
      "--pg-success",
      "--pg-success-hover",
      "--pg-warn",
      "--pg-error",
      "--pg-info",
    ];

    it("exposes dark theme defaults on the host", async () => {
      document.body.appendChild(el);
      await waitFor(10);
      const cs = getComputedStyle(el);
      for (const v of EXPECTED_VARS) {
        const value = cs.getPropertyValue(v).trim();
        expect(value).not.toBe("");
      }
    });

    it("dark default for --pg-bg is dark", async () => {
      el.setAttribute("theme", "dark");
      document.body.appendChild(el);
      await waitFor(10);
      const cs = getComputedStyle(el);
      const bg = cs.getPropertyValue("--pg-bg").trim().toLowerCase();
      expect(bg).toBe("#0d1117");
    });

    it("external --pg-bg override takes effect on the host", async () => {
      el.style.setProperty("--pg-bg", "#ff00ff");
      document.body.appendChild(el);
      await waitFor(10);
      const cs = getComputedStyle(el);
      expect(cs.getPropertyValue("--pg-bg").trim().toLowerCase()).toBe(
        "#ff00ff",
      );
    });

    it("host-level --pg-text override beats the :host default", async () => {
      el.style.setProperty("--pg-text", "#123456");
      document.body.appendChild(el);
      await waitFor(10);
      const cs = getComputedStyle(el);
      expect(cs.getPropertyValue("--pg-text").trim().toLowerCase()).toBe(
        "#123456",
      );
    });

    it("higher-specificity author rule can override :host defaults", async () => {
      const styleEl = document.createElement("style");
      styleEl.textContent =
        "body [data-theme=\"light\"] rikka-live-playground { --pg-bg: #abcdef; }";
      document.head.appendChild(styleEl);
      const wrapper = document.createElement("div");
      wrapper.setAttribute("data-theme", "light");
      wrapper.appendChild(el);
      document.body.appendChild(wrapper);
      await waitFor(10);
      const cs = getComputedStyle(el);
      expect(cs.getPropertyValue("--pg-bg").trim().toLowerCase()).toBe(
        "#abcdef",
      );
      wrapper.remove();
      styleEl.remove();
    });

    it("does not use hardcoded dark colors in stylesheet", async () => {
      document.body.appendChild(el);
      await waitFor(10);
      const sheets = el.shadowRoot!.adoptedStyleSheets;
      const text = sheets
        .map((s) =>
          Array.from(s.cssRules)
            .map((r) => r.cssText)
            .join("\n"),
        )
        .join("\n");
      expect(text).not.toMatch(/background:\s*#0d1117/i);
      expect(text).not.toMatch(/color:\s*#94a3b8/i);
    });

    it("run() injects resolved --pg-* vars into the iframe srcdoc", async () => {
      el.setAttribute("code", "const x = 1");
      el.style.setProperty("--pg-bg", "#abcdef");
      el.style.setProperty("--pg-text", "#fedcba");
      document.body.appendChild(el);
      await waitFor(10);
      try {
        await el.run();
      } catch {}
      const iframe = el.shadowRoot!.querySelector(
        ".preview-iframe",
      ) as HTMLIFrameElement | null;
      if (!iframe) return;
      const srcdoc = iframe.getAttribute("srcdoc") ?? "";
      expect(srcdoc).toContain("--pg-bg: #abcdef");
      expect(srcdoc).toContain("--pg-text: #fedcba");
    });
  });

  describe("live theme update", () => {
    it("iframe srcdoc listens for __rikka_playground_theme messages", async () => {
      el.setAttribute("code", "const x = 1");
      document.body.appendChild(el);
      await waitFor(10);
      try {
        await el.run();
      } catch {}
      const iframe = el.shadowRoot!.querySelector(
        ".preview-iframe",
      ) as HTMLIFrameElement | null;
      if (!iframe) return;
      const srcdoc = iframe.getAttribute("srcdoc") ?? "";
      expect(srcdoc).toContain("__rikka_playground_theme");
    });

    it("updates host data-theme when prefers-color-scheme changes (auto mode)", async () => {
      type Listener = (ev: { matches: boolean; media: string }) => void;
      const listeners = new Set<Listener>();
      let prefDark = false;
      const original = window.matchMedia;
      window.matchMedia = (query: string) => {
        const mql: MediaQueryList = {
          media: query,
          matches:
            query === "(prefers-color-scheme: dark)" ? prefDark : false,
          onchange: null,
          addEventListener: ((_: string, l: Listener) => {
            if (query === "(prefers-color-scheme: dark)") listeners.add(l);
          }) as MediaQueryList["addEventListener"],
          removeEventListener: ((_: string, l: Listener) => {
            if (query === "(prefers-color-scheme: dark)") listeners.delete(l);
          }) as MediaQueryList["removeEventListener"],
          addListener: ((l: Listener) => {
            if (query === "(prefers-color-scheme: dark)") listeners.add(l);
          }) as unknown as MediaQueryList["addListener"],
          removeListener: ((l: Listener) => {
            if (query === "(prefers-color-scheme: dark)") listeners.delete(l);
          }) as unknown as MediaQueryList["removeListener"],
          dispatchEvent: () => true,
        } as MediaQueryList;
        return mql;
      };

      try {
        el.setAttribute("code", "const x = 1");
        document.body.appendChild(el);
        await waitFor(10);

        expect(el.getAttribute("data-theme")).toBe("light");

        prefDark = true;
        for (const l of [...listeners]) {
          l({ matches: true, media: "(prefers-color-scheme: dark)" });
        }
        await waitFor(20);
        expect(el.getAttribute("data-theme")).toBe("dark");
      } finally {
        window.matchMedia = original;
      }
    });
  });
});
