/**
 * rikka-site client-side HTTP helpers.
 *
 * These wrappers assume the server is the same origin and speaks JSON.
 * They are exposed via the SDK as `window.__rikka.apiGet`, `apiPost`, etc.
 */

export interface ApiRequestInit extends Omit<RequestInit, "body" | "method"> {}

/**
 * Error thrown when an API response is not OK.
 */
export class ApiError extends Error {
  readonly response: Response;
  readonly status: number;
  readonly details: string | null;

  constructor(response: Response, details: string | null) {
    const message = details
      ? `API ${response.status} ${response.statusText}: ${details}`
      : `API ${response.status} ${response.statusText}`;
    super(message);
    this.name = "ApiError";
    this.response = response;
    this.status = response.status;
    this.details = details;
  }
}

async function extractErrorMessage(response: Response): Promise<string | null> {
  const contentType = response.headers.get("content-type") ?? "";
  try {
    if (contentType.includes("application/json")) {
      const body = (await response.json()) as Record<string, unknown>;
      return String(body.message ?? body.error ?? body.detail ?? JSON.stringify(body));
    }
    const text = await response.text();
    return text || null;
  } catch {
    return null;
  }
}

/**
 * Perform a typed JSON request.
 */
export async function apiRequest<T>(
  path: string,
  method: string,
  body?: unknown,
  init: ApiRequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  const requestInit: RequestInit = {
    ...init,
    method,
    headers,
  };

  if (body !== undefined) {
    if (
      body instanceof FormData ||
      body instanceof URLSearchParams ||
      body instanceof Blob ||
      body instanceof ArrayBuffer ||
      (typeof body === "string")
    ) {
      requestInit.body = body as BodyInit;
    } else {
      if (!headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
      }
      requestInit.body = JSON.stringify(body);
    }
  }

  const response = await fetch(path, requestInit);
  if (!response.ok) {
    throw new ApiError(response, await extractErrorMessage(response));
  }

  // DELETE / 204 No Content
  if (response.status === 204 || response.headers.get("content-length") === "0") {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export function apiGet<T>(path: string, init?: ApiRequestInit): Promise<T> {
  return apiRequest<T>(path, "GET", undefined, init);
}

export function apiPost<T>(
  path: string,
  body: unknown,
  init?: ApiRequestInit,
): Promise<T> {
  return apiRequest<T>(path, "POST", body, init);
}

export function apiPut<T>(
  path: string,
  body: unknown,
  init?: ApiRequestInit,
): Promise<T> {
  return apiRequest<T>(path, "PUT", body, init);
}

export function apiPatch<T>(
  path: string,
  body: unknown,
  init?: ApiRequestInit,
): Promise<T> {
  return apiRequest<T>(path, "PATCH", body, init);
}

export function apiDelete(path: string, init?: ApiRequestInit): Promise<void> {
  return apiRequest<void>(path, "DELETE", undefined, init);
}
