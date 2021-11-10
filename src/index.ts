export default function presetsVite(): { plugins: string[] } {
  return {
    plugins: [
      require.resolve("./plugins/dev"),
      // 不应支持对vite源码的修改, 会导致后续操作不稳定
      // require.resolve("./plugins/commands/modifyViteCSSPlugin"),

      require.resolve("./plugins/html"),

      require.resolve("./plugins/features/vite"),
      require.resolve("./plugins/features/commonjsModules"),
      require.resolve("./plugins/features/replace"),
    ],
  };
}
