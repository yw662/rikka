import { defineElement } from @rikka/elements;
import {
  svg,
  path,
  polyline,
  rect,
  line,
  div,
  span,
  a,
  button,
  p,
  input,
  For,
  Show,
  When,
  css,
} from @rikka/dom;
import { signal, computed } from @rikka/signal;
import {
  removeBookmark,
  toggleRead,
  updateBookmarkTags,
  getDomain,
} from "../store.js";

export const bookmarkItem = defineElement("bookmark-item", {
  attributes: {
    id: String,
    url: String,
    title: String,
    description: String,
    tags: String,
    read: Boolean,
    createdAt: Number,
    selectedTags: String,
  },
  events: {
    tagClick: (e: Event) => (e as CustomEvent).detail,
  },
  styles: css`
    :host {
      display: block;
    }
  `,
  render() {
    const self = this as any;
    const isEditingTags = signal(false);
    const editTagsInput = signal("");

    const bookmarkId = () => self.id;
    const bookmarkUrl = () => self.url;
    const bookmarkTitle = () => self.title;
    const bookmarkDescription = () => self.description;
    const bookmarkTags = () =>
      self.tags ? self.tags.split(",").filter((t: string) => t) : [];
    const bookmarkRead = () => self.read;
    const bookmarkCreatedAt = () => self.createdAt;
    const selectedTagsSignal = () =>
      self.selectedTags
        ? self.selectedTags.split(",").filter((t: string) => t)
        : [];

    const isTagSelected = (tag: string) => {
      return selectedTagsSignal().some(
        (t: string) => t.toLowerCase() === tag.toLowerCase(),
      );
    };

    const formatDate = (timestamp: number) => {
      const date = new Date(timestamp);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    };

    const handleToggleRead = () => {
      toggleRead(bookmarkId());
    };

    const handleDelete = () => {
      if (confirm("Delete this bookmark?")) {
        removeBookmark(bookmarkId());
      }
    };

    const handleTagClick = (tag: string) => {
      self.dispatchTagClick(tag, { bubbles: true });
    };

    const handleStartEditTags = () => {
      isEditingTags.set(true);
      editTagsInput.set(bookmarkTags().join(", "));
    };

    const handleSaveTags = () => {
      const newTags = editTagsInput
        .get()
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t);
      updateBookmarkTags(bookmarkId(), newTags);
      isEditingTags.set(false);
    };

    const handleCancelEditTags = () => {
      isEditingTags.set(false);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        handleSaveTags();
      } else if (e.key === "Escape") {
        handleCancelEditTags();
      }
    };

    const descriptionSignal = computed(() => bookmarkDescription());
    const tagsSignal = computed(() => bookmarkTags());

    const renderContent = () => {
      const tags = bookmarkTags();
      const isRead = bookmarkRead();
      const domain = getDomain(bookmarkUrl());

      return div(
        { class: `bookmark-card${isRead ? "" : " unread"}` },
        div(
          { class: "bookmark-header" },
          div(
            { class: "bookmark-title" },
            a(
              {
                href: bookmarkUrl(),
                target: "_blank",
                rel: "noopener noreferrer",
              },
              bookmarkTitle(),
            ),
          ),
          div(
            { class: "bookmark-actions" },
            button(
              {
                class: "btn-icon",
                title: "Edit tags",
                onclick: handleStartEditTags,
              },
              svgIconEdit(),
            ),
            button(
              { class: "btn-danger", title: "Delete", onclick: handleDelete },
              svgIconTrash(),
            ),
          ),
        ),
        div(
          { class: "bookmark-url" },
          svgIconLink(),
          a(
            {
              href: bookmarkUrl(),
              target: "_blank",
              rel: "noopener noreferrer",
            },
            domain,
          ),
        ),
        Show(descriptionSignal, () =>
          p({ class: "bookmark-description" }, bookmarkDescription()),
        ),
        div(
          { class: "bookmark-tags" },
          For(tagsSignal, (tag: string) =>
            span(
              {
                class: () =>
                  `bookmark-tag${isTagSelected(tag) ? " filter-active" : ""}`,
                onclick: () => handleTagClick(tag),
              } as any,
              tag,
            ),
          ),
        ),
        div(
          { class: "bookmark-meta" },
          div(
            { class: "read-toggle" },
            input({
              type: "checkbox",
              checked: () => bookmarkRead(),
              onchange: handleToggleRead,
            } as any),
            span({ class: "toggle-slider" } as any),
            span(
              {} as any,
              (() => (bookmarkRead() ? "Read" : "Unread")) as any,
            ) as any,
          ),
          div(
            { class: "bookmark-date" },
            svgIconCalendar(),
            span({}, formatDate(bookmarkCreatedAt())),
          ),
        ),
      );
    };

    const renderTagEdit = () => {
      return div(
        { class: "tag-edit-container" },
        input({
          type: "text",
          placeholder: "Enter tags separated by commas",
          value: editTagsInput,
          onkeydown: handleKeyDown,
        }),
        button(
          { class: "btn btn-primary btn-small", onclick: handleSaveTags },
          "Save",
        ),
        button(
          { class: "btn btn-small", onclick: handleCancelEditTags },
          "Cancel",
        ),
      );
    };

    return (When as any)(
      () => isEditingTags.get(),
      renderTagEdit,
      renderContent,
    );
  },
});

function svgIconEdit() {
  return svg(
    {
      xmlns: "http://www.w3.org/2000/svg",
      width: "16",
      height: "16",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round",
    },
    path({ d: "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" }),
    path({ d: "M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" }),
  );
}

function svgIconTrash() {
  return svg(
    {
      xmlns: "http://www.w3.org/2000/svg",
      width: "16",
      height: "16",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round",
    },
    polyline({ points: "3 6 5 6 21 6" }),
    path({
      d: "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2",
    }),
  );
}

function svgIconLink() {
  return svg(
    {
      xmlns: "http://www.w3.org/2000/svg",
      width: "14",
      height: "14",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round",
    },
    path({ d: "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" }),
    path({ d: "M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" }),
  );
}

function svgIconCalendar() {
  return svg(
    {
      xmlns: "http://www.w3.org/2000/svg",
      width: "14",
      height: "14",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round",
    },
    rect({ x: "3", y: "4", width: "18", height: "18", rx: "2", ry: "2" }),
    line({ x1: "16", y1: "2", x2: "16", y2: "6" } as any),
    line({ x1: "8", y1: "2", x2: "8", y2: "6" } as any),
    line({ x1: "3", y1: "10", x2: "21", y2: "10" } as any),
  );
}
