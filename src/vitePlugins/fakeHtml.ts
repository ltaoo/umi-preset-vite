import { ViteDevServer } from "vite";

import { readFileSync } from "fs";

export default function fakeHtml(filepath: string) {
  const HOME_PAGE_PATH = "/index.html";

  return {
    name: "preset-vite:fake-html",
    async configureServer(server: ViteDevServer) {
      return () => {
        server.middlewares.use((req: any, res, next) => {
          const url = req._parsedUrl.pathname;
          if (url === HOME_PAGE_PATH) {
            const content = readFileSync(filepath);
            res.statusCode = 200;
            return res.end(content);
          }
          return next();
        });
      };
    },
  };
}
