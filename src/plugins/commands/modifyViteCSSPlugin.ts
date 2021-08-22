import { IApi } from "@umijs/types";

const path = require("path");
const fs = require("fs").promises;

const VITE_DIR = path.dirname(require.resolve("vite/package.json"));
const CHUNKS_DIR = path.resolve(VITE_DIR, "./dist/node/chunks");

async function findCSSPluginChunk() {
  try {
    await fs.stat(VITE_DIR);
    const chunks: string[] = await fs.readdir(CHUNKS_DIR);
    const chunkFiles = chunks
      .filter((chunk) => !chunk.endsWith(".map"))
      .map((chunk) => path.resolve(CHUNKS_DIR, chunk));
    for (let i = 0; i < chunkFiles.length; i += 1) {
      const cssPluginChunk = chunkFiles[i];
      const content = await await fs.readFile(cssPluginChunk, "utf-8");
      if (content.indexOf("compileCSS") !== -1) {
        return cssPluginChunk;
      }
    }
  } catch (err) {
    throw new Error("Please install vite.");
  }
}

async function modifyViteCSSPlugin(chunkFile: string) {
  const content = await fs.readFile(chunkFile, "utf-8");
  const newContent = content
    .replace(
      "const { modules: modulesOptions, preprocessorOptions }",
      "const { modules: modulesOptions, preprocessorOptions, isModule: checkIsModule }"
    )
    .replace(
      "const isModule = modulesOptions !== false && cssModuleRE.test(id);",
      "const isModule = modulesOptions !== false && (cssModuleRE.test(id) || !!(checkIsModule && checkIsModule(id)));"
    );
  await fs.writeFile(chunkFile, newContent);
}

async function run() {
  try {
    const cssPluginChunk = await findCSSPluginChunk();
    await modifyViteCSSPlugin(cssPluginChunk);
    console.log("Modify vite CSS Plugin source code success.");
  } catch (err) {
    //
    console.log(err.message);
  }
}

// run();

export default (api: IApi) => {
  api.registerCommand({
    name: "modifyViteCSSPlugin",
    description: "modify vite css plugin source code for auto css module",
    fn() {
      run();
    },
  });
};
