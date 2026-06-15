/// <reference path="./global.d.ts" />
import {
  defineElement,
  css,
  event,
  type ElementConstructor,
} from "@takanashi/rikka-elements";
import { div, button, span, pre, input, label, select, option, Show, When, For } from "@takanashi/rikka-dom";
import { signal, computed, effect } from "@takanashi/rikka-signal";
import { initializeWebMCPPolyfill } from "@mcp-b/webmcp-polyfill";

// WebLLM is not imported at the top level. It is loaded on demand via
// dynamic import when a user explicitly chooses the "webllm" access mode.
// This keeps the component's initial bundle small and prevents the page
// from blocking on the (large) @mlc-ai/web-llm module graph.

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A tool definition that can be registered with WebMCP manually. */
export interface ToolDefinition {
  name: string;
  title?: string;
  description: string;
  inputSchema?: object;
  execute: (input: object, client: ModelContextClient) => Promise<unknown>;
  readOnlyHint?: boolean;
  untrustedContentHint?: boolean;
  exposedTo?: string[];
  requireConfirmation?: boolean;
}

export interface ToolInfo {
  name: string;
  title: string | null;
  description: string;
  inputSchema: object | null;
  readOnlyHint: boolean;
  untrustedContentHint: boolean;
  status: "active" | "pending" | "error";
}

export interface CallLogEntry {
  id: string;
  toolName: string;
  input: object;
  result?: unknown;
  error?: string;
  timestamp: number;
  status: "pending" | "approved" | "rejected" | "completed" | "failed";
}

export interface PendingCall {
  id: string;
  toolName: string;
  input: object;
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
  toolCalls?: {
    name: string;
    input: object;
    result?: unknown;
    status: string;
  }[];
}

export interface AgentProvider {
  chat(
    messages: { role: string; content: string }[],
    tools: ToolInfo[],
  ): Promise<ProviderResponse>;
}

export interface ProviderResponse {
  content: string;
  toolCalls?: { name: string; input: object }[];
}

export interface OpenAIProviderConfig {
  endpoint: string;
  apiKey: string;
  model: string;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface BuiltInAIProviderConfig {
  systemPrompt?: string;
  temperature?: number;
  topK?: number;
}

export interface WebLLMProviderConfig {
  modelId: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
}

/** How the agent connects to a model. */
export type AccessMode = "api" | "browser" | "webllm";

/** Lightweight model record (matches a prebuilt WebLLM model). */
export interface ModelRecord {
  model_id: string;
  model: string;
  model_lib?: string;
  overrides?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Reactive store
// ---------------------------------------------------------------------------

const registeredTools = signal<ToolInfo[]>([]);
const pendingCalls = signal<PendingCall[]>([]);
const callLog = signal<CallLogEntry[]>([]);
const messages = signal<ChatMessage[]>([]);
const isProcessing = signal(false);
const currentProvider = signal<AgentProvider | null>(null);
const showSettings = signal(false);
const selectedAccessMode = signal<AccessMode>("api");
const selectedWebLLMModelId = signal<string>("");
const webllmLoading = signal<boolean>(false);
const webllmProgress = signal<number>(0);
const webllmProgressText = signal<string>("");
const webllmError = signal<string>("");
const webllmAvailableModels = signal<ModelRecord[]>([]);

// WebLLM model list is populated lazily on first request (see
// ensureWebLLM). Starting with an empty list avoids eagerly pulling in
// @mlc-ai/web-llm at module load time.
webllmAvailableModels.set([]);

// ---------------------------------------------------------------------------
// Dynamic WebLLM loader
// ---------------------------------------------------------------------------
//
// We only attempt to load the library when the user explicitly picks the
// WebLLM access mode. A short-lived signal (`webllmLoading` +
// `webllmProgressText`) drives a progress banner in the UI during the
// download of the module itself, before any model loading starts.

interface WebLLMModule {
  MLCEngine: new () => any;
  prebuiltAppConfig: any;
}

let cachedWebLLM: WebLLMModule | null = null;
let cachedWebLLMPromise: Promise<WebLLMModule> | null = null;
let cachedWebLLMError: Error | null = null;

// Signal to track if WebLLM module has been loaded (distinct from model loading).
const webllmModuleReady = signal(false);

function ensureWebLLM(): Promise<WebLLMModule> {
  if (cachedWebLLM) {
    // Module was already fetched; just mark it ready (in case the caller
    // set webllmLoading=true but the cached module bypassed this function).
    webllmLoading.set(false);
    webllmModuleReady.set(true);
    return Promise.resolve(cachedWebLLM);
  }
  if (cachedWebLLMPromise) return cachedWebLLMPromise;

  webllmLoading.set(true);
  webllmProgress.set(0);
  webllmProgressText.set("Loading WebLLM runtime…");

  cachedWebLLMPromise = import("@mlc-ai/web-llm")
    .then((mod) => {
      cachedWebLLM = mod as unknown as WebLLMModule;
      // Clear the promise reference so that UI checks such as
      // `cachedWebLLMPromise ? loading : loaded` correctly reflect the
      // "loaded" state. Future calls to ensureWebLLM() will hit the
      // `cachedWebLLM` guard above instead.
      cachedWebLLMPromise = null;

      // Populate model list now that the module is available.
      try {
        const list = (cachedWebLLM.prebuiltAppConfig?.model_list ??
          []) as Array<Record<string, unknown>>;
        webllmAvailableModels.set(
          list
            .map((m) => ({
              model_id: String(m.model_id ?? m.model ?? ""),
              model: String(m.model ?? m.model_id ?? ""),
              model_lib:
                typeof m.model_lib === "string" ? m.model_lib : undefined,
              overrides: m.overrides as Record<string, unknown> | undefined,
            }))
            .filter((m) => m.model_id.length > 0),
        );
        const first = webllmAvailableModels.get()[0];
        if (first && !selectedWebLLMModelId.get()) {
          selectedWebLLMModelId.set(first.model_id);
        }
      } catch {
        webllmAvailableModels.set([]);
      }

      webllmProgressText.set("WebLLM runtime ready.");
      webllmProgress.set(1);
      webllmLoading.set(false);
      webllmModuleReady.set(true);
      return cachedWebLLM;
    })
    .catch((err) => {
      cachedWebLLMPromise = null;
      cachedWebLLMError = err instanceof Error ? err : new Error(String(err));
      webllmError.set(
        "Failed to load WebLLM runtime. Try API or Browser AI instead.",
      );
      webllmLoading.set(false);
      throw cachedWebLLMError;
    });

  return cachedWebLLMPromise;
}

let msgIdCounter = 0;
function nextMsgId(): string {
  return `msg-${++msgIdCounter}`;
}

// ---------------------------------------------------------------------------
// Polyfill + ModelContext access
// ---------------------------------------------------------------------------

let polyfillInitialized = false;

function ensurePolyfill(): void {
  if (polyfillInitialized) return;
  polyfillInitialized = true;
  try {
    initializeWebMCPPolyfill();
  } catch {
    /* ok */
  }
}

function getMC(): ModelContext | null {
  ensurePolyfill();
  if (typeof document !== "undefined" && "modelContext" in document) {
    return (document as unknown as { modelContext: ModelContext }).modelContext;
  }
  if (typeof navigator !== "undefined" && "modelContext" in navigator) {
    return (navigator as unknown as { modelContext: ModelContext })
      .modelContext;
  }
  return null;
}

const webMCPSupported = computed(() => getMC() !== null);
const activeToolCount = computed(
  () => registeredTools.get().filter((t: ToolInfo) => t.status === "active").length,
);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DISPOSABLES_KEY = Symbol.for("rikka.web-agent.disposables");

function registerDisposable(el: HTMLElement, dispose: () => void): void {
  const internal = el as unknown as Record<symbol, (() => void)[] | undefined>;
  let list = internal[DISPOSABLES_KEY];
  if (!list) {
    list = [];
    internal[DISPOSABLES_KEY] = list;
  }
  list.push(dispose);
}

let callIdCounter = 0;
function nextCallId(): string {
  return `call-${++callIdCounter}`;
}

/** Sync the registeredTools signal from WebMCP's listTools(). */
function syncToolsFromWebMCP(): void {
  const mc = getMC();
  if (!mc) return;
  try {
    const tools = mc.listTools();
    registeredTools.set(
      tools.map((t) => ({
        name: t.name,
        title: t.title ?? null,
        description: t.description,
        inputSchema: t.inputSchema ?? null,
        readOnlyHint: t.annotations?.readOnlyHint ?? false,
        untrustedContentHint: t.annotations?.untrustedContentHint ?? false,
        status: "active" as const,
      })),
    );
  } catch {
    /* listTools may not be supported */
  }
}

type LayoutMode = "floating" | "sidebar" | "popup" | "embedded" | "headless";
type DisplayMode = "tools" | "agent" | "full";
type ThemeMode = "auto" | "dark" | "light";

function isValidLayout(v: unknown): v is LayoutMode {
  return (
    v === "floating" ||
    v === "sidebar" ||
    v === "popup" ||
    v === "embedded" ||
    v === "headless"
  );
}
function isValidDisplay(v: unknown): v is DisplayMode {
  return v === "tools" || v === "agent" || v === "full";
}
function isValidTheme(v: unknown): v is ThemeMode {
  return v === "auto" || v === "dark" || v === "light";
}

// ---------------------------------------------------------------------------
// WebMCP bridge (consumer — reads from WebMCP, does not register tools)
// ---------------------------------------------------------------------------

const abortControllers = new Map<string, AbortController>();

/**
 * Manually register a tool to WebMCP.
 * Prefer using defineElement({ tools }) instead — this is for ad-hoc tools.
 */
function registerToolToWebMCP(tool: ToolDefinition): void {
  const mc = getMC();
  if (!mc)
    throw new Error(
      "WebMCP is not supported in this browser and the polyfill failed to install",
    );
  const ac = new AbortController();
  abortControllers.set(tool.name, ac);
  const needConfirm = tool.requireConfirmation !== false && !tool.readOnlyHint;

  mc.registerTool(
    {
      name: tool.name,
      title: tool.title,
      description: tool.description,
      inputSchema: tool.inputSchema,
      annotations: {
        readOnlyHint: tool.readOnlyHint ?? false,
        untrustedContentHint: tool.untrustedContentHint ?? false,
      },
      execute: needConfirm
        ? async (input: object, client: ModelContextClient) => {
            // Try native elicit first
            if (client.elicit) {
              const result = await client.elicit({
                message: `Allow "${tool.name}" with input ${JSON.stringify(input)}?`,
                type: "confirmation",
              });
              if (result.action !== "accept") {
                return { content: [{ type: "text", text: "User rejected" }] };
              }
            }
            // Fallback: pending confirmation UI
            const id = nextCallId();
            callLog.set([
              ...callLog.get(),
              {
                id,
                toolName: tool.name,
                input,
                timestamp: Date.now(),
                status: "pending",
              },
            ]);
            return new Promise((resolve, reject) => {
              const pending: PendingCall = {
                id,
                toolName: tool.name,
                input,
                resolve: (value: unknown) => {
                  callLog.set(
                    callLog.get().map((e: CallLogEntry) =>
                      e.id === id
                        ? {
                            ...e,
                            status: "completed" as const,
                            result: value,
                          }
                        : e,
                    ),
                  );
                  resolve(value);
                },
                reject: (reason?: unknown) => {
                  callLog.set(
                    callLog.get().map((e: CallLogEntry) =>
                      e.id === id
                        ? {
                            ...e,
                            status: "rejected" as const,
                            error: String(reason),
                          }
                        : e,
                    ),
                  );
                  reject(reason);
                },
              };
              pendingCalls.set([...pendingCalls.get(), pending]);
            });
          }
        : async (input: object, client: ModelContextClient) => {
            const id = nextCallId();
            callLog.set([
              ...callLog.get(),
              {
                id,
                toolName: tool.name,
                input,
                timestamp: Date.now(),
                status: "pending",
              },
            ]);
            try {
              const result = await tool.execute(input, client);
              callLog.set(
                callLog
                  .get()
                  .map((e: CallLogEntry) =>
                    e.id === id
                      ? { ...e, status: "completed" as const, result }
                      : e,
                  ),
              );
              return result;
            } catch (err) {
              callLog.set(
                callLog.get().map((e: CallLogEntry) =>
                  e.id === id
                    ? {
                        ...e,
                        status: "failed" as const,
                        error: err instanceof Error ? err.message : String(err),
                      }
                    : e,
                ),
              );
              throw err;
            }
          },
    },
    { signal: ac.signal, exposedTo: tool.exposedTo },
  );
  syncToolsFromWebMCP();
}

function unregisterToolFromWebMCP(name: string): void {
  const mc = getMC();
  const ac = abortControllers.get(name);
  if (ac) {
    ac.abort();
    abortControllers.delete(name);
  }
  if (mc) {
    try {
      mc.unregisterTool(name);
    } catch {
      /* unregisterTool may not be supported */
    }
  }
  syncToolsFromWebMCP();
}

function unregisterAllManualTools(): void {
  for (const [, ac] of abortControllers) ac.abort();
  abortControllers.clear();
  registeredTools.set([]);
}

// ---------------------------------------------------------------------------
// Built-in OpenAI-compatible provider
// ---------------------------------------------------------------------------

function createOpenAIProvider(config: OpenAIProviderConfig): AgentProvider {
  return {
    async chat(msgs, tools) {
      const body: Record<string, unknown> = {
        model: config.model,
        messages: [
          ...(config.systemPrompt
            ? [{ role: "system", content: config.systemPrompt }]
            : []),
          ...msgs,
        ],
        max_tokens: config.maxTokens ?? 1024,
        temperature: config.temperature ?? 0.7,
      };
      if (tools.length > 0) {
        body.tools = tools.map((t) => ({
          type: "function",
          function: {
            name: t.name,
            description: t.description,
            parameters: t.inputSchema,
          },
        }));
      }
      const resp = await fetch(config.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify(body),
      });
      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(`LLM API error ${resp.status}: ${text}`);
      }
      const data = await resp.json();
      const choice = data.choices?.[0]?.message;
      if (!choice) throw new Error("No response from LLM");
      const toolCalls: { name: string; input: object }[] = [];
      if (choice.tool_calls) {
        for (const tc of choice.tool_calls) {
          if (tc.function?.name) {
            let input: object = {};
            try {
              input = JSON.parse(tc.function.arguments || "{}");
            } catch {
              /* empty */
            }
            toolCalls.push({ name: tc.function.name, input });
          }
        }
      }
      return {
        content: choice.content ?? "",
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      };
    },
  };
}

// ---------------------------------------------------------------------------
// Built-in AI provider (Chrome 127+, window.ai)
// ---------------------------------------------------------------------------

function createBuiltInAIProvider(
  config: BuiltInAIProviderConfig,
): AgentProvider {
  return {
    async chat(msgs) {
      const ai = (window as any).ai;
      if (!ai || !ai.languageModel)
        throw new Error("Built-in AI is not available. Use Chrome 127+.");
      const session = await ai.languageModel.create({
        systemPrompt: config.systemPrompt,
        temperature: config.temperature,
        topK: config.topK,
      });
      const prompt = msgs
        .map(
          (m) =>
            `${m.role === "user" ? "User" : m.role === "assistant" ? "Assistant" : "System"}: ${m.content}`,
        )
        .join("\n\n");
      const result = await session.prompt(prompt);
      return { content: result };
    },
  };
}

// ---------------------------------------------------------------------------
// WebLLM (local, in-browser) provider
// ---------------------------------------------------------------------------

let sharedWebLLMEngine: any = null;
let currentWebLLMModelId = "";
let webllmInitPromise: Promise<void> | null = null;
let webllmInitError: Error | null = null;

function isWebLLMEnvironmentSupported(): boolean {
  if (typeof globalThis === "undefined") return false;
  const g = globalThis as { caches?: unknown; crypto?: unknown };
  if (!g.caches) return false;
  if (typeof (g as { atob?: unknown }).atob !== "function") return false;
  return true;
}

function createWebLLMProvider(
  config: WebLLMProviderConfig,
): AgentProvider {
  // Reset error on a fresh configure call.
  webllmError.set("");

  if (
    sharedWebLLMEngine &&
    currentWebLLMModelId !== config.modelId &&
    !webllmLoading.get()
  ) {
    sharedWebLLMEngine
      .unload()
      .catch(() => { /* swallow */ });
    sharedWebLLMEngine = null;
    currentWebLLMModelId = "";
  }

  if (!webllmInitPromise || currentWebLLMModelId !== config.modelId) {
    if (!isWebLLMEnvironmentSupported()) {
      const msg =
        "WebLLM requires browser APIs that are not available in this environment " +
        "(Cache Storage API). Please try a different access method.";
      webllmError.set(msg);
      webllmInitError = new Error(msg);
      webllmInitPromise = Promise.resolve();
      currentWebLLMModelId = config.modelId;
      return makeWebLLMProvider();
    }

    // First: ensure the @mlc-ai/web-llm module is fetched. ensureWebLLM
    // updates the progress signals itself, so the UI shows a banner.
    webllmInitPromise = ensureWebLLM()
      .then((mod) => {
        if (!sharedWebLLMEngine) {
          sharedWebLLMEngine = new mod.MLCEngine();
          sharedWebLLMEngine.setInitProgressCallback(
            (report: any) => {
              webllmProgressText.set(report.text || "");
              webllmProgress.set(report.progress ?? 0);
            },
          );
        }

        const chatOpts: any = {
          system: config.systemPrompt,
          temperature: config.temperature,
          ...(config.maxTokens !== undefined
            ? { max_tokens: config.maxTokens }
            : {}),
        };

        webllmLoading.set(true);
        webllmProgress.set(0);
        webllmProgressText.set(
          `Preparing ${config.modelId} (first-run download may take a while)...`,
        );
        currentWebLLMModelId = config.modelId;

        return sharedWebLLMEngine
          .reload(config.modelId, chatOpts, mod.prebuiltAppConfig)
          .then(() => {
            webllmLoading.set(false);
            webllmProgress.set(1);
            webllmProgressText.set(`Model ${config.modelId} is ready.`);
          });
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        webllmInitError = new Error(msg);
        webllmError.set(
          msg.includes("caches") || msg.includes("Cache")
            ? "Your browser does not support the WebLLM model cache. " +
                "Please try a different access method (API or Browser AI)."
            : msg,
        );
        webllmLoading.set(false);
        webllmProgressText.set("Failed to load WebLLM model");
        webllmInitPromise = null;
        currentWebLLMModelId = "";
      });
  }

  return makeWebLLMProvider();

  function makeWebLLMProvider(): AgentProvider {
    return {
      async chat(msgs, tools) {
        if (!sharedWebLLMEngine && !webllmInitPromise) {
          throw webllmInitError ||
            new Error("WebLLM engine was disposed or unavailable.");
        }
        if (webllmInitPromise) {
          try {
            await webllmInitPromise;
          } catch {
            if (webllmInitError) throw webllmInitError;
            throw new Error("Failed to initialize WebLLM engine");
          }
        }
        if (webllmError.get()) {
          throw new Error(webllmError.get());
        }

        const conversation: Array<{ role: string; content: string }> = msgs.map((m) => ({
          role: (m.role as "system" | "user" | "assistant"),
          content: m.content,
        }));
        if (config.systemPrompt) {
          conversation.unshift({
            role: "system",
            content: config.systemPrompt,
          });
        }

        if (tools.length > 0) {
          conversation.push({
            role: "system",
            content:
              "Available tools (JSON schema):\n" +
              JSON.stringify(
                tools.map((t) => ({
                  name: t.name,
                  description: t.description,
                  parameters: t.inputSchema,
                })),
                null,
                2,
              ),
          });
        }

        const resp = await sharedWebLLMEngine.chat.completions.create({
          messages: conversation,
          stream: false,
          temperature: config.temperature,
          max_tokens: config.maxTokens,
        });
        const choice = resp?.choices?.[0];
        if (!choice) {
          throw new Error("WebLLM returned no response.");
        }
        return { content: choice.message.content ?? "" };
      },
    };
  }
}

const isBuiltInAIAvailable = computed(() => {
  if (typeof window === "undefined") return false;
  const ai = (window as any).ai;
  return !!(ai && ai.languageModel);
});

// ---------------------------------------------------------------------------
// Chat loop
// ---------------------------------------------------------------------------

async function runChatLoop(self: any): Promise<void> {
  const provider = currentProvider.get();
  if (!provider) return;
  isProcessing.set(true);
  try {
    const history = messages
      .get()
      .map((m: ChatMessage) => ({ role: m.role, content: m.content }));
    const tools = registeredTools.get();
    const response = await provider.chat(history, tools);

    const executedToolCalls: {
      name: string;
      input: object;
      result?: unknown;
      status: string;
    }[] = [];
    if (response.toolCalls && response.toolCalls.length > 0) {
      const mc = getMC();
      for (const tc of response.toolCalls) {
        try {
          let result: unknown;
          if (mc) {
            const mcAny = mc as any;
            if (mcAny.callTool) {
              result = await mcAny.callTool(tc.name, tc.input);
            } else {
              result = {
                error:
                  "Tool calling not supported by this WebMCP implementation",
              };
            }
          } else {
            result = { error: "WebMCP not available" };
          }
          executedToolCalls.push({
            name: tc.name,
            input: tc.input,
            result,
            status: "completed",
          });
        } catch (err) {
          executedToolCalls.push({
            name: tc.name,
            input: tc.input,
            status: "failed",
            result: err instanceof Error ? err.message : String(err),
          });
        }
      }
    }

    const assistantMsg: ChatMessage = {
      id: nextMsgId(),
      role: "assistant",
      content:
        response.content ||
        (response.toolCalls?.length ? "Using tools..." : ""),
      timestamp: Date.now(),
      toolCalls: executedToolCalls.length > 0 ? executedToolCalls : undefined,
    };
    messages.set([...messages.get(), assistantMsg]);

    if (executedToolCalls.length > 0 && response.content === "") {
      const toolResultsSummary = executedToolCalls
        .map(
          (tc) =>
            `${tc.name}: ${tc.status}${tc.result ? ` — ${JSON.stringify(tc.result)}` : ""}`,
        )
        .join("\n");
      messages.set([
        ...messages.get(),
        {
          id: nextMsgId(),
          role: "system",
          content: `Tool results:\n${toolResultsSummary}`,
          timestamp: Date.now(),
        },
      ]);
      await runChatLoop(self);
    }
  } catch (err) {
    messages.set([
      ...messages.get(),
      {
        id: nextMsgId(),
        role: "system",
        content: `Error: ${err instanceof Error ? err.message : String(err)}`,
        timestamp: Date.now(),
      },
    ]);
    self.dispatchError(err instanceof Error ? err.message : String(err));
  } finally {
    isProcessing.set(false);
  }
}

// ---------------------------------------------------------------------------
// Styles — chat-first design
// ---------------------------------------------------------------------------

const webAgentStyles = css`
  :host {
    --wa-width: 400px;
    --wa-height: 600px;
    --wa-max-height: 85vh;
    --wa-offset-x: 20px;
    --wa-offset-y: 20px;
    --wa-z-index: 999999;
    --wa-radius: 16px;
    --wa-radius-sm: 12px;
    --wa-radius-xs: 8px;

    --wa-shadow: 0 8px 32px rgba(0, 0, 0, 0.28);
    --wa-shadow-lg: 0 12px 48px rgba(0, 0, 0, 0.35);

    --wa-spacing-xs: 4px;
    --wa-spacing-sm: 8px;
    --wa-spacing-md: 12px;
    --wa-spacing-lg: 16px;
    --wa-spacing-xl: 24px;

    --wa-transition: 200ms ease;

    /* Dark theme (default) */
    --wa-bg: #1a1a2e;
    --wa-surface: #16213e;
    --wa-surface-hover: #1f2f50;
    --wa-border: #2a2a4a;
    --wa-text: #e8e8f0;
    --wa-text-muted: #9ca3af;
    --wa-text-subtle: #6b7280;
    --wa-accent: #6366f1;
    --wa-accent-soft: rgba(99, 102, 241, 0.15);
    --wa-success: #22c55e;
    --wa-success-text: #4ade80;
    --wa-error: #ef4444;
    --wa-error-bg: rgba(239, 68, 68, 0.1);
    --wa-user-bubble: #6366f1;
    --wa-assistant-bubble: #16213e;
    --wa-input-bg: #0f172a;

    --wa-font-sans:
      system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    --wa-font-mono:
      ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
    --wa-font-size-xs: 0.7rem;
    --wa-font-size-sm: 0.8125rem;
    --wa-font-size-base: 0.875rem;
  }

  :host([data-theme="light"]) {
    --wa-bg: #ffffff;
    --wa-surface: #f3f4f6;
    --wa-surface-hover: #e5e7eb;
    --wa-border: #d1d5db;
    --wa-text: #111827;
    --wa-text-muted: #6b7280;
    --wa-text-subtle: #9ca3af;
    --wa-accent: #6366f1;
    --wa-accent-soft: rgba(99, 102, 241, 0.08);
    --wa-success: #16a34a;
    --wa-success-text: #16a34a;
    --wa-error: #dc2626;
    --wa-error-bg: rgba(220, 38, 38, 0.06);
    --wa-user-bubble: #6366f1;
    --wa-assistant-bubble: #f3f4f6;
    --wa-input-bg: #f9fafb;
  }

  @media (prefers-color-scheme: light) {
    :host([data-theme="auto"]) {
      --wa-bg: #ffffff;
      --wa-surface: #f3f4f6;
      --wa-surface-hover: #e5e7eb;
      --wa-border: #d1d5db;
      --wa-text: #111827;
      --wa-text-muted: #6b7280;
      --wa-text-subtle: #9ca3af;
      --wa-accent: #6366f1;
      --wa-accent-soft: rgba(99, 102, 241, 0.08);
      --wa-success: #16a34a;
      --wa-success-text: #16a34a;
      --wa-error: #dc2626;
      --wa-error-bg: rgba(220, 38, 38, 0.06);
      --wa-user-bubble: #6366f1;
      --wa-assistant-bubble: #f3f4f6;
      --wa-input-bg: #f9fafb;
    }
  }

  :host {
    font-family: var(--wa-font-sans);
    color: var(--wa-text);
    background: var(--wa-bg);
  }

  /* --- Layout presets --- */
  :host([data-layout="embedded"]),
  :host(:not([data-layout])) {
    display: block;
    position: relative;
    border: 1px solid var(--wa-border);
    border-radius: var(--wa-radius);
    overflow: hidden;
  }
  :host([data-layout="embedded"]) .wa-panel,
  :host(:not([data-layout])) .wa-panel {
    width: 100%;
    height: var(--wa-height);
    border-radius: var(--wa-radius);
    box-shadow: none;
  }

  :host([data-layout="floating"]) {
    display: block;
    position: fixed;
    z-index: var(--wa-z-index);
    bottom: var(--wa-offset-y);
    right: var(--wa-offset-x);
    border-radius: var(--wa-radius);
    overflow: hidden;
  }
  :host([data-layout="floating"]) .wa-panel {
    width: var(--wa-width);
    height: var(--wa-height);
    max-height: var(--wa-max-height);
    border-radius: var(--wa-radius);
    box-shadow: var(--wa-shadow);
  }
  :host([data-layout="floating"][data-position="bottom-left"]) {
    right: auto;
    left: var(--wa-offset-x);
  }
  :host([data-layout="floating"][data-position="top-right"]) {
    bottom: auto;
    top: var(--wa-offset-y);
  }
  :host([data-layout="floating"][data-position="top-left"]) {
    bottom: auto;
    right: auto;
    top: var(--wa-offset-y);
    left: var(--wa-offset-x);
  }

  :host([data-layout="sidebar"]) {
    display: block;
    position: fixed;
    top: 0;
    right: 0;
    height: 100vh;
    z-index: var(--wa-z-index);
    overflow: hidden;
  }
  :host([data-layout="sidebar"]) .wa-panel {
    width: var(--wa-width);
    height: 100%;
    border-radius: 0;
    box-shadow: var(--wa-shadow-lg);
  }
  :host([data-layout="sidebar"][data-position="left"]) {
    right: auto;
    left: 0;
  }

  :host([data-layout="popup"]) {
    display: block;
    position: fixed;
    z-index: var(--wa-z-index);
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    border-radius: var(--wa-radius);
    overflow: hidden;
  }
  :host([data-layout="popup"]) .wa-panel {
    width: var(--wa-width);
    max-height: var(--wa-max-height);
    border-radius: var(--wa-radius);
    box-shadow: var(--wa-shadow-lg);
  }
  :host([data-layout="popup"])::before {
    content: "";
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: -1;
  }

  :host([data-layout="headless"]) {
    display: none !important;
  }

  /* --- Panel --- */
  .wa-panel {
    display: flex;
    flex-direction: column;
    background: var(--wa-bg);
    overflow: hidden;
    box-shadow: var(--wa-shadow);
  }

  /* --- Header --- */
  .wa-header {
    display: flex;
    align-items: center;
    gap: var(--wa-spacing-sm);
    padding: var(--wa-spacing-md) var(--wa-spacing-lg);
    background: var(--wa-bg);
    flex-shrink: 0;
  }
  .wa-header-left {
    flex: 1;
    min-width: 0;
  }
  .wa-header-title {
    font-weight: 700;
    font-size: 1rem;
  }
  .wa-header-subtitle {
    font-size: var(--wa-font-size-xs);
    color: var(--wa-text-subtle);
  }

  .wa-icon-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border: none;
    border-radius: 50%;
    background: transparent;
    color: var(--wa-text-muted);
    font-size: 16px;
    cursor: pointer;
    transition:
      background var(--wa-transition),
      color var(--wa-transition);
    padding: 0;
    line-height: 1;
  }
  .wa-icon-btn:hover {
    background: var(--wa-surface-hover);
    color: var(--wa-text);
  }

  :host(
      :not([data-layout="floating"]):not([data-layout="popup"]):not(
          [data-layout="sidebar"]
        )
    )
    .wa-close-btn {
    display: none;
  }

  /* --- Chat --- */
  .wa-chat {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow: hidden;
  }

  .wa-messages {
    flex: 1;
    overflow-y: auto;
    padding: var(--wa-spacing-lg);
    display: flex;
    flex-direction: column;
    gap: var(--wa-spacing-md);
    scroll-behavior: smooth;
  }

  .wa-msg {
    max-width: 82%;
    font-size: var(--wa-font-size-base);
    line-height: 1.6;
    word-wrap: break-word;
    white-space: pre-wrap;
  }

  .wa-msg--user {
    align-self: flex-end;
    padding: var(--wa-spacing-sm) var(--wa-spacing-lg);
    background: var(--wa-user-bubble);
    color: #fff;
    border-radius: var(--wa-radius-sm) var(--wa-radius-sm) var(--wa-radius-xs)
      var(--wa-radius-sm);
  }

  .wa-msg--assistant {
    align-self: flex-start;
    padding: var(--wa-spacing-sm) var(--wa-spacing-lg);
    background: var(--wa-assistant-bubble);
    border: 1px solid var(--wa-border);
    border-radius: var(--wa-radius-sm) var(--wa-radius-sm) var(--wa-radius-sm)
      var(--wa-radius-xs);
  }

  .wa-msg--system {
    align-self: center;
    max-width: 90%;
    text-align: center;
    font-size: var(--wa-font-size-xs);
    color: var(--wa-text-subtle);
    padding: var(--wa-spacing-xs) var(--wa-spacing-md);
    background: var(--wa-accent-soft);
    border-radius: var(--wa-radius-xs);
  }

  /* Tool call card (inline in assistant message) */
  .wa-tool-card {
    margin-top: var(--wa-spacing-sm);
    padding: var(--wa-spacing-sm) var(--wa-spacing-md);
    background: var(--wa-bg);
    border: 1px solid var(--wa-border);
    border-radius: var(--wa-radius-xs);
    font-size: var(--wa-font-size-xs);
  }
  .wa-tool-card-header {
    display: flex;
    align-items: center;
    gap: var(--wa-spacing-xs);
  }
  .wa-tool-card-name {
    font-family: var(--wa-font-mono);
    font-weight: 600;
    color: var(--wa-accent);
  }
  .wa-tool-card-status {
    font-size: 0.65rem;
    padding: 1px 6px;
    border-radius: 999px;
    font-weight: 500;
  }
  .wa-tool-card-status--completed {
    background: rgba(34, 197, 94, 0.15);
    color: var(--wa-success-text);
  }
  .wa-tool-card-status--pending {
    background: rgba(234, 179, 8, 0.15);
    color: #eab308;
  }
  .wa-tool-card-status--failed {
    background: var(--wa-error-bg);
    color: var(--wa-error);
  }

  /* Pending confirmation card */
  .wa-confirm-card {
    align-self: center;
    max-width: 92%;
    margin: var(--wa-spacing-sm) 0;
    padding: var(--wa-spacing-md);
    background: var(--wa-surface);
    border: 1px solid var(--wa-border);
    border-radius: var(--wa-radius-sm);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
  .wa-confirm-card-title {
    font-weight: 600;
    font-size: var(--wa-font-size-sm);
    margin-bottom: var(--wa-spacing-sm);
    display: flex;
    align-items: center;
    gap: var(--wa-spacing-xs);
  }
  .wa-confirm-card-title .wa-icon {
    color: var(--wa-accent);
  }
  .wa-confirm-card-input {
    background: var(--wa-bg);
    border: 1px solid var(--wa-border);
    border-radius: var(--wa-radius-xs);
    padding: var(--wa-spacing-sm);
    font-family: var(--wa-font-mono);
    font-size: var(--wa-font-size-xs);
    color: var(--wa-text);
    overflow-x: auto;
    white-space: pre;
    max-height: 120px;
    overflow-y: auto;
    margin-bottom: var(--wa-spacing-sm);
  }
  .wa-confirm-actions {
    display: flex;
    gap: var(--wa-spacing-sm);
  }
  .wa-btn {
    padding: 6px 16px;
    border-radius: var(--wa-radius-xs);
    font-size: var(--wa-font-size-sm);
    font-weight: 500;
    cursor: pointer;
    font-family: inherit;
    border: 1px solid var(--wa-border);
    transition: background var(--wa-transition);
  }
  .wa-btn--approve {
    background: var(--wa-success);
    color: #fff;
    border-color: var(--wa-success);
  }
  .wa-btn--approve:hover {
    opacity: 0.9;
  }
  .wa-btn--reject {
    background: transparent;
    color: var(--wa-error);
    border-color: var(--wa-error);
  }
  .wa-btn--reject:hover {
    background: var(--wa-error-bg);
  }

  /* Typing indicator */
  .wa-typing {
    display: flex;
    gap: 4px;
    padding: var(--wa-spacing-sm) var(--wa-spacing-lg);
    align-self: flex-start;
  }
  .wa-typing-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--wa-text-muted);
    animation: wa-bounce 1.4s infinite ease-in-out;
  }
  .wa-typing-dot:nth-child(2) {
    animation-delay: 0.16s;
  }
  .wa-typing-dot:nth-child(3) {
    animation-delay: 0.32s;
  }
  @keyframes wa-bounce {
    0%,
    80%,
    100% {
      transform: scale(0.6);
      opacity: 0.4;
    }
    40% {
      transform: scale(1);
      opacity: 1;
    }
  }

  /* WebLLM model loading */
  .wa-loader {
    align-self: center;
    width: 92%;
    margin: var(--wa-spacing-sm) 0;
    padding: var(--wa-spacing-md);
    background: var(--wa-surface);
    border: 1px solid var(--wa-border);
    border-radius: var(--wa-radius-sm);
    font-size: var(--wa-font-size-sm);
  }
  .wa-loader-title {
    font-weight: 600;
    margin-bottom: var(--wa-spacing-xs);
    display: flex;
    align-items: center;
    gap: var(--wa-spacing-xs);
  }
  .wa-loader-text {
    color: var(--wa-text-muted);
    font-size: var(--wa-font-size-xs);
    margin-bottom: var(--wa-spacing-xs);
    word-break: break-word;
  }
  .wa-progress-track {
    width: 100%;
    height: 8px;
    background: var(--wa-bg);
    border: 1px solid var(--wa-border);
    border-radius: 999px;
    overflow: hidden;
  }
  .wa-progress-fill {
    height: 100%;
    background: var(--wa-accent);
    transition: width 200ms ease;
  }
  .wa-loader-spinner {
    display: inline-block;
    width: 18px;
    height: 18px;
    border: 2px solid var(--wa-border);
    border-top-color: var(--wa-accent);
    border-radius: 50%;
    animation: wa-spin 0.8s linear infinite;
  }
  @keyframes wa-spin {
    to { transform: rotate(360deg); }
  }

  .wa-loader--error {
    border-color: #dc2626;
    background: rgba(220, 38, 38, 0.08);
  }
  .wa-loader--error .wa-loader-title {
    color: #dc2626;
  }

  /* Welcome screen */
  .wa-welcome {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--wa-spacing-xl);
    gap: var(--wa-spacing-lg);
    text-align: center;
  }
  .wa-welcome-icon {
    font-size: 2.5rem;
  }
  .wa-welcome-title {
    font-size: 1.1rem;
    font-weight: 700;
  }
  .wa-welcome-desc {
    font-size: var(--wa-font-size-sm);
    color: var(--wa-text-muted);
    max-width: 280px;
    line-height: 1.5;
  }
  .wa-welcome-actions {
    display: flex;
    flex-direction: column;
    gap: var(--wa-spacing-sm);
    width: 100%;
    max-width: 280px;
  }
  .wa-welcome-btn {
    padding: var(--wa-spacing-sm) var(--wa-spacing-lg);
    border: 1px solid var(--wa-border);
    border-radius: var(--wa-radius-sm);
    background: var(--wa-surface);
    color: var(--wa-text);
    font-size: var(--wa-font-size-sm);
    font-weight: 500;
    cursor: pointer;
    font-family: inherit;
    transition:
      background var(--wa-transition),
      border-color var(--wa-transition);
  }
  .wa-welcome-btn:hover {
    background: var(--wa-surface-hover);
    border-color: var(--wa-accent);
  }
  .wa-welcome-btn--primary {
    background: var(--wa-accent);
    color: #fff;
    border-color: var(--wa-accent);
  }
  .wa-welcome-btn--primary:hover {
    opacity: 0.9;
  }

  /* Input area */
  .wa-input-area {
    display: flex;
    align-items: center;
    gap: var(--wa-spacing-sm);
    padding: var(--wa-spacing-md) var(--wa-spacing-lg);
    flex-shrink: 0;
  }
  .wa-input {
    flex: 1;
    padding: var(--wa-spacing-sm) var(--wa-spacing-lg);
    border: 1px solid var(--wa-border);
    border-radius: 999px;
    background: var(--wa-input-bg);
    color: var(--wa-text);
    font-size: var(--wa-font-size-base);
    font-family: inherit;
    outline: none;
    transition: border-color var(--wa-transition);
  }
  .wa-input:focus {
    border-color: var(--wa-accent);
  }
  .wa-input::placeholder {
    color: var(--wa-text-subtle);
  }
  .wa-send-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border: none;
    border-radius: 50%;
    background: var(--wa-accent);
    color: #fff;
    font-size: 18px;
    cursor: pointer;
    transition: opacity var(--wa-transition);
    padding: 0;
    flex-shrink: 0;
  }
  .wa-send-btn:hover {
    opacity: 0.9;
  }
  .wa-send-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  /* Settings overlay */
  .wa-settings-overlay {
    position: absolute;
    inset: 0;
    background: var(--wa-bg);
    z-index: 10;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  .wa-settings-header {
    display: flex;
    align-items: center;
    gap: var(--wa-spacing-sm);
    padding: var(--wa-spacing-md) var(--wa-spacing-lg);
    flex-shrink: 0;
  }
  .wa-settings-title {
    font-weight: 700;
    flex: 1;
    font-size: 1rem;
  }
  .wa-settings-body {
    flex: 1;
    overflow-y: auto;
    padding: var(--wa-spacing-lg);
  }
  .wa-field {
    margin-bottom: var(--wa-spacing-lg);
  }
  .wa-field-label {
    font-size: var(--wa-font-size-xs);
    font-weight: 600;
    color: var(--wa-text-muted);
    margin-bottom: var(--wa-spacing-xs);
    display: block;
  }
  .wa-field-input {
    width: 100%;
    padding: var(--wa-spacing-sm) var(--wa-spacing-md);
    border: 1px solid var(--wa-border);
    border-radius: var(--wa-radius-xs);
    background: var(--wa-input-bg);
    color: var(--wa-text);
    font-size: var(--wa-font-size-sm);
    font-family: inherit;
    outline: none;
    box-sizing: border-box;
  }
  .wa-field-input:focus {
    border-color: var(--wa-accent);
  }
  .wa-field-hint {
    font-size: var(--wa-font-size-xs);
    color: var(--wa-text-subtle);
    margin-top: var(--wa-spacing-xs);
  }
  .wa-settings-actions {
    padding: var(--wa-spacing-md) var(--wa-spacing-lg);
    flex-shrink: 0;
    display: flex;
    gap: var(--wa-spacing-sm);
  }

  /* Unsupported */
  .wa-unsupported {
    padding: var(--wa-spacing-xl);
    text-align: center;
    color: var(--wa-error);
    font-size: var(--wa-font-size-sm);
  }
`;

// ---------------------------------------------------------------------------
// Theme sync
// ---------------------------------------------------------------------------

function syncTheme(el: HTMLElement, theme: string): void {
  if (theme === "auto") {
    const pageTheme = document.documentElement.getAttribute("data-theme");
    el.setAttribute(
      "data-theme",
      pageTheme === "light" || pageTheme === "dark" ? pageTheme : "auto",
    );
  } else {
    el.setAttribute("data-theme", theme);
  }
}

function watchPrefersColorScheme(cb: () => void): () => void {
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

function watchPageTheme(cb: () => void): () => void {
  const obs = new MutationObserver(cb);
  obs.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  return () => obs.disconnect();
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const RikkaWebAgent = defineElement("rikka-web-agent", {
  attributes: {
    layout: {
      toProp: (v?: string) => (isValidLayout(v) ? v : "embedded"),
      toAttribute: (v?: string) => v,
    },
    position: {
      toProp: (v?: string) => v ?? "bottom-right",
      toAttribute: (v?: string) => v,
    },
    display: {
      toProp: (v?: string) => (isValidDisplay(v) ? v : "full"),
      toAttribute: (v?: string) => v,
    },
    theme: {
      toProp: (v?: string) => (isValidTheme(v) ? v : "auto"),
      toAttribute: (v?: string) => v,
    },
  },
  events: {
    toolRegistered: event<{ name: string; description: string }>(),
    toolUnregistered: event<{ name: string }>(),
    toolInvoked: event<{ name: string; input: object }>(),
    toolResult: event<{ name: string; result: unknown }>(),
    message: event<{ role: string; content: string }>(),
    close: event<void>(),
    error: event<string>(),
  },
  styles: webAgentStyles,
  methods: {
    register(this: any, tool: ToolDefinition) {
      try {
        registerToolToWebMCP(tool);
        this.dispatchToolRegistered({
          name: tool.name,
          description: tool.description,
        });
      } catch (err) {
        this.dispatchError(err instanceof Error ? err.message : String(err));
        throw err;
      }
    },
    unregister(this: any, name: string) {
      unregisterToolFromWebMCP(name);
      this.dispatchToolUnregistered({ name });
    },
    listTools(this: any): ToolInfo[] {
      return registeredTools.get();
    },
    approveCall(this: any, callId: string) {
      const calls = pendingCalls.get();
      const call = calls.find((c: PendingCall) => c.id === callId);
      if (!call) return;
      pendingCalls.set(calls.filter((c: PendingCall) => c.id !== callId));
      call.resolve(undefined);
    },
    rejectCall(this: any, callId: string) {
      const calls = pendingCalls.get();
      const call = calls.find((c: PendingCall) => c.id === callId);
      if (!call) return;
      pendingCalls.set(calls.filter((c: PendingCall) => c.id !== callId));
      call.reject(new Error("User rejected"));
    },
    getCallLog(this: any): CallLogEntry[] {
      return callLog.get();
    },
    isSupported(this: any): boolean {
      return webMCPSupported.get();
    },
    sendMessage(this: any, text: string) {
      const trimmed = text.trim();
      if (!trimmed) return;
      messages.set([
        ...messages.get(),
        {
          id: nextMsgId(),
          role: "user",
          content: trimmed,
          timestamp: Date.now(),
        },
      ]);
      this.dispatchMessage({ role: "user", content: trimmed });
      if (currentProvider.get()) runChatLoop(this);
    },
    addAssistantMessage(
      this: any,
      content: string,
      toolCalls?: ChatMessage["toolCalls"],
    ) {
      messages.set([
        ...messages.get(),
        {
          id: nextMsgId(),
          role: "assistant",
          content,
          timestamp: Date.now(),
          toolCalls,
        },
      ]);
    },
    addSystemMessage(this: any, content: string) {
      messages.set([
        ...messages.get(),
        { id: nextMsgId(), role: "system", content, timestamp: Date.now() },
      ]);
    },
    clearMessages(this: any) {
      messages.set([]);
    },
    setProvider(this: any, provider: AgentProvider | null) {
      currentProvider.set(provider);
    },
    configureOpenAI(this: any, config: OpenAIProviderConfig) {
      selectedAccessMode.set("api");
      webllmError.set("");
      webllmLoading.set(false);
      currentProvider.set(createOpenAIProvider(config));
    },
    configureBuiltInAI(this: any, config?: BuiltInAIProviderConfig) {
      selectedAccessMode.set("browser");
      webllmError.set("");
      webllmLoading.set(false);
      currentProvider.set(createBuiltInAIProvider(config ?? {}));
    },
    configureWebLLM(this: any, config: WebLLMProviderConfig) {
      selectedAccessMode.set("webllm");
      currentProvider.set(createWebLLMProvider(config));
    },
    listWebLLMModels(this: any): ModelRecord[] {
      return webllmAvailableModels.get();
    },
    getProvider(this: any): AgentProvider | null {
      return currentProvider.get();
    },
  },
  render(this: any) {
    const self = this;

    // ---- Header ----
    const header = div(
      { class: "wa-header", part: "header" },
      div(
        { class: "wa-header-left" },
        div({ class: "wa-header-title", part: "header-title" }, "Agent"),
        div(
          { class: "wa-header-subtitle" },
          computed(() => {
            const n = activeToolCount.get();
            const provider = currentProvider.get();
            if (!provider) return "Not connected";
            return `${n} tool${n !== 1 ? "s" : ""} available`;
          }),
        ),
      ),
      button(
        {
          class: "wa-icon-btn",
          part: "settings-button",
          onclick: () => showSettings.set(true),
          "aria-label": "Settings",
        },
        "\u2699",
      ),
      button(
        {
          class: "wa-icon-btn wa-close-btn",
          part: "close-button",
          onclick: () => self.dispatchClose(),
          "aria-label": "Close",
        },
        "\u2715",
      ),
    );

    // ---- Messages ----
    const messagesEl = div({ class: "wa-messages" });

    // WebLLM banner - reactive element created once
    const webllmBanner = div({ class: "wa-loader" });
    const webllmBannerTitle = div({ class: "wa-loader-title" });
    const webllmBannerText = div({ class: "wa-loader-text" });
    const webllmBannerProgressTrack = div({ class: "wa-progress-track" });
    const webllmBannerProgressFill = div({ class: "wa-progress-fill" });
    const webllmBannerPercent = span(
      { style: "font-size: var(--wa-font-size-xs); color: var(--wa-text-subtle); margin-top: var(--wa-spacing-xs); text-align: right;" }
    );
    webllmBanner.append(
      webllmBannerTitle,
      webllmBannerText,
      webllmBannerProgressTrack,
      webllmBannerPercent
    );
    webllmBannerProgressTrack.append(webllmBannerProgressFill);

    // Update webllm banner reactively
    effect(() => {
      const isLoading = webllmLoading.get();
      const hasError = webllmError.get();
      const isWebLLMMode = selectedAccessMode.get() === "webllm";
      const progress = webllmProgress.get();
      const progressText = webllmProgressText.get();

      if (isLoading) {
        webllmBanner.className = "wa-loader";
        webllmBannerTitle.textContent = "⚙ Loading local model (WebLLM)";
        webllmBannerText.textContent = progressText || `Downloading weights... ${(progress * 100).toFixed(1)}%`;
        webllmBannerProgressTrack.style.display = "";
        webllmBannerProgressFill.style.width = `${Math.max(0, Math.min(100, progress * 100))}%`;
        webllmBannerPercent.textContent = `${(progress * 100).toFixed(1)}%`;
        webllmBannerPercent.style.display = "";
      } else if (isWebLLMMode && hasError) {
        webllmBanner.className = "wa-loader wa-loader--error";
        webllmBannerTitle.textContent = "⚠ WebLLM model unavailable";
        webllmBannerText.textContent = webllmError.get();
        webllmBannerProgressTrack.style.display = "none";
        webllmBannerPercent.style.display = "none";
      } else {
        webllmBanner.style.display = "none";
      }
    });

    // Welcome screen for empty state
    const builtinBtn = button(
      {
        class: "wa-welcome-btn wa-welcome-btn--primary",
        onclick: () => self.configureBuiltInAI(),
      },
      "Use Browser AI (free)",
    );
    const builtinBtnHint = div(
      { class: "wa-field-hint" },
      "Browser AI not available (Chrome 127+)",
    );

    const apiConfigBtn = button(
      {
        class: "wa-welcome-btn",
        onclick: () => showSettings.set(true),
      },
      "Configure API endpoint",
    );

    const welcomeNoProviderActions = div(
      { class: "wa-welcome-actions" },
      builtinBtn,
      builtinBtnHint,
      div(
        {
          style: "text-align: center; color: var(--wa-text-subtle); font-size: var(--wa-font-size-xs);",
        },
        "\u2014 or \u2014",
      ),
      apiConfigBtn,
    );

    // Reactively toggle builtinBtn/builtinBtnHint visibility
    effect(() => {
      const available = isBuiltInAIAvailable.get();
      builtinBtn.style.display = available ? "" : "none";
      builtinBtnHint.style.display = available ? "none" : "";
    });

    const welcomeNoProvider = div(
      { class: "wa-welcome" },
      div({ class: "wa-welcome-icon" }, "\u2728"),
      div({ class: "wa-welcome-title" }, "WebMCP Agent"),
      div(
        { class: "wa-welcome-desc" },
        "Connect an LLM to start chatting with an AI agent that can use your page's tools.",
      ),
      welcomeNoProviderActions,
    );

    const welcomeWithProvider = div(
      { class: "wa-welcome" },
      div({ class: "wa-welcome-icon" }, "\u2728"),
      div(
        { class: "wa-welcome-title" },
        computed(() => webllmLoading.get() ? "Setting up…" : "How can I help?"),
      ),
      div(
        { class: "wa-welcome-desc" },
        computed(() => webllmLoading.get()
          ? "Your local model is being prepared. You can type once it finishes."
          : "Ask me anything. I can use the tools available on this page."
        ),
      ),
    );

    // Single message element (used by For)
    function createMessageEl(msg: ChatMessage) {
      const roleClass = computed(() => `wa-msg wa-msg--${msg.role}`);
      const msgEl = div({ class: roleClass });
      const contentSpan = span({}, msg.content);
      msgEl.append(contentSpan);

      // Inline tool call cards
      if (msg.toolCalls && msg.toolCalls.length > 0) {
        for (const tc of msg.toolCalls) {
          const statusClass = computed(() => `wa-tool-card-status wa-tool-card-status--${tc.status}`);
          const toolCard = div(
            { class: "wa-tool-card" },
            div(
              { class: "wa-tool-card-header" },
              span({ class: "wa-tool-card-name" }, tc.name),
              span({ class: statusClass }, tc.status),
            ),
          );
          msgEl.append(toolCard);
        }
      }

      return msgEl;
    }

    // Single pending call element
    function createPendingCallEl(call: PendingCall) {
      const toolNameSpan = span({}, `Allow ${call.toolName}?`);
      const inputJson = pre(
        { class: "wa-confirm-card-input" },
        JSON.stringify(call.input, null, 2),
      );
      const approveBtn = button(
        {
          class: "wa-btn wa-btn--approve",
          part: "approve-button",
          onclick: () => self.approveCall(call.id),
        },
        "Allow",
      );
      const rejectBtn = button(
        {
          class: "wa-btn wa-btn--reject",
          part: "reject-button",
          onclick: () => self.rejectCall(call.id),
        },
        "Deny",
      );

      return div(
        { class: "wa-confirm-card", part: "pending-card" },
        div(
          { class: "wa-confirm-card-title" },
          span({ class: "wa-icon" }, "\u26A0"),
          toolNameSpan,
        ),
        inputJson,
        div({ class: "wa-confirm-actions" }, approveBtn, rejectBtn),
      );
    }

    // Typing indicator
    const typingEl = div(
      { class: "wa-typing" },
      span({ class: "wa-typing-dot" }),
      span({ class: "wa-typing-dot" }),
      span({ class: "wa-typing-dot" }),
    );

    // Messages empty state (if no messages, show welcome)
    const messagesEmptyState = When(
      computed(() => !!currentProvider.get()),
      welcomeWithProvider,
      welcomeNoProvider,
    );

    // Messages list using For
    const messagesList = div(
      { class: "wa-messages-list" },
      For(messages, createMessageEl),
    );

    // Pending calls list using For
    const pendingCallsList = div(
      { class: "wa-pending-list" },
      For(pendingCalls, createPendingCallEl),
    );

    // Messages container that conditionally shows empty state or messages
    const messagesContainer = div(
      { class: "wa-messages-container" },
      messagesEmptyState,
      messagesList,
      pendingCallsList,
      Show(isProcessing, typingEl),
      webllmBanner,
    );

    // Scroll to bottom when messages change
    effect(() => {
      messages.get();
      pendingCalls.get();
      messagesEl.scrollTop = messagesEl.scrollHeight;
    });

    messagesEl.append(messagesContainer);

    // ---- Input ----
    const chatInput = input({
      class: "wa-input",
      type: "text",
      placeholder: "Message the agent\u2026",
    }) as HTMLInputElement;
    const sendBtn = button(
      {
        class: "wa-send-btn",
        onclick: () => {
          const t = chatInput.value;
          if (t.trim()) {
            self.sendMessage(t);
            chatInput.value = "";
          }
        },
      },
      "\u2191",
    );
    effect(() => {
      sendBtn.disabled = isProcessing.get();
    });
    chatInput.addEventListener("keydown", (e: KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey && !isProcessing.get()) {
        e.preventDefault();
        const t = chatInput.value;
        if (t.trim()) {
          self.sendMessage(t);
          chatInput.value = "";
        }
      }
    });

    const chatArea = div(
      { class: "wa-chat", part: "chat" },
      messagesEl,
      div({ class: "wa-input-area" }, chatInput, sendBtn),
    );

    // ---- Settings overlay ----
    const settingsEndpoint = input({
      class: "wa-field-input",
      type: "text",
      placeholder: "https://api.openai.com/v1/chat/completions",
    }) as HTMLInputElement;
    const settingsApiKey = input({
      class: "wa-field-input",
      type: "password",
      placeholder: "sk-...",
    }) as HTMLInputElement;
    const settingsModel = input({
      class: "wa-field-input",
      type: "text",
      placeholder: "gpt-4o",
      value: "gpt-4o",
    }) as HTMLInputElement;
    const settingsAccessMode = select(
      { class: "wa-field-input" },
      option({ value: "api" }, "API (OpenAI-compatible)"),
      option({ value: "browser" }, "Browser AI (Chrome 127+)"),
      option({ value: "webllm" }, "WebLLM (local, in-browser)"),
    ) as HTMLSelectElement;
    settingsAccessMode.addEventListener("change", () => {
      selectedAccessMode.set(settingsAccessMode.value as AccessMode);
      webllmError.set("");
    });

    const webllmModelSelect = select(
      { class: "wa-field-input" },
    ) as HTMLSelectElement;

    // Update webllm model options reactively
    effect(() => {
      const models = webllmAvailableModels.get();
      while (webllmModelSelect.firstChild) {
        webllmModelSelect.removeChild(webllmModelSelect.firstChild);
      }
      for (const m of models) {
        const opt = document.createElement("option");
        opt.value = m.model_id;
        opt.textContent = m.model_id;
        webllmModelSelect.appendChild(opt);
      }
      if (models.length > 0 && !selectedWebLLMModelId.get()) {
        selectedWebLLMModelId.set(models[0].model_id);
      }
      if (selectedWebLLMModelId.get()) {
        webllmModelSelect.value = selectedWebLLMModelId.get();
      }
    });

    // Trigger WebLLM load on first access mode selection
    effect(() => {
      if (selectedAccessMode.get() === "webllm") {
        if (!cachedWebLLM && !cachedWebLLMPromise) {
          ensureWebLLM();
        }
      }
    });

    // API settings fields
    const apiSettings = div(
      { class: "wa-field" },
      label({ class: "wa-field-label" }, "API Endpoint"),
      settingsEndpoint,
      div(
        { class: "wa-field-hint" },
        "Any OpenAI-compatible endpoint (OpenAI, Groq, Together, Ollama, etc.)",
      ),
    );
    const apiKeySettings = div(
      { class: "wa-field" },
      label({ class: "wa-field-label" }, "API Key"),
      settingsApiKey,
    );
    const apiModelSettings = div(
      { class: "wa-field" },
      label({ class: "wa-field-label" }, "Model"),
      settingsModel,
    );

    // Browser AI settings - always render, Show controls visibility
    const browserAIBtn = button(
      {
        class: "wa-welcome-btn wa-welcome-btn--primary",
        style: "width: 100%;",
        onclick: () => {
          self.configureBuiltInAI();
          showSettings.set(false);
        },
      },
      "Use Browser Built-in AI",
    );
    const browserAIHint = div(
      { class: "wa-field-hint" },
      "Browser Built-in AI not available (requires Chrome 127+)",
    );
    const browserAIAvailable = div(
      { class: "wa-field" },
      browserAIBtn,
      browserAIHint,
    );

    // WebLLM runtime loading spinner
    const webllmRuntimeLoading = div(
      { class: "wa-loader", style: "width: 100%; margin: 0;" },
      div({ class: "wa-loader-title" }, "⚙ Loading WebLLM runtime"),
      div(
        { class: "wa-loader-text" },
        "Fetching the in-browser ML runtime (only done once per session)…",
      ),
      div({ class: "wa-loader-spinner" }),
    );

    // WebLLM model downloading
    const webllmModelDownloading = div(
      { class: "wa-loader", style: "width: 100%; margin: 0;" },
      div({ class: "wa-loader-title" }, "⬇ Downloading model"),
      div(
        { class: "wa-loader-text" },
        computed(() => webllmProgressText.get() || "Preparing model…"),
      ),
      div(
        { class: "wa-progress-track" },
        div(
          { class: "wa-progress-fill" },
        ),
      ),
    );

    // Update progress bar reactively
    effect(() => {
      const pct = webllmProgress.get();
      const fill = webllmModelDownloading.querySelector(".wa-progress-fill") as HTMLElement;
      if (fill) {
        fill.style.width = `${Math.max(0, Math.min(100, pct * 100))}%`;
      }
    });

    // WebLLM error
    const webllmErrorEl = div(
      { class: "wa-loader wa-loader--error", style: "width: 100%; margin: 0;" },
      div({ class: "wa-loader-title" }, "⚠ WebLLM runtime failed to load"),
      div(
        { class: "wa-loader-text" },
        computed(() => webllmError.get()),
      ),
    );

    // WebLLM model selector
    const webllmModelSelector = div(
      { class: "wa-field" },
      label({ class: "wa-field-label" }, "Model"),
      webllmModelSelect,
      div(
        { class: "wa-field-hint" },
        "The selected model will be downloaded and cached locally on first use.",
      ),
    );

    // WebLLM unavailable
    const webllmUnavailable = div(
      { class: "wa-field-hint" },
      "WebLLM prebuilt models are not available in this environment.",
    );

    // WebLLM settings content - nested Show components for state machine
    // Note: Show returns ReactiveRange which div() handles via insertChildBefore
    const webllmSettingsContent = div(
      {},
      // Runtime loading spinner
      Show(
        computed(() => !webllmModuleReady.get() && !webllmError.get()),
        webllmRuntimeLoading,
      ),
      // Model downloading progress
      Show(
        computed(() => webllmLoading.get() && webllmModuleReady.get()),
        webllmModelDownloading,
      ),
      // Error state
      Show(
        computed(() => webllmModuleReady.get() && !!webllmError.get()),
        webllmErrorEl,
      ),
      // Model selector (when ready and no error)
      Show(
        computed(() => webllmModuleReady.get() && !webllmError.get() && webllmAvailableModels.get().length > 0),
        webllmModelSelector,
      ),
      // Unavailable message (when ready, no error, but no models)
      Show(
        computed(() => webllmModuleReady.get() && !webllmError.get() && webllmAvailableModels.get().length === 0),
        webllmUnavailable,
      ),
    );

    // Settings body based on access mode
    const settingsBody = div(
      { class: "wa-settings-body" },
      div(
        { class: "wa-field" },
        label({ class: "wa-field-label" }, "接入方式"),
        settingsAccessMode,
        div(
          { class: "wa-field-hint" },
          "Choose how the agent connects to a language model.",
        ),
      ),
      // API settings
      Show(
        computed(() => selectedAccessMode.get() === "api"),
        div({}, apiSettings, apiKeySettings, apiModelSettings),
      ),
      // Browser settings
      Show(
        computed(() => selectedAccessMode.get() === "browser"),
        browserAIAvailable,
      ),
      // WebLLM settings
      Show(
        computed(() => selectedAccessMode.get() === "webllm"),
        webllmSettingsContent,
      ),
    );

    // Settings overlay with header
    const settingsOverlay = div(
      { class: "wa-settings-overlay" },
      div(
        { class: "wa-settings-header" },
        div({ class: "wa-settings-title" }, "Settings"),
        button(
          {
            class: "wa-icon-btn",
            onclick: () => showSettings.set(false),
            "aria-label": "Close settings",
          },
          "\u2715",
        ),
      ),
      settingsBody,
      div(
        { class: "wa-settings-actions" },
        button(
          {
            class: "wa-btn wa-btn--approve",
            style: "flex: 1;",
            onclick: () => {
              const mode = selectedAccessMode.get() as AccessMode;
              if (mode === "api") {
                const ep = settingsEndpoint.value.trim();
                const key = settingsApiKey.value.trim();
                const model = settingsModel.value.trim() || "gpt-4o";
                if (ep && key) {
                  self.configureOpenAI({ endpoint: ep, apiKey: key, model });
                  showSettings.set(false);
                }
              } else if (mode === "browser") {
                self.configureBuiltInAI();
                showSettings.set(false);
              } else if (mode === "webllm") {
                const modelId = (webllmModelSelect.value || selectedWebLLMModelId.get() || "").trim();
                if (modelId) {
                  selectedWebLLMModelId.set(modelId);
                  self.configureWebLLM({ modelId });
                  showSettings.set(false);
                }
              }
            },
          },
          "Connect",
        ),
      ),
    );

    // Show/hide settings overlay reactively
    effect(() => {
      settingsOverlay.style.display = showSettings.get() ? "" : "none";
    });

    // ---- Panel ----
    const panel = div(
      { class: "wa-panel", part: "panel" },
      computed(() => {
        if (!webMCPSupported.get())
          return div(
            { class: "wa-unsupported", part: "unsupported" },
            "WebMCP is not available in this browser. Please use Chrome 146+ or enable the WebMCP flag.",
          );
        return [header, chatArea, settingsOverlay];
      }),
    );

    // ---- Reactive data attributes ----
    effect(() => {
      self.dataset.layout = self.$layout.get();
    });
    effect(() => {
      self.dataset.position = self.$position.get();
    });
    effect(() => {
      panel.dataset.display = self.$display.get();
    });

    // ---- Post-mount ----
    wirePostMount(self);
    return panel;
  },
});

function wirePostMount(self: any): void {
  effect(() => {
    syncTheme(self, self.$theme.get());
  });
  const unwatchSystem = watchPrefersColorScheme(() => {
    if (self.theme === "auto") syncTheme(self, "auto");
  });
  const unwatchPage = watchPageTheme(() => {
    if (self.theme === "auto") syncTheme(self, "auto");
  });

  let unlistenToolChange: (() => void) | null = null;
  const mc = getMC();
  if (mc) {
    const handler = () => {
      syncToolsFromWebMCP();
    };
    mc.addEventListener("toolchange", handler);
    unlistenToolChange = () => mc.removeEventListener("toolchange", handler);
    // Initial sync
    syncToolsFromWebMCP();
  }

  registerDisposable(self, () => {
    unwatchSystem();
    unwatchPage();
    unlistenToolChange?.();
    unregisterAllManualTools();
    pendingCalls.set([]);
    callLog.set([]);
    messages.set([]);
  });
}

export { RikkaWebAgent };
export type { RikkaWebAgent as WebAgentElement };
