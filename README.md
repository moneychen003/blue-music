<p align="center">
  <img height="120" src="./packages/desktop/resources/icons/512x512.png" alt="Blue Music logo">
</p>

<h1 align="center">蓝亦云音乐 · Blue Music</h1>

<p align="center">一个免费开源、纯净无广告的跨平台音乐播放器 —— 网易云风格的蓝色界面。</p>

<p align="center">
  <img alt="platform" src="https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux%20%7C%20Web-2d82eb">
  <img alt="based on" src="https://img.shields.io/badge/based%20on-Any%20Listen-blue">
  <img alt="license" src="https://img.shields.io/badge/license-Apache--2.0-green">
</p>

---

> **蓝亦云音乐（blue-music）** 基于优秀的开源项目 [Any Listen](https://github.com/any-listen/any-listen)（作者 [lyswhut](https://github.com/lyswhut)）二次开发,在其纯净的播放内核之上,做了一次**网易云风格 + 蓝色主题**的体验改造,并补全了一批日常高频功能。支持 **Windows / macOS / Linux / Web**。

## ✨ 相比 Any Listen,新增/改造了什么

这是本项目的核心。下面是在 Any Listen 基础上自研新增或重做的部分:

### 🎨 全新视觉
- **蓝色主题**:强调色从红改为蓝(`#2d82eb`),按钮 / 选中 / 进度 / 角标全局统一。
- **原创应用图标**:蓝色渐变圆角方 + 白色双音符,自绘原创(不使用任何第三方图标)。
- **网易云风格布局**:精选 / 排行榜 / 我喜欢 / 最近播放 / 我的收藏的左侧导航与详情页。
- 去掉了顶栏账户展示、捐赠入口等冗余元素,更纯净。

### ❤️ 真实数据打通(原为占位/未接)
- **「我喜欢的音乐」** 接入真实本地 LOVE 列表,虚拟滚动流畅承载数千首;**跨音源红心识别**(换源/不同入口播放同一首歌也能正确点亮)。
- **「精选」→ 真实歌单广场**,**「排行榜」→ 真实榜单数据**。
- **「最近播放」** 接入真实播放历史。
- 列表内**搜索框**、右键**收藏到我喜欢**。

### ⭐ 收藏专辑 / 歌单(全新)
- 在歌单/专辑详情页一键**收藏**(书签式引用,区别于把歌复制进"我的列表"的"保存")。
- 新增侧边栏**「我的收藏」**网格页,点开仍是原在线详情。

### 🎵 透明桌面歌词(重做)
- 悬浮于桌面的**透明置顶逐行歌词**,跟随播放进度高亮。
- 可**自由拖动**位置;支持**锁定 → 鼠标穿透**(锁定后点击直接落到下层,不挡 Dock/桌面操作),悬停锁按钮即可解锁。
- 播放栏一键开关「桌词」。

### ⬇️ 桌面下载管理(全新)
- 右键 / 详情页**下载**在线歌曲到本地,按**歌手分目录**保存。
- 独立**「下载管理」**页:实时进度、**暂停 / 续传 / 取消**、**自定义下载目录**、**下载音质**设置。
- **自动去重**(下载过的跳过)、**批量多选下载**(列表勾选框 → 右键下载所选)。

### 🎚️ 播放与交互
- **音质选择真正生效**:按当前歌曲实际可用音质过滤档位,选无损/Hi-Res 会真的按该档取流并自动降级。
- **空格键播放/暂停**(输入框聚焦时不误触)。
- **窗口可自由缩放 / 最大化**。
- **粘贴网易云歌单链接自动新建列表**(自动获取歌单名)。

### 🏗️ 工程化
- **GitHub Actions 三平台自动打包**(Windows / macOS / Linux),推 `v*` 标签即出 Release。
- 修复并**固化**了 electron-builder 在 pnpm 下的 macOS 签名补丁。

> 播放内核、扩展(音源)体系、本地/WebDAV 列表等基础能力均来自 Any Listen,在此特别致谢。

## 📦 下载安装

前往 [**Releases**](https://github.com/moneychen003/blue-music/releases) 或 [**Actions**](https://github.com/moneychen003/blue-music/actions) 下载对应平台的包:

| 平台 | 形态 | 说明 |
| --- | --- | --- |
| Windows | `*-win_x64-green.7z` | 解压后运行 `Blue Music.exe`,免安装 |
| macOS (Apple Silicon) | `*-arm64.dmg` / `*.zip` | ad-hoc 签名,首次打开请右键「打开」 |
| Linux | `*_amd64.deb` | `sudo dpkg -i` 安装 |

## 🛠️ 本地开发

> 需要 **Node ≥ 22**、**pnpm 10**。Apple Silicon 请确保使用 arm64 的 node。

```bash
pnpm install
pnpm dev:desktop   # 桌面端开发(Electron + Vite dev server)
pnpm dev:web       # Web 服务端开发(可选)
```

## 🚀 自行打包

```bash
# 本地(仅能打当前系统)
pnpm -F @shared/scripts build:desktop:mac     # macOS
pnpm -F @shared/scripts build:desktop:linux   # Linux

# 三平台一起 → 用 GitHub Actions:
#   仓库 Actions → "Build Packages" → Run workflow
#   或推标签:git tag v0.7.0 && git push origin v0.7.0(自动发 Release)
```

## 🙏 致谢

本项目站在 [Any Listen](https://github.com/any-listen/any-listen) 的肩膀上,感谢原作者 **[lyswhut](https://github.com/lyswhut)** 及其贡献者的无私工作。使用与分发请同时遵循其开源许可。

## 📄 许可证

沿用上游 [Apache-2.0](./LICENSE) 许可证。
