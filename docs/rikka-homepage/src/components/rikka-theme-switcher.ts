import { defineElement, css } from "@rikka/elements";
import { button, span } from "@rikka/dom";

const themeSwitcherStyles = css`
  :host {
    display: inline-flex;
    align-items: center;
  }

  .theme-toggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    padding: 0;
    background: transparent;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    cursor: pointer;
    color: var(--color-text-secondary);
    font-size: 1.125rem;
    transition: all var(--transition-fast);
    position: relative;
    overflow: hidden;
  }

  .theme-toggle:hover {
    color: var(--color-primary);
    border-color: var(--color-primary);
    background: rgba(99, 102, 241, 0.1);
    transform: rotate(15deg) scale(1.05);
  }

  .theme-toggle:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }

  /* 太阳图标（亮色模式）*/
  .sun-icon {
    display: none;
  }

  /* 月亮图标（暗色模式）*/
  .moon-icon {
    display: inline-block;
  }

  /* 当主题为 light 时切换图标 */
  :host([data-theme="light"]) .sun-icon {
    display: inline-block;
  }

  :host([data-theme="light"]) .moon-icon {
    display: none;
  }
`;

export const ThemeSwitcher = defineElement("rikka-theme-switcher", {
  styles: themeSwitcherStyles,
  render() {
    const toggleTheme = () => {
      const currentTheme = document.documentElement.getAttribute("data-theme");
      const newTheme = currentTheme === "light" ? "dark" : "light";
      
      // 应用新主题
      document.documentElement.setAttribute("data-theme", newTheme);
      this.setAttribute("data-theme", newTheme);
      
      // 保存到 localStorage
      try {
        localStorage.setItem("theme", newTheme);
      } catch (e) {
        console.warn("无法保存主题偏好到 localStorage:", e);
      }

      // 触发自定义事件
      this.dispatchEvent(new CustomEvent("theme-changed", { 
        detail: { theme: newTheme },
        bubbles: true,
        composed: true,
      }));
    };

    // 初始化：从 localStorage 或系统偏好读取
    const initializeTheme = () => {
      let savedTheme = null;
      
      try {
        savedTheme = localStorage.getItem("theme");
      } catch (e) {
        console.warn("无法读取 localStorage:", e);
      }

      if (!savedTheme) {
        // 检查系统偏好
        if (window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches) {
          savedTheme = "light";
        } else {
          savedTheme = "dark"; // 默认暗色
        }
      }

      document.documentElement.setAttribute("data-theme", savedTheme);
      this.setAttribute("data-theme", savedTheme);
    };

    // 初始化主题
    initializeTheme();

    // 监听系统主题变化
    if (window.matchMedia) {
      window.matchMedia("(prefers-color-scheme: light)").addEventListener("change", (e) => {
        let savedTheme: string | null = null;
        try {
          savedTheme = localStorage.getItem("theme");
        } catch {
          // localStorage unavailable
        }
        if (!savedTheme) {
          const newTheme = e.matches ? "light" : "dark";
          document.documentElement.setAttribute("data-theme", newTheme);
          this.setAttribute("data-theme", newTheme);
        }
      });
    }

    return button(
      {
        class: "theme-toggle",
        onclick: () => toggleTheme(),
        title: "Toggle theme",
        "aria-label": `Switch to ${document.documentElement.getAttribute("data-theme") === "light" ? "dark" : "light"} mode`,
      },
      span({ class: "sun-icon" }, "☀️"),
      span({ class: "moon-icon" }, "🌙"),
    );
  },
});

