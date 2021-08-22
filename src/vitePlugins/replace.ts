interface ReplacementOpt {
  match?: string | RegExp;
  find: string | RegExp;
  replacement: string | ((...args: string[]) => string);
}

function replace(code: string, opt: ReplacementOpt) {
  const { find, replacement } = opt;
  // code.replace('abc', 'abc');
  if (typeof find === "string" && typeof replacement === "string") {
    return code.replace(find, replacement);
  }
  // code.replace(/a(b)c/, ($1) => `c${$1}`);
  if (typeof find === "object" && typeof replacement === "function") {
    return code.replace(find, replacement);
  }
  // code.replace(/a(b)c/, 'hello');
  if (typeof find === "object" && typeof replacement === "string") {
    return code.replace(find, replacement);
  }
  console.log("replacement cannot be function when find is string.");
  return code;
}

export function transform(code: string, id: string, options: ReplacementOpt[]) {
  let result = code;

  for (let i = 0; i < options.length; i += 1) {
    const { match } = options[i];
    if (match !== undefined) {
      if (typeof match === "string" && id.indexOf(match) !== -1) {
        result = replace(result, options[i]);
      }
      if (typeof match === "object" && match.test(id)) {
        result = replace(result, options[i]);
      }
      continue;
    }
    result = replace(result, options[i]);
  }

  return result;
}

export function viteReplacePlugin(options: ReplacementOpt[]) {
  return {
    name: "preset-vite:replace",
    apply: "serve",
    transform: (code: string, id: string) => {
      const result = transform(code, id, options);
      return {
        code: result,
        map: null,
        warnings: null,
      };
    },
  };
}
