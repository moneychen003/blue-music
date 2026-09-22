# GD 音乐台 0.3.2 — bundled upstream extension

Author: e^iπ=-1. Upstream: https://github.com/Morpheus799/gdstudio-repo
License: Apache-2.0 (see LICENSE, retrieved from upstream main/LICENSE).

The original signed release gdstudio_v0.3.2.alix was extracted without changing
main.js, manifest.json, icon or translations. ext.tgz and sig preserve the original
signature evidence. No accounts, signing tokens, playlists, storage or user data
are included. The application verifies the pinned inventory and RSA-SHA256
signature before first installation. Only the installed manifest receives the
verified publicKey, matching Any Listen's normal signed-extension installer.

Upstream permissions are preserved: internet, player, music_list. These are more
than the internet-only Jide public-domain adapter; disable/uninstall GD in the
extension manager if unwanted.

Bundled does not mean every upstream service works. QQ, TIDAL, QOBUZ, Apple,
YouTube Music and Spotify still require the user's own authorized signing server;
none is supplied and no signature/authentication bypass is included. Kuwo and
other upstream services may be unavailable. Netease availability is verified at
release time, not guaranteed permanently.
