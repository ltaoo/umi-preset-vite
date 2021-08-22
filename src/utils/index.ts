import { existsSync, readdirSync, readFileSync } from "fs";
import { join } from "path";

import { IConfig } from "@umijs/types";
import { isPluginOrPreset, PluginType } from "@umijs/core";
import { rimraf, chokidar, lodash, winPath } from "@umijs/utils";
import { UserConfig } from "vite";

function getUmiPlugins(opts: { pkg: any }) {
  return Object.keys({
    ...opts.pkg.dependencies,
    ...opts.pkg.devDependencies,
  }).filter((name) => {
    return (
      isPluginOrPreset(PluginType.plugin, name) ||
      isPluginOrPreset(PluginType.preset, name)
    );
  });
}

function getUmiPluginsFromPkgPath(opts: { pkgPath: string }) {
  let pkg = {};
  if (existsSync(opts.pkgPath)) {
    try {
      pkg = JSON.parse(readFileSync(opts.pkgPath, "utf-8"));
    } catch (e) {}
  }
  return getUmiPlugins({ pkg });
}

export function watchPkg(opts: { cwd: string; onChange: Function }) {
  const pkgPath = join(opts.cwd, "package.json");
  const plugins = getUmiPluginsFromPkgPath({ pkgPath });
  const watcher = chokidar.watch(pkgPath, {
    ignoreInitial: true,
  });
  watcher.on("all", () => {
    const newPlugins = getUmiPluginsFromPkgPath({ pkgPath });
    if (!lodash.isEqual(plugins, newPlugins)) {
      // 已经重启了，只处理一次就够了
      opts.onChange();
    }
  });
  return () => {
    watcher.close();
  };
}

export function watchPkgs(opts: { cwd: string; onChange: Function }) {
  const unwatchs = [watchPkg({ cwd: opts.cwd, onChange: opts.onChange })];
  if (winPath(opts.cwd) !== winPath(process.cwd())) {
    unwatchs.push(watchPkg({ cwd: process.cwd(), onChange: opts.onChange }));
  }
  return () => {
    unwatchs.forEach((unwatch) => {
      unwatch();
    });
  };
}

export function translateUserConfig2ViteConfig(
  userConfig: IConfig,
  defaultViteConfig: UserConfig = {}
) {
  const { vite = {}, devServer, proxy, define, theme, alias } = userConfig;
  const {
    plugins = [],
    define: viteDefine,
    server,
    optimizeDeps = {},
    resolve = {},
    css = {},
    ...restViteConfig
  } = defaultViteConfig as UserConfig;
  return {
    ...restViteConfig,
    ...vite,
    server: {
      // @ts-ignore
      host: devServer?.host || server?.host,
      // @ts-ignore
      port: devServer?.port || server?.port,
      proxy,
    },
    plugins: [...plugins, ...(vite.plugins || [])],
    define: {
      ...viteDefine,
      ...(define || {}),
    },
    optimizeDeps: {
      ...optimizeDeps,
      ...vite.optimizeDeps,
      include: (optimizeDeps.include || []).concat(
        vite.optimizeDeps?.include || []
      ),
      exclude: (optimizeDeps.exclude || []).concat(
        vite.optimizeDeps?.exclude || []
      ),
      esbuildOptions: {
        ...(optimizeDeps.esbuildOptions || {}),
        ...(vite.optimizeDeps?.esbuildOptions || {}),
        plugins: [
          ...(optimizeDeps.esbuildOptions?.plugins || []),
          ...(vite.optimizeDeps?.esbuildOptions?.plugins || []),
        ],
      },
    },
    resolve: {
      ...resolve,
      alias: [
        // @ts-ignore
        ...(resolve.alias || []),
        ...translateAlias(alias),
      ],
    },
    css: {
      ...css,
      ...(vite.css || {}),
      preprocessorOptions: {
        ...(css.preprocessorOptions || {}),
        ...(vite.css?.preprocessorOptions || {}),
        less: {
          modifyVars: theme,
          ...(css.preprocessorOptions?.less || {}),
          ...(vite.css?.preprocessorOptions?.less || {}),
        },
      },
    },
  } as UserConfig;
}

export function translateAlias(umiAliasConfig: IConfig["alias"]) {
  if (umiAliasConfig === undefined || umiAliasConfig === false) {
    return [];
  }
  return Object.keys(umiAliasConfig).map((alias) => {
    const target = umiAliasConfig[alias];
    return {
      find: alias,
      replacement: target,
    };
  });
}

export function cleanTmpPathExceptCache({
  absTmpPath,
}: {
  absTmpPath: string;
}) {
  if (!existsSync(absTmpPath)) return;
  readdirSync(absTmpPath).forEach((file) => {
    if (file === `.cache`) return;
    rimraf.sync(join(absTmpPath, file));
  });
}
