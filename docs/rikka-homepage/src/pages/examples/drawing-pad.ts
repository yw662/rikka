import { defineElement } from "@takanashi/rikka-elements";
import { showcasePageStyles } from "../../shared/page-styles";
import { renderExamplePage } from "../../shared/example-renderer";
import { examples } from "../../shared/example-content";

const DrawingPad = defineElement("rikka-example-drawing-pad", {
  styles: showcasePageStyles,
  render() {
    return renderExamplePage(examples[5], {
      prev: { slug: "todo-list", title: "Todo List" },
    });
  }
});

export { DrawingPad as ExampleDrawingPad };
