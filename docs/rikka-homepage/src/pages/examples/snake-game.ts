import { defineElement } from "@takanashi/rikka-elements";
import { showcasePageStyles } from "../../shared/page-styles";
import { renderExamplePage } from "../../shared/example-renderer";
import { examples } from "../../shared/example-content";

// Find the snake game in examples array
const snakeGame = examples.find(e => e.slug === "snake-game")!;
const game2048 = examples.find(e => e.slug === "2048-game")!;

const SnakeGame = defineElement("rikka-example-snake-game", {
  styles: showcasePageStyles,
  render() {
    return renderExamplePage(snakeGame, {
      prev: { slug: "2048-game", title: "2048 Game" },
      next: { slug: "bookmark-manager", title: "Bookmark Manager" },
    });
  }
});

export { SnakeGame as ExampleSnakeGame };
