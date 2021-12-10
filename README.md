# umi-preset-vite

## 使用

在项目中安装

```bash
yarn add umi-preset-vite -D
```

> 建议先在 `package.json scripts` 中增加 `"postinstall": "umi g tmp",`，或者安装依赖后手动执行

```bash
yarn umi g tmp
```

增加配置项 `vite`

```typescript
// .umirc or config/config.ts
export default defineConfig({
  vite: {},
});
```

启动开发服务

```bash
yarn umi vite:dev
```

## 常见问题

### run command failed, command vite:dev does not exists.

需要在在配置项中增加 `vite` 配置。

> 使用 `yarn umi dev` 时需要将该配置项移除。

### export

可在配置项中增加 `commonjsModules` 配置

```typescript
export default defineConfig({
  vite: {},
  commonjsModules: ["warning/warning.js"],
});
```

### 热更新不生效

`vite` 使用 `react-refresh` 实现热更新，`react-refresh` 不支持 `export default function () {}`、`export default () => {}` 等写法，代码尽量都写成

```typescript
const App = () => {
  return <div>app</div>;
};
export default App;
```

### CSS Module 未生效/样式错乱

> 0.2.x 版本不需要修改 `vite` 源码 `css module` 即可生效

在安装依赖后，会通过 `yarn umi modifyViteCSSPlugin` 修改 `vite` 源码，大概率是该命令没有执行成功，可重新执行

```bash
yarn umi modifyViteCSSPlugin
```

终端提示 `Modify vite CSS Plugin source code success` 表示成功，可重新执行 `yarn umi vite:dev` 启动开发服务。

### Preprocessor dependency "less" not found. Did you install it?

需要在项目中安装 `less`

```bash
yarn add less -D
```
