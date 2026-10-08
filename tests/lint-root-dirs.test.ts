import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { Linter } from "eslint";
import { createRequire } from "node:module";
import { afterEach, describe, expect, it } from "vitest";

// Exercise Next's actual consumer of the tinyglobby alias, including its
// directory-only option; an audit result alone cannot establish compatibility.
const { getRootDirs } = createRequire(import.meta.url)(
  "@next/eslint-plugin-next/dist/utils/get-root-dirs",
) as {
  getRootDirs(context: {
    cwd: string;
    settings: { next?: { rootDir?: string | string[] } };
  }): string[];
};
const temporaryRoots: string[] = [];
afterEach(() => {
  for (const root of temporaryRoots.splice(0)) rmSync(root, { recursive: true });
});
function fixture() {
  const root = mkdtempSync(join(tmpdir(), "janeq lint roots "));
  temporaryRoots.push(root);
  const first = join(root, "apps", "alpha");
  const second = join(root, "apps", "beta");
  mkdirSync(first, { recursive: true });
  mkdirSync(second, { recursive: true });
  writeFileSync(join(root, "apps", "not-a-directory.ts"), "export {};");
  return { root, first, second };
}
describe("Next lint root discovery compatibility", () => {
  it("keeps the default root when no glob is configured", () => {
    const { root } = fixture();
    expect(getRootDirs({ cwd: root, settings: {} })).toEqual([root]);
  });
  it("expands configured roots and excludes matching files", () => {
    const { root, first, second } = fixture();
    expect(
      getRootDirs({ cwd: root, settings: { next: { rootDir: join(root, "apps", "*") } } }).map((path) => resolve(path)).sort(),
    ).toEqual([first, second].sort());
  });
  it("supports array roots and normalizes backslash separators", () => {
    const { root, first, second } = fixture();
    expect(
      getRootDirs({ cwd: root, settings: { next: { rootDir: [first.replaceAll("/", "\\"), second] } } }).map((path) => resolve(path)).sort(),
    ).toEqual([first, second].sort());
  });
  it("preserves Next's actual link-rule enforcement under discovered roots", () => {
    const { root, first } = fixture();
    mkdirSync(join(first, "pages"));
    writeFileSync(join(first, "pages", "about.js"), "export default function Page() {};");
    const plugin = createRequire(import.meta.url)("@next/eslint-plugin-next") as NonNullable<Linter.Config["plugins"]>[string];
    const messages = new Linter().verify(
      'const Example = () => <a href="/about">About</a>;',
      [{
        files: ["**/*.jsx"],
        languageOptions: { ecmaVersion: 2022, sourceType: "module", parserOptions: { ecmaFeatures: { jsx: true } } },
        plugins: { next: plugin },
        settings: { next: { rootDir: join(root, "apps", "*") } },
        rules: { "next/no-html-link-for-pages": "error" },
      }],
      { filename: "example.jsx" },
    );
    expect(messages.map((message) => message.ruleId)).toContain("next/no-html-link-for-pages");
  });
});
