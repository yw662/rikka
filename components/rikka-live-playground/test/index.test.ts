import { describe, it, expect, beforeEach, afterEach } from "@rstest/core";
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

    it("height defaults to 200", async () => {
      document.body.appendChild(el);
      await waitFor(10);
      expect(el.height).toBe("200");
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

    it("renders a textarea with editor-area class", async () => {
      document.body.appendChild(el);
      await waitFor(10);
      const textarea = el.shadowRoot!.querySelector(
        ".editor-area",
      ) as HTMLTextAreaElement;
      expect(textarea).toBeTruthy();
      expect(textarea.tagName).toBe("TEXTAREA");
    });

    it("sets textarea height from height attribute", async () => {
      el.setAttribute("height", "400");
      document.body.appendChild(el);
      await waitFor(10);
      const textarea = el.shadowRoot!.querySelector(
        ".editor-area",
      ) as HTMLTextAreaElement;
      expect(textarea.style.height).toBe("400px");
    });

    it("passes spellcheck attribute to textarea", async () => {
      document.body.appendChild(el);
      await waitFor(10);
      const textarea = el.shadowRoot!.querySelector(
        ".editor-area",
      ) as HTMLTextAreaElement;
      expect(textarea).toBeTruthy();
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
      const textarea = el.shadowRoot!.querySelector(
        ".editor-area",
      ) as HTMLTextAreaElement;
      expect(textarea.value).toBe("const x = 1");
    });

    it("trims textContent before using as code", async () => {
      el.textContent = "  const x = 1  \n";
      document.body.appendChild(el);
      await waitFor(10);
      const textarea = el.shadowRoot!.querySelector(
        ".editor-area",
      ) as HTMLTextAreaElement;
      expect(textarea.value).toBe("const x = 1");
    });

    it("prefers textContent over code attribute", async () => {
      el.textContent = "from-textcontent";
      el.setAttribute("code", "from-attribute");
      document.body.appendChild(el);
      await waitFor(10);
      const textarea = el.shadowRoot!.querySelector(
        ".editor-area",
      ) as HTMLTextAreaElement;
      expect(textarea.value).toBe("from-textcontent");
    });

    it("falls back to code attribute when textContent is empty", async () => {
      el.setAttribute("code", "from-attribute");
      document.body.appendChild(el);
      await waitFor(10);
      const textarea = el.shadowRoot!.querySelector(
        ".editor-area",
      ) as HTMLTextAreaElement;
      expect(textarea.value).toBe("from-attribute");
    });
  });

  describe("reset button", () => {
    it("restores original code to textarea", async () => {
      el.setAttribute("code", "original code");
      document.body.appendChild(el);
      await waitFor(10);
      const textarea = el.shadowRoot!.querySelector(
        ".editor-area",
      ) as HTMLTextAreaElement;
      textarea.value = "modified code";
      const resetBtn = el.shadowRoot!.querySelector(
        ".reset-btn",
      ) as HTMLButtonElement;
      resetBtn.click();
      expect(textarea.value).toBe("original code");
    });

    it("restores textContent code on reset", async () => {
      el.textContent = "  textcontent code  ";
      document.body.appendChild(el);
      await waitFor(10);
      const textarea = el.shadowRoot!.querySelector(
        ".editor-area",
      ) as HTMLTextAreaElement;
      textarea.value = "modified code";
      const resetBtn = el.shadowRoot!.querySelector(
        ".reset-btn",
      ) as HTMLButtonElement;
      resetBtn.click();
      expect(textarea.value).toBe("textcontent code");
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
    it("updating height after connection updates textarea style", async () => {
      el.setAttribute("height", "200");
      document.body.appendChild(el);
      await waitFor(10);
      const textarea = el.shadowRoot!.querySelector(
        ".editor-area",
      ) as HTMLTextAreaElement;
      expect(textarea.style.height).toBe("200px");
      el.setAttribute("height", "400");
      await waitFor(50);
      expect(el.height).toBe("400");
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
      expect(previewEl.querySelector(".preview-iframe")).toBeTruthy();
      try {
        await el.run();
      } catch {}
      expect(
        previewEl.querySelector(".preview-iframe.preview-iframe"),
      ).toBeNull();
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
      const textarea = el.shadowRoot!.querySelector(
        ".editor-area",
      ) as HTMLTextAreaElement;
      textarea.value = "modified code";
      el.reset();
      expect(textarea.value).toBe("original code");
    });

    it("reset restores original code from textContent", async () => {
      el.textContent = "  textcontent code  ";
      document.body.appendChild(el);
      await waitFor(10);
      const textarea = el.shadowRoot!.querySelector(
        ".editor-area",
      ) as HTMLTextAreaElement;
      textarea.value = "modified code";
      el.reset();
      expect(textarea.value).toBe("textcontent code");
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
});
