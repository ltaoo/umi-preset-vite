import { IApi } from "@umijs/types";

export default (api: IApi) => {
  api.describe({
    key: "commonjsModules",
    config: {
      schema(joi) {
        return joi.array();
      },
    },
  });
};
