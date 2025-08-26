type Mergeable = Record<string, unknown>;

/**
 * Build an object that contains `value` at `path`, where `path` is a
 * period-separated string.
 */
function buildObjectFromPath(path: string, value: unknown): Mergeable {
  const segments = path.split(".");
  const obj = {} as Mergeable;
  let curr = obj;
  for (const [i, s] of segments.entries()) {
    curr[s] = i < segments.length - 1 ? {} : value;
    curr = curr[s] as Mergeable;
  }

  return obj;
}

function deepMerge(target: Mergeable, source: Mergeable, override: boolean) {
  for (const key of Object.keys(source)) {
    if (typeof target[key] === "object" && typeof source[key] === "object") {
      target[key] = deepMerge(
        target[key] as Mergeable,
        source[key] as Mergeable,
        override,
      );
    } else if (typeof target[key] === "undefined") {
      target[key] = source[key];
    } else if (override) {
      console.warn(
        `Overwriting "${key}" of type "${typeof target[key]} with value of type ${typeof source[key]}"`,
      );
      target[key] = source[key];
    } else {
      throw new Error(`"${key}" is already defined, but "override" is false`);
    }
  }
  return target;
}

/**
 * @param {string} path A period-separated string representing the path for the
 * global variable.
 * @param {*} value The value to expose globally.
 * @param {boolean} [override=false] If true, forces the value to be assigned,
 * even if it conflicts with an existing non-object variable at the specified
 * path. Defaults to false.
 * @returns {void}
 * @throws {Error} Throws an error if `override` is false and a non-object
 * value already exists at a nested path.
 * @description
 * This function exposes `value` into the global scope under the name given by
 * `path`.
 * The `path` parameter can be a period-separated string (e.g., 'myApp.data'),
 * which will nest the `value` within a series of objects.
 *
 * If you call this function multiple times with overlapping paths, it will
 * merge the values if both the new `value` and the existing variable at that
 * path are objects.
 * For example, if 'myApp.data' already exists as an object, calling
 * `declareGlobal('myApp.config', { theme: 'dark' })` will add a `config`
 * property to the `globalThis.myApp` object.
 *
 * An error will be thrown if a conflict occurs, such as trying to merge an
 * object with an existing non-object value at the same path, unless the
 * `override` parameter is set to true.
 *
 * @example
 * // Declaring a simple global variable
 * declareGlobal('myGlobalVar', 123);
 * console.log(globalThis.myGlobalVar); // 123
 *
 * @example
 * // Declaring a nested global object
 * declareGlobal('myApp.user', { name: 'John Doe' });
 * console.log(globalThis.myApp.user.name); // John Doe
 *
 * @example
 * // Merging with an existing object
 * declareGlobal('myApp-settings', { theme: 'light' });
 * declareGlobal('myApp.settings', { language: 'en' });
 * console.log(globalThis.myApp.settings); // { theme: 'light', language: 'en' }
 *
 * @example
 * // Using override to force assignment and prevent an error
 * declareGlobal('config', { api: 'v1' });
 * declareGlobal('config', 'api/v2', true); // Overwrites the 'config' object
 * console.log(globalThis.config); // 'api/v2'
 */
export default function declareGlobal(
  path: string,
  value: unknown,
  override: boolean = false,
): void {
  deepMerge(globalThis, buildObjectFromPath(path, value), override);
}

// TODO: this approach is due to how we handled bundles in Webpack, using
// expose-loader to declare exports as an object in the global scope. A better
// approach would be to explicitly import the modules that use the function
// above inside the <script> tags that make use their exports (making sure to
// use modulepreload hints to not delay loading)
