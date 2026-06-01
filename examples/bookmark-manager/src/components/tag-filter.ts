import { defineElement } from @rikka/elements;
import { div, span, For, Show, When, css } from @rikka/dom;
import { computed } from @rikka/signal;
import { appStore, tagCloud, toggleTagFilter } from "../store.js";

export const tagFilter = defineElement("tag-filter", {
  attributes: {},
  styles: css`
    :host {
      display: block;
    }
  `,
  render() {
    const tags = tagCloud;

    const isTagActive = (tag: string) => {
      return appStore.selectedTags.some(
        (t) => t.toLowerCase() === tag.toLowerCase(),
      );
    };

    const handleTagClick = (tag: string) => {
      toggleTagFilter(tag);
    };

    const hasTags = computed(() => tags.get().length > 0);

    return div(
      { class: "tag-cloud" },
      When(hasTags, () => [
        span({ class: "tag-cloud-label" }, "Filter by tags:"),
        For(tags, (item: { tag: string; count: number }) =>
          span(
            {
              class: (() => `tag-item${isTagActive(item.tag) ? " active" : ""}`) as any,
              onclick: () => handleTagClick(item.tag),
            },
            item.tag,
            span({ class: "tag-count" }, String(item.count)),
          ),
        ),
      ] as any, () => null),
    );
  },
});
