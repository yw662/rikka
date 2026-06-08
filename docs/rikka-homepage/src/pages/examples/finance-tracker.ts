import { defineElement } from "@takanashi/rikka-elements";
import { showcasePageStyles } from "../../shared/page-styles";
import { renderExamplePage } from "../../shared/example-renderer";
import { examples } from "../../shared/example-content";

const FinanceTracker = defineElement("rikka-example-finance-tracker", {
  styles: showcasePageStyles,
  render() {
    return renderExamplePage(examples[3], {
      prev: { slug: "code-editor", title: "Code Editor" },
    });
  }
});

export { FinanceTracker as ExampleFinanceTracker };
