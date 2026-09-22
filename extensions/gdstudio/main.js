(function() {
	//#region src/shared/hostApi.ts
	var api = require("any-listen");
	var console = {
		log: api.logcat.info,
		error: api.logcat.error,
		warn: api.logcat.warn
	};
	api.env.version;
	var registerResourceAction = api.registerResourceAction;
	var player = api.player;
	var musicList = api.musicList;
	var configuration = api.configuration;
	var app = api.app;
	var request = api.request;
	api.t;
	api.utils.crypto;
	var dataConverter = api.utils.dataConverter;
	api.utils.iconv;
	api.utils.zlib;
	//#endregion
	//#region src/shared/searchPagination.ts
	/** Paginate the records actually returned by an API that provides no total. */
	function createSearchPagination(fetchBatch, getId, onPartialError = () => {}) {
		const items = [];
		const ids = /* @__PURE__ */ new Set();
		let nextApiPage = 1;
		let exhausted = false;
		let pending;
		const loadNextBatch = () => {
			if (pending) return pending;
			pending = fetchBatch(nextApiPage).then((batch) => {
				if (!batch.length) throw new Error("搜索返回空结果(可能是 API 限流,请稍后重试)");
				const newItems = batch.filter((item) => {
					const id = getId(item);
					if (ids.has(id)) return false;
					ids.add(id);
					return true;
				});
				if (!newItems.length) exhausted = true;
				items.push(...newItems);
				nextApiPage++;
			}).finally(() => {
				pending = void 0;
			});
			return pending;
		};
		return { async getPage(page, limit) {
			const start = (page - 1) * limit;
			const end = start + limit;
			try {
				while (items.length < end && !exhausted) await loadNextBatch();
			} catch (error) {
				if (start >= items.length) throw error;
				onPartialError(error);
			}
			return {
				list: items.slice(start, end),
				total: exhausted ? items.length : Math.ceil(items.length / limit) * limit + 1
			};
		} };
	}
	//#endregion
	//#region src/index.ts
	var MAIN_API_URL = "https://music-api.gdstudio.xyz/api.php";
	var NO_PIC_PLACEHOLDER = "./gdstudio-no-pic";
	var EMPTY_LYRIC = "[00:00.00]暂无歌词";
	var CONFIG_PRELOAD_QUALITY_ON_SEARCH = "preloadQualityOnSearch";
	var ORG_SOURCES = new Set([
		"tencent",
		"tidal",
		"qobuz",
		"apple",
		"ytmusic",
		"spotify"
	]);
	var CONFIG_SIGN_SERVER_URL = "signServerUrl";
	var CONFIG_SIGN_KEY = "signKey";
	var preloadQualityOnSearch = true;
	var signServerUrl = "";
	var signKey = "";
	var isOrgSource = (source) => ORG_SOURCES.has(String(source || ""));
	configuration?.getConfigs?.([
		CONFIG_PRELOAD_QUALITY_ON_SEARCH,
		CONFIG_SIGN_SERVER_URL,
		CONFIG_SIGN_KEY
	]).then(([preload, signUrl, signKeyValue]) => {
		preloadQualityOnSearch = preload !== false;
		signServerUrl = typeof signUrl === "string" ? signUrl.trim() : "";
		signKey = typeof signKeyValue === "string" ? signKeyValue.trim() : "";
	}).catch(() => {});
	configuration?.onConfigChanged?.((keys, config) => {
		if (keys.includes(CONFIG_PRELOAD_QUALITY_ON_SEARCH)) preloadQualityOnSearch = config[CONFIG_PRELOAD_QUALITY_ON_SEARCH] !== false;
		if (keys.includes(CONFIG_SIGN_SERVER_URL)) signServerUrl = typeof config[CONFIG_SIGN_SERVER_URL] === "string" ? config[CONFIG_SIGN_SERVER_URL].trim() : "";
		if (keys.includes(CONFIG_SIGN_KEY)) signKey = typeof config[CONFIG_SIGN_KEY] === "string" ? config[CONFIG_SIGN_KEY].trim() : "";
	});
	var lastErrorNotifyAt = 0;
	var ERROR_NOTIFY_INTERVAL = 5e3;
	function showErrorToast(message) {
		try {
			const p = app?.showMessage?.(message, { type: "error" });
			if (p && typeof p.catch === "function") p.catch(() => {});
		} catch (err) {
			console.error("[gdstudio] Failed to show error toast:", err);
		}
	}
	function notifyHttpError(statusCode, source) {
		const now = Date.now();
		if (now - lastErrorNotifyAt < ERROR_NOTIFY_INTERVAL) return;
		lastErrorNotifyAt = now;
		showErrorToast(`GD音乐台接口异常${source ? ` [${source}]` : ""}：HTTP ${statusCode}，请稍后重试`);
	}
	function notifyNetworkError(source) {
		const now = Date.now();
		if (now - lastErrorNotifyAt < ERROR_NOTIFY_INTERVAL) return;
		lastErrorNotifyAt = now;
		showErrorToast(`GD音乐台接口连接失败${source ? ` [${source}]` : ""}，请检查网络后重试`);
	}
	function notifySignServerMissing(source) {
		const now = Date.now();
		if (now - lastErrorNotifyAt < ERROR_NOTIFY_INTERVAL) return;
		lastErrorNotifyAt = now;
		showErrorToast(`GD音乐台${source ? ` [${source}]` : ""} 音源需要签名服务器，请先在插件设置中配置「签名服务器地址」`);
	}
	function buildQuery(obj) {
		const parts = [];
		for (const key in obj) if (Object.prototype.hasOwnProperty.call(obj, key)) {
			const val = obj[key];
			if (val != null) parts.push(encodeURIComponent(key) + "=" + encodeURIComponent(String(val)));
		}
		return parts.join("&");
	}
	function qualityToBr(quality) {
		switch (quality) {
			case "128k": return 128;
			case "192k": return 192;
			case "320k": return 320;
			case "flac": return 740;
			case "flac24bit": return 999;
			case "wav": return 999;
			case "ape": return 999;
			case "dolby": return 999;
			case "master": return 999;
			default: return null;
		}
	}
	function brToQuality(br) {
		if (br >= 999) return "flac24bit";
		if (br >= 740) return "flac";
		if (br >= 320) return "320k";
		if (br >= 192) return "192k";
		return "128k";
	}
	function buildQualitysFromBr(br) {
		const qs = { "128k": { sizeStr: null } };
		if (br >= 192) qs["192k"] = { sizeStr: null };
		if (br >= 320) qs["320k"] = { sizeStr: null };
		if (br >= 740) qs.flac = { sizeStr: null };
		if (br >= 999) qs.flac24bit = { sizeStr: null };
		return qs;
	}
	function buildInitialQualitys() {
		return { "128k": { sizeStr: null } };
	}
	function shouldShowInitialQuality(source) {
		return preloadQualityOnSearch;
	}
	function getResponsePreview(data) {
		if (typeof data === "string") return data.slice(0, 800);
		try {
			return JSON.stringify(data).slice(0, 800);
		} catch (_err) {
			return String(data).slice(0, 800);
		}
	}
	function bodyPreview(body, length = 500) {
		try {
			return (typeof body === "string" ? body : JSON.stringify(body)).slice(0, length);
		} catch {
			return String(body).slice(0, length);
		}
	}
	function logSearchResponse(source, data) {
		const preview = (Array.isArray(data) ? data.slice(0, 3) : []).map((item) => ({
			id: String(item.id || ""),
			name: String(item.name || ""),
			artist: item.artist,
			album: item.album,
			pic_id: item.pic_id
		}));
		console.log(`[gdstudio] search response [${source}] first3: ${JSON.stringify(preview)}`);
	}
	function buildLyricInfo(musicInfo, lyric, tlyric) {
		return {
			lyric: lyric || EMPTY_LYRIC,
			tlyric: tlyric || null,
			rlyric: null,
			awlyric: null,
			name: String(musicInfo.name || ""),
			singer: String(musicInfo.singer || ""),
			interval: musicInfo.interval || null
		};
	}
	function formatInterval(seconds) {
		if (!seconds || +seconds <= 0) return null;
		const h = Math.floor(+seconds / 3600);
		const m = Math.floor(+seconds % 3600 / 60);
		const s = Math.floor(+seconds % 60);
		if (h > 0) return String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
		return String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
	}
	function parseArtist(artist) {
		if (Array.isArray(artist)) return artist.join("、");
		if (artist == null) return "";
		return String(artist).split(/[、&_;/,，|]/).map((s) => s.trim()).filter(Boolean).join("、");
	}
	function buildMusicInfo(item, source, actualBr, picUrl) {
		const now = Date.now();
		let interval = null;
		if (item.duration || item.interval) {
			const dur = Number(item.duration || item.interval);
			if (dur > 0) interval = formatInterval(dur);
		}
		return {
			id: String(item.id),
			name: String(item.name || ""),
			singer: parseArtist(item.artist),
			interval,
			isLocal: false,
			meta: {
				musicId: String(item.id),
				albumName: String(item.album || ""),
				picUrl: picUrl || null,
				source,
				qualitys: actualBr ? buildQualitysFromBr(actualBr) : shouldShowInitialQuality(source) ? buildInitialQualitys() : {},
				_picId: item.pic_id ? String(item.pic_id) : void 0,
				createTime: now,
				updateTime: now,
				posTime: now
			}
		};
	}
	var playbackPicIds = /* @__PURE__ */ new Set();
	var picUrlCache = /* @__PURE__ */ new Map();
	var picGettingPromises = /* @__PURE__ */ new Map();
	function buildPicCacheKey(source, musicId) {
		return source + "|" + musicId;
	}
	async function waitForPlaybackPicAllowed(cacheKey) {
		if (playbackPicIds.has(cacheKey)) return true;
		for (let i = 0; i < 40; i++) {
			await new Promise((resolve) => {
				setTimeout(resolve, 250);
			});
			if (playbackPicIds.has(cacheKey)) return true;
		}
		return false;
	}
	async function isCurrentPlayingMusic(musicId) {
		try {
			const playInfo = await player?.getPlayInfo?.();
			const index = Number(playInfo?.info?.index);
			const list = playInfo?.list;
			if (!Array.isArray(list) || index < 0 || index >= list.length) return false;
			return String(list[index]?.musicInfo?.id || "") === musicId;
		} catch (_err) {
			return false;
		}
	}
	function getMusicInfoSource(musicInfo) {
		return String(musicInfo.meta?.source || "");
	}
	async function updatePlayingMusicInfo(source, musicId, update) {
		try {
			for (let retry = 0; retry < 12; retry++) {
				const list = (await player?.getPlayInfo?.())?.list;
				if (Array.isArray(list)) {
					const item = list.find((listItem) => {
						const musicInfo = listItem?.musicInfo;
						return musicInfo && String(musicInfo.id || "") === musicId && getMusicInfoSource(musicInfo) === source;
					});
					const currentMusicInfo = item?.musicInfo;
					const listId = item?.listId;
					if (currentMusicInfo && listId) {
						update(currentMusicInfo);
						await musicList?.listAction?.({
							action: "list_music_update",
							data: [{
								id: listId,
								musicInfo: currentMusicInfo
							}]
						});
						return;
					}
				}
				await new Promise((resolve) => {
					setTimeout(resolve, 250);
				});
			}
		} catch (err) {
			console.error("[gdstudio] Failed to update playing music info:", err);
		}
	}
	async function updatePlayingMusicQuality(source, musicId, actualBr) {
		await updatePlayingMusicInfo(source, musicId, (musicInfo) => {
			const targetMeta = musicInfo.meta;
			if (targetMeta) targetMeta.qualitys = buildQualitysFromBr(actualBr);
		});
	}
	async function updatePlayingMusicPic(source, musicId, picUrl) {
		await updatePlayingMusicInfo(source, musicId, (musicInfo) => {
			const targetMeta = musicInfo.meta;
			if (targetMeta) targetMeta.picUrl = picUrl;
		});
	}
	function prefetchPlaybackPic(source, musicId, musicInfo) {
		const meta = musicInfo.meta;
		const cacheKey = buildPicCacheKey(source, musicId);
		playbackPicIds.add(cacheKey);
		fetchMusicPic(source, musicInfo).then((url) => {
			if (meta) meta.picUrl = url;
			updatePlayingMusicPic(source, musicId, url);
		}).catch((err) => {
			console.error(`[gdstudio] Failed to fetch pic for ${source}:${musicId}:`, err);
		});
	}
	async function fetchMusicPic(source, musicInfo) {
		const musicId = String(musicInfo.id || musicInfo.meta?.musicId || "");
		const cacheKey = buildPicCacheKey(source, musicId);
		const cached = picUrlCache.get(cacheKey);
		if (cached) return cached;
		const getting = picGettingPromises.get(cacheKey);
		if (getting) return getting;
		const promise = (async () => {
			let picId = musicInfo.meta?._picId || null;
			if (!picId) try {
				const sData = await apiCall({
					types: "search",
					count: "1",
					source,
					pages: "1",
					name: String(musicInfo.name || "")
				});
				const list = Array.isArray(sData) ? sData : [];
				if (list.length && list[0].pic_id) picId = String(list[0].pic_id);
			} catch (_err) {}
			if (!picId) throw new Error("No pic_id found");
			const data = await apiCall({
				types: "pic",
				source,
				id: picId,
				size: "500"
			});
			console.log(`[gdstudio] pic response [${source}] musicId=${musicId} picId=${picId}: ${getResponsePreview(data)}`);
			if (data && data.url) {
				const url = String(data.url);
				picUrlCache.set(cacheKey, url);
				return url;
			}
			throw new Error("No pic URL for pic_id " + picId);
		})().finally(() => {
			picGettingPromises.delete(cacheKey);
		});
		picGettingPromises.set(cacheKey, promise);
		return promise;
	}
	async function detectMainApiQuality(source, musicId) {
		try {
			const data = await apiCall({
				types: "url",
				source,
				id: musicId,
				br: "999"
			});
			if (data && data.url) return data.br != null ? Number(data.br) : 128;
		} catch (_err) {}
		return 128;
	}
	async function hydrateMainApiSearchItem(source, rawItem, musicInfo) {
		const meta = musicInfo.meta;
		if (meta._detailsLoaded) return;
		const musicId = String(rawItem.id || musicInfo.id);
		const [actualBr, picUrl] = await Promise.all([preloadQualityOnSearch ? detectMainApiQuality(source, musicId) : Promise.resolve(null), fetchMusicPic(source, musicInfo).catch(() => null)]);
		if (actualBr) meta.qualitys = buildQualitysFromBr(actualBr);
		if (picUrl) meta.picUrl = picUrl;
		meta._detailsLoaded = true;
	}
	async function apiCallMainApi(params) {
		const body = buildQuery(params);
		let resp;
		try {
			resp = await request(MAIN_API_URL + "?" + body, {
				method: "GET",
				timeout: 15e3,
				headers: {
					"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
					"X-Requested-With": "XMLHttpRequest",
					Referer: "https://music.gdstudio.org/"
				}
			});
		} catch (err) {
			console.error(`[gdstudio] request failed [${params.source}] types=${params.types}:`, err);
			notifyNetworkError(params.source);
			throw err;
		}
		const statusCode = resp.statusCode ?? "?";
		if (statusCode !== 200) {
			console.error(`[gdstudio] non-200 response (${statusCode}):`, typeof resp.body === "string" ? resp.body.slice(0, 500) : JSON.stringify(resp.body).slice(0, 500));
			notifyHttpError(statusCode, params.source);
		}
		const data = typeof resp.body === "string" ? JSON.parse(resp.body) : resp.body;
		if (params.types === "search") logSearchResponse(params.source, data);
		return data;
	}
	async function apiCallOrg(params) {
		const source = String(params.source || "");
		if (!signServerUrl) {
			notifySignServerMissing(source);
			throw new Error("未配置签名服务器地址(插件设置页 signServerUrl)");
		}
		const signParams = {
			op: String(params.types),
			source
		};
		for (const key of Object.keys(params)) {
			if (key === "types" || key === "source") continue;
			if (params[key] != null) signParams[key === "pages" ? "page" : key] = String(params[key]);
		}
		const signHeaders = { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" };
		if (signKey) signHeaders.Authorization = `Bearer ${signKey}`;
		let signResp;
		try {
			signResp = await request(signServerUrl.replace(/\/+$/, "") + "/sign?" + buildQuery(signParams), {
				method: "GET",
				headers: signHeaders,
				timeout: 8e3
			});
		} catch (err) {
			console.error(`[gdstudio] sign request failed [${source}]:`, err);
			notifyNetworkError(source);
			throw err;
		}
		if (signResp.statusCode !== 200) {
			console.error(`[gdstudio] sign server non-200 (${signResp.statusCode}):`, bodyPreview(signResp.body, 300));
			notifyHttpError(signResp.statusCode ?? "?", source);
			throw new Error(`签名服务器返回 ${signResp.statusCode}`);
		}
		let signData;
		try {
			signData = typeof signResp.body === "string" ? JSON.parse(signResp.body) : signResp.body;
		} catch {
			throw new Error("签名服务器响应解析失败: " + JSON.stringify(signResp.body).slice(0, 200));
		}
		if (!signData.ok || !signData.req || !signData.req.url) throw new Error(`签名失败: ${signData.error || "未知错误"}`);
		const req = signData.req;
		let resp;
		try {
			resp = await request(req.url, {
				method: req.method || "POST",
				headers: req.headers,
				binary: req.body != null ? await dataConverter(String(req.body), "utf-8", "binary") : void 0,
				timeout: 15e3
			});
		} catch (err) {
			console.error(`[gdstudio] direct request failed [${source}]:`, err);
			notifyNetworkError(source);
			throw err;
		}
		const statusCode = resp.statusCode ?? "?";
		if (statusCode !== 200) {
			console.error(`[gdstudio] non-200 response (${statusCode}):`, bodyPreview(resp.body, 500));
			notifyHttpError(statusCode, source);
		}
		const data = typeof resp.body === "string" ? JSON.parse(resp.body) : resp.body;
		if (params.types === "search") logSearchResponse(params.source, data);
		return data;
	}
	function apiCall(params) {
		return isOrgSource(params.source) ? apiCallOrg(params) : apiCallMainApi(params);
	}
	var searchCache;
	async function fetchSearchBatch(source, name, page, count) {
		let lastError = null;
		for (let retry = 0; retry < 2; retry++) try {
			const data = await apiCall({
				types: "search",
				count: String(count),
				source,
				pages: String(page),
				name
			});
			if (data && data.error) {
				lastError = String(data.error);
				break;
			}
			const rawList = Array.isArray(data) ? data : [];
			if (rawList.length > 0) return rawList;
			if (retry < 1) await new Promise((resolve) => {
				setTimeout(resolve, 300);
			});
		} catch (err) {
			lastError = err instanceof Error ? err.message : String(err);
			console.error(`[gdstudio] search request failed [${source}]:`, err);
			notifyNetworkError(source);
			if (retry < 1) await new Promise((resolve) => {
				setTimeout(resolve, 500);
			});
		}
		throw new Error(lastError || "搜索返回空结果(可能是 API 限流,请稍后重试)");
	}
	async function musicSearch(params) {
		const source = params.source;
		const name = params.name;
		const artist = params.artist;
		const page = params.page || 1;
		const limit = Math.min(params.limit || 20, 50);
		const fetchCount = limit * 3;
		if (isOrgSource(source) && !signServerUrl) {
			notifySignServerMissing(source);
			throw new Error("未配置签名服务器地址(插件设置页 signServerUrl)");
		}
		const searchKey = JSON.stringify([
			source,
			name,
			artist || "",
			limit
		]);
		if (searchCache?.key !== searchKey) {
			const queryName = artist ? name + " " + artist : name;
			searchCache = {
				key: searchKey,
				pagination: createSearchPagination(async (apiPage) => (await fetchSearchBatch(source, queryName, apiPage, fetchCount)).map((raw) => ({
					raw,
					musicInfo: buildMusicInfo(raw, source)
				})), (item) => item.musicInfo.id, (error) => {
					console.warn(`[gdstudio] more search results unavailable [${source}], retry on next page:`, error);
				})
			};
		}
		const { list, total } = await searchCache.pagination.getPage(page, limit);
		if (!isOrgSource(source)) await Promise.all(list.map(async (item) => {
			await hydrateMainApiSearchItem(source, item.raw, item.musicInfo);
		}));
		return {
			list: list.map((item) => item.musicInfo),
			total,
			page,
			limit
		};
	}
	async function musicUrl(params) {
		const source = params.source;
		const musicInfo = params.musicInfo;
		const quality = params.quality;
		const musicId = String(musicInfo.id || musicInfo.meta?.musicId || "");
		prefetchPlaybackPic(source, musicId, musicInfo);
		const allBrs = [
			999,
			740,
			320,
			192,
			128
		];
		let brsToTry = allBrs;
		if (quality) {
			const preferredBr = qualityToBr(quality);
			if (preferredBr) brsToTry = allBrs.filter((br) => br <= preferredBr);
		}
		let lastError = null;
		for (let j = 0; j < brsToTry.length; j++) {
			const br = brsToTry[j];
			try {
				const data = await apiCall({
					types: "url",
					source,
					id: musicId,
					br: String(br)
				});
				if (data && data.url) {
					const actualBr = data.br != null ? Number(data.br) : br;
					const meta = musicInfo.meta;
					if (meta) meta.qualitys = buildQualitysFromBr(actualBr);
					updatePlayingMusicQuality(source, musicId, actualBr);
					return {
						url: String(data.url),
						quality: brToQuality(actualBr)
					};
				}
			} catch (err) {
				lastError = err;
			}
		}
		if (lastError) console.error(`[gdstudio] No URL available for ${source}:${musicId}:`, lastError.message);
		throw new Error(`[${source}] No URL available for ${musicId}${lastError ? `: ${lastError.message}` : ""}`);
	}
	async function musicPic(params) {
		const source = params.source;
		const musicInfo = params.musicInfo;
		const musicId = String(musicInfo.id || musicInfo.meta?.musicId || "");
		const cacheKey = buildPicCacheKey(source, musicId);
		const cached = picUrlCache.get(cacheKey);
		if (cached) return cached;
		if (!playbackPicIds.has(cacheKey) && await isCurrentPlayingMusic(musicId)) playbackPicIds.add(cacheKey);
		if (!await waitForPlaybackPicAllowed(cacheKey)) return NO_PIC_PLACEHOLDER;
		return fetchMusicPic(source, musicInfo).catch((err) => {
			console.error(`[gdstudio] Failed to fetch pic for ${source}:${musicId}:`, err);
			return NO_PIC_PLACEHOLDER;
		});
	}
	async function musicLyric(params) {
		const source = params.source;
		const musicInfo = params.musicInfo;
		const lyricId = musicInfo.meta?.musicId || musicInfo.id;
		try {
			const data = await apiCall({
				types: "lyric",
				source,
				id: String(lyricId)
			});
			return buildLyricInfo(musicInfo, data && data.lyric ? String(data.lyric) : null, data && data.tlyric ? String(data.tlyric) : null);
		} catch (_err) {
			console.error(`[gdstudio] Failed to get lyric [${source}] id=${String(lyricId)}:`, _err);
			return buildLyricInfo(musicInfo);
		}
	}
	registerResourceAction({
		musicSearch,
		musicUrl,
		musicPic,
		musicLyric
	});
	//#endregion
})();
