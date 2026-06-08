import { defineElement } from "@takanashi/rikka-elements";
import { showcasePageStyles } from "../../shared/page-styles";
import { renderExamplePage } from "../../shared/example-renderer";
import { examples } from "../../shared/example-content";

const CodeEditor = defineElement("rikka-example-code-editor", {
  styles: showcasePageStyles,
  render() {
    return renderExamplePage(examples[2], {
      prev: { slug: "bookmark-manager", title: "Bookmark Manager" },
      next: { slug: "finance-tracker", title: "Finance Tracker" },
    });
  }
});

export { CodeEditor as ExampleCodeEditor };
