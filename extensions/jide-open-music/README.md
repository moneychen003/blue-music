# 技得开放音乐 0.1.0

本地透明扩展；只使用 Any Listen `internet` 权限，不读取歌单、播放器或账户，不下载执行远端脚本。

- `musopen`：Internet Archive 的 MusopenCollectionAsFlac，条目明确标记 Public Domain。按曲名/艺术家搜索，支持 MP3 和存在对应文件时的原始 FLAC。关键词通常用英文（如 Bach / Beethoven / Mozart）。
- `archive_cc0`：Internet Archive 的 CC0 公共音频归档条目发现；一次最多 5 个条目，只显示每个归档的第一首 MP3，不是商业流行歌曲聚合源。归档声明不构成逐首版权的法律保证。
- Jamendo 不注册、不默认启用；需用户自有应用 client_id，本包不包含公共测试 key。
- 两个来源依赖同一个 archive.org，不是两个独立故障域。HTTP 音频可取不是已验证应用内实际播放。
- 应用中的 `128k` 是兼容的 MP3 播放档位，实际 MP3 保留原文件 VBR；bitrateLabel 显示文件真实元数据。FLAC 不转码、不伪造无损。
- 对导入歌单的取址重新校验 item 名称、音频文件存在和公开许可证；仅 https://archive.org/metadata /advancedsearch.php /download /services/img。
- 文件元数据缓存 10 分钟，最多 30 条目；网络 timeout 12 秒。

文档：
- https://archive.org/details/MusopenCollectionAsFlac
- https://archive.org/services/docs/api/metadata-schema/index.html
- https://archive.org/advancedsearch.php

本轮验证：测试脚本位于相邻目录。`test-adapter.cjs` 7项PASS；`test-host-contract.cjs` 使用当前项目实际 verifyManifest 和 verifyOnlineMusicArray，PASS；`test-live.cjs` 返回 Bach 32曲及可取的 Aria MP3，Range HTTP206/audio/mpeg/4096字节 ID3头。未安装进运行中app。
