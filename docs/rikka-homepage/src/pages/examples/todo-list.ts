import { defineElement } from "@takanashi/rikka-elements";
import { showcasePageStyles } from "../../shared/page-styles";
import { renderExamplePage } from "../../shared/example-renderer";
import { examples } from "../../shared/example-content";

const TodoList = defineElement("rikka-example-todo-list", {
  styles: showcasePageStyles,
  render() {
    return renderExamplePage(examples[4], {
      prev: { slug: "finance-tracker", title: "Finance Tracker" },
      next: { slug: "drawing-pad", title: "Drawing Pad" },
    });
  }
});

export { TodoList as ExampleTodoList };
