function shallowSet(
  ctx: Record<string, any>,
  property: string,
  value: any,
  override = false
) {
  const typeofCurr = typeof ctx?.[property];
  const typeofValue = typeof value;

  switch (typeofCurr) {
    case "undefined":
      ctx[property] = value;
      return;
    // @ts-ignore: fallthough behavior is desired
    case "object":
      if (typeofValue === "object") {
        ctx[property] = {
          ...ctx[property],
          ...value,
        };
        return;
      }
    // if we can't merge, try to override
    case "string":
    case "number":
    case "bigint":
    case "boolean":
    case "symbol":
    case "function":
      if (!override) {
        throw new Error(
          `${property}" is already defined, but "override" === false`
        );
      }

      ctx[property] = value;
      console.warn(
        `Overwriting "${property}" of type "${typeofCurr} with value of type ${typeofValue}"`
      );
      return;
  }
}

function deepSet(
  ctx: Record<string, any>,
  path: string[],
  value: any,
  override = false
) {
  if (path.length === 0) {
    throw new Error("Can't use an empty path");
  }

  const curr = path[0];
  const typeofCurr = typeof ctx?.[curr];

  if (path.length === 1) {
    return shallowSet(ctx, curr, value, override);
  }

  switch (typeofCurr) {
    case "string":
    case "number":
    case "bigint":
    case "boolean":
    case "symbol":
    // @ts-ignore: fallthough behavior is desired
    case "function":
      if (!override) {
        throw new Error(
          `${path}" is already defined, but "override" === false`
        );
      }
    // override === true and this isn't the last path segment, so we can
    // consider ctx[curr] to be undefined
    // @ts-ignore: fallthough behavior is desired
    case "undefined":
      ctx[curr] = {};
    case "object":
      return deepSet(ctx[curr], path.slice(1), value, override);
  }
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
  value: any,
  override = false
) {
  deepSet(globalThis, path.split("."), value, override);
}
