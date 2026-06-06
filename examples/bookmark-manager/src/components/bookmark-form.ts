import { defineElement } from '@takanashi/rikka-elements';
import {
  h2,
  label,
  textarea,
  div,
  input,
  button,
  span,
  For,
  Show,
  css,
} from '@takanashi/rikka-dom';
import { signal, computed } from '@takanashi/rikka-signal';
import { addBookmark, tagCloud } from "../store.js";

export const bookmarkForm = defineElement("bookmark-form", {
  attributes: {},
  styles: css`
    :host {
      display: block;
    }
  `,
  render() {
    const url = signal("");
    const title = signal("");
    const description = signal("");
    const tags = signal<string[]>([]);
    const tagInput = signal("");
    const isSubmitting = signal(false);

    const showAutocomplete = computed(() => {
      const input = tagInput.get().trim();
      const existingTags = tagCloud.get();
      return (
        input.length > 0 &&
        existingTags.some(
          (t) =>
            t.tag.toLowerCase().includes(input.toLowerCase()) &&
            !tags
              .get()
              .some((tag) => tag.toLowerCase() === t.tag.toLowerCase()),
        )
      );
    });

    const autocompleteItems = computed(() => {
      const input = tagInput.get().trim().toLowerCase();
      const existingTags = tagCloud.get();
      return existingTags
        .filter((t) => t.tag.toLowerCase().includes(input))
        .filter(
          (t) =>
            !tags
              .get()
              .some((tag) => tag.toLowerCase() === t.tag.toLowerCase()),
        )
        .slice(0, 5);
    });

    const handleAddTag = (tag: string) => {
      const normalizedTag = tag.trim();
      if (
        normalizedTag &&
        !tags.get().some((t) => t.toLowerCase() === normalizedTag.toLowerCase())
      ) {
        tags.set([...tags.get(), normalizedTag]);
      }
      tagInput.set("");
    };

    const handleRemoveTag = (tag: string) => {
      tags.set(tags.get().filter((t) => t.toLowerCase() !== tag.toLowerCase()));
    };

    const handleTagInputKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        const value = tagInput.get().trim();
        if (value) {
          handleAddTag(value);
        }
      } else if (
        e.key === "Backspace" &&
        tagInput.get() === "" &&
        tags.get().length > 0
      ) {
        handleRemoveTag(tags.get()[tags.get().length - 1]);
      }
    };

    const handleAutocompleteClick = (tag: string) => {
      handleAddTag(tag);
    };

    const handleSubmit = async () => {
      const urlValue = url.get().trim();
      if (!urlValue) return;

      isSubmitting.set(true);

      const titleValue = title.get().trim() || urlValue;

      addBookmark(urlValue, titleValue, description.get().trim(), tags.get());

      url.set("");
      title.set("");
      description.set("");
      tags.set([]);

      isSubmitting.set(false);
    };

    const isFormValid = computed(() => {
      return url.get().trim().length > 0;
    });

    const tagPlaceholder = computed(() => {
      return tags.get().length === 0 ? "Type and press Enter to add tags" : "";
    });

    const isDisabled = computed<string>(() => {
      return !isFormValid.get() || isSubmitting.get() ? "true" : "";
    });

    const buttonText = computed(() => {
      return isSubmitting.get() ? "Adding..." : "Add Bookmark";
    });

    return div(
      { class: "bookmark-form" },
      div({}, h2({}, "Add New Bookmark")),
      div(
        { class: "form-group" },
        label({ for: "url-input" }, "URL *"),
        input({
          id: "url-input",
          type: "url",
          placeholder: "https://example.com/article",
          value: url,
          onkeydown: (e: KeyboardEvent) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSubmit();
            }
          },
        }),
      ),
      div(
        { class: "form-group" },
        label({ for: "title-input" }, "Title"),
        input({
          id: "title-input",
          type: "text",
          placeholder: "Enter title or leave blank to use URL",
          value: title,
        }),
      ),
      div(
        { class: "form-group" },
        label({ for: "desc-input" }, "Description"),
        textarea({
          id: "desc-input",
          placeholder: "Add a note about this link...",
          defaultValue: description.get(),
          oninput: (e: Event) => {
            description.set((e.target as HTMLTextAreaElement).value);
          },
        }),
      ),
      div(
        { class: "form-group" },
        label({}, "Tags"),
        div(
          { class: "tag-input-container" },
          For(tags, (tag: string) =>
            span(
              { class: "tag-badge" },
              tag,
              button(
                {
                  type: "button",
                  onclick: () => handleRemoveTag(tag),
                },
                "×",
              ),
            ),
          ),
          input({
            type: "text",
            placeholder: tagPlaceholder,
            value: tagInput,
            onkeydown: handleTagInputKeyDown,
          }),
        ),
        Show(showAutocomplete, () =>
          div(
            { class: "autocomplete-dropdown" },
            For(autocompleteItems, (item: { tag: string; count: number }) =>
              div(
                {
                  class: "autocomplete-item",
                  onclick: () => handleAutocompleteClick(item.tag),
                },
                span({}, item.tag),
                span(
                  {
                    style: {
                      fontSize: "0.8rem",
                      color: "var(--color-text-secondary)",
                      marginLeft: "8px",
                    },
                  },
                  `(${item.count})`,
                ),
              ),
            ),
          ),
        ),
      ),
      div(
        { class: "form-actions" },
        button(
          {
            class: "btn btn-primary",
            onclick: handleSubmit,
            disabled: isDisabled,
          },
          buttonText,
        ),
        button(
          {
            class: "btn",
            type: "button",
            onclick: () => {
              url.set("");
              title.set("");
              description.set("");
              tags.set([]);
              tagInput.set("");
            },
          },
          "Clear",
        ),
      ),
    );
  },
});
