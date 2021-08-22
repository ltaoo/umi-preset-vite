/**
 * @file auto CSS Module
 */
export default function autoCSSModulePlugin(options?: any) {
  return {
    name: "preset-vite:auto-css-module",
    config() {
      return {
        css: {
          isModule(id: string) {
            return id.indexOf("module=true") !== -1;
          },
        },
      };
    },
    transform(code: string, id: string) {
      let result = code;
      const REG_EXP = /(import [a-z]+ from ["'].+\.[less|css|sass|scss]+)(["'])/;
      if (code.match(REG_EXP)) {
        result = code.replace(REG_EXP, ($1, $2, $3) => {
          return `${$2}?module=true${$3}`;
        });
      }
      return {
        code: result,
        map: null,
        warnings: null,
      };
    },
  };
}
