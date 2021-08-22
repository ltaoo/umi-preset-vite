import { IApi } from "@umijs/types";
import { winPath } from "@umijs/utils";

import { getHtmlGenerator } from "../../utils/html";

export function importsToStr(
  imports: { source: string; specifier?: string }[]
) {
  return imports.map((imp) => {
    const { source, specifier } = imp;
    if (specifier) {
      return `import ${specifier} from '${winPath(source)}';`;
    } else {
      return `import '${winPath(source)}';`;
    }
  });
}

export default function (api: IApi) {
  if (api.userConfig.vite === undefined) {
    return;
  }
  api.addHTMLHeadScripts(() => {
    return [
      { src: "/@vite/client", type: "module" },
      {
        type: "module",
        content: `import RefreshRuntime from "/@react-refresh"
        RefreshRuntime.injectIntoGlobalHook(window)
        window.$RefreshReg$ = () => {}
        window.$RefreshSig$ = () => (type) => type
        window.__vite_plugin_react_preamble_installed__ = true`,
      },
    ];
  });
  api.addHTMLScripts(() => {
    return [{ src: "/src/.umi/umi.ts", type: "module" }];
  });

  api.onGenerateFiles(async (args) => {
    const html = getHtmlGenerator({ api });
    const defaultContent = await html.getContent({
      route: {},
    });
    const content = await api.applyPlugins({
      key: "modifyDevHTMLContent",
      type: api.ApplyPluginsType.modify,
      initialValue: defaultContent,
    });
    api.writeTmpFile({
      path: "index.html",
      content,
    });
  });
}
