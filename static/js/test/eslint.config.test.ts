import { ESLint } from "eslint";

const eslint = new ESLint();

const fixturePath = (extension: string) =>
  `static/js/test/eslint.config.fixture.${extension}`;

describe("eslint.config.mjs", () => {
  it("uses Espree for JavaScript with ECMAScript 2020 and JSX enabled", async () => {
    const config = await eslint.calculateConfigForFile(fixturePath("js"));

    expect(config.languageOptions.parser.name).toBe("espree");
    expect(config.languageOptions.ecmaVersion).toBe(2020);
    expect(config.languageOptions.parserOptions.ecmaFeatures.jsx).toBe(true);
  });

  it.each(["ts", "tsx"])(
    "keeps the TypeScript parser for %s files",
    async (extension) => {
      const config = await eslint.calculateConfigForFile(
        fixturePath(extension),
      );

      expect(config.languageOptions.parser.meta.name).toBe(
        "typescript-eslint/parser",
      );
    },
  );

  it.each([
    ["js", 'export const getName = (user) => user?.name ?? "anonymous";\n'],
    [
      "js",
      'export const Preview = () => <img src="preview.png" alt="Preview" />;\n',
    ],
    [
      "ts",
      'export const getName = (user?: { name: string }): string =>\n  user?.name ?? "anonymous";\n',
    ],
    [
      "tsx",
      "type Props = { label: string };\nexport const Preview = ({ label }: Props) => <button>{label}</button>;\n",
    ],
  ])("parses and lints valid %s syntax: %s", async (extension, source) => {
    const [result] = await eslint.lintText(source, {
      filePath: fixturePath(extension),
    });

    expect(result.messages).toEqual([]);
  });

  it.each([
    ["js", "missingHandler();\n", "no-undef"],
    ["js", "const unused = 1;\n", "no-unused-vars"],
    [
      "js",
      'export const Preview = () => <img src="preview.png" />;\n',
      "jsx-a11y/alt-text",
    ],
    [
      "js",
      "export const Preview = () => [<button>Save</button>];\n",
      "react/jsx-key",
    ],
    [
      "ts",
      'const unused: string = "test";\n',
      "@typescript-eslint/no-unused-vars",
    ],
    [
      "tsx",
      "type Props = { src: string };\nexport const Preview = ({ src }: Props) => <img src={src} />;\n",
      "jsx-a11y/alt-text",
    ],
  ])(
    "retains %s lint coverage for %s (%s)",
    async (extension, source, rule) => {
      const [result] = await eslint.lintText(source, {
        filePath: fixturePath(extension),
      });

      expect(result.fatalErrorCount).toBe(0);
      expect(result.messages.map(({ ruleId }) => ruleId)).toContain(rule);
    },
  );
});
