import { defineElement, css } from "@takanashi/rikka-elements";
import { div, nav, a, span, button } from "@takanashi/rikka-dom";
import { signal, effect } from "@takanashi/rikka-signal";
import {getPathFromHash} from "../shared/helpers";

const navStyles = css`
  :host {
    display: block;
  }
  .main-nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--spacing-md) var(--spacing-xl);
    background: var(--color-nav-bg);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--color-nav-border);
    position: sticky;
    top: 0;
    z-index: var(--z-sticky);
    transition: background var(--transition-normal), border-color var(--transition-normal);
    overflow: hidden;
  }
  .nav-brand {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    font-size: 1.5rem;
    font-weight: 700;
    cursor: pointer;
    text-decoration: none;
    transition: all var(--transition-normal);
    flex-shrink: 0;
  }
  .nav-brand .logo {
    color: var(--color-primary);
    font-size: 1.75rem;
    transition: transform var(--transition-normal);
  }
  .nav-brand:hover .logo {
    transform: rotate(15deg) scale(1.1);
  }
  .nav-brand .brand-text {
    background: linear-gradient(
      135deg,
      var(--color-primary),
      var(--color-accent)
    );
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    transition: all var(--transition-normal);
  }
  .nav-brand.active .brand-text {
    background: linear-gradient(135deg, var(--color-secondary), var(--color-accent));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .nav-center {
    display: flex;
    gap: 0.25rem;
    flex-shrink: 1;
    min-width: 0;
  }
  .nav-link {
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-nav-link);
    cursor: pointer;
    text-decoration: none;
    transition: all 0.2s ease;
    position: relative;
    white-space: nowrap;
  }
  .nav-link::after {
    content: "";
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 2px;
    background: linear-gradient(90deg, var(--color-primary), var(--color-secondary));
    border-radius: 1px;
    transition: width 0.3s ease;
  }
  .nav-link:hover {
    color: var(--color-nav-link-hover);
    background: var(--color-nav-link-bg);
  }
  .nav-link:hover::after {
    width: 80%;
  }
  .nav-link.active {
    color: var(--color-nav-link-active);
    background: var(--color-nav-link-active-bg);
    font-weight: 600;
  }
  .nav-link.active::after {
    width: 100%;
  }
  .nav-actions {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-shrink: 0;
  }
  .version-badge {
    padding: 0.15rem 0.5rem;
    font-size: 0.65rem;
    font-weight: 600;
    color: var(--color-primary-light);
    background: var(--color-tag-bg);
    border: 1px solid var(--color-tag-border);
    border-radius: 9999px;
    letter-spacing: 0.02em;
    text-transform: none;
  }
  .github-link {
    padding: var(--spacing-sm) var(--spacing-md);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-text-primary);
    text-decoration: none;
    transition: all var(--transition-fast);
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
  }
  .github-link:hover {
    border-color: var(--color-primary);
    box-shadow: 0 0 20px rgba(99, 102, 241, 0.2);
    transform: translateY(-1px);
  }
  .github-link .github-icon {
    font-size: 1rem;
  }

  .hamburger {
    display: none;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 4px;
    width: 32px;
    height: 32px;
    padding: 4px;
    background: transparent;
    border: none;
    cursor: pointer;
    border-radius: var(--radius-sm);
    transition: background var(--transition-fast);
    color: var(--color-text-primary);
  }
  .hamburger:hover {
    background: var(--color-nav-link-bg);
  }
  .hamburger-line {
    width: 100%;
    height: 2px;
    background: var(--color-text-primary);
    border-radius: 1px;
    transition: all var(--transition-fast);
  }
  .hamburger[aria-expanded="true"] .hamburger-line:nth-child(1) {
    transform: translateY(6px) rotate(45deg);
  }
  .hamburger[aria-expanded="true"] .hamburger-line:nth-child(2) {
    opacity: 0;
  }
  .hamburger[aria-expanded="true"] .hamburger-line:nth-child(3) {
    transform: translateY(-6px) rotate(-45deg);
  }

  @media (max-width: 1024px) {
    .main-nav {
      padding: var(--spacing-sm) var(--spacing-lg);
      overflow: visible;
    }
    .nav-center {
      gap: 0;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: none;
      mask-image: linear-gradient(
        to right,
        transparent 0%,
        black 12px,
        calc(100% - 12px) black,
        transparent 100%
      );
      -webkit-mask-image: linear-gradient(
        to right,
        transparent 0%,
        black 12px,
        calc(100% - 12px) black,
        transparent 100%
      );
      padding-inline: 8px;
      margin-inline: -8px;
    }
    .nav-center::-webkit-scrollbar {
      display: none;
    }
    .version-badge {
      display: none;
    }
  }

  @media (max-width: 900px) {
    .main-nav {
      padding: var(--spacing-sm) var(--spacing-md);
    }
    .github-link .github-text {
      display: none;
    }
    .github-link {
      padding: var(--spacing-xs) var(--spacing-sm);
    }
    .nav-actions {
      gap: 0.5rem;
    }
  }

  @media (max-width: 640px) {
    .hamburger {
      display: flex;
    }

    .nav-center {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      flex-direction: column;
      background: var(--color-nav-bg);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      padding: calc(var(--spacing-xl) + 48px) var(--spacing-xl) var(--spacing-xl);
      gap: var(--spacing-md);
      transform: translateX(-100%);
      transition: transform var(--transition-normal);
      z-index: var(--z-fixed);
      box-shadow: var(--shadow-lg);
      overflow-y: auto;
    }

    .nav-center.active {
      display: flex;
      transform: translateX(0);
    }

    body.menu-open {
      overflow: hidden;
    }
  }

  @media (max-width: 480px) {
    .main-nav {
      padding: var(--spacing-xs) var(--spacing-md);
    }
    .nav-brand {
      font-size: 1.25rem;
    }
    .nav-brand .logo {
      font-size: 1.5rem;
    }
  }
`;

const navRoutes = [
  { label: "Home", path: "/" },
  { label: "Playground", path: "/playground" },
  { label: "Docs", path: "/docs" },
  { label: "Examples", path: "/examples" },
  { label: "Showcases", path: "/showcases" },
  { label: "Agent Skills", path: "skills/index.html", external: true },
];

function isActive(currentPath: string, routePath: string): boolean {
  if (routePath === "/") return currentPath === "/";
  return currentPath === routePath || currentPath.startsWith(routePath + "/");
}

// Signal must live outside render so it persists across re-renders
let navCurrentPath: ReturnType<typeof signal<string>> | null = null;

function getNavPathSignal(): ReturnType<typeof signal<string>> {
  if (!navCurrentPath) {
    navCurrentPath = signal(getPathFromHash());
  }
  return navCurrentPath;
}

const RikkaNav = defineElement("rikka-nav", {
  styles: navStyles,
  render() {
    const currentPath = getNavPathSignal();
    const menuOpen = signal(false);

    const toggleMenu = () => {
      const newState = !menuOpen.get();
      menuOpen.set(newState);
      document.body.classList.toggle("menu-open", newState);
    };

    const closeMenu = () => {
      if (menuOpen.get()) {
        menuOpen.set(false);
        document.body.classList.remove("menu-open");
      }
    };

    const brand = a(
      {
        class: "nav-brand",
        href: "#/",
        onclick: () => closeMenu(),
      },
      span({ class: "logo" }, "\u25c8"),
      span({ class: "brand-text" }, "Rikka"),
    );

    const hamburger = button(
      {
        class: "hamburger",
        onclick: () => toggleMenu(),
        "aria-label": "Toggle navigation",
        "aria-expanded": String(menuOpen.get()),
      },
      span({ class: "hamburger-line" }),
      span({ class: "hamburger-line" }),
      span({ class: "hamburger-line" }),
    );

    const linksContainer = div({ class: "nav-center" });

    const actions = div(
      { class: "nav-actions" },
      span({ class: "version-badge" }, "v0.1"),
      a(
        {
          href: "https://github.com/yw662/rikka/",
          target: "_blank",
          rel: "noopener noreferrer",
          class: "github-link",
          onclick: () => closeMenu(),
        },
        span({ class: "github-icon" }, "\u2b50"),
        span({ class: "github-text" }, "GitHub"),
      ),
      // 主题切换按钮
      (() => {
        const themeSwitcher = document.createElement("rikka-theme-switcher");
        return themeSwitcher;
      })(),
    );

    effect(() => {
      const path = currentPath.get();

      brand.className = `nav-brand${isActive(path, "/") ? " active" : ""}`;

      const links = navRoutes.map((route) => {
        const linkAttrs: Record<string, unknown> = {
          class: `nav-link ${!route.external && isActive(path, route.path) ? "active" : ""}`,
          onclick: () => closeMenu(),
        };
        if (route.external) {
          linkAttrs.href = route.path;
          linkAttrs.target = "_blank";
          linkAttrs.rel = "noopener noreferrer";
        } else {
          linkAttrs.href = `#${route.path}`;
        }
        return a(linkAttrs as Parameters<typeof a>[0], route.label);
      });
      linksContainer.replaceChildren(...links);

      hamburger.setAttribute("aria-expanded", String(menuOpen.get()));

      if (menuOpen.get()) {
        linksContainer.classList.add("active");
      } else {
        linksContainer.classList.remove("active");
      }
    });

    // 直接监听 hashchange 事件更新导航状态，不再依赖间接的自定义事件链
    const onHashChange = () => {
      currentPath.set(getPathFromHash());
      closeMenu();
    };
    window.addEventListener("hashchange", onHashChange);

    document.addEventListener("click", (e) => {
      const nav = document.querySelector("rikka-nav");
      if (nav && !nav.contains(e.target as Node)) {
        nav.dispatchEvent(new CustomEvent("rikka:outsideclick"));
      }
    });
    this.addEventListener("rikka:outsideclick", () => closeMenu());

    return nav(
      { class: "main-nav" },
      brand,
      hamburger,
      linksContainer,
      actions,
    );
  },
});

export { RikkaNav };
