/**
 * Infinity Holdings · Nexora live channels
 * Human-like email / chat / call queue on the same CRM skeleton.
 * Chat: typing, presence, turn-taking. Call: Nexora ElevenLabs accent profiles.
 */
(function (global) {
  'use strict';

  var ETHNICITIES = ['american', 'british', 'indian', 'german', 'russian', 'chinese', 'latino'];

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function sleep(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, ms); });
  }

  function clamp(n, a, b) {
    return Math.max(a, Math.min(b, n));
  }

  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function normalizeChannel(raw) {
    var c = String(raw || '').toLowerCase();
    if (c === 'phone' || c === 'call' || c === 'voice') return 'call';
    if (c === 'chat' || c === 'im' || c === 'messaging') return 'chat';
    return 'email';
  }

  function skillsToChannels(skills) {
    var out = [];
    (skills || ['email', 'phone', 'chat']).forEach(function (s) {
      var ch = normalizeChannel(s === 'phone' ? 'call' : s);
      if (out.indexOf(ch) < 0) out.push(ch);
    });
    return out.length ? out : ['email', 'chat', 'call'];
  }

  function assignChannels(cases, skills) {
    var channels = skillsToChannels(skills);
    return (cases || []).map(function (c, i) {
      var forced = c.preferredChannel || c.channel;
      return Object.assign({}, c, {
        channel: normalizeChannel(forced || channels[i % channels.length])
      });
    });
  }

  function humanDelayForText(text) {
    var words = String(text || '').trim().split(/\s+/).filter(Boolean).length;
    var base = 700 + words * (90 + Math.random() * 50);
    return clamp(base, 900, 6500);
  }

  function splitHumanBubbles(text) {
    var t = String(text || '').trim();
    if (t.length < 90) return [t];
    var parts = t.split(/(?<=[.!?])\s+/);
    if (parts.length < 2) return [t];
    var bubbles = [];
    var buf = '';
    parts.forEach(function (p) {
      if ((buf + ' ' + p).trim().length > 110 && buf) {
        bubbles.push(buf.trim());
        buf = p;
      } else {
        buf = (buf + ' ' + p).trim();
      }
    });
    if (buf) bubbles.push(buf);
    return bubbles.slice(0, 3);
  }

  function pickPersona(client) {
    var eth = pick(ETHNICITIES);
    var gender = Math.random() > 0.45 ? 'female' : 'male';
    var name = (client && client.name) || 'Client';
    var profile = {
      name: name,
      gender: gender,
      ethnicity: eth,
      voiceAccent: eth === 'latino'
        ? (gender === 'female' ? 'Latina Female' : 'Latino Male')
        : (eth.charAt(0).toUpperCase() + eth.slice(1) + ' ' + (gender === 'female' ? 'Female' : 'Male')),
      voiceId: ''
    };
    try {
      if (typeof ensureNexoraClientVoice === 'function') ensureNexoraClientVoice(profile);
      else if (typeof pickNexoraVoiceForProfile === 'function') {
        var v = pickNexoraVoiceForProfile(profile);
        if (v) { profile.voiceId = v.id; profile.voiceAccent = v.accent || profile.voiceAccent; }
      }
    } catch (e) { /* keep label */ }
    return profile;
  }

  function localClientReply(ctx) {
    var agent = String(ctx.agentText || '').toLowerCase();
    var c = ctx.caseItem || {};
    var good = /\b(understand|i hear|thank you for|you mentioned|just to make sure)\b/.test(agent)
      && /\b(i will|i am going to)\b/.test(agent)
      && /\b(today|tomorrow|a\.m\.|p\.m\.|\d{1,2}:\d{2}|business day)\b/.test(agent);
    var askedPin = /\bpin\b/.test(agent) && !/never|cannot|won't|will not/.test(agent);
    if (askedPin) {
      return {
        mood: 'furious',
        bubbles: [
          'Why are you asking for my PIN on this chat?',
          'That is not okay. I need a supervisor or a safe next step — with a time.'
        ]
      };
    }
    if (good) {
      return {
        mood: 'calming',
        bubbles: [
          'Okay… that is clearer. Thank you for actually saying what you will do.',
          'I will wait for that update. Please do not miss the time you just gave me.'
        ]
      };
    }
    if (/\b(sorry|apolog)/.test(agent) && !/\b(i will|reviewed|escalated)\b/.test(agent)) {
      return {
        mood: 'impatient',
        bubbles: [
          'I do not need more sorry. I need ownership.',
          'What did you check in the system, and when do I hear back?'
        ]
      };
    }
    var impact = c.clientStatement || c.title || 'this issue';
    return {
      mood: 'frustrated',
      bubbles: [
        'I am still stuck with this: ' + String(impact).slice(0, 120),
        'Can you confirm what you see on my account and give me a real next step with a time?'
      ]
    };
  }

  function createChatSession(opts) {
    opts = opts || {};
    var state = {
      caseItem: opts.caseItem,
      client: opts.caseItem && opts.caseItem.client,
      persona: opts.persona || pickPersona(opts.caseItem && opts.caseItem.client),
      turns: [],
      mood: (opts.caseItem && opts.caseItem.mood) || 'frustrated',
      presence: 'online',
      typing: false,
      waitingForAgent: false,
      closed: false,
      nudgeTimer: null
    };

    function render() {
      if (typeof opts.onRender === 'function') opts.onRender(state);
    }

    function push(role, text, meta) {
      state.turns.push({
        role: role,
        text: text,
        at: new Date().toISOString(),
        meta: meta || {}
      });
      render();
    }

    async function clientSpeak(bubbles) {
      if (state.closed) return;
      state.presence = 'online';
      for (var i = 0; i < bubbles.length; i++) {
        state.typing = true;
        render();
        await sleep(humanDelayForText(bubbles[i]));
        if (state.closed) return;
        state.typing = false;
        push('client', bubbles[i]);
        if (i < bubbles.length - 1) await sleep(400 + Math.random() * 700);
      }
      state.waitingForAgent = true;
      scheduleNudge();
      render();
    }

    function scheduleNudge() {
      if (state.nudgeTimer) clearTimeout(state.nudgeTimer);
      state.nudgeTimer = setTimeout(function () {
        if (state.closed || !state.waitingForAgent) return;
        state.presence = 'online';
        push('system', 'Client is still online and waiting for your reply…');
        clientSpeak(['Are you still there? I need an update on this.']);
      }, 42000 + Math.random() * 12000);
    }

    async function open() {
      push('system', 'Secure chat connected · ' + (state.persona.voiceAccent || 'Client') + ' · recorded for QA');
      await sleep(600 + Math.random() * 500);
      var opening = (state.caseItem && state.caseItem.clientStatement)
        || 'Hi — I need help with my account today. This is urgent.';
      await clientSpeak(splitHumanBubbles(opening));
    }

    async function agentReply(text) {
      var spoken = String(text || '').trim();
      if (!spoken || state.closed) return;
      if (state.nudgeTimer) clearTimeout(state.nudgeTimer);
      state.waitingForAgent = false;
      push('agent', spoken);
      state.presence = 'online';
      render();
      await sleep(500 + Math.random() * 400);
      state.typing = true;
      render();
      await sleep(700 + Math.random() * 600);
      var reply = localClientReply({ agentText: spoken, caseItem: state.caseItem });
      state.mood = reply.mood;
      state.typing = false;
      await clientSpeak(reply.bubbles);
      if (typeof opts.onTurn === 'function') opts.onTurn(state, spoken, reply);
    }

    function close() {
      state.closed = true;
      state.typing = false;
      if (state.nudgeTimer) clearTimeout(state.nudgeTimer);
      push('system', 'Chat ended');
      render();
    }

    return {
      state: state,
      open: open,
      agentReply: agentReply,
      close: close,
      render: render
    };
  }

  function attachToDesk(api) {
    if (!api || !api.state || !api.state.nexoraPractice) return null;
    var state = api.state;
    var live = { chat: null, personaByCase: {} };

    function ensurePersona(caseItem) {
      var id = caseItem && caseItem.id;
      if (!id) return pickPersona(caseItem && caseItem.client);
      if (!live.personaByCase[id]) live.personaByCase[id] = pickPersona(caseItem.client);
      return live.personaByCase[id];
    }

    function openChatForCase(caseItem) {
      var root = document.getElementById('chat-console');
      var thread = document.getElementById('chat-thread');
      var nameEl = document.getElementById('chat-client-name');
      var presenceEl = document.getElementById('chat-presence');
      var moodEl = document.getElementById('chat-mood');
      var accentEl = document.getElementById('chat-accent');
      if (!root || !thread) return;
      var persona = ensurePersona(caseItem);
      if (nameEl) nameEl.textContent = (caseItem.client && caseItem.client.name) || 'Client';
      if (accentEl) accentEl.textContent = persona.voiceAccent || '';
      if (live.chat) live.chat.close();
      live.chat = createChatSession({
        caseItem: caseItem,
        persona: persona,
        onRender: function (s) {
          if (presenceEl) {
            presenceEl.textContent = s.typing ? 'typing…' : (s.presence === 'online' ? 'online' : s.presence);
            presenceEl.className = 'chat-presence' + (s.typing ? ' typing' : ' online');
          }
          if (moodEl) moodEl.textContent = s.mood || '—';
          thread.innerHTML = s.turns.map(function (t) {
            if (t.role === 'system') return '<div class="chat-sys">' + esc(t.text) + '</div>';
            var who = t.role === 'client' ? 'client' : 'agent';
            return '<div class="chat-bubble ' + who + '"><div class="chat-meta">'
              + (who === 'client' ? esc((caseItem.client && caseItem.client.name) || 'Client') : 'You')
              + '</div><div class="chat-text">' + esc(t.text) + '</div></div>';
          }).join('') + (s.typing ? '<div class="chat-bubble client typing"><span></span><span></span><span></span></div>' : '');
          thread.scrollTop = thread.scrollHeight;
        },
        onTurn: function (s, agentText) {
          if (typeof api.recordAction === 'function') {
            api.recordAction('chat-turn', 'Chat reply sent', agentText.slice(0, 120));
          }
        }
      });
      root.classList.add('open');
      live.chat.open();
    }

    function seedInboundEmail(caseItem) {
      if (!state.profile) return;
      if (!Array.isArray(state.profile.emails)) state.profile.emails = [];
      var body = caseItem.clientStatement || caseItem.brief || 'I need help with my account.';
      var inbound = {
        id: 'NX-IN-' + Date.now(),
        direction: 'inbound',
        from: (caseItem.client && caseItem.client.email) || 'client@example.com',
        to: 'desk@infinityholdings.com',
        date: new Date().toLocaleString('en-US'),
        subject: caseItem.title || 'Urgent account issue',
        body: body,
        preview: String(body).slice(0, 160)
      };
      if (!state.profile.emails.some(function (e) { return e.direction === 'inbound' && e.subject === inbound.subject; })) {
        state.profile.emails.unshift(inbound);
      }
      if (typeof api.renderEmails === 'function') api.renderEmails();
    }

    function startChannelAfterAccept(caseItem) {
      var ch = normalizeChannel(caseItem.channel);
      if (ch === 'chat') {
        openChatForCase(caseItem);
        if (typeof api.toast === 'function') api.toast('Live chat connected — wait for the client, then reply naturally.');
        return;
      }
      if (ch === 'call') {
        var persona = ensurePersona(caseItem);
        if (typeof api.toast === 'function') {
          api.toast('Inbound call · voice: ' + (persona.voiceAccent || 'Nexora profile'));
        }
        setTimeout(function () {
          if (window.KamukHoldingsCall && typeof window.KamukHoldingsCall.setPreferredVoice === 'function') {
            window.KamukHoldingsCall.setPreferredVoice(persona);
          }
          var btn = document.getElementById('btn-call');
          if (btn) btn.click();
        }, 450);
        return;
      }
      if (typeof api.showTab === 'function') api.showTab('emails');
      setTimeout(function () {
        seedInboundEmail(caseItem);
        var compose = document.getElementById('email-compose');
        if (compose) compose.click();
        if (typeof api.toast === 'function') api.toast('Email queue — reply with Formato E. Client is waiting.');
      }, 300);
    }

    setTimeout(function () {
      var send = document.getElementById('chat-send');
      var box = document.getElementById('chat-reply-txt');
      var hang = document.getElementById('chat-end');
      if (send && box && !send.dataset.nxBound) {
        send.dataset.nxBound = '1';
        send.addEventListener('click', function () {
          if (!live.chat) return;
          var text = box.value;
          box.value = '';
          live.chat.agentReply(text);
        });
        box.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            send.click();
          }
        });
      }
      if (hang && !hang.dataset.nxBound) {
        hang.dataset.nxBound = '1';
        hang.addEventListener('click', function () {
          if (live.chat) live.chat.close();
          var root = document.getElementById('chat-console');
          if (root) root.classList.remove('open');
        });
      }
      document.querySelectorAll('[data-close="chat-console"]').forEach(function (btn) {
        if (btn.dataset.nxBound) return;
        btn.dataset.nxBound = '1';
        btn.addEventListener('click', function () {
          if (live.chat) live.chat.close();
          var root = document.getElementById('chat-console');
          if (root) root.classList.remove('open');
        });
      });
    }, 0);

    return {
      live: live,
      startChannelAfterAccept: startChannelAfterAccept,
      openChatForCase: openChatForCase,
      ensurePersona: ensurePersona
    };
  }

  global.InfinityHoldingsNexoraLive = {
    assignChannels: assignChannels,
    skillsToChannels: skillsToChannels,
    createChatSession: createChatSession,
    pickPersona: pickPersona,
    attachToDesk: attachToDesk,
    humanDelayForText: humanDelayForText
  };
})(typeof window !== 'undefined' ? window : globalThis);
