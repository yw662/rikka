/** A single route entry in the sitemap */
export interface RouteEntry {
  path: string;
  kind: string;
  element: string;
  children?: RouteEntry[];
}

/** The full sitemap structure */
export interface Sitemap {
  routes: RouteEntry[];
}

/** Matched route result */
export interface RouteMatch {
  route: RouteEntry;
  params: Record<string, string>;
}

/**
 * Match a URL path against the sitemap.
 */
export function matchRoute(sitemap: Sitemap, path: string): RouteMatch | null {
  const segments = path.split("/").filter(Boolean);
  return matchRoutes(sitemap.routes, segments, {});
}

function matchRoutes(
  routes: RouteEntry[],
  segments: string[],
  params: Record<string, string>,
): RouteMatch | null {
  if (segments.length === 0) return null;
  const [next, ...rest] = segments;

  for (const route of routes) {
    const routeSegments = route.path.split("/").filter(Boolean);
    const firstSeg = routeSegments[0];

    // Exact match
    if (firstSeg === next) {
      if (routeSegments.length === 1 && rest.length === 0) {
        return { route, params };
      }
      if (routeSegments.length === 1 && route.children) {
        const childMatch = matchRoutes(route.children, rest, params);
        if (childMatch) return childMatch;
      }
    }

    // Parameterized match
    if (firstSeg?.startsWith(":")) {
      const paramName = firstSeg.slice(1);
      const newParams = { ...params, [paramName]: next };
      if (routeSegments.length === 1 && rest.length === 0) {
        return { route, params: newParams };
      }
      if (routeSegments.length === 1 && route.children) {
        const childMatch = matchRoutes(route.children, rest, newParams);
        if (childMatch) return childMatch;
      }
    }
  }

  return null;
}

/**
 * Read the sitemap from a <script type="application/json" data-sitemap> tag.
 */
export function readSitemapFromDom(): Sitemap | null {
  const script = document.querySelector('script[type="application/json"][data-sitemap]');
  if (!script?.textContent) return null;
  try { return JSON.parse(script.textContent) as Sitemap; } catch { return null; }
}

export interface NavigateOptions {
  transition?: boolean;
}

/**
 * Navigate to a URL using View Transition API.
 */
export function navigate(path: string, sitemap: Sitemap, opts?: NavigateOptions): void {
  const useTransition = opts?.transition !== false && "startViewTransition" in document;

  const doNavigation = () => {
    fetch(path, { headers: { Accept: "text/html" } })
      .then((resp) => {
        if (!resp.ok) { window.location.href = path; return; }
        return resp.text();
      })
      .then((html) => {
        if (!html) return;
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");

        const newResource = doc.querySelector("[data-resource], [path]");
        const currentResource = document.querySelector("[data-resource], [path]");

        if (newResource && currentResource) {
          const clone = document.importNode(newResource, true);
          currentResource.replaceWith(clone);
        } else {
          document.body.innerHTML = doc.body.innerHTML;
        }

        const title = doc.querySelector("title");
        if (title) document.title = title.textContent ?? "";
        window.history.pushState({}, "", path);
      })
      .catch(() => { window.location.href = path; });
  };

  if (useTransition) {
    (document as any).startViewTransition(doNavigation);
  } else {
    doNavigation();
  }
}

export interface Router {
  sitemap: Sitemap;
  match(path: string): RouteMatch | null;
  navigate(path: string, opts?: NavigateOptions): void;
  start(): void;
  stop(): void;
}

/**
 * Create a client-side router from a sitemap.
 */
export function createRouter(sitemap: Sitemap): Router {
  let clickHandler: ((e: MouseEvent) => void) | null = null;

  return {
    sitemap,
    match(path: string) { return matchRoute(sitemap, path); },
    navigate(path: string, opts?: NavigateOptions) { navigate(path, sitemap, opts); },

    start() {
      clickHandler = (e: MouseEvent) => {
        if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
        const anchor = (e.target as Element).closest("a");
        if (!anchor) return;
        const href = anchor.getAttribute("href");
        if (!href || href.startsWith("#") || href.startsWith("mailto:")) return;
        try {
          const url = new URL(href, window.location.origin);
          if (url.origin !== window.location.origin) return;
        } catch { return; }
        e.preventDefault();
        navigate(href, sitemap);
      };
      document.addEventListener("click", clickHandler);
      window.addEventListener("popstate", () => {
        navigate(window.location.pathname, sitemap, { transition: false });
      });
    },

    stop() {
      if (clickHandler) {
        document.removeEventListener("click", clickHandler);
        clickHandler = null;
      }
    },
  };
}
