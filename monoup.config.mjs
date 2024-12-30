import { defineConfig } from 'monoup';

export default defineConfig({
  // 基础信息
  name: 'minigame',
  version: '0.0.9',
  monorepo: true,
  sourcemap: false,

  // 构建配置覆盖
  build: {
    // 入口文件
    packageEntry: 'index.ts',

    // TypeScript 配置
    typescript: {
      enabled: true, // 是否启用 TypeScript
      declaration: true, // 是否生成声明文件
      removeComments: false,
    },

    // 构建排除
    baseExternals: ['path', 'fs', 'tslib'],
  },
});
