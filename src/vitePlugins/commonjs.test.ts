import { transform } from "./commonjs";

test("normal commonjs module", () => {
  expect(
    transform(
      `const util = require('./util');
module.exports = () => util;`,
      "/node_modules/@umijs/runtime/dist/index.js",
      ["runtime/dist/index.js"]
    )
  ).toBe(`import util from './util';
export default () => util;`);
});

test("antd less require", () => {
  expect(
    transform(
      `require('./index.less');
require('./other.less');`,
      "/node_modules/antd/lib/button/style/index.js",
      [/antd\/lib\/(.+)\/style/]
    )
  ).toBe(`import './index.less';
import './other.less';`);
});
