import { readFileSync } from "fs";

import { transformSync } from "@babel/core";

const exportRegex: RegExp = /\b(module\.exports|exports\.\w+|exports\s*=\s*)/;
const requireRegex: RegExp = /_{0,2}require\s*\(\s*(["'].*?["'])\s*\)/g;

export function simpleTransformCommonjs(code: string) {
  if (!requireRegex.test(code) && !exportRegex.test(code)) {
    return code;
  }
  return code
    .split("\n")
    .map((segment) => {
      return segment
        .replace(
          /(var|const|let) (.+) = require\((['"].+['"])\);/g,
          ($1, $2, $3, $4) => `import ${$3} from ${$4};`
        )
        .replace("module.exports =", "export default")
        .replace(/^require\((['"].+['"])\);/g, ($1, $2) => `import ${$2};`);
    })
    .join("\n");
}
/**
 * commonjs 代码转 es module
 * @param code
 * @param id
 * @returns
 */
export function transformCommonjs(code: string): string {
  let result = simpleTransformCommonjs(code);
  if (!requireRegex.test(result) && !exportRegex.test(result)) {
    return result;
  }
  const res = transformSync(result, {
    plugins: [[require.resolve("./plugin")]],
  });

  if (res === null) {
    return result;
  }
  if (res.code === null || res.code === undefined) {
    return result;
  }
  return res.code;
}

export function transform(
  code: string,
  id: string,
  options?: (string | RegExp)[]
) {
  let result = code;

  if (options === undefined) {
    return transformCommonjs(code);
  }

  for (let i = 0; i < options.length; i += 1) {
    const match = options[i];
    if (match !== undefined) {
      if (typeof match === "string" && id.indexOf(match) !== -1) {
        result = transformCommonjs(result);
      }
      if (typeof match === "object" && match.test(id)) {
        result = transformCommonjs(result);
      }
      continue;
    }
    result = transformCommonjs(result);
  }

  return result;
}

export default function viteCommonjs(options: (string | RegExp)[]) {
  return {
    name: "preset-vite:commonjs",
    transform(code: string, id: string) {
      const result = transform(code, id, options);
      if (result) {
        return {
          code: result,
          map: null,
          warnings: null,
        };
      }
      return null;
    },
  };
}

export function esbuildCommonjs(options: (string | RegExp)[]) {
  return {
    name: "preset-vite:commonjs",
    // @ts-ignore
    setup(build) {
      options
        .filter((opt) => typeof opt === "object")
        .forEach((opt) => {
          build.onLoad(
            {
              filter: opt,
              namespace: "file",
            },
            async ({ path: id }: { path: string }) => {
              const code = readFileSync(id).toString();
              let result = transform(code, id);
              if (result) {
                return {
                  contents: result,
                  loader: "js",
                };
              }
              return null;
            }
          );
        });
    },
  };
}
