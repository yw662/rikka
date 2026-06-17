import { defineElement } from "@takanashi/rikka-elements";
import { div, p } from "@takanashi/rikka-dom";

export const TestElement = defineElement("test-element", {
  render() {
    return div({}, p("Hello from test element"));
  },
});
