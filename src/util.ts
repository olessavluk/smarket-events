/**
 * see [Assertion Functions](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-7.html#assertion-functions)
 */
export function assertIsDefined<T>(
  value: T,
  msg?: string
): asserts value is NonNullable<T> {
  if (value === undefined || value === null) {
    throw new Error(
      msg || `Expected "value" to be defined, but received "${value}"`
    );
  }
}
export function assert(condition: any, msg?: string): asserts condition {
  if (!condition) {
    throw new Error(msg || "Expected condition to be truthy");
  }
}
