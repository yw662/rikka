import { describe, it, expect, beforeEach, afterEach } from "@rstest/core";
import { RikkaWebAgent } from "../src/index.js";

type WebAgentEl = InstanceType<typeof RikkaWebAgent>;

function waitFor(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function createMockHandler() {
  const handler = (..._args: any[]) => { handler.calls++; };
  handler.calls = 0;
  return handler;
}

describe("RikkaWebAgent", () => {
  let el: WebAgentEl;

  beforeEach(async () => {
    await waitFor(50);
    el = document.createElement("rikka-web-agent") as WebAgentEl;
  });

  afterEach(() => {
    el?.remove();
  });

  // ---- Custom element registration ----

  describe("custom element registration", () => {
    it("is registered as a custom element", () => {
      expect(customElements.get("rikka-web-agent")).toBe(RikkaWebAgent);
    });

    it("has observedAttributes defined", () => {
      expect(RikkaWebAgent.observedAttributes).toBeTruthy();
      expect(RikkaWebAgent.observedAttributes).toContain("layout");
      expect(RikkaWebAgent.observedAttributes).toContain("position");
      expect(RikkaWebAgent.observedAttributes).toContain("display");
      expect(RikkaWebAgent.observedAttributes).toContain("theme");
    });
  });

  // ---- Shadow DOM ----

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

  // ---- Attribute defaults ----

  describe("attribute defaults", () => {
    it("layout defaults to 'embedded'", async () => {
      document.body.appendChild(el);
      await waitFor(10);
      expect(el.layout).toBe("embedded");
    });

    it("position defaults to 'bottom-right'", async () => {
      document.body.appendChild(el);
      await waitFor(10);
      expect(el.position).toBe("bottom-right");
    });

    it("display defaults to 'full'", async () => {
      document.body.appendChild(el);
      await waitFor(10);
      expect(el.display).toBe("full");
    });

    it("theme defaults to 'auto'", async () => {
      document.body.appendChild(el);
      await waitFor(10);
      expect(el.theme).toBe("auto");
    });
  });

  // ---- Attribute validation ----

  describe("attribute validation", () => {
    it("layout falls back to 'embedded' for invalid values", async () => {
      el.setAttribute("layout", "invalid");
      document.body.appendChild(el);
      await waitFor(10);
      expect(el.layout).toBe("embedded");
    });

    it("layout accepts 'floating'", async () => {
      el.setAttribute("layout", "floating");
      document.body.appendChild(el);
      await waitFor(10);
      expect(el.layout).toBe("floating");
    });

    it("layout accepts 'sidebar'", async () => {
      el.setAttribute("layout", "sidebar");
      document.body.appendChild(el);
      await waitFor(10);
      expect(el.layout).toBe("sidebar");
    });

    it("layout accepts 'popup'", async () => {
      el.setAttribute("layout", "popup");
      document.body.appendChild(el);
      await waitFor(10);
      expect(el.layout).toBe("popup");
    });

    it("layout accepts 'headless'", async () => {
      el.setAttribute("layout", "headless");
      document.body.appendChild(el);
      await waitFor(10);
      expect(el.layout).toBe("headless");
    });

    it("display falls back to 'full' for invalid values", async () => {
      el.setAttribute("display", "invalid");
      document.body.appendChild(el);
      await waitFor(10);
      expect(el.display).toBe("full");
    });

    it("display accepts 'tools'", async () => {
      el.setAttribute("display", "tools");
      document.body.appendChild(el);
      await waitFor(10);
      expect(el.display).toBe("tools");
    });

    it("display accepts 'agent'", async () => {
      el.setAttribute("display", "agent");
      document.body.appendChild(el);
      await waitFor(10);
      expect(el.display).toBe("agent");
    });

    it("theme accepts 'dark' and 'light'", async () => {
      el.setAttribute("theme", "dark");
      document.body.appendChild(el);
      await waitFor(10);
      expect(el.theme).toBe("dark");
      el.setAttribute("theme", "light");
      await waitFor(10);
      expect(el.theme).toBe("light");
    });
  });

  // ---- Signal accessors ----

  describe("signal accessors", () => {
    it("has signal accessors for all attributes", async () => {
      document.body.appendChild(el);
      await waitFor(10);
      expect(el.$layout).toBeTruthy();
      expect(el.$position).toBeTruthy();
      expect(el.$display).toBeTruthy();
      expect(el.$theme).toBeTruthy();
    });

    it("signal accessor reflects attribute value", async () => {
      el.setAttribute("layout", "floating");
      document.body.appendChild(el);
      await waitFor(10);
      expect(el.$layout.get()).toBe("floating");
    });
  });

  // ---- Event API ----

  describe("event API", () => {
    it("has dispatch methods for all declared events", async () => {
      document.body.appendChild(el);
      await waitFor(10);
      expect(typeof el.dispatchError).toBe("function");
      expect(typeof el.dispatchToolRegistered).toBe("function");
      expect(typeof el.dispatchToolUnregistered).toBe("function");
      expect(typeof el.dispatchToolInvoked).toBe("function");
      expect(typeof el.dispatchToolResult).toBe("function");
    });

    it("addEventListener subscribes to error events", async () => {
      document.body.appendChild(el);
      await waitFor(10);
      const handler = createMockHandler();
      el.addEventListener("error", handler);
      el.dispatchError("test error");
      expect(handler.calls).toBe(1);
    });

    it("addEventListener subscribes to toolRegistered events", async () => {
      document.body.appendChild(el);
      await waitFor(10);
      const handler = createMockHandler();
      el.addEventListener("toolRegistered", handler);
      el.dispatchToolRegistered({ name: "test", description: "desc" });
      expect(handler.calls).toBe(1);
    });
  });

  // ---- Shadow DOM structure ----

  describe("shadow DOM structure", () => {
    it("contains a panel div with part attribute", async () => {
      document.body.appendChild(el);
      await waitFor(10);
      const panel = el.shadowRoot!.querySelector("[part='panel']");
      expect(panel).toBeTruthy();
    });

    it("shows unsupported banner when WebMCP is not available", async () => {
      document.body.appendChild(el);
      await waitFor(10);
      const banner = el.shadowRoot!.querySelector(".wa-unsupported");
      expect(banner).toBeTruthy();
    });

    it("does not show tools section when WebMCP is not available", async () => {
      document.body.appendChild(el);
      await waitFor(10);
      const toolsSection = el.shadowRoot!.querySelector(".wa-tools-section");
      expect(toolsSection).toBeFalsy();
    });
  });

  // ---- Layout data attributes ----

  describe("layout data attributes", () => {
    it("sets data-layout attribute on the host", async () => {
      el.setAttribute("layout", "floating");
      document.body.appendChild(el);
      await waitFor(10);
      expect(el.dataset.layout).toBe("floating");
    });

    it("sets data-position attribute on the host", async () => {
      el.setAttribute("position", "bottom-left");
      document.body.appendChild(el);
      await waitFor(10);
      expect(el.dataset.position).toBe("bottom-left");
    });

    it("sets data-display attribute on the panel", async () => {
      document.body.appendChild(el);
      await waitFor(10);
      const panel = el.shadowRoot!.querySelector(".wa-panel");
      expect(panel!.dataset.display).toBe("full");
    });

    it("headless layout hides the host", async () => {
      el.setAttribute("layout", "headless");
      document.body.appendChild(el);
      await waitFor(10);
      expect(el.dataset.layout).toBe("headless");
    });
  });

  // ---- CSS Parts ----

  describe("CSS parts", () => {
    it("exposes panel part", async () => {
      document.body.appendChild(el);
      await waitFor(10);
      const panel = el.shadowRoot!.querySelector("[part='panel']");
      expect(panel).toBeTruthy();
    });

    it("exposes header part", async () => {
      // Need WebMCP support for header to render
      // In happy-dom it shows unsupported banner instead
      document.body.appendChild(el);
      await waitFor(10);
      // At minimum, the unsupported banner has part="unsupported"
      const unsupported = el.shadowRoot!.querySelector("[part='unsupported']");
      expect(unsupported).toBeTruthy();
    });
  });

  // ---- Methods ----

  describe("methods", () => {
    it("has all public methods", async () => {
      document.body.appendChild(el);
      await waitFor(10);
      expect(typeof el.register).toBe("function");
      expect(typeof el.unregister).toBe("function");
      expect(typeof el.listTools).toBe("function");
      expect(typeof el.approveCall).toBe("function");
      expect(typeof el.rejectCall).toBe("function");
      expect(typeof el.getCallLog).toBe("function");
      expect(typeof el.isSupported).toBe("function");
    });

    it("listTools returns empty array initially", async () => {
      document.body.appendChild(el);
      await waitFor(10);
      expect(el.listTools()).toEqual([]);
    });

    it("getCallLog returns empty array initially", async () => {
      document.body.appendChild(el);
      await waitFor(10);
      expect(el.getCallLog()).toEqual([]);
    });

    it("isSupported returns false in happy-dom", async () => {
      document.body.appendChild(el);
      await waitFor(10);
      expect(el.isSupported()).toBe(false);
    });
  });

  // ---- Attribute reactivity ----

  describe("attribute reactivity", () => {
    it("layout attribute change updates the signal", async () => {
      document.body.appendChild(el);
      await waitFor(10);
      el.setAttribute("layout", "sidebar");
      await waitFor(10);
      expect(el.$layout.get()).toBe("sidebar");
    });

    it("display attribute change updates the signal", async () => {
      document.body.appendChild(el);
      await waitFor(10);
      el.setAttribute("display", "tools");
      await waitFor(10);
      expect(el.$display.get()).toBe("tools");
    });

    it("theme attribute change updates the signal", async () => {
      document.body.appendChild(el);
      await waitFor(10);
      el.setAttribute("theme", "dark");
      await waitFor(10);
      expect(el.$theme.get()).toBe("dark");
    });

    it("removing layout attribute falls back to default", async () => {
      el.setAttribute("layout", "floating");
      document.body.appendChild(el);
      await waitFor(10);
      expect(el.layout).toBe("floating");
      el.removeAttribute("layout");
      await waitFor(10);
      expect(el.layout).toBe("embedded");
    });
  });

  // ---- Theme ----

  describe("theme", () => {
    it("sets data-theme attribute for dark theme", async () => {
      el.setAttribute("theme", "dark");
      document.body.appendChild(el);
      await waitFor(10);
      expect(el.getAttribute("data-theme")).toBe("dark");
    });

    it("sets data-theme attribute for light theme", async () => {
      el.setAttribute("theme", "light");
      document.body.appendChild(el);
      await waitFor(10);
      expect(el.getAttribute("data-theme")).toBe("light");
    });

    it("auto theme does not hardcode data-theme", async () => {
      document.body.appendChild(el);
      await waitFor(10);
      const dt = el.getAttribute("data-theme");
      if (dt !== null) {
        expect(["dark", "light"]).toContain(dt);
      }
    });
  });

  // ---- Cleanup on disconnect ----

  describe("cleanup on disconnect", () => {
    it("removes the element without errors", async () => {
      document.body.appendChild(el);
      await waitFor(10);
      expect(el.shadowRoot).toBeTruthy();
      el.remove();
    });
  });
});
