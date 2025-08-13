type Mergeable = Record<string, unknown>;

/**
 * Build an object that contains `value` at `path`, where `path` is a
 * comma-separated string.
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
 * Function that exposes `value` into the global scope under the name given
 * as `path`. `path` can be a comma-separated string, meaning that the value
 * will be nested into a series of objects.
 * Multiple invocations of this functions with overlapping paths will lead to
 * merging if both `value` and the variable that occupies `path` are objects,
 * otherwise an error will be thrown.
 * The `override` parameter allows to break this constraint, ensuring that the
 * results of the latest invocation will be the final state.
 */
export default function declareGlobal(
  path: string,
  value: unknown,
  override = false,
) {
  deepMerge(globalThis, buildObjectFromPath(path, value), override);
}
