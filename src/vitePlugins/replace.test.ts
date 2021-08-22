import { transform } from "./replace";

const COMPAT_REPLACEMENT_OPTIONS = [
  {
    match: /@umijs\/runtime/,
    find: "return obj && obj.__esModule ? obj.default : obj;",
    replacement: "return obj && obj.default ? obj.default : obj;",
  },
  {
    match: /\.umi\/umi\.ts/,
    find: /require\(['"]\.\.\/global\.less['"]\);/,
    replacement: "import '../global.less';",
  },
  {
    match: /\.umi\/umi\.ts/,
    find: "@umijs/renderer-react/dist/index.js",
    replacement: "@umijs/renderer-react",
  },
  {
    match: /\/plugin-dva\/dva\.ts/,
    find: "dva-immer/dist/index.js",
    replacement: "dva-immer/dist/index.esm.js",
  },
];

test("@umijs runtime resolve fn", () => {
  expect(
    transform(
      `// some code
function resolve(obj) {
  return obj && obj.__esModule ? obj.default : obj;
}`,
      "/node_modules/@umijs/runtime/dist/index.js",
      [COMPAT_REPLACEMENT_OPTIONS[0]]
    )
  ).toBe(`// some code
function resolve(obj) {
  return obj && obj.default ? obj.default : obj;
}`);
});

test("umi.ts require global styles", () => {
  expect(
    transform(
      `// some code
require('../global.less');`,
      "src/.umi/umi.ts",
      [COMPAT_REPLACEMENT_OPTIONS[1]]
    )
  ).toBe(`// some code
import '../global.less';`);
});

test("umi.ts renderer package path", () => {
  expect(
    transform(
      `// some code
import { renderClient } from '/Users/litao/Documents/wpt/mifan-admin/node_modules/@umijs/renderer-react/dist/index.js';`,
      "src/.umi/umi.ts",
      [COMPAT_REPLACEMENT_OPTIONS[2]]
    )
  ).toBe(`// some code
import { renderClient } from '/Users/litao/Documents/wpt/mifan-admin/node_modules/@umijs/renderer-react';`);
});

test("pre bundling require file", () => {
  expect(
    transform(
      `// some code
__require('/Users/project/node_modules/antd/lib/button/style/index.less');`,
      "/Users/project/node_modules/antd/lib/button/style/index.js",
      [
        {
          match: /\/style\/index\.js/,
          find: /__require\((['"].+['"])\);/,
          replacement: ($1, $2) => `import ${$2};`,
        },
      ]
    )
  ).toBe(`// some code
import '/Users/project/node_modules/antd/lib/button/style/index.less';`);
});

test("component require less file in js file", () => {
  expect(
    transform(
      `// some code
__require('/Users/project/node_modules/antd/lib/button/style/index.less');`,
      "/Users/project/node_modules/antd/lib/button/style/index.js",
      [
        {
          match: /\/style\/index\.js/,
          find: /__require\((['"].+\.less['"])\);/,
          replacement: ($1, $2) => `import ${$2};`,
        },
      ]
    )
  ).toBe(`// some code
import '/Users/project/node_modules/antd/lib/button/style/index.less';`);
});

// 相同 match
test("umi.ts require global styles", () => {
  expect(
    transform(
      `// some code
import { renderClient } from '/Users/litao/Documents/wpt/mifan-admin/node_modules/@umijs/renderer-react/dist/index.js';
require('../global.less');`,
      "src/.umi/umi.ts",
      [COMPAT_REPLACEMENT_OPTIONS[1], COMPAT_REPLACEMENT_OPTIONS[2]]
    )
  ).toBe(`// some code
import { renderClient } from '/Users/litao/Documents/wpt/mifan-admin/node_modules/@umijs/renderer-react';
import '../global.less';`);
});
