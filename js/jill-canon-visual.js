/**
 * Motor visual Jill ù canon SVG inline + GIF opcional + escenario fullscreen.
 */
(function (global) {
  'use strict';

  var _cfg = null;
  var _load = null;
  var _svgCache = {};
  var CACHE_VER = '20260710have';
  var DEFAULT_BG = '#f3ebff';

  function assetUrl(path) {
    if (!path) return '';
    if (/^https?:\/\//i.test(path)) return path;
    return path.replace(/^\//, '');
  }

  function preloadSvg(path) {
    if (!path) return Promise.resolve('');
    var rel = assetUrl(path);
    var abs = rel.charAt(0) === '/' ? rel : '/' + rel;
    if (_svgCache[rel]) return Promise.resolve(_svgCache[rel]);
    if (_svgCache[abs]) return Promise.resolve(_svgCache[abs]);

    function tryFetch(url) {
      return fetch(url + (url.indexOf('?') >= 0 ? '&' : '?') + 'v=' + CACHE_VER)
        .then(function (r) { return r.ok ? r.text() : ''; })
        .catch(function () { return ''; });
    }

    return tryFetch(rel).then(function (txt) {
      if (txt && txt.indexOf('<svg') >= 0) {
        _svgCache[rel] = txt;
        _svgCache[abs] = txt;
        return txt;
      }
      return tryFetch(abs).then(function (txt2) {
        if (txt2 && txt2.indexOf('<svg') >= 0) {
          _svgCache[rel] = txt2;
          _svgCache[abs] = txt2;
        }
        return txt2 || '';
      });
    });
  }

  function loadConfig() {
    if (_cfg) {
      var paths = (_cfg.clips || []).reduce(function (acc, c) {
        if (c.svg) acc.push(c.svg);
        if (c.animatedSvg) acc.push(c.animatedSvg);
        return acc;
      }, []);
      return Promise.all(paths.map(preloadSvg)).then(function () { return _cfg; });
    }
    if (_load) return _load;
    _load = fetch('config/jill-canon-visual.json?v=' + CACHE_VER)
      .then(function (r) { return r.ok ? r.json() : {}; })
      .then(function (data) {
        _cfg = data || {};
        var paths = (_cfg.clips || []).reduce(function (acc, c) {
          if (c.svg) acc.push(c.svg);
          if (c.animatedSvg) acc.push(c.animatedSvg);
          return acc;
        }, []);
        return Promise.all(paths.map(preloadSvg)).then(function () { return _cfg; });
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
      return 'background-color:' + bg + ';background-image:url(' + assetUrl(img) + '?v=' + CACHE_VER + ');background-size:28px 28px;background-repeat:no-repeat;background-position:6px 6px;';
    }
    return 'background-color:' + bg + ';';
  }

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  }

  function inlineSvgMarkup(svgText, alt, fullBleed) {
    var inner = String(svgText || '').replace(/<\?xml[\s\S]*?\?>/gi, '').trim();
    if (!inner || inner.indexOf('<svg') < 0) return '';
    var svgStyle = fullBleed
      ? 'width:100%;height:100%;display:block;max-height:100%;object-fit:contain'
      : 'width:100%;height:100%;display:block';
    inner = inner.replace(/<svg\b/i, '<svg style="' + svgStyle + '" role="img" aria-label="' + esc(alt) + '"');
    return '<div class="jill-canon-svg" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:' + (fullBleed ? '0' : '6px 8px') + ';box-sizing:border-box;pointer-events:none;">'
      + inner
      + '</div>';
  }

  function mediaForClip(clip, fallbackRef, mode) {
    var alt = clip.title || (fallbackRef && fallbackRef.title) || 'Canon Jill';
    var fullBleed = mode === 'stage';

    if (clip.gif) {
      var gifSrc = assetUrl(clip.gif) + '?v=' + CACHE_VER;
      var imgStyle = fullBleed
        ? 'display:block;width:100%;height:100%;object-fit:contain;'
        : 'display:block;width:100%;height:100%;object-fit:contain;';
      return { type: 'gif', html: '<img src="' + gifSrc + '" alt="' + esc(alt) + '" style="' + imgStyle + '" loading="eager" decoding="async">' };
    }

    var animPath = clip.animatedSvg;
    if (animPath) {
      var animRel = assetUrl(animPath);
      var animCached = _svgCache[animRel] || _svgCache['/' + animRel.replace(/^\//, '')];
      if (animCached) {
        return { type: 'svg', html: inlineSvgMarkup(animCached, alt, fullBleed) };
      }
    }

    var svgPath = clip.svg || (fallbackRef && fallbackRef.path);
    var rel = assetUrl(svgPath);
    var cached = _svgCache[rel] || _svgCache['/' + rel.replace(/^\//, '')];
    if (cached) {
      return { type: 'svg', html: inlineSvgMarkup(cached, alt, fullBleed) };
    }

    var media = (rel.charAt(0) === '/' ? rel : '/' + rel) + '?v=' + CACHE_VER;
    var pad = fullBleed ? '0' : '6px 8px';
    return {
      type: 'img',
      html: '<img src="' + media + '" alt="' + esc(alt) + '" style="position:absolute;inset:0;width:100%;height:100%;object-fit:contain;padding:' + pad + ';box-sizing:border-box;" loading="eager" decoding="async">'
    };
  }

  function render(columnId, fallbackRef) {
    var clip = clipForColumn(columnId, fallbackRef);
    if (!clip) return '';
    var frame = 'position:relative;margin-top:4px;width:100%;max-width:320px;margin-left:auto;margin-right:auto;border-radius:12px;overflow:hidden;border:1px solid rgba(91,33,182,0.2);';
    var media = mediaForClip(clip, fallbackRef, 'thumb');
    return '<div class="jill-canon-frame" style="' + frame + 'aspect-ratio:320/180;' + frameStyle() + '">'
      + media.html
      + '</div>';
  }

  function renderStage(columnId, fallbackRef) {
    var clip = clipForColumn(columnId, fallbackRef);
    if (!clip) return '';
    var media = mediaForClip(clip, fallbackRef, 'stage');
    // Full-bleed board only ù no title bar / no transcript overlay
    return '<div class="jill-canon-stage-frame" style="position:relative;width:100%;height:100%;min-height:280px;border-radius:16px;overflow:hidden;border:2px solid rgba(167,139,250,0.35);' + frameStyle() + '">'
      + media.html
      + '</div>';
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
    renderStage: renderStage,
    assetUrl: assetUrl,
    setGif: setGif,
    DEFAULT_BG: DEFAULT_BG
  };
})(typeof window !== 'undefined' ? window : globalThis);
