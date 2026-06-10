import { defineElement } from "@takanashi/rikka-elements";
import { showcasePageStyles } from "../../shared/page-styles";
import { renderExamplePage } from "../../shared/example-renderer";
import { examples } from "../../shared/example-content";

// Find the 2048 game in examples array
const game2048 = examples.find(e => e.slug === "2048-game")!;
const snakeGame = examples.find(e => e.slug === "snake-game")!;

const Game2048 = defineElement("rikka-example-2048-game", {
  styles: showcasePageStyles,
  render() {
    return renderExamplePage(game2048, {
      prev: { slug: "snake-game", title: "Snake Game" },
      next: { slug: "snake-game", title: "Snake Game" },
    });
  }
});

export { Game2048 as ExampleGame2048 };
