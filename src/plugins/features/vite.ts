import { IApi } from "@umijs/types";

export default (api: IApi) => {
  api.describe({
    key: "vite",
    config: {
      schema(joi) {
        return joi.object();
      },
    },
  });
};
