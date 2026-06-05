import { defineElement } from '@rikka/elements';
import { div, input, button, svg, circle, line, css } from '@rikka/dom';
import { signal } from '@rikka/signal';
import { searchQuery as searchQuerySignal, clearFilters } from "../store.js";

export const searchBar = defineElement("search-bar", {
  attributes: {},
  styles: css`
    :host {
      display: block;
    }
  `,
  render() {
    const localQuery = signal(searchQuerySignal.get());

    let debounceTimer: number | null = null;

    const handleInput = (e: Event) => {
      const target = e.target as HTMLInputElement;
      const value = target.value;

      localQuery.set(value);

      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }

      debounceTimer = window.setTimeout(() => {
        searchQuerySignal.set(value);
      }, 200);
    };

    const handleClear = () => {
      localQuery.set("");
      searchQuerySignal.set("");
    };

    return div(
      { class: "search-container" },
      svg(
        {
          xmlns: "http://www.w3.org/2000/svg",
          width: "18",
          height: "18",
          viewBox: "0 0 24 24",
          fill: "none",
          stroke: "currentColor",
          strokeWidth: "2",
          strokeLinecap: "round",
          strokeLinejoin: "round",
        },
        circle({ cx: "11", cy: "11", r: "8" }),
        line({ x1: "21", y1: "21", x2: "16.65", y2: "16.65" } as any),
      ),
      input({
        type: "text",
        class: "search-input",
        placeholder: "Search bookmarks by title, URL, or tags...",
        value: localQuery,
        oninput: handleInput,
      }),
      button(
        {
          class: "clear-search",
          onclick: handleClear,
          style: (() => (localQuery.get() ? {} : { display: "none" })) as any,
        },
        "×",
      ),
    );
  },
});
