/**
 * @module kind
 * Resource kinds — define the HTTP semantics each resource type must satisfy.
 *
 * | Kind       | GET     | POST  | PUT    | PATCH  | DELETE | Description          |
 * |------------|---------|-------|--------|--------|--------|----------------------|
 * | Collection | list    | create| —      | —      | —      | Resource collection  |
 * | Item       | content | —     | replace| patch  | delete | Collection member    |
 * | Singleton  | content | —     | replace| patch  | —      | Globally unique      |
 * | ReadOnly   | content | —     | —      | —      | —      | Read-only view       |
 * | Action     | —       | invoke| —      | —      | —      | Stateless operation  |
 * | Proxy      | get     | post  | put    | patch  | delete | Transparent proxy    |
 */

/**
 * The set of all resource kinds.
 */
export type Kind =
  | "Collection"
  | "Item"
  | "Singleton"
  | "ReadOnly"
  | "Action"
  | "Proxy";

/**
 * HTTP methods that each kind permits.
 */
export const KindMethods: Record<Kind, ReadonlySet<string>> = {
  Collection: new Set(["GET", "POST"]),
  Item: new Set(["GET", "PUT", "PATCH", "DELETE"]),
  Singleton: new Set(["GET", "PUT", "PATCH"]),
  ReadOnly: new Set(["GET"]),
  Action: new Set(["POST"]),
  Proxy: new Set(["GET", "POST", "PUT", "PATCH", "DELETE"]),
};

/**
 * The operation names each kind permits.
 */
export const KindOperations: Record<Kind, ReadonlySet<string>> = {
  Collection: new Set(["list", "create"]),
  Item: new Set(["content", "replace", "patch", "delete"]),
  Singleton: new Set(["content", "replace", "patch"]),
  ReadOnly: new Set(["content"]),
  Action: new Set(["invoke"]),
  Proxy: new Set(["get", "post", "put", "patch", "delete"]),
};

/**
 * Check whether a kind permits a given HTTP method.
 */
export function kindAllowsMethod(kind: Kind, method: string): boolean {
  return KindMethods[kind].has(method.toUpperCase());
}

/**
 * Check whether a kind permits a given operation.
 */
export function kindAllowsOperation(kind: Kind, operation: string): boolean {
  return KindOperations[kind].has(operation);
}
