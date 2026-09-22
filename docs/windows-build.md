# 技得音乐 Windows x64 构建

沿用 Electron 40.10.2 + Svelte，Windows 产品版本为 1.2.1。不使用网易云音乐的专有客户端代码或品牌素材。

```sh
pnpm install --frozen-lockfile
pnpm build:windows
node scripts/verify-windows-package.cjs build
```

Apple Silicon 交叉构建请使用原生 arm64 Node（本机是 `/opt/homebrew/bin/node`），避免加载错误架构的 rolldown 绑定：

```sh
PATH="/opt/homebrew/bin:$PATH" pnpm build:windows
```

- `build:windows` 显式设置 `JIDE_TARGET_PLATFORM=win32`，避免把 Mac 的窗口分支编入 Windows 包。
- 构建会将候选副本的 `better-sqlite3` 切换为 Windows x64 / Electron ABI 143。不要将该依赖文件用于 Mac 运行验证；各平台使用隔离构建目录。
- 默认输出 `build/技得音乐-1.2.1-x64-Setup.exe` 和 `build/技得音乐-1.2.1-x64-portable.exe`；`JIDE_BUILD_OUTPUT` 可指定其他目录。
- Setup 默认当前用户安装，不主动请求提权，不在完成后自动启动。portable 无需安装。
- 无证书时构建为未签名，不会关闭 SmartScreen、杀毒软件或修改系统安全策略。分发前可配置自己的合法 Authenticode 证书。
- 不会上传 GitHub、创建 Release 或自动更新到上游。仓库中的 Actions 仅在用户主动触发/手动运行工作流时执行既有流程。
- 新 Windows 用户只初始化随包提供的 GD Studio 与开放曲库扩展；不复制开发者的收藏、账户、Cookies 或私人音源配置。

## 工具链修复

`app-builder-lib@26.13.1` 使用了 `builder-util@26.13.0` 中缺少的 `spawnAndWriteWithOutput`。仓库内 `builder-compat.cjs` 在该导出缺失时提供等价进程封装，保留 stdout、stderr、非零状态与超时，不修改依赖缓存。NSIS 在过长的 pnpm 模板目录上可触发 SIGABRT；封装会将官方模板原样复制到短临时目录，完成后清理，不改变安装器逻辑。

NSIS 固定使用 electron-builder 官方 `toolsets.nsis=1.2.1`（NSIS 3.12）校验下载包，为各构建宿主选择匹配架构的编译器。

## 验证边界

`verify-windows-package.cjs` 验证 PE 类型、主程序及 SQLite x64 架构、ABI、版本、图标、ASAR 入口、开放扩展资源和无用户数据库。静态检查不代表已在真实 Windows 上安装或播放；交付时应另外记录真实 Windows 启动、安装/卸载、搜索和播放结果。
