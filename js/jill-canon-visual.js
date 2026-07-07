/**
 * Motor visual Jill ù canon SVG + GIF opcional, mismo fondo en todos.
 */
(function (global) {
  'use strict';

  var _cfg = null;
  var _load = null;
  var DEFAULT_BG = '#f3ebff';

  function assetUrl(path) {
    if (!path) return '';
    if (/^https?:\/\//i.test(path) || path.charAt(0) === '/') return path;
    return '/' + path.replace(/^\//, '');
  }

  function loadConfig() {
    if (_cfg) return Promise.resolve(_cfg);
    if (_load) return _load;
    _load = fetch('config/jill-canon-visual.json?v=20260707h')
      .then(function (r) { return r.ok ? r.json() : {}; })
      .then(function (data) {
        _cfg = data || {};
        return _cfg;
      })
      .catch(function () {
        _cfg = { background: DEFAULT_BG, clips: [] };
        return _cfg;
      });
    return _load;
  }

  function clipForColumn(columnId, fallback) {
    var clips = (_cfg && _cfg.clips) || [];
    for (var i = 0; i < clips.length; i++) {
      var c = clips[i];
      if (c.columns && c.columns.indexOf(columnId) >= 0) return c;
    }
    return fallback ? { id: fallback.id, svg: fallback.path, gif: null, title: fallback.title } : null;
  }

  function frameStyle() {
    var bg = (_cfg && _cfg.background) || DEFAULT_BG;
    var img = _cfg && _cfg.backgroundImage;
    if (img) {
      return 'background-color:' + bg + ';background-image:url(' + assetUrl(img) + '?v=20260707h);background-size:cover;background-position:center;';
    }
    return 'background-color:' + bg + ';';
  }

  function render(columnId, fallbackRef) {
    var clip = clipForColumn(columnId, fallbackRef);
    if (!clip) return '';
    var cache = '?v=20260707h';
    var isGif = !!clip.gif;
    var media = assetUrl(isGif ? clip.gif : clip.svg) + cache;
    var alt = clip.title || (fallbackRef && fallbackRef.title) || 'Canon Jill';
    if (isGif) {
      return '<div class="jill-canon-frame" style="margin-top:4px;border-radius:12px;overflow:hidden;border:1px solid rgba(91,33,182,0.2);' + frameStyle() + '">'
        + '<img src="' + media + '" alt="' + esc(alt) + '" style="display:block;width:100%;max-width:320px;height:auto;margin:0 auto;" loading="eager" decoding="async">'
        + '</div>';
    }
    return '<div class="jill-canon-frame" style="position:relative;margin-top:4px;width:100%;max-width:320px;margin-left:auto;margin-right:auto;border-radius:12px;overflow:hidden;border:1px solid rgba(91,33,182,0.2);aspect-ratio:320/180;' + frameStyle() + '">'
      + '<img src="' + media + '" alt="' + esc(alt) + '" style="position:absolute;inset:0;width:100%;height:100%;object-fit:contain;padding:8px 12px 8px 48px;box-sizing:border-box;" loading="eager" decoding="async">'
      + '</div>';
  }

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  }

  function setGif(columnId, gifPath) {
    if (!_cfg || !_cfg.clips) return;
    _cfg.clips.forEach(function (c) {
      if (c.columns && c.columns.indexOf(columnId) >= 0) c.gif = gifPath;
    });
  }

  global.JillCanonVisual = {
    loadConfig: loadConfig,
    render: render,
    assetUrl: assetUrl,
    setGif: setGif,
    DEFAULT_BG: DEFAULT_BG
  };
})(typeof window !== 'undefined' ? window : global);
