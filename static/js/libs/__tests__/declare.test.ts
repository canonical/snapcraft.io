import declareGlobal from "../declare";

describe("declareGlobal", () => {
  afterEach(() => {
    // Clean up any globals we set
    delete (globalThis as Record<string, unknown>).testApp;
  });

  test("sets a nested global value", () => {
    declareGlobal("testApp.foo", { bar: 1 });
    const g = globalThis as unknown as Record<string, Record<string, Record<string, number>>>;
    expect(g.testApp.foo.bar).toBe(1);
  });

  test("merges overlapping paths", () => {
    declareGlobal("testApp.a", { x: 1 });
    declareGlobal("testApp.b", { y: 2 });
    const app = (globalThis as Record<string, unknown>).testApp as Record<string, unknown>;
    expect(app.a).toEqual({ x: 1 });
    expect(app.b).toEqual({ y: 2 });
  });

  test("does not pollute Object.prototype via __proto__", () => {
    const payload = JSON.parse('{"__proto__": {"polluted": true}}');
    declareGlobal("testApp.merge", payload);
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });

  test("does not pollute Object.prototype via constructor.prototype", () => {
    const payload = JSON.parse('{"constructor": {"prototype": {"polluted": true}}}');
    declareGlobal("testApp.merge2", payload);
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });
});
