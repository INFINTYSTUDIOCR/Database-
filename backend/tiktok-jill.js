/**
 * TikTok → Jill — sync periódico con revisión antes de publicar (Super Brain pending).
 * OAuth TikTok Display API (video.list) + fallback oEmbed por URL pública.
 */
const TIKTOK_SYNC_ID = 'TIKTOK-SYNC-STATE';
const OAUTH_SCOPES = 'user.info.basic,video.list';
const MAX_SEEN = 500;
const MAX_PER_SYNC = 8;
const VIDEO_FIELDS = 'id,title,video_description,create_time,share_url,cover_image_url,duration';

let _sbGetOne = null;
let _sbSet = null;

function initTikTokJill({ sbGetOne, sbSet }) {
  _sbGetOne = sbGetOne;
  _sbSet = sbSet;
}

function clientKey() {
  return process.env.TIKTOK_CLIENT_KEY || '';
}

function clientSecret() {
  return process.env.TIKTOK_CLIENT_SECRET || '';
}

function redirectUri() {
  return process.env.TIKTOK_REDIRECT_URI || '';
}

function signingSecret() {
  return process.env.TIKTOK_OAUTH_STATE_SECRET || process.env.ANALYZE_SECRET || process.env.JWT_SECRET || '';
}

function defaultSyncState() {
  return {
    username: process.env.TIKTOK_USERNAME || 'infinitystudiocr',
    connected: false,
    accessToken: null,
    refreshToken: null,
    tokenExpiresAt: null,
    openId: null,
    displayName: null,
    seenVideoIds: [],
    lastSyncAt: null,
    lastSyncResult: null,
    lastError: null,
    updatedAt: new Date().toISOString()
  };
}

async function loadSyncState() {
  if (!_sbGetOne) return defaultSyncState();
  try {
    const row = await _sbGetOne('infinity_sessions', TIKTOK_SYNC_ID);
    return { ...defaultSyncState(), ...(row?.data || {}) };
  } catch {
    return defaultSyncState();
  }
}

async function saveSyncState(state) {
  if (!_sbSet) return false;
  state.updatedAt = new Date().toISOString();
  return _sbSet('infinity_sessions', TIKTOK_SYNC_ID, state);
}

function isConfigured() {
  return !!(clientKey() && clientSecret() && redirectUri());
}

function tokenValid(state) {
  if (!state?.accessToken) return false;
  if (!state.tokenExpiresAt) return true;
  return Date.now() < new Date(state.tokenExpiresAt).getTime() - 120000;
}

function signOAuthState(payload) {
  const crypto = require('crypto');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', signingSecret()).update(body).digest('base64url');
  return `${body}.${sig}`;
}

function verifyOAuthState(stateToken) {
  const crypto = require('crypto');
  const parts = String(stateToken || '').split('.');
  if (parts.length !== 2) return null;
  const [body, sig] = parts;
  const expected = crypto.createHmac('sha256', signingSecret()).update(body).digest('base64url');
  if (sig !== expected) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

function buildOAuthUrl() {
  if (!isConfigured()) throw new Error('Faltan TIKTOK_CLIENT_KEY, TIKTOK_CLIENT_SECRET y TIKTOK_REDIRECT_URI en Render.');
  const state = signOAuthState({ exp: Date.now() + 900000, v: 1 });
  const params = new URLSearchParams({
    client_key: clientKey(),
    scope: OAUTH_SCOPES,
    response_type: 'code',
    redirect_uri: redirectUri(),
    state
  });
  return { url: `https://www.tiktok.com/v2/auth/authorize/?${params}`, state };
}

async function exchangeCode(code) {
  const body = new URLSearchParams({
    client_key: clientKey(),
    client_secret: clientSecret(),
    code: String(code),
    grant_type: 'authorization_code',
    redirect_uri: redirectUri()
  });
  const r = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString()
  });
  const data = await r.json();
  if (!r.ok || data.error) {
    throw new Error(data.error_description || data.error?.message || data.message || 'OAuth token failed');
  }
  return data.data || data;
}

async function refreshAccessToken(state) {
  if (!state.refreshToken) throw new Error('Sin refresh token — reconectá TikTok desde A.D.A.M.');
  const body = new URLSearchParams({
    client_key: clientKey(),
    client_secret: clientSecret(),
    grant_type: 'refresh_token',
    refresh_token: state.refreshToken
  });
  const r = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString()
  });
  const data = await r.json();
  const tok = data.data || data;
  if (!r.ok || !tok.access_token) {
    state.connected = false;
    await saveSyncState(state);
    throw new Error(tok.error_description || 'No se pudo renovar el token TikTok');
  }
  state.accessToken = tok.access_token;
  if (tok.refresh_token) state.refreshToken = tok.refresh_token;
  state.tokenExpiresAt = new Date(Date.now() + (tok.expires_in || 86400) * 1000).toISOString();
  state.openId = tok.open_id || state.openId;
  state.connected = true;
  await saveSyncState(state);
  return state;
}

async function ensureAccessToken(state) {
  if (tokenValid(state)) return state;
  return refreshAccessToken(state);
}

async function fetchVideoList(accessToken, cursor) {
  const q = new URLSearchParams({ fields: VIDEO_FIELDS });
  const r = await fetch(`https://open.tiktokapis.com/v2/video/list/?${q}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ max_count: 20, cursor: cursor || undefined })
  });
  const data = await r.json();
  if (!r.ok || data.error?.code) {
    throw new Error(data.error?.message || data.error?.code || 'video/list failed');
  }
  return data.data || { videos: [], cursor: null, has_more: false };
}

async function fetchOembed(url) {
  const u = encodeURIComponent(String(url).trim());
  const r = await fetch(`https://www.tiktok.com/oembed?url=${u}`, {
    headers: { 'User-Agent': 'InfinityStudioCR/1.0' }
  });
  if (!r.ok) throw new Error(`oEmbed ${r.status}`);
  return r.json();
}

function videoIdFromUrl(url) {
  const m = String(url || '').match(/video\/(\d+)/);
  return m ? m[1] : null;
}

function normalizeTikTokUrl(raw) {
  let u = String(raw || '').trim().replace(/[.,;:!?)>\]]+$/, '');
  if (!u) return '';
  if (!/^https?:\/\//i.test(u)) u = `https://${u.replace(/^\/\//, '')}`;
  return u.includes('tiktok.com') ? u : '';
}

function extractUrlsFromText(text) {
  const found = new Set();
  const raw = String(text || '');
  const patterns = [
    /https?:\/\/(?:www\.|m\.|vm\.|vt\.)?tiktok\.com\/[^\s<>"']+/gi,
    /(?:^|[\s(])((?:www\.|m\.|vm\.|vt\.)?tiktok\.com\/[^\s<>"']+)/gi
  ];
  for (const re of patterns) {
    let m;
    const r = new RegExp(re.source, re.flags);
    while ((m = r.exec(raw)) !== null) {
      const u = normalizeTikTokUrl(m[1] || m[0]);
      if (u) found.add(u);
    }
  }
  return [...found];
}

function findVideoInState(sbState, videoId) {
  if (!videoId || !sbState) return null;
  const pending = (sbState.pendingLessons || []).find((p) => p.meta?.videoId === videoId);
  if (pending) return { where: 'pendiente', title: pending.title };
  const lesson = (sbState.lessons || []).find((l) => l.meta?.videoId === videoId);
  if (lesson) return { where: lesson.published ? 'publicado' : 'borrador', title: lesson.title };
  return null;
}

function normalizeVideoFromApi(v) {
  return {
    id: v.id,
    title: v.title || '',
    description: v.video_description || v.title || '',
    shareUrl: v.share_url || '',
    coverUrl: v.cover_image_url || '',
    createTime: v.create_time || null,
    duration: v.duration || null,
    source: 'tiktok-api'
  };
}

function normalizeVideoFromOembed(url, o) {
  const id = videoIdFromUrl(url) || `oembed-${Date.now()}`;
  return {
    id,
    title: o.title || 'TikTok',
    description: o.title || '',
    shareUrl: url,
    coverUrl: o.thumbnail_url || '',
    createTime: null,
    duration: null,
    source: 'tiktok-oembed',
    author: o.author_name || ''
  };
}

async function extractPedagogyForJill(claudeCall, video) {
  const raw = [
    video.title ? `Título: ${video.title}` : '',
    video.description ? `Descripción/caption: ${video.description}` : '',
    video.author ? `Autor: ${video.author}` : '',
    video.shareUrl ? `URL: ${video.shareUrl}` : ''
  ].filter(Boolean).join('\n');

  if (!raw || raw.length < 12) {
    return {
      title: `TikTok · ${(video.title || 'video').slice(0, 60)}`,
      content: '(Sin texto suficiente — revisá manualmente o pegá la transcripción.)',
      category: 'jill-foundations'
    };
  }

  if (!claudeCall) {
    return {
      title: `TikTok · ${(video.title || 'video').slice(0, 80)}`,
      content: raw.slice(0, 4000),
      category: 'jill-foundations'
    };
  }

  const resp = await claudeCall({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 900,
    system: `Sos el editor pedagógico de Jill (Foundations · Método Nexus · Mecánica Estructural Infinity®).
Convertí contenido de TikTok del fundador en material institucional para que Jill enseñe.
Respondé SOLO JSON válido sin markdown.`,
    messages: [{
      role: 'user',
      content: `Extraé de este video TikTok lo que Jill debe saber enseñar/corregir/evaluar.

${raw}

JSON exacto:
{"title":"título corto para la KB (máx 100 chars)","category":"jill-foundations|metodologia|conectores|ejercicios|errores","content":"texto estructurado: DOCTRINA (1-2 frases), REGLAS MSI/chunks si aplica, EJEMPLO EN INGLÉS, EJERCICIO PARA EL ESTUDIANTE, CORRECCIÓN TÍPICA. Español claro + frases modelo en inglés. Sin hashtags ni CTA de redes."}`
    }]
  });

  const text = resp.content.filter(b => b.type === 'text').map(b => b.text).join('').trim();
  try {
    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
    return {
      title: String(parsed.title || video.title || 'TikTok Jill').slice(0, 120),
      content: String(parsed.content || raw).slice(0, 11000),
      category: parsed.category || 'jill-foundations'
    };
  } catch {
    return {
      title: `TikTok · ${(video.title || 'video').slice(0, 80)}`,
      content: raw.slice(0, 4000),
      category: 'jill-foundations'
    };
  }
}

function videoFromUrlFallback(url) {
  const id = videoIdFromUrl(url);
  if (!id) return null;
  const clean = String(url).trim();
  return {
    id,
    title: 'TikTok (metadata limitada)',
    description: `Video importado por URL (oEmbed no disponible).\n${clean}`,
    shareUrl: clean,
    coverUrl: '',
    createTime: null,
    duration: null,
    source: 'tiktok-url-fallback',
    author: ''
  };
}

function formatImportMessage(result, sbState) {
  const q = result.queued || 0;
  const s = result.skipped || 0;
  const sc = result.scanned || 0;
  if (q > 0) {
    return `Importados: ${q} en pendiente de revisión.${s ? ` (${s} omitido(s).)` : ''}`;
  }
  if (sc > 0 && s > 0) {
    const reasons = (result.skipReasons || []).map((r) => r.reason);
    if (reasons.length && reasons.every((r) => r === 'already_seen' || r === 'duplicate')) {
      const vid = (result.skipReasons[0] || {}).id;
      const loc = vid && sbState ? findVideoInState(sbState, vid) : null;
      const where = loc
        ? ` Ya está en «${loc.where}»: ${loc.title}.`
        : ' Revisá «Publicado» abajo — puede que ya lo hayas publicado.';
      return `0 nuevos: ese video ya estaba en el historial TikTok→Jill.${where} Activá «Forzar reimportación» si querés volver a encolarlo en Pendiente.`;
    }
    return `0 nuevos en pendiente (${sc} leído(s), ${s} omitido(s)). Revisá pendientes/publicados o usá Forzar.`;
  }
  return 'Importados: 0 en pendiente de revisión.';
}

async function queueVideoAsPending(superBrainState, video, pedagogy, author, opts = {}) {
  const SuperBrain = require('./super-brain');
  const item = {
    id: `TT-${video.id}-${Date.now()}`,
    title: pedagogy.title,
    content: pedagogy.content,
    category: pedagogy.category || 'jill-foundations',
    author: author || 'TikTok Sync',
    source: 'tiktok',
    date: new Date().toISOString(),
    meta: {
      videoId: video.id,
      shareUrl: video.shareUrl,
      coverUrl: video.coverUrl,
      createTime: video.createTime,
      ingestSource: video.source
    }
  };
  superBrainState.pendingLessons = superBrainState.pendingLessons || [];
  if (!opts.force) {
    const dup = superBrainState.pendingLessons.some(p =>
      p.meta?.videoId === video.id || (p.meta?.shareUrl && p.meta.shareUrl === video.shareUrl)
    );
    if (dup) return { queued: false, reason: 'duplicate' };
  }
  superBrainState.pendingLessons.push(item);
  if (superBrainState.pendingLessons.length > 100) {
    superBrainState.pendingLessons = superBrainState.pendingLessons.slice(-100);
  }
  await SuperBrain.saveState(superBrainState);
  return { queued: true, pending: item };
}

async function processNewVideos(videos, superBrainState, claudeCall, author, opts = {}) {
  const syncState = await loadSyncState();
  const seen = new Set(syncState.seenVideoIds || []);
  const results = { scanned: videos.length, queued: 0, skipped: 0, items: [], skipReasons: [] };

  for (const raw of videos.slice(0, MAX_PER_SYNC)) {
    const video = raw.id && raw.source === 'tiktok-api' ? normalizeVideoFromApi(raw) : raw;
    if (!video.id) {
      results.skipped++;
      results.skipReasons.push({ id: null, reason: 'no_id', shareUrl: video.shareUrl });
      continue;
    }
    if (!opts.force && seen.has(video.id)) {
      results.skipped++;
      results.skipReasons.push({ id: video.id, reason: 'already_seen', shareUrl: video.shareUrl });
      continue;
    }
    const pedagogy = await extractPedagogyForJill(claudeCall, video);
    const q = await queueVideoAsPending(superBrainState, video, pedagogy, author, opts);
    if (q.queued) {
      seen.add(video.id);
      results.queued++;
      results.items.push({ id: video.id, title: pedagogy.title, shareUrl: video.shareUrl });
    } else {
      results.skipped++;
      results.skipReasons.push({ id: video.id, reason: q.reason || 'duplicate', shareUrl: video.shareUrl });
    }
  }

  syncState.seenVideoIds = [...seen].slice(-MAX_SEEN);
  syncState.lastSyncAt = new Date().toISOString();
  syncState.lastSyncResult = results;
  syncState.lastError = null;
  await saveSyncState(syncState);
  return results;
}

async function syncFromApi(claudeCall, author) {
  if (!isConfigured()) throw new Error('TikTok API no configurada en el servidor.');
  let syncState = await loadSyncState();
  if (!syncState.refreshToken && !syncState.accessToken) {
    throw new Error('TikTok no conectado — usá "Conectar TikTok" en A.D.A.M.');
  }
  syncState = await ensureAccessToken(syncState);

  const SuperBrain = require('./super-brain');
  const sbState = await SuperBrain.loadState();

  const list = await fetchVideoList(syncState.accessToken);
  const videos = list.videos || [];
  const results = await processNewVideos(videos, sbState, claudeCall, author);
  results.mode = 'api';
  results.hasMore = !!list.has_more;
  return results;
}

async function syncFromUrls(urls, claudeCall, author, opts = {}) {
  const list = (urls || []).map(u => String(u).trim()).filter(u => u.includes('tiktok.com'));
  if (!list.length) throw new Error('Pegá al menos una URL de TikTok válida.');

  const SuperBrain = require('./super-brain');
  const sbState = await SuperBrain.loadState();
  const videos = [];

  for (const url of list.slice(0, MAX_PER_SYNC)) {
    try {
      const o = await fetchOembed(url);
      videos.push(normalizeVideoFromOembed(url, o));
    } catch (e) {
      console.warn('tiktok oembed:', url, e.message);
      const fb = videoFromUrlFallback(url);
      if (fb) videos.push(fb);
    }
  }

  if (!videos.length) {
    throw new Error('No se pudo leer ningún video. Usá la URL larga /@usuario/video/ID o pegá el guion en «Subir conocimiento».');
  }
  const results = await processNewVideos(videos, sbState, claudeCall, author, opts);
  results.mode = 'urls';
  results.message = formatImportMessage(results, sbState);
  return results;
}

async function handleOAuthCallback(code, stateToken) {
  if (!verifyOAuthState(stateToken)) throw new Error('Estado OAuth inválido o expirado.');
  const tok = await exchangeCode(code);
  const syncState = await loadSyncState();
  syncState.accessToken = tok.access_token;
  syncState.refreshToken = tok.refresh_token || syncState.refreshToken;
  syncState.openId = tok.open_id || syncState.openId;
  syncState.tokenExpiresAt = new Date(Date.now() + (tok.expires_in || 86400) * 1000).toISOString();
  syncState.connected = true;
  syncState.lastError = null;
  await saveSyncState(syncState);
  return { connected: true, openId: syncState.openId };
}

function publicStatus(syncState) {
  const intervalH = parseInt(process.env.TIKTOK_SYNC_INTERVAL_HOURS || '0', 10);
  return {
    enabled: isConfigured(),
    connected: !!(syncState.connected && syncState.refreshToken),
    username: syncState.username || 'infinitystudiocr',
    lastSyncAt: syncState.lastSyncAt,
    lastSyncResult: syncState.lastSyncResult,
    lastError: syncState.lastError,
    seenCount: (syncState.seenVideoIds || []).length,
    autoSyncHours: intervalH > 0 ? intervalH : null,
    oauthReady: isConfigured()
  };
}

async function scheduledSyncIfDue(claudeCall) {
  const hours = parseInt(process.env.TIKTOK_SYNC_INTERVAL_HOURS || '0', 10);
  if (hours <= 0) return null;
  const state = await loadSyncState();
  if (!state.connected || !state.refreshToken) return null;
  const last = state.lastSyncAt ? new Date(state.lastSyncAt).getTime() : 0;
  if (Date.now() - last < hours * 3600000) return null;
  try {
    return await syncFromApi(claudeCall, 'TikTok Auto-Sync');
  } catch (e) {
    state.lastError = e.message;
    await saveSyncState(state);
    console.warn('TikTok scheduled sync:', e.message);
    return null;
  }
}

module.exports = {
  initTikTokJill,
  TIKTOK_SYNC_ID,
  loadSyncState,
  saveSyncState,
  isConfigured,
  buildOAuthUrl,
  handleOAuthCallback,
  syncFromApi,
  syncFromUrls,
  extractUrlsFromText,
  publicStatus,
  scheduledSyncIfDue,
  extractPedagogyForJill
};
