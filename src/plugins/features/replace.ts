import { IApi } from "@umijs/types";

export default (api: IApi) => {
  api.describe({
    key: "replace",
    config: {
      schema(joi) {
        return joi.array();
      },
    },
  });
};
