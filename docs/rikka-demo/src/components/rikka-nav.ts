import { defineElement, css } from "@rikka/elements";
import { div, nav, a, span } from "@rikka/dom";
import { signal, effect } from "@rikka/signal";
import { getPathFromHash } from "../shared/styles";

const navStyles = css`
  :host {
    display: block;
  }
  .main-nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 2rem;
    background: rgba(26, 26, 46, 0.95);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid #334155;
    position: sticky;
    top: 0;
    z-index: 100;
  }
  .nav-brand {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1.5rem;
    font-weight: 700;
    cursor: pointer;
    text-decoration: none;
    transition: all 0.3s ease;
  }
  .nav-brand .logo {
    color: #6366f1;
    font-size: 1.75rem;
    transition: transform 0.3s ease;
  }
  .nav-brand:hover .logo {
    transform: rotate(15deg) scale(1.1);
  }
  .nav-brand .brand-text {
    background: linear-gradient(135deg, #6366f1, #ec4899);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    transition: all 0.3s ease;
  }
  .nav-brand.active .brand-text {
    background: linear-gradient(135deg, #a78bfa, #f472b6);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .nav-links {
    display: flex;
    gap: 0.25rem;
  }
  .nav-link {
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    font-weight: 500;
    color: #94a3b8;
    cursor: pointer;
    text-decoration: none;
    transition: all 0.2s ease;
    position: relative;
  }
  .nav-link::after {
    content: "";
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 2px;
    background: linear-gradient(90deg, #6366f1, #a78bfa);
    border-radius: 1px;
    transition: width 0.3s ease;
  }
  .nav-link:hover {
    color: #e2e8f0;
    background: rgba(99, 102, 241, 0.08);
  }
  .nav-link:hover::after {
    width: 80%;
  }
  .nav-link.active {
    color: #a78bfa;
    background: rgba(99, 102, 241, 0.12);
    font-weight: 600;
  }
  .nav-link.active::after {
    width: 100%;
  }
  .nav-actions {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  .github-link {
    padding: 0.5rem 1rem;
    border: 1px solid #334155;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    font-weight: 500;
    color: #e2e8f0;
    text-decoration: none;
    transition: all 0.25s ease;
  }
  .github-link:hover {
    border-color: #6366f1;
    box-shadow: 0 0 20px rgba(99, 102, 241, 0.2);
    transform: translateY(-1px);
  }
  @media (max-width: 768px) {
    .main-nav {
      flex-wrap: wrap;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
    }
    .nav-links {
      order: 3;
      width: 100%;
      justify-content: center;
    }
  }
`;

const navRoutes = [
  { label: "Home", path: "/" },
  { label: "Docs", path: "/docs" },
  { label: "Examples", path: "/examples" },
  { label: "Showcases", path: "/showcases" },
];

function isActive(currentPath: string, routePath: string): boolean {
  if (routePath === "/") return currentPath === "/";
  return currentPath === routePath || currentPath.startsWith(routePath + "/");
}

const RikkaNav = defineElement(
  "rikka-nav",
  {
    styles: navStyles,
    render() {
      const currentPath = signal(getPathFromHash());

      const brand = a(
        {
          class: "nav-brand",
          href: "#/",
        },
        span({ class: "logo" }, "◈"),
        span({ class: "brand-text" }, "Rikka"),
      );

      const linksContainer = div({ class: "nav-links" });

      const actions = div(
        { class: "nav-actions" },
        a(
          {
            href: "https://github.com/project-rikka",
            target: "_blank",
            rel: "noopener noreferrer",
            class: "github-link",
          },
          "⭐ GitHub",
        ),
      );

      effect(() => {
        const path = currentPath.get();

        brand.className = `nav-brand${isActive(path, "/") ? " active" : ""}`;

        const links = navRoutes.map((route) =>
          a(
            {
              class: `nav-link ${isActive(path, route.path) ? "active" : ""}`,
              href: `#${route.path}`,
            },
            route.label,
          ),
        );
        linksContainer.replaceChildren(...links);
      });

      window.addEventListener("hashchange", () => {
        currentPath.set(getPathFromHash());
      });

      return nav({ class: "main-nav" }, brand, linksContainer, actions);
    },
  },
);

export { RikkaNav };
