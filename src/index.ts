export default function presetsVite(): { plugins: string[] } {
  return {
    plugins: [
      require.resolve("./plugins/dev"),
      require.resolve("./plugins/commands/modifyViteCSSPlugin"),

      require.resolve("./plugins/html"),

      require.resolve("./plugins/features/vite"),
      require.resolve("./plugins/features/commonjsModules"),
      require.resolve("./plugins/features/replace"),
    ],
  };
}
