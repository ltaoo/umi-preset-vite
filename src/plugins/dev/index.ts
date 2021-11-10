import { resolve, dirname } from "path";
import { readFileSync } from "fs";

import { IApi } from "@umijs/types";
import { createServer, ViteDevServer } from "vite";
import reactRefresh from "@vitejs/plugin-react-refresh";
import viteReactJSX from "vite-react-jsx";

import {
  translateUserConfig2ViteConfig,
  watchPkg,
  cleanTmpPathExceptCache,
} from "../../utils";
import generateFiles from "../commands/generateFiles";

import fakeHtml from "../../vitePlugins/fakeHtml";
import autoCSSModule from "../../vitePlugins/autoCSSModule";
import viteCommonjs from "../../vitePlugins/commonjs";
import { viteReplacePlugin } from "../../vitePlugins/replace";
import { viteRemovePlugin } from "../../vitePlugins/remove";

export default (api: IApi) => {
  const {
    paths,
    utils: { chalk },
  } = api;

  if (api.userConfig.vite === undefined) {
    return;
  }

  let port: number;
  let hostname: string;
  let server: ViteDevServer;
  const unwatchs: Function[] = [];

  function destroy() {
    for (const unwatch of unwatchs) {
      unwatch();
    }
  }

  function onSignal(signal: string) {
    destroy();
    api.applyPlugins({
      key: "onExit",
      type: api.ApplyPluginsType.event,
      args: {
        signal,
      },
    });
    process.exit(0);
  }

  process.once("SIGINT", () => onSignal("SIGINT"));
  // kill(3) Ctrl-\
  process.once("SIGQUIT", () => onSignal("SIGQUIT"));
  // kill(15) default
  process.once("SIGTERM", () => onSignal("SIGTERM"));
  process.once("error", () => onSignal("ERROR"));

  api.modifyRendererPath(() => {
    return dirname(require.resolve("@umijs/renderer-react/package.json"));
  });

  if (api.userConfig.antd !== undefined) {
    api.addEntryImportsAhead(() => {
      return [
        {
          source: "antd/lib/style/index.less",
        },
        {
          source: "antd/lib/style/components.less",
        },
      ];
    });
  }

  function restartServer(server: ViteDevServer) {
    // ...
  }

  api.registerCommand({
    name: "vite:dev",
    description: "start a vite dev server for development",
    fn: async function ({ args }) {
      port =
        // @ts-ignore
        process.env.PORT || args?.port || api.config.devServer?.port || 8000;
      // @ts-ignore
      hostname = process.env.HOST || api.config.devServer?.host || "0.0.0.0";
      console.log(chalk.cyan("Starting the development server..."));
      process.send?.({ type: "UPDATE_PORT", port });

      // enable https, HTTP/2 by default when using --https
      const isHTTPS = process.env.HTTPS || args?.https;

      cleanTmpPathExceptCache({
        absTmpPath: paths.absTmpPath!,
      });
      const watch = process.env.WATCH !== "none";

      // generate files
      const unwatchGenerateFiles = await generateFiles({ api, watch });
      if (unwatchGenerateFiles) unwatchs.push(unwatchGenerateFiles);

      if (watch) {
        // watch pkg changes
        const unwatchPkg = watchPkg({
          cwd: api.cwd,
          onChange() {
            console.log();
            api.logger.info(`Plugins in package.json changed.`);
            api.restartServer();
          },
        });
        unwatchs.push(unwatchPkg);

        // watch config change
        const unwatchConfig = api.service.configInstance.watch({
          userConfig: api.service.userConfig,
          onChange: async ({ pluginChanged, userConfig, valueChanged }) => {
            if (pluginChanged.length) {
              console.log();
              api.logger.info(
                `Plugins of ${pluginChanged
                  .map((p) => p.key)
                  .join(", ")} changed.`
              );
              api.restartServer();
              if (server) {
                restartServer(server);
              }
            }
            if (valueChanged.length) {
              let reload = false;
              let regenerateTmpFiles = false;
              const fns: Function[] = [];
              const reloadConfigs: string[] = [];
              valueChanged.forEach(({ key, pluginId }) => {
                const { onChange } = api.service.plugins[pluginId].config || {};
                if (onChange === api.ConfigChangeType.regenerateTmpFiles) {
                  regenerateTmpFiles = true;
                }
                if (!onChange || onChange === api.ConfigChangeType.reload) {
                  reload = true;
                  reloadConfigs.push(key);
                }
                if (typeof onChange === "function") {
                  fns.push(onChange);
                }
              });

              if (reload) {
                console.log();
                api.logger.info(`Config ${reloadConfigs.join(", ")} changed.`);
                api.restartServer();
              } else {
                api.service.userConfig = api.service.configInstance.getUserConfig();
                // TODO: simplify, 和 Service 里的逻辑重复了
                // 需要 Service 露出方法
                const defaultConfig = await api.applyPlugins({
                  key: "modifyDefaultConfig",
                  type: api.ApplyPluginsType.modify,
                  initialValue: await api.service.configInstance.getDefaultConfig(),
                });
                api.service.config = await api.applyPlugins({
                  key: "modifyConfig",
                  type: api.ApplyPluginsType.modify,
                  initialValue: api.service.configInstance.getConfig({
                    defaultConfig,
                  }) as any,
                });
                if (regenerateTmpFiles) {
                  await generateFiles({ api });
                } else {
                  fns.forEach((fn) => fn());
                }
              }
            }
          },
        });
        unwatchs.push(unwatchConfig);
      }

      // dev
      const beforeMiddlewares = [
        ...(await api.applyPlugins({
          key: "addBeforeMiddlewares",
          type: api.ApplyPluginsType.add,
          initialValue: [],
          args: {},
        })),
      ];
      const middlewares = [
        ...(await api.applyPlugins({
          key: "addMiddlewares",
          type: api.ApplyPluginsType.add,
          initialValue: [],
          args: {},
        })),
      ];

      const userConfig = api.service.config;
      const { absSrcPath, absTmpPath } = api.paths;

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
      const mergedViteUserConfig = translateUserConfig2ViteConfig(userConfig!, {
        plugins: [
          reactRefresh(),
          viteReactJSX(),
          fakeHtml(resolve(absTmpPath!, "index.html")),
          // @todo 有一个css转换插件, 可以尝试替换下 https://github.com/Summer-andy/vite-plugin-transform-css-modules
          // @ts-ignore
          autoCSSModule(),
          viteReplacePlugin(
            // 考虑合并 match 相同的
            (userConfig?.replace || []).concat(COMPAT_REPLACEMENT_OPTIONS)
          ),
          viteRemovePlugin(),
          viteCommonjs(userConfig?.commonjsModules || []),
        ],
        server: {
          host: hostname,
        },
        define: {
          "process.env.__IS_SERVER": JSON.stringify(false),
        },
        optimizeDeps: {
          entries: "**/src/.umi/index.html",
          exclude: [
            "/@vite/env",
            "@vite/env",
            "@vite/client",
            "/@vite/client",
            "umi",
          ],
        },
        resolve: {
          alias: [
            { find: /^~@/, replacement: absSrcPath! },
            { find: /^~/, replacement: "" },
            {
              find: "@@/",
              replacement: `${absTmpPath}/`,
            },
            {
              find: "@/",
              replacement: `${absSrcPath}/`,
            },
          ],
        },
        css: {
          // @ts-ignore
          isModule(id) {
            if (id.indexOf("module=true") !== -1) {
              return true;
            }
          },
          preprocessorOptions: {
            less: {
              javascriptEnabled: true,
            },
          },
        },
      });
      server = await createServer(mergedViteUserConfig);
      await server.listen(port, false);
      return {
        destroy,
      };
    },
  });
};
