import { defineElement } from "@takanashi/rikka-elements";
import { showcasePageStyles } from "../../shared/page-styles";
import { renderExamplePage } from "../../shared/example-renderer";
import { examples } from "../../shared/example-content";

const PomodoroTimer = defineElement("rikka-example-pomodoro-timer", {
  styles: showcasePageStyles,
  render() {
    return renderExamplePage(examples[0], {
      next: { slug: "bookmark-manager", title: "Bookmark Manager" },
    });
  }
});

export { PomodoroTimer as ExamplePomodoroTimer };
