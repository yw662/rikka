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
  unregisterTool(name: string): void;
  listTools(): ModelContextTool[];
  callTool(name: string, input?: object): Promise<unknown>;
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

/**
 * Minimal type declarations for @mlc-ai/web-llm (WebLLM).
 * We only need a subset of the API surface; the full types ship
 * with the package but are re-declared here so the TypeScript
 * compiler can validate usage without resolving node_modules.
 */
declare module "@mlc-ai/web-llm" {
  export interface InitProgressReport {
    progress: number;
    timeElapsed: number;
    text: string;
  }

  export interface MLCEngineConfig {
    model_list?: Array<{
      model: string;
      model_id: string;
      model_lib?: string;
      [key: string]: any;
    }>;
    [key: string]: any;
  }

  export interface ChatOptions {
    temperature?: number;
    top_p?: number;
    max_tokens?: number;
    system?: string;
    [key: string]: any;
  }

  export interface ChatMessageParam {
    role: "system" | "user" | "assistant";
    content: string;
  }

  export interface ChatCompletionResponse {
    choices: Array<{ message: { content: string } }>;
  }

  export interface ChatCompletions {
    create(params: {
      messages: ChatMessageParam[];
      stream?: boolean;
      temperature?: number;
      max_tokens?: number;
    }): Promise<ChatCompletionResponse>;
  }

  export interface ChatNamespace {
    completions: ChatCompletions;
  }

  export interface MLCEngine {
    chat: ChatNamespace;
    setInitProgressCallback(callback: (report: InitProgressReport) => void): void;
    reload(
      modelId: string,
      chatOpts?: ChatOptions,
      appConfig?: MLCEngineConfig,
    ): Promise<void>;
    unload(): Promise<void>;
  }

  export const MLCEngine: new () => MLCEngine;

  export const prebuiltAppConfig: MLCEngineConfig & {
    model_list: Array<{
      model: string;
      model_id: string;
      model_lib?: string;
      [key: string]: any;
    }>;
  };
}
