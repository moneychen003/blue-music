<p align="center"><img width="112" src="packages/desktop/resources/icons/128x128.png" alt="技得音乐"></p>

# 技得音乐 · Jide Music

基于 [Any Listen](https://github.com/any-listen/any-listen) 的跨平台音乐播放器。蓝色品牌，网易云式信息架构；Electron + Svelte，真实本地曲库、音源扩展、搜索、歌词及播放队列。

> **许可说明**：本仓库公开源码，但沿用上游 [LICENSE](LICENSE) 中的自定义 AGPL v3 + 非商业使用附加条款，**不是 Apache-2.0 或 MIT，也不表示允许未经授权的商业使用**。这些附加限制意味着它不属于符合 OSI 定义的标准开源许可。第三方组件保留各自许可，详见下方致谢。

## 下载

从 [GitHub Releases](https://github.com/moneychen003/blue-music/releases) 下载：

| 平台 | 当前提供的版本 | 文件 |
|---|---|---|
| Windows x64 | 1.2.1 | Setup.exe 安装版 / portable.exe 免安装启动版 |
| macOS Apple Silicon | 1.1.0 | mac-arm64.zip |

Windows 与 Mac 此次分别发布，不把不同版本标成同一构建。Windows 包未进行 Windows 实机安装/音频设备测试；Mac 包已在 Apple Silicon 实机启动并观察播放进度。Windows 未签名，Mac 为本地 ad-hoc 签名且未做 Apple 公证；请核对来源和 SHA-256，不建议关闭系统安全防护。

## 功能与边界

- 发现音乐、排行榜、真实收藏、最近播放、本地音乐库、下载及音源管理。
- 固定底部播放器；异步音源访问、失败切换和冷却、坏缓存识别、请求超时处理。
- Windows 1.2.1 的最小化/最大化/还原为真实窗口操作，不是装饰按钮。
- 页面不会填充假歌曲、假歌单数量或演示账户。音源不提供歌单时明确展示空状态。
- 不包含网易云账户登录、会员授权或官方推荐算法；项目与网易云音乐官方无关联。
- 音源返回不保证每首歌可播放；联网接口随时可能变化。仅播放/下载你有权使用的内容。

## Windows 内置音源

Windows 1.2.1 将兼容的 GD 0.3.2 和技得开放音乐资源保存在安装包内，首次运行于全新资料目录自动初始化，不需要再找脚本导入。

- GD 0.3.2：官方原包验签、保留更新公钥身份和 Apache-2.0 许可。网易样本已做接口验证；需要额外签名服务的来源并不会因此自动可用。
- Musopen / Archive CC0：公共领域/开放曲库，依赖相同 Archive 上游，不是两个独立服务器。
- 不包含私人 Cookie、账号数据、用户歌单数据库、混淆 LX 脚本或 API Key。
- 已有用户的扩展、禁用/删除选择不会被首装逻辑覆盖。安装目录保留内置资源；额外音源需自行审查后通过音源管理安装。
- Mac 1.1.0 为已有独立版本，额外提供 `.alix` 扩展包供手动导入，不宣称其有 Windows 1.2.1 的首装功能。

## 开发与构建

需要兼容项目 `engines` 的 Node.js 和 `packageManager` 指定的 pnpm。Apple Silicon 应使用 arm64 Node。

```sh
pnpm install --frozen-lockfile
pnpm dev:desktop
# Windows 1.2.1 tag/current main (not this older Mac tag):
pnpm build:windows
# Mac source tag v1.1.0:
pnpm -F @shared/scripts build:desktop
pnpm -F desktop pack:mac:dmg:arm64
```

Windows 构建显式设置 win32 目标分支，包含 Electron 与对应 Windows x64 SQLite。仓库兼容层修复已知 NSIS helper 和长 include 路径问题，不修改全局依赖缓存。发布工作流仅手动触发；打 tag 不会自动上传未经检查的二进制。

## 验证

有针对性的播放、界面、窗口 IPC、首次音源初始化和包结构检查。Windows EXE 解包后的主程序/ASAR 与打包输入比较 SHA-256；这不等于 Windows 安装或实机运行验证。全库类型检查存在既有依赖/旁支问题，不把成功构建称为全库 typecheck 通过。

## 版本与致谢

- Any Listen / lyswhut 及贡献者：本项目的播放器、扩展体系与基础实现，保留原有许可及致谢。
- GDStudio extension / e^iπ=-1：[上游仓库](https://github.com/Morpheus799/gdstudio-repo)，附带文件保留其 Apache-2.0 许可和签名材料。
- 技得开放音乐：本项目提供的透明公共领域音源适配。

库名 `blue-music` 是历史仓库名称，产品展示名为「技得音乐」。内部数据身份保留 `blue-music`，避免升级后误以为原曲库丢失。
