import fs from 'fs';

const ALICE = `function aliceArmTtsWatchdog(textLen){
  if(typeof armTtsPlaybackWatchdog === 'function'){
    armTtsPlaybackWatchdog({
      textLen: textLen,
      clearTimer: function(){ clearTimeout(_aliceTtsWatchdog); },
      setTimer: function(fn, delay){ clearTimeout(_aliceTtsWatchdog); _aliceTtsWatchdog = setTimeout(fn, delay); },
      getBusy: function(){ return _aliceTTSBusy; },
      setBusy: function(v){ _aliceTTSBusy = !!v; },
      getAudio: function(){ return window._aliceAudio; },
      setAudio: function(a){ window._aliceAudio = a; },
      onAdvance: function(){ _aliceTTSFlush(); }
    });
    return;
  }
  clearTimeout(_aliceTtsWatchdog);
  var ms = typeof ttsWatchdogMs === 'function' ? ttsWatchdogMs(textLen) : 120000;
  var stallChecks = 0;
  var t0 = Date.now();
  function tick(){
    if(!_aliceTTSBusy) return;
    var a = window._aliceAudio;
    var elapsed = Date.now() - t0;
    if(!a){ if(elapsed < ms){ _aliceTtsWatchdog = setTimeout(tick, 1000); return; } _aliceTTSBusy = false; _aliceTTSFlush(); return; }
    if(!a.ended && a.paused && a.currentTime > 0.02 && stallChecks < 16){ stallChecks++; try{ var p=a.play(); if(p&&p.catch)p.catch(function(){}); }catch(e){} _aliceTtsWatchdog=setTimeout(tick,900); return; }
    if(!a.ended && !a.paused){ var dur=Number(a.duration)||0; var cur=Number(a.currentTime)||0; var leftMs=dur>0&&isFinite(dur)?Math.max(4000,Math.ceil((dur-cur)*1000)+5000):Math.max(8000,ms-elapsed); _aliceTtsWatchdog=setTimeout(tick,Math.min(leftMs,25000)); return; }
    if(a.ended||elapsed>=ms){ _aliceTTSBusy=false; if(window._aliceAudio){try{window._aliceAudio.pause();}catch(e){}} window._aliceAudio=null; _aliceTTSFlush(); return; }
    _aliceTtsWatchdog=setTimeout(tick,1000);
  }
  _aliceTtsWatchdog=setTimeout(tick,3000);
}`;

const JILL = `function jillArmTtsWatchdog(textLen){
  if(typeof armTtsPlaybackWatchdog === 'function'){
    armTtsPlaybackWatchdog({
      textLen: textLen,
      clearTimer: function(){ clearTimeout(_jillTtsWatchdog); },
      setTimer: function(fn, delay){ clearTimeout(_jillTtsWatchdog); _jillTtsWatchdog = setTimeout(fn, delay); },
      getBusy: function(){ return _jillTTSBusy; },
      setBusy: function(v){ _jillTTSBusy = !!v; },
      getAudio: function(){ return _jillState.audio; },
      setAudio: function(a){ _jillState.audio = a; },
      onAdvance: function(){ _jillState.speaking = _jillTTSQueue.length > 0; _jillTTSFlush(); }
    });
    return;
  }
  clearTimeout(_jillTtsWatchdog);
  var ms = typeof ttsWatchdogMs === 'function' ? ttsWatchdogMs(textLen) : 120000;
  var stallChecks = 0;
  var t0 = Date.now();
  function tick(){
    if(!_jillTTSBusy) return;
    var a = _jillState.audio;
    var elapsed = Date.now() - t0;
    if(!a){ if(elapsed < ms){ _jillTtsWatchdog = setTimeout(tick, 1000); return; } _jillTTSBusy = false; _jillState.speaking = _jillTTSQueue.length > 0; _jillTTSFlush(); return; }
    if(!a.ended && a.paused && a.currentTime > 0.02 && stallChecks < 16){ stallChecks++; try{ var p=a.play(); if(p&&p.catch)p.catch(function(){}); }catch(e){} _jillTtsWatchdog=setTimeout(tick,900); return; }
    if(!a.ended && !a.paused){ var dur=Number(a.duration)||0; var cur=Number(a.currentTime)||0; var leftMs=dur>0&&isFinite(dur)?Math.max(4000,Math.ceil((dur-cur)*1000)+5000):Math.max(8000,ms-elapsed); _jillTtsWatchdog=setTimeout(tick,Math.min(leftMs,25000)); return; }
    if(a.ended||elapsed>=ms){ _jillTTSBusy=false; if(_jillState.audio){try{_jillState.audio.pause();}catch(e){}} _jillState.audio=null; _jillState.speaking=_jillTTSQueue.length>0; _jillTTSFlush(); return; }
    _jillTtsWatchdog=setTimeout(tick,1000);
  }
  _jillTtsWatchdog=setTimeout(tick,3000);
}`;

const NEXORA = `function nexoraArmTtsWatchdog(textLen){
  if(typeof armTtsPlaybackWatchdog === 'function'){
    armTtsPlaybackWatchdog({
      textLen: textLen,
      clearTimer: function(){ clearTimeout(_nxTtsWatchdog); },
      setTimer: function(fn, delay){ clearTimeout(_nxTtsWatchdog); _nxTtsWatchdog = setTimeout(fn, delay); },
      getBusy: function(){ return _nxTTSBusy; },
      setBusy: function(v){ _nxTTSBusy = !!v; },
      getAudio: function(){ return window._nxAudio; },
      setAudio: function(a){ window._nxAudio = a; },
      onAdvance: function(){ _nxPlayingChunk = null; if(typeof _nxTTSFlushPortal === 'function') _nxTTSFlushPortal(); }
    });
    return;
  }
  clearTimeout(_nxTtsWatchdog);
  var ms = typeof ttsWatchdogMs === 'function' ? ttsWatchdogMs(textLen) : 120000;
  _nxTtsWatchdog = setTimeout(function(){
    if(!_nxTTSBusy) return;
    _nxTTSBusy = false;
    if(window._nxAudio){ try{ window._nxAudio.pause(); }catch(e){} window._nxAudio = null; }
    _nxPlayingChunk = null;
    if(typeof _nxTTSFlushPortal === 'function') _nxTTSFlushPortal();
  }, ms);
}`;

function replaceFn(html, name, body) {
  const start = html.indexOf('function ' + name + '(');
  if (start < 0) {
    console.log('missing', name);
    return html;
  }
  let i = start + 10;
  let depth = 0;
  let began = false;
  let end = -1;
  for (; i < html.length; i++) {
    if (html[i] === '{') {
      depth++;
      began = true;
    } else if (html[i] === '}') {
      depth--;
      if (began && depth === 0) {
        end = i + 1;
        break;
      }
    }
  }
  return html.slice(0, start) + body + html.slice(end);
}

function bump(html) {
  return html
    .replace(/tts-chunks\.js\?v=[^"']+/g, 'tts-chunks.js?v=20260811nocut')
    .replace(/ptt-mic\.js\?v=[^"']+/g, 'ptt-mic.js?v=20260811nocut');
}

const paths = [
  'C:/Users/ARMANDO/Projects/Operarive-Training-Database/index.html',
  'C:/Users/ARMANDO/Projects/Database-clone/Infinity_Student_Portal.html',
  'C:/Users/ARMANDO/Projects/Database-clone/kamuk/index.html'
];

for (const p of paths) {
  let t = fs.readFileSync(p, 'utf8');
  t = replaceFn(t, 'aliceArmTtsWatchdog', ALICE);
  t = replaceFn(t, 'jillArmTtsWatchdog', JILL);
  t = replaceFn(t, 'nexoraArmTtsWatchdog', NEXORA);
  t = bump(t);
  fs.writeFileSync(p, t);
  console.log(p, {
    shared: t.includes('armTtsPlaybackWatchdog'),
    bump: (t.match(/20260811nocut/g) || []).length
  });
}
