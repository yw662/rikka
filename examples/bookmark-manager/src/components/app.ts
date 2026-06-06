import { defineElement } from '@takanashi/rikka-elements';
import { div, h1, p, button, span, svg, path, css } from '@takanashi/rikka-dom';
import { effect } from '@takanashi/rikka-signal';
import { searchQuery, selectedTags, stats, clearFilters, toggleTagFilter } from "../store.js";
import { tagFilter } from "./tag-filter.js";
import { searchBar } from "./search-bar.js";
import { bookmarkForm } from "./bookmark-form.js";
import { bookmarkList } from "./bookmark-list.js";

export const app = defineElement("bookmark-app", {
  attributes: {},
  styles: css`
    :host {
      display: block;
    }
  `,
  render() {
    const totalEl = span({ class: "stat-value" }, String(stats.get().total));
    const unreadEl = span({ class: "stat-value unread" }, String(stats.get().unread));
    const readEl = span({ class: "stat-value" }, String(stats.get().read));
    const tagsEl = span({ class: "stat-value" }, String(stats.get().topTags.length));
    const filterEl = span({});
    const clearBtn = button({ class: "clear-btn" }, "Clear Filters");
    const listEl = bookmarkList.h({ selectedTags: "" } as any);

    effect(() => {
      totalEl.textContent = String(stats.get().total);
      unreadEl.textContent = String(stats.get().unread);
      readEl.textContent = String(stats.get().read);
      tagsEl.textContent = String(stats.get().topTags.length);
    });

    effect(() => {
      const q = searchQuery.get().trim();
      const tags = selectedTags.get();
      const parts: string[] = [];
      if (q) parts.push(`Search: "${q}"`);
      if (tags.length > 0) parts.push(`Tags: ${tags.join(", ")}`);
      filterEl.textContent = parts.length > 0 ? parts.join(" | ") : "No filters";
    });

    effect(() => {
      const hasFilters = selectedTags.get().length > 0 || searchQuery.get().trim().length > 0;
      (clearBtn as any).style.display = hasFilters ? "" : "none";
    });

    effect(() => {
      listEl.setAttribute("selectedTags", selectedTags.get().join(","));
    });

    this.addEventListener(
      "tagclick",
      (e: Event) => {
        toggleTagFilter((e as CustomEvent).detail);
      },
    );

    return div(
      { class: "bookmark-app" },
      div(
        { class: "app-header" },
        h1(
          {},
          svg(
            {
              xmlns: "http://www.w3.org/2000/svg",
              viewBox: "0 24 24",
              fill: "currentColor",
            },
            path({
              d: "M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z",
            }),
          ),
          "Bookmark Manager",
        ),
        p({}, "Save links for later, stay organized"),
      ),
      div(
        { class: "stats-dashboard" },
        div({ class: "stat-card" }, totalEl, span({ class: "stat-label" }, "Total")),
        div({ class: "stat-card" }, unreadEl, span({ class: "stat-label" }, "Unread")),
        div({ class: "stat-card" }, readEl, span({ class: "stat-label" }, "Read")),
        div({ class: "stat-card" }, tagsEl, span({ class: "stat-label" }, "Tags")),
      ),
      div(
        { class: "filter-status" },
        div({ class: "active-filters" }, filterEl),
        clearBtn,
      ),
      tagFilter.h({}),
      searchBar.h({}),
      bookmarkForm.h({}),
      listEl,
    );
  },
});