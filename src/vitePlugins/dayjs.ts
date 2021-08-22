const dayjsFile = "init-dayjs-webpack-plugin-entry.js";

export default function dayjs(options: { plugins: string[] }) {
  const { plugins } = options;
  return {
    name: "preset-vite:moment-to-dayjs",
    resolveId(id: string) {
      if (id === dayjsFile) {
        return dayjsFile;
      }
      return id;
    },
    load(id: string) {
      if (id === dayjsFile) {
        let source = `import dayjs from 'dayjs/dayjs.min';\n`;
        plugins.forEach((plugin) => {
          source += `import ${plugin} from 'dayjs/plugin/${plugin}';\n`;
        });

        plugins.forEach((plugin) => {
          source += `dayjs.extend(${plugin});\n`;
        });
        source += `import antdPlugin from 'antd-dayjs-webpack-plugin/src/antd-plugin';\ndayjs.extend(antdPlugin);`;

        return source;
      }
    },
  };
}
