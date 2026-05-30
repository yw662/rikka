/**
 * @module rikka-elements
 *
 * Declarative Custom Elements with reactive attributes,
 * shadow DOM, styles, and template binding.
 *
 * @example
 * import { defineElement, event } from 'rikka-elements';
 * import { css } from 'rikka-dom';
 *
 * const MyCounter = defineElement('my-counter', {
 *   attributes: {
 *     count: Number,
 *     label: String,
 *     active: Boolean,
 *   },
 *   events: {
 *     change: Number,
 *     reset: undefined,
 *     custom: event<MyPayload>(),
 *   },
 *   styles: css`:host { display: block; }`,
 * });
 */

export {
  defineElement,
  type AttributeSpec,
  type EventSpec,
  type ElementConfig,
  type ElementConstructor,
  type RikkaElement,
  type TagFunctionH,
  type TagFunctionProps,
  event,
} from "./defineElement.js";
export { type PascalCase, toPascalCase } from "./utils.js";
export { css } from "rikka-dom";
