# Windows 内置音源（1.2.1）

安装包实际包含以下源码资源，不依赖 Mac 用户目录，也不只是外部下载链接：

|扩展|内置版本|原始权限|情况|
|---|---|---|---|
|技得开放音乐|0.1.0|internet|Musopen 公共领域、Internet Archive CC0；需联网访问上游|
|GD 音乐台|0.3.2|internet、player、music_list|官方签名原包，原始源码和权限保留；可在扩展管理禁用/卸载|

GD 作者 e^iπ=-1，上游 https://github.com/Morpheus799/gdstudio-repo ，采用 Apache-2.0；完整许可证与归属说明随包保留。

## 首次启动和已有用户

Windows 的全新数据目录首次启动时，在扩展扫描前验证两个内置扩展，然后一起写入用户数据目录 `extension/ext`。完整文件 SHA-256 清单被程序固定；GD 的 RSA-SHA256 签名和发布公钥也必须匹配。两扩展和首装回执通过同一次目录重命名提交，不会安装半个扩展。

原始 GD `main.js`、`manifest.json`、图标和语言包未修改。只有安装到用户目录的 `manifest.json` 按官方安装机制增加已验签的 `publicKey` 字段，用于保持发布者身份；原始权限及其它字段不变。资源目录中的 `bundle-lock.json`、`ext.tgz` 和 `sig` 是原始包的验签材料，不复制为用户扩展配置。

已有 `extension/ext` 或 `extensions.json` 的用户不会自动加装、覆盖、重新启用或恢复删除的扩展。升级前已经使用 1.2.0 的用户，可通过扩展管理主动导入随发布提供的官方 `gdstudio_v0.3.2.alix`。此行为保留既有用户的禁用/删除选择；不是丢失了安装包中的音源。

没有导出或随包携带账号、Cookie、签名 token、歌单、datas/storage 或私人数据库。

## 可用性边界

内置不等于所有平台均可用。QQ、TIDAL、QOBUZ、Apple Music、YouTube Music、Spotify 仍需用户自己的获授权签名服务；没有预置签名服务器/密钥，也没有绕过签名。缺少签名配置时保留上游明确错误。酷我等平台可能失效。网易搜索和取址按发布时实测结果报告，不能保证上游长期可用，也不能把取址成功称为 Windows 实际播放成功。

## 维护验证

- `node scripts/tests/bundled-extension.mjs .`：临时目录离线契约测试，覆盖两源加载、原样权限、签名/文件损坏、错误身份、第二次启动、禁用/删除选择、原子提交。
- `node scripts/tests/gd-bundled-live.mjs .`：显式只读上游探测，从独立临时首装目录加载 GD，测试无签名失败与网易搜索/取址；不读取用户数据，不发送私人凭据。
- 更新内置扩展时必须重新审核上游、签名和权限，重新生成各自 `bundle-lock.json`，更新 `bundled.ts` 中固定的版本、清单哈希及（如更换发布者）公钥指纹。不能只修改文件或清单来避开校验。
