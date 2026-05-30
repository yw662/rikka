/**
 * PascalCase 类型工具：将 kebab-case 字符串转换为 PascalCase
 *
 * 例如: 'my-event' → 'MyEvent'
 *       'foo-bar-baz' → 'FooBarBaz'
 */
export type PascalCase<S extends string> =
  S extends `${infer First}-${infer Rest}`
    ? `${Capitalize<First>}${PascalCase<Rest>}`
    : Capitalize<S>;

export type CamelCase<S extends string> =
  S extends `${infer First}-${infer Rest}`
    ? `${First}${PascalCase<Rest>}`
    : S;

/**
 * 运行时：将 kebab-case 字符串转换为 PascalCase
 */
export function toPascalCase(str: string): string {
  return str
    .split('-')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join('');
}

export function toCamelCase(str: string): string {
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}
