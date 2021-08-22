export function viteRemovePlugin() {
  return {
    name: "preset-vite:remove",
    apply: "serve",
    transform(code: string, id: string) {
      let result = code;
      if (/\.umi\/umi\.ts/.test(id)) {
        result = result.replace(/if \(module\.hot\)(.|\n)+/, "");
      }
      return {
        code: result,
        map: null,
        warnings: null,
      };
    },
  };
}
