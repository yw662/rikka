import { defineElement } from @rikka/elements;
import { div, svg, path, h3, p, For, Show, When, css } from @rikka/dom;
import { computed } from @rikka/signal;
import { filteredBookmarks, stats } from "../store.js";
import { bookmarkItem } from "./bookmark-item.js";

export const bookmarkList = defineElement("bookmark-list", {
  attributes: {
    selectedTags: String,
  },
  styles: css`
    :host {
      display: block;
    }
  `,
  render() {
    const bookmarks = filteredBookmarks;
    const totalStats = stats;
    const self = this;

    const renderBookmarkItem = (bookmark: {
      id: string;
      url: string;
      title: string;
      description: string;
      tags: string[];
      read: boolean;
      createdAt: number;
    }) => {
      const el = bookmarkItem.h({
        id: bookmark.id,
        url: bookmark.url,
        title: bookmark.title,
        description: bookmark.description || "",
        tags: bookmark.tags.join(","),
        read: bookmark.read,
        createdAt: bookmark.createdAt,
        selectedTags: (self as any).selectedTags || "",
      } as any);

      el.addEventListener("tagclick", (e: Event) => {
        const ce = e as CustomEvent;
        const event = new CustomEvent("tagclick", {
          detail: ce.detail,
          bubbles: true,
        });
        self.dispatchEvent(event);
      });

      return el;
    };

    const renderEmptyState = () => {
      const isEmpty = computed(() => totalStats.get().total === 0);
      return div(
        { class: "empty-state" },
        svg(
          {
            xmlns: "http://www.w3.org/2000/svg",
            width: "64",
            height: "64",
            viewBox: "0 0 24 24",
            fill: "none",
            stroke: "currentColor",
            strokeWidth: "1.5",
            strokeLinecap: "round",
            strokeLinejoin: "round",
          },
          path({ d: "M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" }),
        ),
        h3({}, "No bookmarks found"),
        When(
          isEmpty,
          () => p({}, "Add your first bookmark to get started!"),
          () => p({}, "Try adjusting your search or filters."),
        ),
      );
    };

    const isBookmarksEmpty = computed(() => bookmarks.get().length === 0);

    return div(
      { class: "bookmark-list" },
      When(isBookmarksEmpty, renderEmptyState, () => For(bookmarks, (bookmark: any) => renderBookmarkItem(bookmark)) as any,
      ),
    );
  },
});
