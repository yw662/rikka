import { defineElement } from "@takanashi/rikka-elements";
import { showcasePageStyles } from "../../shared/page-styles";
import { renderExamplePage } from "../../shared/example-renderer";
import { examples } from "../../shared/example-content";

const BookmarkManager = defineElement("rikka-example-bookmark-manager", {
  styles: showcasePageStyles,
  render() {
    return renderExamplePage(examples[1], {
      prev: { slug: "pomodoro-timer", title: "Pomodoro Timer" },
      next: { slug: "code-editor", title: "Code Editor" },
    });
  }
});

export { BookmarkManager as ExampleBookmarkManager };
