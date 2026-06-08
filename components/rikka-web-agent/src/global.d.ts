/**
 * Type declarations for the Web Model Context Protocol (WebMCP) browser API.
 *
 * Based on the W3C Web Machine Learning Community Group Draft:
 * https://webmachinelearning.github.io/webmcp/
 *
 * WebMCP is currently available in Chrome 146+ behind a feature flag.
 * These types allow the component to compile without the actual API present.
 */

interface ToolAnnotations {
  readOnlyHint?: boolean;
  untrustedContentHint?: boolean;
}

interface ModelContextClient {
  /** Elicit user input from the agent side (e.g. ask for clarification). */
  elicit?: (options: ElicitRequest) => Promise<ElicitResult>;
}

interface ElicitRequest {
  message: string;
  type?: "text" | "confirmation";
}

interface ElicitResult {
  action: "accept" | "decline" | "cancel";
  content?: string;
}

interface ModelContextTool {
  name: string;
  title?: string;
  description: string;
  inputSchema?: object;
  execute: (input: object, client: ModelContextClient) => Promise<unknown>;
  annotations?: ToolAnnotations;
}

interface ModelContextRegisterToolOptions {
  signal?: AbortSignal;
  exposedTo?: string[];
}

interface ModelContext extends EventTarget {
  registerTool(
    tool: ModelContextTool,
    options?: ModelContextRegisterToolOptions,
  ): void;
  ontoolchange: ((this: ModelContext, ev: Event) => void) | null;
  addEventListener(
    type: "toolchange",
    listener: (this: ModelContext, ev: Event) => void,
    options?: boolean | AddEventListenerOptions,
  ): void;
  removeEventListener(
    type: "toolchange",
    listener: (this: ModelContext, ev: Event) => void,
    options?: boolean | EventListenerOptions,
  ): void;
}

interface Document {
  readonly modelContext: ModelContext;
}

interface Navigator {
  /** @deprecated Use document.modelContext instead (WebMCP spec May 2026). */
  readonly modelContext: ModelContext;
}

/**
 * Type declaration for @mcp-b/webmcp-polyfill.
 */
declare module "@mcp-b/webmcp-polyfill" {
  export function initializeWebMCPPolyfill(): void;
}
