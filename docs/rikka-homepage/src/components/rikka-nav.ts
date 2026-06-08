import { defineElement, css } from "@takanashi/rikka-elements";
import { h, div, nav, a, span, button } from "@takanashi/rikka-dom";
import { signal, effect } from "@takanashi/rikka-signal";
import { locale, t, type Locale } from "../shared/i18n";
import {getPathFromHash} from "../shared/helpers";
import "../components/rikka-lang-switcher";

const navStyles = css`
  :host {
    display: block;
  }
  .nav-wrapper {
    position: sticky;
    top: 0;
    z-index: var(--z-sticky);
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
    transition: background var(--transition-normal), border-color var(--transition-normal);
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
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    align-items: center;
    justify-content: center;
    pointer-events: none;
  }
  .nav-center > * {
    pointer-events: auto;
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
    gap: 0.5rem;
    flex-shrink: 0;
  }
  .version-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    height: 32px;
    padding: 0 0.7rem;
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--color-primary-light);
    background: var(--color-tag-bg);
    border: 1px solid var(--color-tag-border);
    border-radius: var(--radius-md);
    letter-spacing: 0.02em;
    line-height: 1;
    white-space: nowrap;
  }
  .github-link {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    width: 32px;
    height: 32px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    color: var(--color-text-primary);
    text-decoration: none;
    transition: all var(--transition-fast);
  }
  .github-link:hover {
    border-color: var(--color-primary);
    color: var(--color-primary);
    background: var(--color-nav-link-bg);
    transform: translateY(-1px);
  }
  .github-link .github-icon {
    width: 16px;
    height: 16px;
    display: block;
  }

  .nav-fab {
    display: none;
    position: fixed;
    bottom: 90px;
    right: 24px;
    width: 56px;
    height: 56px;
    border-radius: 50%;
    border: none;
    background: var(--gradient-primary);
    color: #fff;
    font-size: 1.25rem;
    cursor: pointer;
    box-shadow: 0 4px 16px rgba(99, 102, 241, 0.35);
    z-index: 450;
    align-items: center;
    justify-content: center;
    transition: transform 0.2s, box-shadow 0.2s;
  }
  .nav-fab:hover {
    transform: scale(1.08);
    box-shadow: 0 6px 24px rgba(99, 102, 241, 0.5);
  }
  .nav-backdrop {
    display: none;
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 400;
    opacity: 0;
    transition: opacity var(--transition-normal);
    pointer-events: none;
  }
  .nav-backdrop.active {
    opacity: 1;
    pointer-events: auto;
  }
  .nav-drawer-header {
    display: none;
  }

  @media (max-width: 1024px) {
    .main-nav {
      padding: var(--spacing-sm) var(--spacing-lg);
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
      justify-content: center;
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
    .nav-actions {
      gap: 0.4rem;
    }
  }

  @media (max-width: 800px) {
    .nav-fab {
      display: flex;
    }
    .nav-backdrop {
      display: block;
    }
    .nav-center {
      position: fixed;
      top: 0;
      right: 0;
      bottom: 0;
      left: auto;
      width: 280px;
      display: flex;
      flex-direction: column;
      align-items: stretch;
      justify-content: flex-start;
      background: var(--color-nav-bg);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      padding: var(--spacing-xl);
      gap: var(--spacing-md);
      transform: translateX(100%);
      transition: transform var(--transition-normal);
      z-index: 500;
      box-shadow: var(--shadow-lg);
      overflow-y: auto;
      overflow-x: hidden;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: auto;
      mask-image: none;
      -webkit-mask-image: none;
      padding-inline: var(--spacing-xl);
      margin-inline: 0;
      pointer-events: auto;
    }
    .nav-center.active {
      transform: translateX(0);
    }
    .nav-link {
      padding: 0.75rem 1rem;
      font-size: 1rem;
      white-space: normal;
    }
    .nav-drawer-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: var(--spacing-lg);
      padding-bottom: var(--spacing-md);
      border-bottom: 1px solid var(--color-border);
    }
    .nav-drawer-title {
      font-size: 1rem;
      font-weight: 600;
      color: var(--color-text-primary);
    }
    .nav-drawer-close {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: transparent;
      border: none;
      color: var(--color-text-secondary);
      font-size: 1.25rem;
      cursor: pointer;
      border-radius: var(--radius-sm);
      padding: 0;
    }
    .nav-drawer-close:hover {
      background: var(--color-nav-link-bg);
      color: var(--color-text-primary);
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

const navTranslations = {
  home: { en: "Home", zh: "首页" } as Record<Locale, string>,
  playground: { en: "Playground", zh: "在线试用" } as Record<Locale, string>,
  docs: { en: "Docs", zh: "文档" } as Record<Locale, string>,
  examples: { en: "Examples", zh: "示例" } as Record<Locale, string>,
  agentSkills: { en: "Agent Skills", zh: "Agent 技能" } as Record<Locale, string>,
  drawerTitle: { en: "Navigation", zh: "导航" } as Record<Locale, string>,
  ariaToggleMenu: { en: "Toggle navigation menu", zh: "切换导航菜单" } as Record<Locale, string>,
};

const navRoutes = [
  { label: navTranslations.home, path: "/" },
  { label: navTranslations.playground, path: "/playground" },
  { label: navTranslations.docs, path: "/docs" },
  { label: navTranslations.examples, path: "/examples" },
  { label: navTranslations.agentSkills, path: "skills/index.html", external: true },
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

    const navFab = button(
      {
        class: "nav-fab",
        onclick: () => toggleMenu(),
        "aria-label": t(navTranslations.ariaToggleMenu),
        "aria-expanded": String(menuOpen.get()),
      },
      "\u2630",  // ☰ hamburger
    );

    const navBackdrop = div({
      class: "nav-backdrop",
      onclick: () => closeMenu(),
    });

    const linksContainer = div({ class: "nav-center" });

    const actions = div(
      { class: "nav-actions" },
      span({ class: "version-badge" }, "v0.1"),
      // 语言切换按钮
      (() => {
        const langSwitcher = document.createElement("rikka-lang-switcher");
        return langSwitcher;
      })(),
      // 主题切换按钮
      (() => {
        const themeSwitcher = document.createElement("rikka-theme-switcher");
        return themeSwitcher;
      })(),
      // GitHub 链接(图标)
      a(
        {
          href: "https://github.com/yw662/rikka/",
          target: "_blank",
          rel: "noopener noreferrer",
          class: "github-link",
          "aria-label": "GitHub repository",
          title: "View on GitHub",
          onclick: () => closeMenu(),
        },
        h(
          "svg",
          {
            class: "github-icon",
            viewBox: "0 0 24 24",
            "aria-hidden": "true",
            fill: "currentColor",
          },
          h("path", {
            d: "M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12",
          }),
        ),
      ),
    );

    effect(() => {
      const path = currentPath.get();
      locale.get();

      brand.className = `nav-brand${isActive(path, "/") ? " active" : ""}`;

      const drawerHeader = div(
        { class: "nav-drawer-header" },
        span({ class: "nav-drawer-title" }, t(navTranslations.drawerTitle)),
        button(
          { class: "nav-drawer-close", onclick: () => closeMenu() },
          "\u2715",
        ),
      );

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
        return a(linkAttrs as Parameters<typeof a>[0], t(route.label));
      });
      linksContainer.replaceChildren(drawerHeader, ...links);

      navFab.setAttribute("aria-expanded", String(menuOpen.get()));
      navFab.setAttribute("aria-label", t(navTranslations.ariaToggleMenu));
      navFab.textContent = menuOpen.get() ? "\u2715" : "\u2630";

      if (menuOpen.get()) {
        linksContainer.classList.add("active");
        navBackdrop.classList.add("active");
      } else {
        linksContainer.classList.remove("active");
        navBackdrop.classList.remove("active");
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

    return div(
      { class: "nav-wrapper" },
      nav({ class: "main-nav" }, brand, actions),
      linksContainer,
      navBackdrop,
      navFab,
    );
  },
});

export { RikkaNav };
