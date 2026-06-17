/**
 * Find and parse resource data from the DOM.
 * Supports all rikka-site hydration strategies.
 */
export function findResourceData<T = unknown>(el?: Element): T | null {
  // Strategy 1: data-attr — element-local
  if (el) {
    const dataAttr = el.getAttribute("data-resource");
    if (dataAttr) {
      try { return JSON.parse(dataAttr) as T; } catch { /* fall through */ }
    }
  }

  // Strategy 2: dsdom — inside declarative shadow DOM
  if (el) {
    const tmpl = el.querySelector("template[shadowrootmode]") as HTMLTemplateElement | null;
    if (tmpl) {
      const dsScript = tmpl.content.querySelector('script[type="application/json"]');
      if (dsScript?.textContent) {
        try { return JSON.parse(dsScript.textContent) as T; } catch { /* fall through */ }
      }
    }
  }

  // Strategy 3: jsonld — global script tag
  const jsonLdScript = document.querySelector('script[type="application/ld+json"]');
  if (jsonLdScript?.textContent) {
    try {
      const parsed = JSON.parse(jsonLdScript.textContent);
      return ((parsed as Record<string, unknown>)["@graph"] ?? parsed) as T;
    } catch { /* fall through */ }
  }

  return null;
}

/**
 * Async version that also tries fetching data from the server.
 */
export async function findResourceDataAsync<T = unknown>(el?: Element): Promise<T | null> {
  const syncResult = findResourceData<T>(el);
  if (syncResult !== null) return syncResult;

  try {
    const resp = await fetch(
      `${window.location.pathname}?accept=json`,
      { headers: { Accept: "application/json" } },
    );
    if (!resp.ok) return null;
    return (await resp.json()) as T;
  } catch {
    return null;
  }
}
