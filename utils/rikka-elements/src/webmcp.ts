/// <reference path="./webmcp.d.ts" />

// ---------------------------------------------------------------------------
// WebMCP integration for defineElement
// ---------------------------------------------------------------------------

/**
 * Get a stable CSS-selector-like path from the element to document.body.
 * Includes id, aria-label, role, and nth-of-type for disambiguation.
 */
export function getDomPath(el: HTMLElement): string {
  const parts: string[] = [];
  let current: HTMLElement | null = el;
  while (
    current &&
    current !== document.body &&
    current !== document.documentElement
  ) {
    let selector = current.tagName.toLowerCase();
    if (current.id) {
      selector += `#${CSS.escape(current.id)}`;
    } else {
      const parent = current.parentElement;
      if (parent) {
        const siblings = Array.from(parent.children).filter(
          (c) => c.tagName === current!.tagName,
        );
        if (siblings.length > 1) {
          const index = siblings.indexOf(current) + 1;
          selector += `:nth-of-type(${index})`;
        }
      }
    }
    const ariaLabel = current.getAttribute("aria-label");
    if (ariaLabel) selector += `[aria-label=${JSON.stringify(ariaLabel)}]`;
    const role = current.getAttribute("role");
    if (role) selector += `[role=${JSON.stringify(role)}]`;

    parts.unshift(selector);
    current = current.parentElement;
  }
  return parts.join(" > ");
}

// ---------------------------------------------------------------------------
// Instance registry (per tagName)
// ---------------------------------------------------------------------------

interface InstanceRegistry {
  instances: Set<HTMLElement>;
  domPathMap: Map<string, WeakRef<HTMLElement>>;
}

const registries = new Map<string, InstanceRegistry>();

function getOrCreateRegistry(tagName: string): InstanceRegistry {
  let registry = registries.get(tagName);
  if (!registry) {
    registry = { instances: new Set(), domPathMap: new Map() };
    registries.set(tagName, registry);
  }
  return registry;
}

export function registerInstance(tagName: string, el: HTMLElement): string {
  const registry = getOrCreateRegistry(tagName);
  registry.instances.add(el);
  const path = getDomPath(el);
  registry.domPathMap.set(path, new WeakRef(el));
  return path;
}

export function unregisterInstance(tagName: string, el: HTMLElement): void {
  const registry = registries.get(tagName);
  if (!registry) return;
  registry.instances.delete(el);
  // domPathMap entries with dead WeakRefs are cleaned lazily in resolveInstance
}

/**
 * Resolve a target instance for a given tagName.
 *
 * - If `target` (a DOM path) is provided, look it up in the path map.
 * - If no target and only one connected instance exists, return it.
 * - If no target and multiple instances exist, return null (caller should
 *   report available instances so the agent can disambiguate).
 */
export function resolveInstance(
  tagName: string,
  target?: string,
): HTMLElement | null {
  const registry = registries.get(tagName);
  if (!registry) return null;

  if (target) {
    const ref = registry.domPathMap.get(target);
    if (ref) {
      const el = ref.deref();
      if (el && el.isConnected) return el;
      registry.domPathMap.delete(target);
    }
    return null;
  }

  // No target specified — collect connected instances
  const active: HTMLElement[] = [];
  for (const el of registry.instances) {
    if (el.isConnected) active.push(el);
  }
  if (active.length === 1) return active[0];
  return null;
}

/**
 * List all connected instances with their DOM paths.
 * Used when multiple instances exist and the agent needs to disambiguate.
 */
export function listInstances(
  tagName: string,
): { domPath: string; id: string | null; label: string | null }[] {
  const registry = registries.get(tagName);
  if (!registry) return [];
  const result: { domPath: string; id: string | null; label: string | null }[] =
    [];
  for (const el of registry.instances) {
    if (!el.isConnected) continue;
    const path = getDomPath(el);
    // Refresh the WeakRef
    registry.domPathMap.set(path, new WeakRef(el));
    result.push({
      domPath: path,
      id: el.id || null,
      label: el.getAttribute("aria-label") || el.getAttribute("title") || null,
    });
  }
  return result;
}

// ---------------------------------------------------------------------------
// WebMCP access helper
// ---------------------------------------------------------------------------

export function getModelContext(): ModelContext | null {
  if (typeof document !== "undefined" && "modelContext" in document) {
    return (document as unknown as { modelContext: ModelContext }).modelContext;
  }
  if (typeof navigator !== "undefined" && "modelContext" in navigator) {
    return (navigator as unknown as { modelContext: ModelContext })
      .modelContext;
  }
  return null;
}

export function isWebMCPSupported(): boolean {
  return getModelContext() !== null;
}

// ---------------------------------------------------------------------------
// Tool definition types
// ---------------------------------------------------------------------------

export interface ToolDefinition<TInstance = HTMLElement> {
  description: string;
  inputSchema?: object;
  execute: (
    instance: TInstance,
    input: Record<string, unknown>,
    client: ModelContextClient,
  ) => Promise<unknown>;
  readOnlyHint?: boolean;
  untrustedContentHint?: boolean;
  requireConfirmation?: boolean;
}

export interface ToolContextMapping {
  [key: string]: string; // e.g. { label: "$label", value: "$count" }
}

// ---------------------------------------------------------------------------
// WebMCP tool registration (class-level, called once per tagName)
// ---------------------------------------------------------------------------

const registeredTagTools = new Set<string>();

/**
 * Register all tools for a tagName to WebMCP.
 * Called once when the custom element class is defined.
 * Tools are registered with name `${tagName}__${toolName}`.
 */
export function registerToolsToWebMCP(
  tagName: string,
  tools: Record<string, ToolDefinition>,
): void {
  const mc = getModelContext();
  if (!mc) return;

  for (const [toolName, toolDef] of Object.entries(tools)) {
    const fullToolName = `${tagName}__${toolName}`;
    if (registeredTagTools.has(fullToolName)) continue;
    registeredTagTools.add(fullToolName);

    const needConfirm =
      toolDef.requireConfirmation !== false && !toolDef.readOnlyHint;

    mc.registerTool({
      name: fullToolName,
      description: toolDef.description,
      inputSchema: toolDef.inputSchema,
      annotations: {
        readOnlyHint: toolDef.readOnlyHint ?? false,
        untrustedContentHint: toolDef.untrustedContentHint ?? false,
      },
      execute: needConfirm
        ? async (input: object, client: ModelContextClient) => {
            // Try native elicit first
            if (client.elicit) {
              const result = await client.elicit({
                message: `Allow "${fullToolName}" with input ${JSON.stringify(input)}?`,
                type: "confirmation",
              });
              if (result.action !== "accept") {
                return { content: [{ type: "text", text: "User rejected" }] };
              }
            }
            return executeWithInstance(
              tagName,
              toolDef,
              input as Record<string, unknown>,
              client,
            );
          }
        : async (input: object, client: ModelContextClient) => {
            return executeWithInstance(
              tagName,
              toolDef,
              input as Record<string, unknown>,
              client,
            );
          },
    });
  }
}

async function executeWithInstance(
  tagName: string,
  toolDef: ToolDefinition,
  input: Record<string, unknown>,
  client: ModelContextClient,
): Promise<unknown> {
  const target = typeof input.target === "string" ? input.target : undefined;
  const instance = resolveInstance(tagName, target);

  if (!instance) {
    const instances = listInstances(tagName);
    if (instances.length === 0) {
      return {
        content: [
          { type: "text", text: `No active ${tagName} instance found` },
        ],
      };
    }
    const list = instances
      .map(
        (inst, i) =>
          `${inst.id ? `#${inst.id}` : `instance ${i + 1}`} at ${inst.domPath}${inst.label ? ` (${inst.label})` : ""}`,
      )
      .join("\n");
    return {
      content: [
        {
          type: "text",
          text: `Multiple ${tagName} instances found. Please specify "target" with one of:\n${list}`,
        },
      ],
    };
  }

  return toolDef.execute(instance, input, client);
}

// ---------------------------------------------------------------------------
// Context provision (instance-level, called per connectedCallback)
// ---------------------------------------------------------------------------

/**
 * Provide WebMCP context for a specific element instance.
 * Uses effect() internally so Signal-backed values update reactively.
 *
 * Returns a dispose function to clean up on disconnectedCallback.
 */
export function provideInstanceContext(
  tagName: string,
  el: HTMLElement,
  domPath: string,
  toolContext: ToolContextMapping | undefined,
  effectFn: (fn: () => void) => (() => void) | void,
): () => void {
  const mc = getModelContext();
  if (!mc) return () => {};

  if (!toolContext || Object.keys(toolContext).length === 0) return () => {};

  const contextName = `${tagName}@${domPath}`;

  const dispose = effectFn(() => {
    const content: Record<string, unknown> = { domPath };
    const record = el as unknown as Record<string, unknown>;

    for (const [key, source] of Object.entries(toolContext)) {
      if (source.startsWith("$")) {
        const signalLike = record[source];
        if (
          signalLike &&
          typeof (signalLike as { get?: unknown }).get === "function"
        ) {
          content[key] = (signalLike as { get(): unknown }).get();
        }
      } else {
        content[key] = record[source];
      }
    }

    mc.provideContext({
      name: contextName,
      description: `${tagName} instance`,
      content,
    });
  });

  return typeof dispose === "function" ? dispose : () => {};
}
